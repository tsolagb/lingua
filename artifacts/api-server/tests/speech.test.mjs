import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const code = ts.transpileModule(readFileSync(new URL(`../src/lib/${file}.ts`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
const comparison = load('speechComparison');
test('comparison is accent/punctuation tolerant but silence and unrelated speech score poorly', () => {
  assert.equal(comparison.transcriptSimilarity('Il caffè è buono!', 'il caffe e buono'), 1);
  assert.equal(comparison.transcriptSimilarity('Bonjour', ''), 0);
  assert.ok(comparison.transcriptSimilarity('Buongiorno', 'no') < 0.3);
  assert.equal(comparison.transcriptSimilarity('Եւ', 'և'), 1);
});

function cacheHarness() {
  const files = new Map();
  let generated = 0;
  const service = load('speechCache', {
    '@google-cloud/storage': { Storage: class {
      bucket() { return { file: key => ({
        download: async () => { if (files.has(key)) return [files.get(key)]; throw { code: 404 }; },
        save: async bytes => { files.set(key, bytes); },
      }) }; }
    } },
    './speechProvider': {
      SPEECH_MODEL: 'test-model', SPEECH_VOICE: 'test-voice', SPEECH_VERSION: 'test-version',
      synthesize: async () => { generated++; await Promise.resolve(); return Buffer.alloc(64, 1); },
    },
  });
  return { service, generated: () => generated, files };
}
test('cache keys normalize whitespace and separate language and speed', () => {
  const { service } = cacheHarness();
  assert.equal(service.speechCacheKey('  Ciao \n mondo ', 'italian', 'normal'), service.speechCacheKey('Ciao mondo', 'italian', 'normal'));
  assert.notEqual(service.speechCacheKey('Ciao', 'italian', 'normal'), service.speechCacheKey('Ciao', 'italian', 'slow'));
  assert.notEqual(service.speechCacheKey('Ciao', 'italian', 'normal'), service.speechCacheKey('Ciao', 'spanish', 'normal'));
});
test('concurrent requests share one generation and subsequent play is a cache hit', async () => {
  const original = process.env.PRIVATE_OBJECT_DIR;
  process.env.PRIVATE_OBJECT_DIR = '/test-bucket/private';
  try {
    const { service, generated, files } = cacheHarness();
    let budgets = 0;
    const requests = await Promise.all(Array.from({ length: 5 }, () => service.getSpeechAudio('Ciao', 'italian', 'normal', () => budgets++)));
    assert.equal(generated(), 1);
    assert.equal(budgets, 1);
    assert.equal(files.size, 1);
    assert.equal(requests[0].cache, 'miss');
    assert.ok(requests.slice(1).every(result => result.cache === 'shared'));
    assert.equal((await service.getSpeechAudio('Ciao', 'italian', 'normal', () => { throw new Error('must not generate'); })).cache, 'hit');
  } finally {
    if (original === undefined) delete process.env.PRIVATE_OBJECT_DIR;
    else process.env.PRIVATE_OBJECT_DIR = original;
  }
});
test('generation denial does not spend a model call and releases the in-flight entry', async () => {
  const original = process.env.PRIVATE_OBJECT_DIR;
  process.env.PRIVATE_OBJECT_DIR = '/test-bucket/private';
  try {
    const { service, generated } = cacheHarness();
    await assert.rejects(service.getSpeechAudio('Buonasera', 'italian', 'normal', () => { throw new Error('budget'); }), /budget/);
    assert.equal(generated(), 0);
    await service.getSpeechAudio('Buonasera', 'italian', 'normal', () => {});
    assert.equal(generated(), 1);
  } finally {
    if (original === undefined) delete process.env.PRIVATE_OBJECT_DIR;
    else process.env.PRIVATE_OBJECT_DIR = original;
  }
});
test('recording validation rejects non-audio before decoding', () => {
  const recording = load('speechRecording');
  assert.equal(recording.recordingExtension(Buffer.from('<html>not audio</html>')), null);
  assert.equal(recording.recordingExtension(Buffer.from('#EXTM3U\nhttps://example.com/audio.mp3')), null);
});
