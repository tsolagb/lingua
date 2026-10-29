import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CATEGORIES,
  getCumulativePairs,
  getTheologyGuidePairs,
  validateTheologyGuidePairs,
} from '../data/vocabulary.ts';

const churchCategory = CATEGORIES.find(category => category.id === 'church');

test('every Church level 6 term has a non-empty explanation and example', () => {
  assert.ok(churchCategory, 'Church vocabulary category should be present');
  const level6 = churchCategory.levels[5];
  assert.ok(level6, 'Church level 6 should be present');
  assert.ok(level6.pairs.length > 0, 'Church level 6 should have terms');

  const guidePairs = getTheologyGuidePairs();
  assert.deepEqual(
    guidePairs.map(pair => pair.english),
    level6.pairs.map(pair => pair.english),
    'The guide should include every level 6 term in vocabulary order',
  );

  for (const pair of guidePairs) {
    assert.ok(pair.context.explanation.trim(), `${pair.english} should have an explanation`);
    assert.ok(pair.context.example.trim(), `${pair.english} should have an example`);
  }
});

test('the completeness check rejects missing explanations and examples', () => {
  assert.ok(churchCategory);
  const sourcePairs = churchCategory.levels[5].pairs;

  assert.throws(
    () => validateTheologyGuidePairs(sourcePairs.map((pair, index) => (
      index === 0
        ? { ...pair, context: { ...pair.context, explanation: '   ' } }
        : pair
    ))),
    /ecclesiology.*missing an explanation/,
  );

  assert.throws(
    () => validateTheologyGuidePairs(sourcePairs.map((pair, index) => (
      index === 0
        ? { ...pair, context: { ...pair.context, example: '' } }
        : pair
    ))),
    /ecclesiology.*missing an example/,
  );
});

test('Church vocabulary remains available to the existing level game data', () => {
  assert.ok(churchCategory);
  const level6 = churchCategory.levels[5];
  assert.ok(level6);

  const gamePairs = getCumulativePairs(churchCategory, 5);
  for (const pair of level6.pairs) {
    assert.ok(gamePairs.includes(pair), `${pair.english} should remain in cumulative game data`);
    assert.ok(pair.translations.italian.trim(), `${pair.english} should retain its Italian translation`);
    assert.ok(pair.translations.french.trim(), `${pair.english} should retain its French translation`);
    assert.ok(pair.translations.spanish.trim(), `${pair.english} should retain its Spanish translation`);
  }
});
