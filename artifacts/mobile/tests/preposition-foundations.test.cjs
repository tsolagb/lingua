const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const typescript = require('typescript');

const filename = path.resolve(__dirname, '../data/preposition-foundations.ts');
const source = fs.readFileSync(filename, 'utf8');
const { outputText } = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
  },
});
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
loaded._compile(outputText, filename);
const {
  PREPOSITION_ARTICLE_HINTS,
  PREPOSITION_ARTICLE_QUESTIONS,
  PREPOSITION_HINTS,
  PREPOSITION_QUESTIONS,
} = loaded.exports;

function loadTypeScriptModule(modulePath, runtimeImports = {}) {
  const moduleSource = fs.readFileSync(modulePath, 'utf8');
  const compiled = typescript.transpileModule(moduleSource, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2020,
    },
  });
  const tsModule = new Module(modulePath, module);
  tsModule.filename = modulePath;
  tsModule.paths = Module._nodeModulePaths(path.dirname(modulePath));
  const nativeRequire = tsModule.require.bind(tsModule);
  tsModule.require = request => Object.hasOwn(runtimeImports, request)
    ? runtimeImports[request]
    : nativeRequire(request);
  tsModule._compile(compiled.outputText, modulePath);
  return tsModule.exports;
}

const dataDirectory = path.resolve(__dirname, '../data');
const italianFoundations = loadTypeScriptModule(path.join(dataDirectory, 'italian-foundations.ts'));
const languageFoundations = loadTypeScriptModule(
  path.join(dataDirectory, 'language-foundations.ts'),
  {
    '@/data/italian-foundations': italianFoundations,
    '@/data/preposition-foundations': loaded.exports,
  },
);

test('each supported language has a useful preposition practice set', () => {
  for (const language of ['italian', 'french', 'spanish', 'armenian']) {
    const questions = PREPOSITION_QUESTIONS[language];
    assert.ok(questions.length >= 10, `${language} should have at least ten questions`);
    assert.ok(PREPOSITION_HINTS[language].trim().length > 0);

    for (const [index, question] of questions.entries()) {
      const label = `${language} question ${index + 1}`;
      assert.ok(question.prompt.trim(), `${label} should have an English prompt`);
      assert.ok(question.hint.trim(), `${label} should explain the context`);
      assert.ok(question.sentence.includes('___'), `${label} should have a sentence blank`);
      assert.equal(question.sentence.split('___').length - 1, 1, `${label} should have one blank`);
      assert.ok(question.sentenceTranslation.trim().split(/\s+/).length >= 4, `${label} should show a full English sentence`);
      assert.ok(question.explanation.trim(), `${label} should explain the answer`);
      assert.ok(question.choices.includes(question.answer), `${label} should include its correct answer`);
      assert.equal(question.choices.filter(choice => choice === question.answer).length, 1, `${label} should show the correct answer once`);
      assert.ok(question.choices.length >= 3, `${label} should provide several choices`);
    }
  }
});

test('preposition + article practice is sentence-based and explains each language rule', () => {
  for (const language of ['italian', 'french', 'spanish', 'armenian']) {
    const questions = PREPOSITION_ARTICLE_QUESTIONS[language];
    assert.ok(questions.length >= 10, `${language} should have at least ten combination questions`);
    assert.ok(PREPOSITION_ARTICLE_HINTS[language].trim().length > 0);

    for (const [index, question] of questions.entries()) {
      const label = `${language} combined-form question ${index + 1}`;
      assert.ok(question.sentence.includes('___'), `${label} should use a sentence blank`);
      assert.ok(question.sentenceTranslation.trim().split(/\s+/).length >= 4, `${label} should show the full English sentence`);
      assert.ok(question.explanation.trim(), `${label} should explain the grammar rule`);
      assert.ok(question.choices.includes(question.answer), `${label} should include its correct answer`);
    }
  }
  assert.match(PREPOSITION_ARTICLE_HINTS.italian, /a \+ il/i);
  assert.match(PREPOSITION_ARTICLE_HINTS.french, /à \+ le/i);
  assert.match(PREPOSITION_ARTICLE_HINTS.spanish, /only a \+ el/i);
  assert.match(PREPOSITION_ARTICLE_HINTS.armenian, /does not fuse/i);
});

test('article grammar across supported languages is practiced in complete sentences', () => {
  for (const [language, content] of Object.entries(languageFoundations.LANGUAGE_FOUNDATIONS)) {
    for (const [group, articleSet] of Object.entries(content.articleGroups)) {
      assert.ok(articleSet.questions.length > 0, `${language} ${group} article practice should not be empty`);
      for (const [index, question] of articleSet.questions.entries()) {
        const label = `${language} ${group} article question ${index + 1}`;
        assert.ok(question.sentence?.includes('___'), `${label} should practice in a sentence`);
        assert.ok(question.sentenceTranslation?.trim(), `${label} should translate the complete sentence`);
      }
    }
  }
});

test('Western Armenian lessons include common postpositions and Latin-reading guidance', () => {
  const questions = PREPOSITION_QUESTIONS.armenian;
  for (const word of ['մէջ', 'վրայ', 'տակ', 'հետ', 'համար', 'միջեւ', 'առանց', 'ետք', 'դէպի']) {
    assert.ok(questions.some(question => question.answer === word), `expected Western Armenian postposition ${word}`);
  }
  assert.match(PREPOSITION_HINTS.armenian, /postpositions/i);

  const sourcePhrase = PREPOSITION_ARTICLE_QUESTIONS.armenian.find(
    question => question.answer === 'դուրս',
  );
  assert.ok(sourcePhrase, 'expected the Western Armenian source phrase');
  assert.equal(sourcePhrase.prompt, 'Complete “The teacher came out of the school.”');
  assert.equal(sourcePhrase.sentenceTranslation, 'The teacher came out of the school.');
});
