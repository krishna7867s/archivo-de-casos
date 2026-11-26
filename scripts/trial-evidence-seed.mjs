import { trialCases } from '../src/lib/miniTrial.js';

const quoted = (value) => "'" + value.replaceAll("'", "''") + "'";
const rows = trialCases.flatMap((trial) => trial.evidence.map(([id, title, lines, description], index) => {
  const metadata = [trial.id, trial.title, id, title, trial.id + '/' + id + '.svg', description, lines.join('. ')];
  return '(' + [...metadata.map(quoted), index + 1].join(', ') + ')';
}));

console.log('insert into public.danganronpa_pruebas_juicio (caso_id, caso_titulo, prueba_id, titulo, ruta, descripcion, imagen_alt, orden) values\n'
  + rows.join(',\n') + '\non conflict (caso_id, prueba_id) do update set caso_titulo = excluded.caso_titulo, titulo = excluded.titulo, ruta = excluded.ruta, descripcion = excluded.descripcion, imagen_alt = excluded.imagen_alt, orden = excluded.orden;');
