export const trialCases = [
  {
    id: 'sello',
    title: 'El sello del archivo',
    difficulty: 'Inicial',
    incident: 'La llave de inventario desapareció del escritorio del archivo. La encargada busca en el ala oeste porque Milo dice que la llevó allí al cerrar.',
    timeline: [
      '19:35 · La encargada deja la llave en el escritorio y sale.',
      '19:45 · Se comprueba que no queda nadie dentro y se sella la única puerta.',
      '20:00 · Hora a la que Milo dice haber entrado.',
      '20:10 · La encargada retira el sello y encuentra el escritorio vacío.',
    ],
    witness: 'Milo, auxiliar',
    before: 'Cuando terminé la ronda, ',
    claim: 'entré por la puerta del archivo a las 20:00',
    after: ' y llevé la llave al ala oeste.',
    evidence: [
      ['camara', 'Parte de la cámara', 'La cámara del pasillo estuvo fuera de servicio entre las 19:30 y las 20:15.'],
      ['sello', 'Acta de precinto', 'La puerta no puede abrirse sin romper el sello numerado. Las fotos de instalación y retiro muestran el mismo sello intacto entre las 19:45 y las 20:10.'],
      ['ronda', 'Planilla de ronda', 'Milo firmó su paso por el ala oeste a las 20:05. La planilla no registra objetos transportados.'],
    ],
    answer: 'sello',
    hint: 'Buscá qué impedía abrir la puerta a esa hora.',
    resolution: 'El sello intacto descarta la entrada de Milo a las 20:00. La llave ya faltaba cuando se abrió el archivo a las 20:10, así que su desaparición se acota al intervalo entre las 19:35 y el sellado de las 19:45. La ronda de Milo no demuestra que la llave llegara al ala oeste.',
  },
  {
    id: 'reloj',
    title: 'La bobina del auditorio',
    difficulty: 'Intermedio',
    incident: 'El auditorio admite una sola bobina en su reproductor. Alguien sustituyó la original por una copia durante el ensayo. La guardia afirma que la cambió al terminar.',
    timeline: [
      '17:30 · Se instala la bobina original.',
      '17:40 · Empieza el ensayo.',
      '17:50 · El público aplaude y concluye el ensayo.',
      '17:53 · La técnica encuentra la copia instalada.',
    ],
    witness: 'Iria, guardia',
    before: 'Yo hice el cambio, pero ',
    claim: 'la copia se instaló después del aplauso final',
    after: '.',
    evidence: [
      ['estuche', 'Foto del estuche', 'El estuche de la copia estaba abierto antes del ensayo, con la bobina todavía dentro.'],
      ['parte', 'Parte de la técnica', 'A las 17:53, la técnica leyó el sello C-18 de la copia en la ranura del reproductor.'],
      ['reloj', 'Registro de inserciones', 'El lector registra una inserción de C-18 a las 17:56 en su pantalla. Durante todo el ensayo su reloj estuvo ocho minutos adelantado. El registro completo muestra una sola inserción de C-18.'],
    ],
    answer: 'reloj',
    hint: 'Convertí la hora del lector a la hora del auditorio antes de compararla con el aplauso.',
    resolution: 'Las 17:56 del lector equivalen a las 17:48 en el auditorio. La única inserción de la copia ocurrió dos minutos antes del aplauso. El cambio fue durante el ensayo.',
  },
  {
    id: 'deposito',
    title: 'El depósito vacío',
    difficulty: 'Avanzado',
    incident: 'Durante una prueba de riego quedaron secos los canteros del invernadero. El depósito solo alimenta los canteros o el tanque de recuperación, según la posición del selector.',
    timeline: [
      '06:50 · Se llena el depósito con 60 litros y se vacía el tanque de recuperación.',
      '07:00 · Comienza el ciclo automático.',
      '07:05 · Termina el ciclo. El depósito está vacío y los canteros siguen secos.',
    ],
    witness: 'Nara, operadora',
    before: 'El motor se oyó durante cinco minutos y ',
    claim: 'el selector quedó hacia los canteros durante todo el ciclo',
    after: '.',
    evidence: [
      ['motor', 'Registro del motor', 'El motor estuvo encendido de 07:00 a 07:05. El registro mide corriente y no distingue la salida seleccionada.'],
      ['plano', 'Plano y prueba de las válvulas', 'El selector habilita una sola salida por vez. El tanque de recuperación solo recibe agua por su salida dedicada. Las tuberías y el tanque pasaron la prueba de estanqueidad.'],
      ['nivel', 'Medición del tanque de recuperación', 'Durante esos cinco minutos el tanque recibió 60 litros. Estaba conectado únicamente por su salida dedicada, según el plano. Ninguna otra operación cargó agua.'],
      ['suelo', 'Registro de humedad', 'Las sondas de los canteros no registraron aumento de humedad. Una obstrucción también podría dejar los canteros secos.'],
    ],
    answer: 'nivel',
    hint: 'Buscá una medición que demuestre adónde llegó el agua. Usá el plano para interpretar esa lectura.',
    resolution: 'Los 60 litros que salieron del depósito aparecieron en el tanque de recuperación. Según el plano, solo podían llegar allí con el selector hacia ese tanque. Eso refuta que apuntara siempre a los canteros y explica por qué quedaron secos.',
  },
];

export const initialTrial = { caseId: null, selected: null, result: null };

export function trialReducer(state, action) {
  if (action.type === 'open') {
    return { ...initialTrial, caseId: action.caseId };
  }

  const trial = trialCases.find(({ id }) => id === state.caseId);
  if (!trial || state.result === 'solved') return state;

  if (action.type === 'select' && trial.evidence.some(([id]) => id === action.id)) {
    return { ...state, selected: action.id, result: null };
  }

  if (action.type === 'submit' && state.selected && state.result === null) {
    return { ...state, result: state.selected === trial.answer ? 'solved' : 'wrong' };
  }

  return state;
}
