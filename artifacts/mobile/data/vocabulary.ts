import { ARMENIAN_TRANSLATIONS } from '@/data/armenian-vocabulary';
import {
  GENERATED_VOCABULARY,
  GENERATED_VOCABULARY_REVIEW_STATUS,
  type GeneratedVocabularyStage,
} from '@/data/generated-vocabulary';
import { GENERATED_VOCABULARY_ADDITIONS } from '@/data/generated-vocabulary-additions';
import {
  NEW_PRACTICAL_WORDS,
  PRACTICAL_TOPIC_HEADWORDS,
  PRACTICAL_TOPIC_REVIEW_NOTICE,
} from '@/data/practical-topic-vocabulary';
import { THEMATIC_CATEGORIES } from '@/data/thematic-vocabulary';
import { ITALIAN_FREQUENCY_SOURCE } from '@/data/italian-frequency-source';
import { ITALIAN_STUDY_GUIDE_SOURCE } from '@/data/italian-study-guide-source';

export type Language = 'italian' | 'french' | 'spanish' | 'armenian';

export const SUPPORTED_LANGUAGES: readonly Language[] = [
  'italian',
  'french',
  'spanish',
  'armenian',
];

export const LANGUAGE_META: Record<Language, { label: string; flag: string; nativeLabel: string }> = {
  italian:  { label: 'Italian',  flag: '🇮🇹', nativeLabel: 'Italiano' },
  french:   { label: 'French',   flag: '🇫🇷', nativeLabel: 'Français' },
  spanish:  { label: 'Spanish',  flag: '🇪🇸', nativeLabel: 'Español'  },
  armenian: { label: 'Armenian', flag: '🇦🇲', nativeLabel: 'Արեւմտահայերէն' },
};

export interface ExampleTranslations {
  english: string;
  italian: string;
  french: string;
  spanish: string;
  armenian?: string;
}
export interface WordPair {
  english: string;

  translations: { italian: string; french: string; spanish: string; armenian: string };
  /** Machine-generated translations stay unverified until a human/source review is completed. */
  translationReviewStatus?: 'pending-review' | 'verified';
  frequencyRank?: number;
  /** Supplemental words append after the established core pool to preserve saved stage positions. */
  generalPoolAppendOrder?: number;
  partOfSpeech?: string;
  /** Set only when a session includes this item from the persistent review queue. */

  isReview?: boolean;

  context?: {
    explanation: string;
    example: string;
  };

  examples?: ExampleTranslations;
}

export type TheologyGuideWordPair = WordPair & {
  context: NonNullable<WordPair['context']>;
};
export interface Level { pairs: WordPair[] }

export interface Category {
  id: string; name: string; icon: string; emoji: string;
  bgColor: string; accentColor: string; levels: Level[];
  section?: 'real-life' | 'vocabulary';
  practicePolicy?: 'cumulative' | 'current-level-only';
  translationReviewNotice?: string;
  availableLanguages?: readonly Language[];
}

export function isCategoryAvailable(
  category: Pick<Category, 'availableLanguages'>,
  language: Language,
): boolean {
  return !category.availableLanguages || category.availableLanguages.includes(language);
}

export function getCumulativePairs(
  category: (Pick<Category, 'levels'> & Partial<Pick<Category, 'practicePolicy'>>) | undefined,
  levelIndex: number,
): WordPair[] {
  if (!category || category.levels.length === 0 || !Number.isFinite(levelIndex)) return [];
  const lastLevel = Math.max(0, Math.min(Math.floor(levelIndex), category.levels.length - 1));
  if (category.practicePolicy !== 'cumulative') {
    return category.levels[lastLevel].pairs;
  }
  return category.levels.slice(0, lastLevel + 1).flatMap(level => level.pairs);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper for compact pair definition
// ─────────────────────────────────────────────────────────────────────────────
type T = { italian: string; french: string; spanish: string };

const ex = (english: string, italian: string, french: string, spanish: string): ExampleTranslations =>
  ({ english, italian, french, spanish });
const p = (
  english: string,
  t: T,
  details?: ExampleTranslations | WordPair['context'],
): WordPair => {
  const armenian = ARMENIAN_TRANSLATIONS[english];
  if (!armenian) {
    throw new Error(`Missing Western Armenian translation for "${english}".`);
  }
  const additionalFields = details
    ? 'english' in details
      ? { examples: details }
      : { context: details }
    : {};
  return {
    english,
    translations: { ...t, armenian },
    ...additionalFields,
  };
};

const GENERATED_VOCABULARY_LEVEL_SIZE = 50;
const ALL_GENERATED_VOCABULARY = [
  ...GENERATED_VOCABULARY,
  ...GENERATED_VOCABULARY_ADDITIONS,
];

const GENERATED_VERB_TRANSLATIONS = new Map(
  ALL_GENERATED_VOCABULARY
    .filter(row => ['verb', 'v', 'vn', 'avn', 'arv'].includes(row[7]))
    .map(row => [row[0].toLocaleLowerCase(), row] as const),
);

const verb = (english: string, existingTranslations?: T): WordPair => {
  const generated = GENERATED_VERB_TRANSLATIONS.get(english.toLocaleLowerCase());
  if (generated) {
    const [, italian, french, spanish, armenian, , frequencyRank] = generated;
    return {
      english,
      translations: { italian, french, spanish, armenian },
      translationReviewStatus: GENERATED_VOCABULARY_REVIEW_STATUS,
      frequencyRank,
      partOfSpeech: 'verb',
    };
  }

  if (!existingTranslations) {
    throw new Error(`Missing translations for verb vocabulary word "${english}".`);
  }
  return {
    ...p(english, existingTranslations),
    translationReviewStatus: GENERATED_VOCABULARY_REVIEW_STATUS,
    partOfSpeech: 'verb',
  };
};

function buildGeneratedVocabularyLevels(stage: GeneratedVocabularyStage): Level[] {
  const pairs = ALL_GENERATED_VOCABULARY
    .filter(row => row[5] === stage)
    .map(([english, italian, french, spanish, armenian, _stage, frequencyRank, partOfSpeech]) => ({
      english,
      translations: { italian, french, spanish, armenian },
      translationReviewStatus: GENERATED_VOCABULARY_REVIEW_STATUS,
      frequencyRank,
      partOfSpeech,
    }));

  const levels: Level[] = [];
  for (let start = 0; start < pairs.length; start += GENERATED_VOCABULARY_LEVEL_SIZE) {
    levels.push({
      pairs: pairs.slice(start, start + GENERATED_VOCABULARY_LEVEL_SIZE),
    });
  }
  return levels;
}

const GENERATED_VOCABULARY_CATEGORIES: Category[] = [
  {
    id: 'vocabulary-core',
    name: 'Core Words',
    icon: 'book-open-variant',
    emoji: '📘',
    bgColor: '#EFF6FF',
    accentColor: '#1F6FEB',
    section: 'vocabulary',
    practicePolicy: 'current-level-only',
    translationReviewNotice: 'Machine-generated translations; review pending. Western Armenian needs Nayiri/native verification.',
    levels: buildGeneratedVocabularyLevels('core'),
  },
  {
    id: 'vocabulary-everyday',
    name: 'Everyday Words',
    icon: 'chat-outline',
    emoji: '💬',
    bgColor: '#E0F2FE',
    accentColor: '#0284C7',
    section: 'vocabulary',
    practicePolicy: 'current-level-only',
    translationReviewNotice: 'Machine-generated translations; review pending. Western Armenian needs Nayiri/native verification.',
    levels: buildGeneratedVocabularyLevels('everyday'),
  },
  {
    id: 'vocabulary-intermediate',
    name: 'Intermediate Words',
    icon: 'lightbulb-outline',
    emoji: '💡',
    bgColor: '#DBEAFE',
    accentColor: '#185AC7',
    section: 'vocabulary',
    practicePolicy: 'current-level-only',
    translationReviewNotice: 'Machine-generated translations; review pending. Western Armenian needs Nayiri/native verification.',
    levels: buildGeneratedVocabularyLevels('intermediate'),
  },
  {
    id: 'vocabulary-advanced',
    name: 'Advanced Words',
    icon: 'school-outline',
    emoji: '🎓',
    bgColor: '#EEF2FF',
    accentColor: '#4F46E5',
    section: 'vocabulary',
    practicePolicy: 'current-level-only',
    translationReviewNotice: 'Machine-generated translations; review pending. Western Armenian needs Nayiri/native verification.',
    levels: buildGeneratedVocabularyLevels('advanced'),
  },
];

const ITALIAN_FREQUENCY_PAIRS: WordPair[] = (() => {
  const seenPairs = new Set<string>();
  return ITALIAN_FREQUENCY_SOURCE.flatMap(({ rank, english: sourceEnglish, italian }) => {
    // The source uses the same English gloss for two different Italian forms;
    // label those senses so both remain clear and practiceable.
    const english = rank === 4
      ? 'that (conjunction)'
      : rank === 25
        ? 'that (demonstrative)'
        : sourceEnglish;
    const pairKey = `${english.trim().toLocaleLowerCase()}::${italian.trim().toLocaleLowerCase()}`;
    if (seenPairs.has(pairKey)) return [];
    seenPairs.add(pairKey);
    return [{
      english,
      translations: { italian, french: '', spanish: '', armenian: '' },
      translationReviewStatus: 'pending-review',
      frequencyRank: rank,
      generalPoolAppendOrder: rank,
    }];
  });
})();

const ITALIAN_STUDY_GUIDE_PAIRS: WordPair[] = ITALIAN_STUDY_GUIDE_SOURCE.map(
  ({ english, italian }, index) => ({
    english,
    translations: { italian, french: '', spanish: '', armenian: '' },
    translationReviewStatus: 'pending-review',
    generalPoolAppendOrder: ITALIAN_FREQUENCY_SOURCE.length + index + 1,
  }),
);

function buildItalianStudyGuideLevels(): Level[] {
  const headwordGroups = new Map<string, WordPair[]>();
  for (const pair of ITALIAN_STUDY_GUIDE_PAIRS) {
    const key = pair.english.trim().toLocaleLowerCase();
    const group = headwordGroups.get(key) ?? [];
    group.push(pair);
    headwordGroups.set(key, group);
  }

  const levels: Level[] = [];
  let currentPairs: WordPair[] = [];
  for (const group of headwordGroups.values()) {
    if (currentPairs.length && currentPairs.length + group.length > 50) {
      levels.push({ pairs: currentPairs });
      currentPairs = [];
    }
    currentPairs.push(...group);
  }
  if (currentPairs.length) levels.push({ pairs: currentPairs });
  return levels;
}

export const CATEGORIES: Category[] = [
  // ── 1. Animals ────────────────────────────────────────────────────────────
  {
    id: 'animals', name: 'Animals', icon: 'paw', emoji: '🐾',
    bgColor: '#EAF2FF', accentColor: '#1F6FEB',
    levels: [
      { pairs: [
        p('dog',       { italian:'cane',      french:'chien',    spanish:'perro'    }),
        p('cat',       { italian:'gatto',     french:'chat',     spanish:'gato'     }),
        p('bird',      { italian:'uccello',   french:'oiseau',   spanish:'pájaro'   }),
        p('fish',      { italian:'pesce',     french:'poisson',  spanish:'pez'      }),
        p('horse',     { italian:'cavallo',   french:'cheval',   spanish:'caballo'  }),
        p('cow',       { italian:'mucca',     french:'vache',    spanish:'vaca'     }),
      ]},
      { pairs: [
        p('pig',       { italian:'maiale',    french:'cochon',   spanish:'cerdo'    }),
        p('rabbit',    { italian:'coniglio',  french:'lapin',    spanish:'conejo'   }),
        p('bear',      { italian:'orso',      french:'ours',     spanish:'oso'      }),
        p('elephant',  { italian:'elefante',  french:'éléphant', spanish:'elefante' }),
        p('lion',      { italian:'leone',     french:'lion',     spanish:'león'     }),
        p('duck',      { italian:'anatra',    french:'canard',   spanish:'pato'     }),
      ]},
      { pairs: [
        p('frog',      { italian:'rana',      french:'grenouille',spanish:'rana'    }),
        p('bee',       { italian:'ape',       french:'abeille',  spanish:'abeja'    }),
        p('butterfly', { italian:'farfalla',  french:'papillon', spanish:'mariposa' }),
        p('mouse',     { italian:'topo',      french:'souris',   spanish:'ratón'    }),
        p('turtle',    { italian:'tartaruga', french:'tortue',   spanish:'tortuga'  }),
        p('wolf',      { italian:'lupo',      french:'loup',     spanish:'lobo'     }),
      ]},
      { pairs: [
        p('monkey',    { italian:'scimmia',   french:'singe',    spanish:'mono'     }),
        p('shark',     { italian:'squalo',    french:'requin',   spanish:'tiburón'  }),
        p('giraffe',   { italian:'giraffa',   french:'girafe',   spanish:'jirafa'   }),
        p('penguin',   { italian:'pinguino',  french:'pingouin', spanish:'pingüino' }),
        p('crocodile', { italian:'coccodrillo',french:'crocodile',spanish:'cocodrilo'}),
        p('parrot',    { italian:'pappagallo',french:'perroquet',spanish:'loro'     }),
      ]},
      { pairs: [
        p('kangaroo',  { italian:'canguro',   french:'kangourou',spanish:'canguro'  }),
        p('zebra',     { italian:'zebra',     french:'zèbre',    spanish:'cebra'    }),
        p('flamingo',  { italian:'fenicottero',french:'flamant', spanish:'flamenco' }),
        p('panda',     { italian:'panda',     french:'panda',    spanish:'panda'    }),
        p('octopus',   { italian:'polpo',     french:'pieuvre',  spanish:'pulpo'    }),
        p('eagle',     { italian:'aquila',    french:'aigle',    spanish:'águila'   }),
      ]},
      { pairs: [
        p('cheetah',       { italian:'ghepardo',    french:'guépard',     spanish:'guepardo'    }),
        p('gorilla',       { italian:'gorilla',     french:'gorille',     spanish:'gorila'      }),
        p('rhinoceros',    { italian:'rinoceronte', french:'rhinocéros',  spanish:'rinoceronte' }),
        p('hippopotamus',  { italian:'ippopotamo',  french:'hippopotame', spanish:'hipopótamo'  }),
        p('peacock',       { italian:'pavone',      french:'paon',        spanish:'pavo real'   }),
        p('platypus',      { italian:'ornitorinco', french:'ornithorynque',spanish:'ornitorrinco'}),
      ]},
    ],
  },

  // ── 2. Food ───────────────────────────────────────────────────────────────
  {
    id: 'food', name: 'Food', icon: 'food-apple', emoji: '🍎',
    section: 'vocabulary',
    bgColor: '#FCE7F3', accentColor: '#BE185D',
    levels: [
      { pairs: [
        p('apple',   { italian:'mela',      french:'pomme',   spanish:'manzana' }),
        p('bread',   { italian:'pane',      french:'pain',    spanish:'pan'     }),
        p('milk',    { italian:'latte',     french:'lait',    spanish:'leche'   }),
        p('egg',     { italian:'uovo',      french:'œuf',     spanish:'huevo'   }),
        p('cheese',  { italian:'formaggio', french:'fromage', spanish:'queso'   }),
        p('pizza',   { italian:'pizza',     french:'pizza',   spanish:'pizza'   }),
      ]},
      { pairs: [
        p('pasta',   { italian:'pasta',    french:'pâtes',  spanish:'pasta'   }),
        p('tomato',  { italian:'pomodoro', french:'tomate', spanish:'tomate'  }),
        p('banana',  { italian:'banana',   french:'banane', spanish:'banana'  }),
        p('orange',  { italian:'arancia',  french:'orange', spanish:'naranja' }),
        p('cake',    { italian:'torta',    french:'gâteau', spanish:'pastel'  }),
        p('rice',    { italian:'riso',     french:'riz',    spanish:'arroz'   }),
      ]},
      { pairs: [
        p('strawberry', { italian:'fragola',    french:'fraise',   spanish:'fresa'      }),
        p('chocolate',  { italian:'cioccolato', french:'chocolat', spanish:'chocolate'  }),
        p('carrot',     { italian:'carota',     french:'carotte',  spanish:'zanahoria'  }),
        p('grape',      { italian:'uva',        french:'raisin',   spanish:'uva'        }),
        p('lemon',      { italian:'limone',     french:'citron',   spanish:'limón'      }),
        p('peach',      { italian:'pesca',      french:'pêche',    spanish:'melocotón'  }),
      ]},
      { pairs: [
        p('soup',   { italian:'zuppa',     french:'soupe',  spanish:'sopa'      }),
        p('salad',  { italian:'insalata',  french:'salade', spanish:'ensalada'  }),
        p('butter', { italian:'burro',     french:'beurre', spanish:'mantequilla'}),
        p('sugar',  { italian:'zucchero',  french:'sucre',  spanish:'azúcar'    }),
        p('salt',   { italian:'sale',      french:'sel',    spanish:'sal'       }),
        p('pepper', { italian:'pepe',      french:'poivre', spanish:'pimienta'  }),
      ]},
      { pairs: [
        p('mushroom',  { italian:'fungo',    french:'champignon',spanish:'champiñón' }),
        p('cucumber',  { italian:'cetriolo', french:'concombre', spanish:'pepino'    }),
        p('onion',     { italian:'cipolla',  french:'oignon',    spanish:'cebolla'   }),
        p('garlic',    { italian:'aglio',    french:'ail',       spanish:'ajo'       }),
        p('spinach',   { italian:'spinaci',  french:'épinards',  spanish:'espinacas' }),
        p('broccoli',  { italian:'broccoli', french:'brocoli',   spanish:'brócoli'   }),
      ]},
      { pairs: [
        p('avocado',     { italian:'avocado',  french:'avocat',        spanish:'aguacate'  }),
        p('mango',       { italian:'mango',    french:'mangue',        spanish:'mango'     }),
        p('pineapple',   { italian:'ananas',   french:'ananas',        spanish:'piña'      }),
        p('coconut',     { italian:'cocco',    french:'noix de coco',  spanish:'coco'      }),
        p('watermelon',  { italian:'anguria',  french:'pastèque',      spanish:'sandía'    }),
        p('blueberry',   { italian:'mirtillo', french:'myrtille',      spanish:'arándano'  }),
      ]},
    ],
  },

  // ── 3. Colors ─────────────────────────────────────────────────────────────
  {
    id: 'colors', name: 'Colors', icon: 'palette', emoji: '🎨',
    bgColor: '#EDE9FE', accentColor: '#7C3AED',
    levels: [
      { pairs: [
        p('red',    { italian:'rosso',     french:'rouge',  spanish:'rojo'     }),
        p('blue',   { italian:'blu',       french:'bleu',   spanish:'azul'     }),
        p('green',  { italian:'verde',     french:'vert',   spanish:'verde'    }),
        p('yellow', { italian:'giallo',    french:'jaune',  spanish:'amarillo' }),
        p('orange', { italian:'arancione', french:'orange', spanish:'naranja'  }),
        p('purple', { italian:'viola',     french:'violet', spanish:'morado'   }),
      ]},
      { pairs: [
        p('pink',   { italian:'rosa',    french:'rose',   spanish:'rosa'   }),
        p('white',  { italian:'bianco',  french:'blanc',  spanish:'blanco' }),
        p('black',  { italian:'nero',    french:'noir',   spanish:'negro'  }),
        p('brown',  { italian:'marrone', french:'marron', spanish:'marrón' }),
        p('grey',   { italian:'grigio',  french:'gris',   spanish:'gris'   }),
        p('gold',   { italian:'oro',     french:'or',     spanish:'oro'    }),
      ]},
      { pairs: [
        p('silver',    { italian:'argento',  french:'argent',    spanish:'plata'    }),
        p('turquoise', { italian:'turchese', french:'turquoise', spanish:'turquesa' }),
        p('navy',      { italian:'blu navy', french:'marine',    spanish:'marino'   }),
        p('cream',     { italian:'crema',    french:'crème',     spanish:'crema'    }),
        p('beige',     { italian:'beige',    french:'beige',     spanish:'beige'    }),
        p('magenta',   { italian:'magenta',  french:'magenta',   spanish:'magenta'  }),
      ]},
      { pairs: [
        p('scarlet',  { italian:'scarlatto', french:'écarlate', spanish:'escarlata' }),
        p('indigo',   { italian:'indaco',    french:'indigo',   spanish:'índigo'    }),
        p('coral',    { italian:'corallo',   french:'corail',   spanish:'coral'     }),
        p('olive',    { italian:'oliva',     french:'olive',    spanish:'oliva'     }),
        p('maroon',   { italian:'bordeaux',  french:'bordeaux', spanish:'granate'   }),
        p('lavender', { italian:'lavanda',   french:'lavande',  spanish:'lavanda'   }),
      ]},
      { pairs: [
        p('emerald',  { italian:'smeraldo', french:'émeraude', spanish:'esmeralda' }),
        p('sapphire', { italian:'zaffiro',  french:'saphir',   spanish:'zafiro'    }),
        p('ruby',     { italian:'rubino',   french:'rubis',    spanish:'rubí'      }),
        p('amber',    { italian:'ambra',    french:'ambre',    spanish:'ámbar'     }),
        p('crimson',  { italian:'cremisi',  french:'cramoisi', spanish:'carmesí'   }),
        p('ivory',    { italian:'avorio',   french:'ivoire',   spanish:'marfil'    }),
      ]},
      { pairs: [
        p('teal',      { italian:'verde acqua', french:'sarcelle',  spanish:'verde azulado'}),
        p('fuchsia',   { italian:'fucsia',      french:'fuchsia',   spanish:'fucsia'       }),
        p('chartreuse',{ italian:'chartreuse',  french:'chartreuse',spanish:'chartreuse'   }),
        p('vermilion', { italian:'vermiglione', french:'vermillon', spanish:'bermellón'    }),
        p('mauve',     { italian:'malva',       french:'mauve',     spanish:'malva'        }),
        p('khaki',     { italian:'cachi',       french:'kaki',      spanish:'caqui'        }),
      ]},
    ],
  },

  // ── 4. Numbers ────────────────────────────────────────────────────────────
  {
    id: 'numbers', name: 'Numbers', icon: 'numeric', emoji: '🔢',
    bgColor: '#D8E7FF', accentColor: '#185AC7',
    levels: [
      { pairs: [
        p('one',   { italian:'uno',     french:'un',     spanish:'uno'    }),
        p('two',   { italian:'due',     french:'deux',   spanish:'dos'    }),
        p('three', { italian:'tre',     french:'trois',  spanish:'tres'   }),
        p('four',  { italian:'quattro', french:'quatre', spanish:'cuatro' }),
        p('five',  { italian:'cinque',  french:'cinq',   spanish:'cinco'  }),
        p('six',   { italian:'sei',     french:'six',    spanish:'seis'   }),
      ]},
      { pairs: [
        p('seven',  { italian:'sette',  french:'sept',  spanish:'siete'  }),
        p('eight',  { italian:'otto',   french:'huit',  spanish:'ocho'   }),
        p('nine',   { italian:'nove',   french:'neuf',  spanish:'nueve'  }),
        p('ten',    { italian:'dieci',  french:'dix',   spanish:'diez'   }),
        p('eleven', { italian:'undici', french:'onze',  spanish:'once'   }),
        p('twelve', { italian:'dodici', french:'douze', spanish:'doce'   }),
      ]},
      { pairs: [
        p('thirteen', { italian:'tredici',     french:'treize',   spanish:'trece'   }),
        p('fourteen', { italian:'quattordici', french:'quatorze', spanish:'catorce' }),
        p('fifteen',  { italian:'quindici',    french:'quinze',   spanish:'quince'  }),
        p('twenty',   { italian:'venti',       french:'vingt',    spanish:'veinte'  }),
        p('hundred',  { italian:'cento',       french:'cent',     spanish:'cien'    }),
        p('thousand', { italian:'mille',       french:'mille',    spanish:'mil'     }),
      ]},
      { pairs: [
        p('thirty',  { italian:'trenta',    french:'trente',          spanish:'treinta' }),
        p('forty',   { italian:'quaranta',  french:'quarante',        spanish:'cuarenta'}),
        p('fifty',   { italian:'cinquanta', french:'cinquante',       spanish:'cincuenta'}),
        p('sixty',   { italian:'sessanta',  french:'soixante',        spanish:'sesenta' }),
        p('seventy', { italian:'settanta',  french:'soixante-dix',    spanish:'setenta' }),
        p('eighty',  { italian:'ottanta',   french:'quatre-vingts',   spanish:'ochenta' }),
      ]},
      { pairs: [
        p('ninety',  { italian:'novanta',  french:'quatre-vingt-dix', spanish:'noventa' }),
        p('zero',    { italian:'zero',     french:'zéro',     spanish:'cero'    }),
        p('first',   { italian:'primo',    french:'premier',  spanish:'primero' }),
        p('second',  { italian:'secondo',  french:'deuxième', spanish:'segundo' }),
        p('third',   { italian:'terzo',    french:'troisième',spanish:'tercero' }),
        p('last',    { italian:'ultimo',   french:'dernier',  spanish:'último'  }),
      ]},
      { pairs: [
        p('half',    { italian:'mezzo',    french:'moitié', spanish:'mitad'      }),
        p('double',  { italian:'doppio',   french:'double', spanish:'doble'      }),
        p('triple',  { italian:'triplo',   french:'triple', spanish:'triple'     }),
        p('quarter', { italian:'quarto',   french:'quart',  spanish:'cuarto'     }),
        p('million', { italian:'milione',  french:'million',spanish:'millón'     }),
        p('billion', { italian:'miliardo', french:'milliard',spanish:'mil millones'}),
      ]},
    ],
  },

  // ── 5. Family ─────────────────────────────────────────────────────────────
  {
    id: 'family', name: 'Family', icon: 'account-group', emoji: '👨‍👩‍👧',
    bgColor: '#DCFCE7', accentColor: '#16A34A',
    levels: [
      { pairs: [
        p('mother',   { italian:'madre',    french:'mère',   spanish:'madre'   }),
        p('father',   { italian:'padre',    french:'père',   spanish:'padre'   }),
        p('sister',   { italian:'sorella',  french:'sœur',   spanish:'hermana' }),
        p('brother',  { italian:'fratello', french:'frère',  spanish:'hermano' }),
        p('son',      { italian:'figlio',   french:'fils',   spanish:'hijo'    }),
        p('daughter', { italian:'figlia',   french:'fille',  spanish:'hija'    }),
      ]},
      { pairs: [
        p('grandmother', { italian:'nonna',  french:'grand-mère', spanish:'abuela'  }),
        p('grandfather', { italian:'nonno',  french:'grand-père', spanish:'abuelo'  }),
        p('uncle',       { italian:'zio',    french:'oncle',      spanish:'tío'     }),
        p('aunt',        { italian:'zia',    french:'tante',      spanish:'tía'     }),
        p('cousin',      { italian:'cugino', french:'cousin',     spanish:'primo'   }),
        p('nephew',      { italian:'nipote', french:'neveu',      spanish:'sobrino' }),
      ]},
      { pairs: [
        p('husband', { italian:'marito',     french:'mari',       spanish:'marido'   }),
        p('wife',    { italian:'moglie',     french:'femme',      spanish:'esposa'   }),
        p('parents', { italian:'genitori',   french:'parents',    spanish:'padres'   }),
        p('child',   { italian:'bambino',    french:'enfant',     spanish:'niño'     }),
        p('friend',  { italian:'amico',      french:'ami',        spanish:'amigo'    }),
        p('teacher', { italian:'insegnante', french:'professeur', spanish:'profesor' }),
      ]},
      { pairs: [
        p('stepmother',  { italian:'matrigna',       french:'belle-mère',  spanish:'madrastra'  }),
        p('stepfather',  { italian:'patrigno',       french:'beau-père',   spanish:'padrastro'  }),
        p('twin',        { italian:'gemello',         french:'jumeau',      spanish:'gemelo'     }),
        p('baby',        { italian:'bambino piccolo', french:'bébé',        spanish:'bebé'       }),
        p('teenager',    { italian:'adolescente',     french:'adolescent',  spanish:'adolescente'}),
        p('elder',       { italian:'anziano',         french:'aîné',        spanish:'mayor'      }),
      ]},
      { pairs: [
        p('in-laws',         { italian:'suoceri',   french:'beaux-parents', spanish:'suegros'  }),
        p('mother-in-law',   { italian:'suocera',   french:'belle-mère',    spanish:'suegra'   }),
        p('father-in-law',   { italian:'suocero',   french:'beau-père',     spanish:'suegro'   }),
        p('brother-in-law',  { italian:'cognato',   french:'beau-frère',    spanish:'cuñado'   }),
        p('sister-in-law',   { italian:'cognata',   french:'belle-sœur',    spanish:'cuñada'   }),
        p('godfather',       { italian:'padrino',   french:'parrain',       spanish:'padrino'  }),
      ]},
      { pairs: [
        p('godmother',   { italian:'madrina',     french:'marraine',   spanish:'madrina'     }),
        p('ancestor',    { italian:'antenato',    french:'ancêtre',    spanish:'antepasado'  }),
        p('descendant',  { italian:'discendente', french:'descendant', spanish:'descendiente' }),
        p('widow',       { italian:'vedova',      french:'veuve',      spanish:'viuda'       }),
        p('orphan',      { italian:'orfano',      french:'orphelin',   spanish:'huérfano'    }),
        p('guardian',    { italian:'tutore',      french:'tuteur',     spanish:'tutor'       }),
      ]},
    ],
  },

  // ── 6. Body Parts ─────────────────────────────────────────────────────────
  {
    id: 'body', name: 'Body Parts', icon: 'human', emoji: '🫀',
    bgColor: '#CFFAFE', accentColor: '#0E7490',
    levels: [
      { pairs: [
        p('head',  { italian:'testa', french:'tête',   spanish:'cabeza' }),
        p('hand',  { italian:'mano',  french:'main',   spanish:'mano'   }),
        p('foot',  { italian:'piede', french:'pied',   spanish:'pie'    }),
        p('eye',   { italian:'occhio',french:'œil',    spanish:'ojo'    }),
        p('mouth', { italian:'bocca', french:'bouche', spanish:'boca'   }),
        p('nose',  { italian:'naso',  french:'nez',    spanish:'nariz'  }),
      ]},
      { pairs: [
        p('ear',   { italian:'orecchio', french:'oreille', spanish:'oreja'   }),
        p('hair',  { italian:'capelli',  french:'cheveux', spanish:'cabello' }),
        p('heart', { italian:'cuore',    french:'cœur',    spanish:'corazón' }),
        p('arm',   { italian:'braccio',  french:'bras',    spanish:'brazo'   }),
        p('leg',   { italian:'gamba',    french:'jambe',   spanish:'pierna'  }),
        p('back',  { italian:'schiena',  french:'dos',     spanish:'espalda' }),
      ]},
      { pairs: [
        p('finger',   { italian:'dito',      french:'doigt',  spanish:'dedo'    }),
        p('knee',     { italian:'ginocchio', french:'genou',  spanish:'rodilla' }),
        p('shoulder', { italian:'spalla',    french:'épaule', spanish:'hombro'  }),
        p('neck',     { italian:'collo',     french:'cou',    spanish:'cuello'  }),
        p('tooth',    { italian:'dente',     french:'dent',   spanish:'diente'  }),
        p('tongue',   { italian:'lingua',    french:'langue', spanish:'lengua'  }),
      ]},
      { pairs: [
        p('thumb',    { italian:'pollice',  french:'pouce',  spanish:'pulgar'  }),
        p('wrist',    { italian:'polso',    french:'poignet',spanish:'muñeca'  }),
        p('ankle',    { italian:'caviglia', french:'cheville',spanish:'tobillo' }),
        p('chin',     { italian:'mento',    french:'menton', spanish:'barbilla'}),
        p('cheek',    { italian:'guancia',  french:'joue',   spanish:'mejilla' }),
        p('forehead', { italian:'fronte',   french:'front',  spanish:'frente'  }),
      ]},
      { pairs: [
        p('elbow',   { italian:'gomito',    french:'coude',    spanish:'codo'   }),
        p('hip',     { italian:'anca',      french:'hanche',   spanish:'cadera' }),
        p('chest',   { italian:'petto',     french:'poitrine', spanish:'pecho'  }),
        p('stomach', { italian:'stomaco',   french:'estomac',  spanish:'estómago'}),
        p('palm',    { italian:'palmo',     french:'paume',    spanish:'palma'  }),
        p('heel',    { italian:'tallone',   french:'talon',    spanish:'talón'  }),
      ]},
      { pairs: [
        p('lung',    { italian:'polmone', french:'poumon', spanish:'pulmón'  }),
        p('kidney',  { italian:'rene',    french:'rein',   spanish:'riñón'   }),
        p('liver',   { italian:'fegato',  french:'foie',   spanish:'hígado'  }),
        p('muscle',  { italian:'muscolo', french:'muscle', spanish:'músculo' }),
        p('nerve',   { italian:'nervo',   french:'nerf',   spanish:'nervio'  }),
        p('vein',    { italian:'vena',    french:'veine',  spanish:'vena'    }),
      ]},
    ],
  },

  // ── 7. Nature ─────────────────────────────────────────────────────────────
  {
    id: 'nature', name: 'Nature', icon: 'leaf', emoji: '🌿',
    bgColor: '#D1FAE5', accentColor: '#065F46',
    levels: [
      { pairs: [
        p('sun',    { italian:'sole',    french:'soleil', spanish:'sol'      }),
        p('moon',   { italian:'luna',    french:'lune',   spanish:'luna'     }),
        p('star',   { italian:'stella',  french:'étoile', spanish:'estrella' }),
        p('tree',   { italian:'albero',  french:'arbre',  spanish:'árbol'    }),
        p('flower', { italian:'fiore',   french:'fleur',  spanish:'flor'     }),
        p('rain',   { italian:'pioggia', french:'pluie',  spanish:'lluvia'   }),
      ]},
      { pairs: [
        p('mountain', { italian:'montagna', french:'montagne', spanish:'montaña' }),
        p('sea',      { italian:'mare',     french:'mer',      spanish:'mar'     }),
        p('sky',      { italian:'cielo',    french:'ciel',     spanish:'cielo'   }),
        p('snow',     { italian:'neve',     french:'neige',    spanish:'nieve'   }),
        p('cloud',    { italian:'nuvola',   french:'nuage',    spanish:'nube'    }),
        p('river',    { italian:'fiume',    french:'rivière',  spanish:'río'     }),
      ]},
      { pairs: [
        p('forest',  { italian:'foresta',  french:'forêt',   spanish:'bosque'    }),
        p('island',  { italian:'isola',    french:'île',     spanish:'isla'      }),
        p('volcano', { italian:'vulcano',  french:'volcan',  spanish:'volcán'    }),
        p('desert',  { italian:'deserto',  french:'désert',  spanish:'desierto'  }),
        p('lake',    { italian:'lago',     french:'lac',     spanish:'lago'      }),
        p('beach',   { italian:'spiaggia', french:'plage',   spanish:'playa'     }),
      ]},
      { pairs: [
        p('waterfall', { italian:'cascata',    french:'cascade',  spanish:'cascada'  }),
        p('cave',      { italian:'caverna',    french:'grotte',   spanish:'cueva'    }),
        p('glacier',   { italian:'ghiacciaio', french:'glacier',  spanish:'glaciar'  }),
        p('canyon',    { italian:'canyon',     french:'canyon',   spanish:'cañón'    }),
        p('meadow',    { italian:'prato',      french:'prairie',  spanish:'pradera'  }),
        p('swamp',     { italian:'palude',     french:'marais',   spanish:'pantano'  }),
      ]},
      { pairs: [
        p('earthquake', { italian:'terremoto', french:'tremblement de terre', spanish:'terremoto' }),
        p('hurricane',  { italian:'uragano',   french:'ouragan',   spanish:'huracán'  }),
        p('tsunami',    { italian:'tsunami',   french:'tsunami',   spanish:'tsunami'  }),
        p('avalanche',  { italian:'valanga',   french:'avalanche', spanish:'avalancha'}),
        p('drought',    { italian:'siccità',   french:'sécheresse',spanish:'sequía'   }),
        p('landslide',  { italian:'frana',     french:'glissement',spanish:'deslizamiento'}),
      ]},
      { pairs: [
        p('aurora',   { italian:'aurora',   french:'aurore',   spanish:'aurora'   }),
        p('reef',     { italian:'scogliera',french:'récif',    spanish:'arrecife' }),
        p('geyser',   { italian:'geyser',   french:'geyser',   spanish:'géiser'   }),
        p('mangrove', { italian:'mangrovia',french:'mangrove', spanish:'manglar'  }),
        p('tundra',   { italian:'tundra',   french:'toundra',  spanish:'tundra'   }),
        p('savanna',  { italian:'savana',   french:'savane',   spanish:'sabana'   }),
      ]},
    ],
  },

  // ── 8. Home ───────────────────────────────────────────────────────────────
  {
    id: 'home', name: 'Home', icon: 'home', emoji: '🏠',
    section: 'real-life',
    bgColor: '#FFE4E6', accentColor: '#E11D48',
    levels: [
      { pairs: [
        p('house',  { italian:'casa',     french:'maison',  spanish:'casa'    }),
        p('door',   { italian:'porta',    french:'porte',   spanish:'puerta'  }),
        p('window', { italian:'finestra', french:'fenêtre', spanish:'ventana' }),
        p('table',  { italian:'tavolo',   french:'table',   spanish:'mesa'    }),
        p('chair',  { italian:'sedia',    french:'chaise',  spanish:'silla'   }),
        p('bed',    { italian:'letto',    french:'lit',     spanish:'cama'    }),
      ]},
      { pairs: [
        p('book',   { italian:'libro',    french:'livre',     spanish:'libro'    }),
        p('key',    { italian:'chiave',   french:'clé',       spanish:'llave'    }),
        p('phone',  { italian:'telefono', french:'téléphone', spanish:'teléfono' }),
        p('clock',  { italian:'orologio', french:'horloge',   spanish:'reloj'    }),
        p('lamp',   { italian:'lampada',  french:'lampe',     spanish:'lámpara'  }),
        p('garden', { italian:'giardino', french:'jardin',    spanish:'jardín'   }),
      ]},
      { pairs: [
        p('kitchen',  { italian:'cucina',    french:'cuisine',       spanish:'cocina'    }),
        p('bathroom', { italian:'bagno',     french:'salle de bain', spanish:'baño'      }),
        p('stairs',   { italian:'scale',     french:'escaliers',     spanish:'escaleras' }),
        p('wall',     { italian:'muro',      french:'mur',           spanish:'pared'     }),
        p('roof',     { italian:'tetto',     french:'toit',          spanish:'techo'     }),
        p('floor',    { italian:'pavimento', french:'sol',           spanish:'suelo'     }),
      ]},
      { pairs: [
        p('sofa',    { italian:'divano',    french:'canapé',  spanish:'sofá'    }),
        p('shelf',   { italian:'scaffale',  french:'étagère', spanish:'estante' }),
        p('mirror',  { italian:'specchio',  french:'miroir',  spanish:'espejo'  }),
        p('curtain', { italian:'tenda',     french:'rideau',  spanish:'cortina' }),
        p('carpet',  { italian:'tappeto',   french:'tapis',   spanish:'alfombra'}),
        p('drawer',  { italian:'cassetto',  french:'tiroir',  spanish:'cajón'   }),
      ]},
      { pairs: [
        p('basement',         { italian:'cantina',      french:'sous-sol',         spanish:'sótano'     }),
        p('attic',            { italian:'soffitta',     french:'grenier',           spanish:'ático'      }),
        p('balcony',          { italian:'balcone',      french:'balcon',            spanish:'balcón'     }),
        p('fireplace',        { italian:'camino',       french:'cheminée',          spanish:'chimenea'   }),
        p('washing machine',  { italian:'lavatrice',    french:'machine à laver',   spanish:'lavadora'   }),
        p('dishwasher',       { italian:'lavastoviglie',french:'lave-vaisselle',     spanish:'lavavajillas'}),
      ]},
      { pairs: [
        p('radiator',       { italian:'radiatore',    french:'radiateur',   spanish:'radiador'         }),
        p('air conditioner',{ italian:'condizionatore',french:'climatiseur', spanish:'aire acondicionado'}),
        p('vacuum cleaner', { italian:'aspirapolvere',french:'aspirateur',  spanish:'aspiradora'       }),
        p('wardrobe',       { italian:'armadio',      french:'armoire',     spanish:'armario'          }),
        p('bookcase',       { italian:'libreria',     french:'bibliothèque',spanish:'estantería'       }),
        p('ceiling',        { italian:'soffitto',     french:'plafond',     spanish:'techo'            }),
      ]},
    ],
  },

  // ── 9. Clothes ────────────────────────────────────────────────────────────
  {
    id: 'clothes', name: 'Clothes', icon: 'tshirt-crew', emoji: '👕',
    bgColor: '#EAF2FF', accentColor: '#1F6FEB',
    levels: [
      { pairs: [
        p('shirt',   { italian:'camicia',   french:'chemise',    spanish:'camisa'      }),
        p('pants',   { italian:'pantaloni', french:'pantalon',   spanish:'pantalones'  }),
        p('shoes',   { italian:'scarpe',    french:'chaussures', spanish:'zapatos'     }),
        p('hat',     { italian:'cappello',  french:'chapeau',    spanish:'sombrero'    }),
        p('dress',   { italian:'vestito',   french:'robe',       spanish:'vestido'     }),
        p('jacket',  { italian:'giacca',    french:'veste',      spanish:'chaqueta'    }),
      ]},
      { pairs: [
        p('socks',   { italian:'calzini',  french:'chaussettes', spanish:'calcetines' }),
        p('gloves',  { italian:'guanti',   french:'gants',       spanish:'guantes'    }),
        p('coat',    { italian:'cappotto', french:'manteau',     spanish:'abrigo'     }),
        p('scarf',   { italian:'sciarpa',  french:'écharpe',     spanish:'bufanda'    }),
        p('boots',   { italian:'stivali',  french:'bottes',      spanish:'botas'      }),
        p('glasses', { italian:'occhiali', french:'lunettes',    spanish:'gafas'      }),
      ]},
      { pairs: [
        p('ring',      { italian:'anello',    french:'bague',     spanish:'anillo'   }),
        p('necklace',  { italian:'collana',   french:'collier',   spanish:'collar'   }),
        p('belt',      { italian:'cintura',   french:'ceinture',  spanish:'cinturón' }),
        p('tie',       { italian:'cravatta',  french:'cravate',   spanish:'corbata'  }),
        p('swimsuit',  { italian:'costume',   french:'maillot',   spanish:'bañador'  }),
        p('backpack',  { italian:'zaino',     french:'sac à dos', spanish:'mochila'  }),
      ]},
      { pairs: [
        p('skirt',      { italian:'gonna',          french:'jupe',        spanish:'falda'            }),
        p('shorts',     { italian:'pantaloncini',    french:'short',       spanish:'pantalones cortos'}),
        p('sweater',    { italian:'maglione',        french:'pull',        spanish:'jersey'           }),
        p('tracksuit',  { italian:'tuta',            french:'survêtement', spanish:'chándal'          }),
        p('apron',      { italian:'grembiule',       french:'tablier',     spanish:'delantal'         }),
        p('pajamas',    { italian:'pigiama',         french:'pyjama',      spanish:'pijama'           }),
      ]},
      { pairs: [
        p('bracelet',  { italian:'braccialetto', french:'bracelet',        spanish:'pulsera'  }),
        p('earring',   { italian:'orecchino',    french:'boucle d\'oreille',spanish:'pendiente'}),
        p('handbag',   { italian:'borsa',        french:'sac à main',      spanish:'bolso'    }),
        p('wallet',    { italian:'portafoglio',  french:'portefeuille',     spanish:'cartera'  }),
        p('umbrella',  { italian:'ombrello',     french:'parapluie',        spanish:'paraguas' }),
        p('raincoat',  { italian:'impermeabile', french:'imperméable',      spanish:'impermeable'}),
      ]},
      { pairs: [
        p('tuxedo',   { italian:'smoking',  french:'smoking',  spanish:'esmoquin'  }),
        p('veil',     { italian:'velo',     french:'voile',    spanish:'velo'      }),
        p('cloak',    { italian:'mantello', french:'cape',     spanish:'capa'      }),
        p('tunic',    { italian:'tunica',   french:'tunique',  spanish:'túnica'    }),
        p('leggings', { italian:'leggings', french:'leggings', spanish:'mallas'    }),
        p('sandals',  { italian:'sandali',  french:'sandales', spanish:'sandalias' }),
      ]},
    ],
  },

  // ── 10. Weather ───────────────────────────────────────────────────────────
  {
    id: 'weather', name: 'Weather', icon: 'weather-partly-cloudy', emoji: '🌤️',
    bgColor: '#E0F2FE', accentColor: '#0284C7',
    levels: [
      { pairs: [
        p('hot',    { italian:'caldo',      french:'chaud',      spanish:'caliente' }),
        p('cold',   { italian:'freddo',     french:'froid',      spanish:'frío'     }),
        p('sunny',  { italian:'soleggiato', french:'ensoleillé', spanish:'soleado'  }),
        p('rainy',  { italian:'piovoso',    french:'pluvieux',   spanish:'lluvioso' }),
        p('windy',  { italian:'ventoso',    french:'venteux',    spanish:'ventoso'  }),
        p('cloudy', { italian:'nuvoloso',   french:'nuageux',    spanish:'nublado'  }),
      ]},
      { pairs: [
        p('storm',   { italian:'tempesta',   french:'orage',       spanish:'tormenta' }),
        p('thunder', { italian:'tuono',      french:'tonnerre',    spanish:'trueno'   }),
        p('fog',     { italian:'nebbia',     french:'brouillard',  spanish:'niebla'   }),
        p('hail',    { italian:'grandine',   french:'grêle',       spanish:'granizo'  }),
        p('rainbow', { italian:'arcobaleno', french:'arc-en-ciel', spanish:'arcoiris' }),
        p('ice',     { italian:'ghiaccio',   french:'glace',       spanish:'hielo'    }),
      ]},
      { pairs: [
        p('warm',     { italian:'tiepido', french:'tiède',   spanish:'tibio'    }),
        p('cool',     { italian:'fresco',  french:'frais',   spanish:'fresco'   }),
        p('humid',    { italian:'umido',   french:'humide',  spanish:'húmedo'   }),
        p('dry',      { italian:'secco',   french:'sec',     spanish:'seco'     }),
        p('freezing', { italian:'gelido',  french:'glacial', spanish:'helado'   }),
        p('mild',     { italian:'mite',    french:'doux',    spanish:'templado' }),
      ]},
      { pairs: [
        p('spring',   { italian:'primavera', french:'printemps', spanish:'primavera' }),
        p('summer',   { italian:'estate',    french:'été',       spanish:'verano'    }),
        p('autumn',   { italian:'autunno',   french:'automne',   spanish:'otoño'     }),
        p('winter',   { italian:'inverno',   french:'hiver',     spanish:'invierno'  }),
        p('season',   { italian:'stagione',  french:'saison',    spanish:'estación'  }),
        p('forecast', { italian:'previsione',french:'prévision', spanish:'pronóstico'}),
      ]},
      { pairs: [
        p('temperature', { italian:'temperatura', french:'température', spanish:'temperatura' }),
        p('degree',      { italian:'grado',       french:'degré',      spanish:'grado'       }),
        p('pressure',    { italian:'pressione',   french:'pression',   spanish:'presión'     }),
        p('humidity',    { italian:'umidità',     french:'humidité',   spanish:'humedad'     }),
        p('climate',     { italian:'clima',       french:'climat',     spanish:'clima'       }),
        p('monsoon',     { italian:'monsone',     french:'mousson',    spanish:'monzón'      }),
      ]},
      { pairs: [
        p('cyclone',   { italian:'ciclone',    french:'cyclone',  spanish:'ciclón'   }),
        p('blizzard',  { italian:'bufera',     french:'blizzard', spanish:'ventisca' }),
        p('drizzle',   { italian:'pioggerella',french:'bruine',   spanish:'llovizna' }),
        p('sleet',     { italian:'nevischio',  french:'grésil',   spanish:'aguanieve'}),
        p('overcast',  { italian:'coperto',    french:'couvert',  spanish:'nublado'  }),
        p('gale',      { italian:'burrasca',   french:'tempête',  spanish:'vendaval' }),
      ]},
    ],
  },

  // ── 11. Transport ─────────────────────────────────────────────────────────
  {
    id: 'transport', name: 'Transport', icon: 'car', emoji: '🚗',
    bgColor: '#F0FDF4', accentColor: '#15803D',
    levels: [
      { pairs: [
        p('car',   { italian:'macchina',   french:'voiture', spanish:'coche'     }),
        p('bus',   { italian:'autobus',    french:'bus',     spanish:'autobús'   }),
        p('train', { italian:'treno',      french:'train',   spanish:'tren'      }),
        p('plane', { italian:'aereo',      french:'avion',   spanish:'avión'     }),
        p('bike',  { italian:'bicicletta', french:'vélo',    spanish:'bicicleta' }),
        p('boat',  { italian:'barca',      french:'bateau',  spanish:'barco'     }),
      ]},
      { pairs: [
        p('taxi',       { italian:'taxi',       french:'taxi',        spanish:'taxi'       }),
        p('metro',      { italian:'metro',      french:'métro',       spanish:'metro'      }),
        p('truck',      { italian:'camion',     french:'camion',      spanish:'camión'     }),
        p('motorcycle', { italian:'moto',       french:'moto',        spanish:'moto'       }),
        p('helicopter', { italian:'elicottero', french:'hélicoptère', spanish:'helicóptero'}),
        p('tram',       { italian:'tram',       french:'tramway',     spanish:'tranvía'    }),
      ]},
      { pairs: [
        p('ship',      { italian:'nave',        french:'navire',       spanish:'barco'      }),
        p('scooter',   { italian:'scooter',     french:'scooter',      spanish:'scúter'     }),
        p('submarine', { italian:'sottomarino', french:'sous-marin',   spanish:'submarino'  }),
        p('rocket',    { italian:'razzo',       french:'fusée',        spanish:'cohete'     }),
        p('ferry',     { italian:'traghetto',   french:'ferry',        spanish:'ferry'      }),
        p('cable car', { italian:'funivia',     french:'téléphérique', spanish:'teleférico' }),
      ]},
      { pairs: [
        p('ticket',    { italian:'biglietto', french:'billet',    spanish:'billete'      }),
        p('station',   { italian:'stazione',  french:'gare',      spanish:'estación'     }),
        p('airport',   { italian:'aeroporto', french:'aéroport',  spanish:'aeropuerto'   }),
        p('driver',    { italian:'autista',   french:'conducteur',spanish:'conductor'    }),
        p('passenger', { italian:'passeggero',french:'passager',  spanish:'pasajero'     }),
        p('luggage',   { italian:'bagagli',   french:'bagages',   spanish:'equipaje'     }),
      ]},
      { pairs: [
        p('highway',   { italian:'autostrada',         french:'autoroute',         spanish:'autopista'          }),
        p('traffic',   { italian:'traffico',           french:'trafic',            spanish:'tráfico'            }),
        p('parking',   { italian:'parcheggio',         french:'parking',           spanish:'estacionamiento'    }),
        p('seatbelt',  { italian:'cintura di sicurezza',french:'ceinture de sécurité',spanish:'cinturón de seguridad'}),
        p('speed',     { italian:'velocità',           french:'vitesse',           spanish:'velocidad'          }),
        p('engine',    { italian:'motore',             french:'moteur',            spanish:'motor'              }),
      ]},
      { pairs: [
        p('navigation', { italian:'navigazione', french:'navigation', spanish:'navegación' }),
        p('runway',     { italian:'pista',        french:'piste',      spanish:'pista'      }),
        p('harbour',    { italian:'porto',        french:'port',       spanish:'puerto'     }),
        p('customs',    { italian:'dogana',       french:'douane',     spanish:'aduana'     }),
        p('departure',  { italian:'partenza',     french:'départ',     spanish:'salida'     }),
        p('arrival',    { italian:'arrivo',       french:'arrivée',    spanish:'llegada'    }),
      ]},
    ],
  },

  // ── 12. Time ──────────────────────────────────────────────────────────────
  {
    id: 'time', name: 'Calendar', icon: 'clock-outline', emoji: '⏰',
    section: 'real-life',
    bgColor: '#FDF4FF', accentColor: '#9333EA',
    levels: [
      { pairs: [
        p('Monday',    { italian:'lunedì',    french:'lundi',    spanish:'lunes'     }),
        p('Tuesday',   { italian:'martedì',   french:'mardi',    spanish:'martes'    }),
        p('Wednesday', { italian:'mercoledì', french:'mercredi', spanish:'miércoles' }),
        p('Thursday',  { italian:'giovedì',   french:'jeudi',    spanish:'jueves'    }),
        p('Friday',    { italian:'venerdì',   french:'vendredi', spanish:'viernes'   }),
        p('Saturday',  { italian:'sabato',    french:'samedi',   spanish:'sábado'    }),
        p('Sunday',    { italian:'domenica',  french:'dimanche', spanish:'domingo'   }),
      ]},
      { pairs: [
        p('morning',   { italian:'mattina',    french:'matin',      spanish:'mañana'     }),
        p('afternoon', { italian:'pomeriggio', french:'après-midi', spanish:'tarde'      }),
        p('evening',   { italian:'sera',       french:'soir',       spanish:'atardecer'  }),
        p('night',     { italian:'notte',      french:'nuit',       spanish:'noche'      }),
        p('midnight',  { italian:'mezzanotte', french:'minuit',     spanish:'medianoche' }),
      ]},
      { pairs: [
        p('January',  { italian:'gennaio',  french:'janvier',  spanish:'enero'    }),
        p('February', { italian:'febbraio', french:'février',  spanish:'febrero'  }),
        p('March',    { italian:'marzo',    french:'mars',     spanish:'marzo'    }),
        p('April',    { italian:'aprile',   french:'avril',    spanish:'abril'    }),
        p('May',      { italian:'maggio',   french:'mai',      spanish:'mayo'     }),
        p('June',     { italian:'giugno',   french:'juin',     spanish:'junio'    }),
      ]},
      { pairs: [
        p('July',      { italian:'luglio',    french:'juillet',   spanish:'julio'      }),
        p('August',    { italian:'agosto',    french:'août',      spanish:'agosto'     }),
        p('September', { italian:'settembre', french:'septembre', spanish:'septiembre' }),
        p('October',   { italian:'ottobre',   french:'octobre',   spanish:'octubre'    }),
        p('November',  { italian:'novembre',  french:'novembre',  spanish:'noviembre'  }),
        p('December',  { italian:'dicembre',  french:'décembre',  spanish:'diciembre'  }),
      ]},
      { pairs: [
        p('second', { italian:'secondo',    french:'seconde', spanish:'segundo' }),
        p('minute', { italian:'minuto',     french:'minute',  spanish:'minuto'  }),
        p('hour',   { italian:'ora',        french:'heure',   spanish:'hora'    }),
        p('week',   { italian:'settimana',  french:'semaine', spanish:'semana'  }),
        p('month',  { italian:'mese',       french:'mois',    spanish:'mes'     }),
        p('year',   { italian:'anno',       french:'an',      spanish:'año'     }),
      ]},
      { pairs: [
        p('century',   { italian:'secolo',      french:'siècle',      spanish:'siglo'      }),
        p('decade',    { italian:'decennio',    french:'décennie',    spanish:'década'     }),
        p('yesterday', { italian:'ieri',        french:'hier',        spanish:'ayer'       }),
        p('today',     { italian:'oggi',        french:'aujourd\'hui',spanish:'hoy'        }),
        p('tomorrow',  { italian:'domani',      french:'demain',      spanish:'mañana'     }),
        p('birthday',  { italian:'compleanno',  french:'anniversaire',spanish:'cumpleaños' }),
      ]},
    ],
  },

  // ── 13. School ────────────────────────────────────────────────────────────
  {
    id: 'school', name: 'School', icon: 'school', emoji: '📚',
    section: 'real-life',
    bgColor: '#EAF2FF', accentColor: '#1F6FEB',
    levels: [
      { pairs: [
        p('pencil',   { italian:'matita',   french:'crayon', spanish:'lápiz'     }),
        p('pen',      { italian:'penna',    french:'stylo',  spanish:'bolígrafo' }),
        p('book',     { italian:'libro',    french:'livre',  spanish:'libro'     }),
        p('notebook', { italian:'quaderno', french:'cahier', spanish:'cuaderno'  }),
        p('ruler',    { italian:'righello', french:'règle',  spanish:'regla'     }),
        p('eraser',   { italian:'gomma',    french:'gomme',  spanish:'goma'      }),
      ]},
      { pairs: [
        p('teacher',   { italian:'insegnante', french:'professeur',   spanish:'profesor'   }),
        p('student',   { italian:'studente',   french:'élève',        spanish:'estudiante' }),
        p('classroom', { italian:'aula',       french:'classe',       spanish:'aula'       }),
        p('homework',  { italian:'compiti',    french:'devoirs',      spanish:'tarea'      }),
        p('exam',      { italian:'esame',      french:'examen',       spanish:'examen'     }),
        p('library',   { italian:'biblioteca', french:'bibliothèque', spanish:'biblioteca' }),
      ]},
      { pairs: [
        p('dictionary',  { italian:'dizionario',   french:'dictionnaire',   spanish:'diccionario' }),
        p('calculator',  { italian:'calcolatrice', french:'calculatrice',   spanish:'calculadora' }),
        p('scissors',    { italian:'forbici',      french:'ciseaux',        spanish:'tijeras'     }),
        p('backpack',    { italian:'zaino',        french:'sac à dos',      spanish:'mochila'     }),
        p('glue',        { italian:'colla',        french:'colle',          spanish:'pegamento'   }),
        p('timetable',   { italian:'orario',       french:'emploi du temps',spanish:'horario'     }),
      ]},
      { pairs: [
        p('mathematics', { italian:'matematica', french:'mathématiques', spanish:'matemáticas' }),
        p('science',     { italian:'scienze',    french:'sciences',      spanish:'ciencias'    }),
        p('history',     { italian:'storia',     french:'histoire',      spanish:'historia'    }),
        p('geography',   { italian:'geografia',  french:'géographie',    spanish:'geografía'   }),
        p('art',         { italian:'arte',       french:'art',           spanish:'arte'        }),
        p('music',       { italian:'musica',     french:'musique',       spanish:'música'      }),
      ]},
      { pairs: [
        p('language',    { italian:'lingua',       french:'langue',      spanish:'idioma'     }),
        p('literature',  { italian:'letteratura',  french:'littérature', spanish:'literatura' }),
        p('philosophy',  { italian:'filosofia',    french:'philosophie', spanish:'filosofía'  }),
        p('biology',     { italian:'biologia',     french:'biologie',    spanish:'biología'   }),
        p('chemistry',   { italian:'chimica',      french:'chimie',      spanish:'química'    }),
        p('physics',     { italian:'fisica',       french:'physique',    spanish:'física'     }),
      ]},
      { pairs: [
        p('economics',   { italian:'economia',    french:'économie',    spanish:'economía'   }),
        p('psychology',  { italian:'psicologia',  french:'psychologie', spanish:'psicología' }),
        p('technology',  { italian:'tecnologia',  french:'technologie', spanish:'tecnología' }),
        p('university',  { italian:'università',  french:'université',  spanish:'universidad'}),
        p('degree',      { italian:'laurea',      french:'diplôme',     spanish:'título'     }),
        p('scholarship', { italian:'borsa di studio',french:'bourse',   spanish:'beca'       }),
      ]},
    ],
  },

  // ── 14. Emotions ──────────────────────────────────────────────────────────
  {
    id: 'emotions', name: 'Emotions', icon: 'emoticon-happy-outline', emoji: '😊',
    bgColor: '#FFF1F2', accentColor: '#E11D48',
    levels: [
      { pairs: [
        p('happy',     { italian:'felice',     french:'heureux',   spanish:'feliz'       }),
        p('sad',       { italian:'triste',     french:'triste',    spanish:'triste'      }),
        p('angry',     { italian:'arrabbiato', french:'en colère', spanish:'enojado'     }),
        p('scared',    { italian:'spaventato', french:'effrayé',   spanish:'asustado'    }),
        p('surprised', { italian:'sorpreso',   french:'surpris',   spanish:'sorprendido' }),
        p('tired',     { italian:'stanco',     french:'fatigué',   spanish:'cansado'     }),
      ]},
      { pairs: [
        p('bored',   { italian:'annoiato',   french:'ennuyé',  spanish:'aburrido'   }),
        p('excited', { italian:'entusiasta', french:'excité',  spanish:'emocionado' }),
        p('nervous', { italian:'nervoso',    french:'nerveux', spanish:'nervioso'   }),
        p('calm',    { italian:'calmo',      french:'calme',   spanish:'tranquilo'  }),
        p('proud',   { italian:'orgoglioso', french:'fier',    spanish:'orgulloso'  }),
        p('shy',     { italian:'timido',     french:'timide',  spanish:'tímido'     }),
      ]},
      { pairs: [
        p('jealous',     { italian:'geloso',      french:'jaloux',          spanish:'celoso'       }),
        p('lonely',      { italian:'solo',        french:'seul',            spanish:'solo'         }),
        p('confused',    { italian:'confuso',     french:'confus',          spanish:'confundido'   }),
        p('grateful',    { italian:'grato',       french:'reconnaissant',   spanish:'agradecido'   }),
        p('embarrassed', { italian:'imbarazzato', french:'gêné',            spanish:'avergonzado'  }),
        p('hopeful',     { italian:'speranzoso',  french:'plein d\'espoir', spanish:'esperanzador' }),
      ]},
      { pairs: [
        p('love',  { italian:'amore',   french:'amour',  spanish:'amor'    }),
        p('hate',  { italian:'odio',    french:'haine',  spanish:'odio'    }),
        p('joy',   { italian:'gioia',   french:'joie',   spanish:'alegría' }),
        p('pain',  { italian:'dolore',  french:'douleur',spanish:'dolor'   }),
        p('fear',  { italian:'paura',   french:'peur',   spanish:'miedo'   }),
        p('hope',  { italian:'speranza',french:'espoir', spanish:'esperanza'}),
      ]},
      { pairs: [
        p('anxiety',     { italian:'ansia',      french:'anxiété',   spanish:'ansiedad'  }),
        p('stress',      { italian:'stress',     french:'stress',    spanish:'estrés'    }),
        p('passion',     { italian:'passione',   french:'passion',   spanish:'pasión'    }),
        p('courage',     { italian:'coraggio',   french:'courage',   spanish:'valentía'  }),
        p('compassion',  { italian:'compassione',french:'compassion',spanish:'compasión' }),
        p('patience',    { italian:'pazienza',   french:'patience',  spanish:'paciencia' }),
      ]},
      { pairs: [
        p('melancholy', { italian:'malinconia', french:'mélancolie',     spanish:'melancolía' }),
        p('nostalgia',  { italian:'nostalgia',  french:'nostalgie',      spanish:'nostalgia'  }),
        p('euphoria',   { italian:'euforia',    french:'euphorie',       spanish:'euforia'    }),
        p('envy',       { italian:'invidia',    french:'envie',          spanish:'envidia'    }),
        p('grief',      { italian:'dolore',     french:'chagrin',        spanish:'duelo'      }),
        p('wonder',     { italian:'meraviglia', french:'émerveillement', spanish:'asombro'    }),
      ]},
    ],
  },

  // ── 15. Jobs ──────────────────────────────────────────────────────────────
  {
    id: 'jobs', name: 'Jobs', icon: 'briefcase-outline', emoji: '💼',
    bgColor: '#F0F9FF', accentColor: '#0891B2',
    levels: [
      { pairs: [
        p('doctor',  { italian:'medico',     french:'médecin',    spanish:'médico'     }),
        p('teacher', { italian:'insegnante', french:'professeur', spanish:'profesor'   }),
        p('police',  { italian:'poliziotto', french:'policier',   spanish:'policía'    }),
        p('farmer',  { italian:'contadino',  french:'agriculteur',spanish:'agricultor' }),
        p('chef',    { italian:'cuoco',      french:'chef',       spanish:'cocinero'   }),
        p('pilot',   { italian:'pilota',     french:'pilote',     spanish:'piloto'     }),
      ]},
      { pairs: [
        p('engineer', { italian:'ingegnere', french:'ingénieur', spanish:'ingeniero' }),
        p('lawyer',   { italian:'avvocato',  french:'avocat',    spanish:'abogado'   }),
        p('artist',   { italian:'artista',   french:'artiste',   spanish:'artista'   }),
        p('nurse',    { italian:'infermiere',french:'infirmier', spanish:'enfermero' }),
        p('singer',   { italian:'cantante',  french:'chanteur',  spanish:'cantante'  }),
        p('driver',   { italian:'autista',   french:'conducteur',spanish:'conductor' }),
      ]},
      { pairs: [
        p('scientist',   { italian:'scienziato',  french:'scientifique', spanish:'científico'  }),
        p('dentist',     { italian:'dentista',    french:'dentiste',     spanish:'dentista'    }),
        p('mechanic',    { italian:'meccanico',   french:'mécanicien',   spanish:'mecánico'    }),
        p('firefighter', { italian:'pompiere',    french:'pompier',      spanish:'bombero'     }),
        p('architect',   { italian:'architetto',  french:'architecte',   spanish:'arquitecto'  }),
        p('journalist',  { italian:'giornalista', french:'journaliste',  spanish:'periodista'  }),
      ]},
      { pairs: [
        p('accountant',   { italian:'contabile',     french:'comptable',     spanish:'contable'    }),
        p('programmer',   { italian:'programmatore', french:'programmeur',   spanish:'programador' }),
        p('manager',      { italian:'manager',       french:'directeur',     spanish:'gerente'     }),
        p('secretary',    { italian:'segretario',    french:'secrétaire',    spanish:'secretario'  }),
        p('salesperson',  { italian:'venditore',     french:'vendeur',       spanish:'vendedor'    }),
        p('receptionist', { italian:'receptionist',  french:'réceptionniste',spanish:'recepcionista'}),
      ]},
      { pairs: [
        p('psychologist', { italian:'psicologo',   french:'psychologue',  spanish:'psicólogo'   }),
        p('veterinarian', { italian:'veterinario', french:'vétérinaire',  spanish:'veterinario' }),
        p('pharmacist',   { italian:'farmacista',  french:'pharmacien',   spanish:'farmacéutico'}),
        p('plumber',      { italian:'idraulico',   french:'plombier',     spanish:'fontanero'   }),
        p('carpenter',    { italian:'falegname',   french:'charpentier',  spanish:'carpintero'  }),
        p('electrician',  { italian:'elettricista',french:'électricien',  spanish:'electricista'}),
      ]},
      { pairs: [
        p('astronaut',    { italian:'astronauta',   french:'astronaute',  spanish:'astronauta'  }),
        p('diplomat',     { italian:'diplomatico',  french:'diplomate',   spanish:'diplomático' }),
        p('interpreter',  { italian:'interprete',   french:'interprète',  spanish:'intérprete'  }),
        p('surgeon',      { italian:'chirurgo',     french:'chirurgien',  spanish:'cirujano'    }),
        p('detective',    { italian:'detective',    french:'détective',   spanish:'detective'   }),
        p('entrepreneur', { italian:'imprenditore', french:'entrepreneur',spanish:'empresario'  }),
      ]},
    ],
  },

  // ── 16. Places ────────────────────────────────────────────────────────────
  {
    id: 'places', name: 'Places', icon: 'map-marker-outline', emoji: '🗺️',
    section: 'real-life',
    bgColor: '#FDF2F8', accentColor: '#BE185D',
    levels: [
      { pairs: [
        p('school',     { italian:'scuola',     french:'école',      spanish:'escuela'    }),
        p('hospital',   { italian:'ospedale',   french:'hôpital',    spanish:'hospital'   }),
        p('park',       { italian:'parco',      french:'parc',       spanish:'parque'     }),
        p('restaurant', { italian:'ristorante', french:'restaurant', spanish:'restaurante'}),
        p('bank',       { italian:'banca',      french:'banque',     spanish:'banco'      }),
        p('museum',     { italian:'museo',      french:'musée',      spanish:'museo'      }),
      ]},
      { pairs: [
        p('hotel',    { italian:'hotel',      french:'hôtel',       spanish:'hotel'      }),
        p('airport',  { italian:'aeroporto',  french:'aéroport',    spanish:'aeropuerto' }),
        p('station',  { italian:'stazione',   french:'gare',        spanish:'estación'   }),
        p('pharmacy', { italian:'farmacia',   french:'pharmacie',   spanish:'farmacia'   }),
        p('library',  { italian:'biblioteca', french:'bibliothèque',spanish:'biblioteca' }),
        p('church',   { italian:'chiesa',     french:'église',      spanish:'iglesia'    }),
      ]},
      { pairs: [
        p('stadium',     { italian:'stadio',       french:'stade',       spanish:'estadio'     }),
        p('cinema',      { italian:'cinema',       french:'cinéma',      spanish:'cine'        }),
        p('supermarket', { italian:'supermercato', french:'supermarché', spanish:'supermercado'}),
        p('theatre',     { italian:'teatro',       french:'théâtre',     spanish:'teatro'      }),
        p('market',      { italian:'mercato',      french:'marché',      spanish:'mercado'     }),
        p('zoo',         { italian:'zoo',          french:'zoo',         spanish:'zoo'         }),
      ]},
      { pairs: [
        p('post office',    { italian:'ufficio postale',    french:'bureau de poste',       spanish:'correos'        }),
        p('police station', { italian:'commissariato',      french:'commissariat',          spanish:'comisaría'      }),
        p('fire station',   { italian:'caserma pompieri',   french:'caserne de pompiers',   spanish:'bomberos'       }),
        p('embassy',        { italian:'ambasciata',         french:'ambassade',             spanish:'embajada'       }),
        p('university',     { italian:'università',         french:'université',            spanish:'universidad'    }),
        p('courthouse',     { italian:'tribunale',          french:'tribunal',              spanish:'juzgado'        }),
      ]},
      { pairs: [
        p('bridge',    { italian:'ponte',    french:'pont',    spanish:'puente'   }),
        p('tower',     { italian:'torre',    french:'tour',    spanish:'torre'    }),
        p('castle',    { italian:'castello', french:'château', spanish:'castillo' }),
        p('cathedral', { italian:'cattedrale',french:'cathédrale',spanish:'catedral'}),
        p('lighthouse',{ italian:'faro',     french:'phare',   spanish:'faro'     }),
        p('cemetery',  { italian:'cimitero', french:'cimetière',spanish:'cementerio'}),
      ]},
      { pairs: [
        p('aquarium',       { italian:'acquario',        french:'aquarium',        spanish:'acuario'         }),
        p('botanical garden',{ italian:'giardino botanico',french:'jardin botanique',spanish:'jardín botánico'}),
        p('skyscraper',     { italian:'grattacielo',     french:'gratte-ciel',     spanish:'rascacielos'     }),
        p('dam',            { italian:'diga',            french:'barrage',         spanish:'presa'           }),
        p('observatory',    { italian:'osservatorio',    french:'observatoire',    spanish:'observatorio'    }),
        p('ancient ruins',  { italian:'rovine antiche',  french:'ruines anciennes',spanish:'ruinas antiguas' }),
      ]},
    ],
  },

  // ── 17. Verbs ─────────────────────────────────────────────────────────────
  {
    id: 'verbs', name: 'Verbs', icon: 'run-fast', emoji: '🏃',
    bgColor: '#ECFDF5', accentColor: '#059669',
    practicePolicy: 'current-level-only',
    translationReviewNotice: 'Verb translations are pending review. Western Armenian needs Nayiri/native verification.',
    levels: [
      { pairs: [
        verb('be'),
        verb('have'),
        verb('do'),
        verb('say'),
        verb('get'),
        verb('go'),
        verb('make', { italian:'fare', french:'faire', spanish:'hacer' }),
        verb('know'),
        verb('think', { italian:'pensare', french:'penser', spanish:'pensar' }),
        verb('come'),
        verb('see'),
        verb('take', { italian:'prendere', french:'prendre', spanish:'tomar' }),
        verb('want'),
        verb('give', { italian:'dare', french:'donner', spanish:'dar' }),
        verb('use'),
        verb('find', { italian:'trovare', french:'trouver', spanish:'encontrar' }),
        verb('tell'),
        verb('ask'),
        verb('work', { italian:'lavorare', french:'travailler', spanish:'trabajar' }),
        verb('feel'),
      ]},
      { pairs: [
        verb('try'),
        verb('need'),
        verb('call'),
        verb('look'),
        verb('leave'),
        verb('put'),
        verb('mean'),
        verb('keep'),
        verb('help', { italian:'aiutare', french:'aider', spanish:'ayudar' }),
        verb('talk'),
        verb('start'),
        verb('show'),
        verb('hear'),
        verb('play', { italian:'giocare', french:'jouer', spanish:'jugar' }),
        verb('run', { italian:'correre', french:'courir', spanish:'correr' }),
        verb('move'),
        verb('live'),
        verb('believe', { italian:'credere', french:'croire', spanish:'creer' }),
        verb('bring'),
        verb('write', { italian:'scrivere', french:'écrire', spanish:'escribir' }),
      ]},
      { pairs: [
        verb('turn'),
        verb('begin'),
        verb('hold'),
        verb('stand'),
        verb('pay'),
        verb('meet'),
        verb('set'),
        verb('learn', { italian:'imparare', french:'apprendre', spanish:'aprender' }),
        verb('change'),
        verb('lead'),
        verb('understand', { italian:'capire', french:'comprendre', spanish:'entender' }),
        verb('watch'),
        verb('follow'),
        verb('stop'),
        verb('create'),
        verb('speak', { italian:'parlare', french:'parler', spanish:'hablar' }),
        verb('read', { italian:'leggere', french:'lire', spanish:'leer' }),
        verb('allow'),
        verb('add'),
        verb('happen'),
      ]},
      { pairs: [
        verb('spend'),
        verb('grow'),
        verb('offer'),
        verb('remember', { italian:'ricordare', french:'se souvenir', spanish:'recordar' }),
        verb('consider'),
        verb('appear'),
        verb('buy'),
        verb('wait'),
        verb('serve'),
        verb('send', { italian:'mandare', french:'envoyer', spanish:'enviar' }),
        verb('expect'),
        verb('build'),
        verb('stay'),
        verb('fall'),
        verb('cut'),
        verb('reach'),
        verb('pass'),
        verb('sell'),
        verb('decide', { italian:'decidere', french:'décider', spanish:'decidir' }),
        verb('improve', { italian:'migliorare', french:'améliorer', spanish:'mejorar' }),
      ]},
      { pairs: [
        verb('require'),
        verb('explain'),
        verb('solve'),
        verb('develop'),
        verb('carry'),
        verb('break'),
        verb('receive'),
        verb('agree'),
        verb('support'),
        verb('produce'),
        verb('cover'),
        verb('catch'),
        verb('draw'),
        verb('choose', { italian:'scegliere', french:'choisir', spanish:'elegir' }),
        verb('listen', { italian:'ascoltare', french:'écouter', spanish:'escuchar' }),
        verb('involve'),
        verb('increase'),
        verb('reduce'),
        verb('respond'),
        verb('deliver'),
      ]},
      { pairs: [
        verb('seek'),
        verb('enjoy'),
        verb('enter'),
        verb('share'),
        verb('protect'),
        verb('teach'),
        verb('throw'),
        verb('wear'),
        verb('participate'),
        verb('publish'),
        verb('expand'),
        verb('resolve'),
        verb('accomplish'),
        verb('satisfy'),
        verb('recognize'),
        verb('avoid'),
        verb('prevent'),
        verb('prefer'),
        verb('achieve', { italian:'raggiungere', french:'atteindre', spanish:'lograr' }),
        verb('discover', { italian:'scoprire', french:'découvrir', spanish:'descubrir' }),
      ]},
    ],
  },

  // ── 18. Sports ────────────────────────────────────────────────────────────
  {
    id: 'sports', name: 'Sports', icon: 'soccer', emoji: '⚽',
    bgColor: '#EAF2FF', accentColor: '#1F6FEB',
    levels: [
      { pairs: [
        p('football',   { italian:'calcio',        french:'football', spanish:'fútbol'     }),
        p('basketball', { italian:'pallacanestro', french:'basket',   spanish:'baloncesto' }),
        p('tennis',     { italian:'tennis',        french:'tennis',   spanish:'tenis'      }),
        p('swimming',   { italian:'nuoto',         french:'natation', spanish:'natación'   }),
        p('running',    { italian:'corsa',         french:'course',   spanish:'carrera'    }),
        p('cycling',    { italian:'ciclismo',      french:'cyclisme', spanish:'ciclismo'   }),
      ]},
      { pairs: [
        p('volleyball', { italian:'pallavolo',  french:'volley',      spanish:'voleibol'  }),
        p('gymnastics', { italian:'ginnastica', french:'gymnastique', spanish:'gimnasia'  }),
        p('skiing',     { italian:'sci',        french:'ski',         spanish:'esquí'     }),
        p('boxing',     { italian:'pugilato',   french:'boxe',        spanish:'boxeo'     }),
        p('golf',       { italian:'golf',       french:'golf',        spanish:'golf'      }),
        p('yoga',       { italian:'yoga',       french:'yoga',        spanish:'yoga'      }),
      ]},
      { pairs: [
        p('climbing',     { italian:'arrampicata',     french:'escalade',    spanish:'escalada'      }),
        p('surfing',      { italian:'surf',            french:'surf',        spanish:'surf'          }),
        p('skating',      { italian:'pattinaggio',     french:'patinage',    spanish:'patinaje'      }),
        p('wrestling',    { italian:'lotta',           french:'lutte',       spanish:'lucha'         }),
        p('archery',      { italian:'tiro con l\'arco',french:'tir à l\'arc',spanish:'tiro con arco' }),
        p('martial arts', { italian:'arti marziali',   french:'arts martiaux',spanish:'artes marciales'}),
      ]},
      { pairs: [
        p('referee',  { italian:'arbitro',  french:'arbitre', spanish:'árbitro'    }),
        p('team',     { italian:'squadra',  french:'équipe',  spanish:'equipo'     }),
        p('score',    { italian:'punteggio',french:'score',   spanish:'puntuación' }),
        p('goal',     { italian:'gol',      french:'but',     spanish:'gol'        }),
        p('trophy',   { italian:'trofeo',   french:'trophée', spanish:'trofeo'     }),
        p('champion', { italian:'campione', french:'champion',spanish:'campeón'    }),
      ]},
      { pairs: [
        p('tournament', { italian:'torneo',      french:'tournoi',      spanish:'torneo'      }),
        p('training',   { italian:'allenamento', french:'entraînement', spanish:'entrenamiento'}),
        p('medal',      { italian:'medaglia',    french:'médaille',     spanish:'medalla'     }),
        p('record',     { italian:'record',      french:'record',       spanish:'récord'      }),
        p('athlete',    { italian:'atleta',      french:'athlète',      spanish:'atleta'      }),
        p('coach',      { italian:'allenatore',  french:'entraîneur',   spanish:'entrenador'  }),
      ]},
      { pairs: [
        p('Olympics',        { italian:'olimpiadi',    french:'jeux olympiques',spanish:'olimpiadas'   }),
        p('marathon',        { italian:'maratona',     french:'marathon',       spanish:'maratón'      }),
        p('triathlon',       { italian:'triathlon',    french:'triathlon',      spanish:'triatlón'     }),
        p('handicap',        { italian:'handicap',     french:'handicap',       spanish:'hándicap'     }),
        p('sportsmanship',   { italian:'sportività',   french:'esprit sportif', spanish:'deportividad' }),
        p('championship',    { italian:'campionato',   french:'championnat',    spanish:'campeonato'   }),
      ]},
    ],
  },

  // ── 19. Articles ─────────────────────────────────────────────────────────────
  // Teaches articles in context (article + noun as a unit) so kids learn
  // grammatical gender naturally. English clue is "the/a + noun";
  // translation shows the correct article form for each language.
  {
    id: 'articles', name: 'Articles', icon: 'book', emoji: '📖',
    bgColor: '#E0E7FF', accentColor: '#4338CA',
    levels: [
      // Level 1 – "the" + everyday nouns (definite, singular)
      { pairs: [
        p('the dog',    { italian:'il cane',    french:'le chien',    spanish:'el perro'  }),
        p('the house',  { italian:'la casa',    french:'la maison',   spanish:'la casa'   }),
        p('the book',   { italian:'il libro',   french:'le livre',    spanish:'el libro'  }),
        p('the school', { italian:'la scuola',  french:'l\'école',    spanish:'la escuela'}),
        p('the sun',    { italian:'il sole',    french:'le soleil',   spanish:'el sol'    }),
        p('the city',   { italian:'la città',   french:'la ville',    spanish:'la ciudad' }),
      ]},
      // Level 2 – "the" + family members
      { pairs: [
        p('the mother',   { italian:'la madre',    french:'la mère',     spanish:'la madre'   }),
        p('the father',   { italian:'il padre',    french:'le père',     spanish:'el padre'   }),
        p('the brother',  { italian:'il fratello', french:'le frère',    spanish:'el hermano' }),
        p('the sister',   { italian:'la sorella',  french:'la sœur',     spanish:'la hermana' }),
        p('the son',      { italian:'il figlio',   french:'le fils',     spanish:'el hijo'    }),
        p('the daughter', { italian:'la figlia',   french:'la fille',    spanish:'la hija'    }),
      ]},
      // Level 3 – "a / an" + indefinite nouns
      { pairs: [
        p('a dog',     { italian:'un cane',       french:'un chien',      spanish:'un perro'    }),
        p('a house',   { italian:'una casa',      french:'une maison',    spanish:'una casa'    }),
        p('a book',    { italian:'un libro',      french:'un livre',      spanish:'un libro'    }),
        p('a teacher', { italian:'un professore', french:'un professeur', spanish:'un profesor' }),
        p('a friend',  { italian:'un amico',      french:'un ami',        spanish:'un amigo'    }),
        p('a car',     { italian:'una macchina',  french:'une voiture',   spanish:'un coche'    }),
      ]},
      // Level 4 – "the" + plural nouns
      { pairs: [
        p('the dogs',     { italian:'i cani',      french:'les chiens',   spanish:'los perros'  }),
        p('the houses',   { italian:'le case',     french:'les maisons',  spanish:'las casas'   }),
        p('the books',    { italian:'i libri',     french:'les livres',   spanish:'los libros'  }),
        p('the children', { italian:'i bambini',   french:'les enfants',  spanish:'los niños'   }),
        p('the friends',  { italian:'gli amici',   french:'les amis',     spanish:'los amigos'  }),
        p('the streets',  { italian:'le strade',   french:'les rues',     spanish:'las calles'  }),
      ]},
      // Level 5 – "the" + abstract / bigger nouns
      { pairs: [
        p('the life',     { italian:'la vita',    french:'la vie',      spanish:'la vida'    }),
        p('the world',    { italian:'il mondo',   french:'le monde',    spanish:'el mundo'   }),
        p('the time',     { italian:'il tempo',   french:'le temps',    spanish:'el tiempo'  }),
        p('the love',     { italian:'l\'amore',   french:'l\'amour',    spanish:'el amor'    }),
        p('the night',    { italian:'la notte',   french:'la nuit',     spanish:'la noche'   }),
        p('the language', { italian:'la lingua',  french:'la langue',   spanish:'la lengua'  }),
      ]},
      // Level 6 – Expert: mixed articles, trickier nouns
      { pairs: [
        p('the heart',  { italian:'il cuore',    french:'le cœur',       spanish:'el corazón' }),
        p('a dream',    { italian:'un sogno',    french:'un rêve',       spanish:'un sueño'   }),
        p('the truth',  { italian:'la verità',   french:'la vérité',     spanish:'la verdad'  }),
        p('a journey',  { italian:'un viaggio',  french:'un voyage',     spanish:'un viaje'   }),
        p('the future', { italian:'il futuro',   french:'l\'avenir',     spanish:'el futuro'  }),
        p('the problem',{ italian:'il problema', french:'le problème',   spanish:'el problema'}),
      ]},
    ],
  },

  // ── Church & theology ─────────────────────────────────────────────────────
  {
    id: 'church', name: 'Church', icon: 'church', emoji: '⛪',
    bgColor: '#EAF2FF', accentColor: '#1F6FEB',
    levels: [
      // Level 1 – familiar parts of a church
      { pairs: [
        p('church', { italian:'chiesa', french:'église', spanish:'iglesia' },
          ex('We go to church on Sunday.', 'Andiamo in chiesa la domenica.', 'Nous allons à l’église le dimanche.', 'Vamos a la iglesia el domingo.')),
        p('pew', { italian:'panca', french:'banc d’église', spanish:'banco de iglesia' },
          ex('We sit in a pew.', 'Ci sediamo su una panca in chiesa.', 'Nous nous asseyons sur un banc d’église.', 'Nos sentamos en un banco de la iglesia.')),
        p('pulpit', { italian:'pulpito', french:'chaire', spanish:'púlpito' },
          ex('The pastor stands at the pulpit.', 'Il pastore è al pulpito.', 'Le pasteur se tient à la chaire.', 'El pastor está en el púlpito.')),
        p('altar', { italian:'altare', french:'autel', spanish:'altar' },
          ex('Flowers are by the altar.', 'Ci sono fiori vicino all’altare.', 'Il y a des fleurs près de l’autel.', 'Hay flores cerca del altar.')),
        p('cross', { italian:'croce', french:'croix', spanish:'cruz' },
          ex('A cross hangs on the wall.', 'Una croce è appesa al muro.', 'Une croix est accrochée au mur.', 'Hay una cruz colgada en la pared.')),
        p('Bible', { italian:'Bibbia', french:'Bible', spanish:'Biblia' },
          ex('We read the Bible together.', 'Leggiamo la Bibbia insieme.', 'Nous lisons la Bible ensemble.', 'Leemos la Biblia juntos.')),
      ]},
      // Level 2 – objects, music, and people commonly seen there
      { pairs: [
        p('church bell', { italian:'campana della chiesa', french:'cloche d’église', spanish:'campana de iglesia' },
          ex('The church bell rings at noon.', 'La campana della chiesa suona a mezzogiorno.', 'La cloche de l’église sonne à midi.', 'La campana de la iglesia suena al mediodía.')),
        p('stained-glass window', { italian:'vetrata colorata', french:'vitrail', spanish:'vitral' },
          ex('Sunlight shines through the stained-glass window.', 'La luce del sole passa attraverso la vetrata colorata.', 'La lumière du soleil passe à travers le vitrail.', 'La luz del sol pasa por el vitral.')),
        p('candle', { italian:'candela', french:'bougie', spanish:'vela' },
          ex('We light a candle.', 'Accendiamo una candela.', 'Nous allumons une bougie.', 'Encendemos una vela.')),
        p('organ', { italian:'organo', french:'orgue', spanish:'órgano' },
          ex('The organ plays a hymn.', 'L’organo suona un inno.', 'L’orgue joue un hymne.', 'El órgano toca un himno.')),
        p('choir', { italian:'coro', french:'chœur', spanish:'coro' },
          ex('The choir sings together.', 'Il coro canta insieme.', 'Le chœur chante ensemble.', 'El coro canta unido.')),
        p('congregation', { italian:'congregazione', french:'assemblée', spanish:'congregación' },
          ex('The congregation sings together.', 'Le persone della congregazione cantano insieme.', 'L’assemblée chante ensemble.', 'La congregación canta unida.')),
      ]},
      // Level 3 – common parts of a church service
      { pairs: [
        p('church service', { italian:'funzione religiosa', french:'service religieux', spanish:'servicio religioso' },
          ex('The church service starts at ten.', 'La funzione religiosa inizia alle dieci.', 'Le service religieux commence à dix heures.', 'El servicio religioso empieza a las diez.')),
        p('prayer', { italian:'preghiera', french:'prière', spanish:'oración' },
          ex('We say a prayer together.', 'Diciamo una preghiera insieme.', 'Nous disons une prière ensemble.', 'Decimos una oración juntos.')),
        p('hymn', { italian:'inno', french:'hymne', spanish:'himno' },
          ex('We sing a hymn together.', 'Cantiamo un inno insieme.', 'Nous chantons un hymne ensemble.', 'Cantamos un himno juntos.')),
        p('sermon', { italian:'sermone', french:'sermon', spanish:'sermón' },
          ex('We listen to the sermon.', 'Ascoltiamo il sermone.', 'Nous écoutons le sermon.', 'Escuchamos el sermón.')),
        p('baptism', { italian:'battesimo', french:'baptême', spanish:'bautismo' },
          ex('We celebrate a baptism today.', 'Oggi festeggiamo un battesimo.', 'Aujourd’hui, nous célébrons un baptême.', 'Hoy celebramos un bautismo.')),
        p('communion', { italian:'comunione', french:'communion', spanish:'comunión' },
          ex('We share communion at church.', 'Facciamo la comunione in chiesa.', 'Nous communions à l’église.', 'Tomamos la comunión en la iglesia.')),
      ]},
      // Level 4 – foundational Christian theology
      { pairs: [
        p('faith', { italian:'fede', french:'foi', spanish:'fe' }),
        p('grace', { italian:'grazia', french:'grâce', spanish:'gracia' }),
        p('sin', { italian:'peccato', french:'péché', spanish:'pecado' }),
        p('forgiveness', { italian:'perdono', french:'pardon', spanish:'perdón' }),
        p('salvation', { italian:'salvezza', french:'salut', spanish:'salvación' }),
        p('resurrection', { italian:'risurrezione', french:'résurrection', spanish:'resurrección' }),
      ]},
      // Level 5 – more advanced theological ideas
      { pairs: [
        p('covenant', { italian:'alleanza', french:'alliance', spanish:'alianza' }),
        p('incarnation', { italian:'incarnazione', french:'incarnation', spanish:'encarnación' }),
        p('atonement', { italian:'espiazione', french:'expiation', spanish:'expiación' }),
        p('redemption', { italian:'redenzione', french:'rédemption', spanish:'redención' }),
        p('sanctification', { italian:'santificazione', french:'sanctification', spanish:'santificación' }),
        p('Trinity', { italian:'Trinità', french:'Trinité', spanish:'Trinidad' }),
      ]},
      // Level 6 – specialized fields of theological study
      { pairs: [
        p('ecclesiology',
          { italian:'ecclesiologia', french:'ecclésiologie', spanish:'eclesiología' },
          {
            explanation: 'The study of the Christian church, its people, and how it is organized.',
            example: 'Our class learned how a church community cares for one another.',
          }),
        p('eschatology',
          { italian:'escatologia', french:'eschatologie', spanish:'escatología' },
          {
            explanation: 'The study of Christian beliefs about the future and the end of the world.',
            example: 'The lesson explored Christian hopes for the future.',
          }),
        p('hermeneutics',
          { italian:'ermeneutica', french:'herméneutique', spanish:'hermenéutica' },
          {
            explanation: 'Ways people understand and explain a text, especially the Bible.',
            example: 'We looked at a Bible story’s words and setting to understand it.',
          }),
        p('soteriology',
          { italian:'soteriologia', french:'sotériologie', spanish:'soteriología' },
          {
            explanation: 'The study of how God saves people in Christian belief.',
            example: 'We learned how Christians talk about being saved and made whole.',
          }),
        p('theodicy',
          { italian:'teodicea', french:'théodicée', spanish:'teodicea' },
          {
            explanation: 'A way of asking how suffering can happen if God is good and powerful.',
            example: 'A student wondered why bad things happen and how faith can help.',
          }),
        p('pneumatology',
          { italian:'pneumatologia', french:'pneumatologie', spanish:'pneumatología' },
          {
            explanation: 'The study of the Holy Spirit in Christian belief.',
            example: 'Our lesson explored what Christians believe about the Holy Spirit.',
          }),
      ]},
    ],
  },

  // ── Real-life situations ───────────────────────────────────────────────────
  {
    id: 'restaurant', name: 'Restaurant', icon: 'silverware-fork-knife', emoji: '🍽️',
    section: 'real-life',
    bgColor: '#FCE7F3', accentColor: '#BE185D',
    levels: [
      { pairs: [
        p('A table for two, please.', { italian:'Un tavolo per due, per favore.', french:'Une table pour deux, s\'il vous plaît.', spanish:'Una mesa para dos, por favor.' }),
        p('Menu.', { italian:'Menu.', french:'Menu.', spanish:'Menú.' }),
        p('Water.', { italian:'Acqua.', french:'Eau.', spanish:'Agua.' }),
        p('I would like a coffee.', { italian:'Vorrei un caffè.', french:'Je voudrais un café.', spanish:'Quisiera un café.' }),
        p('Can I see the menu?', { italian:'Posso vedere il menu?', french:'Puis-je voir la carte ?', spanish:'¿Puedo ver el menú?' }),
        p('A table outside, please.', { italian:'Un tavolo all\'aperto, per favore.', french:'Une table en terrasse, s\'il vous plaît.', spanish:'Una mesa afuera, por favor.' }),
      ]},
      { pairs: [
        p('Can I order now?', { italian:'Posso ordinare adesso?', french:'Je peux commander maintenant ?', spanish:'¿Puedo pedir ahora?' }),
        p('What do you recommend?', { italian:'Che cosa mi consiglia?', french:'Qu\'est-ce que vous conseillez ?', spanish:'¿Qué me recomienda?' }),
        p('Does this have nuts?', { italian:'Contiene frutta a guscio?', french:'Est-ce que ce plat contient des fruits à coque ?', spanish:'¿Este plato contiene frutos secos?' }),
        p('No meat.', { italian:'Niente carne.', french:'Pas de viande.', spanish:'Sin carne.' }),
        p('The bill?', { italian:'Il conto?', french:'L\'addition ?', spanish:'¿La cuenta?' }),
        p('Can I pay by card?', { italian:'Posso pagare con la carta?', french:'Je peux payer par carte ?', spanish:'¿Puedo pagar con tarjeta?' }),
      ]},
      { pairs: [
        p('This is delicious.', { italian:'È delizioso.', french:'C\'est délicieux.', spanish:'Está delicioso.' }),
        p('Can I have another glass of water?', { italian:'Posso avere un altro bicchiere d\'acqua?', french:'Je peux avoir un autre verre d\'eau ?', spanish:'¿Me puede traer otro vaso de agua?' }),
        p('No onions, please.', { italian:'Senza cipolle, per favore.', french:'Sans oignons, s\'il vous plaît.', spanish:'Sin cebolla, por favor.' }),
        p('Can we sit outside?', { italian:'Possiamo sederci fuori?', french:'Pouvons-nous nous asseoir dehors ?', spanish:'¿Podemos sentarnos afuera?' }),
        p('To go, please.', { italian:'Da asporto, per favore.', french:'À emporter, s\'il vous plaît.', spanish:'Para llevar, por favor.' }),
        p('Thank you.', { italian:'Grazie.', french:'Merci.', spanish:'Gracias.' }),
      ]},
    ],
  },
  {
    id: 'tickets', name: 'Buying Tickets', icon: 'ticket-confirmation-outline', emoji: '🎟️',
    section: 'real-life',
    bgColor: '#E0F2FE', accentColor: '#0284C7',
    levels: [
      { pairs: [
        p('Ticket.', { italian:'Biglietto.', french:'Billet.', spanish:'Billete.' }),
        p('A ticket to Rome, please.', { italian:'Un biglietto per Roma, per favore.', french:'Un billet pour Rome, s\'il vous plaît.', spanish:'Un billete a Roma, por favor.' }),
        p('What time does it leave?', { italian:'A che ora parte?', french:'À quelle heure part-il ?', spanish:'¿A qué hora sale?' }),
        p('Which platform?', { italian:'Quale binario?', french:'Quel quai ?', spanish:'¿Qué andén?' }),
        p('How much is a ticket?', { italian:'Quanto costa un biglietto?', french:'Combien coûte un billet ?', spanish:'¿Cuánto cuesta un billete?' }),
        p('Is it one-way or return?', { italian:'È solo andata o andata e ritorno?', french:'C\'est un aller simple ou un aller-retour ?', spanish:'¿Es solo ida o ida y vuelta?' }),
      ]},
      { pairs: [
        p('When is the next train?', { italian:'Quando parte il prossimo treno?', french:'Quand part le prochain train ?', spanish:'¿Cuándo sale el próximo tren?' }),
        p('I need a ticket for today.', { italian:'Mi serve un biglietto per oggi.', french:'Il me faut un billet pour aujourd\'hui.', spanish:'Necesito un billete para hoy.' }),
        p('Can I pay by card?', { italian:'Posso pagare con la carta?', french:'Je peux payer par carte ?', spanish:'¿Puedo pagar con tarjeta?' }),
        p('Is this seat taken?', { italian:'Questo posto è occupato?', french:'Cette place est prise ?', spanish:'¿Está ocupado este asiento?' }),
        p('Children\'s fare.', { italian:'Tariffa bambini.', french:'Tarif enfant.', spanish:'Tarifa infantil.' }),
        p('Delayed.', { italian:'In ritardo.', french:'En retard.', spanish:'Con retraso.' }),
      ]},
      { pairs: [
        p('I missed my train.', { italian:'Ho perso il treno.', french:'J\'ai raté mon train.', spanish:'Perdí el tren.' }),
        p('Can I change my ticket?', { italian:'Posso cambiare il biglietto?', french:'Puis-je modifier mon billet ?', spanish:'¿Puedo cambiar mi billete?' }),
        p('Where is the ticket machine?', { italian:'Dov\'è la biglietteria automatica?', french:'Où est la borne de billets ?', spanish:'¿Dónde está la máquina de billetes?' }),
        p('Refund.', { italian:'Rimborso.', french:'Remboursement.', spanish:'Reembolso.' }),
        p('Is this the train to Rome?', { italian:'È questo il treno per Roma?', french:'Est-ce le train pour Rome ?', spanish:'¿Es este el tren a Roma?' }),
        p('What time do we arrive?', { italian:'A che ora arriviamo?', french:'À quelle heure arrivons-nous ?', spanish:'¿A qué hora llegamos?' }),
      ]},
    ],
  },
  {
    id: 'conversations', name: 'Conversations', icon: 'chat-processing-outline', emoji: '💬',
    section: 'real-life',
    bgColor: '#EDE9FE', accentColor: '#7C3AED',
    levels: [
      { pairs: [
        p('Hello!', { italian:'Ciao!', french:'Bonjour !', spanish:'¡Hola!' }),
        p('Good morning.', { italian:'Buongiorno.', french:'Bonjour.', spanish:'Buenos días.' }),
        p('How are you?', { italian:'Come stai?', french:'Comment ça va ?', spanish:'¿Cómo estás?' }),
        p('I am fine, thank you.', { italian:'Sto bene, grazie.', french:'Je vais bien, merci.', spanish:'Estoy bien, gracias.' }),
        p('What is your name?', { italian:'Come ti chiami?', french:'Comment tu t\'appelles ?', spanish:'¿Cómo te llamas?' }),
        p('My name is Ana.', { italian:'Mi chiamo Ana.', french:'Je m\'appelle Ana.', spanish:'Me llamo Ana.' }),
      ]},
      { pairs: [
        p('Nice to meet you.', { italian:'Piacere.', french:'C\'est un plaisir de vous rencontrer.', spanish:'Mucho gusto.' }),
        p('Where are you from?', { italian:'Di dove sei?', french:'D\'où viens-tu ?', spanish:'¿De dónde eres?' }),
        p('I am from Canada.', { italian:'Vengo dal Canada.', french:'Je viens du Canada.', spanish:'Vengo de Canadá.' }),
        p('Do you speak English?', { italian:'Parli inglese?', french:'Tu parles anglais ?', spanish:'¿Hablas inglés?' }),
        p('I speak a little.', { italian:'Parlo un po\'.', french:'Je parle un peu.', spanish:'Hablo un poco.' }),
        p('Could you repeat that, please?', { italian:'Puoi ripeterlo, per favore?', french:'Pouvez-vous répéter, s\'il vous plaît ?', spanish:'¿Puede repetirlo, por favor?' }),
      ]},
      { pairs: [
        p('I do not understand.', { italian:'Non capisco.', french:'Je ne comprends pas.', spanish:'No entiendo.' }),
        p('Can you help me?', { italian:'Puoi aiutarmi?', french:'Pouvez-vous m\'aider ?', spanish:'¿Puede ayudarme?' }),
        p('Where is the bathroom?', { italian:'Dov\'è il bagno?', french:'Où sont les toilettes ?', spanish:'¿Dónde está el baño?' }),
        p('What does that mean?', { italian:'Che cosa significa?', french:'Qu\'est-ce que ça signifie ?', spanish:'¿Qué significa eso?' }),
        p('See you later.', { italian:'A dopo.', french:'À plus tard.', spanish:'Hasta luego.' }),
        p('Have a nice day!', { italian:'Buona giornata!', french:'Bonne journée !', spanish:'¡Que tengas un buen día!' }),
      ]},
    ],
  },
  ...THEMATIC_CATEGORIES,
  ...GENERATED_VOCABULARY_CATEGORIES,
  {
    id: 'vocabulary-italian-frequency',
    name: 'Italian Frequency List',
    icon: 'book-open-page-variant-outline',
    emoji: '🇮🇹',
    bgColor: '#EAF2FF',
    accentColor: '#1F6FEB',
    section: 'vocabulary',
    practicePolicy: 'current-level-only',
    availableLanguages: ['italian'],
    translationReviewNotice:
      'Source list from Strommen Inc. The English glosses and Italian equivalents have not been independently reviewed.',
    levels: Array.from(
      { length: Math.ceil(ITALIAN_FREQUENCY_PAIRS.length / 50) },
      (_, levelIndex) => ({
        pairs: ITALIAN_FREQUENCY_PAIRS
          .slice(levelIndex * 50, (levelIndex + 1) * 50)
      }),
    ),
  },
  {
    id: 'vocabulary-italian-study-guide',
    name: 'Italian Study Guide',
    icon: 'book-open-page-variant',
    emoji: '🇮🇹',
    bgColor: '#EAF2FF',
    accentColor: '#1F6FEB',
    section: 'vocabulary',
    practicePolicy: 'current-level-only',
    availableLanguages: ['italian'],
    translationReviewNotice:
      'Imported from your Italian study guide. Source translations and corrections are pending review.',
    levels: buildItalianStudyGuideLevels(),
  },
];

function expandPracticalTopicLevels(): void {
  const availablePairs = new Map<string, WordPair>();
  for (const category of CATEGORIES) {
    if (category.availableLanguages) continue;
    for (const level of category.levels) {
      for (const pair of level.pairs) {
        const key = pair.english.trim().toLocaleLowerCase();
        if (key && !availablePairs.has(key)) availablePairs.set(key, pair);
      }
    }
  }

  const generatedPairs = new Map<string, WordPair>(
    ALL_GENERATED_VOCABULARY.map(
      ([english, italian, french, spanish, armenian, , frequencyRank, partOfSpeech]) => [
        english.toLocaleLowerCase(),
        {
          english,
          translations: { italian, french, spanish, armenian },
          translationReviewStatus: GENERATED_VOCABULARY_REVIEW_STATUS,
          frequencyRank,
          partOfSpeech,
        },
      ],
    ),
  );

  for (const category of CATEGORIES) {
    const selectedHeadwords = PRACTICAL_TOPIC_HEADWORDS[category.id];
    if (!selectedHeadwords) continue;

    const seen = new Set(
      category.levels.flatMap(level =>
        level.pairs.map(pair => pair.english.trim().toLocaleLowerCase()),
      ),
    );
    const additions = selectedHeadwords.map(headword => {
      const key = headword.toLocaleLowerCase();
      if (seen.has(key)) {
        throw new Error(`${category.id} repeats practical lesson headword "${headword}".`);
      }
      seen.add(key);

      const customPair = NEW_PRACTICAL_WORDS[key];
      if (customPair) return customPair;

      const pair = generatedPairs.get(key) ?? availablePairs.get(key);
      if (!pair) {
        throw new Error(`Practical lesson headword "${headword}" is not in the shared course pool.`);
      }
      return {
        ...pair,
        translationReviewStatus: pair.translationReviewStatus ?? GENERATED_VOCABULARY_REVIEW_STATUS,
      };
    });

    const existingPairs = category.levels.flatMap(level => level.pairs);
    if ((existingPairs.length + additions.length) % 25 !== 0) {
      throw new Error(`${category.id} practical lesson words must fill complete 25-word stages.`);
    }
    const firstStageExistingCount = Math.ceil(existingPairs.length / 2);
    const firstStageAdditionCount = Math.ceil(additions.length / 2);
    const pairs = [
      ...existingPairs.slice(0, firstStageExistingCount),
      ...additions.slice(0, firstStageAdditionCount),
      ...existingPairs.slice(firstStageExistingCount),
      ...additions.slice(firstStageAdditionCount),
    ];
    category.levels = [];
    for (let start = 0; start < pairs.length; start += 25) {
      category.levels.push({ pairs: pairs.slice(start, start + 25) });
    }
    category.translationReviewNotice ??= PRACTICAL_TOPIC_REVIEW_NOTICE;
  }
}

expandPracticalTopicLevels();

export function getTheologyGuidePairs(): TheologyGuideWordPair[] {
  const churchCategory = CATEGORIES.find(category => category.id === 'church');
  if (!churchCategory) {
    throw new Error('The Church vocabulary category is missing.');
  }

  const level6 = churchCategory.levels[5];
  if (!level6) {
    throw new Error('Church level 6 is missing.');
  }

  validateTheologyGuidePairs(level6.pairs);
  return level6.pairs;
}

/**
 * Returns each distinct English-to-target-language vocabulary entry across
 * every topic. Repeated entries are collapsed while alternate translations
 * for the same English phrase remain available.
 */
export function getAllVocabularyPairs(language: Language): WordPair[] {
  const uniquePairs = new Map<string, WordPair>();

  for (const category of CATEGORIES) {
    if (!isCategoryAvailable(category, language)) continue;
    for (const level of category.levels) {
      for (const pair of level.pairs) {
        const english = pair.english.trim();
        const translation = pair.translations[language].trim();
        if (!english || !translation) continue;

        const key = `${english.toLocaleLowerCase()}::${translation.toLocaleLowerCase()}`;
        if (!uniquePairs.has(key)) uniquePairs.set(key, pair);
      }
    }
  }

  return [...uniquePairs.values()].sort((a, b) =>
    a.english.localeCompare(b.english) ||
    a.translations[language].localeCompare(b.translations[language]),
  );
}

/**
 * Returns one practice card per English headword across every category.
 * Generated words retain their source frequency order; topic-only words follow.
 */
export function getUniqueVocabularyPairs(language: Language): WordPair[] {
  const uniquePairs = new Map<string, WordPair>();

  for (const category of CATEGORIES) {
    if (!isCategoryAvailable(category, language)) continue;
    for (const level of category.levels) {
      for (const pair of level.pairs) {
        const english = pair.english.trim();
        const translation = pair.translations[language].trim();
        const key = english.toLocaleLowerCase();
        if (!english || !translation || uniquePairs.has(key)) continue;
        uniquePairs.set(key, pair);
      }
    }
  }

  return [...uniquePairs.values()].sort((a, b) => {
    const aSupplement = a.generalPoolAppendOrder;
    const bSupplement = b.generalPoolAppendOrder;
    if (aSupplement !== undefined || bSupplement !== undefined) {
      if (aSupplement === undefined) return -1;
      if (bSupplement === undefined) return 1;
      return aSupplement - bSupplement || a.english.localeCompare(b.english);
    }
    return (a.frequencyRank ?? Number.MAX_SAFE_INTEGER) -
      (b.frequencyRank ?? Number.MAX_SAFE_INTEGER) ||
      a.english.localeCompare(b.english);
  });
}

export function validateTheologyGuidePairs(
  pairs: WordPair[],
): asserts pairs is TheologyGuideWordPair[] {
  if (pairs.length === 0) {
    throw new Error('Church level 6 must include theology guide terms.');
  }

  for (const pair of pairs) {
    const explanation = pair.context?.explanation;
    if (typeof explanation !== 'string' || explanation.trim().length === 0) {
      throw new Error(`Church level 6 term "${pair.english}" is missing an explanation.`);
    }

    const example = pair.context?.example;
    if (typeof example !== 'string' || example.trim().length === 0) {
      throw new Error(`Church level 6 term "${pair.english}" is missing an example.`);
    }
  }
}
