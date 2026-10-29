import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildFillBlankLevels,
  fillBlankStars,
} from '../lib/fill-blank-game.ts';

const italian = translation => ({
  italian: translation,
  french: translation,
  spanish: translation,
  armenian: translation,
});

const foods = {
  id: 'food',
  name: 'Food',
  levels: [{
    pairs: [
      { english: 'apple', translations: italian('mela'), partOfSpeech: 'noun' },
      { english: 'bread', translations: italian('pane'), partOfSpeech: 'noun' },
      { english: 'water', translations: italian('acqua'), partOfSpeech: 'noun' },
      { english: 'cheese', translations: italian('formaggio'), partOfSpeech: 'noun' },
    ],
  }],
};

const grammar = {
  id: 'prepositions',
  name: 'Prepositions',
  levels: [{
    pairs: [
      { english: 'in', translations: italian('in'), partOfSpeech: 'preposition' },
      { english: 'with', translations: italian('con'), partOfSpeech: 'preposition' },
      { english: 'to', translations: italian('a'), partOfSpeech: 'preposition' },
      { english: 'from', translations: italian('da'), partOfSpeech: 'preposition' },
    ],
  }],
};

const pool = [...foods.levels[0].pairs, ...grammar.levels[0].pairs];

test('fill-in levels are open, use ten questions, and have four choice tiles', () => {
  const levels = buildFillBlankLevels([foods, grammar], pool, 'italian', 3, 10);
  assert.equal(levels.length, 3);
  for (const level of levels) {
    assert.equal(level.questions.length, 10);
    for (const question of level.questions) {
      assert.ok(question.beforeBlank.length > 0);
      assert.ok(question.afterBlank.length > 0);
      assert.ok(question.englishTranslation.includes(question.english));
      assert.equal(question.options.length, 4);
      assert.ok(question.options.some(option => option.word === question.answer));
      assert.ok(question.options.some(option => option.english === question.english));
    }
    assert.equal(level.questions[0].categoryId, 'prepositions');
  }
  assert.ok(levels[0].questions.some(question => question.categoryId === 'food'));
});

test('stars reward clean and low-mistake completion', () => {
  assert.equal(fillBlankStars(0), 3);
  assert.equal(fillBlankStars(2), 2);
  assert.equal(fillBlankStars(4), 1);
});

test('sentence grammar questions retain their sentence, choices, and explanation', () => {
  const prompts = [{
    id: 'preposition-1',
    categoryId: 'prepositions',
    categoryName: 'Prepositions',
    sentence: 'Vado ___ cinema.',
    sentenceTranslation: 'I am going to the cinema.',
    answer: 'al',
    choices: ['al', 'alla', 'nel'],
    explanation: 'A + il combines to form al.',
  }];
  const levels = buildFillBlankLevels([foods, grammar], pool, 'italian', 1, 4, prompts);
  const question = levels[0].questions[0];
  assert.equal(question.beforeBlank, 'Vado ');
  assert.equal(question.afterBlank, ' cinema.');
  assert.equal(question.englishTranslation, 'I am going to the cinema.');
  assert.equal(question.answer, 'al');
  assert.equal(question.options.length, 3);
  assert.equal(question.explanation, 'A + il combines to form al.');
});
