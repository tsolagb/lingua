import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function harness() {
  let state = null;
  let onFocus = () => {};
  const source = readFileSync(new URL('../lib/guided-path-events.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const module = { exports: {} };
  const mocks = {
    react: {
      useCallback: callback => callback,
      useState: () => [state, next => { state = typeof next === 'function' ? next(state) : next; }],
    },
    'expo-router': { useFocusEffect: callback => { onFocus = callback; } },
  };
  vm.runInNewContext(outputText, { module, exports: module.exports, require: name => mocks[name] });
  return {
    publish: module.exports.publishGuidedPathReturn,
    render: () => module.exports.useGuidedPathReturn(),
    focus: () => onFocus(),
  };
}

const completion = index => ({
  language: 'italian', globalLevelIndex: index, stars: 3, xp: 3,
  isCheckpoint: index % 9 === 8, passed: true,
});

test('celebration waits until the path regains focus, then is consumed only once', () => {
  const h = harness();
  h.render();
  const event = completion(8);
  h.publish(event);
  assert.equal(h.render().event, null, 'do not celebrate under the lesson results');
  h.focus();
  assert.equal(h.render().event, event);
  h.render().consume();
  h.focus();
  assert.equal(h.render().event, null);
});

test('a late animation cleanup cannot erase a newer completed lesson event', () => {
  const h = harness();
  h.render();
  h.publish(completion(0));
  h.focus();
  const oldCelebration = h.render();
  const next = completion(1);
  h.publish(next);
  oldCelebration.consume();
  h.focus();
  assert.equal(h.render().event, next);
});
