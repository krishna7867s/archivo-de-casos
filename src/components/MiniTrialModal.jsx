import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ExternalLink, RotateCcw, X } from 'lucide-react';
import { audioEngine } from '../lib/audioEngine.js';

const MINITRIAL_CASES = [
  {
    id: 'juicio-pruebas',
    label: 'Testimonio 01 · Pruebas',
    speaker: 'DECLARACIÓN EN DEBATE',
    beforeWeak: '«Para resolver un juicio basta con ',
    weakPhrase: 'votar por quien parezca sospechoso',
    afterWeak: '».',
    splitLeft: '«Para resolver un juicio basta con',
    splitRight: 'votar por quien parezca sospechoso».',
    hint: 'Volvé a leer la parte marcada: sin refutar una declaración con pruebas, la sospecha sola no resuelve el caso.',
    recommendedSlug: 'ace-attorney',
    connectionReason:
      'Si lo que buscás es desmontar declaraciones falsas presentando la evidencia exacta, Phoenix Wright: Ace Attorney convierte esa mecánica en el corazón de cada juicio.',
    evidences: [
      {
        id: 'ev-contradiccion',
        title: 'Una evidencia que invalida parte del testimonio',
        detail: 'Un dato verificable que contradice directamente lo declarado.',
        isCorrect: true,
      },
      {
        id: 'ev-mayoria',
        title: 'Votación por mayoría sin pruebas',
        detail: 'Decidir el veredicto guiándose solo por impresiones del grupo.',
        isCorrect: false,
      },
      {
        id: 'ev-escape',
        title: 'Acertijos en salas cerradas',
        detail: 'Resolver mecanismos físicos para desbloquear otra salida.',
        isCorrect: false,
      },
    ],
  },
  {
    id: 'decisiones-grupo',
    label: 'Testimonio 02 · Decisiones',
    speaker: 'DECLARACIÓN EN DEBATE',
    beforeWeak: '«En un juego mortal cada participante sobrevive ',
    weakPhrase: 'sin depender de las votaciones del grupo',
    afterWeak: '».',
    splitLeft: '«En un juego mortal cada participante sobrevive',
    splitRight: 'sin depender de las votaciones del grupo».',
    hint: 'Fijate en la frase marcada: la tensión nace justamente de las alianzas frágiles y los votos colectivos.',
    recommendedSlug: 'yttd',
    connectionReason:
      'Your Turn To Die sostiene esa misma presión de grupos atrapados donde las alianzas incómodas y las votaciones por mayoría definen el rumbo.',
    evidences: [
      {
        id: 'ev-estrado',
        title: 'Interrogatorio legal en tribunal',
        detail: 'Cuestionar testigos en una sala judicial clásica.',
        isCorrect: false,
      },
      {
        id: 'ev-alianzas',
        title: 'Votaciones colectivas y alianzas bajo presión',
        detail: 'Cada voto grupal altera quién continúa y en quién confiar.',
        isCorrect: true,
      },
      {
        id: 'ev-rutas',
        title: 'Bifurcaciones de líneas temporales',
        detail: 'Cambiar de rama narrativa para recuperar claves futuras.',
        isCorrect: false,
      },
    ],
  },
  {
    id: 'rutas-acertijos',
    label: 'Testimonio 03 · Rutas',
    speaker: 'DECLARACIÓN EN DEBATE',
    beforeWeak: '«Un misterio de encierro siempre avanza por ',
    weakPhrase: 'un único camino lineal sin acertijos',
    afterWeak: '».',
    splitLeft: '«Un misterio de encierro siempre avanza por',
    splitRight: 'un único camino lineal sin acertijos».',
    hint: 'Revisá el tramo resaltado: las habitaciones de escape y las rutas alternativas reescriben la investigación.',
    recommendedSlug: 'zero-escape',
    connectionReason:
      'Zero Escape: The Nonary Games une salas de escape y rutas ramificadas donde cada decisión revela una pieza distinta del misterio.',
    evidences: [
      {
        id: 'ev-testimonio',
        title: 'Contradicción en una declaración oral',
        detail: 'Señalar una inconsistencia puntual durante un careo.',
        isCorrect: false,
      },
      {
        id: 'ev-voto',
        title: 'Desempate por mayoría',
        detail: 'Negociar votos en una ronda de eliminación grupal.',
        isCorrect: false,
      },
      {
        id: 'ev-rutas-escape',
        title: 'Salas de escape y rutas que reescriben el misterio',
        detail: 'Resolver acertijos y cruzar líneas temporales para llegar a la verdad.',
        isCorrect: true,
      },
    ],
  },
];

export default function MiniTrialModal({ recomendaciones, onClose }) {
  const prefersReduced = useReducedMotion();
  const [caseIndex, setCaseIndex] = useState(0);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(
    MINITRIAL_CASES[0].evidences[0].id
  );
  const [phase, setPhase] = useState('idle'); // 'idle' | 'wrong' | 'impact' | 'verdict'
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const closeBtnRef = useRef(null);
  const timersRef = useRef([]);

  const currentCase = MINITRIAL_CASES[caseIndex];
  const selectedEvidence =
    currentCase.evidences.find((e) => e.id === selectedEvidenceId) ||
    currentCase.evidences[0];

  const matchedRec = useMemo(() => {
    if (!recomendaciones || recomendaciones.length === 0) return null;
    return (
      recomendaciones.find((r) => r.slug === currentCase.recommendedSlug) ||
      recomendaciones[0]
    );
  }, [recomendaciones, currentCase.recommendedSlug]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();

    // Cambiar pista de audio a tensión de tribunal
    audioEngine.setScene('tribunal');

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      clearTimers();
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      // Cancelar música del tribunal y volver limpiamente a exploración
      audioEngine.setScene('explore');
    };
  }, [onClose]);

  const selectCase = (idx) => {
    clearTimers();
    audioEngine.playSelectClick();
    setCaseIndex(idx);
    setSelectedEvidenceId(MINITRIAL_CASES[idx].evidences[0].id);
    setPhase('idle');
    audioEngine.setScene('tribunal');
  };

  const handlePresent = (evidenceOverride) => {
    const chosen = evidenceOverride || selectedEvidence;
    if (!chosen || phase === 'impact') return;

    clearTimers();

    if (!chosen.isCorrect) {
      audioEngine.playWrongBuzz();
      setPhase('wrong');
      return;
    }

    if (prefersReduced) {
      audioEngine.playContradictionHit();
      setPhase('verdict');
      return;
    }

    // Secuencia protagonista (~500ms):
    // 0-120ms: bajan focos + pausa de audio + frase al centro
    // 120-300ms: prueba cruza en diagonal + golpe de audio + salpicadura rosa + división en dos bloques
    // 300-500ms: corte a «Contradicción encontrada» + recomendación desde Supabase
    const audioTimer = audioEngine.playContradictionHit();
    if (audioTimer) timersRef.current.push(audioTimer);

    setPhase('impact');
    const tVerdict = window.setTimeout(() => {
      setPhase('verdict');
    }, 480);
    timersRef.current.push(tVerdict);
  };

  const handleDropEvidence = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    const found = currentCase.evidences.find((ev) => ev.id === draggedId);
    if (found) {
      setSelectedEvidenceId(found.id);
      handlePresent(found);
    }
  };

  return (
    <div
      className={`minitrial-backdrop ${phase === 'impact' ? 'is-dimmed-lights' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="minitrial-heading"
    >
      {/* Escenografía de tribunal: estrados en perspectiva y dos focos laterales */}
      <div className="tribunal-perspective-bg" aria-hidden="true">
        <div className="tribunal-spotlight-left" />
        <div className="tribunal-spotlight-right" />
        <div className="tribunal-podium-lines" />
      </div>

      <div className="minitrial-shell">
        <div className="minitrial-topbar">
          <div
            className="minitrial-case-switcher"
            role="tablist"
            aria-label="Elegir testimonio"
          >
            {MINITRIAL_CASES.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={idx === caseIndex}
                className={`minitrial-tab ${idx === caseIndex ? 'is-active' : ''}`}
                onClick={() => selectCase(idx)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            className="minitrial-exit-btn"
            onClick={onClose}
          >
            <X size={16} aria-hidden="true" />
            <span>Salir del tribunal</span>
          </button>
        </div>

        <div className="minitrial-arena">
          {phase !== 'verdict' ? (
            <>
              <div className="minitrial-eyebrow mono">
                <span id="minitrial-heading">TRIBUNAL · PRESENTÁ LA CONTRADICCIÓN</span>
                <span>{currentCase.speaker}</span>
              </div>

              <div
                className={`minitrial-testimony-stage ${
                  phase === 'impact' ? 'is-impact-focus' : ''
                } ${isDraggingOver ? 'is-drop-ready' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleDropEvidence}
              >
                {phase === 'impact' ? (
                  <div className="minitrial-split-stage" aria-live="assertive">
                    <motion.div
                      className="minitrial-split-half is-left"
                      initial={{ x: 0, y: 0, rotate: 0 }}
                      animate={{ x: -26, y: -12, rotate: -2.4 }}
                      transition={{
                        delay: 0.14,
                        duration: 0.22,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      {currentCase.splitLeft}
                    </motion.div>
                    <motion.div
                      className="minitrial-split-half is-right"
                      initial={{ x: 0, y: 0, rotate: 0 }}
                      animate={{ x: 26, y: 14, rotate: 2.4 }}
                      transition={{
                        delay: 0.14,
                        duration: 0.22,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      {currentCase.splitRight}
                    </motion.div>

                    <motion.div
                      className="minitrial-flying-bullet"
                      aria-hidden="true"
                      initial={{ x: '-110%', y: '75%', rotate: -14, opacity: 1 }}
                      animate={{ x: '115%', y: '-75%', rotate: -14, opacity: 1 }}
                      transition={{
                        delay: 0.11,
                        duration: 0.2,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {selectedEvidence.title}
                    </motion.div>

                    <motion.svg
                      className="minitrial-splatter-svg"
                      viewBox="0 0 260 180"
                      aria-hidden="true"
                      initial={{ scale: 0.2, opacity: 0, rotate: -12 }}
                      animate={{ scale: 1.15, opacity: 1, rotate: 0 }}
                      transition={{
                        delay: 0.14,
                        duration: 0.18,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <path
                        d="M128 90 L98 34 L126 68 L156 18 L142 74 L214 54 L154 96 L228 124 L148 112 L172 164 L126 120 L84 166 L106 112 L34 128 L98 92 L46 58 Z"
                        fill="#ff1e7c"
                      />
                      <circle cx="40" cy="40" r="8" fill="#ff1e7c" />
                      <circle cx="222" cy="42" r="6" fill="#ff1e7c" />
                      <circle cx="212" cy="148" r="9" fill="#ff1e7c" />
                      <circle cx="62" cy="148" r="5" fill="#ff1e7c" />
                    </motion.svg>
                  </div>
                ) : (
                  <blockquote className="minitrial-quote">
                    <span>{currentCase.beforeWeak}</span>
                    <mark
                      className={`minitrial-weak-phrase ${
                        phase === 'wrong' ? 'is-highlighted' : ''
                      }`}
                    >
                      {currentCase.weakPhrase}
                    </mark>
                    <span>{currentCase.afterWeak}</span>
                  </blockquote>
                )}

                {phase === 'wrong' && (
                  <div className="minitrial-wrong-feedback" role="alert">
                    <span>
                      Esa prueba no contradice la frase marcada. {currentCase.hint}
                    </span>
                  </div>
                )}
              </div>

              <div className="minitrial-evidence-dock">
                <div
                  className="minitrial-evidence-grid"
                  role="radiogroup"
                  aria-label="Seleccionar prueba para presentar"
                >
                  {currentCase.evidences.map((ev, idx) => {
                    const isSelected = ev.id === selectedEvidenceId;
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        draggable={!prefersReduced}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', ev.id);
                          setSelectedEvidenceId(ev.id);
                        }}
                        className={`minitrial-evidence-card ${
                          isSelected ? 'is-selected' : ''
                        }`}
                        onClick={() => {
                          audioEngine.playSelectClick();
                          setSelectedEvidenceId(ev.id);
                          if (phase === 'wrong') setPhase('idle');
                        }}
                      >
                        <span className="mono minitrial-ev-num">
                          PRUEBA 0{idx + 1}
                        </span>
                        <span className="minitrial-ev-title">{ev.title}</span>
                        <span className="minitrial-ev-detail">{ev.detail}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="minitrial-present-row">
                  <span className="mono minitrial-present-hint">
                    Elegí una prueba y pulsá Presentar prueba (o arrastrala al testimonio)
                  </span>
                  <button
                    type="button"
                    className="btn-stage-primary minitrial-present-btn"
                    disabled={phase === 'impact'}
                    onClick={() => handlePresent()}
                  >
                    <span>Presentar prueba</span>
                    <ArrowRight size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <motion.div
              className="minitrial-verdict-screen"
              aria-live="polite"
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: prefersReduced ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="minitrial-verdict-banner">
                <span>CONTRADICCIÓN ENCONTRADA</span>
              </div>

              {matchedRec && (
                <div className="minitrial-verdict-card">
                  <div className="minitrial-verdict-meta mono">
                    <span>RECOMENDACIÓN VINCULADA</span>
                    <span>
                      {matchedRec.estudio} · {matchedRec.anio_edicion}
                    </span>
                  </div>

                  <h3 className="minitrial-verdict-title">
                    {matchedRec.titulo}
                  </h3>

                  <p className="minitrial-verdict-connection">
                    {currentCase.connectionReason}
                  </p>

                  <div className="minitrial-verdict-supabase-why">
                    <span className="mono">POR QUÉ SE PARECE:</span> {matchedRec.por_que}
                  </div>

                  <div className="minitrial-verdict-actions">
                    {matchedRec.fuente_url && (
                      <a
                        href={matchedRec.fuente_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="btn-stage-primary"
                      >
                        <span>Ver ficha oficial</span>
                        <ExternalLink size={15} aria-hidden="true" />
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn-secondary-dark"
                      onClick={() =>
                        selectCase((caseIndex + 1) % MINITRIAL_CASES.length)
                      }
                    >
                      <RotateCcw size={15} aria-hidden="true" />
                      <span>Probar otro testimonio</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary-dark"
                      onClick={onClose}
                    >
                      <span>Seguir explorando</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
