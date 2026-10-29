export type FillBlankLanguage = 'italian' | 'french' | 'spanish' | 'armenian';

export interface FillBlankPair {
  english: string;
  translations: Record<FillBlankLanguage, string>;
  partOfSpeech?: string;
  frequencyRank?: number;
}

export interface FillBlankCategory {
  id: string;
  name: string;
  levels: { pairs: FillBlankPair[] }[];
}

export interface FillBlankOption {
  english: string;
  word: string;
}

export interface FillBlankGrammarPrompt {
  id: string;
  categoryId: string;
  categoryName: string;
  sentence: string;
  sentenceTranslation: string;
  answer: string;
  choices: string[];
  hint?: string;
  explanation?: string;
}

export interface FillBlankQuestion {
  id: string;
  english: string;
  reviewWordEnglish: string | null;
  categoryId: string;
  categoryName: string;
  beforeBlank: string;
  afterBlank: string;
  englishTranslation: string;
  answer: string;
  options: FillBlankOption[];
  hint?: string;
  explanation?: string;
}

export interface FillBlankLevel {
  index: number;
  questions: FillBlankQuestion[];
}

export const FILL_BLANK_LEVEL_COUNT = 24;
export const FILL_BLANK_QUESTIONS_PER_LEVEL = 10;

const LANGUAGE_LABELS: Record<FillBlankLanguage, string> = {
  italian: 'Italian',
  french: 'French',
  spanish: 'Spanish',
  armenian: 'Western Armenian',
};

function promptFor(language: FillBlankLanguage, english: string) {
  switch (language) {
    case 'italian':
      return {
        beforeBlank: `Come si dice «${english}» in italiano? «`,
        afterBlank: '».',
      };
    case 'french':
      return {
        beforeBlank: `Comment dit-on « ${english} » en français ? « `,
        afterBlank: ' ». ',
      };
    case 'spanish':
      return {
        beforeBlank: `¿Cómo se dice «${english}» en español? «`,
        afterBlank: '».',
      };
    case 'armenian':
      return {
        beforeBlank: `«${english}» բառը արեւմտահայերէն ինչպէ՞ս կ’ըսուի։ «`,
        afterBlank: '»։',
      };
  }
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function uniquePairs(pairs: readonly FillBlankPair[], language: FillBlankLanguage) {
  const seen = new Set<string>();
  return pairs.filter(pair => {
    const english = pair.english.trim().toLocaleLowerCase();
    const translation = pair.translations[language]?.trim();
    if (!english || !translation || seen.has(english)) return false;
    seen.add(english);
    return true;
  });
}

function optionsFor(
  answer: FillBlankPair,
  vocabulary: readonly FillBlankPair[],
  language: FillBlankLanguage,
  seed: number,
): FillBlankOption[] {
  const answerWord = answer.translations[language].trim();
  const answerKey = answerWord.toLocaleLowerCase();
  const samePartOfSpeech = vocabulary.filter(pair =>
    pair.english !== answer.english &&
    pair.partOfSpeech &&
    pair.partOfSpeech === answer.partOfSpeech &&
    pair.translations[language]?.trim().toLocaleLowerCase() !== answerKey,
  );
  const allCandidates = vocabulary.filter(pair =>
    pair.english !== answer.english &&
    pair.translations[language]?.trim() &&
    pair.translations[language].trim().toLocaleLowerCase() !== answerKey,
  );
  const candidates = samePartOfSpeech.length >= 3 ? samePartOfSpeech : allCandidates;
  const random = seededRandom(seed);
  const selected: FillBlankOption[] = [];
  const usedWords = new Set([answerKey]);
  while (selected.length < 3 && candidates.length > 0) {
    const index = Math.floor(random() * candidates.length);
    const candidate = candidates.splice(index, 1)[0];
    const word = candidate.translations[language].trim();
    const key = word.toLocaleLowerCase();
    if (usedWords.has(key)) continue;
    usedWords.add(key);
    selected.push({ english: candidate.english, word });
  }
  const options = [{ english: answer.english, word: answerWord }, ...selected];
  const shuffle = seededRandom(seed ^ 0xA5A5A5A5);
  for (let index = options.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(shuffle() * (index + 1));
    [options[index], options[swap]] = [options[swap], options[index]];
  }
  return options;
}

function categoryPairs(category: FillBlankCategory, language: FillBlankLanguage) {
  return uniquePairs(category.levels.flatMap(level => level.pairs), language);
}

export function buildFillBlankLevels(
  categories: readonly FillBlankCategory[],
  vocabulary: readonly FillBlankPair[],
  language: FillBlankLanguage,
  levelCount = FILL_BLANK_LEVEL_COUNT,
  questionsPerLevel = FILL_BLANK_QUESTIONS_PER_LEVEL,
  grammarPrompts: readonly FillBlankGrammarPrompt[] = [],
): FillBlankLevel[] {
  const categoryPools = categories
    .map(category => ({ ...category, pairs: categoryPairs(category, language) }))
    .filter(category => category.pairs.length > 0);
  const allPairs = uniquePairs(vocabulary, language);
  if (categoryPools.length === 0 || allPairs.length < 4) return [];

  const grammarPairs = categoryPools
    .filter(category => /verb|article|preposition|pronoun|grammar|adjective|adverb/i.test(
      `${category.id} ${category.name}`,
    ))
    .flatMap(category =>
      category.pairs.map(pair => ({ category, pair })),
    );
  const grammarPromptsByCategory = new Map<string, FillBlankGrammarPrompt[]>();
  for (const prompt of grammarPrompts) {
    const group = grammarPromptsByCategory.get(prompt.categoryId) ?? [];
    group.push(prompt);
    grammarPromptsByCategory.set(prompt.categoryId, group);
  }
  const grammarPromptBuckets = [...grammarPromptsByCategory.values()];
  const grammarPromptCount = grammarPromptBuckets.reduce((sum, group) => sum + group.length, 0);

  return Array.from({ length: levelCount }, (_, levelIndex) => {
    const usedWords = new Set<string>();
    const questions = Array.from({ length: questionsPerLevel }, (_, questionIndex) => {
      const usesGrammarPool = questionIndex === 0 && grammarPairs.length > 0;
      let category: (typeof categoryPools)[number];
      let pair: FillBlankPair;

      if (questionIndex === 0 && grammarPromptCount > 0) {
        let promptIndex = levelIndex % grammarPromptCount;
        let prompt = grammarPromptBuckets[0][0];
        for (const bucket of grammarPromptBuckets) {
          if (promptIndex < bucket.length) {
            prompt = bucket[promptIndex];
            break;
          }
          promptIndex -= bucket.length;
        }
        const blankIndex = prompt.sentence.indexOf('___');
        const sentence = prompt.sentence;
        const beforeBlank = sentence.slice(0, blankIndex);
        const afterBlank = sentence.slice(blankIndex + 3);
        const matchingVocabularyPair = allPairs.find(candidate =>
          candidate.translations[language].trim().toLocaleLowerCase() ===
          prompt.answer.trim().toLocaleLowerCase(),
        );
        const optionWords = [...new Set(prompt.choices.map(choice => choice.trim()).filter(Boolean))].slice(0, 4);
        const options = optionWords.map(word => ({
          english: matchingVocabularyPair?.english ?? '',
          word,
        }));
        const answerWord = prompt.answer.trim();
        const answerAlreadyIncluded = options.some(option =>
          option.word.toLocaleLowerCase() === answerWord.toLocaleLowerCase(),
        );
        if (!answerAlreadyIncluded) options[0] = { english: matchingVocabularyPair?.english ?? '', word: answerWord };
        const shuffledOptions = [...options];
        const random = seededRandom((levelIndex + 1) * 2017);
        for (let index = shuffledOptions.length - 1; index > 0; index -= 1) {
          const swap = Math.floor(random() * (index + 1));
          [shuffledOptions[index], shuffledOptions[swap]] = [shuffledOptions[swap], shuffledOptions[index]];
        }
        return {
          id: prompt.id,
          english: prompt.sentenceTranslation,
          reviewWordEnglish: matchingVocabularyPair?.english ?? null,
          categoryId: prompt.categoryId,
          categoryName: prompt.categoryName,
          beforeBlank,
          afterBlank,
          englishTranslation: prompt.sentenceTranslation,
          answer: answerWord,
          options: shuffledOptions,
          hint: prompt.hint,
          explanation: prompt.explanation,
        };
      }

      if (usesGrammarPool) {
        const grammar = grammarPairs[levelIndex % grammarPairs.length];
        category = grammar.category;
        pair = grammar.pair;
      } else {
        const slot = levelIndex * (questionsPerLevel - 1) + questionIndex - (questionIndex > 0 ? 1 : 0);
        category = categoryPools[((slot % categoryPools.length) + categoryPools.length) % categoryPools.length];
        const preferredIndex = Math.floor(slot / categoryPools.length) + levelIndex + questionIndex;
        pair = category.pairs.find((candidate, offset) =>
          !usedWords.has(candidate.english.toLocaleLowerCase()) &&
          offset === preferredIndex % category.pairs.length,
        ) ?? category.pairs.find(candidate => !usedWords.has(candidate.english.toLocaleLowerCase())) ??
          category.pairs[preferredIndex % category.pairs.length];
      }

      usedWords.add(pair.english.toLocaleLowerCase());
      const prompt = promptFor(language, pair.english);
      const options = optionsFor(
        pair,
        allPairs.filter(candidate => candidate.english !== pair.english),
        language,
        (levelIndex + 1) * 1009 + questionIndex * 97,
      );
      return {
        id: `${levelIndex}-${questionIndex}-${pair.english}`,
        english: pair.english,
        reviewWordEnglish: pair.english,
        categoryId: category.id,
        categoryName: category.name,
        beforeBlank: prompt.beforeBlank,
        afterBlank: prompt.afterBlank,
        englishTranslation: `How do you say “${pair.english}” in ${LANGUAGE_LABELS[language]}?`,
        answer: pair.translations[language].trim(),
        options,
      };
    });

    return { index: levelIndex, questions };
  });
}

export function fillBlankStars(mistakes: number): number {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}
