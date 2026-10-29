import assert from 'node:assert/strict';
import test from 'node:test';
import { PHRASE_PRACTICE_LEVELS } from '../data/phrase-practice.ts';

const languages = ['italian', 'french', 'spanish', 'armenian'];

test('all three phrase levels are available and have translations in every course language', () => {
  assert.deepEqual(
    PHRASE_PRACTICE_LEVELS.map(level => level.id),
    ['simple', 'casual', 'native'],
  );

  for (const level of PHRASE_PRACTICE_LEVELS) {
    assert.equal(level.phrases.length, 8, `${level.title} should contain eight phrases`);
    for (const phrase of level.phrases) {
      assert.ok(phrase.meaning.trim(), `${level.title}: English meaning is required`);
      for (const language of languages) {
        assert.ok(
          phrase.translations[language].trim(),
          `${level.title} / ${phrase.id}: ${language} translation is required`,
        );
      }
    }
  }
});

test('Western Armenian phrases use Armenian script', () => {
  for (const level of PHRASE_PRACTICE_LEVELS) {
    for (const phrase of level.phrases) {
      assert.match(phrase.translations.armenian, /[\u0530-\u058F]/);
    }
  }
});
