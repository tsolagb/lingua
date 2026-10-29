import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const vocabularyPath = new URL('../data/vocabulary.ts', import.meta.url);
const vocabularySource = readFileSync(vocabularyPath, 'utf8');
const verbsStart = vocabularySource.indexOf("id: 'verbs'");
const nextCategoryStart = vocabularySource.indexOf("id: 'sports'", verbsStart);
const verbsSource = vocabularySource.slice(verbsStart, nextCategoryStart);

test('each verb level has its own distinct words instead of the full previous-level pool', () => {
  assert.notEqual(verbsStart, -1, 'The verb category should exist');
  assert.notEqual(nextCategoryStart, -1, 'The next category should follow the verb category');
  assert.match(verbsSource, /practicePolicy:\s*'current-level-only'/);
  assert.match(
    verbsSource,
    /translationReviewNotice:\s*'[^']*pending review[^']*Western Armenian[^']*verification/i,
    'Verb translations should remain clearly marked as pending review',
  );

  const seenWords = new Set();
  const levels = [...verbsSource.matchAll(/\{\s*pairs:\s*\[([\s\S]*?)\]\s*\}/g)];
  assert.equal(levels.length, 6, 'The verb category should keep six distinct levels');
  levels.forEach(([_, levelSource], levelIndex) => {
    const words = [...levelSource.matchAll(/\bverb\('([^']+)'/g)]
      .map(([, word]) => word.toLocaleLowerCase());
    assert.equal(words.length, 20, `Level ${levelIndex + 1} should contain about 20 verbs`);
    assert.equal(new Set(words).size, words.length, `Level ${levelIndex + 1} should not repeat a verb`);

    for (const word of words) {
      assert.ok(!seenWords.has(word), `${word} should be new in level ${levelIndex + 1}`);
      seenWords.add(word);
    }
  });

  const firstLevelWords = [...levels[0][1].matchAll(/\bverb\('([^']+)'/g)].map(([, word]) => word);
  for (const commonVerb of ['be', 'have', 'do', 'go', 'say', 'get']) {
    assert.ok(firstLevelWords.includes(commonVerb), `${commonVerb} should be in the beginner level`);
  }

  const finalLevelWords = [...levels[5][1].matchAll(/\bverb\('([^']+)'/g)].map(([, word]) => word);
  for (const advancedVerb of ['participate', 'publish', 'expand', 'accomplish', 'satisfy']) {
    assert.ok(finalLevelWords.includes(advancedVerb), `${advancedVerb} should be in the advanced level`);
  }

  assert.match(
    vocabularySource,
    /translationReviewStatus:\s*GENERATED_VOCABULARY_REVIEW_STATUS/,
    'Verb translations should keep the shared pending-review status',
  );

  assert.match(
    vocabularySource,
    /if \(category\.practicePolicy !== 'cumulative'\) \{\s*return category\.levels\[lastLevel\]\.pairs;/,
    'Current-level-only categories should not accumulate every earlier level',
  );
});
