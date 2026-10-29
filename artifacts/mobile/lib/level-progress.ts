interface ProgressWord {
  english: string;
}

interface RecallProgress {
  correctReviews: number;
  requiredReviews: number;
}

function normalizeWord(english: string): string {
  return english.trim().toLocaleLowerCase();
}

export function getLevelRecallProgressPercent(
  pairs: readonly ProgressWord[],
  language: string,
  reviews: Readonly<Record<string, RecallProgress | undefined>>,
): number {
  const uniqueWords = new Set(pairs.map(pair => normalizeWord(pair.english)));
  if (uniqueWords.size === 0) return 0;

  let completionTotal = 0;
  for (const english of uniqueWords) {
    const review = reviews[`${language}::${english}`];
    if (!review) continue;
    const required = Math.max(1, review.requiredReviews);
    completionTotal += Math.min(review.correctReviews, required) / required;
  }

  return Math.round((completionTotal / uniqueWords.size) * 100);
}
