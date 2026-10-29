import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateTypedTranslation } from '../lib/translation-answer.ts';

test('accepts an exact answer despite case and sentence punctuation', () => {
  assert.deepEqual(
    evaluateTypedTranslation('JE voudrais un café!', 'Je voudrais un café.'),
    { correct: true, typos: [] },
  );
});

test('accepts and reports one small spelling error', () => {
  assert.deepEqual(
    evaluateTypedTranslation('Je voudrais un cafa.', 'Je voudrais un café.'),
    { correct: true, typos: [{ typed: 'cafa', expected: 'café' }] },
  );
});

test('accepts a one-character omission in Western Armenian', () => {
  assert.deepEqual(
    evaluateTypedTranslation('Բարե', 'Բարեւ'),
    { correct: true, typos: [{ typed: 'բարե', expected: 'բարեւ' }] },
  );
});

test('does not accept multiple spelling errors, missing words, or changed word order', () => {
  assert.equal(evaluateTypedTranslation('Je voudrai un cafa', 'Je voudrais un café').correct, false);
  assert.equal(evaluateTypedTranslation('Je voudrais café', 'Je voudrais un café').correct, false);
  assert.equal(evaluateTypedTranslation('Un café voudrais je', 'Je voudrais un café').correct, false);
});
