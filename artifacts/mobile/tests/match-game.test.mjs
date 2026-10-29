import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWordBatches, shouldReverseReviewRound } from '../lib/match-game.ts';

const pairs = [
  {
    english: 'apple',
    translations: { italian: 'mela', french: 'pomme', spanish: 'manzana', armenian: 'խնձոր' },
  },
  {
    english: 'bread',
    translations: { italian: 'pane', french: 'pain', spanish: 'pan', armenian: 'հաց' },
  },
  {
    english: 'water',
    translations: { italian: 'acqua', french: 'eau', spanish: 'agua', armenian: 'ջուր' },
  },
];

test('standard match batches put English on the left and the target language on the right', () => {
  for (const language of ['italian', 'french', 'spanish', 'armenian']) {
    const [batch] = buildWordBatches([0, 1, 2], pairs, language);

    assert.equal(batch.reversed, false);
    for (const item of batch.left) assert.equal(item.word, pairs[item.id].english);
    for (const item of batch.right) assert.equal(item.word, pairs[item.id].translations[language]);
    assert.deepEqual(new Set(batch.left.map(item => item.id)), new Set(batch.right.map(item => item.id)));
  }
});

test('reversed match batches put the target language on the left and English on the right', () => {
  for (const language of ['italian', 'french', 'spanish', 'armenian']) {
    const [batch] = buildWordBatches([0, 1, 2], pairs, language, true);

    assert.equal(batch.reversed, true);
    for (const item of batch.left) assert.equal(item.word, pairs[item.id].translations[language]);
    for (const item of batch.right) assert.equal(item.word, pairs[item.id].english);
    assert.deepEqual(new Set(batch.left.map(item => item.id)), new Set(batch.right.map(item => item.id)));
  }
});

test('rebalances short final screens so each page has at least three matches', () => {
  const manyPairs = Array.from({ length: 11 }, (_, index) => ({
    english: `word ${index}`,
    translations: {
      italian: `italiano ${index}`,
      french: `français ${index}`,
      spanish: `español ${index}`,
      armenian: `հայերեն ${index}`,
    },
  }));
  const batches = buildWordBatches(
    manyPairs.map((_, id) => id),
    manyPairs,
    'italian',
  );

  assert.ok(batches.length > 1);
  assert.ok(batches.every(batch => batch.left.length >= 3 && batch.left.length <= 5));
  assert.deepEqual(
    new Set(batches.flatMap(batch => batch.left.map(item => item.id))),
    new Set(manyPairs.map((_, id) => id)),
  );
});

test('small mistake-review screens borrow matches only from the supplied practice pool', () => {
  const batches = buildWordBatches([0], pairs, 'italian', false, [0, 1, 2]);
  assert.equal(batches[0].left.length, 3);
  assert.deepEqual(new Set(batches[0].left.map(item => item.id)), new Set([0, 1, 2]));
});

test('does not invent matches when fewer than three words are available', () => {
  const batches = buildWordBatches([0], pairs.slice(0, 1), 'italian');
  assert.equal(batches[0].left.length, 1);
});

test('every second repeated review round reverses the matching direction', () => {
  assert.deepEqual(
    [1, 2, 3, 4].map(shouldReverseReviewRound),
    [false, true, false, true],
  );
});
