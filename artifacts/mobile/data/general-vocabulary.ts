import { getUniqueVocabularyPairs, type Language, type WordPair } from '@/data/vocabulary';

export const GENERAL_VOCABULARY_CATEGORY_ID = 'general-vocabulary';
export const GENERAL_VOCABULARY_HEADWORD_TARGET = 7000;
export const GENERAL_VOCABULARY_LEVEL_SIZE = 250;
export const GENERAL_VOCABULARY_STAGE_SIZE = 25;
export const GENERAL_VOCABULARY_STAGES_PER_LEVEL =
  GENERAL_VOCABULARY_LEVEL_SIZE / GENERAL_VOCABULARY_STAGE_SIZE;

export interface GeneralVocabularyStage {
  index: number;
  pairs: WordPair[];
}

export interface GeneralVocabularyLevel {
  index: number;
  pairs: WordPair[];
  stages: GeneralVocabularyStage[];
}

export function getGeneralVocabularyLevels(language: Language): GeneralVocabularyLevel[] {
  const pairs = getUniqueVocabularyPairs(language);
  if (pairs.length < GENERAL_VOCABULARY_HEADWORD_TARGET) {
    throw new Error(
      `General vocabulary requires at least ${GENERAL_VOCABULARY_HEADWORD_TARGET} unique headwords; found ${pairs.length}.`,
    );
  }

  const levels: GeneralVocabularyLevel[] = [];
  for (let levelStart = 0; levelStart < pairs.length; levelStart += GENERAL_VOCABULARY_LEVEL_SIZE) {
    const levelPairs = pairs.slice(levelStart, levelStart + GENERAL_VOCABULARY_LEVEL_SIZE);
    const stages: GeneralVocabularyStage[] = [];

    for (let stageStart = 0; stageStart < levelPairs.length; stageStart += GENERAL_VOCABULARY_STAGE_SIZE) {
      stages.push({
        index: stages.length,
        pairs: levelPairs.slice(stageStart, stageStart + GENERAL_VOCABULARY_STAGE_SIZE),
      });
    }

    levels.push({
      index: levels.length,
      pairs: levelPairs,
      stages,
    });
  }

  return levels;
}
