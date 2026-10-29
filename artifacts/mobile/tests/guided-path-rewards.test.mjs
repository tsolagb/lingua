import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countCompletedLearningLevels,
  GUIDED_CHEST_XP,
  planGuidedChestReward,
} from '../lib/guided-path-rewards.ts';

const currency = { italian: 8, french: 2, spanish: 0, armenian: 0 };
const completed = { completed: true, stars: 2 };
const prerequisites = (language = 'italian', milestone = 0) => ({
  [`${language}::guided-learn`]: Object.fromEntries(
    Array.from({ length: milestone * 9 + 4 }, (_, index) => [index, { ...completed }]),
  ),
});
const plan = (progress, overrides = {}) => planGuidedChestReward({
  progress, currency, language: 'italian', milestoneIndex: 0,
  milestoneCount: 30, levelsPerMilestone: 9, lessonCategoryId: 'guided-learn', ...overrides,
});

test('a chest cannot be collected early, through a gap, or using another language', () => {
  assert.equal(plan({}), null);
  const incomplete = prerequisites();
  incomplete['italian::guided-learn'][2].completed = false;
  assert.equal(plan(incomplete), null);
  assert.equal(plan(prerequisites('french')), null);
  assert.equal(plan(prerequisites(), { milestoneIndex: 1 }), null);
  const skipped = prerequisites('italian', 2);
  delete skipped['italian::guided-learn'][8];
  assert.equal(plan(skipped, { milestoneIndex: 2 }), null);
});

test('one real bonus is awarded without lesson, star, or another language changes', () => {
  const progress = prerequisites();
  const before = structuredClone(progress);
  const reward = plan(progress);
  assert.equal(reward.xp, GUIDED_CHEST_XP);
  assert.equal(reward.currency.italian, currency.italian + GUIDED_CHEST_XP);
  assert.equal(reward.currency.french, currency.french);
  assert.deepEqual(progress, before);
  assert.deepEqual(reward.progress['italian::guided-learn'], progress['italian::guided-learn']);
  assert.deepEqual(reward.progress['italian::guided-chests'][0], { completed: true, stars: 0 });
  assert.equal(countCompletedLearningLevels(reward.progress), 4);
});

test('claims cannot be farmed and remain claimed after a persistence round trip', () => {
  const reward = plan(prerequisites());
  const saved = JSON.parse(JSON.stringify(reward));
  assert.equal(plan(saved.progress, { currency: saved.currency }), null);
});

test('later milestone and language claims have independent balances and records', () => {
  const first = plan(prerequisites());
  const combined = { ...first.progress, ...prerequisites('french', 2) };
  const next = plan(combined, { currency: first.currency, language: 'french', milestoneIndex: 2 });
  assert.equal(next.currency.italian, first.currency.italian);
  assert.equal(next.currency.french, currency.french + GUIDED_CHEST_XP);
  assert.ok(next.progress['italian::guided-chests'][0].completed);
  assert.ok(next.progress['french::guided-chests'][2].completed);
  assert.equal(countCompletedLearningLevels(next.progress), 26);
});

test('out-of-range and non-integer milestone values are rejected', () => {
  for (const index of [-1, 0.5, 30, NaN, Infinity]) {
    assert.equal(plan(prerequisites(), { milestoneIndex: index }), null);
  }
});
