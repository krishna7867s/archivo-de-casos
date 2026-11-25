import { DatabaseSync } from 'node:sqlite';
import { argon2, createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import express from 'express';
import helmet from 'helmet';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const derive = promisify(argon2);
const passwordOptions = { memory: 19456, passes: 2, parallelism: 1, tagLength: 32 };
const token = () => randomBytes(32).toString('base64url');
const digest = (value) => createHash('sha256').update(value).digest('hex');

async function hashPassword(password, salt = randomBytes(16)) {
  const hash = await derive('argon2id', { ...passwordOptions, message: password, nonce: salt });
  return ['$argon2id$v=19$m=19456,t=2,p=1', salt.toString('base64'), hash.toString('base64')].join('$');
}

async function verifyPassword(password, stored) {
  const salt = Buffer.from(stored.split('$')[4], 'base64');
  return timingSafeEqual(Buffer.from(stored), Buffer.from(await hashPassword(password, salt)));
}

const emailSchema = z.string().trim().pipe(z.email().max(254)).transform((value) => value.toLowerCase());
const passwordSchema = z.string().min(12).max(128)
  .regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^a-zA-Z0-9]/);
const registerSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(2).max(100),
  password: passwordSchema,
  phone: z.string().trim().max(32)
    .transform((value) => value.replace(/[ ()-]/g, ''))
    .pipe(z.string().regex(/^\+?[0-9]{8,15}$/)),
});
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });
const noteSchema = z.object({ title: z.string().trim().min(1).max(120), body: z.string().trim().min(1).max(8000) });
const resetSchema = z.object({ token: z.string().regex(/^[\w-]{43}$/), password: passwordSchema });
const roleSchema = z.object({ role: z.enum(['usuario', 'administrador']) });

class RequestError extends Error {
  constructor(status, message, retryAfter) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function validate(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) throw new RequestError(400, 'Revisá los datos del formulario.');
  return result.data;
}

export async function drawTalent() {
  const key = process.env.SUPABASE_SERVER_KEY;
  if (!key) throw new RequestError(503, 'El sorteo no está disponible. Volvé a intentar más tarde.');
  const headers = { apikey: key, 'Content-Type': 'application/json' };
  if (key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + key;
  const response = await fetch('https://iaburcfczgxxyqpttqrz.supabase.co/rest/v1/rpc/sortear_talento_definitivo', {
    method: 'POST',
    headers,
    body: '{}',
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new RequestError(503, 'El sorteo no está disponible. Volvé a intentar más tarde.');
  const result = await response.json();
  const talent = Array.isArray(result) ? result[0] : result;
  if (!talent?.talento_id || typeof talent.nombre !== 'string' || !talent.nombre) {
    throw new RequestError(503, 'El sorteo no devolvió un talento.');
  }
  return talent;
}

export async function createVault({ filename, key, origin, allowedOrigins = [origin], production = false, sort = drawTalent, deliverReset, proxy = false, log = console.log }) {
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error('Configurá una llave de 32 bytes.');
  if (production && new URL(origin).protocol !== 'https:') throw new Error('Configurá el origen HTTPS.');
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 2000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      password TEXT NOT NULL, phone TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'usuario'
        CHECK(role IN ('usuario', 'administrador')), talent_id TEXT NOT NULL, talent TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      hash TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES users(id), encrypted TEXT NOT NULL,
      updated INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS notes_owner ON notes(owner, updated);
    CREATE TABLE IF NOT EXISTS resets (
      hash TEXT PRIMARY KEY, owner TEXT NOT NULL UNIQUE REFERENCES users(id), expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY, type TEXT NOT NULL, actor TEXT, time INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS limits (
      bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL
    );
  `);
  const run = (statement, ...values) => db.prepare(statement).run(...values);
  const get = (statement, ...values) => db.prepare(statement).get(...values);
  const all = (statement, ...values) => db.prepare(statement).all(...values);
  const dummyPassword = await hashPassword(token());

  function transaction(callback) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = callback();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  function encrypt(value, context) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from(context));
    const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
  }

  function decrypt(value, context) {
    const bytes = Buffer.from(value, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
    decipher.setAAD(Buffer.from(context));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8');
  }

  function event(type, actor = null) {
    const time = Date.now();
    run('INSERT INTO events(type, actor, time) VALUES (?, ?, ?)', type, actor, time);
    log(JSON.stringify({ type, actor, time }));
  }

  function limit(bucket, maximum, duration, alert = false) {
    const now = Date.now();
    run('DELETE FROM limits WHERE expires <= ?', now);
    const row = get(`INSERT INTO limits(bucket,count,expires) VALUES (?,1,?)
      ON CONFLICT(bucket) DO UPDATE SET count = MIN(count + 1, ?) RETURNING count, expires`,
      bucket, now + duration, maximum + 2);
    if (row.count > maximum) {
      if (alert && row.count === maximum + 1) event('alerta_login');
      const seconds = Math.max(1, Math.ceil((row.expires - now) / 1000));
      const minutes = Math.ceil(seconds / 60);
      throw new RequestError(429, `Demasiados intentos. Volvé a intentar en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`, seconds);
    }
  }

  const app = express();
  app.disable('x-powered-by');
  if (proxy) app.set('trust proxy', 1);
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: production ? undefined : false,
    contentSecurityPolicy: { directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'", 'https://iaburcfczgxxyqpttqrz.supabase.co'],
      upgradeInsecureRequests: production ? [] : null,
    } },
  }));
  app.use((req, res, next) => {
    if (production && !req.secure) return res.redirect(308, new URL(req.originalUrl.replace(/^\/+/, '/'), origin).href);
    next();
  });
  app.get('/health', (_req, res) => {
    get('SELECT 1');
    res.json({ status: 'ok' });
  });
  const api = express.Router();
  app.use('/api', api);
  const trustedOrigins = new Set(allowedOrigins);
  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(req.method) && !trustedOrigins.has(req.get('origin'))) {
      return next(new RequestError(403, 'Origen no permitido.'));
    }
    next();
  });
  api.use(express.json({ limit: '56kb' }));

  const cookieName = production ? '__Host-vault' : 'vault';
  const cookieOptions = { httpOnly: true, secure: production, sameSite: 'strict', path: '/' };
  function sessionHash(req) {
    const value = req.headers.cookie?.split(/;\s*/).find((item) => item.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
    return value && /^[\w-]{43}$/.test(value) ? digest(value) : null;
  }

  function profile(user) {
    return {
      id: user.id, name: user.name, email: user.email, role: user.role, talent: user.talent,
      phone: '•••• ' + decrypt(user.phone, 'phone:' + user.id).slice(-4),
    };
  }

  function startSession(req, res, user) {
    const data = profile(user);
    const secret = token();
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000;
    transaction(() => {
      run('DELETE FROM sessions WHERE expires <= ? OR hash = ?', now, sessionHash(req));
      run('INSERT INTO sessions VALUES (?, ?, ?)', digest(secret), user.id, now + maxAge);
      event('login_exitoso', user.id);
    });
    res.cookie(cookieName, secret, { ...cookieOptions, maxAge });
    return data;
  }

  api.post('/register', async (req, res) => {
    const registration = registerSchema.safeParse(req.body);
    if (!registration.success) {
      const messages = {
        email: 'Ingresá un correo válido.',
        name: 'Ingresá un nombre de entre 2 y 100 caracteres.',
        password: 'Usá entre 12 y 128 caracteres, con mayúscula, minúscula, número y símbolo.',
        phone: 'Ingresá un teléfono de 8 a 15 dígitos. Podés usar guiones, espacios o el prefijo +.',
      };
      const field = registration.error.issues[0]?.path[0];
      throw new RequestError(400, Object.hasOwn(messages, field) ? messages[field] : 'Revisá los datos del formulario.');
    }
    const data = registration.data;
    limit('register-valid:' + req.ip, 8, 600000);
    const existing = get('SELECT * FROM users WHERE email = ?', data.email);
    if (existing) {
      if (!await verifyPassword(data.password, existing.password)) throw new RequestError(409, 'No se pudo registrar la cuenta.');
      return res.json({ profile: startSession(req, res, existing), created: false });
    }
    const password = await hashPassword(data.password);
    const talent = await sort();
    const id = randomUUID();
    const saved = run(`INSERT INTO users(id,email,name,password,phone,talent_id,talent)
      VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING`,
      id, data.email, data.name, password, encrypt(data.phone, 'phone:' + id), String(talent.talento_id), talent.nombre);
    const user = get('SELECT * FROM users WHERE email = ?', data.email);
    if (!saved.changes && !await verifyPassword(data.password, user.password)) throw new RequestError(409, 'No se pudo registrar la cuenta.');
    res.status(saved.changes ? 201 : 200).json({ profile: startSession(req, res, user), created: Boolean(saved.changes) });
  });

  api.post('/login', async (req, res) => {
    const data = validate(loginSchema, req.body);
    const bucket = 'login:' + digest(data.email);
    limit('ip:' + req.ip, 30, 600000, true);
    limit(bucket, 5, 600000, true);
    const user = get('SELECT * FROM users WHERE email = ?', data.email);
    const valid = await verifyPassword(data.password, user?.password || dummyPassword);
    if (!user || !valid) {
      event('login_fallido', user?.id);
      throw new RequestError(401, 'Correo o contraseña incorrectos.');
    }
    run('DELETE FROM limits WHERE bucket = ?', bucket);
    res.json({ profile: startSession(req, res, user) });
  });

  api.post('/recover', async (req, res) => {
    limit('recover:' + req.ip, 5, 600000);
    const email = validate(emailSchema, req.body?.email);
    const user = get('SELECT id FROM users WHERE email = ?', email);
    if (!deliverReset) throw new RequestError(503, 'La recuperación por correo todavía no está disponible.');
    if (user) {
      const secret = token();
      run('DELETE FROM resets WHERE expires <= ?', Date.now());
      run(`INSERT INTO resets VALUES (?, ?, ?) ON CONFLICT(owner)
        DO UPDATE SET hash = excluded.hash, expires = excluded.expires`, digest(secret), user.id, Date.now() + 900000);
      const url = new URL(origin);
      url.hash = 'recuperar=' + secret;
      Promise.resolve().then(() => deliverReset(email, url.href)).catch(() => {
        event('error_entrega_recuperacion', user.id);
      });
    }
    res.status(202).json({ ok: true });
  });

  api.post('/reset', async (req, res) => {
    limit('reset:' + req.ip, 10, 600000);
    const data = validate(resetSchema, req.body);
    const hash = digest(data.token);
    const invalid = () => new RequestError(400, 'El enlace venció o ya fue utilizado.');
    if (!get('SELECT owner FROM resets WHERE hash = ? AND expires > ?', hash, Date.now())) throw invalid();
    const password = await hashPassword(data.password);
    transaction(() => {
      const record = get('DELETE FROM resets WHERE hash = ? AND expires > ? RETURNING owner', hash, Date.now());
      if (!record) throw invalid();
      run('UPDATE users SET password = ? WHERE id = ?', password, record.owner);
      run('DELETE FROM sessions WHERE owner = ?', record.owner);
      event('password_actualizada', record.owner);
    });
    res.clearCookie(cookieName, cookieOptions).json({ ok: true });
  });

  api.use((req, _res, next) => {
    req.user = get(`SELECT users.* FROM sessions JOIN users ON sessions.owner = users.id
      WHERE sessions.hash = ? AND sessions.expires > ?`, sessionHash(req), Date.now());
    if (!req.user) return next(new RequestError(401, 'Iniciá sesión para continuar.'));
    next();
  });

  api.get('/profile', (req, res) => res.json({ profile: profile(req.user) }));
  api.post('/logout', (req, res) => {
    run('DELETE FROM sessions WHERE hash = ?', sessionHash(req));
    res.clearCookie(cookieName, cookieOptions).json({ ok: true });
  });
  api.get('/notes', (req, res) => {
    const notes = all('SELECT id, encrypted, updated FROM notes WHERE owner = ? ORDER BY updated DESC', req.user.id)
      .map(({ id, encrypted, updated }) => ({
        id, updated, ...JSON.parse(decrypt(encrypted, 'note:' + req.user.id + ':' + id)),
      }));
    res.json({ notes });
  });
  api.post('/notes', (req, res) => {
    const note = validate(noteSchema, req.body);
    const id = randomUUID();
    const updated = Date.now();
    const encrypted = encrypt(JSON.stringify(note), 'note:' + req.user.id + ':' + id);
    const inserted = run(`INSERT INTO notes SELECT ?, ?, ?, ? WHERE
      (SELECT count(*) FROM notes WHERE owner = ?) < 100`, id, req.user.id, encrypted, updated, req.user.id);
    if (!inserted.changes) throw new RequestError(409, 'Alcanzaste el límite de 100 notas.');
    res.status(201).json({ id, updated, ...note });
  });
  function assertOwner(result, user) {
    if (result.changes) return;
    event('acceso_denegado', user.id);
    throw new RequestError(404, 'No se encontró la nota.');
  }
  api.put('/notes/:id', (req, res) => {
    const note = validate(noteSchema, req.body);
    const { id } = req.params;
    const updated = Date.now();
    const encrypted = encrypt(JSON.stringify(note), 'note:' + req.user.id + ':' + id);
    assertOwner(run('UPDATE notes SET encrypted = ?, updated = ? WHERE id = ? AND owner = ?',
      encrypted, updated, id, req.user.id), req.user);
    res.json({ id, updated, ...note });
  });
  api.delete('/notes/:id', (req, res) => {
    assertOwner(run('DELETE FROM notes WHERE id = ? AND owner = ?', req.params.id, req.user.id), req.user);
    res.json({ ok: true });
  });
  api.use('/admin', (req, _res, next) => {
    if (req.user.role === 'administrador') return next();
    event('acceso_denegado', req.user.id);
    next(new RequestError(403, 'Acceso reservado a Dirección.'));
  });
  api.get('/admin/users', (req, res) => {
    const term = typeof req.query.q === 'string' ? req.query.q.slice(0, 100) : '';
    res.json({ users: all(`SELECT id,name,email,role,talent FROM users
      WHERE instr(lower(name),lower(?)) > 0 OR instr(lower(email),lower(?)) > 0 OR ? = ''
      ORDER BY name LIMIT 200`, term, term, term) });
  });
  api.get('/admin/events', (req, res) => {
    const type = typeof req.query.type === 'string' ? req.query.type : '';
    const since = Number(req.query.since) || 0;
    res.json({ events: all(`SELECT id,type,actor,time FROM events WHERE time >= ?
      AND (type = ? OR ? = '') ORDER BY id DESC LIMIT 200`, since, type, type) });
  });
  api.patch('/admin/users/:id/role', (req, res) => {
    const { role } = validate(roleSchema, req.body);
    const { id } = req.params;
    if (id === req.user.id) throw new RequestError(409, 'El rol de tu propia cuenta se cambia desde otra cuenta de Dirección.');
    transaction(() => {
      const result = run('UPDATE users SET role = ? WHERE id = ?', role, id);
      if (!result.changes) throw new RequestError(404, 'No se encontró la cuenta.');
      run('DELETE FROM sessions WHERE owner = ?', id);
      event('cambio_rol', req.user.id);
    });
    res.json({ ok: true });
  });
  api.use((_req, _res, next) => next(new RequestError(404, 'Ruta no disponible.')));

  const handleError = (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof RequestError) {
      if (error.retryAfter) res.set('Retry-After', String(error.retryAfter));
      return res.status(error.status).json({ error: error.message });
    }
    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
      return res.status(error.status).json({ error: 'Solicitud inválida.' });
    }
    log(JSON.stringify({ type: 'error_interno', error: error.code || error.name, time: Date.now() }));
    res.status(500).json({ error: 'Ocurrió un error. Probá más tarde.' });
  };
  app.use(handleError);
  return { app, db, handleError, provisionAdmin(email) {
    const user = get('SELECT id FROM users WHERE email = ?', validate(emailSchema, email));
    if (!user) throw new Error('Registrá la cuenta antes de asignarle el rol.');
    transaction(() => {
      run("UPDATE users SET role = 'administrador' WHERE id = ?", user.id);
      run('DELETE FROM sessions WHERE owner = ?', user.id);
      event('cambio_rol', user.id);
    });
  } };
}

export function smtpDelivery(config) {
  if (!config.SMTP_URL || !config.MAIL_FROM) return undefined;
  const mail = nodemailer.createTransport(config.SMTP_URL, {
    requireTLS: true, connectionTimeout: 6000, greetingTimeout: 6000, socketTimeout: 12000,
  });
  return (to, url) => mail.sendMail({
    from: config.MAIL_FROM, to, subject: 'Recuperá tu expediente',
    text: 'El enlace de recuperación vence en 15 minutos. Si solicitaste el cambio, abrí este enlace: ' + url,
  });
}
