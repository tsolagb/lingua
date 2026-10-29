import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSentencePracticeLevels } from '../lib/sentence-practice-utils.ts';
import {
  buildSentenceTileBank,
  findReviewWordEnglish,
  isSentenceTileOrderCorrect,
  joinSentenceTiles,
} from '../lib/sentence-game-utils.ts';

const languages = ['italian', 'french', 'spanish', 'armenian'];
const makeItems = (prefix, count) => Array.from({ length: count }, (_, index) => ({
  id: `${prefix}-${index + 1}`,
  english: `English sentence ${prefix} ${index + 1}`,
  translations: Object.fromEntries(languages.map(language => [
    language,
    `${language} sentence ${prefix} ${index + 1}`,
  ])),
}));

test('sentence practice levels contain 8–10 fully translated prompts', () => {
  const levels = buildSentencePracticeLevels({
    simplePhrases: makeItems('simple', 8),
    morning: makeItems('morning', 4),
    cafe: makeItems('cafe', 4),
    station: makeItems('station', 4),
    sunday: makeItems('sunday', 4),
    tomorrow: makeItems('tomorrow', 4),
    casualPhrases: makeItems('casual', 8),
    dialogues: makeItems('dialogue', 24),
    nativePhrases: makeItems('native', 8),
  });
  assert.equal(levels.length, 8);
  for (const level of levels) {
    assert.ok(level.items.length >= 8 && level.items.length <= 10, `${level.title} should have a short set`);
    for (const item of level.items) {
      assert.ok(item.english.trim(), `missing English in ${item.id}`);
      for (const language of languages) {
        assert.ok(item.translations[language]?.trim(), `missing ${language} in ${item.id}`);
      }
    }
  }
});

test('sentence tile bank preserves every answer token and adds distinct distractors', () => {
  const tiles = buildSentenceTileBank('Sono a casa.', ['gatto', 'casa', 'per'], () => 0.5);
  assert.equal(tiles.length, 5);
  assert.deepEqual(tiles.map(tile => tile.text).sort(), ['Sono', 'a', 'casa.', 'gatto', 'per'].sort());
  assert.equal(new Set(tiles.map(tile => tile.id)).size, tiles.length);
  assert.equal(joinSentenceTiles(tiles.filter(tile => ['Sono', 'a', 'casa.'].includes(tile.text))), 'Sono a casa.');
});

test('sentence answer check is insensitive to letter case but retains word order', () => {
  const answer = [
    { id: 0, text: 'La' },
    { id: 1, text: 'stazione' },
    { id: 2, text: 'è' },
    { id: 3, text: 'qui.' },
  ];
  assert.equal(isSentenceTileOrderCorrect(answer, 'La stazione è qui.'), true);
  assert.equal(isSentenceTileOrderCorrect([answer[1], answer[0], answer[2], answer[3]], 'La stazione è qui.'), false);
});

test('missed sentence review maps to an English vocabulary headword when available', () => {
  const vocabulary = [
    { english: 'the', frequencyRank: 1 },
    { english: 'station', frequencyRank: 22 },
    { english: 'train', frequencyRank: 43 },
  ];
  assert.equal(findReviewWordEnglish('The train is at the station.', vocabulary), 'station');
  assert.equal(findReviewWordEnglish('Good morning!', vocabulary), null);
});
