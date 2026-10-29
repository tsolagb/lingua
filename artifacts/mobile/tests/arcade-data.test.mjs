import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const modules = new Map();
function load(path) {
  const file = ['', '.ts', '.tsx', '.json', '/index.ts'].map(suffix => path + suffix).find(candidate => existsSync(candidate) && /\.\w+$/.test(candidate));
  if (!file) throw new Error(`Missing test module ${path}`);
  if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'));
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} }; modules.set(file, module);
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name.startsWith('@/')) return load(resolve(root, name.slice(2)));
    if (name.startsWith('.')) return load(resolve(dirname(file), name));
    return require(name);
  }, module, module.exports);
  return module.exports;
}
const vocab = load(resolve(root, 'lib/arcade/vocab'));
const daily = load(resolve(root, 'lib/arcade/daily'));
const chats = load(resolve(root, 'data/arcade-chat'));
const stories = load(resolve(root, 'data/arcade-stories'));
const glossary = load(resolve(root, 'data/story-glossary'));
const odd = load(resolve(root, 'data/odd-one-out'));
const fixes = load(resolve(root, 'data/fix-sentence'));
const bosses = load(resolve(root, 'lib/arcade/boss-battle'));
const classic = load(resolve(root, 'lib/classic-game-progress'));

test('all four courses have twelve complete conversations, including a word builder every time', () => {
  assert.equal(chats.CHAT_SCENARIOS.length, 12);
  assert.equal(new Set(chats.CHAT_SCENARIOS.map(s => s.id)).size, 12);
  for (const scenario of chats.CHAT_SCENARIOS) {
    assert.ok(scenario.turns.length >= 3);
    for (const language of ['italian', 'french', 'spanish', 'armenian']) {
      for (const turn of scenario.turns) {
        for (const line of [turn.other, turn.answer, ...turn.wrong]) assert.ok(line[language]?.trim(), `${scenario.id} ${language}`);
        assert.equal(new Set([turn.answer, ...turn.wrong].map(line => line[language])).size, 3);
      }
    }
  }
});
test('eight stories have real reachable branches, ending-specific comprehension and every word glossed', () => {
  assert.equal(stories.ARCADE_STORIES.length, 8);
  for (const story of stories.ARCADE_STORIES) {
    const visited = new Set();
    const endings = [];
    let decisions = 0;
    const visit = id => {
      assert.ok(story.pages[id], `${story.id}: missing ${id}`);
      if (visited.has(id)) return;
      visited.add(id);
      const page = story.pages[id];
      assert.ok(page.lines.length >= 2 && page.lines.length <= 3);
      if (page.choices) { decisions++; assert.ok(page.choices.length >= 2); for (const choice of page.choices) visit(choice.to); }
      if (page.next) visit(page.next);
      if (page.answer !== undefined) {
        assert.ok(page.answer >= 0 && page.answer < story.question.options.length);
        endings.push(page.answer);
      }
      for (const language of ['italian', 'french', 'spanish', 'armenian']) {
        for (const line of page.lines) {
          assert.ok(line.en && line[language]);
          for (const word of line[language].split(/\s+/)) if (glossary.normalizeStoryToken(word)) assert.ok(glossary.glossStoryWord(word, language), `${story.id}/${language}: missing ${word}`);
        }
      }
    };
    visit('start');
    assert.ok(decisions >= 2 && endings.length >= 2, story.id);
    assert.ok(new Set(endings).size >= 2, `${story.id}: endings must affect the answer`);
  }
});
test('daily puzzles have ten deterministic unique-answer questions in all languages and across dates', () => {
  for (const language of ['italian', 'french', 'spanish', 'armenian']) {
    for (const date of ['2026-10-22', '2026-10-23', '2027-01-01']) {
      const questions = daily.buildDailyQuestions(date, language);
      assert.equal(questions.length, 10);
      assert.deepEqual(questions, daily.buildDailyQuestions(date, language));
      assert.ok(new Set(questions.map(q => q.kind)).size >= 4);
      for (const q of questions) {
        if (q.kind === 'build') {
          assert.equal(q.order.length, q.tokens.length);
          assert.equal(new Set(q.order).size, q.tokens.length);
        } else {
          assert.equal(new Set(q.options).size, q.options.length, `${q.kind} ${language}: duplicate option`);
          assert.ok(q.options.includes(q.answer));
        }
      }
    }
    assert.notDeepEqual(daily.buildDailyQuestions('2026-10-22', language), daily.buildDailyQuestions('2026-10-23', language));
  }
});
test('new grammar games have full per-language banks with valid corrections and unique options', () => {
  for (const language of ['italian', 'french', 'spanish', 'armenian']) {
    assert.equal(odd.getOddSets(language).length, 12);
    const bank = fixes.getFixItems(language);
    assert.equal(bank.length, 10);
    assert.equal(new Set(bank.map(q => q.category)).size, 5);
    for (const q of bank) {
      assert.ok(q.wrongIndex >= 0 && q.wrongIndex < q.tokens.length);
      assert.notEqual(q.tokens[q.wrongIndex], q.fix);
      assert.equal(new Set([q.fix, ...q.distractors]).size, 3);
      assert.ok(q.english && q.rule && fixes.correctedSentence(q));
    }
  }
});
test('every milestone boss has a usable mixed bank in every language without duplicate choices', () => {
  for (const language of ['italian', 'french', 'spanish', 'armenian']) {
    for (let m = 0; m < 30; m++) {
      const questions = bosses.buildBossQuestions(language, m, true);
      assert.ok(questions.length >= 10, `${language} milestone ${m}`);
      assert.ok(new Set(questions.map(q => q.kind)).size >= 2);
      for (const q of questions) {
        assert.ok(q.options.includes(q.answer), `${language}/${m}/${q.id}`);
        assert.equal(new Set(q.options).size, q.options.length, `${language}/${m}/${q.id}`);
      }
    }
  }
});
test('classic best stars stay language/mode scoped, monotonic and never award XP or lesson stars', () => {
  const first = classic.planClassicBestStars({}, 'italian', 'quiz', 2);
  assert.equal(classic.classicBestStars(first, 'italian', 'quiz'), 2);
  assert.equal(classic.classicBestStars(first, 'french', 'quiz'), undefined);
  assert.equal(classic.classicBestStars(first, 'italian', 'match'), undefined);
  assert.equal(classic.planClassicBestStars(first, 'italian', 'quiz', 1), first);
  assert.equal(Object.values(first['italian::arcade:classic-quiz'])[0].stars, 0);
  assert.equal(Object.values(first['italian::arcade:classic-quiz'])[0].arcadeXp, 0);
});
test('daily reset and calendar streaks use UTC across local midnight, DST and leap dates', () => {
  assert.equal(daily.utcDateKey(new Date('2026-10-22T23:30:00-07:00')), '2026-10-23');
  assert.equal(new Date(daily.nextUtcReset(new Date('2026-10-22T23:59:59Z'))).toISOString(), '2026-10-23T00:00:00.000Z');
  assert.equal(daily.shiftDateKey('2028-03-01', -1), '2028-02-29');
  assert.equal(daily.dailyStreak(new Set(['2026-10-20', '2026-10-21']), '2026-10-22'), 2);
  assert.equal(daily.dailyStreak(new Set(['2026-10-20']), '2026-10-22'), 0);
});
const voice = load(resolve(root, 'lib/arcade/voice-utils'));
const gender = load(resolve(root, 'lib/arcade/gender'));
const grammar = load(resolve(root, 'lib/arcade/grammar-slots'));
const verbs = load(resolve(root, 'data/verb-curriculum'));
const verbData = load(resolve(root, 'data/verb-guide'));
const snapshot = load(resolve(root, 'context/progressSnapshot'));
const rewards = load(resolve(root, 'lib/arcade-progress'));

for (const language of ['italian', 'french', 'spanish', 'armenian']) {
  test(`${language} has playable word, letter, listening, sentence, sorting and conjugation pools`, () => {
    assert.ok(vocab.getClassroomPairs(language).length >= 20);
    assert.ok(vocab.getSpellablePairs(language).length >= 10);
    assert.ok(voice.getSentencePool(language).length >= 10);
    const listen = voice.buildListenRounds(language, 10);
    assert.equal(listen.length, 10);
    for (const round of listen) {
      assert.equal(round.options.length, 4);
      assert.equal(new Set(round.options).size, 4);
    }
    const deck = gender.buildSortDeck(language, 24);
    assert.ok(deck.length >= 8);
    assert.deepEqual(new Set(deck.map(item => item.bucket)), new Set(['a', 'b']));
    const slots = grammar.buildSlotQuestions(language, 60);
    assert.ok(slots.length >= 10);
    for (const question of slots) {
      assert.ok(question.answer.trim(), JSON.stringify(question));
      assert.ok(!question.answer.includes('/'), `Pronoun alternatives leaked into answer: ${question.answer}`);
      assert.ok(question.options.includes(question.answer));
      assert.equal(new Set(question.options).size, question.options.length);
      assert.ok(question.why.length > 10);
    }
  });
}
test('Romance verb practice covers the core verb pool, all subject forms and practical tenses', () => {
  for (const language of ['italian', 'french', 'spanish']) {
    const tenseOptions = verbs.VERB_TENSES[language];
    assert.ok(tenseOptions.length >= 10, `${language} should expose its main practical tenses`);
    for (const tense of tenseOptions) {
      const groups = verbs.getVerbLessons(language, tense.id);
      const lessons = [...groups.regular, ...groups.irregular];
      assert.ok(lessons.length >= 120, `${language} ${tense.label} should include the full core verb pool`);
      for (const lesson of lessons) {
        assert.equal(lesson.forms.length, verbData.VERB_PERSONS[language].length);
        assert.equal(lesson.practiceForms.length, lesson.forms.length);
        assert.ok(lesson.practiceForms.every(form => form.trim() && !form.includes('/')));
      }
    }
  }
});
test('common irregular forms and gender agreement stay usable in the conjugation practice', () => {
  const italianPresent = [...verbs.getVerbLessons('italian', 'present').regular, ...verbs.getVerbLessons('italian', 'present').irregular];
  const italianEssere = italianPresent.find(lesson => lesson.infinitive === 'essere');
  assert.equal(verbs.getPracticeVerbForm(italianEssere, 0), 'io sono');
  assert.equal(verbs.getPracticeVerbForm(italianEssere, 3), 'lei è');

  const italianPast = [...verbs.getVerbLessons('italian', 'passato-prossimo').regular, ...verbs.getVerbLessons('italian', 'passato-prossimo').irregular];
  const italianAndare = italianPast.find(lesson => lesson.infinitive === 'andare');
  assert.equal(verbs.getPracticeVerbForm(italianAndare, 0), 'io sono andato');
  assert.equal(verbs.getPracticeVerbForm(italianAndare, 3), 'lei è andata');

  const frenchPast = [...verbs.getVerbLessons('french', 'passe-compose').regular, ...verbs.getVerbLessons('french', 'passe-compose').irregular];
  const frenchAller = frenchPast.find(lesson => lesson.infinitive === 'aller');
  assert.equal(verbs.getPracticeVerbForm(frenchAller, 0), 'je suis allé');
  assert.equal(verbs.getPracticeVerbForm(frenchAller, 3), 'elle est allée');

  const spanishPresent = [...verbs.getVerbLessons('spanish', 'present').regular, ...verbs.getVerbLessons('spanish', 'present').irregular];
  const spanishTener = spanishPresent.find(lesson => lesson.infinitive === 'tener');
  assert.equal(verbs.getPracticeVerbForm(spanishTener, 0), 'yo tengo');
  assert.equal(verbs.getPracticeVerbForm(spanishTener, 1), 'tú tienes');

  const italianFuture = [...verbs.getVerbLessons('italian', 'futuro-semplice').regular, ...verbs.getVerbLessons('italian', 'futuro-semplice').irregular];
  assert.equal(verbs.getPracticeVerbForm(italianFuture.find(lesson => lesson.infinitive === 'mangiare'), 0), 'io mangerò');

  const spanishPast = [...verbs.getVerbLessons('spanish', 'preterite').regular, ...verbs.getVerbLessons('spanish', 'preterite').irregular];
  assert.equal(verbs.getPracticeVerbForm(spanishPast.find(lesson => lesson.infinitive === 'venir'), 0), 'yo vine');

  const spanishImperfectSubj = [...verbs.getVerbLessons('spanish', 'imperfect-subjunctive').regular, ...verbs.getVerbLessons('spanish', 'imperfect-subjunctive').irregular];
  assert.equal(verbs.getPracticeVerbForm(spanishImperfectSubj.find(lesson => lesson.infinitive === 'hablar'), 3), 'nosotros habláramos');
});
test('typed word comparison forgives accents and minor long-word typos, not opposite short words', () => {
  assert.equal(voice.wordsClose('caffe', 'caffè'), true);
  assert.equal(voice.wordsClose('ristorante', 'ristorante'), true);
  assert.equal(voice.wordsClose('no', 'sì'), false);
  assert.equal(voice.wordsClose('', 'ciao'), false);
});
test('normalization and cloud merge preserve best scores, session dedupe, and both devices XP', () => {
  const currency = { italian: 10, french: 0, spanish: 0, armenian: 0 };
  const a = rewards.planArcadeReward({}, currency, 'italian', 'word-rain', { sessionId: 'device-a', score: 500, stars: 3, xp: 15 });
  const b = rewards.planArcadeReward({}, currency, 'italian', 'word-rain', { sessionId: 'device-b', score: 250, stars: 2, xp: 20 });
  const merged = snapshot.mergeProgressSnapshots(a, b);
  assert.equal(merged.currency.italian, 45);
  assert.equal(rewards.arcadeBestScore(merged.progress, 'italian', 'word-rain'), 500);
  assert.equal(rewards.planArcadeReward(merged.progress, merged.currency, 'italian', 'word-rain',
    { sessionId: 'device-a', score: 500, stars: 3, xp: 15 }).xpEarned, 0);
});
