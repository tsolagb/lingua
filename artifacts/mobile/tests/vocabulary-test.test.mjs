import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gradeVocabularyTest,
  isBetterVocabularyTestScore,
  scoreVocabularyAnswer,
} from '../lib/vocabulary-test.ts';

test('vocabulary answers award full credit for exact answers regardless of letter case or outer spaces', () => {
  assert.equal(scoreVocabularyAnswer('  CAFFÈ ', 'caffè'), 1);
});

test('minor spelling and accent errors earn half credit', () => {
  assert.equal(scoreVocabularyAnswer('cafe', 'café'), 0.5);
  assert.equal(scoreVocabularyAnswer('manger', 'manger'), 1);
  assert.equal(scoreVocabularyAnswer('mangre', 'manger'), 0.5);
});

test('empty and substantial errors earn no credit', () => {
  assert.equal(scoreVocabularyAnswer('', 'casa'), 0);
  assert.equal(scoreVocabularyAnswer('cane', 'casa'), 0);
});

test('letter grades follow percentage bands', () => {
  assert.equal(gradeVocabularyTest(9, 10), 'A');
  assert.equal(gradeVocabularyTest(8, 10), 'B');
  assert.equal(gradeVocabularyTest(7, 10), 'C');
  assert.equal(gradeVocabularyTest(6, 10), 'D');
  assert.equal(gradeVocabularyTest(5.5, 10), 'F');
});

test('a level keeps its best percentage and only replaces it with a higher grade', () => {
  assert.equal(isBetterVocabularyTestScore(8, 10, 7, 10), true);
  assert.equal(isBetterVocabularyTestScore(7, 10, 8, 10), false);
  assert.equal(isBetterVocabularyTestScore(4, 5, 7, 10), true);
  assert.equal(isBetterVocabularyTestScore(4.5, 5, 7, 10), true);
});
