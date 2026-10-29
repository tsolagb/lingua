import { CATEGORIES, getUniqueVocabularyPairs, type Language, type WordPair } from '@/data/vocabulary';

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function makeSessionId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Split into user-perceived characters (handles combining marks and Armenian). */
export function graphemes(word: string): string[] {
  const Seg = (Intl as any)?.Segmenter;
  if (Seg) {
    try {
      return Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(word), (s: any) => s.segment as string);
    } catch { /* fall through */ }
  }
  const out: string[] = [];
  for (const ch of Array.from(word)) {
    if (/\p{M}/u.test(ch) && out.length) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

const CLASSROOM_CATEGORY_IDS = new Set(CATEGORIES.filter(c => !c.id.startsWith('vocabulary-')).map(c => c.id));

/** Hand-curated topic words first (classroom vocabulary), all four languages. */
export function getClassroomPairs(language: Language): WordPair[] {
  const seen = new Set<string>();
  const out: WordPair[] = [];
  for (const category of CATEGORIES) {
    if (!CLASSROOM_CATEGORY_IDS.has(category.id)) continue;
    for (const level of category.levels) {
      for (const pair of level.pairs) {
        const t = pair.translations[language]?.trim();
        if (!t || seen.has(pair.english)) continue;
        seen.add(pair.english);
        out.push(pair);
      }
    }
  }
  return out.length >= 20 ? out : getUniqueVocabularyPairs(language);
}

/** Single words suitable for falling bubbles / swipe cards. */
export function getShortWordPairs(language: Language, maxLength = 16): WordPair[] {
  return getClassroomPairs(language).filter(p => {
    const t = p.translations[language];
    return t && graphemes(t).length <= maxLength && !t.includes('/') && !t.includes('(');
  });
}

/** Single-token words with a spellable length for Letter Chain. */
export function getSpellablePairs(language: Language): WordPair[] {
  return getClassroomPairs(language).filter(p => {
    const t = p.translations[language];
    if (!t || /[\s\-'’.,/()]/.test(t)) return false;
    const n = graphemes(t).length;
    return n >= 3 && n <= (language === 'armenian' ? 7 : 8);
  });
}

export function translationsEqual(a: string, b: string) {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

/** Pick distractor translations that differ from the target's translation. */
export function pickDistractors(pool: WordPair[], target: WordPair, language: Language, count: number): WordPair[] {
  const norm = (x: string) => x.trim().toLocaleLowerCase().normalize('NFC');
  const out: WordPair[] = [];
  const used = new Set<string>([norm(target.translations[language])]);
  const targetEnglish = norm(target.english);
  for (const p of shuffle(pool)) {
    const v = norm(p.translations[language] ?? '');
    if (!v || used.has(v) || norm(p.english) === targetEnglish) continue;
    used.add(v);
    out.push(p);
    if (out.length >= count) break;
  }
  return out;
}

export function starsFor(value: number, thresholds: [number, number, number]) {
  if (value >= thresholds[2]) return 3;
  if (value >= thresholds[1]) return 2;
  if (value >= thresholds[0]) return 1;
  return 0;
}
