import type { Language, WordPair } from '@/data/vocabulary';

export interface WordItem {
  id: number;
  word: string;
}

export interface WordBatch {
  left: WordItem[];
  right: WordItem[];
  reversed: boolean;
}

const MATCH_BATCH_SIZE = 5;
const MIN_MATCH_BATCH_SIZE = 3;

function normalizeMatchWord(word: string): string {
  return word
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function canAddToBatch(
  id: number,
  batchIds: number[],
  pairs: WordPair[],
  language: Language,
): boolean {
  const englishKey = normalizeMatchWord(pairs[id].english);
  const translationKey = normalizeMatchWord(pairs[id].translations[language]);

  return batchIds.every(otherId =>
    normalizeMatchWord(pairs[otherId].english) !== englishKey &&
    normalizeMatchWord(pairs[otherId].translations[language]) !== translationKey,
  );
}

function balanceSmallBatches(
  batchIds: number[][],
  pairs: WordPair[],
  language: Language,
  supplementalIds: number[],
): number[][] {
  const usedIds = new Set(batchIds.flat());

  for (let batchIndex = 0; batchIndex < batchIds.length; batchIndex++) {
    const batch = batchIds[batchIndex];

    while (batch.length < MIN_MATCH_BATCH_SIZE) {
      const donorIndexes = batchIds
        .map((donor, index) => ({ donor, index }))
        .filter(({ donor, index }) =>
          index !== batchIndex && donor.length > MIN_MATCH_BATCH_SIZE,
        )
        .sort((a, b) => b.donor.length - a.donor.length)
        .map(({ index }) => index);

      let moved = false;
      for (const donorIndex of donorIndexes) {
        const donor = batchIds[donorIndex];
        const itemIndex = donor.findIndex(id =>
          canAddToBatch(id, batch, pairs, language),
        );
        if (itemIndex < 0) continue;
        batch.push(donor.splice(itemIndex, 1)[0]);
        moved = true;
        break;
      }
      if (moved) continue;

      // A small review round can borrow extra words only from its own session
      // pool, so the page stays focused on the selected topic/review scope.
      const supplementalId = supplementalIds.find(id =>
        !usedIds.has(id) && canAddToBatch(id, batch, pairs, language),
      );
      if (supplementalId === undefined) break;
      usedIds.add(supplementalId);
      batch.push(supplementalId);
    }
  }

  return batchIds;
}

export function shouldReverseReviewRound(roundNumber: number): boolean {
  return roundNumber > 0 && roundNumber % 2 === 0;
}

export function buildWordBatches(
  ids: number[],
  pairs: WordPair[],
  language: Language,
  reverseDirection = false,
  supplementalIds: number[] = [],
): WordBatch[] {
  const shuffledIds = shuffle([...new Set(ids)]);
  const batchIds: number[][] = [];

  for (const id of shuffledIds) {
    const currentBatch = batchIds[batchIds.length - 1];
    const canJoinCurrentBatch = currentBatch &&
      currentBatch.length < MATCH_BATCH_SIZE &&
      canAddToBatch(id, currentBatch, pairs, language);

    if (!canJoinCurrentBatch) {
      batchIds.push([id]);
    } else {
      currentBatch.push(id);
    }
  }

  const balancedBatchIds = balanceSmallBatches(
    batchIds,
    pairs,
    language,
    supplementalIds,
  );

  return balancedBatchIds.map(idsInBatch => ({
    left: shuffle(idsInBatch.map(id => ({
      id,
      word: reverseDirection ? pairs[id].translations[language] : pairs[id].english,
    }))),
    right: shuffle(idsInBatch.map(id => ({
      id,
      word: reverseDirection ? pairs[id].english : pairs[id].translations[language],
    }))),
    reversed: reverseDirection,
  }));
}
