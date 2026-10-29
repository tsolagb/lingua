const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const typescript = require('typescript');

const mobileRoot = path.resolve(__dirname, '..');

function loadTypeScript(relativePath) {
  const filename = path.join(mobileRoot, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2020,
    },
  });
  const loadedModule = new Module(filename, module);
  loadedModule.filename = filename;
  loadedModule.paths = Module._nodeModulePaths(path.dirname(filename));
  loadedModule._compile(outputText, filename);
  return loadedModule.exports;
}

const foundations = loadTypeScript('data/italian-foundations.ts');
const verbs = loadTypeScript('data/verb-exercises.ts');
const { canAdvanceAfterAnswer, getPracticeStars } = loadTypeScript('data/lesson-practice.ts');
const italianGapExercises = verbs.VERB_GAP_EXERCISES.italian;
const italianSentenceExercises = verbs.VERB_SENTENCE_EXERCISES.italian;

function assertAnswerOccursOnce(question, context) {
  const choices = question.choices ?? question.options;
  const matches = choices.filter(choice => choice === question.answer).length;
  assert.equal(
    matches,
    1,
    `${context}: expected answer ${JSON.stringify(question.answer)} exactly once in ${JSON.stringify(choices)}`,
  );
}

function getAnswers(group) {
  return foundations.ARTICLE_GROUPS[group].questions.map(question => question.answer);
}

test('every Italian multiple-choice answer is present exactly once', () => {
  const foundationQuestions = [
    ...Object.values(foundations.ARTICLE_GROUPS).flatMap(group => group.questions),
    ...foundations.CARDINAL_QUESTIONS,
    ...foundations.ORDINAL_QUESTIONS,
    ...foundations.ITALIAN_ALPHABET_QUESTIONS,
  ];

  foundationQuestions.forEach((question, index) => {
    assertAnswerOccursOnce(question, `Italian foundation question ${index + 1} (${question.prompt})`);
  });
  italianGapExercises.forEach((exercise, index) => {
    assertAnswerOccursOnce(exercise, `Italian verb exercise ${index + 1} (${exercise.english})`);
  });
});

test('every Italian foundation sentence has a full English sentence translation', () => {
  const sentenceQuestions = Object.values(foundations.ARTICLE_GROUPS)
    .flatMap(group => group.questions)
    .filter(question => question.sentence);
  assert.ok(sentenceQuestions.length > 0);

  for (const question of sentenceQuestions) {
    assert.ok(
      question.sentenceTranslation && question.sentenceTranslation.trim().split(/\s+/).length >= 4,
      `${question.prompt}: expected a full sentence translation`,
    );
  }
});

test('definite article answer keys use the expected forms', () => {
  assert.deepEqual(getAnswers('definite'), [
    'il', 'lo', 'la', 'l’', 'l’', 'lo', 'i', 'gli', 'le', 'gli', 'gli', 'le',
  ]);
  assert.ok(getAnswers('definite').some(answer => ['il', 'lo', 'la', 'l’'].includes(answer)));
  assert.ok(getAnswers('definite').some(answer => ['i', 'gli', 'le'].includes(answer)));
});

test('every gli answer explains the full masculine plural article rule', () => {
  const gliQuestions = foundations.ARTICLE_GROUPS.definite.questions
    .filter(question => question.answer === 'gli');
  assert.ok(gliQuestions.length > 0);

  for (const question of gliQuestions) {
    const explanation = question.explanation.toLowerCase();
    for (const situation of ['vowel', 'z', 'gn', 'ps/pn', 'x', 'y', 's + a consonant', 'i libri']) {
      assert.ok(
        explanation.includes(situation),
        `${question.prompt}: explanation should include ${situation}`,
      );
    }
  }
});

test('singular indefinite article answer keys use the expected forms', () => {
  assert.deepEqual(getAnswers('indefinite'), [
    'un', 'uno', 'una', 'un', 'un’', 'uno', 'un’', 'una',
  ]);
  assert.ok(getAnswers('indefinite').every(answer => ['un', 'uno', 'una', 'un’'].includes(answer)));
  assert.ok(!getAnswers('indefinite').some(answer => ['dei', 'degli', 'delle'].includes(answer)));
});

test('partitive article answer keys include the expected plural forms', () => {
  assert.deepEqual(getAnswers('partitive'), [
    'dei', 'degli', 'delle', 'degli', 'delle', 'degli', 'del', 'dello', 'dell’',
  ]);
  const pluralAnswers = getAnswers('partitive').slice(0, 6);
  assert.deepEqual([...new Set(pluralAnswers)].sort(), ['degli', 'dei', 'delle']);
});

test('Italian sentence-building and fill-in exercises cover present, past, and future', () => {
  const requiredTenses = ['Present', 'Past', 'Future'];
  for (const [exerciseType, exercises] of [
    ['sentence-building', italianSentenceExercises],
    ['fill-in', italianGapExercises],
  ]) {
    for (const tense of requiredTenses) {
      assert.ok(
        exercises.some(exercise => exercise.tense === tense),
        `Italian ${exerciseType} exercises should include ${tense}`,
      );
    }
  }
});

test('only a correct response allows the learner to advance', () => {
  assert.equal(canAdvanceAfterAnswer(null), false);
  assert.equal(canAdvanceAfterAnswer('try-again'), false);
  assert.equal(canAdvanceAfterAnswer('correct'), true);
});

test('practice stars use the 60% and 90% scoring thresholds', () => {
  assert.equal(getPracticeStars(5, 10), 1);
  assert.equal(getPracticeStars(6, 10), 2);
  assert.equal(getPracticeStars(8, 10), 2);
  assert.equal(getPracticeStars(9, 10), 3);
  assert.equal(getPracticeStars(0, 0), 1);
});

test('both lesson screens use the correct-answer gate for advancing', () => {
  for (const screenPath of ['app/italian-foundations.tsx', 'app/verb-fill-in.tsx']) {
    const source = fs.readFileSync(path.join(mobileRoot, screenPath), 'utf8');
    assert.match(source, /if \(!canAdvanceAfterAnswer\(feedback\)\) return;/, `${screenPath} must guard the advance handler`);
    assert.match(source, /canAdvanceAfterAnswer\(feedback\) && \(/, `${screenPath} must hide the advance action until correct`);
  }
});
