import assert from 'node:assert/strict';
import test from 'node:test';
import { getGrammarCourse } from '../data/grammar-curriculum.ts';

const LANGUAGES = ['italian', 'french', 'spanish', 'armenian'];

test('the practical grammar course includes open A1 through B2 sections for every language', () => {
  for (const language of LANGUAGES) {
    const course = getGrammarCourse(language);
    assert.deepEqual(course.map(section => section.band), ['A1', 'A2', 'B1', 'B2']);
    assert.ok(course.every(section => section.units.length > 0), `${language} has lessons in every band`);
    assert.ok(course.flatMap(section => section.units).some(unit => unit.id === 'verbFoundations'));
  }
});

test('each language has sentence-based practice for all non-foundation grammar topics', () => {
  for (const language of LANGUAGES) {
    for (const section of getGrammarCourse(language)) {
      for (const unit of section.units) {
        if (unit.foundationArea) continue;
        assert.ok(unit.questions.length >= 3, `${language} ${unit.id} has at least three questions`);
        for (const question of unit.questions) {
          assert.match(question.sentence, /___/, `${language} ${unit.id} has a sentence blank`);
          assert.ok(question.sentenceTranslation.trim().length > 10, `${language} ${unit.id} has a full English translation`);
          assert.equal(question.choices.filter(choice => choice === question.answer).length, 1);
          assert.equal(new Set(question.choices).size, 3);
          assert.ok(question.explanation.trim().length > 20);
        }
      }
    }
  }
});

test('articles, prepositions, and tense foundations remain reachable from the course', () => {
  for (const language of LANGUAGES) {
    const units = getGrammarCourse(language).flatMap(section => section.units);
    assert.deepEqual(units.find(unit => unit.id === 'articles').foundationProgressIndexes, [0, 1, 2]);
    assert.deepEqual(units.find(unit => unit.id === 'prepositions').foundationProgressIndexes, [6, 7]);
    assert.equal(units.find(unit => unit.id === 'verbFoundations').foundationArea, 'verbs');
  }
});
