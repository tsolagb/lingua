import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../lib/speech-player.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const flush = () => new Promise(resolve => setImmediate(resolve));
function harness(getSpeechAsset, options = {}) {
  const module = { exports: {} };
  const played = [];
  const device = [];
  const mocks = {
    'react-native': { Platform: { OS: options.platform ?? 'ios' } },
    'expo-audio': {
      setAudioModeAsync: async () => {},
      createAudioPlayer: ({ uri }) => {
        let listener;
        return {
          addListener: (_, fn) => { listener = fn; return { remove() {} }; },
          play() {
            played.push(uri);
            listener?.({ playing: true, didJustFinish: false, playbackState: 'ready' });
            queueMicrotask(() => listener?.({ playing: false, didJustFinish: true, playbackState: 'ready' }));
          },
          pause() {}, remove() {},
        };
      },
    },
    'expo-speech': {
      stop: async () => {},
      getAvailableVoicesAsync: options.getVoices ?? (async () => [{ identifier: 'enhanced', language: 'it-IT' }]),
      speak: (text, options) => { device.push({ text, options }); options.onStart(); queueMicrotask(options.onDone); },
    },
    './speech-cache': { getSpeechAsset, normalizeSpokenText: text => text.trim().replace(/\s+/g, ' '), protectCachedSpeech() {} },
    './speech-voice': {
      isDeviceSpeechAvailable: lang => lang !== 'armenian',
      selectPreferredSpeechVoice: voices => voices[0],
    },
  };
  new Function('require', 'module', 'exports', code)(name => {
    if (!(name in mocks)) throw new Error(`Unexpected dependency ${name}`);
    return mocks[name];
  }, module, module.exports);
  return { ...module.exports, played, device };
}
test('a new manual word cancels the old wait immediately; late downloads never autoplay', async () => {
  let finishOld;
  const calls = [];
  const player = harness(text => {
    calls.push(text);
    return text === 'old' ? new Promise(resolve => { finishOld = resolve; }) : Promise.resolve({ uri: text });
  });
  player.speakText('old', 'italian');
  player.speakText('new', 'italian');
  await flush();
  assert.deepEqual(calls, ['old', 'new']);
  assert.deepEqual(player.played, ['new']);
  finishOld({ uri: 'old' });
  await flush();
  assert.deepEqual(player.played, ['new']);
});
test('muting/stopping cancels a pending word and queued correct-answer audio', async () => {
  let finish;
  const player = harness(() => new Promise(resolve => { finish = resolve; }));
  player.speakText('one', 'italian', true, 'normal', 'auto');
  player.speakText('two', 'italian', true, 'normal', 'auto');
  player.stopSpeaking();
  finish({ uri: 'one' });
  await flush();
  assert.deepEqual(player.played, []);
  assert.equal(player.getSpeechPlaybackState().status, 'idle');
});
test('offline Italian uses the enhanced device voice with a genuinely slower option', async () => {
  const player = harness(async () => { throw new Error('offline'); });
  player.speakText('Ciao', 'italian', false, 'slow');
  await flush();
  assert.equal(player.device[0].options.voice, 'enhanced');
  assert.equal(player.device[0].options.rate, 0.7);
});
test('offline Armenian never plays the known-incorrect device voice', async () => {
  const player = harness(async () => { throw new Error('offline'); });
  player.speakText('Բարեւ', 'armenian');
  await flush();
  assert.equal(player.device.length, 0);
  assert.equal(player.getSpeechPlaybackState().status, 'unavailable');
});
test('disabling auto-speak clears queued automatic words without canceling manual playback', async () => {
  const player = harness(async text => ({ uri: text }));
  player.speakText('manual', 'italian');
  player.speakText('queued-auto', 'italian', true, 'normal', 'auto');
  player.setSpeechPreferences(false, false);
  await flush();
  assert.deepEqual(player.played, ['manual']);
});
test('delayed callbacks cannot start audio after the learner mutes', async () => {
  const player = harness(async text => ({ uri: text }));
  const delayedGameCallback = () => player.speakText('late-answer', 'italian', true, 'normal', 'auto');
  player.setSpeechPreferences(true, true);
  delayedGameCallback();
  await flush();
  assert.deepEqual(player.played, []);
  assert.equal(player.getSpeechPlaybackState().status, 'idle');
});
test('a browser with a never-resolving voice list leaves loading and reports unavailable', async () => {
  const player = harness(async () => { throw new Error('offline'); }, {
    platform: 'web', getVoices: () => new Promise(() => {}),
  });
  player.speakText('Ciao', 'italian');
  await new Promise(resolve => setTimeout(resolve, 1650));
  assert.equal(player.getSpeechPlaybackState().status, 'unavailable');
  assert.equal(player.device.length, 0);
});
