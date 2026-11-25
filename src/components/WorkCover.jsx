import React, { useEffect, useState } from 'react';
import { getCoverSetting, TIPO_LABELS } from '../lib/archivoMeta.js';

/**
 * Renderiza la portada real desde Supabase (`portada_url`) siempre visible
 * de inmediato (sin ocultar con opacity: 0 ni depender de eventos onLoad
 * que fallan con caché). Si la URL externa falla, muestra una ficha
 * tipográfica con el título y el color propio de la entrega.
 */
export default function WorkCover({
  obra,
  priority = false,
  forceContain = false,
  className = '',
}) {
  const [failed, setFailed] = useState(false);

  const src = obra?.portada_url || '';
  const setting = getCoverSetting(obra);
  const useContain = forceContain || setting.fit === 'contain';

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`cover-fallback ${className}`}
        style={{
          '--fallback-accent': setting.fallbackColor,
          '--fallback-bg': setting.fallbackBg,
        }}
        role="img"
        aria-label={`Portada tipográfica de ${obra?.titulo || 'obra'}`}
      >
        <div className="cover-fallback-stripe" aria-hidden="true" />
        <div className="cover-fallback-top">
          <span>{(TIPO_LABELS[obra?.tipo] || obra?.tipo || 'OBRA').toUpperCase()}</span>
          <span>{obra?.anio || 'S/F'}</span>
        </div>
        <div className="cover-fallback-title">{obra?.titulo}</div>
        <div className="cover-fallback-foot">
          <span>ARCHIVO DE CASOS</span>
          {obra?.estado === 'anunciado' && <span>ANUNCIADO</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`cover-frame ${useContain ? 'is-contain' : 'is-cover'} ${className}`}
      style={{ '--fallback-bg': setting.fallbackBg }}
    >
      <img
        src={src}
        alt={`Portada de ${obra.titulo}`}
        className="cover-img"
        referrerPolicy="no-referrer"
        style={{ objectPosition: setting.objectPosition }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
