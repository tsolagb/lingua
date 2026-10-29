export function getNextCrosswordHintIndex(
  answer: string,
  hintedIndices: ReadonlySet<number>,
  enteredLetters: readonly (string | undefined)[],
): number | null {
  const availableIndices = Array.from({ length: answer.length }, (_, index) => index)
    .filter(index => !hintedIndices.has(index) && enteredLetters[index] !== answer[index]);

  // Keep at least one letter for the learner to solve.
  if (availableIndices.length <= 1) return null;
  return availableIndices[0] ?? null;
}
