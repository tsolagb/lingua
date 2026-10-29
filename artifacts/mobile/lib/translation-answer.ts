export type TranslationTypo = { typed: string; expected: string };
export type TypedTranslationResult = { correct: boolean; typos: TranslationTypo[] };

function extractWords(text: string): string[] {
  return text
    .normalize('NFC')
    .toLocaleLowerCase()
    .match(/[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}\p{N}]+)*/gu) ?? [];
}

function isOneEditAway(first: string, second: string): boolean {
  if (first === second || Math.abs(first.length - second.length) > 1) return false;
  let firstIndex = 0;
  let secondIndex = 0;
  let edits = 0;
  while (firstIndex < first.length && secondIndex < second.length) {
    if (first[firstIndex] === second[secondIndex]) {
      firstIndex += 1;
      secondIndex += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (first.length === second.length) {
      firstIndex += 1;
      secondIndex += 1;
    } else if (first.length > second.length) {
      firstIndex += 1;
    } else {
      secondIndex += 1;
    }
  }
  if (firstIndex < first.length || secondIndex < second.length) edits += 1;
  return edits === 1;
}

/** Accepts an exact translation or one one-character spelling slip in a sentence. */
export function evaluateTypedTranslation(input: string, expected: string): TypedTranslationResult {
  const typedWords = extractWords(input);
  const expectedWords = extractWords(expected);
  if (typedWords.length !== expectedWords.length || typedWords.length === 0) {
    return { correct: false, typos: [] };
  }
  const typos: TranslationTypo[] = [];
  for (let index = 0; index < expectedWords.length; index += 1) {
    const typed = typedWords[index];
    const target = expectedWords[index];
    if (typed === target) continue;
    if (target.length >= 4 && isOneEditAway(typed, target)) {
      typos.push({ typed, expected: target });
      if (typos.length > 1) return { correct: false, typos };
      continue;
    }
    return { correct: false, typos };
  }
  return { correct: true, typos };
}
