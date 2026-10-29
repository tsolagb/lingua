import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GUIDED_MILESTONES, GUIDED_CATEGORY_ID, getGuidedLevel, getGuidedLevelCount,
  getGuidedCurrentLevelIndex, getGuidedMilestoneExamples, getGuidedGrammarRule, scoreGuidedLesson,
} from '../data/guided-curriculum.ts';
import {
  recordGuidedSentenceAnswer, getDueGuidedSentences, mergeGuidedSentenceReviews,
} from '../data/guided-sentence-reviews.ts';
import { normalizeProgressSnapshot, mergeProgressSnapshots } from '../context/progressSnapshot.ts';

const languages = ['italian', 'french', 'spanish', 'armenian'];

test('all four courses generate 30 milestones and 270 usable mixed-exercise levels', () => {
  assert.equal(GUIDED_MILESTONES.length, 30);
  assert.equal(getGuidedLevelCount(), 270);
  for (const language of languages) {
    for (let milestone = 0; milestone < 30; milestone++) {
      const examples = getGuidedMilestoneExamples(language, milestone);
      assert.ok(examples.length >= 2, `${language} milestone ${milestone}: grammar examples`);
      assert.ok(getGuidedGrammarRule(language, milestone).length > 40);
      for (let index = 0; index < 9; index++) {
        const level = getGuidedLevel(language, milestone, index);
        const label = `${language} ${milestone}/${index}`;
        assert.equal(level.globalLevelIndex, milestone * 9 + index);
        assert.equal(level.isCheckpoint, index === 8);
        assert.ok(level.exercises.length >= 10 && level.exercises.length <= 15, `${label}: exercise count ${level.exercises.length}`);
        assert.ok(level.vocabulary.length >= 3, `${label}: vocabulary`);
        assert.equal(new Set(level.exercises.map(item => item.id)).size, level.exercises.length);
        for (const item of level.exercises) {
          if (item.kind === 'choice') {
            assert.ok(item.prompt.trim() && item.answer.trim(), label);
            assert.equal(item.options.filter(option => option === item.answer).length, 1, label);
            assert.ok(item.options.length >= 3, `${label}: needs challenging choices`);
            // Managed AI narration now supports Armenian too; only its device-voice fallback is disabled.
          }
          if (item.kind === 'build') {
            assert.deepEqual([...item.tiles].sort(), item.target.trim().split(/\s+/).sort(), label);
            assert.ok(item.english && item.target);
          }
          if (item.kind === 'match') {
            assert.ok(item.pairs.length >= 3, label);
            assert.equal(new Set(item.pairs.map(pair => pair.translations[language])).size, item.pairs.length, label);
          }
        }
      }
    }
  }
});

test('new words return in the following two levels rather than only in the data pool', () => {
  const first = getGuidedLevel('italian', 1, 0);
  const following = [getGuidedLevel('italian', 1, 1), getGuidedLevel('italian', 1, 2)];
  const practiced = new Set(following.flatMap(level => level.exercises.flatMap(exercise =>
    exercise.kind === 'match' ? exercise.pairs.map(pair => pair.english)
      : 'pair' in exercise && exercise.pair ? [exercise.pair.english] : [],
  )));
  for (const word of first.vocabulary.slice(0, first.newWordCount)) {
    assert.ok(practiced.has(word.english), `${word.english} returns in an active exercise`);
  }
});

test('progression stops at the first incomplete level, including milestone checkpoints', () => {
  const complete = new Set(Array.from({ length: 8 }, (_, index) => index));
  complete.add(10);
  const lookup = (category, index) => category === GUIDED_CATEGORY_ID && complete.has(index);
  assert.equal(getGuidedCurrentLevelIndex(lookup), 8);
  complete.add(8);
  assert.equal(getGuidedCurrentLevelIndex(lookup), 9);
  assert.equal(getGuidedCurrentLevelIndex(() => true), 270);
  assert.equal(scoreGuidedLesson(0, 0, true).passed, false);
  assert.equal(scoreGuidedLesson(7, 10, false).passed, true);
  assert.equal(scoreGuidedLesson(7, 10, true).passed, false);
  assert.equal(scoreGuidedLesson(8, 10, true).passed, true);
  assert.equal(scoreGuidedLesson(10, 10, true, 3).xp, 0);
});

test('sentence misses need three correct recalls and remain scoped to their language', () => {
  const sentence = { sentenceId: 'intro-1', english: 'I am at home.', target: 'Sono a casa.' };
  let reviews = recordGuidedSentenceAnswer({}, 'italian', sentence, false, 1);
  assert.equal(getDueGuidedSentences(reviews, 'italian').length, 1);
  assert.equal(getDueGuidedSentences(reviews, 'french').length, 0);
  for (let count = 1; count <= 3; count++) {
    reviews = recordGuidedSentenceAnswer(reviews, 'italian', sentence, true, count + 1);
    assert.equal(getDueGuidedSentences(reviews, 'italian').length, count < 3 ? 1 : 0);
  }
  const missedAgain = recordGuidedSentenceAnswer(reviews, 'italian', sentence, false, 10);
  assert.equal(getDueGuidedSentences(missedAgain, 'italian')[0].correctReviews, 0);
  const merged = mergeGuidedSentenceReviews(missedAgain, reviews);
  assert.equal(getDueGuidedSentences(merged, 'italian').length, 1);
  const snapshot = normalizeProgressSnapshot({ guidedSentenceReviews: missedAgain });
  assert.deepEqual(mergeProgressSnapshots(snapshot, {}).guidedSentenceReviews, missedAgain);
});
