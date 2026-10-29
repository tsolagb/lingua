import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasSpeechVoiceForLanguage,
  READING_PRACTICE_PASSAGES,
} from '../data/reading-practice.ts';

const languages = ['italian', 'french', 'spanish', 'armenian'];

test('reading practice has five short bilingual readings for every supported language', () => {
  assert.equal(READING_PRACTICE_PASSAGES.length, 5);

  for (const passage of READING_PRACTICE_PASSAGES) {
    assert.equal(passage.sentences.length, 4, `${passage.title} should remain a short reading`);
    for (const sentence of passage.sentences) {
      assert.ok(sentence.english.trim(), `${passage.title}: English meaning is required`);
      for (const language of languages) {
        assert.ok(
          sentence.translations[language].trim(),
          `${passage.title}: ${language} sentence is required`,
        );
      }
      assert.match(sentence.translations.armenian, /[\u0530-\u058F]/);
    }
  }
});

test('sentence audio is offered only when the device has a matching language voice', () => {
  assert.equal(hasSpeechVoiceForLanguage([{ language: 'it-IT' }], 'italian'), true);
  assert.equal(hasSpeechVoiceForLanguage([{ language: 'fr_FR' }], 'french'), true);
  assert.equal(hasSpeechVoiceForLanguage([{ language: 'es-MX' }], 'spanish'), true);
  assert.equal(hasSpeechVoiceForLanguage([{ language: 'hy-AM' }], 'armenian'), true);
  assert.equal(hasSpeechVoiceForLanguage([{ language: 'en-US' }], 'armenian'), false);
  assert.equal(hasSpeechVoiceForLanguage([], 'italian'), false);
});
