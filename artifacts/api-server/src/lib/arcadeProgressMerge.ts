function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function number(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0; }
export function arcadeXpTotal(progress: unknown, language: string) {
  return Object.entries(object(progress)).filter(([key]) => key.startsWith(`${language}::arcade:`))
    .reduce((sum, [, rounds]) => sum + Object.values(object(rounds)).reduce<number>((total, round) => total + Math.min(50, number(object(round).arcadeXp)), 0), 0);
}
/** Merge immutable session credits, not max(balance): two devices may earn different rounds offline. */
export function mergeArcadeCurrency(oldCurrency: unknown, newCurrency: unknown, oldProgress: unknown, newProgress: unknown, mergedProgress: unknown) {
  const left = object(oldCurrency), right = object(newCurrency);
  return Object.fromEntries([...new Set([...Object.keys(left), ...Object.keys(right)])].map(language => [
    language,
    Math.max(0, number(left[language]) - arcadeXpTotal(oldProgress, language), number(right[language]) - arcadeXpTotal(newProgress, language)) +
      arcadeXpTotal(mergedProgress, language),
  ]));
}
