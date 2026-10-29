import { getUniqueVocabularyPairs, type Language, type WordPair } from '@/data/vocabulary';
import { SENTENCE_PRACTICE_LEVELS } from '@/data/sentence-practice';
import type { SentencePracticeItem } from '@/lib/sentence-practice-utils';

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function makeSessionId(gameId: string) {
  return `${gameId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Accent/punctuation-insensitive form (Latin + Armenian punctuation). */
export function normalizeWord(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’'`ʼ՚]/g, '')
    .replace(/[.,!?;:¡¿"«»“”()\u0589\u055E\u055C\u055D\u055B\u2026-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

export function tokenize(value: string): string[] {
  return value.split(/\s+/).map(t => t.trim()).filter(t => normalizeWord(t).length > 0);
}

export function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let r = 1; r <= a.length; r++) {
    let diag = prev[0];
    prev[0] = r;
    for (let c = 1; c <= b.length; c++) {
      const old = prev[c];
      prev[c] = Math.min(prev[c] + 1, prev[c - 1] + 1, diag + (a[r - 1] === b[c - 1] ? 0 : 1));
      diag = old;
    }
  }
  return prev[b.length];
}

/** Minor typo forgiveness: 1 edit for 5+ letters, 2 for 10+. */
export function wordsClose(input: string, expected: string) {
  const a = normalizeWord(input).replace(/\s/g, '');
  const b = normalizeWord(expected).replace(/\s/g, '');
  if (!a || !b) return false;
  if (a === b) return true;
  const allowed = b.length >= 10 ? 2 : b.length >= 5 ? 1 : 0;
  return allowed > 0 && editDistance(a, b) <= allowed;
}

export type AlignedWord = { word: string; ok: boolean };
export type Alignment = { expected: AlignedWord[]; actual: AlignedWord[]; extra: string[]; matched: number; total: number; ratio: number };

/** LCS alignment of typed/heard words against expected words with forgiving per-word matching. */
export function alignWords(expectedText: string, actualText: string): Alignment {
  const exp = tokenize(expectedText);
  const act = tokenize(actualText);
  const n = exp.length;
  const m = act.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = wordsClose(act[j], exp[i]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const expected: AlignedWord[] = exp.map(word => ({ word, ok: false }));
  const usedAct = new Array(m).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (wordsClose(act[j], exp[i]) && dp[i][j] === dp[i + 1][j + 1] + 1) {
      expected[i].ok = true;
      usedAct[j] = true;
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const matched = expected.filter(w => w.ok).length;
  return { expected, actual: act.map((word, k) => ({ word, ok: usedAct[k] })), extra: act.filter((_, k) => !usedAct[k]), matched, total: n, ratio: n ? matched / n : 0 };
}

export type ListenItem =
  | { kind: 'word'; id: string; english: string; target: string; pair: WordPair }
  | { kind: 'sentence'; id: string; english: string; target: string };

function hasLatinOnly(english: string) {
  return english.trim().length > 0;
}

export function getWordPool(language: Language): WordPair[] {
  const seen = new Set<string>();
  return getUniqueVocabularyPairs(language).filter(p => {
    const t = (p.translations[language] ?? '').trim();
    const e = p.english.trim();
    const key = e.toLowerCase();
    if (!t || !hasLatinOnly(e) || seen.has(key)) return false;
    // never reuse English as the "foreign" answer
    if (normalizeWord(t) === normalizeWord(e) && language !== 'armenian') return false;
    seen.add(key);
    return true;
  });
}

export function getSentencePool(language: Language, maxWords = 9): SentencePracticeItem[] {
  const seen = new Set<string>();
  const out: SentencePracticeItem[] = [];
  for (const level of SENTENCE_PRACTICE_LEVELS) {
    for (const item of level.items) {
      const target = (item.translations[language] ?? '').trim();
      if (!target || seen.has(item.english)) continue;
      const words = tokenize(target).length;
      if (words < 2 || words > maxWords) continue;
      if (normalizeWord(target) === normalizeWord(item.english)) continue;
      seen.add(item.english);
      out.push(item);
    }
  }
  return out;
}

export function buildListenRounds(language: Language, total = 10) {
  const words = shuffle(getWordPool(language));
  const sentences = shuffle(getSentencePool(language, 7));
  const sentenceCount = Math.min(3, sentences.length);
  const items: ListenItem[] = [
    ...words.slice(0, total - sentenceCount).map(p => ({ kind: 'word' as const, id: `w-${p.english}`, english: p.english, target: p.translations[language], pair: p })),
    ...sentences.slice(0, sentenceCount).map(s => ({ kind: 'sentence' as const, id: s.id, english: s.english, target: s.translations[language] })),
  ];
  const ordered = shuffle(items).slice(0, total);
  return ordered.map(item => {
    const pool = item.kind === 'word' ? words.map(w => w.english) : sentences.map(s => s.english);
    const distractors = shuffle(pool.filter(e => normalizeWord(e) !== normalizeWord(item.english))).slice(0, 3);
    return { item, options: shuffle([item.english, ...distractors]) };
  });
}
