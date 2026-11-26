import React, { useEffect, useReducer, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { audioEngine } from '../lib/audioEngine.js';
import { fetchTrialEvidence, fetchTrialImage } from '../lib/danganronpa.mjs';
import { initialTrial, trialCases, trialReducer } from '../lib/miniTrial.js';

function useEvidence(trial, retry) {
  const [loaded, setLoaded] = useState(null);
  useEffect(() => {
    if (!trial) return;
    const controller = new AbortController();
    const { signal } = controller;
    const urls = [];

    async function load() {
      let rows = [];
      try {
        rows = await fetchTrialEvidence(trial.id);
      } catch {
        if (!signal.aborted) setLoaded({ trial, retry, cards: [], incomplete: true });
        return;
      }
      const expected = new Set(trial.evidence.map(([id]) => id));
      const cards = await Promise.all(rows.filter((row) => expected.has(row.prueba_id)).map(async (row) => {
        try {
          const blob = await fetchTrialImage(row.ruta, signal);
          if (signal.aborted) return row;
          const src = URL.createObjectURL(blob);
          urls.push(src);
          return { ...row, src };
        } catch {
          return row;
        }
      }));
      if (!signal.aborted) {
        const incomplete = cards.length !== expected.size || cards.some((card) => !card.src);
        setLoaded({ trial, retry, cards, incomplete });
      }
    }

    void load();
    return () => {
      controller.abort();
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [trial, retry]);

  return loaded?.trial === trial && loaded.retry === retry ? loaded : null;
}

function EvidenceImage({ card }) {
  if (!card) return null;
  return <img className="case-evidence-image" src={card.src} alt={card.imagen_alt} width={760} height={420} />;
}

export default function MiniTrialModal({ onClose, cast = [] }) {
  const [state, dispatch] = useReducer(trialReducer, initialTrial);
  const [retry, setRetry] = useState(0);
  const [zoom, setZoom] = useState(null);
  const reduced = useReducedMotion();
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const conclusionRef = useRef(null);
  const zoomTriggerRef = useRef(null);
  const trial = trialCases.find(({ id }) => id === state.caseId);
  const evidence = useEvidence(trial, retry);
  const cards = new Map(evidence?.cards.map((card) => [card.prueba_id, card]));
  const debate = state.stage === 'debate';
  const round = trial?.rounds[state.round];
  const correct = state.result === 'correct';
  const zoomed = trial?.evidence.find(([id]) => id === zoom);
  const verified = trial?.evidence.find(([id]) => id === round.answer);
  const character = (name) => cast.find((entry) => entry.obra_slug === 'dr1' && entry.nombre === name);
  const enter = (duration = 0.2, delay = 0) => ({
    initial: reduced ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration, delay },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    audioEngine.setScene('tribunal');
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      audioEngine.setScene('explore');
      trigger?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    dialogRef.current.scrollTop = 0;
    headingRef.current.focus();
  }, [state.caseId, state.stage, state.round, zoom]);

  useEffect(() => {
    if (state.result?.startsWith('wrong')) audioEngine.playWrongBuzz();
    if (state.result === 'correct') {
      audioEngine.playContradictionHit();
      conclusionRef.current?.focus();
    }
    if (state.stage === 'verdict') audioEngine.stopAllMusic();
  }, [state.result, state.stage]);

  const open = (caseId) => {
    audioEngine.setScene('tribunal', { restart: true });
    audioEngine.playSelectClick();
    setZoom(null);
    dispatch({ type: 'open', caseId });
    dialogRef.current.scrollTop = 0;
    headingRef.current.focus();
  };
  const choose = (action) => {
    audioEngine.playSelectClick();
    dispatch(action);
  };
  const closeZoom = () => {
    setZoom(null);
    requestAnimationFrame(() => zoomTriggerRef.current?.focus());
  };
  const showZoom = (id, trigger) => {
    zoomTriggerRef.current = trigger;
    setZoom(id);
  };
  const wrongIndex = trial?.evidence.filter(([id]) => id !== round.answer).findIndex(([id]) => id === state.selected);
  const wrong = state.result === 'wrong-line'
    ? 'Esa frase no es la hipótesis que estamos poniendo a prueba. Buscá la afirmación que el expediente permite refutar.'
    : state.result === 'wrong-evidence' ? round.wrong[wrongIndex] : '';
  const displayEvidence = [...(trial?.evidence ?? [])].sort(([a], [b]) =>
    (cards.get(a)?.orden ?? Infinity) - (cards.get(b)?.orden ?? Infinity));

  return (
    <dialog ref={dialogRef} className="case-trial" aria-labelledby="case-trial-title"
      onCancel={(event) => { event.preventDefault(); if (zoomed) closeZoom(); else onClose(); }}>
      <header className="case-trial-header">
        <h2 ref={headingRef} id="case-trial-title" tabIndex={-1}>
          {zoomed ? zoomed[1] : trial?.title ?? 'Elegí un caso'}
        </h2>
        <button className="btn-secondary-dark" type="button" onClick={onClose}>Cerrar</button>
      </header>

      {zoomed && (
        <section className="case-evidence-zoom">
          <button className="btn-secondary-dark" type="button" onClick={closeZoom}>Volver a las pruebas</button>
          <EvidenceImage card={cards.get(zoom)?.src ? cards.get(zoom) : null} />
          <ul>{zoomed[2].map((line) => <li key={line}>{line}</li>)}</ul>
          <p>{cards.get(zoom)?.descripcion ?? zoomed[3]}</p>
        </section>
      )}

      {!trial ? (
        <ul className="case-trial-list">
          {trialCases.map(({ id, title, difficulty }) => (
            <li key={id}>
              <button className="btn-secondary-dark" type="button" onClick={() => open(id)}>
                {title} · {difficulty}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div hidden={Boolean(zoomed)}>
          <p className="case-trial-fan">Historia original de fans · Sin spoilers</p>
          {state.stage === 'investigate' && (
            <motion.section key={trial.id} {...enter()}>
              <p>{trial.date}</p>
              <p>{trial.incident}</p>
              <h3>Quiénes estaban presentes</h3>
              <ul>{trial.cast.map((name) => (
                <li key={name}>{name}{character(name)?.talento && ` · ${character(name).talento}`}</li>
              ))}</ul>
              <h3>Qué investigamos</h3>
              <p>{trial.question}</p>
            </motion.section>
          )}

          {debate && (
            <fieldset className="case-trial-statement" disabled={correct}>
              <legend>Testimonio {state.round + 1} de {trial.rounds.length} · {round.speaker}</legend>
              {round.lines.map((line, index) => (
                <label key={line} className={state.line === index ? 'is-selected' : ''}>
                  <input type="radio" name="trial-line" checked={state.line === index}
                    onChange={() => choose({ type: 'line', index })} />
                  <span>{line}</span>
                </label>
              ))}
            </fieldset>
          )}

          {(state.stage === 'investigate' || (debate && !correct)) && (
            <motion.section key={`${trial.id}-${state.stage}`} {...enter(0.24, debate ? 0 : 0.16)}>
              <h3>{debate ? 'Elegí una prueba' : 'Pruebas del expediente'}</h3>
              {!evidence && <p role="status">Cargando imágenes de Supabase…</p>}
              {evidence?.incomplete && (
                <p role="status">Faltan algunas imágenes. Podés leer las transcripciones.
                  {' '}<button type="button" className="btn-secondary-dark" onClick={() => setRetry(retry + 1)}>Recargar imágenes</button>
                </p>
              )}
              <div className="case-evidence-grid">
                {displayEvidence.map(([id, title, , description]) => {
                  const card = cards.get(id);
                  return (
                    <article key={id} className={state.selected === id ? 'is-selected' : ''}>
                      <EvidenceImage card={card?.src ? card : null} />
                      <h4>{card?.titulo ?? title}</h4>
                      <p>{card?.descripcion ?? description}</p>
                      <div className="case-evidence-controls">
                        {debate && <label><input type="radio" name="trial-evidence" checked={state.selected === id}
                          onChange={() => choose({ type: 'select', id })} /> Elegir <span className="sr-only">{title}</span></label>}
                        <button type="button" className="btn-secondary-dark" aria-label={`Ampliar ${title}`}
                          onClick={(event) => showZoom(id, event.currentTarget)}>Ampliar</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </motion.section>
          )}

          {state.stage === 'investigate' && (
            <button className="btn-stage-primary" type="button" onClick={() => choose({ type: 'begin' })}>Empezar el juicio</button>
          )}

          {debate && !correct && (
            <>
              <p className="case-trial-hint" role="status">{wrong}</p>
              <button className="btn-stage-primary" type="button"
                disabled={state.line === null || !state.selected || Boolean(state.result)}
                onClick={() => dispatch({ type: 'submit' })}>Presentar prueba</button>
            </>
          )}

          {debate && correct && (
            <motion.section className="case-trial-result" {...enter(0.28)}>
              <h3 ref={conclusionRef} tabIndex={-1}>Contradicción encontrada</h3>
              <div className="case-contradiction">
                <blockquote><mark className="is-solved">{round.lines[round.line]}</mark></blockquote>
                <figure>
                  <EvidenceImage card={cards.get(round.answer)?.src ? cards.get(round.answer) : null} />
                  <figcaption>{verified[1]}<br /><mark className="is-solved">{verified[2][round.detail]}</mark></figcaption>
                </figure>
              </div>
              <p>{round.why}</p>
              <button className="btn-stage-primary" type="button"
                onClick={() => choose({ type: 'next', round: state.round })}>
                {state.round + 1 === trial.rounds.length ? 'Ver veredicto' : 'Siguiente testimonio'}
              </button>
            </motion.section>
          )}

          {state.stage === 'verdict' && (
            <motion.section className="case-trial-result case-trial-verdict"
              initial={reduced ? false : { opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.44 }}>
              <h3>Caso resuelto</h3>
              <p>{trial.verdict}</p>
            </motion.section>
          )}

          <footer className="case-trial-actions">
            <button className="btn-secondary-dark" type="button" onClick={() => open(trial.id)}>Reiniciar caso</button>
            <button className="btn-secondary-dark" type="button" onClick={() => open(null)}>Elegir otro caso</button>
          </footer>
        </div>
      )}
    </dialog>
  );
}
