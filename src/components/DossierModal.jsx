import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Image as ImageIcon, RotateCcw, Users } from 'lucide-react';
import WorkCover from './WorkCover.jsx';
import EvidenceBoard from './EvidenceBoard.jsx';
import {
  ESTADO_LABELS,
  getCoverSetting,
  TIPO_LABELS,
} from '../lib/archivoMeta.js';

export default function DossierModal({
  obra,
  cast,
  castLoading,
  castError,
  onRetryCast,
  onJumpToCast,
  onClose,
}) {
  const prefersReduced = useReducedMotion();
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 60);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  if (!obra) return null;

  const setting = getCoverSetting(obra);
  const plataformas = Array.isArray(obra.plataformas) ? obra.plataformas : [];
  const isAnnounced = obra.estado === 'anunciado';

  const maskInitial = prefersReduced
    ? { opacity: 0 }
    : {
        opacity: 0,
        x: -16,
        clipPath: 'polygon(0 0, 0 0, -14% 100%, 0 100%)',
      };
  const maskAnimate = prefersReduced
    ? { opacity: 1 }
    : {
        opacity: 1,
        x: 0,
        clipPath: 'polygon(0 0, 114% 0, 100% 100%, 0 100%)',
      };

  return (
    <motion.div
      className="dossier-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReduced ? 0.12 : 0.22 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="dossier-sheet"
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: prefersReduced ? 0.12 : 0.34, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="dossier-top-bar">
          <button
            ref={closeBtnRef}
            type="button"
            className="dossier-close-btn"
            onClick={onClose}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Volver al catálogo</span>
          </button>
          <span className="mono dossier-top-meta">
            {(TIPO_LABELS[obra.tipo] || obra.tipo).toUpperCase()} · {obra.anio || 'S/F'}
          </span>
        </div>

        <div
          className={`dossier-hero-split ${setting.orientation === 'portrait' ? 'is-portrait-dossier' : ''}`}
        >
          <div className="dossier-cover-column">
            <motion.div
              layoutId={prefersReduced ? undefined : `shared-cover-${obra.slug}`}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="dossier-cover-wrap"
            >
              <WorkCover
                obra={obra}
                priority
                forceContain={setting.orientation === 'portrait'}
              />
              {!prefersReduced && (
                <motion.span
                  className="dossier-cover-edge-flash"
                  aria-hidden="true"
                  initial={{ scaleY: 0, opacity: 1 }}
                  animate={{ scaleY: [0, 1, 1], opacity: [1, 1, 0] }}
                  transition={{
                    delay: 0.14,
                    duration: 0.28,
                    times: [0, 0.55, 1],
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              )}
            </motion.div>

            {/* «Fuente de la imagen» junto al arte */}
            {obra.portada_fuente_url && (
              <div className="dossier-image-credit">
                <a
                  href={obra.portada_fuente_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="dossier-credit-link"
                >
                  <ImageIcon size={12} aria-hidden="true" />
                  <span>Fuente de la imagen</span>
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              </div>
            )}
          </div>

          <div className="dossier-header-copy">
            <svg
              className="dossier-pink-cut-accent"
              viewBox="0 0 110 70"
              aria-hidden="true"
            >
              <path
                d="M110 0 L110 48 C96 42 91 54 81 42 C72 32 66 36 58 24 C50 13 42 15 34 0 Z"
                fill="#ff1e7c"
                fillOpacity="0.88"
              />
              <circle cx="24" cy="14" r="3.5" fill="#ff1e7c" />
              <circle cx="72" cy="54" r="2.8" fill="#ff1e7c" />
            </svg>

            <motion.div
              initial={maskInitial}
              animate={maskAnimate}
              transition={{
                delay: prefersReduced ? 0 : 0.16,
                duration: prefersReduced ? 0.1 : 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="dossier-status-line">
                <span className="mono">{TIPO_LABELS[obra.tipo] || obra.tipo}</span>
                <span aria-hidden="true">·</span>
                <span className="mono">{obra.anio || 'Por confirmar'}</span>
                {isAnnounced && (
                  <span className="status-badge is-announced">Anunciado</span>
                )}
                {obra.estado === 'cerrado' && (
                  <span className="status-badge is-closed">
                    {ESTADO_LABELS.cerrado}
                  </span>
                )}
              </div>
              <h2 id="dossier-title" className="dossier-title">
                {obra.titulo}
              </h2>
            </motion.div>

            <motion.div
              className="dossier-beat-meta"
              initial={maskInitial}
              animate={maskAnimate}
              transition={{
                delay: prefersReduced ? 0 : 0.24,
                duration: prefersReduced ? 0.1 : 0.18,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {plataformas.length > 0 && (
                <div className="dossier-platforms-list">
                  {plataformas.map((plat) => (
                    <span key={plat} className="dossier-platform-chip">
                      {plat}
                    </span>
                  ))}
                </div>
              )}

              <div className="dossier-links-row">
                {obra.fuente_url && (
                  <a
                    href={obra.fuente_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="dossier-ext-link"
                  >
                    <span>Fuente de la obra</span>
                    <ExternalLink size={13} aria-hidden="true" />
                  </a>
                )}
                {!castLoading && cast && cast.length > 0 && onJumpToCast && (
                  <button
                    type="button"
                    className="dossier-jump-cast-btn"
                    onClick={() => onJumpToCast(obra.slug)}
                  >
                    <Users size={13} aria-hidden="true" />
                    <span>Ver reparto</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          className="dossier-fuchsia-seam"
          aria-hidden="true"
          initial={prefersReduced ? { scaleX: 1 } : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            delay: prefersReduced ? 0 : 0.1,
            duration: prefersReduced ? 0.01 : 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
        />

        <div className="dossier-body">
          <div className="dossier-summary-panel">
            <h3 className="dossier-subhead">Resumen sin spoilers</h3>
            <p className="dossier-summary-text">{obra.resumen}</p>
          </div>

          {castError && (
            <div className="error-panel" role="alert">
              <div>
                <h3 className="error-panel-title">
                  No se pudo cargar el reparto de este expediente
                </h3>
                <p className="error-panel-msg">{castError}</p>
              </div>
              <button
                type="button"
                className="btn-stage-primary"
                onClick={onRetryCast}
              >
                <RotateCcw size={15} aria-hidden="true" />
                <span>Reintentar</span>
              </button>
            </div>
          )}

          {castLoading && !castError && (
            <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Consultando reparto en Supabase...
            </p>
          )}

          {!castLoading && !castError && cast && cast.length > 0 && (
            <div className="dossier-cast-block">
              <div className="dossier-cast-head">
                <h3 className="dossier-subhead">Reparto del expediente</h3>
                <span className="mono">{cast.length} integrantes</span>
              </div>
              <EvidenceBoard
                personajes={cast}
                obraTitulo={obra.titulo}
                obraSlug={obra.slug}
                boardId={`dossier-${obra.slug}`}
                compact
              />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
