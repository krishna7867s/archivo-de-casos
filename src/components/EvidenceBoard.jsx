import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Search, X } from 'lucide-react';
import { STAGE_THEMES } from '../lib/archivoMeta.js';
import { audioEngine } from '../lib/audioEngine.js';

function getMonogram(nombre = '') {
  const clean = nombre.trim();
  if (!clean) return 'DR';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function Portrait({ url, name, className, featured = false }) {
  const [failed, setFailed] = useState(false);
  const [cutout, setCutout] = useState(false);

  useEffect(() => {
    if (!featured || !url || failed) return;
    const probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.referrerPolicy = 'no-referrer';
    probe.onload = () => {
      if (probe.naturalWidth < 320 || probe.naturalHeight < 420) return;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 24;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(probe, 0, 0, 24, 24);
      const pixels = context.getImageData(0, 0, 24, 24).data;
      let transparent = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 64) transparent++;
      }
      setCutout(transparent >= 58);
    };
    probe.src = url;
    return () => { probe.onload = null; };
  }, [featured, url, failed]);

  return url && !failed
    ? <img className={`${className}${cutout ? ' is-cutout' : ''}`} src={url} alt="" loading={featured ? 'eager' : 'lazy'} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    : <span className={className}>{getMonogram(name)}</span>;
}

export default function EvidenceBoard({
  personajes,
  obraTitulo,
  obraSlug,
  boardId = 'cast-roster',
  showSearch = false,
  compact = false,
}) {
  const prefersReduced = useReducedMotion();
  const [query, setQuery] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [sweepTick, setSweepTick] = useState(0);
  const mobileChipRefs = useRef({});

  useEffect(() => {
    setQuery('');
  }, [obraSlug]);

  const filteredPersonajes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return personajes;
    return personajes.filter((p) => {
      const name = (p.nombre || '').toLowerCase();
      const talent = (p.talento || '').toLowerCase();
      return name.includes(q) || talent.includes(q);
    });
  }, [personajes, query]);

  const activePerson = useMemo(() => {
    if (filteredPersonajes.length === 0) return null;
    const found = filteredPersonajes.find((p) => p.nombre === selectedName);
    return found || (!query && obraSlug === 'dr1' && filteredPersonajes.find((p) => p.nombre === 'Yasuhiro Hagakure')) || filteredPersonajes[0];
  }, [filteredPersonajes, selectedName, query, obraSlug]);

  const activeIndex = activePerson
    ? filteredPersonajes.findIndex((p) => p.nombre === activePerson.nombre)
    : -1;

  useEffect(() => {
    if (!activePerson) return;
    const chipEl = mobileChipRefs.current[activePerson.nombre];
    const rail = chipEl?.parentElement;
    if (rail?.clientWidth) {
      const chip = chipEl.getBoundingClientRect();
      const viewport = rail.getBoundingClientRect();
      if (chip.left < viewport.left || chip.right > viewport.right) {
        rail.scrollBy({ left: chip.left - viewport.left, behavior: 'instant' });
      }
    }
  }, [activePerson]);

  const handleSelect = (persona) => {
    if (activePerson && persona.nombre === activePerson.nombre) return;
    audioEngine.playSelectClick();
    setSelectedName(persona.nombre);
    setSweepTick((t) => t + 1);
  };

  const themeAccent = STAGE_THEMES[obraSlug]?.accent || '#ff0a78';

  if (!personajes || personajes.length === 0) return null;

  return (
    <div
      className={`cast-dossier-layout ${compact ? 'is-compact-cast' : ''}`}
      style={{ '--cast-accent': themeAccent }}
    >
      {showSearch && (
        <div className="cast-search-bar">
          <div className="search-field">
            <Search size={15} className="search-icon" aria-hidden="true" />
            <label htmlFor={`${boardId}-search`} className="sr-only">
              Buscar personaje por nombre o talento
            </label>
            <input
              id={`${boardId}-search`}
              type="search"
              className="compact-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o talento..."
            />
          </div>
          {query.trim() !== '' && (
            <button
              type="button"
              className="btn-clear-compact"
              onClick={() => setQuery('')}
            >
              <X size={14} aria-hidden="true" />
              <span>Limpiar</span>
            </button>
          )}
          <span className="cast-result-count mono">
            {filteredPersonajes.length} / {personajes.length}
          </span>
        </div>
      )}

      {filteredPersonajes.length === 0 ? (
        <div className="empty-state-box">
          <p>No se encontraron personajes con «{query}» en esta entrega.</p>
          <button
            type="button"
            className="btn-secondary-dark"
            onClick={() => setQuery('')}
          >
            Mostrar todo el reparto
          </button>
        </div>
      ) : (
        <>
          <div
            className="cast-mobile-rail"
            role="listbox"
            aria-label={`Reparto de ${obraTitulo || 'la entrega'}`}
          >
            {filteredPersonajes.map((persona) => {
              const isSelected = activePerson?.nombre === persona.nombre;
              return (
                <button
                  key={`mob-${persona.obra_slug}-${persona.nombre}`}
                  ref={(el) => {
                    mobileChipRefs.current[persona.nombre] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`cast-mobile-chip ${isSelected ? 'is-active' : ''}`}
                  onClick={() => handleSelect(persona)}
                >
                  <span>{persona.nombre}</span>
                </button>
              );
            })}
          </div>

          <div className="cast-split-grid">
            {/* Ficha protagonista estilo Report Card escolar de Danganronpa */}
            {activePerson && (
              <article
                className="cast-protagonist-card report-card-shell" style={{ '--portrait-accent': themeAccent }}
                aria-live="polite"
                aria-label="Personaje seleccionado"
              >
                {sweepTick > 0 && !prefersReduced && (
                  <motion.div
                    key={`sweep-${sweepTick}`}
                    className="cast-diagonal-sweep"
                    aria-hidden="true"
                    initial={{ x: '-115%', skewX: -18 }}
                    animate={{ x: '135%', skewX: -18 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}

                <div className="report-card-bar">
                  <span className="mono">REPORT CARD</span>
                  <span className="mono">
                    NO. {String(activeIndex + 1).padStart(2, '0')} /{' '}
                    {String(filteredPersonajes.length).padStart(2, '0')}
                  </span>
                </div>

                <div className="report-card-body">
                  <div className="cast-featured-art" aria-hidden="true">
                    <Portrait
                      key={activePerson.retrato_url || activePerson.nombre}
                      url={activePerson.retrato_url}
                      name={activePerson.nombre}
                      className="cast-portrait-image"
                      featured
                    />
                  </div>
                  <div className="cast-featured-caption">
                    <span className="cast-game-label mono">{obraTitulo || activePerson.obra_slug?.toUpperCase()}</span>
                    <h3 className="cast-protagonist-name">{activePerson.nombre}</h3>
                    <dl className="cast-talent">
                      <dt className="mono">Talento definitivo</dt>
                      <dd>{activePerson.talento || 'Sin talento registrado'}</dd>
                    </dl>
                    {activePerson.retrato_fuente_url && (
                      <a className="cast-portrait-credit" href={activePerson.retrato_fuente_url} target="_blank" rel="noreferrer">
                        Fuente del retrato
                      </a>
                    )}
                  </div>
                </div>

                <div className="report-card-checker-foot" aria-hidden="true" />
              </article>
            )}

            {/* Cuadrícula compacta y estable de fichas del elenco */}
            <div
              className="cast-roster-grid"
              role="listbox"
              aria-label={`Lista de personajes de ${obraTitulo || 'la entrega'}`}
            >
              {filteredPersonajes.map((persona, idx) => {
                const isSelected = activePerson?.nombre === persona.nombre;
                return (
                  <button
                    key={`${persona.obra_slug}-${persona.nombre}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`cast-item ${isSelected ? 'is-active' : ''}`}
                    onClick={() => handleSelect(persona)}
                  >
                    <span className="cast-item-badge mono" aria-hidden="true">
                      <Portrait key={persona.retrato_url} url={persona.retrato_url} name={persona.nombre} className="cast-roster-image" />
                    </span>
                    <div className="cast-item-text">
                      <span className="cast-item-name">{persona.nombre}</span>
                      {isSelected && (
                        <span className="cast-item-selected-flag mono">
                          <Check size={11} aria-hidden="true" />
                          <span>En foco</span>
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <svg
                        className="cast-active-ink-corner"
                        viewBox="0 0 36 36"
                        aria-hidden="true"
                      >
                        <path
                          d="M36 0 L36 16 C31 15 29 19 26 14 C23 10 21 12 19 8 C17 5 14 4 12 0 Z"
                          fill="#ff0a78"
                        />
                        <circle cx="9" cy="7" r="2.2" fill="#ff0a78" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
