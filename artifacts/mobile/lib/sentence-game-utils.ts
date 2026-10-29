export interface SentenceTile {
  id: number;
  text: string;
}

export interface ReviewableWord {
  english: string;
  frequencyRank?: number;
}

export function splitSentenceTiles(sentence: string): string[] {
  return sentence.trim().split(/\s+/u).filter(Boolean);
}

function comparableToken(word: string): string {
  return word
    .toLocaleLowerCase()
    .replace(/^[\W_]+|[\W_]+$/gu, '')
    .replace(/[^\w\u0530-\u058F]/gu, '');
}

export function buildSentenceTileBank(
  sentence: string,
  distractors: readonly string[] = [],
  random: () => number = Math.random,
): SentenceTile[] {
  const required = splitSentenceTiles(sentence);
  const usedWords = new Set(required.map(comparableToken));
  const extra: string[] = [];
  for (const rawWord of distractors) {
    const word = rawWord.trim();
    const key = comparableToken(word);
    if (!word || usedWords.has(key)) continue;
    usedWords.add(key);
    extra.push(word);
    if (extra.length === 2) break;
  }
  const items = [...required, ...extra];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items.map((text, id) => ({ id, text }));
}

export function joinSentenceTiles(tiles: readonly SentenceTile[]): string {
  return tiles.map(tile => tile.text).join(' ').replace(/\s+/gu, ' ').trim();
}

export function isSentenceTileOrderCorrect(
  selected: readonly SentenceTile[],
  expectedSentence: string,
): boolean {
  return joinSentenceTiles(selected).toLocaleLowerCase() ===
    expectedSentence.trim().replace(/\s+/gu, ' ').toLocaleLowerCase();
}

const LOW_VALUE_WORDS = new Set([
  'a', 'an', 'and', 'are', 'at', 'be', 'by', 'for', 'from', 'i', 'in', 'is',
  'it', 'me', 'my', 'of', 'on', 'or', 'the', 'to', 'we', 'with', 'you',
]);

export function findReviewWordEnglish(
  sentence: string,
  vocabulary: readonly ReviewableWord[],
): string | null {
  const tokens = sentence
    .toLocaleLowerCase()
    .match(/[a-z]+(?:['’][a-z]+)?/gu) ?? [];
  const wordsByKey = new Map(
    vocabulary.map(item => [item.english.trim().toLocaleLowerCase(), item]),
  );
  const matches = tokens
    .filter(token => !LOW_VALUE_WORDS.has(token))
    .map(token => wordsByKey.get(token))
    .filter((item): item is ReviewableWord => Boolean(item));
  matches.sort((first, second) =>
    (first.frequencyRank ?? Number.MAX_SAFE_INTEGER) -
      (second.frequencyRank ?? Number.MAX_SAFE_INTEGER),
  );
  return matches[0]?.english ?? null;
}
