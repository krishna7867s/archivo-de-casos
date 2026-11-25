import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import WorkCover from './WorkCover.jsx';
import { FLAGSHIP_SLUGS, STAGE_THEMES } from '../lib/archivoMeta.js';
import { audioEngine } from '../lib/audioEngine.js';

const INTRO_SESSION_KEY = 'dr_archivo_stage_intro_v3';

function splitTitleLines(titulo = '') {
  if (titulo.includes(':')) {
    const idx = titulo.indexOf(':');
    return [titulo.slice(0, idx + 1).trim(), titulo.slice(idx + 1).trim()];
  }
  const words = titulo.split(' ');
  if (words.length <= 2) return [titulo];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

export default function HeroOpening({
  obras,
  loading,
  error,
  onRetry,
  activeSlug,
  onChangeActiveSlug,
  onOpenObra,
  activeSharedCoverId,
}) {
  const prefersReduced = useReducedMotion();
  const [direction, setDirection] = useState(1);
  const [switchId, setSwitchId] = useState(0);
  const [prevSlug, setPrevSlug] = useState(null);

  const [playIntro] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !window.sessionStorage.getItem(INTRO_SESSION_KEY);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, '1');
    } catch {
      // ignorar
    }
  }, []);

  const flagshipObras = useMemo(
    () =>
      FLAGSHIP_SLUGS.map((slug) => obras.find((obra) => obra.slug === slug)).filter(Boolean),
    [obras]
  );

  const activeObra = flagshipObras.find((o) => o.slug === activeSlug);
  const prevObra = prevSlug
    ? flagshipObras.find((o) => o.slug === prevSlug) || null
    : null;
  const activeTheme = STAGE_THEMES[activeObra?.slug || activeSlug] || STAGE_THEMES.dr1;

  useEffect(() => {
    for (const obra of flagshipObras) {
      if (!obra.portada_url) continue;
      const image = new Image();
      image.referrerPolicy = 'no-referrer';
      image.src = obra.portada_url;
    }
  }, [flagshipObras]);

  const handleSelectCase = (nextSlug) => {
    if (nextSlug === activeSlug) return;
    const prevIdx = FLAGSHIP_SLUGS.indexOf(activeSlug);
    const nextIdx = FLAGSHIP_SLUGS.indexOf(nextSlug);
    audioEngine.playSelectClick();
    setPrevSlug(activeSlug);
    setDirection(nextIdx >= prevIdx ? 1 : -1);
    setSwitchId((n) => n + 1);
    onChangeActiveSlug(nextSlug);
  };

  const handleTabKeyDown = (e, currentIdx) => {
    const tabs = e.currentTarget.parentElement.querySelectorAll('[role=tab]');
    const selectTab = (index) => {
      handleSelectCase(FLAGSHIP_SLUGS[index]);
      tabs[index]?.focus();
    };
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      selectTab((currentIdx + 1) % FLAGSHIP_SLUGS.length);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      selectTab((currentIdx - 1 + FLAGSHIP_SLUGS.length) % FLAGSHIP_SLUGS.length);
    }
  };

  const runIntro = playIntro && !prefersReduced && switchId === 0;
  const isSwitching = switchId > 0 && !prefersReduced;
  const titleLines = splitTitleLines(activeObra?.titulo || activeTheme.shortName);
  const heroLayoutId =
    activeObra && activeSharedCoverId === `hero:${activeObra.slug}` && !prefersReduced
      ? `shared-cover-${activeObra.slug}`
      : undefined;

  return (
    <section
      className={`hero-stage-section ${activeTheme.stageClass}`}
      aria-labelledby="hero-stage-title"
    >
      {/* Ambiente secundario propio de cada entrega (alrededor del arte, sin alterar sus colores) */}
      <motion.div
        className="stage-env-layer"
        aria-hidden="true"
        initial={
          runIntro
            ? { opacity: 0, clipPath: 'inset(100% 0% 0% 0%)' }
            : false
        }
        animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={`env-${activeTheme.id}`}
            className="stage-env-theme-pane"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              delay: isSwitching ? 0.18 : 0,
              duration: prefersReduced ? 0.1 : 0.16,
              ease: 'easeOut',
            }}
          >
            {activeTheme.id === 'dr1' && <div className="env-dr1-tiles" />}
            {activeTheme.id === 'dr2' && (
              <div className="env-dr2-map">
                <span className="env-dr2-coords">
                  24°18′N 153°58′E · JABBERWOCK
                </span>
              </div>
            )}
            {activeTheme.id === 'v3' && <div className="env-v3-spotlights" />}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="container hero-stage-inner">
        <div className="hero-center-grid">
          {/* ~3/5 del espacio: arte con marco oblicuo y mancha rosa gráfica detrás de una esquina */}
          <div className="hero-artwork-column">
            <svg
              className="hero-pink-splatter-bg"
              viewBox="0 0 220 180"
              aria-hidden="true"
            >
              <path
                d="M170 18 C196 28 212 62 198 92 C188 114 214 142 186 158 C162 172 134 150 112 162 C86 176 52 158 46 130 C40 102 18 82 36 56 C52 32 82 42 106 24 C128 8 148 10 170 18 Z"
                fill="#ff1e7c"
                fillOpacity="0.88"
              />
              <circle cx="24" cy="30" r="8" fill="#ff1e7c" />
              <circle cx="204" cy="18" r="6" fill="#ff1e7c" />
              <circle cx="14" cy="148" r="5" fill="#ff1e7c" />
            </svg>

            <div className="hero-artwork-slot">
              <AnimatePresence initial={false}>
                {isSwitching && prevObra && (
                  <motion.div
                    key={`out-${switchId}-${prevObra.slug}`}
                    className="hero-artwork-outgoing"
                    aria-hidden="true"
                    initial={{ x: 0, scale: 1, opacity: 1 }}
                    animate={{
                      scale: [1, 0.95, 0.95],
                      x: [0, 0, direction > 0 ? -44 : 44],
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 0.22,
                      times: [0, 0.35, 1],
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  >
                    <WorkCover obra={prevObra} priority forceContain />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                key={`in-${switchId}-${activeObra?.slug || activeSlug}`}
                layoutId={heroLayoutId}
                className="hero-artwork-motion"
                initial={
                  isSwitching
                    ? {
                        clipPath: direction > 0
                          ? 'polygon(-24% 0%, -24% 0%, 0% 100%, 0% 100%)'
                          : 'polygon(100% 0%, 100% 0%, 124% 100%, 124% 100%)',
                      }
                    : prefersReduced && switchId > 0
                      ? { opacity: 0 }
                      : false
                }
                animate={{
                  opacity: 1,
                  clipPath: isSwitching
                    ? 'polygon(-24% 0%, 100% 0%, 124% 100%, 0% 100%)'
                    : undefined,
                }}
                transition={{
                  layout: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                  delay: isSwitching ? 0.08 : 0,
                  duration: isSwitching ? 0.24 : prefersReduced ? 0.12 : 0.18,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {activeObra ? (
                  <button
                    type="button"
                    className="hero-artwork-trigger"
                    aria-label={`Abrir expediente de ${activeObra.titulo}`}
                    onClick={(e) => onOpenObra(activeObra, e.currentTarget, 'hero')}
                  >
                    <WorkCover obra={activeObra} priority forceContain />
                  </button>
                ) : loading ? (
                  <div className="hero-artwork-skeleton" aria-busy="true" />
                ) : (
                  <WorkCover obra={{ titulo: activeTheme.shortName, slug: activeSlug, tipo: 'principal' }} />
                )}
              </motion.div>

              {/* Barrido diagonal confinado únicamente al marco del arte (~300ms secuencia) */}
              {isSwitching && (
                <motion.div
                  key={`shutter-${switchId}`}
                  className="hero-oblique-shutter"
                  style={{ '--cut-accent': activeTheme.accent }}
                  aria-hidden="true"
                  initial={{
                    x: direction > 0 ? '-130%' : '130%',
                    skewX: direction > 0 ? -18 : 18,
                  }}
                  animate={{
                    x: direction > 0 ? '135%' : '-135%',
                    skewX: direction > 0 ? -18 : 18,
                  }}
                  transition={{
                    delay: 0.06,
                    duration: 0.16,
                    ease: [0.55, 0, 0.45, 1],
                  }}
                />
              )}

              {runIntro && (
                <>
                  <motion.div
                    className="hero-intro-panel is-top-panel"
                    aria-hidden="true"
                    initial={{ x: '0%', y: '0%' }}
                    animate={{ x: '-105%', y: '-105%' }}
                    transition={{
                      delay: 0.06,
                      duration: 0.34,
                      ease: [0.65, 0, 0.35, 1],
                    }}
                  />
                  <motion.div
                    className="hero-intro-panel is-bottom-panel"
                    aria-hidden="true"
                    initial={{ x: '0%', y: '0%' }}
                    animate={{ x: '105%', y: '105%' }}
                    transition={{
                      delay: 0.06,
                      duration: 0.34,
                      ease: [0.65, 0, 0.35, 1],
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {/* ~2/5 del espacio: título, año, descripción breve y Abrir expediente */}
          <div className="hero-copy-slot">
            <div
              key={`copy-${switchId}-${activeObra?.slug || activeSlug}`}
              className="hero-copy-block"
            >
              <div className="hero-title-row">
                <h1 id="hero-stage-title" className="hero-case-title">
                  {titleLines.map((line, i) => (
                    <span key={`${line}-${i}`} className="title-line-mask">
                      <motion.span
                        className="title-line-inner"
                        initial={
                          runIntro || isSwitching
                            ? { x: 28, opacity: 0 }
                            : prefersReduced && switchId > 0
                              ? { opacity: 0 }
                              : false
                        }
                        animate={{ x: 0, opacity: 1 }}
                        transition={{
                          delay: isSwitching
                            ? 0.14 + i * 0.045
                            : runIntro
                              ? 0.2 + i * 0.06
                              : 0,
                          duration: prefersReduced ? 0.1 : 0.15,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        {line}
                      </motion.span>
                    </span>
                  ))}
                </h1>

                <motion.span
                  className="hero-case-year"
                  initial={
                    runIntro || isSwitching
                      ? { y: -12, opacity: 0 }
                      : prefersReduced && switchId > 0
                        ? { opacity: 0 }
                        : false
                  }
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: isSwitching ? 0.2 : runIntro ? 0.36 : 0,
                    duration: prefersReduced ? 0.1 : 0.11,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {activeObra?.anio || ''}
                </motion.span>
              </div>

              <motion.p
                className="hero-case-summary"
                initial={
                  isSwitching || runIntro || (prefersReduced && switchId > 0)
                    ? { opacity: 0 }
                    : false
                }
                animate={{ opacity: 1 }}
                transition={{
                  delay: isSwitching ? 0.22 : runIntro ? 0.32 : 0,
                  duration: prefersReduced ? 0.1 : 0.14,
                }}
              >
                {activeObra?.resumen ||
                  'Seleccioná una de las tres entregas principales para abrir su expediente sin spoilers.'}
              </motion.p>

              {error && (
                <div className="hero-data-error">
                  <p role="alert">No pudimos cargar los expedientes.</p>
                  <button type="button" className="btn-stage-primary" onClick={onRetry}>Reintentar</button>
                </div>
              )}

              {activeObra && (
                <div className="hero-single-action">
                  <button
                    type="button"
                    className="btn-stage-primary"
                    onClick={(e) => onOpenObra(activeObra, e.currentTarget, 'hero')}
                  >
                    <span>Abrir expediente</span>
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Franja inferior con miniatura reconocible y nombre de cada caso principal */}
        <div
          className="hero-table-strip"
          role="tablist"
          aria-label="Seleccionar juego principal"
        >
          {FLAGSHIP_SLUGS.map((slug, idx) => {
            const theme = STAGE_THEMES[slug];
            const obra = flagshipObras.find((o) => o.slug === slug);
            const isSelected = slug === (activeObra?.slug || activeSlug);
            return (
              <motion.button
                key={slug}
                type="button"
                role="tab"
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                className={`hero-seat-btn ${isSelected ? 'is-active' : ''}`}
                style={{ '--seat-accent': theme.accent }}
                initial={runIntro ? { opacity: 0, y: 14 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: runIntro ? 0.38 + idx * 0.08 : 0,
                  duration: 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => handleSelectCase(slug)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
              >
                <div className="hero-seat-thumb" aria-hidden="true">
                  {obra ? <WorkCover obra={obra} priority /> : null}
                </div>

                <div className="hero-seat-info">
                  <span className="hero-seat-meta">
                    <span>{obra?.anio || ''}</span>
                    {isSelected && <span className="hero-seat-active-pill">En cartelera</span>}
                  </span>
                  <span className="hero-seat-name">{theme.shortName}</span>
                </div>

                {isSelected && (
                  <motion.span
                    layoutId={prefersReduced ? undefined : 'hero-seat-underline'}
                    className="hero-seat-underline"
                    aria-hidden="true"
                    transition={{
                      duration: prefersReduced ? 0.01 : 0.12,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
