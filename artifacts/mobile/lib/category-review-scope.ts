export type ReviewWord = { english: string };

function normalizeWord(english: string) {
  return english.trim().toLocaleLowerCase();
}

export function getCategoryScopedReviewPairs<T extends ReviewWord>(
  duePairs: readonly T[],
  categoryPairs: readonly ReviewWord[],
  alreadyIncludedPairs: readonly ReviewWord[],
): T[] {
  const categoryWords = new Set(categoryPairs.map(pair => normalizeWord(pair.english)));
  const includedWords = new Set(alreadyIncludedPairs.map(pair => normalizeWord(pair.english)));

  return duePairs.filter(pair => {
    const word = normalizeWord(pair.english);
    return categoryWords.has(word) && !includedWords.has(word);
  });
}
