import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { createVault } from './vault.mjs';

test('SecureVault: admisión, sesiones, notas, recuperación y Dirección', async (t) => {
  let draws = 0;
  let resetUrl;
  const origin = 'http://localhost:5173';
  const vault = await createVault({
    filename: ':memory:', key: randomBytes(32), origin,
    sort: async () => ({ talento_id: ++draws, nombre: 'Talento de prueba ' + draws }),
    deliverReset: async (_email, url) => { resetUrl = url; },
    log: () => {},
  });
  const server = await new Promise((resolve, reject) => {
    const listener = vault.app.listen(0, '127.0.0.1', () => resolve(listener));
    listener.once('error', reject);
  });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    vault.db.close();
  });

  async function call(path, { status = 200, method = 'GET', body, cookie } = {}) {
    const response = await fetch('http://127.0.0.1:' + server.address().port + path, {
      method, headers: { origin, ...(body && { 'Content-Type': 'application/json' }), ...(cookie && { cookie }) },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    assert.equal(response.status, status, path + ': ' + JSON.stringify(data));
    return { ...data, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }

  const alice = { name: 'Estudiante A', email: 'alumna@example.test', phone: '+506 8888-1234', password: 'Una-Prueba2026' };
  const bob = { ...alice, name: 'Estudiante B', email: 'alumno@example.test' };
  assert.equal((await call('/health')).status, 'ok');
  for (let attempt = 0; attempt < 9; attempt += 1) {
    const rejected = await call('/api/register', { status: 400, method: 'POST', body: { ...alice, password: 'corta' } });
    assert.match(rejected.error, /mayúscula/);
  }
  const a = await call('/api/register', { status: 201, method: 'POST', body: { ...alice, role: 'administrador' } });
  assert.equal(a.profile.role, 'usuario');
  assert.equal(a.profile.phone, '•••• 1234');
  assert.equal(a.created, true);
  const retry = await call('/api/register', { method: 'POST', body: alice });
  assert.equal(retry.profile.talent, a.profile.talent);
  assert.equal(draws, 1);
  const b = await call('/api/register', { status: 201, method: 'POST', body: bob });
  const note = await call('/api/notes', { status: 201, method: 'POST', cookie: a.cookie, body: { title: 'Nota', body: 'Solo para A' } });
  const row = vault.db.prepare('SELECT password,phone FROM users WHERE id = ?').get(a.profile.id);
  assert.match(row.password, /^\$argon2id\$/);
  assert.notEqual(row.phone, alice.phone);
  assert.ok(!vault.db.prepare('SELECT encrypted FROM notes WHERE id = ?').get(note.id).encrypted.includes(note.body));
  assert.equal((await call('/api/notes', { cookie: b.cookie })).notes.length, 0);
  await call('/api/notes/' + note.id, { method: 'DELETE', status: 404, cookie: b.cookie });
  const edited = await call('/api/notes/' + note.id, { method: 'PUT', cookie: a.cookie, body: { title: 'Editada', body: 'Contenido nuevo' } });
  assert.equal(edited.title, 'Editada');
  await call('/api/notes/' + note.id, { method: 'DELETE', cookie: a.cookie });
  await call('/api/admin/users', { status: 403, cookie: a.cookie });
  vault.provisionAdmin(bob.email);
  await call('/api/profile', { status: 401, cookie: b.cookie });
  const administrator = await call('/api/login', { method: 'POST', body: bob });
  assert.equal((await call('/api/admin/users', { cookie: administrator.cookie })).users.length, 2);
  assert.ok((await call('/api/admin/events', { cookie: administrator.cookie })).events.some((event) => event.type === 'acceso_denegado'));
  await call('/api/logout', { method: 'POST', cookie: a.cookie });
  await call('/api/profile', { status: 401, cookie: a.cookie });
  await call('/api/recover', { status: 202, method: 'POST', body: { email: alice.email } });
  const resetToken = new URLSearchParams(new URL(resetUrl).hash.slice(1)).get('recuperar');
  assert.notEqual(vault.db.prepare('SELECT hash FROM resets').get().hash, resetToken);
  const reset = { token: resetToken, password: 'Nueva-Prueba2026' };
  await call('/api/reset', { method: 'POST', body: reset });
  await call('/api/reset', { method: 'POST', status: 400, body: reset });
  await call('/api/profile', { status: 401, cookie: retry.cookie });
  const returned = await call('/api/login', { method: 'POST', body: { ...alice, password: reset.password } });
  assert.equal(returned.profile.talent, a.profile.talent);
});
