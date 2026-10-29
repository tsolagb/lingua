import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeArcadeCurrency } from '../src/lib/arcadeProgressMerge.ts';

const category = 'italian::arcade:word-rain';
test('two offline devices retain both distinct round credits without duplicating base XP', () => {
  const first = { [category]: { 1: { completed: true, stars: 0, arcadeXp: 15 } } };
  const second = { [category]: { 2: { completed: true, stars: 0, arcadeXp: 20 } } };
  const merged = { [category]: { ...first[category], ...second[category] } };
  assert.equal(mergeArcadeCurrency({ italian: 25 }, { italian: 30 }, first, second, merged).italian, 45);
  assert.equal(mergeArcadeCurrency({ italian: 45 }, { italian: 30 }, merged, second, merged).italian, 45);
});
test('existing progress without arcade records keeps its original max-balance behavior', () => {
  assert.deepEqual(mergeArcadeCurrency({ italian: 20, french: 5 }, { italian: 10, french: 9 }, {}, {}, {}), { italian: 20, french: 9 });
});
