import React, { useEffect, useReducer, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { audioEngine } from '../lib/audioEngine.js';
import { initialTrial, trialCases, trialReducer } from '../lib/miniTrial.js';

export default function MiniTrialModal({ onClose }) {
  const [state, dispatch] = useReducer(trialReducer, initialTrial);
  const reduced = useReducedMotion();
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const resultRef = useRef(null);
  const trial = trialCases.find(({ id }) => id === state.caseId);
  const solved = state.result === 'solved';

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
    headingRef.current.focus();
  }, [state.caseId]);

  useEffect(() => {
    if (state.result === 'wrong') audioEngine.playWrongBuzz();
    if (state.result === 'solved') {
      audioEngine.stopAllMusic();
      audioEngine.playContradictionHit();
      resultRef.current.focus();
    }
  }, [state.result]);

  const open = (caseId) => {
    audioEngine.setScene('tribunal', { restart: true });
    audioEngine.playSelectClick();
    dispatch({ type: 'open', caseId });
    dialogRef.current.scrollTop = 0;
    headingRef.current.focus();
  };

  return (
    <dialog ref={dialogRef} className="case-trial" aria-labelledby="case-trial-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <header className="case-trial-header">
        <h2 ref={headingRef} id="case-trial-title" tabIndex={-1}>{trial?.title ?? 'Elegí un caso'}</h2>
        <button className="btn-secondary-dark" type="button" onClick={onClose}>Cerrar</button>
      </header>

      {trial ? (
        <motion.article key={trial.id} initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p>{trial.incident}</p>
          <h3>Cronología</h3>
          <ul>{trial.timeline.map((event) => <li key={event}>{event}</li>)}</ul>

          <div className="case-trial-statement">
            <strong>{trial.witness}</strong>
            <blockquote>«{trial.before}<mark className={solved ? 'is-solved' : ''}>{trial.claim}</mark>{trial.after}»</blockquote>
          </div>

          {solved ? (
            <motion.section className="case-trial-result" initial={reduced ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.38 }}>
              <h3 ref={resultRef} tabIndex={-1}>Contradicción encontrada</h3>
              <p>{trial.resolution}</p>
            </motion.section>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); dispatch({ type: 'submit' }); }}>
              <fieldset className="case-trial-evidence">
                <legend>¿Qué prueba contradice la frase marcada?</legend>
                {trial.evidence.map(([id, title, detail]) => (
                  <label key={id} className={state.selected === id ? 'is-selected' : ''}>
                    <input type="radio" name="trial-evidence" checked={state.selected === id}
                      onChange={() => {
                        audioEngine.playSelectClick();
                        dispatch({ type: 'select', id });
                      }} />
                    <span><strong>{title}</strong><br />{detail}</span>
                  </label>
                ))}
              </fieldset>
              <p className="case-trial-hint" role="status">
                {state.result === 'wrong' && <>Esa prueba no contradice la declaración. {trial.hint}</>}
              </p>
              <button className="btn-stage-primary" type="submit" disabled={!state.selected || state.result === 'wrong'}>
                Presentar prueba
              </button>
            </form>
          )}
          <footer className="case-trial-actions">
            <button className="btn-secondary-dark" type="button" onClick={() => open(trial.id)}>Reiniciar caso</button>
            <button className="btn-secondary-dark" type="button" onClick={() => open(null)}>Elegir otro caso</button>
          </footer>
        </motion.article>
      ) : (
        <ul className="case-trial-list">
          {trialCases.map(({ id, title, difficulty }) => (
            <li key={id}>
              <button className="btn-secondary-dark" type="button" onClick={() => open(id)}>
                {title} · {difficulty}
              </button>
            </li>
          ))}
        </ul>
      )}
    </dialog>
  );
}
