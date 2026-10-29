import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { THEMATIC_CATEGORIES } from '../data/thematic-vocabulary.ts';

test('requested everyday and conversation topics are represented by dedicated categories', () => {
  const categoryIds = new Set(THEMATIC_CATEGORIES.map(category => category.id));
  for (const id of [
    'fruit-vegetables',
    'grocery-store',
    'restaurant-menus',
    'museum-streets',
    'civic-politics',
    'business-terms',
    'conversation-topics',
  ]) {
    assert.ok(categoryIds.has(id), `missing topic category: ${id}`);
  }

  const vocabularySource = readFileSync(new URL('../data/vocabulary.ts', import.meta.url), 'utf8');
  assert.match(vocabularySource, /id: 'time', name: 'Calendar'/);
  for (const id of ['home', 'school', 'time', 'places']) {
    const categoryStart = vocabularySource.indexOf(`id: '${id}'`);
    const nextCategoryStart = vocabularySource.indexOf("\n    id: '", categoryStart + 1);
    const categorySource = vocabularySource.slice(
      categoryStart,
      nextCategoryStart < 0 ? undefined : nextCategoryStart,
    );
    assert.match(categorySource, /section: 'real-life'/, `${id} should be in everyday situations`);
  }
});

test('new topic levels have complete translations and keep review status visible', () => {
  for (const category of THEMATIC_CATEGORIES) {
    assert.ok(category.levels.length >= 3, `${category.name} should cover multiple levels`);
    for (const level of category.levels) {
      assert.ok(level.pairs.length > 0, `${category.name} has an empty level`);
      for (const pair of level.pairs) {
        assert.ok(pair.english.trim());
        assert.ok(pair.translations.italian.trim(), `${pair.english}: Italian missing`);
        assert.ok(pair.translations.french.trim(), `${pair.english}: French missing`);
        assert.ok(pair.translations.spanish.trim(), `${pair.english}: Spanish missing`);
        assert.match(pair.translations.armenian, /[\u0530-\u058F]/, `${pair.english}: Armenian script missing`);
        assert.equal(pair.translationReviewStatus, 'pending-review');
      }
    }
  }
});
