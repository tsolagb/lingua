import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createLessonReviewExit,
  createLessonReviewRoute,
  resolveLessonLanguage,
} from './lessonReviewNavigation.ts';

const lessonResults = {
  categoryId: 'church',
  levelIndex: 3,
  stars: 2,
  mistakes: 1,
  earned: 4,
  language: 'french',
};

test('lesson review opens the completed category and level in the results language', () => {
  assert.deepEqual(createLessonReviewRoute(lessonResults), {
    pathname: '/flashcards',
    params: {
      categoryId: 'church',
      levelIndex: '3',
      language: 'french',
      returnTo: 'results',
      returnStars: '2',
      returnMistakes: '1',
      returnEarned: '4',
      returnLanguage: 'french',
    },
  });
});

test('lesson review uses the previous results screen when navigation history exists', () => {
  assert.deepEqual(createLessonReviewExit(true, lessonResults), { kind: 'back' });
});

test('direct lesson-review opens replace with the original results and stop auto-advance', () => {
  assert.deepEqual(createLessonReviewExit(false, lessonResults), {
    kind: 'replace',
    pathname: '/results',
    params: {
      categoryId: 'church',
      levelIndex: '3',
      stars: '2',
      mistakes: '1',
      earned: '4',
      language: 'french',
      autoAdvance: '0',
    },
  });
});

test('lesson review keeps a valid language and safely falls back for an unknown language', () => {
  assert.equal(resolveLessonLanguage('armenian', 'italian'), 'armenian');
  assert.equal(resolveLessonLanguage('klingon', 'italian'), 'italian');
});
