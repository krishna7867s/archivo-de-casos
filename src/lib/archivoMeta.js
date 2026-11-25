/**
 * Configuración de ambientes por juego, encuadres de portada por obra,
 * respaldos tipográficos si falla una URL externa y opciones de recomendaciones.
 */

export const TIPO_LABELS = {
  principal: 'Juego principal',
  derivado: 'Derivado',
  remake: 'Remake',
  coleccion: 'Colección',
  anime: 'Anime',
  ova: 'OVA',
  novela: 'Novela',
  manga: 'Manga',
};

export const ESTADO_LABELS = {
  publicado: 'Publicado',
  anunciado: 'Anunciado',
  cerrado: 'Servicio cerrado',
};

export const FLAGSHIP_SLUGS = ['dr1', 'dr2', 'v3'];

/**
 * Ambientes del escenario principal para los tres juegos centrales.
 * Se aplican al entorno de escena, nunca como filtro encima del arte.
 */
export const STAGE_THEMES = {
  dr1: {
    id: 'dr1',
    shortName: 'Trigger Happy Havoc',
    seatLabel: 'CASO 01',
    stageClass: 'stage-theme-dr1',
    accent: '#7dd3fc',
    subtitle: 'Academia Pico de la Esperanza · 2010',
    envTag: 'AULA SELLADA · LUZ FRÍA',
  },
  dr2: {
    id: 'dr2',
    shortName: 'Goodbye Despair',
    seatLabel: 'CASO 02',
    stageClass: 'stage-theme-dr2',
    accent: '#2dd4bf',
    subtitle: 'Jabberwock Island · 2012',
    envTag: '24°18′N 153°58′E · MAPA INSULAR',
  },
  v3: {
    id: 'v3',
    shortName: 'Killing Harmony',
    seatLabel: 'CASO V3',
    stageClass: 'stage-theme-v3',
    accent: '#a78bfa',
    subtitle: 'Academia Definitiva · 2017',
    envTag: 'ESCENARIO EN FOCOS · JUICIO V3',
  },
};

/**
 * Encuadre y color de respaldo por obra para cuidar caras, logos y proporciones.
 * orientation: 'landscape' (arte ancho) | 'portrait' (portada vertical/caja completa)
 */
export const COVER_SETTINGS = {
  dr1: {
    orientation: 'landscape',
    fit: 'cover',
    objectPosition: 'center center',
    fallbackColor: '#38bdf8',
    fallbackBg: '#121821',
  },
  dr2: {
    orientation: 'landscape',
    fit: 'cover',
    objectPosition: 'center center',
    fallbackColor: '#2dd4bf',
    fallbackBg: '#0f1d1d',
  },
  v3: {
    orientation: 'landscape',
    fit: 'cover',
    objectPosition: 'center center',
    fallbackColor: '#a78bfa',
    fallbackBg: '#161124',
  },
  udg: {
    orientation: 'landscape',
    fit: 'cover',
    objectPosition: 'center 35%',
    fallbackColor: '#e60b67',
    fallbackBg: '#1a1116',
  },
  '2x2': {
    orientation: 'landscape',
    fit: 'cover',
    objectPosition: 'center 25%',
    fallbackColor: '#2dd4bf',
    fallbackBg: '#101c1c',
  },
  drs: {
    orientation: 'landscape',
    fit: 'cover',
    objectPosition: 'center 22%',
    fallbackColor: '#2dd4bf',
    fallbackBg: '#101b21',
  },
  decadence: {
    orientation: 'landscape',
    fit: 'contain',
    objectPosition: 'center center',
    fallbackColor: '#e60b67',
    fallbackBg: '#141418',
  },
  dr25: {
    orientation: 'landscape',
    fit: 'cover',
    objectPosition: 'center 25%',
    fallbackColor: '#2dd4bf',
    fallbackBg: '#12191c',
  },
  'monokuma-strikes-back': {
    orientation: 'landscape',
    fit: 'cover',
    objectPosition: 'center center',
    fallbackColor: '#e60b67',
    fallbackBg: '#181418',
  },
  'kirigiri-sou': {
    orientation: 'landscape',
    fit: 'cover',
    objectPosition: 'center 25%',
    fallbackColor: '#a78bfa',
    fallbackBg: '#17131f',
  },
  reload: {
    orientation: 'portrait',
    fit: 'contain',
    objectPosition: 'center center',
    fallbackColor: '#38bdf8',
    fallbackBg: '#14161c',
  },
  trilogy: {
    orientation: 'portrait',
    fit: 'contain',
    objectPosition: 'center center',
    fallbackColor: '#e60b67',
    fallbackBg: '#141418',
  },
  'cyber-vr': {
    orientation: 'portrait',
    fit: 'contain',
    objectPosition: 'center center',
    fallbackColor: '#38bdf8',
    fallbackBg: '#11161f',
  },
  'alter-ego': {
    orientation: 'portrait',
    fit: 'contain',
    objectPosition: 'center center',
    fallbackColor: '#2dd4bf',
    fallbackBg: '#11191a',
  },
  'unlimited-battle': {
    orientation: 'portrait',
    fit: 'contain',
    objectPosition: 'center center',
    fallbackColor: '#e60b67',
    fallbackBg: '#181217',
  },
  dr3: {
    orientation: 'portrait',
    fit: 'contain',
    objectPosition: 'center center',
    fallbackColor: '#e60b67',
    fallbackBg: '#141318',
  },
  animation: {
    orientation: 'portrait',
    fit: 'contain',
    objectPosition: 'center center',
    fallbackColor: '#38bdf8',
    fallbackBg: '#13161d',
  },
};

export function getCoverSetting(obra) {
  if (!obra) {
    return {
      orientation: 'landscape',
      fit: 'cover',
      objectPosition: 'center center',
      fallbackColor: '#e60b67',
      fallbackBg: '#141418',
    };
  }

  const preset = COVER_SETTINGS[obra.slug];
  if (preset) return preset;

  // Novelas y manga son portadas verticales: conservar arte completo dentro del marco
  if (obra.tipo === 'novela' || obra.tipo === 'manga' || obra.tipo === 'anime') {
    return {
      orientation: 'portrait',
      fit: 'contain',
      objectPosition: 'center center',
      fallbackColor: obra.tipo === 'manga' ? '#e60b67' : '#d6c7a9',
      fallbackBg: '#161519',
    };
  }

  return {
    orientation: 'landscape',
    fit: 'cover',
    objectPosition: 'center center',
    fallbackColor: '#e60b67',
    fallbackBg: '#141418',
  };
}

/**
 * Recomendaciones como presentación de pruebas:
 * «Juegos mortales», «Deducción» y «Rutas y decisiones».
 */
export const TRIAL_PROMPTS = [
  {
    id: 'juegos-mortales',
    label: 'Juegos mortales',
    evidenceTag: 'PRUEBA 01',
    primarySlug: 'yttd',
    order: [
      'yttd',
      'raging-loop',
      'gnosia',
      'zero-escape',
      'zero-time',
      'hundred-line',
      'process',
      'rain-code',
      'ai-somnium',
      'ace-attorney',
    ],
  },
  {
    id: 'deduccion',
    label: 'Juicios y deducción',
    evidenceTag: 'PRUEBA 02',
    primarySlug: 'ace-attorney',
    approaches: [
      {
        id: 'tribunal',
        label: 'Tribunal clásico',
        order: [
          'ace-attorney',
          'rain-code',
          'process',
          'ai-somnium',
          'raging-loop',
          'gnosia',
          'yttd',
          'zero-escape',
          'zero-time',
          'hundred-line',
        ],
      },
      {
        id: 'laberinto',
        label: 'Investigación laberíntica',
        order: [
          'rain-code',
          'ace-attorney',
          'ai-somnium',
          'process',
          'raging-loop',
          'gnosia',
          'yttd',
          'zero-escape',
          'zero-time',
          'hundred-line',
        ],
      },
    ],
    order: [
      'ace-attorney',
      'rain-code',
      'process',
      'ai-somnium',
      'raging-loop',
      'gnosia',
      'yttd',
      'zero-escape',
      'zero-time',
      'hundred-line',
    ],
  },
  {
    id: 'rutas-decisiones',
    label: 'Rutas y decisiones',
    evidenceTag: 'PRUEBA 03',
    primarySlug: 'zero-escape',
    order: [
      'zero-escape',
      'zero-time',
      'ai-somnium',
      'hundred-line',
      'yttd',
      'raging-loop',
      'gnosia',
      'rain-code',
      'process',
      'ace-attorney',
    ],
  },
];
