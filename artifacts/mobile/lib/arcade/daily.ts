import { CATEGORIES, LANGUAGE_META, type Language, type WordPair } from '@/data/vocabulary';
import { VERB_GAP_EXERCISES } from '@/data/verb-exercises';
import { SENTENCE_PRACTICE_LEVELS } from '@/data/sentence-practice';
import { arcadeDailyHistory } from '@/lib/arcade-progress';
import type { Progress } from '@/context/progressSnapshot';
import { getShortWordPairs, graphemes } from '@/lib/arcade/vocab';

/** Bump whenever the question generator or corpus selection changes, so every device agrees. */
export const DAILY_CONTENT_VERSION = 'daily-v1';
export const DAILY_QUESTION_COUNT = 10;

export type DailyKind = 'meaning' | 'odd' | 'grammar' | 'listen' | 'build';
type Base = { id: string; kind: DailyKind };
export type DailyMeaning = Base & { kind: 'meaning'; english: string; answer: string; options: string[]; pair: WordPair };
export type DailyOdd = Base & { kind: 'odd'; category: string; answer: string; options: string[]; pair: WordPair; otherCategory: string };
export type DailyGrammar = Base & { kind: 'grammar'; english: string; before: string; after: string; answer: string; options: string[] };
export type DailyListen = Base & { kind: 'listen'; target: string; answer: string; options: string[]; pair: WordPair };
export type DailyBuild = Base & { kind: 'build'; english: string; target: string; tokens: string[]; order: number[]; sentenceId: string };
export type DailyQuestion = DailyMeaning | DailyOdd | DailyGrammar | DailyListen | DailyBuild;

export const DAILY_PLAN: DailyKind[] = ['meaning', 'odd', 'grammar', 'listen', 'build', 'meaning', 'grammar', 'odd', 'listen', 'build'];

// ---------- dates (always UTC) ----------
export function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
export function shiftDateKey(key: string, days: number) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return utcDateKey(d);
}
export function nextUtcReset(now = new Date()) {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
}
export function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
export function localResetLabel(now = new Date()) {
  try {
    return new Date(nextUtcReset(now)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// ---------- deterministic randomness ----------
function hashString(input: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
export function seededRng(seed: string) {
  let a = hashString(seed) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rng = () => number;
function seededShuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
/** Locale-independent code-unit comparison so pool order never depends on device locale or source iteration. */
const byCode = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const norm = (s: string) => s.trim().toLocaleLowerCase().normalize('NFC');

function pickPair(pool: WordPair[], used: Set<string>, rng: Rng) {
  for (const p of seededShuffle(pool, rng)) if (!used.has(p.english)) { used.add(p.english); return p; }
  return pool[Math.floor(rng() * pool.length)];
}
function distinctFrom(pool: WordPair[], exclude: string[], count: number, read: (p: WordPair) => string, rng: Rng) {
  const seen = new Set(exclude.map(norm));
  const out: string[] = [];
  for (const p of seededShuffle(pool, rng)) {
    const v = read(p);
    if (!v || seen.has(norm(v))) continue;
    seen.add(norm(v));
    out.push(v);
    if (out.length >= count) break;
  }
  return out;
}

function topicGroups(language: Language) {
  return CATEGORIES.filter(c => !c.id.startsWith('vocabulary-')).map(c => {
    const seen = new Set<string>();
    const pairs: WordPair[] = [];
    for (const level of c.levels) for (const p of level.pairs) {
      const t = p.translations[language]?.trim();
      if (!t || t.includes('/') || graphemes(t).length > 18 || seen.has(norm(t))) continue;
      seen.add(norm(t));
      pairs.push(p);
    }
    return { id: c.id, name: c.name, pairs };
  }).filter(g => g.pairs.length >= 3).sort((a, b) => byCode(a.id, b.id))
    .map(g => ({ ...g, pairs: g.pairs.sort((a, b) => byCode(a.english, b.english)) }));
}

function sentencePool(language: Language) {
  const out: { id: string; english: string; target: string }[] = [];
  for (const level of SENTENCE_PRACTICE_LEVELS) for (const item of level.items) {
    const target = (item.translations as Record<string, string>)[language]?.trim();
    if (!target) continue;
    const n = target.split(/\s+/).length;
    if (n >= 3 && n <= 7) out.push({ id: item.id, english: item.english, target });
  }
  return out.sort((a, b) => byCode(a.id, b.id));
}

/** Builds the same 10 questions for every learner/device given date + language + content version. */
export function buildDailyQuestions(dateKey: string, language: Language): DailyQuestion[] {
  const rng = seededRng(`${DAILY_CONTENT_VERSION}|${dateKey}|${language}`);
  const words = [...getShortWordPairs(language)].sort((a, b) => byCode(a.english, b.english) || byCode(a.translations[language], b.translations[language]));
  const topics = topicGroups(language);
  const gaps = VERB_GAP_EXERCISES[language];
  const sentences = sentencePool(language);
  const used = new Set<string>();
  const usedGaps = new Set<number>();
  const usedSentences = new Set<string>();
  const tr = (p: WordPair) => p.translations[language]?.trim() ?? '';

  return DAILY_PLAN.map((kind, i): DailyQuestion => {
    const id = `${DAILY_CONTENT_VERSION}-${dateKey}-${language}-${i}`;
    if (kind === 'meaning' || (kind === 'odd' && topics.length < 2) || (kind === 'grammar' && !gaps.length) || (kind === 'build' && !sentences.length)) {
      const pair = pickPair(words, used, rng);
      const answer = tr(pair);
      const options = seededShuffle([answer, ...distinctFrom(words, [answer], 3, tr, rng)], rng);
      return { id, kind: 'meaning', english: pair.english, answer, options, pair };
    }
    if (kind === 'listen') {
      const pair = pickPair(words, used, rng);
      const options = seededShuffle([pair.english, ...distinctFrom(words, [pair.english], 3, p => p.english, rng)], rng);
      return { id, kind: 'listen', target: tr(pair), answer: pair.english, options, pair };
    }
    if (kind === 'odd') {
      const [main, other] = seededShuffle(topics, rng);
      const members = seededShuffle(main.pairs, rng).slice(0, 3).map(tr);
      const otherSet = new Set(main.pairs.map(p => norm(tr(p))));
      const oddPair = seededShuffle(other.pairs, rng).find(p => !otherSet.has(norm(tr(p))) && !used.has(p.english)) ?? other.pairs[0];
      used.add(oddPair.english);
      const answer = tr(oddPair);
      return { id, kind: 'odd', category: main.name, otherCategory: other.name, answer, options: seededShuffle([...members, answer], rng), pair: oddPair };
    }
    if (kind === 'grammar') {
      let idx = Math.floor(rng() * gaps.length);
      for (let k = 0; k < gaps.length && usedGaps.has(idx); k++) idx = (idx + 1) % gaps.length;
      usedGaps.add(idx);
      const g = gaps[idx];
      return { id, kind: 'grammar', english: g.english, before: g.before, after: g.after, answer: g.answer, options: seededShuffle([...g.options], rng) };
    }
    const pool = sentences.filter(s => !usedSentences.has(s.id));
    const s = (pool.length ? pool : sentences)[Math.floor(rng() * (pool.length || sentences.length))];
    usedSentences.add(s.id);
    const tokens = s.target.split(/\s+/);
    let order = seededShuffle(tokens.map((_, k) => k), rng);
    if (order.every((v, k) => tokens[v] === tokens[k])) order = [...order.slice(1), order[0]];
    return { id, kind: 'build', english: s.english, target: s.target, tokens, order, sentenceId: `daily-${s.id}` };
  });
}

// ---------- results + history ----------
export function dailyScore(correct: number) { return Math.max(0, Math.min(1000, correct * 100)); }
export function dailyStars(correct: number) { return correct >= 10 ? 3 : correct >= 8 ? 2 : correct >= 5 ? 1 : 0; }
export function dailySessionId(dateKey: string, language: Language) { return `daily-${language}-${dateKey}`; }

export type DailyEntry = { dateKey: string; score: number; stars: number; grid: string; xp: number };

export function readDailyHistory(progress: Progress, language: Language): DailyEntry[] {
  return arcadeDailyHistory(progress, language);
}

export function dailyStreak(keys: Set<string>, today: string) {
  let cursor = keys.has(today) ? today : shiftDateKey(today, -1);
  let n = 0;
  while (keys.has(cursor)) { n++; cursor = shiftDateKey(cursor, -1); }
  return n;
}

export function lastNDays(today: string, n = 28) {
  return Array.from({ length: n }, (_, i) => shiftDateKey(today, i - (n - 1)));
}

export function dailyShareText(entry: DailyEntry, language: Language) {
  const squares = Array.from(entry.grid.padEnd(DAILY_QUESTION_COUNT, '0').slice(0, DAILY_QUESTION_COUNT))
    .map(c => (c === '1' ? '\u{1F7E9}' : '\u{1F7E5}')).join('');
  const correct = Array.from(entry.grid).filter(c => c === '1').length;
  return [
    `LinguaMatch Daily · ${LANGUAGE_META[language].label} · ${entry.dateKey}`,
    `${correct}/10 · ${entry.score}/1000`,
    squares,
  ].join('\n');
}
