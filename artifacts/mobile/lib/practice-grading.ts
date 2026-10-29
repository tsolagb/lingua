export const PRACTICE_GRADE_MIN_TYPES = 3;

const SCORE_FROM_STARS = [0, 55, 78, 100] as const;
export const PRACTICE_GRADE_SCALE = [
  [99, 'A+'],
  [96, 'A'],
  [93, 'A-'],
  [90, 'B+'],
  [87, 'B'],
  [84, 'B-'],
  [80, 'C+'],
  [76, 'C'],
  [72, 'C-'],
  [60, 'D'],
  [0, 'F'],
] as const;

function validScores(gameScores: Record<string, number> | undefined): number[] {
  if (!gameScores) return [];
  return Object.entries(gameScores)
    .filter(([mode, score]) =>
      /^[a-z][a-z0-9-]*$/i.test(mode) &&
      typeof score === 'number' &&
      Number.isFinite(score) &&
      score >= 0 &&
      score <= 100,
    )
    .map(([, score]) => score);
}

export function practiceScoreFromStars(stars: number): number {
  const normalized = Math.max(0, Math.min(3, Math.round(Number(stars) || 0)));
  return SCORE_FROM_STARS[normalized];
}

export function countPracticeTypes(gameScores: Record<string, number> | undefined): number {
  return validScores(gameScores).length;
}

export function gradeForPracticeAverage(average: number | null): string | null {
  if (average === null || !Number.isFinite(average)) return null;
  return PRACTICE_GRADE_SCALE.find(([minimum]) => average >= minimum)?.[1] ?? 'F';
}

export function practiceAverage(gameScores: Record<string, number> | undefined): number | null {
  const scores = validScores(gameScores);
  if (scores.length < PRACTICE_GRADE_MIN_TYPES) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

export function gradePracticeScores(gameScores: Record<string, number> | undefined): string | null {
  return gradeForPracticeAverage(practiceAverage(gameScores));
}

export interface CategoryPracticeGradeSummary {
  grade: string | null;
  average: number | null;
  gradedLevels: number;
  totalLevels: number;
  complete: boolean;
}

/** Each level counts equally; a level contributes only after three distinct modes. */
export function summarizeCategoryPracticeScores(
  levelScores: readonly (Record<string, number> | undefined)[],
): CategoryPracticeGradeSummary {
  const eligibleLevelAverages = levelScores.flatMap(scores => {
    const valid = validScores(scores);
    if (valid.length < PRACTICE_GRADE_MIN_TYPES) return [];
    return [valid.reduce((sum, score) => sum + score, 0) / valid.length];
  });
  const average = eligibleLevelAverages.length
    ? eligibleLevelAverages.reduce((sum, score) => sum + score, 0) / eligibleLevelAverages.length
    : null;
  return {
    grade: gradeForPracticeAverage(average),
    average: average === null ? null : Math.floor(average * 10) / 10,
    gradedLevels: eligibleLevelAverages.length,
    totalLevels: levelScores.length,
    complete: levelScores.length > 0 && eligibleLevelAverages.length === levelScores.length,
  };
}
