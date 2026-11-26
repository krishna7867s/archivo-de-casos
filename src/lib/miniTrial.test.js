import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialTrial, trialCases, trialReducer } from './miniTrial.js';

for (const trial of trialCases) {
  test(`minijuicio: error, reintento y resolución de ${trial.title}`, () => {
    const open = { type: 'open', caseId: trial.id };
    const submit = { type: 'submit' };
    let state = trialReducer(initialTrial, open);
    assert.equal(state.selected, null);
    assert.equal(trialReducer(state, submit), state);
    assert.equal(trial.evidence.filter(([id]) => id === trial.answer).length, 1);

    for (const [id] of trial.evidence.filter(([id]) => id !== trial.answer)) {
      state = trialReducer(state, { type: 'select', id });
      state = trialReducer(state, submit);
      assert.equal(state.result, 'wrong');
      assert.equal(trialReducer(state, submit), state);
    }

    state = trialReducer(state, { type: 'select', id: trial.answer });
    assert.equal(state.result, null);
    state = trialReducer(state, submit);
    assert.equal(state.result, 'solved');
    assert.equal(trialReducer(state, submit), state);
    assert.deepEqual(trialReducer(state, open), { ...initialTrial, caseId: trial.id });

    const next = trialCases.find(({ id }) => id !== trial.id);
    assert.deepEqual(trialReducer(state, { type: 'open', caseId: next.id }), {
      ...initialTrial,
      caseId: next.id,
    });
    assert.deepEqual(trialReducer(state, { type: 'open', caseId: null }), initialTrial);
  });
}
