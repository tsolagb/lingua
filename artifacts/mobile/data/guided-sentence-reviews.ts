import { SUPPORTED_LANGUAGES, type Language } from './vocabulary';

export interface GuidedSentenceReviewRecord {
  sentenceId: string;
  english: string;
  target: string;
  correctReviews: number;
  requiredReviews: number;
  missCount: number;
  lastAnsweredAt: number;
}

export type GuidedSentenceReviewMap = Record<string, GuidedSentenceReviewRecord>;

export interface DueGuidedSentence extends GuidedSentenceReviewRecord {
  language: Language;
}

export function guidedSentenceReviewKey(language: Language, sentenceId: string) {
  return `${language}::${sentenceId}`;
}

export function normalizeGuidedSentenceReviews(value: unknown): GuidedSentenceReviewMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const normalized: GuidedSentenceReviewMap = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const record = raw as Record<string, unknown>;
    const [language, ...idParts] = key.split('::');
    const sentenceId = typeof record.sentenceId === 'string'
      ? record.sentenceId
      : idParts.join('::');
    if (
      !SUPPORTED_LANGUAGES.includes(language as Language) ||
      !sentenceId ||
      typeof record.english !== 'string' ||
      typeof record.target !== 'string' ||
      !record.english.trim() ||
      !record.target.trim()
    ) continue;
    normalized[key] = {
      sentenceId,
      english: record.english,
      target: record.target,
      correctReviews: Math.max(0, Math.floor(Number(record.correctReviews) || 0)),
      requiredReviews: Math.max(1, Math.floor(Number(record.requiredReviews) || 3)),
      missCount: Math.max(0, Math.floor(Number(record.missCount) || 0)),
      lastAnsweredAt: Math.max(0, Number(record.lastAnsweredAt) || 0),
    };
  }
  return normalized;
}

export function recordGuidedSentenceAnswer(
  reviews: GuidedSentenceReviewMap,
  language: Language,
  sentence: Pick<DueGuidedSentence, 'sentenceId' | 'english' | 'target'>,
  isCorrect: boolean,
  answeredAt = Date.now(),
): GuidedSentenceReviewMap {
  const key = guidedSentenceReviewKey(language, sentence.sentenceId);
  const previous = reviews[key];
  if (!previous && isCorrect) return reviews;
  const updated: GuidedSentenceReviewRecord = {
    sentenceId: sentence.sentenceId,
    english: sentence.english,
    target: sentence.target,
    correctReviews: isCorrect ? (previous?.correctReviews ?? 0) + 1 : 0,
    requiredReviews: Math.max(previous?.requiredReviews ?? 3, 3),
    missCount: (previous?.missCount ?? 0) + (isCorrect ? 0 : 1),
    lastAnsweredAt: answeredAt,
  };
  return { ...reviews, [key]: updated };
}

export function getDueGuidedSentences(
  reviews: GuidedSentenceReviewMap,
  language: Language,
): DueGuidedSentence[] {
  const prefix = `${language}::`;
  return Object.entries(reviews)
    .filter(([key, record]) =>
      key.startsWith(prefix) &&
      record.missCount > 0 &&
      record.correctReviews < record.requiredReviews,
    )
    .map(([, record]) => ({ ...record, language }))
    .sort((a, b) => b.missCount - a.missCount || a.lastAnsweredAt - b.lastAnsweredAt);
}

export function mergeGuidedSentenceReviews(
  existingValue: unknown,
  incomingValue: unknown,
): GuidedSentenceReviewMap {
  const existing = normalizeGuidedSentenceReviews(existingValue);
  const incoming = normalizeGuidedSentenceReviews(incomingValue);
  const merged: GuidedSentenceReviewMap = { ...existing };
  for (const [key, latest] of Object.entries(incoming)) {
    const previous = merged[key];
    if (!previous) {
      merged[key] = latest;
      continue;
    }
    if (latest.lastAnsweredAt > previous.lastAnsweredAt) {
      merged[key] = latest;
      continue;
    }
    if (latest.lastAnsweredAt === previous.lastAnsweredAt) {
      merged[key] = {
        ...previous,
        correctReviews: Math.min(previous.correctReviews, latest.correctReviews),
        requiredReviews: Math.max(previous.requiredReviews, latest.requiredReviews),
        missCount: Math.max(previous.missCount, latest.missCount),
      };
    }
  }
  return merged;
}
