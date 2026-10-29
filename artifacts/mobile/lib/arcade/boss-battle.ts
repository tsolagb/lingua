import type { Language } from '@/data/vocabulary';
import {
  GUIDED_CATEGORY_ID,
  GUIDED_LEVELS_PER_MILESTONE,
  GUIDED_MILESTONES,
  getGuidedLevel,
  type GuidedSentence,
  type GuidedWord,
} from '@/data/guided-curriculum';
import { shuffle } from '@/lib/arcade/voice-utils';

export const BOSS_HP = 100;
export const BOSS_QUESTION_SECONDS = 10;
export const BOSS_HEARTS = 3;

export type BossKind = 'vocab' | 'grammar' | 'listen' | 'reading';
export interface BossQuestion {
  id: string;
  kind: BossKind;
  prompt: string;
  /** Text to speak for listening questions. */
  audio?: string;
  translation?: string;
  answer: string;
  options: string[];
  explanation: string;
  pair?: GuidedWord;
  sentence?: GuidedSentence;
}

export function checkpointLevelIndex(milestone: number) {
  return milestone * GUIDED_LEVELS_PER_MILESTONE + (GUIDED_LEVELS_PER_MILESTONE - 1);
}

export function isBossUnlocked(isLevelCompleted: (c: string, l: number) => boolean, milestone: number) {
  return milestone >= 0 && milestone < GUIDED_MILESTONES.length && isLevelCompleted(GUIDED_CATEGORY_ID, checkpointLevelIndex(milestone));
}

export function parseMilestoneParam(v: unknown): number | null {
  const s = Array.isArray(v) ? v[0] : v;
  if (typeof s !== 'string' || !/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n < GUIDED_MILESTONES.length ? n : null;
}

/**
 * Builds the boss pool strictly from this milestone's guided levels (0-8):
 * their vocabulary translations, grammar blanks and listening items.
 * Listening becomes a reading item when audio is unavailable/muted.
 */
export function buildBossQuestions(language: Language, milestone: number, audioOn: boolean, count = 14): BossQuestion[] {
  const seen = new Set<string>();
  const vocab: BossQuestion[] = [];
  const grammar: BossQuestion[] = [];
  const listen: BossQuestion[] = [];
  for (let l = 0; l < GUIDED_LEVELS_PER_MILESTONE; l++) {
    let level;
    try { level = getGuidedLevel(language, milestone, l); } catch { continue; }
    for (const ex of level.exercises) {
      if (ex.kind !== 'choice' || ex.options.length < 2) continue;
      const key = `${ex.mode}|${ex.prompt}|${ex.answer}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const base = { id: ex.id, answer: ex.answer, options: shuffle(ex.options), explanation: ex.explanation, pair: ex.pair, sentence: ex.sentence, translation: ex.translation };
      if (ex.mode === 'blank' || ex.mode === 'grammar') grammar.push({ ...base, kind: 'grammar', prompt: ex.prompt });
      else if (ex.mode === 'listen' && ex.pair) {
        const target = ex.pair.translations[language];
        listen.push(audioOn
          ? { ...base, kind: 'listen', prompt: 'Listen and choose the meaning', audio: target }
          : { ...base, kind: 'reading', prompt: target });
      } else if (ex.pair || ex.mode === 'translation') vocab.push({ ...base, kind: 'vocab', prompt: ex.prompt });
    }
  }
  const g = shuffle(grammar), v = shuffle(vocab), li = shuffle(listen);
  const out: BossQuestion[] = [];
  // Interleave: vocab, grammar, vocab, listen ...
  const order = [v, g, v, li];
  let i = 0, guard = 0;
  while (out.length < count && guard < 400) {
    const src = order[i % order.length];
    const q = src.shift();
    if (q) out.push(q);
    i++; guard++;
    if (!v.length && !g.length && !li.length) break;
  }
  return out;
}

/** Deterministic monster look per milestone. */
export function bossLook(milestone: number) {
  const hue = (milestone * 47 + 200) % 360;
  return {
    body: hsl(hue, 72, 58),
    lip: hsl(hue, 70, 40),
    belly: hsl(hue, 80, 82),
    horn: hsl((hue + 180) % 360, 85, 62),
    eyes: (milestone % 3) + 1,
    horns: milestone % 2 === 0 ? 2 : 3,
    spikes: 3 + (milestone % 4),
    name: BOSS_NAMES[milestone % BOSS_NAMES.length],
  };
}

const BOSS_NAMES = ['Grumblob', 'Snaggle', 'Wobbleton', 'Fizzmaw', 'Krunchbelly', 'Mumblefog', 'Plonk', 'Gobbledrum', 'Zigzorp', 'Blusterhorn'];

function hsl(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

export function bossDamage(secondsLeft: number) {
  return Math.round(9 + 7 * Math.max(0, Math.min(1, secondsLeft / BOSS_QUESTION_SECONDS)));
}
