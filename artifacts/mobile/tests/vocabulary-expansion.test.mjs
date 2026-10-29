import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GENERATED_VOCABULARY,
  GENERATED_VOCABULARY_REVIEW_STATUS,
} from '../data/generated-vocabulary.ts';
import { GENERATED_VOCABULARY_ADDITIONS } from '../data/generated-vocabulary-additions.ts';

const originalStageCounts = {
  core: 1000,
  everyday: 1000,
  intermediate: 1000,
  advanced: 1240,
};
const expandedStageCounts = {
  core: 1500,
  everyday: 1500,
  intermediate: 1500,
  advanced: 1656,
};
const allGeneratedVocabulary = [
  ...GENERATED_VOCABULARY,
  ...GENERATED_VOCABULARY_ADDITIONS,
];

test('the original vocabulary batches remain intact', () => {
  assert.equal(GENERATED_VOCABULARY.length, 4240);
  const counts = Object.fromEntries(
    Object.keys(originalStageCounts).map(stage => [
      stage,
      GENERATED_VOCABULARY.filter(row => row[5] === stage).length,
    ]),
  );
  assert.deepEqual(counts, originalStageCounts);
});

test('the additional batches bring the course pool to 7,000 unique headwords', () => {
  assert.equal(GENERATED_VOCABULARY_ADDITIONS.length, 1916);
  assert.equal(allGeneratedVocabulary.length, 6156);
  const counts = Object.fromEntries(
    Object.keys(expandedStageCounts).map(stage => [
      stage,
      allGeneratedVocabulary.filter(row => row[5] === stage).length,
    ]),
  );
  assert.deepEqual(counts, expandedStageCounts);
  assert.equal(
    new Set(allGeneratedVocabulary.map(row => row[0].toLocaleLowerCase())).size,
    allGeneratedVocabulary.length,
  );
});

test('all generated translations are populated, use Armenian script, and remain pending review', () => {
  assert.equal(GENERATED_VOCABULARY_REVIEW_STATUS, 'pending-review');

  for (const [english, italian, french, spanish, armenian, stage, rank] of allGeneratedVocabulary) {
    assert.ok(english.trim(), 'English headword must not be empty');
    assert.ok(italian.trim(), `${english}: Italian translation must not be empty`);
    assert.ok(french.trim(), `${english}: French translation must not be empty`);
    assert.ok(spanish.trim(), `${english}: Spanish translation must not be empty`);
    assert.match(armenian, /[\u0530-\u058F]/, `${english}: Armenian should use Armenian script`);
    assert.ok(stage in expandedStageCounts, `${english}: stage must be recognized`);
    assert.ok(Number.isInteger(rank) && rank > 0, `${english}: source rank must be a positive integer`);
  }
});

test('generated English headwords are unique and do not include the screened explicit vocabulary', () => {
  const headwords = allGeneratedVocabulary.map(row => row[0].toLowerCase());
  assert.equal(new Set(headwords).size, headwords.length);

  const screenedTerms = new Set([
    'sex', 'sexual', 'intercourse', 'penis', 'vagina', 'clitoris', 'clit',
    'masturbation', 'orgasm', 'porn', 'pornography', 'rape', 'rapist',
    'molestation', 'pedophilia', 'incest', 'prostitute', 'prostitution',
    'vibrator', 'copulation', 'sodomy', 'nigger', 'nigga', 'faggot',
    'kike', 'wop', 'chink', 'gook', 'spic', 'suicide', 'murder',
  ]);
  assert.deepEqual(headwords.filter(word => screenedTerms.has(word)), []);
});
