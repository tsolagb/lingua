import type { GrammarPracticeQuestion, GrammarUnitId } from './grammar-curriculum';
import {
  CATEGORIES,
  type Category,
  type Language,
  type WordPair,
} from './vocabulary';
import { getGrammarCourse } from './grammar-curriculum';
import { SENTENCE_PRACTICE_LEVELS } from './sentence-practice';
import { VERB_SENTENCE_EXERCISES } from './verb-exercises';
import { LANGUAGE_FOUNDATIONS } from './language-foundations';
import { isSpeechAvailable } from '@/lib/speech-voice';
import { getLanguageGrammarNote } from './guided-grammar-notes';

type GuidedGrammarId = GrammarUnitId | 'articles' | 'prepositions' | 'possessives';

export const GUIDED_CATEGORY_ID = 'guided-learn';
export const GUIDED_LEVELS_PER_MILESTONE = 9;
export const GUIDED_LEARNING_LEVELS = GUIDED_LEVELS_PER_MILESTONE - 1;

export interface GuidedMilestoneDefinition {
  title: string;
  band: 'A1' | 'A2' | 'B1';
  grammarFocus: string;
  grammarUnitId: GuidedGrammarId;
  categoryId: string;
}

export const GUIDED_MILESTONES: readonly GuidedMilestoneDefinition[] = [
  { title: 'First greetings', band: 'A1', grammarFocus: 'Pronouns and the essential verbs “be” and “have”', grammarUnitId: 'pronounsCopula', categoryId: 'conversations' },
  { title: 'Names and introductions', band: 'A1', grammarFocus: 'Simple sentence order and subject pronouns', grammarUnitId: 'wordOrder', categoryId: 'verbs' },
  { title: 'Family and friends', band: 'A1', grammarFocus: 'Possessives: my, your, and our', grammarUnitId: 'possessives', categoryId: 'family' },
  { title: 'Food + articles and gender', band: 'A1', grammarFocus: 'Articles and noun forms in useful phrases', grammarUnitId: 'articles', categoryId: 'food' },
  { title: 'At home', band: 'A1', grammarFocus: 'Place words and common prepositions', grammarUnitId: 'prepositions', categoryId: 'home' },
  { title: 'Daily routines', band: 'A1', grammarFocus: 'Present-tense verbs for everyday actions', grammarUnitId: 'presentTense', categoryId: 'verbs' },
  { title: 'Days, dates, and time', band: 'A1', grammarFocus: 'Ask and answer simple time questions', grammarUnitId: 'negationQuestions', categoryId: 'time' },
  { title: 'Ordering a meal', band: 'A1', grammarFocus: 'Polite questions and negative forms', grammarUnitId: 'negationQuestions', categoryId: 'restaurant' },
  { title: 'Shopping + numbers and plurals', band: 'A1', grammarFocus: 'Articles, quantity, and noun number', grammarUnitId: 'articles', categoryId: 'numbers' },
  { title: 'Around the neighborhood', band: 'A1', grammarFocus: 'Build clear sentences about nearby places', grammarUnitId: 'wordOrder', categoryId: 'places' },
  { title: 'Getting around', band: 'A1', grammarFocus: 'Prepositions for location and direction', grammarUnitId: 'prepositions', categoryId: 'transport' },
  { title: 'Ask for directions', band: 'A1', grammarFocus: 'Questions, requests, and useful commands', grammarUnitId: 'imperatives', categoryId: 'places' },
  { title: 'At the market', band: 'A1', grammarFocus: 'Articles and descriptions for food and goods', grammarUnitId: 'adjectiveAgreement', categoryId: 'food' },
  { title: 'Clothes and colors', band: 'A1', grammarFocus: 'Adjective agreement and simple descriptions', grammarUnitId: 'adjectiveAgreement', categoryId: 'clothes' },
  { title: 'Body and well-being', band: 'A1', grammarFocus: 'Talk about states, needs, and possession', grammarUnitId: 'pronounsCopula', categoryId: 'body' },
  { title: 'Weather and plans', band: 'A2', grammarFocus: 'Present and future forms in everyday plans', grammarUnitId: 'futureTenses', categoryId: 'weather' },
  { title: 'School and learning', band: 'A2', grammarFocus: 'Present-tense patterns and useful questions', grammarUnitId: 'presentTense', categoryId: 'school' },
  { title: 'Work and responsibilities', band: 'A2', grammarFocus: 'Completed past events and background', grammarUnitId: 'pastTenses', categoryId: 'jobs' },
  { title: 'Tickets and travel', band: 'A2', grammarFocus: 'Ask for information and explain what you need', grammarUnitId: 'negationQuestions', categoryId: 'tickets' },
  { title: 'A day out', band: 'A2', grammarFocus: 'Past-tense stories about places and activities', grammarUnitId: 'pastTenses', categoryId: 'places' },
  { title: 'Yesterday and memories', band: 'A2', grammarFocus: 'Choose past forms for events and background', grammarUnitId: 'pastTenses', categoryId: 'conversations' },
  { title: 'Plans for tomorrow', band: 'A2', grammarFocus: 'Future forms for plans and predictions', grammarUnitId: 'futureTenses', categoryId: 'verbs' },
  { title: 'Feelings and comparisons', band: 'A2', grammarFocus: 'Compare people, places, and experiences', grammarUnitId: 'comparisons', categoryId: 'emotions' },
  { title: 'Requests and small problems', band: 'A2', grammarFocus: 'Make polite requests and talk about possibilities', grammarUnitId: 'conditionalMood', categoryId: 'conversations' },
  { title: 'Nature and the outdoors', band: 'B1', grammarFocus: 'Join descriptions with relative clauses', grammarUnitId: 'relativeClauses', categoryId: 'nature' },
  { title: 'Stories with more detail', band: 'B1', grammarFocus: 'Connect actions, people, and background details', grammarUnitId: 'relativeClauses', categoryId: 'animals' },
  { title: 'Opinions and preferences', band: 'B1', grammarFocus: 'Express opinions, wishes, and recommendations', grammarUnitId: 'subjunctive', categoryId: 'food' },
  { title: 'Culture and community', band: 'B1', grammarFocus: 'Describe customs and general experiences', grammarUnitId: 'passiveImpersonal', categoryId: 'church' },
  { title: 'Explain what happened', band: 'B1', grammarFocus: 'Report ideas and connect events clearly', grammarUnitId: 'reportedSpeech', categoryId: 'school' },
  { title: 'Confident everyday conversation', band: 'B1', grammarFocus: 'Combine pronouns and forms in natural sentences', grammarUnitId: 'pronounOrder', categoryId: 'conversations' },
];

export interface GuidedSentence {
  id: string;
  english: string;
  target: string;
}

export interface GuidedWord extends WordPair {
  categoryId: string;
  categoryLevelIndex: number;
}

export type GuidedExercise =
  | {
      id: string;
      kind: 'intro';
      pair: GuidedWord;
      example?: GuidedSentence;
    }
  | {
      id: string;
      kind: 'match';
      pairs: GuidedWord[];
    }
  | {
      id: string;
      kind: 'choice';
      mode: 'translation' | 'blank' | 'grammar' | 'listen';
      prompt: string;
      answer: string;
      options: string[];
      translation?: string;
      explanation: string;
      pair?: GuidedWord;
      sentence?: GuidedSentence;
    }
  | {
      id: string;
      kind: 'build';
      prompt: string;
      english: string;
      target: string;
      tiles: string[];
      sentence?: GuidedSentence;
    }
  | {
      id: string;
      kind: 'type';
      prompt: string;
      answer: string;
      pair: GuidedWord;
    };

export interface GuidedLessonLevel {
  milestoneIndex: number;
  levelIndex: number;
  globalLevelIndex: number;
  isCheckpoint: boolean;
  title: string;
  milestone: GuidedMilestoneDefinition;
  exercises: GuidedExercise[];
  vocabulary: GuidedWord[];
  newWordCount: number;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const next = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[next]] = [copy[next], copy[index]];
  }
  return copy;
}

function categoryById(categoryId: string): Category {
  const category = CATEGORIES.find(category => category.id === categoryId);
  if (!category) throw new Error(`Missing guided-learning vocabulary category: ${categoryId}`);
  return category;
}

function wordsForCategory(categoryId: string): GuidedWord[] {
  const category = categoryById(categoryId);
  return category.levels.flatMap((level, categoryLevelIndex) =>
    level.pairs.map(pair => ({ ...pair, categoryId: category.id, categoryLevelIndex })),
  );
}

function takeWrapped<T>(items: T[], start: number, count: number): T[] {
  if (items.length === 0) return [];
  return Array.from({ length: Math.min(count, items.length) }, (_, offset) =>
    items[((start + offset) % items.length + items.length) % items.length],
  );
}

function milestoneVocabulary(milestoneIndex: number, levelIndex: number): GuidedWord[] {
  const currentDefinition = GUIDED_MILESTONES[milestoneIndex];
  const currentPool = wordsForCategory(currentDefinition.categoryId);
  const priorVisits = GUIDED_MILESTONES.slice(0, milestoneIndex).filter(milestone =>
    milestone.categoryId === currentDefinition.categoryId,
  ).length;
  const start = priorVisits * GUIDED_LEARNING_LEVELS * 5 + levelIndex * 5;
  const newWords = takeWrapped(currentPool, start, 5);
  const previousDefinition = GUIDED_MILESTONES[Math.max(0, milestoneIndex - 1)];
  const previousPool = wordsForCategory(previousDefinition.categoryId);
  const previousVisits = GUIDED_MILESTONES.slice(0, Math.max(0, milestoneIndex - 1)).filter(milestone =>
    milestone.categoryId === previousDefinition.categoryId,
  ).length;
  const reviewWords = levelIndex > 0
    ? [
        ...takeWrapped(currentPool, start - 5, 3),
        ...takeWrapped(currentPool, levelIndex > 1 ? start - 10 + 3 : start - 2, 2),
      ]
    : milestoneIndex === 0
      ? []
      : takeWrapped(previousPool, previousVisits * GUIDED_LEARNING_LEVELS * 5 + 37, 3);
  const unique = new Map<string, GuidedWord>();
  for (const pair of [...newWords, ...reviewWords]) {
    const key = pair.english.toLocaleLowerCase();
    if (!unique.has(key)) unique.set(key, pair);
  }
  return [...unique.values()];
}

function allSentenceExamples(language: Language): GuidedSentence[] {
  const phraseAndReading = SENTENCE_PRACTICE_LEVELS.flatMap(level =>
    level.items.map(item => ({
      id: item.id,
      english: item.english,
      target: item.translations[language],
    })),
  );
  const verbSentences = VERB_SENTENCE_EXERCISES[language].map((item, index) => ({
    id: `verb-sentence-${language}-${index}`,
    english: item.english,
    target: item.words.join(' '),
  }));
  return [...phraseAndReading, ...verbSentences].filter(item => item.english.trim() && item.target.trim());
}

const POSSESSIVES: Record<Language, [string, string, string, string, string, string][]> = {
  italian: [
    ['Questa è ___ sorella.', 'This is my sister.', 'mia', 'mio', 'miei', 'Sorella is feminine singular, so “my” is mia. A singular close-family noun normally has no article.'],
    ['Questi sono i ___ libri.', 'These are my books.', 'miei', 'mia', 'mio', 'Libri is masculine plural. The possessive must also be masculine plural: miei.'],
    ['Questa è la ___ casa.', 'This is our house.', 'nostra', 'nostro', 'nostri', 'Casa is feminine singular, so “our” is nostra. The possessive agrees with the thing owned.'],
  ],
  french: [
    ['C’est ___ sœur.', 'This is my sister.', 'ma', 'mon', 'mes', 'Sœur is feminine singular and starts with a consonant sound, so use ma.'],
    ['Ce sont ___ parents.', 'These are my parents.', 'mes', 'ma', 'mon', 'Parents is plural, so use mes regardless of the parents’ genders.'],
    ['Voici ___ amie.', 'Here is my friend (female).', 'mon', 'ma', 'mes', 'Amie is feminine, but it begins with a vowel sound. Use mon before that sound, not ma.'],
  ],
  spanish: [
    ['Esta es ___ hermana.', 'This is my sister.', 'mi', 'mis', 'mías', 'Hermana is singular, so the short possessive is mi. Use mis with a plural noun.'],
    ['Estos son ___ libros.', 'These are my books.', 'mis', 'mi', 'mío', 'Libros is plural, so “my” must be mis.'],
    ['Esta es ___ casa.', 'This is our house.', 'nuestra', 'nuestro', 'nuestros', 'Casa is feminine singular. Nuestro changes to nuestra to agree with it.'],
  ],
  armenian: [
    ['Ասիկա ___ քոյրս է։', 'This is my sister.', 'իմ', 'քու', 'մեր', 'Իմ means “my.” The ending -ս on քոյրս also marks first-person possession.'],
    ['Ասոնք ___ գիրքերն են։', 'These are our books.', 'մեր', 'քու', 'իր', 'Մեր means “our,” as required by the English meaning. Armenian does not use masculine/feminine possessive agreement.'],
    ['Ասիկա ___ տունն է։', 'This is your house.', 'քու', 'մեր', 'իր', 'Քու is the singular familiar “your.” Choose it for the owner named in the English sentence.'],
  ],
};

function grammarQuestions(language: Language, grammarUnitId: GuidedGrammarId): GrammarPracticeQuestion[] {
  if (grammarUnitId === 'possessives') {
    return POSSESSIVES[language].map(([sentence, sentenceTranslation, answer, wrongA, wrongB, explanation]) => ({
      prompt: 'Choose the possessive.',
      hint: 'Match the owner and the noun.',
      sentence, sentenceTranslation, answer, choices: [answer, wrongA, wrongB], explanation,
    }));
  }
  const foundation = LANGUAGE_FOUNDATIONS[language];
  if (grammarUnitId === 'articles' || grammarUnitId === 'prepositions') {
    const questions = grammarUnitId === 'articles'
      ? Object.values(foundation.articleGroups).flatMap(group => group.questions)
      : [...foundation.prepositionQuestions, ...foundation.prepositionArticleQuestions];
    return questions.filter(question => question.sentence?.includes('___') && question.sentenceTranslation)
      .map(question => ({
        ...question,
        explanation: question.explanation,
        sentence: question.sentence!,
        sentenceTranslation: question.sentenceTranslation!,
      }));
  }
  const note = getLanguageGrammarNote(language, grammarUnitId);
  return (getGrammarCourse(language)
    .flatMap(section => section.units)
    .find(unit => unit.id === grammarUnitId)?.questions ?? []).map(question => ({
      ...question,
      explanation: `Use “${question.answer}” in “${question.sentence.replace(/_+/g, question.answer)}”. ${note?.split('. ')[0] ?? question.explanation}.`,
    }));
}

function optionsFor(answer: string, pool: string[], size = 4): string[] {
  const distractors = [...new Set(pool.filter(value =>
    value.trim().toLocaleLowerCase() !== answer.trim().toLocaleLowerCase(),
  ))];
  return shuffle([answer, ...shuffle(distractors).slice(0, size - 1)]);
}

function wordsAsTiles(sentence: string): string[] {
  return shuffle(sentence.trim().split(/\s+/).filter(Boolean));
}

function findExample(
  pair: GuidedWord,
  language: Language,
  sentences: GuidedSentence[],
): GuidedSentence | undefined {
  const key = pair.english.toLocaleLowerCase();
  const plain = (value: string) => ` ${value.toLocaleLowerCase().replace(/[.!?,;:։՝՜՞«»"“”]/g, '').replace(/\s+/g, ' ').trim()} `;
  const matched = sentences.find(sentence =>
    plain(sentence.english).includes(plain(pair.english)) ||
    plain(sentence.target).includes(plain(pair.translations[language])),
  );
  if (matched) return matched;
  if (pair.examples) {
    if (pair.examples[language]) return {
      id: `word-example-${key}`,
      english: pair.examples.english,
      target: pair.examples[language] ?? '',
    };
  }
  return undefined;
}

function pickSentence(sentences: GuidedSentence[], index: number): GuidedSentence | undefined {
  if (!sentences.length) return undefined;
  return sentences[Math.abs(index) % sentences.length];
}

export function getGuidedMilestoneTitle(index: number): string {
  const milestone = GUIDED_MILESTONES[index];
  return milestone ? `Milestone ${index + 1} · ${milestone.title}` : 'Learning path complete';
}

export function getGuidedLevelCount(): number {
  return GUIDED_MILESTONES.length * GUIDED_LEVELS_PER_MILESTONE;
}

export function scoreGuidedLesson(correct: number, total: number, checkpoint: boolean, previousStars = 0) {
  const accuracy = total > 0 ? Math.round(Math.max(0, Math.min(correct, total)) / total * 100) : 0;
  const passed = accuracy >= (checkpoint ? 80 : 70);
  const stars = passed ? (accuracy >= 90 ? 3 : accuracy >= 80 ? 2 : 1) : 0;
  return { accuracy, passed, stars, xp: Math.max(stars - previousStars, 0) };
}

export function getGuidedCurrentLevelIndex(
  isCompleted: (categoryId: string, levelIndex: number) => boolean,
): number {
  const count = getGuidedLevelCount();
  for (let index = 0; index < count; index++) {
    if (!isCompleted(GUIDED_CATEGORY_ID, index)) return index;
  }
  return count;
}

export function getGuidedLevel(
  language: Language,
  milestoneIndex: number,
  levelIndex: number,
): GuidedLessonLevel {
  const milestone = GUIDED_MILESTONES[milestoneIndex];
  if (!milestone || !Number.isInteger(levelIndex) || levelIndex < 0 || levelIndex >= GUIDED_LEVELS_PER_MILESTONE) {
    throw new Error('This guided lesson is unavailable.');
  }

  const isCheckpoint = levelIndex === GUIDED_LEVELS_PER_MILESTONE - 1;
  const vocabulary = milestoneVocabulary(milestoneIndex, levelIndex);
  const allMilestoneWords = isCheckpoint
    ? Array.from({ length: GUIDED_LEARNING_LEVELS }, (_, index) => milestoneVocabulary(milestoneIndex, index))
        .flat()
        .filter((pair, index, items) => items.findIndex(item => item.english === pair.english) === index)
    : vocabulary;
  const activeWords = isCheckpoint
    ? Array.from({ length: Math.min(15, allMilestoneWords.length) }, (_, index) =>
        allMilestoneWords[Math.floor(index * allMilestoneWords.length / Math.min(15, allMilestoneWords.length))],
      )
    : vocabulary;
  const grammar = grammarQuestions(language, milestone.grammarUnitId);
  if (grammar.length === 0) {
    throw new Error(`Grammar examples are missing for ${language} in ${milestone.grammarFocus}.`);
  }
  const grammarSentences = grammar.map((question, index) => ({
    id: `grammar-${milestone.grammarUnitId}-${index}`,
    english: question.sentenceTranslation,
    target: question.sentence.replace(/_+/g, question.answer),
  }));
  const sentenceLimit = milestone.band === 'A1' ? 9 : milestone.band === 'A2' ? 16 : 30;
  const generalSentences = allSentenceExamples(language).filter(sentence =>
    sentence.target.split(/\s+/).length <= sentenceLimit &&
    (milestone.band !== 'A1' || !/\b(would|could|yesterday|tomorrow|although|unless|had already)\b/i.test(sentence.english)),
  );
  const sentences = [...grammarSentences, ...generalSentences];
  const sentencePool = sentences.filter(sentence => {
    const words = activeWords.slice(0, 6);
    return words.some(pair => sentence.english.toLocaleLowerCase().includes(pair.english.toLocaleLowerCase()));
  });
  const lessonSentence = pickSentence(
    levelIndex % 2 === 0 ? grammarSentences : sentencePool.length ? sentencePool : grammarSentences,
    milestoneIndex * 17 + levelIndex,
  );
  const examplesForWords = activeWords.map(pair =>
    findExample(pair, language, sentences),
  );
  const questionAt = (index: number) => grammar[index % grammar.length];
  const targetWords = activeWords.map(pair => pair.translations[language]);
  const englishWords = activeWords.map(pair => pair.english);
  const exercises: GuidedExercise[] = [];

  if (!isCheckpoint && activeWords[0]) {
    exercises.push({
      id: `m${milestoneIndex}-l${levelIndex}-intro-1`,
      kind: 'intro',
      pair: activeWords[0],
      example: examplesForWords[0],
    });
    if (activeWords[1]) {
      exercises.push({
        id: `m${milestoneIndex}-l${levelIndex}-intro-2`,
        kind: 'intro',
        pair: activeWords[1],
        example: examplesForWords[1],
      });
    }
  }

  const addMatch = (words: GuidedWord[], suffix: string) => {
    const unique = words.filter((word, index, items) =>
      items.findIndex(item => item.translations[language] === word.translations[language]) === index,
    );
    if (unique.length < 3) return;
    exercises.push({
      id: `m${milestoneIndex}-l${levelIndex}-match-${suffix}`,
      kind: 'match',
      pairs: unique.slice(0, 3),
    });
  };
  addMatch(isCheckpoint ? activeWords.slice(0, 5) : activeWords.slice(2, 5), 'new');
  if (activeWords.length >= 8) addMatch(activeWords.slice(5, 9), 'recall');
  if (isCheckpoint) {
    addMatch(activeWords.slice(9, 13), 'checkpoint-1');
    addMatch(activeWords.slice(-3), 'checkpoint-2');
  }

  const firstGrammar = questionAt(levelIndex + milestoneIndex);
  const secondGrammar = questionAt(levelIndex + milestoneIndex + 1);
  const blankAnswer = firstGrammar.answer;
  exercises.push({
    id: `m${milestoneIndex}-l${levelIndex}-blank`,
    kind: 'choice',
    mode: 'blank',
    prompt: firstGrammar.sentence,
    answer: blankAnswer,
    options: optionsFor(blankAnswer, firstGrammar.choices),
    translation: firstGrammar.sentenceTranslation,
    explanation: firstGrammar.explanation,
    sentence: {
      id: `grammar-${milestone.grammarUnitId}-${grammar.indexOf(firstGrammar)}`,
      english: firstGrammar.sentenceTranslation,
      target: firstGrammar.sentence.replace(/_+/g, blankAnswer),
    },
  });

  const pairA = activeWords[isCheckpoint ? 6 : 0] ?? activeWords[0];
  const pairB = activeWords[isCheckpoint ? 7 : 1] ?? activeWords[1] ?? pairA;
  if (pairA) {
    exercises.push({
      id: `m${milestoneIndex}-l${levelIndex}-translate-forward`,
      kind: 'choice',
      mode: 'translation',
      prompt: pairA.english,
      answer: pairA.translations[language],
      options: optionsFor(pairA.translations[language], targetWords),
      explanation: `“${pairA.english}” means “${pairA.translations[language]}.”`,
      pair: pairA,
    });
  }
  if (pairB) {
    exercises.push({
      id: `m${milestoneIndex}-l${levelIndex}-translate-back`,
      kind: 'choice',
      mode: 'translation',
      prompt: pairB.translations[language],
      answer: pairB.english,
      options: optionsFor(pairB.english, englishWords),
      explanation: `“${pairB.translations[language]}” means “${pairB.english}.”`,
      pair: pairB,
    });
  }

  if (lessonSentence) {
    exercises.push({
      id: `m${milestoneIndex}-l${levelIndex}-build`,
      kind: 'build',
      prompt: 'Build the translation.',
      english: lessonSentence.english,
      target: lessonSentence.target,
      tiles: wordsAsTiles(lessonSentence.target),
      sentence: lessonSentence,
    });
  }

  const listenPair = activeWords[8] ?? activeWords[3] ?? pairA;
  if (listenPair) {
    exercises.push({
      id: `m${milestoneIndex}-l${levelIndex}-listen`,
      kind: 'choice',
      mode: isSpeechAvailable(language) ? 'listen' : 'translation',
      prompt: isSpeechAvailable(language) ? 'Listen and choose the meaning.' : listenPair.translations[language],
      answer: listenPair.english,
      options: optionsFor(listenPair.english, englishWords),
      explanation: `“${listenPair.translations[language]}” means “${listenPair.english}.”`,
      pair: listenPair,
    });
  }

  if (lessonSentence) {
    exercises.push({
      id: `m${milestoneIndex}-l${levelIndex}-listen-build`,
      kind: 'build',
      prompt: isSpeechAvailable(language) ? 'Listen, then build what you hear.' : 'Build the translation.',
      english: lessonSentence.english,
      target: lessonSentence.target,
      tiles: wordsAsTiles(lessonSentence.target),
      sentence: lessonSentence,
    });
  }

  const typePair = activeWords[9] ?? activeWords[4] ?? pairA;
  if (typePair) {
    exercises.push({
      id: `m${milestoneIndex}-l${levelIndex}-type`,
      kind: 'type',
      prompt: `Type the ${language} word for “${typePair.english}”.`,
      answer: typePair.translations[language],
      pair: typePair,
    });
  }

  exercises.push({
    id: `m${milestoneIndex}-l${levelIndex}-grammar`,
    kind: 'choice',
    mode: 'grammar',
    prompt: secondGrammar.sentence,
    answer: secondGrammar.answer,
    options: optionsFor(secondGrammar.answer, secondGrammar.choices),
    translation: secondGrammar.sentenceTranslation,
    explanation: secondGrammar.explanation,
    sentence: {
      id: `grammar-${milestone.grammarUnitId}-${grammar.indexOf(secondGrammar)}`,
      english: secondGrammar.sentenceTranslation,
      target: secondGrammar.sentence.replace(/_+/g, secondGrammar.answer),
    },
  });

  if (lessonSentence) {
    exercises.push({
      id: `m${milestoneIndex}-l${levelIndex}-translate-sentence`,
      kind: 'choice',
      mode: 'translation',
      prompt: lessonSentence.target,
      answer: lessonSentence.english,
      options: optionsFor(lessonSentence.english, sentences.map(sentence => sentence.english)),
      explanation: lessonSentence.english,
      sentence: lessonSentence,
    });
  }

  return {
    milestoneIndex,
    levelIndex,
    globalLevelIndex: milestoneIndex * GUIDED_LEVELS_PER_MILESTONE + levelIndex,
    isCheckpoint,
    title: isCheckpoint ? 'Milestone checkpoint' : `${milestone.title} · Level ${levelIndex + 1}`,
    milestone,
    exercises,
    vocabulary: activeWords,
    newWordCount: isCheckpoint ? 0 : Math.min(5, activeWords.length),
  };
}

export function getGuidedMilestoneExamples(language: Language, milestoneIndex: number) {
  const milestone = GUIDED_MILESTONES[milestoneIndex];
  if (!milestone) return [];
  return grammarQuestions(language, milestone.grammarUnitId)
    .filter(question => question.sentence && question.sentenceTranslation)
    .slice(0, 3)
    .map(question => ({
      sentence: question.sentence!.replace(/_+/g, question.answer),
      translation: question.sentenceTranslation!,
      highlight: question.answer,
    }));
}

export function getGuidedGrammarRule(language: Language, milestoneIndex: number) {
  const milestone = GUIDED_MILESTONES[milestoneIndex];
  if (!milestone) return '';
  const languageNote = getLanguageGrammarNote(language, milestone.grammarUnitId);
  if (languageNote) return languageNote;
  return getGrammarCourse(language)
    .flatMap(section => section.units)
    .find(unit => unit.id === milestone.grammarUnitId)?.rule ?? milestone.grammarFocus;
}
