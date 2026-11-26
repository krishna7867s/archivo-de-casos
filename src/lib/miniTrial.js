const byakuya = 'Byakuya Togami';
const kyoko = 'Kyoko Kirigiri';
const makoto = 'Makoto Naegi';
const aoi = 'Aoi Asahina';
const sakura = 'Sakura Ogami';
const chihiro = 'Chihiro Fujisaki';

export const trialCases = [
  {
    id: 'expediente-0812',
    title: 'El expediente de las 8:12',
    difficulty: 'Inicial',
    date: '12 de mayo · Jornada de inventario',
    cast: [byakuya, kyoko, makoto],
    incident: 'Byakuya cerró el archivo el 11 de mayo a las 21:00. Makoto revisó el lector y descubrió que reconoce tarjetas. A las 08:20 de la mañana siguiente, los tres se reunieron para el inventario y vieron que la carpeta de altas ya estaba sobre el carro de devolución.',
    question: '¿Cuándo se abrió el archivo y quién cruzó su única puerta?',
    evidence: [
      ['acceso', 'Foto del registro de acceso', ['12 MAY · 08:12:04', 'PUERTA ARCHIVO · ABIERTA', 'Tarjeta AP-04 · acceso concedido'], 'El sensor registró una apertura real a las 08:12:04 con AP-04. El lector solo registra tarjetas.'],
      ['plano', 'Plano del pasillo', ['CONTROL → PASILLO → ARCHIVO', 'Única entrada: puerta con lector', 'Cámara del vestíbulo → umbral'], 'El archivo tiene un solo acceso y la cámara del vestíbulo apunta directamente al umbral.'],
      ['prestamo', 'Ficha de préstamo', ['12 MAY · 07:55', 'AP-04 · retirada por Byakuya Togami', '08:24 · devuelta por Byakuya Togami'], 'La ficha registra quién retiró y devolvió AP-04. Entre esas dos firmas no hay control de custodia.'],
      ['camara', 'Fotograma del vestíbulo', ['12 MAY · 08:12:04 · CÁMARA 02', 'ENTRADA ARCHIVO', 'Makoto Naegi · lado interior · AP-04'], 'El fotograma anotado por Kyoko muestra a Makoto junto al lector del lado interior con AP-04 visible. Su reloj está sincronizado con el lector.'],
    ],
    rounds: [
      { speaker: byakuya, lines: ['Yo cerré el archivo a las 21:00. El control de inventario era a las 08:20.', 'La puerta quedó cerrada desde anoche hasta la inspección.'], line: 1, answer: 'acceso', detail: 1, why: 'La fila de las 08:12:04 dice «ABIERTA». Kyoko encontró una apertura física ocho minutos antes de la inspección.', wrong: ['El plano muestra por dónde se podía entrar. Fijate qué pieza registra una apertura con hora.', 'Una firma de préstamo no demuestra que se haya abierto la puerta.', 'El fotograma identifica a quien cruzó. Buscá el registro del sensor que certifica la apertura.'] },
      { speaker: kyoko, lines: ['Probemos primero la hipótesis que sugiere la firma del préstamo.', 'Byakuya fue quien entró con AP-04 a las 08:12.'], line: 1, answer: 'camara', detail: 2, why: 'Kyoko emparejó el fotograma con el registro por hora y puerta. Makoto aparece del lado interior con AP-04 en el instante de la apertura. El titular que firmó el préstamo era Byakuya.', wrong: ['El lector identifica AP-04. Falta una prueba que muestre a la persona.', 'La ubicación de la cámara explica su ángulo. Revisá qué captó.', 'La ficha identifica a quien retiró la tarjeta. No sigue la tarjeta durante el préstamo.'] },
    ],
    verdict: 'Byakuya cerró a las 21:00 y retiró AP-04 a las 07:55. Makoto aclara que Byakuya se la prestó para devolver la carpeta. A las 08:12:04 el sensor registra la apertura y la cámara muestra a Makoto del lado interior con AP-04. La carpeta sobre el carro estaba devuelta antes del inventario de las 08:20. La firma de préstamo por sí sola nunca identificó a quien cruzó.',
  },
  {
    id: 'caja-gimnasio',
    title: 'La caja del gimnasio',
    difficulty: 'Intermedio',
    date: '18 de mayo · Entrenamiento de la tarde',
    cast: [aoi, sakura, makoto],
    incident: 'Tras sus vueltas en la piscina, Aoi dejó una caja con cintas de entrenamiento junto a la entrada del gimnasio. Sakura y Makoto regresaron con ella a las 16:25. Abrieron la caja que había allí y la encontraron vacía. Antes de abrirla, Makoto le sacó una foto.',
    question: '¿Vaciaron la caja de las cintas o quedó otra caja en su sitio?',
    evidence: [
      ['sello', 'Foto del sello', ['18 MAY · 16:25 · ANTES DE ABRIR', 'S-44 · banda continua e intacta', 'Etiqueta visible: G-18'], 'Foto tomada al volver. El sello serializado S-44 de la caja G-18 estaba intacto antes de que Aoi lo cortara.'],
      ['comprobante', 'Comprobante del depósito', ['18 MAY · 16:18 · ENTREGA RECIBIDA', 'G-81 · 12 cintas de entrenamiento', 'S-19 intacto · de entrada a depósito'], 'El comprobante confirma la recepción y el recuento en depósito de la caja original G-81 a las 16:18.'],
      ['plano', 'Plano del gimnasio', ['ENTRADA → BANCO → DEPÓSITO', 'Pasillo interior junto a las colchonetas', 'Trayecto habitual de reparto'], 'El banco junto a la entrada conecta por un pasillo interior con el depósito. El recorrido evita la zona de práctica de Sakura.'],
      ['etiquetas', 'Foto de las etiquetas', ['16:05 · G-81 · CINTAS · S-19', '16:25 · G-18 · ENVASE VACÍO · S-44', 'Ambas fotos: banco de la entrada'], 'Comparativa de las fotos del banco. Los códigos, contenidos declarados y números de sello de las dos cajas son distintos.'],
    ],
    rounds: [
      { speaker: aoi, lines: ['Dejé las cintas en el banco cuando terminé de nadar. Desde la entrada las cajas se ven iguales.', 'La caja que abrimos era la misma que dejé ahí.'], line: 1, answer: 'etiquetas', detail: 1, why: 'Las dos fotos muestran el mismo banco con códigos y sellos distintos. A las 16:05 había una G-81 con S-19. A las 16:25 había una G-18 con S-44.', wrong: ['El sello intacto dice cómo encontraron G-18. Buscá la comparación que identifica ambas cajas.', 'El comprobante sigue la caja de las cintas, pero no identifica la que abrieron en el banco.', 'El plano permite reconstruir el recorrido. No distingue los dos envases.'] },
      { speaker: sakura, lines: ['En el entrenamiento repito cada recorrido con precisión. Del banco al depósito hay un pasillo directo.', 'Hasta las 16:25 la caja original no había llegado al depósito.'], line: 1, answer: 'comprobante', detail: 0, why: 'El depósito registró la caja G-81 a las 16:18 con las doce cintas. El registro confirma la hora y el destino dentro del recorrido que trazó Sakura.', wrong: ['Esta foto es de G-18 en el banco. ¿Qué documento ubica a G-81?', 'El plano acredita que el trayecto existe. Hace falta una hora de recepción.', 'Las fotos identifican las cajas. La recepción en depósito se anotó en otro documento.'] },
    ],
    verdict: 'Aoi dejó G-81 con las cintas a las 16:05. Durante el reparto, G-81 siguió el pasillo que señaló Sakura y llegó completa al depósito a las 16:18. Al volver a las 16:25, el banco tenía G-18, un envase de retorno vacío con el sello S-44 intacto. Se confundieron dos cajas parecidas. Las cintas estaban en el depósito.',
  },
  {
    id: 'mensaje-laboratorio',
    title: 'El mensaje del laboratorio',
    difficulty: 'Avanzado',
    date: '24 de mayo · Prueba de mensajería',
    cast: [chihiro, makoto, kyoko],
    incident: 'Chihiro recibió el aviso «Revisen el sensor B» a las 22:10. En el laboratorio estaban Chihiro, Makoto y Kyoko cuando apagaron el terminal L-02. El buzón de Chihiro está en otro dispositivo. Todos los registros usan la misma hora.',
    question: '¿El terminal se reactivó o el mensaje se redactó y se despachó en momentos distintos?',
    evidence: [
      ['mensaje', 'Captura del mensaje', ['24 MAY · BUZÓN DE CHIHIRO', '22:10 · RECIBIDO · ID M-47', 'Terminal L-02 · Revisen el sensor B'], 'El buzón muestra la recepción de M-47 a las 22:10. El rótulo L-02 identifica el terminal de origen.'],
      ['electricidad', 'Registro eléctrico', ['24 MAY · TERMINAL L-02', '21:40–22:30 · alimentación 0 W', 'Control continuo · sin batería de respaldo'], 'El terminal L-02 estuvo apagado de 21:40 a 22:30 sin interrupciones ni alimentación auxiliar.'],
      ['envios', 'Historial de envíos programados', ['21:37 · M-47 v3 recibido en cola', '22:10 · M-47 v3 despachado', 'Servidor de mensajería · circuito independiente'], 'El servidor independiente aceptó M-47 versión 3 a las 21:37 y despachó esa misma versión a las 22:10.'],
      ['edicion', 'Registro de edición', ['24 MAY · TERMINAL L-02 · M-47', '21:31 · borrador v1', '21:36 · v3 guardada: Revisen el sensor B'], 'La última edición de M-47 fue la versión 3 a las 21:36. Su texto coincide con el aviso recibido.'],
    ],
    rounds: [
      { speaker: makoto, lines: ['Vi que figuraba L-02 cuando llegó el aviso.', 'Si el buzón dice 22:10, el terminal L-02 tenía que estar encendido a esa hora.'], line: 1, answer: 'electricidad', detail: 1, why: 'Kyoko coteja las horas. El intervalo de 0 W incluye las 22:10, y L-02 no tenía una batería de respaldo.', wrong: ['El buzón da la hora de recepción. Buscá el estado físico del terminal.', 'La cola explica cómo salió el aviso. Para probar si L-02 tenía corriente, buscá la medición directa.', 'Guardar una edición antes del apagado no demuestra el estado eléctrico a las 22:10.'] },
      { speaker: chihiro, lines: ['El servidor puede liberar la cola por su cuenta. Veamos si el guardado del texto y la entrada en cola coincidieron.', 'La versión que recibí se terminó de redactar a las 21:37, justo al entrar en cola.'], line: 1, answer: 'edicion', detail: 2, why: 'M-47 v3 quedó guardada con el texto exacto a las 21:36. El historial sigue esa misma versión desde la cola de las 21:37 hasta el despacho de las 22:10.', wrong: ['La captura dice cuándo llegó, no cuándo se guardó la redacción.', 'El apagado acota el tiempo posible. Buscá la hora exacta de guardado de esa versión.', 'El historial muestra cuándo se entregó la versión a la cola. La edición tiene su propio registro.'] },
    ],
    verdict: 'Chihiro identifica la versión 3 de M-47 guardada en L-02 a las 21:36. A las 21:37 quedó en el servidor. El terminal se apagó a las 21:40. A las 22:10, el servidor independiente despachó la versión que ya tenía guardada y el buzón la recibió. La hora de entrega no indica cuándo se escribió el aviso.',
  },
];

export const initialTrial = { caseId: null, stage: 'investigate', round: 0, line: null, selected: null, result: null };

export function trialReducer(state, action) {
  if (action.type === 'open') return { ...initialTrial, caseId: action.caseId };
  const trial = trialCases.find(({ id }) => id === state.caseId);
  if (!trial) return state;
  if (action.type === 'begin' && state.stage === 'investigate') return { ...state, stage: 'debate' };
  if (state.stage !== 'debate') return state;

  const round = trial.rounds[state.round];
  if (state.result === 'correct') {
    if (action.type !== 'next' || action.round !== state.round) return state;
    if (state.round + 1 === trial.rounds.length) return { ...state, stage: 'verdict' };
    return { ...state, round: state.round + 1, line: null, selected: null, result: null };
  }

  if (action.type === 'line' && round.lines[action.index]) return { ...state, line: action.index, result: null };
  if (action.type === 'select' && trial.evidence.some(([id]) => id === action.id)) {
    return { ...state, selected: action.id, result: null };
  }
  if (action.type === 'submit' && state.selected && state.line !== null && state.result === null) {
    const result = state.line !== round.line ? 'wrong-line' : state.selected === round.answer ? 'correct' : 'wrong-evidence';
    return { ...state, result };
  }
  return state;
}
