import {
  GENERAL_VOCABULARY_CATEGORY_ID,
  GENERAL_VOCABULARY_STAGE_SIZE,
  GENERAL_VOCABULARY_STAGES_PER_LEVEL,
  getGeneralVocabularyLevels,
} from '@/data/general-vocabulary';
import { getUniqueVocabularyPairs, type Language, type WordPair } from '@/data/vocabulary';
import { wordReviewKey, type WordReviewMap } from '@/data/word-reviews';
import { gradePracticeScores, practiceScoreFromStars } from '@/lib/practice-grading';

export const GENERAL_VOCABULARY_GAME_MODES = [
  { id: 'game', label: 'Match', icon: 'git-compare-outline' },
  { id: 'flashcards', label: 'Flash Cards', icon: 'albums-outline' },
  { id: 'quiz', label: 'Quiz', icon: 'help-circle-outline' },
  { id: 'spelling', label: 'Spelling', icon: 'create-outline' },
  { id: 'wordsearch', label: 'Word Search', icon: 'grid-outline' },
  { id: 'crossword', label: 'Crossword', icon: 'book-outline' },
  { id: 'rapidfire', label: 'Rapid Fire', icon: 'flash-outline' },
  { id: 'trueorfalse', label: 'True/False', icon: 'checkmark-circle-outline' },
] as const;

export type GeneralVocabularyGameMode = typeof GENERAL_VOCABULARY_GAME_MODES[number]['id'];

export interface GeneralVocabularySessionParams {
  generalStage?: string;
  allWords?: string;
  randomBatch?: string;
  batchIndices?: string;
  levelIndex?: string;
  stageIndex?: string;
}

export interface GeneralVocabularySession {
  kind: 'stage' | 'random';
  pairs: WordPair[];
  levelIndex?: number;
  stageIndex?: number;
}

export type CompleteVocabularyLevel = (
  categoryId: string,
  levelIndex: number,
  stars: number,
  language?: Language,
  stageIndex?: number,
  stageCount?: number,
  stageGameResult?: { mode: GeneralVocabularyGameMode; score: number },
) => Promise<void>;

export function getGeneralVocabularyStageProgress(
  pairs: readonly WordPair[],
  language: Language,
  reviews: WordReviewMap,
  completed = false,
) {
  const practicedWords = pairs.filter(pair =>
    Boolean(reviews[wordReviewKey(language, pair.english)]),
  ).length;
  const total = pairs.length;
  const count = completed ? total : practicedWords;
  return {
    practicedWords: count,
    total,
    percent: total > 0 ? Math.round((count / total) * 100) : 0,
  };
}

export function getGeneralVocabularyStageGrade(
  gameScores: Record<string, number> | undefined,
): string | null {
  if (!gameScores) return null;
  const supportedScores = Object.fromEntries(
    GENERAL_VOCABULARY_GAME_MODES
      .filter(({ id }) => typeof gameScores[id] === 'number')
      .map(({ id }) => [id, gameScores[id]]),
  );
  return gradePracticeScores(supportedScores);
}

export interface GeneralVocabularySelection {
  kind: 'stage' | 'random';
  levelIndex?: number;
  stageIndex?: number;
  batchIndices?: number[];
  returnTo?: 'general-vocabulary-levels' | 'random-practice';
}

const ROUTES: Record<GeneralVocabularyGameMode, string> = {
  game: '/game',
  flashcards: '/flashcards',
  quiz: '/quiz',
  spelling: '/spelling',
  wordsearch: '/wordsearch',
  crossword: '/crossword',
  rapidfire: '/rapidfire',
  trueorfalse: '/trueorfalse',
};

export function createRandomGeneralVocabularyBatch(
  language: Language,
  random: () => number = Math.random,
): { pairs: WordPair[]; indices: number[] } {
  const pool = getUniqueVocabularyPairs(language);
  const indices = pool.map((_, index) => index);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const batchIndices = indices.slice(0, GENERAL_VOCABULARY_STAGE_SIZE);
  return {
    indices: batchIndices,
    pairs: batchIndices.map(index => pool[index]),
  };
}

export function parseGeneralVocabularyBatchIndices(
  value: string | undefined,
  poolLength: number,
): number[] | null {
  if (!value) return null;
  const parts = value.split('.');
  if (parts.some(part => !/^\d+$/.test(part))) return null;
  const indices = parts.map(part => Number(part));
  if (
    indices.length !== GENERAL_VOCABULARY_STAGE_SIZE ||
    indices.some(index => !Number.isInteger(index) || index < 0 || index >= poolLength) ||
    new Set(indices).size !== GENERAL_VOCABULARY_STAGE_SIZE
  ) {
    return null;
  }
  return indices;
}

export function completeGeneralVocabularyStage(
  completeLevel: CompleteVocabularyLevel,
  levelIndex: number,
  stageIndex: number,
  stars: number,
  language: Language,
  gameMode: GeneralVocabularyGameMode,
): Promise<void> {
  const normalizedStars = Math.max(0, Math.min(3, Math.round(stars)));
  const stageCount =
    getGeneralVocabularyLevels(language)[levelIndex]?.stages.length ??
    GENERAL_VOCABULARY_STAGES_PER_LEVEL;
  return completeLevel(
    GENERAL_VOCABULARY_CATEGORY_ID,
    levelIndex,
    stars,
    language,
    stageIndex,
    stageCount,
    {
      mode: gameMode,
      score: practiceScoreFromStars(normalizedStars),
    },
  );
}

export function resolveGeneralVocabularySession(
  params: GeneralVocabularySessionParams,
  language: Language,
): GeneralVocabularySession | null {
  if (params.generalStage === '1') {
    const levelValue = params.levelIndex ?? '';
    const stageValue = params.stageIndex ?? '';
    if (!/^\d+$/.test(levelValue) || !/^\d+$/.test(stageValue)) return null;
    const levelIndex = Number(levelValue);
    const stageIndex = Number(stageValue);
    const stage = Number.isInteger(levelIndex) && Number.isInteger(stageIndex)
      ? getGeneralVocabularyLevels(language)[levelIndex]?.stages[stageIndex]
      : undefined;
    if (
      !stage ||
      stage.pairs.length === 0 ||
      stage.pairs.length > GENERAL_VOCABULARY_STAGE_SIZE
    ) return null;
    return { kind: 'stage', pairs: stage.pairs, levelIndex, stageIndex };
  }

  if (params.allWords === '1' && params.randomBatch === '1') {
    const pool = getUniqueVocabularyPairs(language);
    const indices = parseGeneralVocabularyBatchIndices(params.batchIndices, pool.length);
    if (!indices) return null;
    return { kind: 'random', pairs: indices.map(index => pool[index]) };
  }
  return null;
}

export function buildGeneralVocabularyGameHref(
  mode: GeneralVocabularyGameMode,
  selection: GeneralVocabularySelection,
): string {
  const returnTo = selection.returnTo === 'random-practice'
    ? 'random-practice'
    : 'general-vocabulary-levels';
  const params = selection.kind === 'stage'
    ? `generalStage=1&levelIndex=${selection.levelIndex}&stageIndex=${selection.stageIndex}`
    : `allWords=1&randomBatch=1&batchIndices=${(selection.batchIndices ?? []).join('.')}`;
  return `${ROUTES[mode]}?${params}&returnTo=${returnTo}`;
}

export function getGeneralVocabularyReturnPath(
  returnTo?: string,
  levelIndex?: number,
): string {
  if (returnTo === 'random-practice') return '/random-practice';
  return Number.isInteger(levelIndex)
    ? `/general-vocabulary-levels?levelIndex=${levelIndex}`
    : '/general-vocabulary-levels';
}
