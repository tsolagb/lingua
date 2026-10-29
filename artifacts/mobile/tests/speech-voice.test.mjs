import assert from 'node:assert/strict';
import test from 'node:test';
import { isSpeechAvailable, selectPreferredSpeechVoice } from '../lib/speech-voice.ts';

test('prefers an enhanced voice for the selected language', () => {
  const voices = [
    { identifier: 'it-default', language: 'it-IT', quality: 'Default' },
    { identifier: 'it-enhanced', language: 'it-IT', quality: 'Enhanced' },
    { identifier: 'fr-enhanced', language: 'fr-FR', quality: 'Enhanced' },
  ];

  assert.equal(selectPreferredSpeechVoice(voices, 'it-IT')?.identifier, 'it-enhanced');
});

test('normalizes voice locale separators and falls back to the best available language voice', () => {
  const voices = [
    { identifier: 'es-default', language: 'es_ES', quality: 'Default' },
    { identifier: 'es-enhanced-mx', language: 'es-MX', quality: 'Enhanced' },
  ];

  assert.equal(selectPreferredSpeechVoice(voices, 'es-ES')?.identifier, 'es-enhanced-mx');
  assert.equal(selectPreferredSpeechVoice(voices, 'hy-AM'), undefined);
});

test('enables Armenian AI audio but never selects its inaccurate device fallback', () => {
  const armenianVoice = {
    identifier: 'hy-voice',
    language: 'hy-AM',
    quality: 'Enhanced',
  };

  assert.equal(isSpeechAvailable('armenian'), true);
  assert.equal(isSpeechAvailable('hy-AM'), true);
  assert.equal(selectPreferredSpeechVoice([armenianVoice], 'hy-AM'), undefined);
  assert.equal(isSpeechAvailable('it-IT'), true);
});
