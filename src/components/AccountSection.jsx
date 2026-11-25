import React, { useEffect, useState } from 'react';
import { audioEngine } from '../lib/audioEngine.js';

const roleName = { usuario: 'Estudiante definitivo', administrador: 'Dirección de la Academia' };
const passwordHelp = '12 caracteres como mínimo, con mayúscula, minúscula, número y símbolo.';
const eventTypes = ['login_exitoso', 'login_fallido', 'alerta_login', 'acceso_denegado', 'cambio_rol', 'password_actualizada', 'error_entrega_recuperacion'];

async function request(path, method = 'GET', body, signal) {
  const response = await fetch('/api' + path, {
    method, signal,
    ...(body && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => null);
  if (response.ok && !data) throw new Error('El servidor de cuentas no respondió. Abrí el sitio con el servidor de Archivo de casos.');
  if (!response.ok) {
    const error = new Error(data?.error || 'No se pudo conectar con el archivo privado.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function Administration() {
  const [view, setView] = useState('users');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [since, setSince] = useState('');
  const [result, setResult] = useState({});
  const query = view === 'users' ? new URLSearchParams({ q: search }) :
    new URLSearchParams({ type, since: since ? String(new Date(since + 'T00:00:00').getTime()) : '0' });
  const path = '/admin/' + view + '?' + query;
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    request(path, 'GET', undefined, controller.signal).then(
      (data) => setResult({ path, rows: data[view] }),
      (error) => { if (!controller.signal.aborted) setResult({ path, error: error.message }); }
    );
    return () => controller.abort();
  }, [path, view, retry]);
  const current = result.path === path ? result : {};
  const users = view === 'users';

  return (
    <div className="vault-panel">
      <h3>Dirección de la Academia</h3>
      <div className="vault-actions">
        <button className="cat-pill" aria-pressed={users} onClick={() => setView('users')}>Registro de estudiantes</button>
        <button className="cat-pill" aria-pressed={!users} onClick={() => setView('events')}>Bitácora de seguridad</button>
      </div>
      <div className="vault-actions">
        {users ? <label>Buscar por nombre o correo<input type="search" value={search} onChange={(e) => setSearch(e.target.value)} /></label> : <>
          <label>Desde<input type="date" value={since} onChange={(e) => setSince(e.target.value)} /></label>
          <label>Tipo de evento<select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Todos</option>
            {eventTypes.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
          </select></label>
        </>}
      </div>
      {current.error ? <p role="alert">{current.error} <button className="cat-pill" onClick={() => setRetry(retry + 1)}>Reintentar</button></p> :
        !current.rows ? <p role="status">Cargando…</p> :
        !current.rows.length ? <p role="status">No hay coincidencias.</p> :
        <div className="vault-table" tabIndex={0} aria-label={users ? 'Registro de estudiantes' : 'Bitácora de seguridad'}>
          <table>
            <thead><tr>{(users ? ['Nombre', 'Correo', 'Rol', 'Talento'] : ['Fecha', 'Evento', 'Cuenta']).map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead>
            <tbody>{current.rows.map((row) => <tr key={row.id}>
              {users ? <><td>{row.name}</td><td>{row.email}</td><td>{roleName[row.role]}</td><td>{row.talent}</td></> :
                <><td>{new Date(row.time).toLocaleString('es-CR')}</td><td>{row.type.replaceAll('_', ' ')}</td><td>{row.actor || '—'}</td></>}
            </tr>)}</tbody>
          </table>
        </div>}
    </div>
  );
}

function Notes({ onError }) {
  const [notes, setNotes] = useState(null);
  const [draft, setDraft] = useState({ title: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    request('/notes', 'GET', undefined, controller.signal).then(
      (data) => { setNotes(data.notes); setLoadError(''); },
      (error) => { if (!controller.signal.aborted) setLoadError(error.message); }
    );
    return () => controller.abort();
  }, [retry]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const note = await request(draft.id ? '/notes/' + draft.id : '/notes', draft.id ? 'PUT' : 'POST', { title: draft.title, body: draft.body });
      setNotes((previous) => [note, ...previous.filter((item) => item.id !== note.id)]);
      setDraft({ title: '', body: '' });
      onError('');
    } catch (error) { onError(error.message); }
    finally { setBusy(false); }
  }

  async function remove(id) {
    setBusy(true);
    try {
      await request('/notes/' + id, 'DELETE');
      setNotes((previous) => previous.filter((item) => item.id !== id));
      if (draft.id === id) setDraft({ title: '', body: '' });
      setConfirm(null);
      onError('');
    } catch (error) { onError(error.message); }
    finally { setBusy(false); }
  }

  return <div className="vault-panel">
    <h3>Notas privadas</h3>
    {loadError ? <p role="alert">{loadError} <button className="cat-pill" onClick={() => setRetry(retry + 1)}>Reintentar</button></p> :
      !notes ? <p role="status">Cargando notas…</p> : <>
        <form className="vault-form" onSubmit={save}>
          <label>Título<input required maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
          <label>Contenido<textarea required maxLength={8000} rows={4} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></label>
          <div className="vault-actions">
            <button className="btn-stage-primary" disabled={busy}>{busy ? 'Guardando…' : draft.id ? 'Guardar cambios' : 'Crear nota'}</button>
            {draft.id && <button type="button" className="cat-pill" disabled={busy} onClick={() => setDraft({ title: '', body: '' })}>Cancelar edición</button>}
          </div>
        </form>
        {notes.length === 0 && <p>Todavía no hay notas.</p>}
        {notes.map((note) => <article className="vault-note" key={note.id}>
          <h4>{note.title}</h4><p>{note.body}</p>
          <div className="vault-actions">
            <button className="cat-pill" disabled={busy} onClick={() => setDraft(note)}>Editar</button>
            {confirm === note.id ? <>
              <button className="cat-pill" disabled={busy} onClick={() => remove(note.id)}>Confirmar eliminación</button>
              <button className="cat-pill" disabled={busy} onClick={() => setConfirm(null)}>Cancelar</button>
            </> : <button className="cat-pill" disabled={busy} onClick={() => setConfirm(note.id)}>Eliminar</button>}
          </div>
        </article>)}
      </>}
  </div>;
}

export default function AccountSection() {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('recuperar'));
  const [mode, setMode] = useState(token ? 'reset' : 'login');
  const [profile, setProfile] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(!token);

  useEffect(() => {
    const controller = new AbortController();
    if (token) {
      history.replaceState(history.state, '', '#mi-expediente');
      document.getElementById('mi-expediente')?.scrollIntoView();
    } else {
      request('/profile', 'GET', undefined, controller.signal)
        .then((data) => setProfile(data.profile), (failure) => {
          if (!controller.signal.aborted && failure.status !== 401) setError(failure.message);
        }).finally(() => { if (!controller.signal.aborted) setLoadingProfile(false); });
    }
    return () => controller.abort();
  }, [token]);

  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await request('/' + mode, 'POST', mode === 'reset' ? { ...values, token } : values);
      if (result.profile) {
        setProfile(result.profile);
        setReveal(result.created === true);
      } else {
        setMode('login');
        setNotice(mode === 'recover' ? 'Si existe la cuenta, recibirás un correo de recuperación.' : 'Contraseña actualizada. Ya podés iniciar sesión.');
      }
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await request('/logout', 'POST');
      setProfile(null);
      setReveal(false);
      setMode('login');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  return <section className="section-block vault-section" id="mi-expediente" aria-labelledby="vault-heading">
    <div className="container">
      <h2 className="section-title" id="vault-heading">Mi expediente</h2>
      {error && <p className="vault-feedback" role="alert">{error}</p>}
      {notice && <p className="vault-feedback" role="status">{notice}</p>}
      {loadingProfile ? <p role="status">Cargando expediente…</p> : profile ? <>
        <div className="vault-columns">
          <div className="vault-panel">
            <div className={`vault-badge ${reveal ? 'is-revealing' : ''}`} onAnimationEnd={(e) => {
              if (e.animationName === 'vault-credential') audioEngine.playSelectClick();
            }}>
              <span className="mono">{roleName[profile.role]}</span>
              <h3>{profile.name}</h3>
              <strong>{profile.talent}</strong>
            </div>
            <p>Teléfono <span className="mono">{profile.phone}</span></p>
            <button className="cat-pill" disabled={busy} onClick={logout}>Cerrar sesión</button>
          </div>
          <Notes key={profile.id} onError={setError} />
        </div>
        {profile.role === 'administrador' && <Administration />}
      </> : <div className="vault-panel vault-admission">
        <h3>{{ login: 'Ingresá a la Academia', register: 'Admisión a la Academia', recover: 'Recuperá el acceso', reset: 'Elegí una nueva contraseña' }[mode]}</h3>
        <form key={mode} className="vault-form" onSubmit={submit}>
          {mode === 'register' && <label>Nombre<input autoComplete="name" name="name" required minLength={2} maxLength={100} /></label>}
          {mode !== 'reset' && <label>Correo<input autoComplete="email" name="email" type="email" required maxLength={254} /></label>}
          {mode === 'register' && <label>Teléfono<input autoComplete="tel" name="phone" type="tel" inputMode="tel" pattern="[+]?[0-9]{8,15}" required placeholder="Solo dígitos, prefijo + opcional" /></label>}
          {mode !== 'recover' && <label>Contraseña<input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} type="password" name="password" required minLength={mode === 'login' ? 1 : 12} maxLength={128} />
            {mode !== 'login' && <small>{passwordHelp}</small>}
          </label>}
          <button className="btn-stage-primary" disabled={busy}>{busy ? 'Procesando…' : { login: 'Iniciar sesión', register: 'Crear cuenta', recover: 'Enviar enlace', reset: 'Guardar contraseña' }[mode]}</button>
        </form>
        <div className="vault-actions">
          {(mode === 'login' ? [['register', 'Registrarme'], ['recover', 'Recuperar contraseña']] : [['login', 'Volver a iniciar sesión']]).map(([next, label]) =>
            <button key={next} className="cat-pill" disabled={busy} onClick={() => { setError(''); setNotice(''); setMode(next); }}>{label}</button>)}
        </div>
      </div>}
    </div>
  </section>;
}
