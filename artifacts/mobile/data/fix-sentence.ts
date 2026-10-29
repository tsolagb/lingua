import type { Language } from './vocabulary';

/**
 * Authored Fix-the-Sentence items. Each sentence contains exactly ONE error,
 * shown as one token (a token may be a short chunk for word-order errors).
 * Correct sentences are natural and mostly mirror course grammar examples.
 */
export type FixCategory = 'article' | 'agreement' | 'conjugation' | 'preposition' | 'word order';
export interface FixItem {
  id: string;
  category: FixCategory;
  /** Label shown to the learner (Armenian uses language-accurate names). */
  categoryLabel: string;
  english: string;
  tokens: string[];
  wrongIndex: number;
  fix: string;
  /** Distractor fixes (never include the original wrong token). */
  distractors: string[];
  end: string;
  rule: string;
}

type Row = [FixCategory, string, string[], number, string, string[], string, string, string?];
const R = (...r: Row) => r;

const LABEL: Record<FixCategory, string> = { article: 'Article', agreement: 'Gender agreement', conjugation: 'Conjugation', preposition: 'Preposition', 'word order': 'Word order' };

const DATA: Record<Language, Row[]> = {
  italian: [
    R('article', 'I eat the apple.', ['Mangio', 'il', 'mela'], 1, 'la', ['lo', 'le'], '.', 'Mela is feminine singular, so it takes la.'),
    R('article', 'The student reads a book.', ['Il', 'studente', 'legge', 'un', 'libro'], 0, 'Lo', ['La', 'I'], '.', 'Before s + consonant (studente), masculine singular uses lo, not il.'),
    R('agreement', 'Marco is wearing a new jacket.', ['Marco', 'indossa', 'una', 'giacca', 'nuovo'], 4, 'nuova', ['nuovi', 'nuove'], '.', 'Giacca is feminine singular, so the adjective ends in -a: nuova.'),
    R('agreement', 'My friends are very kind.', ['I', 'miei', 'amici', 'sono', 'molto', 'gentile'], 5, 'gentili', ['gentilmente', 'gentilezza'], '.', 'Amici is plural, so the adjective must be plural too: gentili.'),
    R('conjugation', 'You study Italian every day.', ['Tu', 'studia', 'italiano', 'ogni', 'giorno'], 1, 'studi', ['studio', 'studiamo'], '.', 'With tu, regular -are verbs end in -i: tu studi.'),
    R('conjugation', 'We have two sisters.', ['Noi', 'hanno', 'due', 'sorelle'], 1, 'abbiamo', ['avete', 'ha'], '.', 'Noi needs the noi form of avere: abbiamo.'),
    R('preposition', 'I am going to Rome.', ['Vado', 'in', 'Roma'], 1, 'a', ['da', 'su'], '.', 'Use a with cities (a Roma). In is used with countries and regions.'),
    R('preposition', 'After work, we go to the supermarket.', ['Dopo', 'il', 'lavoro,', 'noi', 'andiamo', 'a il', 'supermercato'], 5, 'al', ['nel', 'dal'], '.', 'A + il always contracts to al.'),
    R('word order', 'I do not eat meat.', ['Mangio non', 'carne'], 0, 'Non mangio', ['No mangio', 'Mangio no'], '.', 'Non goes directly before the verb.'),
    R('word order', 'Marco has a red car.', ['Marco', 'ha', 'una', 'rossa macchina'], 3, 'macchina rossa', ['macchina rosso', 'rosse macchine'], '.', 'Color adjectives come after the noun in Italian.'),
  ],
  french: [
    R('article', 'I eat the apple.', ['Je', 'mange', 'le', 'pomme'], 2, 'la', ['les', 'du'], '.', 'Pomme is feminine singular, so it takes la.'),
    R('article', 'He is a boy.', ['C’est', 'une', 'garçon'], 1, 'un', ['des', 'la'], '.', 'Garçon is masculine singular, so the indefinite article is un.'),
    R('agreement', 'The houses are big.', ['Les', 'maisons', 'sont', 'grand'], 3, 'grandes', ['grande', 'grands'], '.', 'Maisons is feminine plural, so add -es: grandes.'),
    R('agreement', 'Camille is wearing a new jacket.', ['Camille', 'porte', 'une', 'veste', 'neuf'], 4, 'neuve', ['neufs', 'neuves'], '.', 'Veste is feminine singular; neuf becomes neuve.'),
    R('conjugation', 'We are making a pizza for dinner.', ['Nous', 'préparent', 'une', 'pizza', 'pour', 'le', 'dîner'], 1, 'préparons', ['préparez', 'prépare'], '.', 'Nous verbs end in -ons: nous préparons.'),
    R('conjugation', 'I am tired today.', ['Je', 'es', 'fatigué', 'aujourd’hui'], 1, 'suis', ['est', 'sont'], '.', 'Être with je is suis.'),
    R('preposition', 'I live in Paris.', ['J’habite', 'en', 'Paris'], 1, 'à', ['dans', 'sur'], '.', 'Use à with cities (à Paris). En is for feminine countries.'),
    R('preposition', 'We are going to the supermarket.', ['Nous', 'allons', 'à le', 'supermarché'], 2, 'au', ['aux', 'du'], '.', 'À + le always contracts to au.'),
    R('word order', 'I do not eat meat.', ['Je', 'ne pas mange', 'de', 'viande'], 1, 'ne mange pas', ['pas ne mange', 'ne pas manger'], '.', 'Ne and pas wrap around the conjugated verb: ne mange pas.'),
    R('word order', 'She has a red car.', ['Elle', 'a', 'une', 'rouge voiture'], 3, 'voiture rouge', ['voitures rouges', 'rouges voiture'], '.', 'Color adjectives come after the noun in French.'),
  ],
  spanish: [
    R('article', 'The house is big.', ['El', 'casa', 'es', 'grande'], 0, 'La', ['Los', 'Un'], '.', 'Casa is feminine singular, so it takes la.'),
    R('article', 'The problem is difficult.', ['La', 'problema', 'es', 'difícil'], 0, 'El', ['Los', 'Una'], '.', 'Problema ends in -a but is masculine (from Greek -ma): el problema.'),
    R('agreement', 'The houses are big.', ['Las', 'casas', 'son', 'grande'], 3, 'grandes', ['gran', 'grandeza'], '.', 'Casas is plural, so the adjective adds -s: grandes.'),
    R('agreement', 'Camila is wearing a new jacket.', ['Camila', 'lleva', 'una', 'chaqueta', 'nuevo'], 4, 'nueva', ['nuevos', 'nuevas'], '.', 'Chaqueta is feminine singular, so use nueva.'),
    R('conjugation', 'You study Spanish every day.', ['Tú', 'estudia', 'español', 'todos', 'los', 'días'], 1, 'estudias', ['estudio', 'estudian'], '.', 'With tú, -ar verbs end in -as: estudias.'),
    R('conjugation', 'They are at home.', ['Ellas', 'estamos', 'en', 'casa'], 1, 'están', ['está', 'estáis'], '.', 'Ellas takes the third-person plural: están.'),
    R('preposition', 'I live in Madrid.', ['Vivo', 'a', 'Madrid'], 1, 'en', ['con', 'sobre'], '.', 'Use en for where you are or live. A shows movement toward a place.'),
    R('preposition', 'After work, we go to the supermarket.', ['Después', 'del', 'trabajo,', 'vamos', 'a el', 'supermercado'], 4, 'al', ['del', 'en el'], '.', 'A + el always contracts to al.'),
    R('word order', 'I do not eat meat.', ['Como no', 'carne'], 0, 'No como', ['No comer', 'Como ni'], '.', 'No goes directly before the verb.'),
    R('word order', 'I have a red car.', ['Tengo', 'un', 'rojo coche'], 2, 'coche rojo', ['coches rojos', 'roja coche'], '.', 'Color adjectives come after the noun in Spanish.'),
  ],
  armenian: [
    R('article', 'Where is the museum?', ['Թանգարան', 'ո՞ւր', 'է'], 0, 'Թանգարանը', ['Թանգարանէն', 'Թանգարանով'], '։', 'A specific noun takes the definite suffix -ը (“the”).', 'Definite suffix'),
    R('article', 'The cat is sleeping.', ['Կատուը', 'կը քնանայ'], 0, 'Կատուն', ['Կատուներ', 'Կատուի'], '։', 'After a vowel the definite suffix is -ն, not -ը: կատուն.', 'Definite suffix'),
    R('agreement', 'I have two books.', ['Երկու', 'գիրքեր', 'ունիմ'], 1, 'գիրք', ['գիրքը', 'գիրքէն'], '։', 'After a number, the noun normally stays singular: երկու գիրք.', 'Number agreement'),
    R('agreement', 'The children read a book.', ['Երեխաները', 'գիրք', 'կը կարդայ'], 2, 'կը կարդան', ['կը կարդամ', 'կը կարդաս'], '։', 'A plural subject needs a plural verb ending: կը կարդան.', 'Number agreement'),
    R('conjugation', 'I am tired today.', ['Ես', 'այսօր', 'յոգնած', 'է'], 3, 'եմ', ['ես', 'ենք'], '։', 'With ես (I), “to be” is եմ.'),
    R('conjugation', 'You study Armenian every day.', ['Դուն', 'ամէն', 'օր', 'հայերէն', 'կը սորվի'], 4, 'կը սորվիս', ['կը սորվիմ', 'կը սորվին'], '։', 'With դուն (you), the verb ends in -ս: կը սորվիս.'),
    R('preposition', 'The book is on the table.', ['Գիրքը', 'սեղանը', 'վրայ', 'է'], 1, 'սեղանին', ['սեղանէն', 'սեղանով'], '։', 'Armenian uses postpositions. Վրայ (on) needs the noun in the -ին form: սեղանին վրայ.', 'Postposition'),
    R('preposition', 'After work, we go to the market.', ['Գործը', 'ետք', 'մենք', 'շուկայ', 'կ’երթանք'], 0, 'Գործէն', ['Գործին', 'Գործով'], '։', 'Ետք (after) follows a noun in the -էն (from) form: գործէն ետք.', 'Postposition'),
    R('word order', 'I do not eat meat.', ['Ես', 'միս', 'ուտեր չեմ'], 2, 'չեմ ուտեր', ['կը չուտեմ', 'չէ ուտեր'], '։', 'In the negative present, the negative helper չեմ comes before the verb form: չեմ ուտեր.'),
    R('word order', 'Mary wears new clothes.', ['Մարին', 'հագուստ նոր', 'կը հագնի'], 1, 'նոր հագուստ', ['նորը հագուստ', 'հագուստը նոր'], '։', 'Adjectives come before the noun in Armenian: նոր հագուստ.'),
  ],
};

export function getFixItems(language: Language): FixItem[] {
  return DATA[language].map(([category, english, tokens, wrongIndex, fix, distractors, end, rule, label], i) => ({
    id: `fix-sentence-${language}-${i}`,
    category, categoryLabel: label ?? LABEL[category], english, tokens, wrongIndex, fix, distractors, end, rule,
  }));
}

export function correctedSentence(item: FixItem) {
  return item.tokens.map((t, i) => (i === item.wrongIndex ? item.fix : t)).join(' ') + item.end;
}
export function brokenSentence(item: FixItem) {
  return item.tokens.join(' ') + item.end;
}
