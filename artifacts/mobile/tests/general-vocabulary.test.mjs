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
    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      path.join(base, 'index.ts'),
    ]) {
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
  getGeneralVocabularyLevels,
  GENERAL_VOCABULARY_LEVEL_SIZE,
  GENERAL_VOCABULARY_STAGE_SIZE,
  GENERAL_VOCABULARY_STAGES_PER_LEVEL,
} = require('../data/general-vocabulary.ts');
const { CATEGORIES, getCumulativePairs, getUniqueVocabularyPairs } =
  require('../data/vocabulary.ts');
const { ITALIAN_FREQUENCY_SOURCE } =
  require('../data/italian-frequency-source.ts');
const { ITALIAN_STUDY_GUIDE_SOURCE } =
  require('../data/italian-study-guide-source.ts');
const {
  NEW_PRACTICAL_WORDS,
  PRACTICAL_TOPIC_HEADWORDS,
} = require('../data/practical-topic-vocabulary.ts');
const { getCategoryGeneralPairs } = require('../data/word-reviews.ts');
const { mergeProgressSnapshots, normalizeProgressSnapshot } =
  require('../context/progressSnapshot.ts');
const { getJourneyPassport } = require('../lib/journey-passport.ts');

test('Journey Passport stamps require every station and remain scoped to the active language', () => {
  const levels = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i, { completed: true, stars: 2 }]));
  const progress = { 'italian::guided-learn': levels };
  assert.equal(getJourneyPassport(progress, 'french').length, 0);
  const legacy = getJourneyPassport(progress, 'italian');
  assert.equal(legacy.length, 1);
  assert.equal(legacy[0].milestoneIndex, 0);
  assert.equal(legacy[0].completedAt, undefined);
  levels[8].completedAt = '2026-10-22T10:30:00.000Z';
  assert.equal(getJourneyPassport(progress, 'italian')[0].completedAt, levels[8].completedAt);
  levels[8].completedAt = '2026-02-31T10:30:00.000Z';
  assert.equal(getJourneyPassport(progress, 'italian')[0].completedAt, undefined);
  levels[3].completed = false;
  assert.equal(getJourneyPassport(progress, 'italian').length, 0);
  assert.equal(getJourneyPassport(progress, 'armenian').length, 0);
});

test('guided completion timestamps survive snapshots and sync without inventing legacy dates', () => {
  const early = '2026-10-22T10:30:00.000Z';
  const late = '2026-10-23T10:30:00.000Z';
  const snapshot = normalizeProgressSnapshot({ progress: {
    'italian::guided-learn': {
      8: { completed: true, stars: 2, completedAt: early },
      17: { completed: true, stars: 1 },
    },
    'french::guided-learn': { 8: { completed: false, stars: 0, completedAt: early } },
  } });
  assert.equal(snapshot.progress['italian::guided-learn'][8].completedAt, early);
  assert.equal(snapshot.progress['italian::guided-learn'][17].completedAt, undefined);
  assert.equal(snapshot.progress['french::guided-learn'][8].completedAt, undefined);
  const incoming = { progress: { 'italian::guided-learn': { 8: { completed: true, stars: 3, completedAt: late } } } };
  for (const merged of [mergeProgressSnapshots(snapshot, incoming), mergeProgressSnapshots(incoming, snapshot)]) {
    assert.equal(merged.progress['italian::guided-learn'][8].completedAt, early);
    assert.equal(merged.progress['italian::guided-learn'][8].stars, 3);
    assert.equal(merged.progress['italian::guided-learn'][17].completedAt, undefined);
    assert.equal(JSON.parse(JSON.stringify(merged)).progress['italian::guided-learn'][8].completedAt, early);
  }
});

test('each language keeps its core word order and stages, with Italian supplements appended', () => {
  for (const language of ['italian', 'french', 'spanish', 'armenian']) {
    const words = getUniqueVocabularyPairs(language);
    const levels = getGeneralVocabularyLevels(language);
    let expectedWordCount = 7000;
    if (language === 'italian') {
      const existingHeadwords = new Set(
        CATEGORIES
          .filter(category => category.id !== 'vocabulary-italian-study-guide')
          .filter(category => !category.availableLanguages || category.availableLanguages.includes('italian'))
          .flatMap(category => category.levels.flatMap(level => level.pairs))
          .filter(pair => pair.english.trim() && pair.translations.italian.trim())
          .map(pair => pair.english.trim().toLocaleLowerCase()),
      );
      const addedGuideHeadwords = new Set(
        ITALIAN_STUDY_GUIDE_SOURCE
          .map(entry => entry.english.trim().toLocaleLowerCase())
          .filter(english => !existingHeadwords.has(english)),
      );
      assert.equal(existingHeadwords.size, 7146, 'the established Italian pool stays intact');
      expectedWordCount += existingHeadwords.size - 7000 + addedGuideHeadwords.size;
    }
    const expectedLevelCount = Math.ceil(expectedWordCount / GENERAL_VOCABULARY_LEVEL_SIZE);

    assert.equal(words.length, expectedWordCount, `${language}: word pool size`);
    assert.equal(levels.length, expectedLevelCount, `${language}: level count`);
    assert.equal(GENERAL_VOCABULARY_LEVEL_SIZE, 250);
    assert.equal(GENERAL_VOCABULARY_STAGE_SIZE, 25);
    assert.equal(GENERAL_VOCABULARY_STAGES_PER_LEVEL, 10);

    const stagedWords = levels.flatMap(level => level.stages.flatMap(stage => stage.pairs));
    assert.equal(stagedWords.length, expectedWordCount, `${language}: all words assigned to stages`);
    assert.equal(
      new Set(stagedWords.map(pair => pair.english.toLocaleLowerCase())).size,
      expectedWordCount,
      `${language}: no repeated English headwords across stages`,
    );
    for (const [levelIndex, level] of levels.entries()) {
      const expectedLevelSize = Math.min(
        GENERAL_VOCABULARY_LEVEL_SIZE,
        expectedWordCount - levelIndex * GENERAL_VOCABULARY_LEVEL_SIZE,
      );
      assert.equal(level.pairs.length, expectedLevelSize, `${language}: level size`);
      assert.equal(
        level.stages.length,
        Math.ceil(expectedLevelSize / GENERAL_VOCABULARY_STAGE_SIZE),
        `${language}: stage count`,
      );
      for (const [stageIndex, stage] of level.stages.entries()) {
        const expectedStageSize = Math.min(
          GENERAL_VOCABULARY_STAGE_SIZE,
          expectedLevelSize - stageIndex * GENERAL_VOCABULARY_STAGE_SIZE,
        );
        assert.equal(stage.pairs.length, expectedStageSize, `${language}: stage size`);
        assert.ok(stage.pairs.every(pair => pair.translations[language].trim()));
      }
    }
  }
});

test('the Italian frequency topic includes every distinct Italian form from the 1,000-row source', () => {
  const category = CATEGORIES.find(item => item.id === 'vocabulary-italian-frequency');
  assert.ok(category);
  assert.deepEqual(category.availableLanguages, ['italian']);
  assert.equal(ITALIAN_FREQUENCY_SOURCE.length, 1000);

  const categoryPairs = category.levels.flatMap(level => level.pairs);
  assert.equal(category.levels.length, 20);
  assert.equal(categoryPairs.length, 998, 'collapse only two exact duplicate source entries');
  assert.ok(categoryPairs.every(pair => pair.translations.italian.trim()));
  assert.ok(categoryPairs.every(pair => pair.translationReviewStatus === 'pending-review'));
  assert.ok(category.translationReviewNotice);

  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  const sourceItalianForms = new Set(ITALIAN_FREQUENCY_SOURCE.map(entry => normalize(entry.italian)));
  const practicedItalianForms = new Set(categoryPairs.map(pair => normalize(pair.translations.italian)));
  assert.deepEqual(practicedItalianForms, sourceItalianForms);
});

test('the Italian study guide topic includes its vocabulary and verb headwords, pending review', () => {
  const category = CATEGORIES.find(item => item.id === 'vocabulary-italian-study-guide');
  assert.ok(category);
  assert.deepEqual(category.availableLanguages, ['italian']);
  assert.equal(category.practicePolicy, 'current-level-only');

  const categoryPairs = category.levels.flatMap(level => level.pairs);
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  const sourcePairKeys = new Set(
    ITALIAN_STUDY_GUIDE_SOURCE.map(entry =>
      `${normalize(entry.english)}::${normalize(entry.italian)}`),
  );
  const practicedPairKeys = new Set(
    categoryPairs.map(pair =>
      `${normalize(pair.english)}::${normalize(pair.translations.italian)}`),
  );

  assert.equal(ITALIAN_STUDY_GUIDE_SOURCE.length, 886);
  assert.equal(categoryPairs.length, ITALIAN_STUDY_GUIDE_SOURCE.length);
  assert.ok(category.levels.length >= Math.ceil(categoryPairs.length / 50));
  assert.ok(category.levels.every(level => level.pairs.length <= 50));
  assert.deepEqual(practicedPairKeys, sourcePairKeys);
  assert.ok(categoryPairs.every(pair => pair.translations.italian.trim()));
  assert.ok(categoryPairs.every(pair => pair.translationReviewStatus === 'pending-review'));
  assert.ok(category.translationReviewNotice);
  assert.ok(ITALIAN_STUDY_GUIDE_SOURCE.every(entry => entry.page >= 2 && entry.page <= 18));

  const existingHeadwords = new Set(
    CATEGORIES
      .filter(item => item.id !== category.id)
      .filter(item => !item.availableLanguages || item.availableLanguages.includes('italian'))
      .flatMap(item => item.levels.flatMap(level => level.pairs))
      .filter(pair => pair.english.trim() && pair.translations.italian.trim())
      .map(pair => pair.english.trim().toLocaleLowerCase()),
  );
  const newGuideHeadwords = new Set(
    ITALIAN_STUDY_GUIDE_SOURCE
      .map(entry => entry.english.trim().toLocaleLowerCase())
      .filter(english => !existingHeadwords.has(english)),
  );
  const italianPool = getUniqueVocabularyPairs('italian');
  assert.deepEqual(
    new Set(italianPool.slice(7146).map(pair => pair.english.trim().toLocaleLowerCase())),
    newGuideHeadwords,
    'new headwords append after the existing Italian stages',
  );
  for (const language of ['french', 'spanish', 'armenian']) {
    assert.equal(
      getUniqueVocabularyPairs(language).length,
      7000,
      `the Italian-only source does not alter the ${language} pool`,
    );
  }
});

test('stage progress survives normalization and merges across devices', () => {
  const first = normalizeProgressSnapshot({
    progress: {
      'italian::general-vocabulary': {
        0: {
          completed: false,
          stars: 0,
          stages: { 0: { completed: true, stars: 2 } },
        },
      },
    },
  });
  assert.equal(
    first.progress['italian::general-vocabulary'][0].stages[0].completed,
    true,
  );

  const merged = mergeProgressSnapshots(first, {
    progress: {
      'italian::general-vocabulary': {
        0: {
          completed: false,
          stars: 0,
          stages: { 1: { completed: true, stars: 3 } },
        },
      },
    },
  });
  const stages = merged.progress['italian::general-vocabulary'][0].stages;
  assert.equal(stages[0].completed, true);
  assert.equal(stages[1].completed, true);
  assert.equal(stages[1].stars, 3);
});

test('topic levels use only their own words and do not repeat headwords between levels', () => {
  for (const category of CATEGORIES) {
    const seen = new Set();
    for (const level of category.levels) {
      for (const pair of level.pairs) {
        const word = pair.english.trim().toLocaleLowerCase();
        assert.ok(!seen.has(word), `${category.id} repeats "${pair.english}" in a later level`);
        seen.add(word);
      }
    }
  }

  const category = CATEGORIES.find(item => item.id === 'animals');
  assert.ok(category);
  assert.equal(
    getCumulativePairs(category, 1).length,
    category.levels[1].pairs.length,
  );
});

test('practical lesson categories are organized into distinct 25-word stages', () => {
  const practicalCategoryIds = [
    'food',
    'home',
    'school',
    'jobs',
    'places',
    'transport',
    'grocery-store',
    'museum-streets',
    'business-terms',
  ];

  for (const id of practicalCategoryIds) {
    const category = CATEGORIES.find(item => item.id === id);
    assert.ok(category, `missing practical category: ${id}`);
    assert.ok(category.levels.length >= 2, `${id} should have multiple stages`);
    assert.ok(category.levels.every(level => level.pairs.length === 25), `${id} stages should have 25 words`);
    assert.ok(category.translationReviewNotice, `${id} should disclose translation review status`);
    assert.equal(
      getCumulativePairs(category, 1).length,
      category.levels[1].pairs.length,
      `${id} should practice only the selected stage`,
    );
    const headwords = category.levels.flatMap(level => level.pairs.map(pair => pair.english.toLowerCase()));
    assert.equal(new Set(headwords).size, headwords.length, `${id} should not repeat headwords`);
    for (const headword of PRACTICAL_TOPIC_HEADWORDS[id]) {
      const pair = category.levels.flatMap(level => level.pairs)
        .find(item => item.english.toLowerCase() === headword.toLowerCase());
      assert.ok(pair, `${id}/${headword}: practical headword missing`);
      assert.equal(pair.translationReviewStatus, 'pending-review');
    }

    for (const pair of category.levels.flatMap(level => level.pairs)) {
      assert.ok(pair.translations.italian.trim(), `${id}/${pair.english}: Italian missing`);
      assert.ok(pair.translations.french.trim(), `${id}/${pair.english}: French missing`);
      assert.ok(pair.translations.spanish.trim(), `${id}/${pair.english}: Spanish missing`);
      assert.match(pair.translations.armenian, /[\u0530-\u058F]/, `${id}/${pair.english}: Armenian script missing`);
    }
  }

  assert.equal(Object.keys(NEW_PRACTICAL_WORDS).length, 13, 'the pool should be filled by only its 13 missing headwords');
});

test('category general practice includes every word from that category only', () => {
  const food = CATEGORIES.find(item => item.id === 'food');
  const church = CATEGORIES.find(item => item.id === 'church');
  assert.ok(food);
  assert.ok(church);

  const foodPairs = food.levels.flatMap(level => level.pairs);
  const foodKeys = new Set(foodPairs.map(pair => pair.english.trim().toLocaleLowerCase()));
  const dueWord = foodPairs[0];
  const unrelatedDueWord = church.levels.flatMap(level => level.pairs)
    .find(pair => !foodKeys.has(pair.english.trim().toLocaleLowerCase()));
  assert.ok(unrelatedDueWord);

  const pairs = getCategoryGeneralPairs('food', [
    { ...dueWord, isReview: true },
    { ...unrelatedDueWord, isReview: true },
  ]);

  assert.equal(pairs.length, foodKeys.size);
  assert.deepEqual(
    new Set(pairs.map(pair => pair.english.trim().toLocaleLowerCase())),
    foodKeys,
  );
  assert.equal(pairs.find(pair => pair.english === dueWord.english)?.isReview, true);
  assert.ok(!pairs.some(pair => pair.english === unrelatedDueWord.english));
});
