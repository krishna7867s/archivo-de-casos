import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initialTrial, trialCases, trialReducer } from './miniTrial.js';

for (const trial of trialCases) {
  test(`${trial.title}: investigación, dos contradicciones y veredicto`, async () => {
    const open = { type: 'open', caseId: trial.id };
    const submit = { type: 'submit' };
    const initial = trialReducer(initialTrial, open);
    assert.ok(trial.rounds.length >= 2);
    assert.ok(trial.evidence.length >= 4);
    assert.equal(new Set(trial.evidence.map(([id]) => id)).size, trial.evidence.length);
    for (const [id, , lines] of trial.evidence) {
      const file = await readFile(new URL(`../../assets/trial-evidence/${trial.id}/${id}.svg`, import.meta.url), 'utf8');
      for (const line of lines) assert.ok(file.includes(line));
    }

    assert.equal(trialReducer(initial, submit), initial);
    let state = trialReducer(initial, { type: 'begin' });
    for (const [index, round] of trial.rounds.entries()) {
      const line = (index) => ({ type: 'line', index });
      const select = (id) => ({ type: 'select', id });
      const advance = { type: 'next', round: index };
      assert.equal(state.round, index);
      assert.equal(state.selected, null);
      assert.equal(state.line, null);
      assert.equal(trialReducer(state, advance), state);
      assert.ok(trial.cast.includes(round.speaker));

      state = trialReducer(state, line(round.line));
      assert.equal(trialReducer(state, submit), state);
      state = trialReducer(state, select(round.answer));
      state = trialReducer(state, line(round.lines.findIndex((_, i) => i !== round.line)));
      state = trialReducer(state, submit);
      assert.equal(state.result, 'wrong-line');

      state = trialReducer(state, line(round.line));
      const incorrect = trial.evidence.filter(([id]) => id !== round.answer);
      assert.equal(round.wrong.length, incorrect.length);
      for (const [id] of incorrect) {
        state = trialReducer(state, select(id));
        state = trialReducer(state, submit);
        assert.equal(state.result, 'wrong-evidence');
      }

      state = trialReducer(state, select(round.answer));
      state = trialReducer(state, submit);
      assert.equal(state.result, 'correct');
      assert.ok(trial.evidence.find(([id]) => id === round.answer)[2][round.detail]);
      assert.equal(trialReducer(state, submit), state);
      assert.equal(trialReducer(state, line(0)), state);
      state = trialReducer(state, advance);
      assert.equal(trialReducer(state, advance), state);
    }
    assert.equal(state.stage, 'verdict');
    assert.deepEqual(trialReducer(state, open), initial);
    const next = trialCases.find(({ id }) => id !== trial.id);
    assert.deepEqual(trialReducer(state, { type: 'open', caseId: next.id }), { ...initialTrial, caseId: next.id });
    assert.deepEqual(trialReducer(state, { type: 'open', caseId: null }), initialTrial);
  });
}
