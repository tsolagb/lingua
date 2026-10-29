import assert from 'node:assert/strict';
import test from 'node:test';
import { getCategoryScopedReviewPairs } from './category-review-scope.ts';

test('Church reviews do not import unrelated words like dance', () => {
  const churchWords = [
    { english: 'hymn' },
    { english: 'prayer' },
    { english: 'congregation' },
  ];
  const alreadyInThisLevel = [{ english: 'prayer' }];
  const dueReviews = [
    { english: 'dance', isReview: true },
    { english: 'hymn', isReview: true },
    { english: 'prayer', isReview: true },
  ];

  const scoped = getCategoryScopedReviewPairs(
    dueReviews,
    churchWords,
    alreadyInThisLevel,
  );

  assert.deepEqual(scoped, [{ english: 'hymn', isReview: true }]);
});

test('a due word from an earlier level still returns in its own category', () => {
  const verbs = [{ english: 'run' }, { english: 'speak' }, { english: 'celebrate' }];
  const currentLevel = [{ english: 'celebrate' }];
  const dueReviews = [{ english: 'run', isReview: true }];

  assert.deepEqual(
    getCategoryScopedReviewPairs(dueReviews, verbs, currentLevel),
    dueReviews,
  );
});
