import { CATEGORIES, getUniqueVocabularyPairs, type Language } from '@/data/vocabulary';
import { shuffle } from './vocab';

export type SortBucket = 'a' | 'b';
export interface SortItem {
  english: string;
  word: string;
  /** Full form shown after answering, e.g. "la mela". */
  reveal: string;
  bucket: SortBucket;
}

type G = 'm' | 'f';
type Entry = { e: string; it: [G, string]; fr: [G, string]; es: [G, string] };

/**
 * Curated nouns with standard dictionary gender and definite article.
 * Each entry is only used when the app's own translation equals the noun here,
 * so the article always matches the word the learner sees.
 */
const CURATED: Entry[] = [
  { e: 'dog', it: ['m', 'il cane'], fr: ['m', 'le chien'], es: ['m', 'el perro'] },
  { e: 'cat', it: ['m', 'il gatto'], fr: ['m', 'le chat'], es: ['m', 'el gato'] },
  { e: 'horse', it: ['m', 'il cavallo'], fr: ['m', 'le cheval'], es: ['m', 'el caballo'] },
  { e: 'cow', it: ['f', 'la mucca'], fr: ['f', 'la vache'], es: ['f', 'la vaca'] },
  { e: 'bird', it: ['m', "l'uccello"], fr: ['m', "l'oiseau"], es: ['m', 'el pájaro'] },
  { e: 'fish', it: ['m', 'il pesce'], fr: ['m', 'le poisson'], es: ['m', 'el pez'] },
  { e: 'bee', it: ['f', "l'ape"], fr: ['f', "l'abeille"], es: ['f', 'la abeja'] },
  { e: 'frog', it: ['f', 'la rana'], fr: ['f', 'la grenouille'], es: ['f', 'la rana'] },
  { e: 'mouse', it: ['m', 'il topo'], fr: ['f', 'la souris'], es: ['m', 'el ratón'] },
  { e: 'turtle', it: ['f', 'la tartaruga'], fr: ['f', 'la tortue'], es: ['f', 'la tortuga'] },
  { e: 'apple', it: ['f', 'la mela'], fr: ['f', 'la pomme'], es: ['f', 'la manzana'] },
  { e: 'bread', it: ['m', 'il pane'], fr: ['m', 'le pain'], es: ['m', 'el pan'] },
  { e: 'milk', it: ['m', 'il latte'], fr: ['m', 'le lait'], es: ['f', 'la leche'] },
  { e: 'cheese', it: ['m', 'il formaggio'], fr: ['m', 'le fromage'], es: ['m', 'el queso'] },
  { e: 'tomato', it: ['m', 'il pomodoro'], fr: ['f', 'la tomate'], es: ['m', 'el tomate'] },
  { e: 'cake', it: ['f', 'la torta'], fr: ['m', 'le gâteau'], es: ['m', 'el pastel'] },
  { e: 'rice', it: ['m', 'il riso'], fr: ['m', 'le riz'], es: ['m', 'el arroz'] },
  { e: 'soup', it: ['f', 'la zuppa'], fr: ['f', 'la soupe'], es: ['f', 'la sopa'] },
  { e: 'salad', it: ['f', "l'insalata"], fr: ['f', 'la salade'], es: ['f', 'la ensalada'] },
  { e: 'butter', it: ['m', 'il burro'], fr: ['m', 'le beurre'], es: ['f', 'la mantequilla'] },
  { e: 'salt', it: ['m', 'il sale'], fr: ['m', 'le sel'], es: ['f', 'la sal'] },
  { e: 'strawberry', it: ['f', 'la fragola'], fr: ['f', 'la fraise'], es: ['f', 'la fresa'] },
  { e: 'lemon', it: ['m', 'il limone'], fr: ['m', 'le citron'], es: ['m', 'el limón'] },
  { e: 'carrot', it: ['f', 'la carota'], fr: ['f', 'la carotte'], es: ['f', 'la zanahoria'] },
  { e: 'head', it: ['f', 'la testa'], fr: ['f', 'la tête'], es: ['f', 'la cabeza'] },
  { e: 'hand', it: ['f', 'la mano'], fr: ['f', 'la main'], es: ['f', 'la mano'] },
  { e: 'foot', it: ['m', 'il piede'], fr: ['m', 'le pied'], es: ['m', 'el pie'] },
  { e: 'eye', it: ['m', "l'occhio"], fr: ['m', "l'œil"], es: ['m', 'el ojo'] },
  { e: 'mouth', it: ['f', 'la bocca'], fr: ['f', 'la bouche'], es: ['f', 'la boca'] },
  { e: 'nose', it: ['m', 'il naso'], fr: ['m', 'le nez'], es: ['f', 'la nariz'] },
  { e: 'ear', it: ['m', "l'orecchio"], fr: ['f', "l'oreille"], es: ['f', 'la oreja'] },
  { e: 'heart', it: ['m', 'il cuore'], fr: ['m', 'le cœur'], es: ['m', 'el corazón'] },
  { e: 'arm', it: ['m', 'il braccio'], fr: ['m', 'le bras'], es: ['m', 'el brazo'] },
  { e: 'leg', it: ['f', 'la gamba'], fr: ['f', 'la jambe'], es: ['f', 'la pierna'] },
  { e: 'mother', it: ['f', 'la madre'], fr: ['f', 'la mère'], es: ['f', 'la madre'] },
  { e: 'father', it: ['m', 'il padre'], fr: ['m', 'le père'], es: ['m', 'el padre'] },
  { e: 'sister', it: ['f', 'la sorella'], fr: ['f', 'la sœur'], es: ['f', 'la hermana'] },
  { e: 'brother', it: ['m', 'il fratello'], fr: ['m', 'le frère'], es: ['m', 'el hermano'] },
];

const LANG_KEY = { italian: 'it', french: 'fr', spanish: 'es' } as const;

function stripArticle(phrase: string) {
  return phrase.replace(/^(il |lo |la |le |el |l')/i, '');
}

export function getSortBuckets(language: Language): { a: string; b: string; aHint: string; bHint: string; title: string } {
  switch (language) {
    case 'italian': return { a: 'Masculine', b: 'Feminine', aHint: 'il · lo · l’', bHint: 'la · l’', title: 'Which gender?' };
    case 'french': return { a: 'Masculine', b: 'Feminine', aHint: 'le · l’', bHint: 'la · l’', title: 'Which gender?' };
    case 'spanish': return { a: 'Masculine', b: 'Feminine', aHint: 'el', bHint: 'la', title: 'Which gender?' };
    default: return { a: 'Thing', b: 'Action', aHint: 'noun', bHint: 'verb', title: 'Noun or verb?' };
  }
}

export function buildSortDeck(language: Language, size = 24): SortItem[] {
  if (language === 'armenian') return buildArmenianDeck(size);
  const key = LANG_KEY[language];
  const pool = new Map(getUniqueVocabularyPairs(language).map(p => [p.english, p] as const));
  const items: SortItem[] = [];
  for (const entry of CURATED) {
    const pair = pool.get(entry.e);
    const [g, phrase] = entry[key];
    const noun = stripArticle(phrase);
    // Only trust our gender when the app shows exactly this noun.
    if (!pair || pair.translations[language].trim().toLocaleLowerCase() !== noun.toLocaleLowerCase()) continue;
    items.push({ english: entry.e, word: pair.translations[language], reveal: phrase, bucket: g === 'm' ? 'a' : 'b' });
  }
  return shuffle(items).slice(0, size);
}

/**
 * Western Armenian has no grammatical gender. Sort by word type instead, using
 * category membership: concrete-noun topics vs the curated Verbs category.
 */
function buildArmenianDeck(size: number): SortItem[] {
  const nounTopics = ['animals', 'food', 'body', 'family'];
  const nouns: SortItem[] = [];
  const verbs: SortItem[] = [];
  for (const cat of CATEGORIES) {
    const isNoun = nounTopics.includes(cat.id);
    const isVerb = cat.id === 'verbs';
    if (!isNoun && !isVerb) continue;
    for (const level of cat.levels) {
      for (const p of level.pairs) {
        const w = p.translations.armenian?.trim();
        if (!w || /\s/.test(w)) continue;
        if (isVerb && !/(ել|ալ|իլ|ուլ)$/.test(w)) continue;
        const item: SortItem = { english: p.english, word: w, reveal: `${w} · ${isVerb ? 'to ' + p.english.replace(/^to /, '') : p.english}`, bucket: isNoun ? 'a' : 'b' };
        (isNoun ? nouns : verbs).push(item);
      }
    }
  }
  const half = Math.floor(size / 2);
  return shuffle([...shuffle(nouns).slice(0, half), ...shuffle(verbs).slice(0, half)]);
}
