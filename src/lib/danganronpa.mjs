/**
 * Conector de Supabase para el Archivo de Casos de Danganronpa.
 * Consulta las tablas danganronpa_obras (incluyendo portadas),
 * danganronpa_personajes y danganronpa_recomendaciones.
 */

export const SUPABASE_URL = 'https://iaburcfczgxxyqpttqrz.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_0ZY8viWRiyvrdagN--ea1Q_cEfS8cve';

const REST_BASE = `${SUPABASE_URL}/rest/v1`;

async function queryTable(table, params = {}) {
  const url = new URL(`${REST_BASE}/${table}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  let response;
  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
          Accept: 'application/json',
      },
    });
  } catch {
    throw new Error(
      `No se pudo establecer conexión con Supabase al consultar "${table}". Verificá tu red y volvé a intentarlo.`
    );
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.message || body?.hint || '';
    } catch {
      // ignorar si no es JSON
    }
    throw new Error(
      `Error ${response.status} al cargar "${table}" desde Supabase${detail ? `: ${detail}` : '.'}`
    );
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`La respuesta de "${table}" no tiene el formato esperado.`);
  }
  return data;
}

/**
 * Ordena las obras poniendo los juegos principales primero (dr1, dr2, v3),
 * luego por orden_sugerido y finalmente por año.
 */
export function sortObras(obras) {
  return [...obras].sort((a, b) => {
    const aMain = a.tipo === 'principal' ? 0 : 1;
    const bMain = b.tipo === 'principal' ? 0 : 1;
    if (aMain !== bMain) return aMain - bMain;

    const aOrd = a.orden_sugerido ?? 999;
    const bOrd = b.orden_sugerido ?? 999;
    if (aOrd !== bOrd) return aOrd - bOrd;

    return (a.anio ?? 9999) - (b.anio ?? 9999);
  });
}

export async function fetchObras() {
  const rows = await queryTable('danganronpa_obras', {
    select:
      'slug,titulo,tipo,anio,plataformas,resumen,fuente_url,orden_sugerido,estado,portada_url,portada_fuente_url,portada_tipo',
  });
  return sortObras(rows);
}

export async function fetchPersonajes(obraSlug) {
  const params = {
    select: 'obra_slug,nombre,talento,retrato_url,retrato_fuente_url',
  };
  if (obraSlug) {
    params.obra_slug = `eq.${obraSlug}`;
  }
  return queryTable('danganronpa_personajes', params);
}

export async function fetchRecomendaciones() {
  return queryTable('danganronpa_recomendaciones', {
    select: 'slug,titulo,estudio,anio_edicion,etiquetas,por_que,fuente_url,posicion',
    order: 'posicion.asc',
  });
}
