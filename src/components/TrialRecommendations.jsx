import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, Gavel, RotateCcw } from 'lucide-react';
import { TRIAL_PROMPTS } from '../lib/archivoMeta.js';

export default function TrialRecommendations({
  recomendaciones,
  loading,
  error,
  onRetry,
  onOpenMiniTrial,
}) {
  const prefersReduced = useReducedMotion();
  const [selectedPromptId, setSelectedPromptId] = useState(TRIAL_PROMPTS[0].id);
  const [deductionApproach, setDeductionApproach] = useState('tribunal');
  const [evidenceTick, setEvidenceTick] = useState(0);

  const activePrompt = useMemo(
    () =>
      TRIAL_PROMPTS.find((p) => p.id === selectedPromptId) || TRIAL_PROMPTS[0],
    [selectedPromptId]
  );

  const activeApproach = useMemo(() => {
    if (!activePrompt.approaches) return null;
    return (
      activePrompt.approaches.find((a) => a.id === deductionApproach) ||
      activePrompt.approaches[0]
    );
  }, [activePrompt, deductionApproach]);

  const orderedRecs = useMemo(() => {
    if (!recomendaciones || recomendaciones.length === 0) return [];
    const orderList = activeApproach ? activeApproach.order : activePrompt.order;
    const rankMap = new Map(orderList.map((slug, i) => [slug, i]));
    return [...recomendaciones].sort((a, b) => {
      const ra = rankMap.has(a.slug) ? rankMap.get(a.slug) : 99 + (a.posicion || 0);
      const rb = rankMap.has(b.slug) ? rankMap.get(b.slug) : 99 + (b.posicion || 0);
      return ra - rb;
    });
  }, [recomendaciones, activePrompt, activeApproach]);

  const featuredRec = orderedRecs[0] || null;
  const secondaryRecs = orderedRecs.slice(1);
  const animateEvidence = evidenceTick > 0 && !prefersReduced;

  const handleSelectPrompt = (promptId) => {
    if (promptId === selectedPromptId) return;
    setSelectedPromptId(promptId);
    setEvidenceTick((n) => n + 1);
  };

  const handleSelectApproach = (approachId) => {
    if (approachId === deductionApproach) return;
    setDeductionApproach(approachId);
    setEvidenceTick((n) => n + 1);
  };

  return (
    <section
      id="recomendaciones"
      className="section-block trial-section"
      aria-labelledby="recs-heading"
    >
      <div className="container">
        <div className="recs-header-split">
          <div>
            <h2 id="recs-heading" className="section-title">
              Recomendaciones
            </h2>
            <p className="section-subtitle">
              Elegí qué tensión de Danganronpa querés volver a sentir o entrá al
              minijuicio para descubrir un título presentando una contradicción.
            </p>
          </div>

          <button
            type="button"
            className="btn-minitrial-launch"
            onClick={onOpenMiniTrial}
            disabled={loading || !!error}
          >
            <Gavel size={17} aria-hidden="true" />
            <span>Entrar al tribunal</span>
          </button>
        </div>

        <div className="trial-options-bar">
          <div
            className="trial-options-group"
            role="radiogroup"
            aria-label="Elegir enfoque de recomendación"
          >
            {TRIAL_PROMPTS.map((prompt) => {
              const isActive = prompt.id === selectedPromptId;
              return (
                <button
                  key={prompt.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  className={`trial-option-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleSelectPrompt(prompt.id)}
                >
                  <span className="trial-option-label">{prompt.label}</span>
                </button>
              );
            })}
          </div>

          {activePrompt.approaches && (
            <div
              className="trial-approach-switch"
              role="group"
              aria-label="Enfoque de deducción"
            >
              {activePrompt.approaches.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  aria-pressed={deductionApproach === app.id}
                  className={`approach-chip ${
                    deductionApproach === app.id ? 'is-active' : ''
                  }`}
                  onClick={() => handleSelectApproach(app.id)}
                >
                  {app.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="error-panel" role="alert">
            <div>
              <h3 className="error-panel-title">
                No se pudieron cargar las recomendaciones
              </h3>
              <p className="error-panel-msg">{error}</p>
            </div>
            <button type="button" className="btn-stage-primary" onClick={onRetry}>
              <RotateCcw size={15} aria-hidden="true" />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="principal-trio-grid" aria-busy="true">
            <div className="skeleton-card is-wide-skeleton" />
            <div className="skeleton-card is-wide-skeleton" />
            <div className="skeleton-card is-wide-skeleton" />
          </div>
        )}

        {!loading && !error && featuredRec && (
          <>
            <div className="evidence-rail-stage">
              <div className="evidence-rail-track" aria-hidden="true">
                <span className="evidence-rail-notch" />
              </div>

              <motion.article
                key={`evidence-${featuredRec.slug}-${evidenceTick}`}
                className="trial-featured-card"
                aria-live="polite"
                initial={
                  animateEvidence
                    ? { opacity: 0, x: -64, rotate: -3.2 }
                    : prefersReduced && evidenceTick > 0
                      ? { opacity: 0 }
                      : false
                }
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{
                  duration: animateEvidence ? 0.28 : 0.14,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <motion.span
                  className="evidence-impact-border-top"
                  aria-hidden="true"
                  initial={animateEvidence ? { scaleX: 0 } : false}
                  animate={{ scaleX: 1 }}
                  transition={{
                    delay: animateEvidence ? 0.13 : 0,
                    duration: animateEvidence ? 0.2 : 0.01,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />

                <div className="trial-featured-main">
                  <div className="trial-featured-kicker mono">
                    PRUEBA PRINCIPAL · {activePrompt.label.toUpperCase()}
                  </div>
                  <h3 className="trial-featured-title">{featuredRec.titulo}</h3>

                  <motion.div
                    className="trial-why-reveal"
                    initial={
                      animateEvidence
                        ? { opacity: 0, y: 8 }
                        : prefersReduced && evidenceTick > 0
                          ? { opacity: 0 }
                          : false
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: animateEvidence ? 0.15 : 0,
                      duration: animateEvidence ? 0.18 : 0.12,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <div className="trial-why-label mono">Por qué se parece</div>
                    <p className="trial-why-text">{featuredRec.por_que}</p>
                  </motion.div>
                </div>

                <div className="trial-featured-meta">
                  <div className="mono trial-studio-line">
                    <span>{featuredRec.estudio}</span>
                    <span>{featuredRec.anio_edicion}</span>
                  </div>

                  <div className="catalog-card-platforms">
                    {(featuredRec.etiquetas || []).map((tag) => (
                      <span key={tag} className="platform-pill">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {featuredRec.fuente_url && (
                    <a
                      href={featuredRec.fuente_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn-stage-primary"
                      style={{ alignSelf: 'flex-start' }}
                    >
                      <span>Ver fuente</span>
                      <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </motion.article>
            </div>

            <div className="recs-secondary-grid">
              {secondaryRecs.map((rec) => (
                <article key={rec.slug} className="rec-card">
                  <div className="rec-card-meta mono">
                    <span>{rec.anio_edicion}</span>
                    <span>{rec.estudio}</span>
                  </div>
                  <h4 className="rec-card-title">{rec.titulo}</h4>
                  <p className="rec-card-why">{rec.por_que}</p>
                  <div className="catalog-card-platforms">
                    {(rec.etiquetas || []).map((tag) => (
                      <span key={tag} className="platform-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {rec.fuente_url && (
                    <a
                      href={rec.fuente_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="rec-source-link"
                    >
                      <span>Fuente del juego</span>
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
