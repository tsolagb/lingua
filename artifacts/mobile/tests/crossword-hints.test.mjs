import assert from 'node:assert/strict';
import test from 'node:test';
import { getNextCrosswordHintIndex } from '../lib/crossword-hints.ts';

test('reveals the first unknown letter without filling it in', () => {
  assert.equal(getNextCrosswordHintIndex('CASA', new Set(), []), 0);
});

test('skips letters the learner has already entered correctly and previous hints', () => {
  assert.equal(getNextCrosswordHintIndex('CASA', new Set([0]), ['C', undefined, undefined, undefined]), 1);
});

test('keeps one letter unrevealed so the learner still completes the answer', () => {
  assert.equal(getNextCrosswordHintIndex('CASA', new Set([0, 1, 2]), []), null);
  assert.equal(getNextCrosswordHintIndex('CASA', new Set([1]), ['C', undefined, undefined, undefined]), 2);
});

test('returns no hint when the learner has already entered the whole word', () => {
  assert.equal(getNextCrosswordHintIndex('CASA', new Set(), ['C', 'A', 'S', 'A']), null);
});

test('can hint a correction when the learner entered a wrong letter', () => {
  assert.equal(getNextCrosswordHintIndex('CASA', new Set(), ['X', undefined, undefined, undefined]), 0);
});

test('supports hints in Armenian script', () => {
  assert.equal(getNextCrosswordHintIndex('ՀԱՅ', new Set(), []), 0);
});
