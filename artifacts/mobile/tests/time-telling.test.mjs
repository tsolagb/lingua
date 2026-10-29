import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  getTimeTellingChoices,
  isTimeTellingAnswerCorrect,
  TIME_TELLING_EXERCISES,
} from '../data/time-telling.ts';

const languages = ['italian', 'french', 'spanish', 'armenian'];

test('Calendar keeps the existing time category identity and exposes a separate activity', () => {
  const vocabularySource = readFileSync(new URL('../data/vocabulary.ts', import.meta.url), 'utf8');
  assert.match(vocabularySource, /id: 'time', name: 'Calendar'/);

  const levelsSource = readFileSync(new URL('../app/levels.tsx', import.meta.url), 'utf8');
  assert.match(levelsSource, /category\.id === 'time'/);
  assert.match(levelsSource, /testID="calendar-tell-time-entry"/);
  assert.match(levelsSource, /router\.push\('\/time-practice'/);
  assert.match(levelsSource, /categoryId=\$\{category\.id\}/);

  const routeSource = readFileSync(new URL('../app/_layout.tsx', import.meta.url), 'utf8');
  assert.match(routeSource, /<Stack\.Screen name="time-practice"/);
  const screenSource = readFileSync(new URL('../app/time-practice.tsx', import.meta.url), 'utf8');
  assert.match(screenSource, /testID=\{`time-practice-answer-\$\{index\}`\}/);
  assert.match(screenSource, /testID="time-practice-next"/);
  assert.doesNotMatch(screenSource, /useSound|speak\(/);
});

test('time prompts advance from whole hours through common and exact-minute expressions', () => {
  assert.deepEqual(
    TIME_TELLING_EXERCISES.map(exercise => exercise.clock),
    ['1:00', '3:00', '6:30', '12:15', '2:45', '7:28'],
  );
  assert.equal(TIME_TELLING_EXERCISES[0].stage, 'Whole hours');
  assert.equal(TIME_TELLING_EXERCISES[2].stage, 'Half and quarter hours');
  assert.equal(TIME_TELLING_EXERCISES.at(-1).stage, 'Exact minutes');
});

test('answer checking and multiple-choice options use the selected language', () => {
  for (const [questionIndex, exercise] of TIME_TELLING_EXERCISES.entries()) {
    for (const language of languages) {
      const answer = exercise.answers[language];
      const choices = getTimeTellingChoices(questionIndex, language);
      assert.equal(choices.length, 3, `${language} ${exercise.clock} should have three choices`);
      assert.equal(new Set(choices).size, choices.length, `${language} ${exercise.clock} choices should be unique`);
      assert.equal(choices.filter(choice => choice === answer.expression).length, 1);
      assert.equal(isTimeTellingAnswerCorrect(exercise, language, answer.expression), true);
      assert.equal(isTimeTellingAnswerCorrect(exercise, language, choices.find(choice => choice !== answer.expression)), false);
      assert.ok(answer.explanation.trim(), `${language} ${exercise.clock} needs a phrasing explanation`);
      assert.ok(exercise.englishMeaning.includes(exercise.clock), `${exercise.clock} needs complete English feedback`);
    }
  }
  assert.equal(isTimeTellingAnswerCorrect(undefined, 'italian', 'Sono le tre.'), false);
});

test('Italian, French, Spanish, and Western Armenian examples use distinct natural constructions', () => {
  const oneOClock = TIME_TELLING_EXERCISES[0];
  assert.equal(oneOClock.answers.italian.expression, 'È l’una.');
  assert.equal(oneOClock.answers.french.expression, 'Il est une heure.');
  assert.equal(oneOClock.answers.spanish.expression, 'Es la una.');

  const quarterToThree = TIME_TELLING_EXERCISES[4];
  assert.equal(quarterToThree.answers.italian.expression, 'Sono le tre meno un quarto.');
  assert.equal(quarterToThree.answers.french.expression, 'Il est trois heures moins le quart.');
  assert.equal(quarterToThree.answers.spanish.expression, 'Son las tres menos cuarto.');
  assert.match(quarterToThree.answers.armenian.expression, /[\u0530-\u058F]/);
  assert.match(quarterToThree.answers.armenian.explanation, /[\u0530-\u058F]/);
});
