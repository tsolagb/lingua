import assert from 'node:assert/strict';
import test from 'node:test';
import { getLevelRecallProgressPercent } from '../lib/level-progress.ts';

test('level progress reflects the share of required correct recalls', () => {
  const pairs = [
    { english: 'hello' },
    { english: 'goodbye' },
    { english: 'thanks' },
  ];
  const reviews = {
    'italian::hello': {
      correctReviews: 2,
      requiredReviews: 5,
      missCount: 0,
      lastAnsweredAt: 1,
      lastCategoryId: 'basics',
      lastLevelIndex: 0,
    },
    'italian::goodbye': {
      correctReviews: 2,
      requiredReviews: 3,
      missCount: 1,
      lastAnsweredAt: 1,
      lastCategoryId: 'basics',
      lastLevelIndex: 0,
    },
  };

  assert.equal(getLevelRecallProgressPercent(pairs, 'italian', reviews), 36);
});

test('level progress counts duplicate vocabulary once and starts at zero for unseen words', () => {
  const pairs = [{ english: 'hello' }, { english: ' Hello ' }, { english: 'goodbye' }];
  const reviews = {
    'italian::hello': {
      correctReviews: 5,
      requiredReviews: 5,
      missCount: 0,
      lastAnsweredAt: 1,
      lastCategoryId: 'basics',
      lastLevelIndex: 0,
    },
  };

  assert.equal(getLevelRecallProgressPercent(pairs, 'italian', reviews), 50);
  assert.equal(getLevelRecallProgressPercent([], 'italian', reviews), 0);
});
