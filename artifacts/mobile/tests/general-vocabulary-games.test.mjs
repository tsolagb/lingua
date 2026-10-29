import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import Module from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    const base = path.resolve(projectRoot, request.slice(2));
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};

require.extensions['.ts'] = (module, fileName) => {
  const source = fs.readFileSync(fileName, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  module._compile(output, fileName);
};

const {
  GENERAL_VOCABULARY_GAME_MODES,
  buildGeneralVocabularyGameHref,
  completeGeneralVocabularyStage,
  createRandomGeneralVocabularyBatch,
  getGeneralVocabularyStageGrade,
  getGeneralVocabularyStageProgress,
  getGeneralVocabularyReturnPath,
  parseGeneralVocabularyBatchIndices,
  resolveGeneralVocabularySession,
} = require('../lib/general-vocabulary-session.ts');
const {
  countPracticeTypes,
  gradePracticeScores,
  practiceAverage,
  practiceScoreFromStars,
  summarizeCategoryPracticeScores,
} = require('../lib/practice-grading.ts');
const {
  mergeProgressSnapshots,
  normalizeProgressSnapshot,
} = require('../context/progressSnapshot.ts');
const { getUniqueVocabularyPairs } = require('../data/vocabulary.ts');
const { getGeneralVocabularyLevels } = require('../data/general-vocabulary.ts');

test('all eight game modes route to the exact selected 25-word stage', () => {
  const levels = getGeneralVocabularyLevels('italian');
  const selectedStage = levels[2].stages[4];
  assert.ok(
    levels.slice(0, -1).every(level => level.stages.every(stage => stage.pairs.length === 25)),
    'all established levels keep their original 25-word stages',
  );
  assert.equal(
    levels.at(-1)?.stages.at(-1)?.pairs.length,
    getUniqueVocabularyPairs('italian').length % 25 || 25,
  );

  for (const mode of GENERAL_VOCABULARY_GAME_MODES) {
    const href = buildGeneralVocabularyGameHref(mode.id, {
      kind: 'stage',
      levelIndex: 2,
      stageIndex: 4,
    });
    const url = new URL(href, 'https://linguamatch.invalid');
    const session = resolveGeneralVocabularySession(
      Object.fromEntries(url.searchParams.entries()),
      'italian',
    );

    assert.equal(url.pathname, `/${mode.id}`);
    assert.equal(url.searchParams.get('generalStage'), '1');
    assert.equal(session?.kind, 'stage');
    assert.deepEqual(session?.pairs, selectedStage.pairs);
  }
});

test('a random game batch stays exactly 25 unique words and preserves its indexes', () => {
  const language = 'french';
  const pool = getUniqueVocabularyPairs(language);
  const batch = createRandomGeneralVocabularyBatch(language, () => 0.37);

  assert.equal(batch.indices.length, 25);
  assert.equal(new Set(batch.indices).size, 25);
  assert.deepEqual(batch.pairs, batch.indices.map(index => pool[index]));

  for (const mode of GENERAL_VOCABULARY_GAME_MODES) {
    const href = buildGeneralVocabularyGameHref(mode.id, {
      kind: 'random',
      batchIndices: batch.indices,
      returnTo: 'random-practice',
    });
    const url = new URL(href, 'https://linguamatch.invalid');
    const session = resolveGeneralVocabularySession(
      Object.fromEntries(url.searchParams.entries()),
      language,
    );

    assert.equal(url.pathname, `/${mode.id}`);
    assert.equal(url.searchParams.get('allWords'), '1');
    assert.equal(url.searchParams.get('randomBatch'), '1');
    assert.equal(url.searchParams.get('returnTo'), 'random-practice');
    assert.deepEqual(session?.pairs, batch.pairs);
    assert.ok(session?.pairs.every(pair => batch.pairs.includes(pair)));
  }
});

test('malformed, repeated, short, or out-of-range batch indexes are rejected', () => {
  assert.equal(parseGeneralVocabularyBatchIndices(undefined, 7000), null);
  assert.equal(parseGeneralVocabularyBatchIndices('1.2.2', 7000), null);
  assert.equal(parseGeneralVocabularyBatchIndices(Array.from({ length: 24 }, (_, i) => i).join('.'), 7000), null);
  assert.equal(parseGeneralVocabularyBatchIndices(`${Array.from({ length: 24 }, (_, i) => i).join('.')}.7000`, 7000), null);
  assert.equal(parseGeneralVocabularyBatchIndices(`1x.${Array.from({ length: 24 }, (_, i) => i + 2).join('.')}`, 7000), null);
  assert.equal(resolveGeneralVocabularySession({
    generalStage: '1',
    levelIndex: '1trailing',
    stageIndex: '0',
  }, 'italian'), null);
});

test('stage completion writes the game mode and performance score with stage progress', async () => {
  const calls = [];
  const completeLevel = async (...args) => calls.push(args);

  await completeGeneralVocabularyStage(completeLevel, 6, 3, 2, 'spanish', 'quiz');
  assert.deepEqual(calls, [[
    'general-vocabulary',
    6,
    2,
    'spanish',
    3,
    10,
    { mode: 'quiz', score: 78 },
  ]]);

  const random = resolveGeneralVocabularySession({
    allWords: '1',
    randomBatch: '1',
    batchIndices: Array.from({ length: 25 }, (_, i) => i).join('.'),
  }, 'spanish');
  assert.equal(random?.kind, 'random');
  assert.equal(calls.length, 1);
});

test('stage progress counts practiced words and marks a finished stage complete', () => {
  const pairs = [
    { english: 'hello', italian: 'ciao' },
    { english: 'goodbye', italian: 'arrivederci' },
    { english: 'please', italian: 'per favore' },
    { english: 'thank you', italian: 'grazie' },
  ];
  const reviews = {
    'italian::hello': { correctReviews: 0, requiredReviews: 5, missCount: 0, lastAnsweredAt: 1, lastCategoryId: null, lastLevelIndex: null },
    'italian::please': { correctReviews: 0, requiredReviews: 5, missCount: 1, lastAnsweredAt: 1, lastCategoryId: null, lastLevelIndex: null },
  };
  assert.deepEqual(getGeneralVocabularyStageProgress(pairs, 'italian', reviews), {
    practicedWords: 2,
    total: 4,
    percent: 50,
  });
  assert.deepEqual(getGeneralVocabularyStageProgress(pairs, 'italian', reviews, true), {
    practicedWords: 4,
    total: 4,
    percent: 100,
  });
});

test('stage letter grade requires three distinct modes and maps the averaged performance', () => {
  assert.equal(getGeneralVocabularyStageGrade({ game: 100, quiz: 100 }), null);
  assert.equal(getGeneralVocabularyStageGrade({ game: 100, quiz: 100, spelling: 100 }), 'A+');
  assert.equal(getGeneralVocabularyStageGrade({ game: 100, quiz: 100, spelling: 85 }), 'A-');
  assert.equal(getGeneralVocabularyStageGrade({ game: 70, quiz: 70, spelling: 70 }), 'D');
  assert.equal(getGeneralVocabularyStageGrade({ game: 0, quiz: 0, spelling: 0 }), 'F');
});

test('category-level practice grades require three game types and use their best scores', () => {
  assert.equal(gradePracticeScores({ match: 100, quiz: 100 }), null);
  assert.equal(countPracticeTypes({ match: 100, quiz: 100 }), 2);
  assert.equal(practiceAverage({ match: 100, quiz: 80 }), null);
  assert.equal(practiceAverage({ match: 100, quiz: 80, spelling: 60 }), 80);
  assert.equal(gradePracticeScores({ match: 100, quiz: 100, spelling: 100 }), 'A+');
  assert.equal(gradePracticeScores({ match: 100, quiz: 85, spelling: 85 }), 'B+');
  assert.equal(practiceScoreFromStars(0), 0);
  assert.equal(practiceScoreFromStars(1), 55);
  assert.equal(practiceScoreFromStars(2), 78);
  assert.equal(practiceScoreFromStars(3), 100);
});

test('category grade averages only levels with three practice types and weights each ready level equally', () => {
  assert.deepEqual(
    summarizeCategoryPracticeScores([
      { match: 100, quiz: 100, spelling: 100 },
      { match: 78, quiz: 78, spelling: 78 },
      { match: 100, quiz: 100 },
    ]),
    {
      grade: 'B',
      average: 89,
      gradedLevels: 2,
      totalLevels: 3,
      complete: false,
    },
  );
});

test('a category is fully graded only when every level has three distinct practice types', () => {
  assert.deepEqual(
    summarizeCategoryPracticeScores([
      { match: 100, quiz: 100, spelling: 100 },
      { match: 100, quiz: 100, spelling: 100 },
    ]),
    {
      grade: 'A+',
      average: 100,
      gradedLevels: 2,
      totalLevels: 2,
      complete: true,
    },
  );
  assert.equal(
    summarizeCategoryPracticeScores([{ match: 100, quiz: 100 }]).grade,
    null,
  );
});

test('category-level game scores survive normalization and merge by best score per mode', () => {
  const local = normalizeProgressSnapshot({
    activeLanguage: 'italian',
    progress: {
      'italian::food': {
        0: { completed: false, stars: 0, practiceScores: { match: 70, quiz: 85 } },
      },
    },
  });
  const remote = normalizeProgressSnapshot({
    activeLanguage: 'italian',
    progress: {
      'italian::food': {
        0: { completed: true, stars: 1, practiceScores: { match: 0, crossword: 100 } },
      },
    },
  });
  const merged = mergeProgressSnapshots(local, remote);
  assert.deepEqual(merged.progress['italian::food'][0].practiceScores, {
    match: 70,
    quiz: 85,
    crossword: 100,
  });
});

test('general game screens resolve the shared session and stage completion contract', () => {
  const screens = [
    'game.tsx',
    'flashcards.tsx',
    'quiz.tsx',
    'spelling.tsx',
    'wordsearch.tsx',
    'crossword.tsx',
    'rapidfire.tsx',
    'trueorfalse.tsx',
  ];

  for (const screen of screens) {
    const source = fs.readFileSync(path.join(projectRoot, 'app', screen), 'utf8');
    assert.match(source, /resolveGeneralVocabularySession/, `${screen} resolves the selected batch`);
    assert.match(source, /completeGeneralVocabularyStage/, `${screen} attributes stage completion correctly`);
  }
  const randomPractice = fs.readFileSync(path.join(projectRoot, 'app', 'random-practice.tsx'), 'utf8');
  assert.match(randomPractice, /createRandomGeneralVocabularyBatch/);
  assert.match(randomPractice, /buildGeneralVocabularyGameHref\('quiz'/);
});

test('game exit fallback returns to the selected level or originating word list', () => {
  assert.equal(getGeneralVocabularyReturnPath(undefined, 4), '/general-vocabulary-levels?levelIndex=4');
  assert.equal(getGeneralVocabularyReturnPath('random-practice', 4), '/random-practice');
  assert.equal(getGeneralVocabularyReturnPath(undefined), '/general-vocabulary-levels');
});
