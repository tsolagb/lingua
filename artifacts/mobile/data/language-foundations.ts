import type { Language } from '@/data/vocabulary';
import {
  ARTICLE_GROUPS,
  CARDINAL_QUESTIONS,
  ITALIAN_ALPHABET,
  ORDINAL_QUESTIONS,
  type ItalianArticleGroup,
  type ItalianPracticeQuestion,
} from '@/data/italian-foundations';
import type { VerbTenseLabel } from '@/data/verb-exercises';
import {
  PREPOSITION_ARTICLE_HINTS,
  PREPOSITION_ARTICLE_QUESTIONS,
  PREPOSITION_HINTS,
  PREPOSITION_QUESTIONS,
} from '@/data/preposition-foundations';

export type FoundationLetter = {
  letter: string;
  name: string;
  example: string;
  foreignLetter: boolean;
  note?: string;
};

export type FoundationArticleGroup = {
  title: string;
  label: string;
  hint: string;
  questions: ItalianPracticeQuestion[];
};

export type LanguageFoundationContent = {
  languageName: string;
  articleGroups: Record<ItalianArticleGroup, FoundationArticleGroup>;
  cardinalQuestions: ItalianPracticeQuestion[];
  ordinalQuestions: ItalianPracticeQuestion[];
  prepositionQuestions: ItalianPracticeQuestion[];
  prepositionHint: string;
  prepositionArticleQuestions: ItalianPracticeQuestion[];
  prepositionArticleHint: string;
  alphabet: readonly FoundationLetter[];
  alphabetTitle: string;
  alphabetHint: string;
  cardinalHint: string;
  ordinalHint: string;
  tenseTimes: Record<VerbTenseLabel, string>;
  pastNote: string;
};

const FRENCH_ARTICLE_GROUPS: Record<ItalianArticleGroup, FoundationArticleGroup> = {
  definite: {
    title: 'Articles définis',
    label: 'THE',
    hint: 'Le and uncontracted la are singular; l’ is used before a vowel or silent h; les is plural for every gender.',
    questions: [
      { prompt: '“the book”', hint: 'Masculine · singular', sentence: '___ livre est intéressant.', sentenceTranslation: 'The book is interesting.', answer: 'le', choices: ['le', 'la', 'les'], explanation: 'Livre is masculine singular, so use le.' },
      { prompt: '“the house”', hint: 'Feminine · singular', sentence: '___ maison est grande.', sentenceTranslation: 'The house is big.', answer: 'la', choices: ['le', 'la', 'les'], explanation: 'Maison is feminine singular, so use la.' },
      { prompt: '“the friend” (male)', hint: 'Masculine · vowel', sentence: '___ ami arrive.', sentenceTranslation: 'The male friend is arriving.', answer: 'l’', choices: ['le', 'la', 'l’'], explanation: 'Use l’ before a vowel sound. The apostrophe joins the words.' },
      { prompt: '“the friend” (female)', hint: 'Feminine · vowel', sentence: '___ amie arrive.', sentenceTranslation: 'The female friend is arriving.', answer: 'l’', choices: ['la', 'l’', 'les'], explanation: 'Use l’ before a vowel sound, whether the noun is masculine or feminine.' },
      { prompt: '“the books”', hint: 'Masculine · plural', sentence: '___ livres sont nouveaux.', sentenceTranslation: 'The books are new.', answer: 'les', choices: ['le', 'la', 'les'], explanation: 'Les is the definite article for all plural nouns.' },
      { prompt: '“the girls”', hint: 'Feminine · plural', sentence: '___ filles jouent.', sentenceTranslation: 'The girls are playing.', answer: 'les', choices: ['le', 'la', 'les'], explanation: 'Les is used with feminine plural nouns too.' },
      { prompt: '“the students” (male or mixed group)', hint: 'Masculine · plural · vowel', sentence: '___ étudiants étudient.', sentenceTranslation: 'The students are studying.', answer: 'les', choices: ['le', 'l’', 'les'], explanation: 'French uses les for masculine plural nouns, including before a vowel.' },
      { prompt: '“the school”', hint: 'Feminine · singular · vowel', sentence: '___ école ouvre.', sentenceTranslation: 'The school is opening.', answer: 'l’', choices: ['la', 'l’', 'les'], explanation: 'École is feminine, but la becomes l’ before its vowel sound.' },
    ],
  },
  indefinite: {
    title: 'Articles indéfinis',
    label: 'A / AN',
    hint: 'Use un for a masculine singular noun and une for a feminine singular noun. Des is used for plural nouns.',
    questions: [
      { prompt: '“a book”', hint: 'Masculine · singular', sentence: 'J’achète ___ livre.', sentenceTranslation: 'I am buying a book.', answer: 'un', choices: ['un', 'une', 'des'], explanation: 'Livre is masculine singular, so use un.' },
      { prompt: '“a house”', hint: 'Feminine · singular', sentence: 'C’est ___ maison.', sentenceTranslation: 'It is a house.', answer: 'une', choices: ['un', 'une', 'des'], explanation: 'Maison is feminine singular, so use une.' },
      { prompt: '“a friend” (male)', hint: 'Masculine · vowel', sentence: 'C’est ___ ami.', sentenceTranslation: 'He is a friend.', answer: 'un', choices: ['un', 'une', 'des'], explanation: 'French keeps un before a masculine noun beginning with a vowel.' },
      { prompt: '“a friend” (female)', hint: 'Feminine · vowel', sentence: 'C’est ___ amie.', sentenceTranslation: 'She is a friend.', answer: 'une', choices: ['un', 'une', 'des'], explanation: 'Use une for a feminine singular noun, even before a vowel.' },
      { prompt: '“some books”', hint: 'Masculine · plural', sentence: 'J’achète ___ livres.', sentenceTranslation: 'I am buying some books.', answer: 'des', choices: ['un', 'une', 'des'], explanation: 'Des is the plural indefinite article for masculine and feminine nouns.' },
      { prompt: '“some houses”', hint: 'Feminine · plural', sentence: 'Ce sont ___ maisons.', sentenceTranslation: 'These are houses.', answer: 'des', choices: ['un', 'une', 'des'], explanation: 'Use des for feminine plural nouns too.' },
      { prompt: '“a student”', hint: 'Masculine · vowel', sentence: 'C’est ___ étudiant.', sentenceTranslation: 'He is a student.', answer: 'un', choices: ['un', 'une', 'des'], explanation: 'Étudiant is masculine singular, so use un.' },
      { prompt: '“a school”', hint: 'Feminine · vowel', sentence: 'Je visite ___ école.', sentenceTranslation: 'I am visiting a school.', answer: 'une', choices: ['un', 'une', 'des'], explanation: 'École is feminine singular, so use une.' },
    ],
  },
  partitive: {
    title: 'Articles partitifs',
    label: 'SOME',
    hint: 'For an unspecified amount, use du, de la, de l’ before a vowel, or des with plural nouns.',
    questions: [
      { prompt: '“some bread”', hint: 'Masculine · singular', sentence: 'Je mange ___ pain.', sentenceTranslation: 'I am eating some bread.', answer: 'du', choices: ['du', 'de la', 'des'], explanation: 'Du is used with an unspecified amount of a masculine singular noun.' },
      { prompt: '“some soup”', hint: 'Feminine · singular', sentence: 'Je prends ___ soupe.', sentenceTranslation: 'I am having some soup.', answer: 'de la', choices: ['du', 'de la', 'de l’'], explanation: 'Use de la before a feminine singular noun beginning with a consonant.' },
      { prompt: '“some water”', hint: 'Vowel sound', sentence: 'Je bois ___ eau.', sentenceTranslation: 'I am drinking some water.', answer: 'de l’', choices: ['du', 'de la', 'de l’'], explanation: 'Use de l’ before a vowel sound; the apostrophe joins it to eau.' },
      { prompt: '“some pasta”', hint: 'Plural', sentence: 'Je cuisine ___ pâtes.', sentenceTranslation: 'I am cooking some pasta.', answer: 'des', choices: ['du', 'de la', 'des'], explanation: 'Use des with an unspecified amount of a plural noun.' },
      { prompt: '“some cheese”', hint: 'Masculine · singular', sentence: 'J’ajoute ___ fromage.', sentenceTranslation: 'I am adding some cheese.', answer: 'du', choices: ['du', 'de la', 'des'], explanation: 'Fromage is masculine, so use du for an unspecified amount.' },
      { prompt: '“some salad”', hint: 'Feminine · singular', sentence: 'Elle prépare ___ salade.', sentenceTranslation: 'She is preparing some salad.', answer: 'de la', choices: ['du', 'de la', 'des'], explanation: 'Salade is feminine singular, so use de la.' },
      { prompt: '“some fruit”', hint: 'Plural', sentence: 'Nous achetons ___ fruits.', sentenceTranslation: 'We are buying some fruit.', answer: 'des', choices: ['du', 'de la', 'des'], explanation: 'Fruits is plural, so use des.' },
      { prompt: '“some orangeade”', hint: 'Vowel sound', sentence: 'Il boit ___ orangeade.', sentenceTranslation: 'He is drinking some orangeade.', answer: 'de l’', choices: ['du', 'de l’', 'des'], explanation: 'Use de l’ before a vowel sound.' },
    ],
  },
};

const FRENCH_CARDINAL_QUESTIONS: ItalianPracticeQuestion[] = [
  { prompt: 'How do you count 0?', hint: 'zero · zero', answer: 'zéro', choices: ['zéro', 'un', 'dix'], explanation: 'Zéro means zero.' },
  { prompt: 'How do you count 1?', hint: 'one · one', answer: 'un', choices: ['un', 'deux', 'onze'], explanation: 'Un means one.' },
  { prompt: 'How do you count 2?', hint: 'two · two', answer: 'deux', choices: ['deux', 'douze', 'dix'], explanation: 'Deux means two.' },
  { prompt: 'How do you count 3?', hint: 'three · three', answer: 'trois', choices: ['trois', 'six', 'trente'], explanation: 'Trois means three.' },
  { prompt: 'How do you count 4?', hint: 'four · four', answer: 'quatre', choices: ['quatre', 'quatorze', 'quarante'], explanation: 'Quatre means four.' },
  { prompt: 'How do you count 5?', hint: 'five · five', answer: 'cinq', choices: ['cinq', 'quinze', 'cinquante'], explanation: 'Cinq means five.' },
  { prompt: 'How do you count 6?', hint: 'six · six', answer: 'six', choices: ['six', 'seize', 'soixante'], explanation: 'Six means six.' },
  { prompt: 'How do you count 7?', hint: 'seven · seven', answer: 'sept', choices: ['sept', 'seize', 'soixante-dix'], explanation: 'Sept means seven.' },
  { prompt: 'How do you count 8?', hint: 'eight · eight', answer: 'huit', choices: ['huit', 'dix-huit', 'quatre-vingts'], explanation: 'Huit means eight.' },
  { prompt: 'How do you count 9?', hint: 'nine · nine', answer: 'neuf', choices: ['neuf', 'dix-neuf', 'quatre-vingt-dix'], explanation: 'Neuf means nine.' },
  { prompt: 'How do you count 10?', hint: 'ten · ten', answer: 'dix', choices: ['dix', 'six', 'douze'], explanation: 'Dix means ten.' },
  { prompt: 'How do you count 11?', hint: 'eleven · eleven', answer: 'onze', choices: ['onze', 'douze', 'vingt et un'], explanation: 'Onze means eleven.' },
  { prompt: 'How do you count 12?', hint: 'twelve · twelve', answer: 'douze', choices: ['douze', 'treize', 'deux'], explanation: 'Douze means twelve.' },
  { prompt: 'How do you count 13?', hint: 'thirteen · thirteen', answer: 'treize', choices: ['treize', 'trente', 'quatorze'], explanation: 'Treize means thirteen.' },
  { prompt: 'How do you count 14?', hint: 'fourteen · fourteen', answer: 'quatorze', choices: ['quatorze', 'quatre', 'quinze'], explanation: 'Quatorze means fourteen.' },
  { prompt: 'How do you count 15?', hint: 'fifteen · fifteen', answer: 'quinze', choices: ['quinze', 'cinq', 'seize'], explanation: 'Quinze means fifteen.' },
  { prompt: 'How do you count 16?', hint: 'sixteen · sixteen', answer: 'seize', choices: ['seize', 'six', 'soixante'], explanation: 'Seize means sixteen.' },
  { prompt: 'How do you say 17?', hint: 'seventeen · 17', answer: 'dix-sept', choices: ['dix-sept', 'dix-huit', 'sept'], explanation: 'Dix-sept means seventeen.' },
  { prompt: 'How do you say 18?', hint: 'eighteen · 18', answer: 'dix-huit', choices: ['dix-huit', 'dix-sept', 'huit'], explanation: 'Dix-huit means eighteen.' },
  { prompt: 'How do you say 19?', hint: 'nineteen · 19', answer: 'dix-neuf', choices: ['dix-neuf', 'dix-huit', 'neuf'], explanation: 'Dix-neuf means nineteen.' },
  { prompt: 'How do you count 20?', hint: 'twenty · twenty', answer: 'vingt', choices: ['vingt', 'douze', 'trente'], explanation: 'Vingt means twenty.' },
  { prompt: 'How do you say 21?', hint: 'twenty-one · 21', answer: 'vingt et un', choices: ['vingt et un', 'vingt-trois', 'trente et un'], explanation: 'Vingt et un means twenty-one.' },
  { prompt: 'How do you say 30?', hint: 'thirty · 30', answer: 'trente', choices: ['trente', 'treize', 'quarante'], explanation: 'Trente means thirty.' },
  { prompt: 'How do you say 31?', hint: 'thirty-one · 31', answer: 'trente et un', choices: ['trente et un', 'trente-deux', 'quarante et un'], explanation: 'Trente et un means thirty-one.' },
  { prompt: 'How do you say 40?', hint: 'forty · 40', answer: 'quarante', choices: ['quarante', 'quatorze', 'cinquante'], explanation: 'Quarante means forty.' },
  { prompt: 'How do you say 50?', hint: 'fifty · 50', answer: 'cinquante', choices: ['cinquante', 'quinze', 'soixante'], explanation: 'Cinquante means fifty.' },
  { prompt: 'How do you say 60?', hint: 'sixty · 60', answer: 'soixante', choices: ['soixante', 'seize', 'septante'], explanation: 'Soixante means sixty.' },
  { prompt: 'How do you say 70?', hint: 'seventy · 70', answer: 'soixante-dix', choices: ['soixante-dix', 'septante', 'soixante'], explanation: 'In standard French used in France, 70 is soixante-dix.' },
  { prompt: 'How do you say 80?', hint: 'eighty · 80', answer: 'quatre-vingts', choices: ['quatre-vingts', 'quatre-vingt-dix', 'quarante'], explanation: 'Quatre-vingts means eighty; it takes an s when it stands alone.' },
  { prompt: 'How do you say 90?', hint: 'ninety · 90', answer: 'quatre-vingt-dix', choices: ['quatre-vingt-dix', 'quatre-vingts', 'soixante-dix'], explanation: 'Quatre-vingt-dix means ninety.' },
  { prompt: 'How do you say 100?', hint: 'one hundred · 100', answer: 'cent', choices: ['cent', 'cents', 'dix'], explanation: 'Cent means one hundred.' },
  { prompt: 'How do you say 1,000?', hint: 'one thousand · 1,000', answer: 'mille', choices: ['mille', 'million', 'cent'], explanation: 'Mille means one thousand.' },
];

const FRENCH_ORDINAL_QUESTIONS: ItalianPracticeQuestion[] = [
  { prompt: '“first” · masculine', hint: '1st · “the first day”', example: 'le premier jour', answer: 'premier', choices: ['premier', 'première', 'deuxième'], explanation: 'Premier is the masculine form of first.' },
  { prompt: '“first” · feminine', hint: '1st · “the first time”', example: 'la première fois', answer: 'première', choices: ['premier', 'première', 'troisième'], explanation: 'Première is the feminine form of first.' },
  { prompt: '“second”', hint: '2nd · “the second floor”', example: 'le deuxième étage', answer: 'deuxième', choices: ['deuxième', 'troisième', 'première'], explanation: 'Deuxième means second and has the same written form for masculine and feminine nouns.' },
  { prompt: '“third”', hint: '3rd · “the third page”', example: 'la troisième page', answer: 'troisième', choices: ['troisième', 'quatrième', 'première'], explanation: 'Troisième means third.' },
  { prompt: '“fourth”', hint: '4th · “the fourth month”', example: 'le quatrième mois', answer: 'quatrième', choices: ['quatrième', 'cinquième', 'deuxième'], explanation: 'Quatrième means fourth.' },
  { prompt: '“fifth”', hint: '5th · “the fifth lesson”', example: 'la cinquième leçon', answer: 'cinquième', choices: ['cinquième', 'sixième', 'septième'], explanation: 'Cinquième means fifth.' },
  { prompt: '“sixth”', hint: '6th · “the sixth day”', example: 'le sixième jour', answer: 'sixième', choices: ['sixième', 'cinquième', 'huitième'], explanation: 'Sixième means sixth.' },
  { prompt: '“seventh”', hint: '7th · “the seventh week”', example: 'la septième semaine', answer: 'septième', choices: ['septième', 'sixième', 'neuvième'], explanation: 'Septième means seventh.' },
  { prompt: '“eighth”', hint: '8th · “the eighth floor”', example: 'le huitième étage', answer: 'huitième', choices: ['huitième', 'neuvième', 'dixième'], explanation: 'Huitième means eighth.' },
  { prompt: '“ninth”', hint: '9th · “the ninth hour”', example: 'la neuvième heure', answer: 'neuvième', choices: ['neuvième', 'huitième', 'dixième'], explanation: 'Neuvième means ninth.' },
  { prompt: '“tenth”', hint: '10th · “the tenth question”', example: 'la dixième question', answer: 'dixième', choices: ['dixième', 'neuvième', 'sixième'], explanation: 'Dixième means tenth.' },
];

const FRENCH_ALPHABET: readonly FoundationLetter[] = [
  { letter: 'A', name: 'a', example: 'ami', foreignLetter: false },
  { letter: 'B', name: 'bé', example: 'bon', foreignLetter: false },
  { letter: 'C', name: 'cé', example: 'café', foreignLetter: false },
  { letter: 'D', name: 'dé', example: 'deux', foreignLetter: false },
  { letter: 'E', name: 'e', example: 'été', foreignLetter: false },
  { letter: 'F', name: 'effe', example: 'fleur', foreignLetter: false },
  { letter: 'G', name: 'gé', example: 'gâteau', foreignLetter: false },
  { letter: 'H', name: 'ache', example: 'hôtel', foreignLetter: false, note: 'H is not pronounced; some words also block liaison.' },
  { letter: 'I', name: 'i', example: 'île', foreignLetter: false },
  { letter: 'J', name: 'ji', example: 'jour', foreignLetter: false },
  { letter: 'K', name: 'ka', example: 'kiwi', foreignLetter: false },
  { letter: 'L', name: 'elle', example: 'lune', foreignLetter: false },
  { letter: 'M', name: 'emme', example: 'maison', foreignLetter: false },
  { letter: 'N', name: 'enne', example: 'nuit', foreignLetter: false },
  { letter: 'O', name: 'o', example: 'orange', foreignLetter: false },
  { letter: 'P', name: 'pé', example: 'pain', foreignLetter: false },
  { letter: 'Q', name: 'ku', example: 'quatre', foreignLetter: false },
  { letter: 'R', name: 'erre', example: 'rue', foreignLetter: false },
  { letter: 'S', name: 'esse', example: 'soleil', foreignLetter: false },
  { letter: 'T', name: 'té', example: 'table', foreignLetter: false },
  { letter: 'U', name: 'u', example: 'une', foreignLetter: false },
  { letter: 'V', name: 'vé', example: 'vélo', foreignLetter: false },
  { letter: 'W', name: 'double vé', example: 'wagon', foreignLetter: false },
  { letter: 'X', name: 'ix', example: 'xylophone', foreignLetter: false },
  { letter: 'Y', name: 'i grec', example: 'yaourt', foreignLetter: false },
  { letter: 'Z', name: 'zède', example: 'zéro', foreignLetter: false },
];

const SPANISH_ARTICLE_GROUPS: Record<ItalianArticleGroup, FoundationArticleGroup> = {
  definite: {
    title: 'Artículos determinados',
    label: 'THE',
    hint: 'El and la are singular; los and las are plural. Choose the article to match the noun’s gender and number.',
    questions: [
      { prompt: '“the book”', hint: 'Masculine · singular', sentence: '___ libro es nuevo.', sentenceTranslation: 'The book is new.', answer: 'el', choices: ['el', 'la', 'los'], explanation: 'Libro is masculine singular, so use el.' },
      { prompt: '“the house”', hint: 'Feminine · singular', sentence: '___ casa es grande.', sentenceTranslation: 'The house is big.', answer: 'la', choices: ['el', 'la', 'las'], explanation: 'Casa is feminine singular, so use la.' },
      { prompt: '“the friend” (male)', hint: 'Masculine · singular', sentence: '___ amigo llega.', sentenceTranslation: 'The male friend is arriving.', answer: 'el', choices: ['el', 'la', 'los'], explanation: 'Amigo is masculine singular, so use el.' },
      { prompt: '“the friend” (female)', hint: 'Feminine · singular', sentence: '___ amiga llega.', sentenceTranslation: 'The female friend is arriving.', answer: 'la', choices: ['el', 'la', 'las'], explanation: 'Amiga is feminine singular, so use la.' },
      { prompt: '“the books”', hint: 'Masculine · plural', sentence: '___ libros son nuevos.', sentenceTranslation: 'The books are new.', answer: 'los', choices: ['el', 'los', 'las'], explanation: 'Use los for masculine plural nouns.' },
      { prompt: '“the houses”', hint: 'Feminine · plural', sentence: '___ casas son grandes.', sentenceTranslation: 'The houses are big.', answer: 'las', choices: ['el', 'los', 'las'], explanation: 'Use las for feminine plural nouns.' },
      { prompt: '“the students”', hint: 'Masculine · plural', sentence: '___ estudiantes estudian.', sentenceTranslation: 'The students are studying.', answer: 'los', choices: ['el', 'los', 'las'], explanation: 'Estudiantes is masculine plural in this example, so use los.' },
      { prompt: '“the schools”', hint: 'Feminine · plural', sentence: '___ escuelas están abiertas.', sentenceTranslation: 'The schools are open.', answer: 'las', choices: ['el', 'los', 'las'], explanation: 'Escuelas is feminine plural, so use las.' },
    ],
  },
  indefinite: {
    title: 'Artículos indeterminados',
    label: 'A / AN',
    hint: 'Use un for masculine singular, una for feminine singular, and unos or unas for plural.',
    questions: [
      { prompt: '“a book”', hint: 'Masculine · singular', sentence: 'Leo ___ libro.', sentenceTranslation: 'I am reading a book.', answer: 'un', choices: ['un', 'una', 'unos'], explanation: 'Libro is masculine singular, so use un.' },
      { prompt: '“a house”', hint: 'Feminine · singular', sentence: 'Es ___ casa.', sentenceTranslation: 'It is a house.', answer: 'una', choices: ['un', 'una', 'unas'], explanation: 'Casa is feminine singular, so use una.' },
      { prompt: '“a friend” (male)', hint: 'Masculine · singular · vowel', sentence: 'Es ___ amigo.', sentenceTranslation: 'He is a friend.', answer: 'un', choices: ['un', 'una', 'unos'], explanation: 'Use un before a masculine singular noun, including one beginning with a.' },
      { prompt: '“a friend” (female)', hint: 'Feminine · singular · vowel', sentence: 'Es ___ amiga.', sentenceTranslation: 'She is a friend.', answer: 'una', choices: ['un', 'una', 'unas'], explanation: 'Use una before a feminine singular noun beginning with a vowel.' },
      { prompt: '“some books”', hint: 'Masculine · plural', sentence: 'Leo ___ libros.', sentenceTranslation: 'I am reading some books.', answer: 'unos', choices: ['un', 'unos', 'unas'], explanation: 'Use unos for masculine plural nouns.' },
      { prompt: '“some houses”', hint: 'Feminine · plural', sentence: 'Veo ___ casas.', sentenceTranslation: 'I see some houses.', answer: 'unas', choices: ['una', 'unos', 'unas'], explanation: 'Use unas for feminine plural nouns.' },
      { prompt: '“a student”', hint: 'Masculine · singular', sentence: 'Conozco ___ estudiante.', sentenceTranslation: 'I know a student.', answer: 'un', choices: ['un', 'una', 'unos'], explanation: 'Estudiante is used here as a masculine singular noun, so use un.' },
      { prompt: '“a school”', hint: 'Feminine · singular', sentence: 'Visito ___ escuela.', sentenceTranslation: 'I am visiting a school.', answer: 'una', choices: ['un', 'una', 'unas'], explanation: 'Escuela is feminine singular, so use una.' },
    ],
  },
  partitive: {
    title: '“Some” · plural and amounts',
    label: 'SOME',
    hint: 'Use unos/unas with countable plurals. For an uncountable amount, use algo de or un poco de; Spanish has no separate partitive article.',
    questions: [
      { prompt: '“some cookies”', hint: 'Feminine · countable plural', sentence: 'Quiero ___ galletas.', sentenceTranslation: 'I want some cookies.', answer: 'unas', choices: ['unos', 'unas', 'algo de'], explanation: 'Use unas with a feminine countable plural noun.' },
      { prompt: '“some friends”', hint: 'Masculine · countable plural', sentence: 'Veo ___ amigos.', sentenceTranslation: 'I see some friends.', answer: 'unos', choices: ['unos', 'unas', 'algo de'], explanation: 'Use unos with a masculine countable plural noun.' },
      { prompt: '“some apples”', hint: 'Feminine · countable plural', sentence: 'Compro ___ manzanas.', sentenceTranslation: 'I am buying some apples.', answer: 'unas', choices: ['unos', 'unas', 'algo de'], explanation: 'Use unas with feminine plural manzanas.' },
      { prompt: '“some books”', hint: 'Masculine · countable plural', sentence: 'Necesito ___ libros.', sentenceTranslation: 'I need some books.', answer: 'unos', choices: ['unos', 'unas', 'algo de'], explanation: 'Use unos with masculine plural libros.' },
      { prompt: '“some water”', hint: 'An uncountable amount', sentence: 'Quiero ___ agua.', sentenceTranslation: 'I want some water.', answer: 'algo de', choices: ['unos', 'una', 'algo de'], explanation: 'Use algo de for an unspecified amount of a non-count noun: algo de agua.' },
      { prompt: '“some milk”', hint: 'An uncountable amount', sentence: 'Bebo ___ leche.', sentenceTranslation: 'I am drinking some milk.', answer: 'algo de', choices: ['unas', 'algo de', 'un'], explanation: 'Leche is uncountable here; algo de leche means some milk.' },
      { prompt: '“some bread”', hint: 'An uncountable amount', sentence: 'Compro ___ pan.', sentenceTranslation: 'I am buying some bread.', answer: 'algo de', choices: ['unos', 'algo de', 'una'], explanation: 'Use algo de before an unspecified amount of pan.' },
      { prompt: '“some oranges”', hint: 'Feminine · countable plural', sentence: 'Hay ___ naranjas.', sentenceTranslation: 'There are some oranges.', answer: 'unas', choices: ['unos', 'unas', 'algo de'], explanation: 'Use unas with feminine plural naranjas.' },
    ],
  },
};

const SPANISH_CARDINAL_QUESTIONS: ItalianPracticeQuestion[] = [
  { prompt: 'How do you count 0?', hint: 'zero · zero', answer: 'cero', choices: ['cero', 'uno', 'diez'], explanation: 'Cero means zero.' },
  { prompt: 'How do you count 1?', hint: 'one · one', answer: 'uno', choices: ['uno', 'un', 'dos'], explanation: 'Uno means one by itself. Before a masculine noun it shortens to un: un libro.' },
  { prompt: 'How do you count 2?', hint: 'two · two', answer: 'dos', choices: ['dos', 'doce', 'diez'], explanation: 'Dos means two.' },
  { prompt: 'How do you count 3?', hint: 'three · three', answer: 'tres', choices: ['tres', 'seis', 'treinta'], explanation: 'Tres means three.' },
  { prompt: 'How do you count 4?', hint: 'four · four', answer: 'cuatro', choices: ['cuatro', 'ocho', 'catorce'], explanation: 'Cuatro means four.' },
  { prompt: 'How do you count 5?', hint: 'five · five', answer: 'cinco', choices: ['cinco', 'quince', 'siete'], explanation: 'Cinco means five.' },
  { prompt: 'How do you count 6?', hint: 'six · six', answer: 'seis', choices: ['seis', 'cinco', 'dieciséis'], explanation: 'Seis means six.' },
  { prompt: 'How do you count 7?', hint: 'seven · seven', answer: 'siete', choices: ['siete', 'seis', 'diecisiete'], explanation: 'Siete means seven.' },
  { prompt: 'How do you count 8?', hint: 'eight · eight', answer: 'ocho', choices: ['ocho', 'cuatro', 'dieciocho'], explanation: 'Ocho means eight.' },
  { prompt: 'How do you count 9?', hint: 'nine · nine', answer: 'nueve', choices: ['nueve', 'nuevo', 'diecinueve'], explanation: 'Nueve means nine.' },
  { prompt: 'How do you count 10?', hint: 'ten · ten', answer: 'diez', choices: ['diez', 'doce', 'veinte'], explanation: 'Diez means ten.' },
  { prompt: 'How do you count 11?', hint: 'eleven · eleven', answer: 'once', choices: ['once', 'doce', 'veintiuno'], explanation: 'Once means eleven.' },
  { prompt: 'How do you count 12?', hint: 'twelve · twelve', answer: 'doce', choices: ['doce', 'trece', 'dos'], explanation: 'Doce means twelve.' },
  { prompt: 'How do you count 13?', hint: 'thirteen · thirteen', answer: 'trece', choices: ['trece', 'catorce', 'treinta'], explanation: 'Trece means thirteen.' },
  { prompt: 'How do you count 14?', hint: 'fourteen · fourteen', answer: 'catorce', choices: ['catorce', 'cuatro', 'quince'], explanation: 'Catorce means fourteen.' },
  { prompt: 'How do you count 15?', hint: 'fifteen · fifteen', answer: 'quince', choices: ['quince', 'cinco', 'dieciséis'], explanation: 'Quince means fifteen.' },
  { prompt: 'How do you count 16?', hint: 'sixteen · sixteen', answer: 'dieciséis', choices: ['dieciséis', 'seis', 'veintiséis'], explanation: 'Dieciséis means sixteen and carries an accent on the é.' },
  { prompt: 'How do you say 17?', hint: 'seventeen · 17', answer: 'diecisiete', choices: ['diecisiete', 'dieciocho', 'siete'], explanation: 'Diecisiete means seventeen.' },
  { prompt: 'How do you say 18?', hint: 'eighteen · 18', answer: 'dieciocho', choices: ['dieciocho', 'diecisiete', 'ocho'], explanation: 'Dieciocho means eighteen.' },
  { prompt: 'How do you say 19?', hint: 'nineteen · 19', answer: 'diecinueve', choices: ['diecinueve', 'dieciocho', 'nueve'], explanation: 'Diecinueve means nineteen.' },
  { prompt: 'How do you count 20?', hint: 'twenty · twenty', answer: 'veinte', choices: ['veinte', 'doce', 'treinta'], explanation: 'Veinte means twenty.' },
  { prompt: 'How do you say 21?', hint: 'twenty-one · 21', answer: 'veintiuno', choices: ['veintiuno', 'veintitrés', 'treinta y uno'], explanation: 'Veintiuno means twenty-one.' },
  { prompt: 'How do you say 23?', hint: 'twenty-three · 23', answer: 'veintitrés', choices: ['veintitrés', 'veintiuno', 'veintiocho'], explanation: 'Veintitrés means twenty-three and takes an accent on the é.' },
  { prompt: 'How do you say 28?', hint: 'twenty-eight · 28', answer: 'veintiocho', choices: ['veintiocho', 'veintiuno', 'treinta y ocho'], explanation: 'Veintiocho means twenty-eight.' },
  { prompt: 'How do you say 30?', hint: 'thirty · 30', answer: 'treinta', choices: ['treinta', 'trece', 'trescientos'], explanation: 'Treinta means thirty.' },
  { prompt: 'How do you say 31?', hint: 'thirty-one · 31', answer: 'treinta y uno', choices: ['treinta y uno', 'treinta y tres', 'cuarenta y uno'], explanation: 'Use y between the tens and units from 31 onward: treinta y uno.' },
  { prompt: 'How do you say 40?', hint: 'forty · 40', answer: 'cuarenta', choices: ['cuarenta', 'catorce', 'cincuenta'], explanation: 'Cuarenta means forty.' },
  { prompt: 'How do you say 50?', hint: 'fifty · 50', answer: 'cincuenta', choices: ['cincuenta', 'quince', 'sesenta'], explanation: 'Cincuenta means fifty.' },
  { prompt: 'How do you say 60?', hint: 'sixty · 60', answer: 'sesenta', choices: ['sesenta', 'dieciséis', 'setenta'], explanation: 'Sesenta means sixty.' },
  { prompt: 'How do you say 70?', hint: 'seventy · 70', answer: 'setenta', choices: ['setenta', 'diecisiete', 'sesenta'], explanation: 'Setenta means seventy.' },
  { prompt: 'How do you say 80?', hint: 'eighty · 80', answer: 'ochenta', choices: ['ochenta', 'ocho', 'noventa'], explanation: 'Ochenta means eighty.' },
  { prompt: 'How do you say 90?', hint: 'ninety · 90', answer: 'noventa', choices: ['noventa', 'nueve', 'ochenta'], explanation: 'Noventa means ninety.' },
  { prompt: 'How do you say 100?', hint: 'one hundred · 100', answer: 'cien', choices: ['cien', 'ciento', 'diez'], explanation: 'Use cien for exactly one hundred; ciento is used before a following number.' },
  { prompt: 'How do you say 1,000?', hint: 'one thousand · 1,000', answer: 'mil', choices: ['mil', 'millón', 'cien'], explanation: 'Mil means one thousand.' },
];

const SPANISH_ORDINAL_QUESTIONS: ItalianPracticeQuestion[] = [
  { prompt: '“first” · masculine', hint: '1st · “the first day”', example: 'el primero', answer: 'primero', choices: ['primero', 'primera', 'segundo'], explanation: 'Primero is the masculine form of first. Before a masculine singular noun it shortens to primer: el primer día.' },
  { prompt: '“first” · feminine', hint: '1st · “the first time”', example: 'la primera vez', answer: 'primera', choices: ['primero', 'primera', 'tercera'], explanation: 'Primera is the feminine form of first.' },
  { prompt: '“second” · masculine', hint: '2nd · “the second floor”', example: 'el segundo piso', answer: 'segundo', choices: ['segunda', 'segundo', 'tercero'], explanation: 'Segundo is the masculine form of second.' },
  { prompt: '“second” · feminine', hint: '2nd · “the second question”', example: 'la segunda pregunta', answer: 'segunda', choices: ['segundo', 'segunda', 'cuarta'], explanation: 'Segunda is the feminine form of second.' },
  { prompt: '“third” · masculine', hint: '3rd · “the third book”', example: 'el tercero', answer: 'tercero', choices: ['tercero', 'tercera', 'cuarto'], explanation: 'Tercero is the masculine form of third. Before a masculine singular noun it shortens to tercer.' },
  { prompt: '“third” · feminine', hint: '3rd · “the third street”', example: 'la tercera calle', answer: 'tercera', choices: ['tercero', 'tercera', 'quinta'], explanation: 'Tercera is the feminine form of third.' },
  { prompt: '“fourth” · masculine', hint: '4th · “the fourth month”', example: 'el cuarto mes', answer: 'cuarto', choices: ['cuarto', 'cuarta', 'quinto'], explanation: 'Cuarto is the masculine form of fourth.' },
  { prompt: '“fourth” · feminine', hint: '4th · “the fourth page”', example: 'la cuarta página', answer: 'cuarta', choices: ['cuarto', 'cuarta', 'sexta'], explanation: 'Cuarta is the feminine form of fourth.' },
  { prompt: '“fifth” · masculine', hint: '5th · “the fifth day”', example: 'el quinto día', answer: 'quinto', choices: ['quinto', 'quinta', 'sexto'], explanation: 'Quinto is the masculine form of fifth.' },
  { prompt: '“fifth” · feminine', hint: '5th · “the fifth lesson”', example: 'la quinta lección', answer: 'quinta', choices: ['quinto', 'quinta', 'séptima'], explanation: 'Quinta is the feminine form of fifth.' },
  { prompt: '“sixth” · masculine', hint: '6th · “the sixth student”', example: 'el sexto estudiante', answer: 'sexto', choices: ['sexto', 'sexta', 'séptimo'], explanation: 'Sexto is the masculine form of sixth.' },
  { prompt: '“sixth” · feminine', hint: '6th · “the sixth lesson”', example: 'la sexta lección', answer: 'sexta', choices: ['sexto', 'sexta', 'octava'], explanation: 'Lección is feminine, so use sexta.' },
  { prompt: '“seventh” · masculine', hint: '7th · “the seventh day”', example: 'el séptimo día', answer: 'séptimo', choices: ['séptima', 'séptimo', 'octavo'], explanation: 'Séptimo is the masculine form of seventh and takes an accent.' },
  { prompt: '“seventh” · feminine', hint: '7th · “the seventh week”', example: 'la séptima semana', answer: 'séptima', choices: ['séptimo', 'séptima', 'novena'], explanation: 'Séptima is the feminine form of seventh.' },
  { prompt: '“eighth” · masculine', hint: '8th · “the eighth floor”', example: 'el octavo piso', answer: 'octavo', choices: ['octava', 'octavo', 'noveno'], explanation: 'Octavo is the masculine form of eighth.' },
  { prompt: '“eighth” · feminine', hint: '8th · “the eighth time”', example: 'la octava vez', answer: 'octava', choices: ['octavo', 'octava', 'décima'], explanation: 'Octava is the feminine form of eighth.' },
  { prompt: '“ninth” · masculine', hint: '9th · “the ninth month”', example: 'el noveno mes', answer: 'noveno', choices: ['novena', 'noveno', 'décimo'], explanation: 'Noveno is the masculine form of ninth.' },
  { prompt: '“ninth” · feminine', hint: '9th · “the ninth hour”', example: 'la novena hora', answer: 'novena', choices: ['noveno', 'novena', 'primera'], explanation: 'Novena is the feminine form of ninth.' },
  { prompt: '“tenth” · masculine', hint: '10th · “the tenth day”', example: 'el décimo día', answer: 'décimo', choices: ['décima', 'décimo', 'noveno'], explanation: 'Décimo is the masculine form of tenth and takes an accent.' },
  { prompt: '“tenth” · feminine', hint: '10th · “the tenth question”', example: 'la décima pregunta', answer: 'décima', choices: ['décimo', 'décima', 'segunda'], explanation: 'Décima is the feminine form of tenth.' },
];

const SPANISH_ALPHABET: readonly FoundationLetter[] = [
  { letter: 'A', name: 'a', example: 'amigo', foreignLetter: false },
  { letter: 'B', name: 'be', example: 'bueno', foreignLetter: false },
  { letter: 'C', name: 'ce', example: 'casa', foreignLetter: false },
  { letter: 'D', name: 'de', example: 'dado', foreignLetter: false },
  { letter: 'E', name: 'e', example: 'escuela', foreignLetter: false },
  { letter: 'F', name: 'efe', example: 'familia', foreignLetter: false },
  { letter: 'G', name: 'ge', example: 'gato', foreignLetter: false },
  { letter: 'H', name: 'hache', example: 'hotel', foreignLetter: false, note: 'H is silent in Spanish, as in hola.' },
  { letter: 'I', name: 'i', example: 'isla', foreignLetter: false },
  { letter: 'J', name: 'jota', example: 'jardín', foreignLetter: false },
  { letter: 'K', name: 'ka', example: 'kiwi', foreignLetter: false },
  { letter: 'L', name: 'ele', example: 'luna', foreignLetter: false },
  { letter: 'M', name: 'eme', example: 'mesa', foreignLetter: false },
  { letter: 'N', name: 'ene', example: 'noche', foreignLetter: false },
  { letter: 'Ñ', name: 'eñe', example: 'niño', foreignLetter: false },
  { letter: 'O', name: 'o', example: 'oso', foreignLetter: false },
  { letter: 'P', name: 'pe', example: 'pan', foreignLetter: false },
  { letter: 'Q', name: 'cu', example: 'queso', foreignLetter: false },
  { letter: 'R', name: 'erre', example: 'rosa', foreignLetter: false },
  { letter: 'S', name: 'ese', example: 'sol', foreignLetter: false },
  { letter: 'T', name: 'te', example: 'taza', foreignLetter: false },
  { letter: 'U', name: 'u', example: 'uva', foreignLetter: false },
  { letter: 'V', name: 'uve', example: 'vaso', foreignLetter: false },
  { letter: 'W', name: 'uve doble', example: 'web', foreignLetter: false },
  { letter: 'X', name: 'equis', example: 'xilófono', foreignLetter: false },
  { letter: 'Y', name: 'i griega', example: 'yogur', foreignLetter: false },
  { letter: 'Z', name: 'zeta', example: 'zapato', foreignLetter: false },
];

const ARMENIAN_ARTICLE_GROUPS: Record<ItalianArticleGroup, FoundationArticleGroup> = {
  definite: {
    title: 'Որոշիչ հոդ · THE',
    label: 'THE',
    hint: 'Western Armenian attaches the definite article to the noun: usually -ը after a consonant and -ն after a vowel. Before a form of է, -ն is used.',
    questions: [
      { prompt: 'Complete “The book is new.”', hint: 'Consonant-final noun · definite form', sentence: '___ նոր է։', sentenceTranslation: 'The book is new.', answer: 'Գիրքը', choices: ['Գիրքը', 'Գիրք մը', 'Գիրքին'], explanation: 'Add -ը to a consonant-final noun: գիրք → գիրքը (“the book”).' },
      { prompt: 'Complete “The mother is at home.”', hint: 'Consonant-final noun · definite form', sentence: '___ տունն է։', sentenceTranslation: 'The mother is at home.', answer: 'Մայրը', choices: ['Մայրը', 'Մայր մը', 'Մայրին'], explanation: 'Add -ը to a consonant-final noun: մայր → մայրը (“the mother”).' },
      { prompt: 'Complete “This is the book.”', hint: 'The noun is followed by է', sentence: 'Ասիկա ___ է։', sentenceTranslation: 'This is the book.', answer: 'գիրքն', choices: ['գիրքն', 'գիրքը', 'գիրք մը'], explanation: 'Before է, use the definite ending -ն: Ասիկա գիրքն է։' },
      { prompt: 'Complete “The books are here.”', hint: 'Plural noun · definite form', sentence: '___ հոս են։', sentenceTranslation: 'The books are here.', answer: 'Գիրքերը', choices: ['Գիրքերը', 'Գիրքեր մը', 'Գիրքերն'], explanation: 'Attach the definite suffix to the plural noun: գիրքեր → գիրքերը (“the books”).' },
      { prompt: 'Complete “The child is here.”', hint: 'Vowel-final noun · definite form', sentence: '___ հոս է։', sentenceTranslation: 'The child is here.', answer: 'Երեխան', choices: ['Երեխան', 'Երեխայը', 'Երեխայ մը'], explanation: 'Use -ն after a vowel-final noun: երեխայ → երեխան (“the child”).' },
    ],
  },
  indefinite: {
    title: 'Անորոշ հոդ · A / AN',
    label: 'A / AN',
    hint: 'The Western Armenian indefinite article մը follows the noun. Before է, it often appears as մըն.',
    questions: [
      { prompt: 'Complete “I have a book.”', hint: 'Put մը after the noun', sentence: 'Գիրք ___ ունիմ։', sentenceTranslation: 'I have a book.', answer: 'մը', choices: ['մը', 'ը', 'ն'], explanation: 'The indefinite article follows the noun: գիրք մը (“a book”).' },
      { prompt: 'Complete “There is a house.”', hint: 'Put մը after the noun', sentence: 'Տուն ___ կայ։', sentenceTranslation: 'There is a house.', answer: 'մը', choices: ['մը', 'ը', 'ն'], explanation: 'The indefinite article follows the noun: տուն մը (“a house”).' },
      { prompt: 'Complete “This is a book.”', hint: 'Before է', sentence: 'Ասիկա գիրք ___ է։', sentenceTranslation: 'This is a book.', answer: 'մըն', choices: ['մըն', 'մը', 'ն'], explanation: 'Before է, the indefinite article takes the form մըն: գիրք մըն է.' },
      { prompt: 'Complete “A child is reading.”', hint: 'Put մը after the noun', sentence: 'Երեխայ ___ կը կարդայ։', sentenceTranslation: 'A child is reading.', answer: 'մը', choices: ['մը', 'մըն', 'ը'], explanation: 'The article follows the noun: երեխայ մը (“a child”).' },
      { prompt: 'Complete “A man is waiting.”', hint: 'Put մը after the noun', sentence: 'Մարդ ___ կը սպասէ։', sentenceTranslation: 'A man is waiting.', answer: 'մը', choices: ['մը', 'մըն', 'ն'], explanation: 'The article follows the noun: մարդ մը (“a man”).' },
    ],
  },
  partitive: {
    title: '“Some” · amounts',
    label: 'SOME',
    hint: 'Armenian has no separate partitive article like French. Use a quantity phrase such as քիչ մը (“a little”) or քանի մը (“a few”).',
    questions: [
      { prompt: 'Complete “I would like a little water.”', hint: 'Use քիչ մը for a small amount', sentence: 'Կ’ուզեմ ___։', sentenceTranslation: 'I would like a little water.', answer: 'քիչ մը ջուր', choices: ['քիչ մը ջուր', 'ջուրը', 'ջուր մը'], explanation: 'Քիչ մը ջուր means “a little water.”' },
      { prompt: 'Complete “I bought a few books.”', hint: 'Use քանի մը for several items', sentence: 'Քանի մը գիրք ___։', sentenceTranslation: 'I bought a few books.', answer: 'գնեցի', choices: ['գնեցի', 'գիրքը', 'ջուր մը'], explanation: 'Քանի մը գիրք means “a few books”; գնեցի means “I bought.”' },
      { prompt: 'Complete “She drinks a little milk.”', hint: 'Use քիչ մը for a small amount', sentence: 'Ան քիչ մը կաթ ___։', sentenceTranslation: 'She drinks a little milk.', answer: 'կը խմէ', choices: ['կը խմէ', 'կաթը', 'կաթ մը'], explanation: 'Քիչ մը կաթ means “a little milk”; կը խմէ means “drinks.”' },
      { prompt: 'Complete “There are a few apples.”', hint: 'Use քանի մը for several items', sentence: 'Քանի մը խնձոր ___։', sentenceTranslation: 'There are a few apples.', answer: 'կան', choices: ['կան', 'խնձորը', 'խնձոր մը'], explanation: 'Քանի մը խնձոր means “a few apples”; կան means “there are.”' },
    ],
  },
};

const ARMENIAN_CARDINAL_QUESTIONS: ItalianPracticeQuestion[] = [
  { prompt: 'How do you count 0?', hint: 'zero · 0', answer: 'զերօ', choices: ['զերօ', 'մէկ', 'տասը'], explanation: 'Զերօ means zero.' },
  { prompt: 'How do you count 1?', hint: 'one · 1', answer: 'մէկ', choices: ['մէկ', 'երկու', 'տասը'], explanation: 'Մէկ means one.' },
  { prompt: 'How do you count 2?', hint: 'two · 2', answer: 'երկու', choices: ['երկու', 'երեք', 'քսան'], explanation: 'Երկու means two.' },
  { prompt: 'How do you count 3?', hint: 'three · 3', answer: 'երեք', choices: ['երեք', 'չորս', 'տասներկու'], explanation: 'Երեք means three.' },
  { prompt: 'How do you count 4?', hint: 'four · 4', answer: 'չորս', choices: ['չորս', 'հինգ', 'քառասուն'], explanation: 'Չորս means four.' },
  { prompt: 'How do you count 5?', hint: 'five · 5', answer: 'հինգ', choices: ['հինգ', 'վեց', 'տասնհինգ'], explanation: 'Հինգ means five.' },
  { prompt: 'How do you count 6?', hint: 'six · 6', answer: 'վեց', choices: ['վեց', 'յոթ', 'տասնվեց'], explanation: 'Վեց means six.' },
  { prompt: 'How do you count 7?', hint: 'seven · 7', answer: 'եօթը', choices: ['եօթը', 'ութ', 'եօթանասուն'], explanation: 'Եօթը means seven.' },
  { prompt: 'How do you count 8?', hint: 'eight · 8', answer: 'ութ', choices: ['ութ', 'ինը', 'ութսուն'], explanation: 'Ութ means eight.' },
  { prompt: 'How do you count 9?', hint: 'nine · 9', answer: 'ինը', choices: ['ինը', 'տասը', 'իննսուն'], explanation: 'Ինը means nine.' },
  { prompt: 'How do you count 10?', hint: 'ten · 10', answer: 'տասը', choices: ['տասը', 'մէկ', 'քսան'], explanation: 'Տասը means ten.' },
  { prompt: 'How do you count 11?', hint: 'eleven · 11', answer: 'տասնմէկ', choices: ['տասնմէկ', 'տասներկու', 'մէկ'], explanation: 'Տասնմէկ means eleven.' },
  { prompt: 'How do you count 12?', hint: 'twelve · 12', answer: 'տասներկու', choices: ['տասներկու', 'տասներեք', 'երկու'], explanation: 'Տասներկու means twelve.' },
  { prompt: 'How do you count 13?', hint: 'thirteen · 13', answer: 'տասներեք', choices: ['տասներեք', 'տասնչորս', 'երեք'], explanation: 'Տասներեք means thirteen.' },
  { prompt: 'How do you count 14?', hint: 'fourteen · 14', answer: 'տասնչորս', choices: ['տասնչորս', 'տասնհինգ', 'չորս'], explanation: 'Տասնչորս means fourteen.' },
  { prompt: 'How do you count 15?', hint: 'fifteen · 15', answer: 'տասնհինգ', choices: ['տասնհինգ', 'տասնվեց', 'հինգ'], explanation: 'Տասնհինգ means fifteen.' },
  { prompt: 'How do you say 16?', hint: 'sixteen · 16', answer: 'տասնվեց', choices: ['տասնվեց', 'տասնեօթը', 'վեց'], explanation: 'Տասնվեց means sixteen.' },
  { prompt: 'How do you say 17?', hint: 'seventeen · 17', answer: 'տասնեօթը', choices: ['տասնեօթը', 'տասնութ', 'եօթը'], explanation: 'Տասնեօթը means seventeen.' },
  { prompt: 'How do you say 18?', hint: 'eighteen · 18', answer: 'տասնութ', choices: ['տասնութ', 'տասնինը', 'ութ'], explanation: 'Տասնութ means eighteen.' },
  { prompt: 'How do you say 19?', hint: 'nineteen · 19', answer: 'տասնինը', choices: ['տասնինը', 'քսան', 'ինը'], explanation: 'Տասնինը means nineteen.' },
  { prompt: 'How do you count 20?', hint: 'twenty · 20', answer: 'քսան', choices: ['քսան', 'տասներկու', 'երեսուն'], explanation: 'Քսան means twenty.' },
  { prompt: 'How do you say 21?', hint: 'twenty-one · 21', answer: 'քսանմէկ', choices: ['քսանմէկ', 'երեսունմէկ', 'քսան'], explanation: 'Քսանմէկ means twenty-one.' },
  { prompt: 'How do you say 30?', hint: 'thirty · 30', answer: 'երեսուն', choices: ['երեսուն', 'տասներեք', 'քառասուն'], explanation: 'Երեսուն means thirty.' },
  { prompt: 'How do you say 40?', hint: 'forty · 40', answer: 'քառասուն', choices: ['քառասուն', 'չորս', 'յիսուն'], explanation: 'Քառասուն means forty.' },
  { prompt: 'How do you say 50?', hint: 'fifty · 50', answer: 'յիսուն', choices: ['յիսուն', 'տասնհինգ', 'վաթսուն'], explanation: 'Յիսուն means fifty.' },
  { prompt: 'How do you say 60?', hint: 'sixty · 60', answer: 'վաթսուն', choices: ['վաթսուն', 'վեց', 'եօթանասուն'], explanation: 'Վաթսուն means sixty.' },
  { prompt: 'How do you say 70?', hint: 'seventy · 70', answer: 'եօթանասուն', choices: ['եօթանասուն', 'ութսուն', 'յիսուն'], explanation: 'Եօթանասուն means seventy.' },
  { prompt: 'How do you say 80?', hint: 'eighty · 80', answer: 'ութսուն', choices: ['ութսուն', 'ութ', 'իննսուն'], explanation: 'Ութսուն means eighty.' },
  { prompt: 'How do you say 90?', hint: 'ninety · 90', answer: 'իննսուն', choices: ['իննսուն', 'ինը', 'հարիւր'], explanation: 'Իննսուն means ninety.' },
  { prompt: 'How do you say 100?', hint: 'one hundred · 100', answer: 'հարիւր', choices: ['հարիւր', 'հազար', 'տասը'], explanation: 'Հարիւր means one hundred.' },
  { prompt: 'How do you say 1,000?', hint: 'one thousand · 1,000', answer: 'հազար', choices: ['հազար', 'հարիւր', 'միլիոն'], explanation: 'Հազար means one thousand.' },
];

const ARMENIAN_ORDINAL_QUESTIONS: ItalianPracticeQuestion[] = [
  { prompt: 'How do you say “first”?', hint: '1st · առաջին օրը', example: 'առաջին օրը', answer: 'առաջին', choices: ['առաջին', 'երկրորդ', 'երրորդ'], explanation: 'Առաջին means first.' },
  { prompt: 'How do you say “second”?', hint: '2nd · երկրորդ օրը', example: 'երկրորդ օրը', answer: 'երկրորդ', choices: ['երկրորդ', 'երրորդ', 'չորրորդ'], explanation: 'Երկրորդ means second.' },
  { prompt: 'How do you say “third”?', hint: '3rd · երրորդ օրը', example: 'երրորդ օրը', answer: 'երրորդ', choices: ['երրորդ', 'առաջին', 'հինգերորդ'], explanation: 'Երրորդ means third.' },
  { prompt: 'How do you say “fourth”?', hint: '4th · չորրորդ օրը', example: 'չորրորդ օրը', answer: 'չորրորդ', choices: ['չորրորդ', 'երկրորդ', 'վեցերորդ'], explanation: 'Չորրորդ means fourth.' },
  { prompt: 'How do you say “fifth”?', hint: '5th · հինգերորդ օրը', example: 'հինգերորդ օրը', answer: 'հինգերորդ', choices: ['հինգերորդ', 'չորրորդ', 'յոթերորդ'], explanation: 'Հինգերորդ means fifth.' },
  { prompt: 'How do you say “sixth”?', hint: '6th · վեցերորդ օրը', example: 'վեցերորդ օրը', answer: 'վեցերորդ', choices: ['վեցերորդ', 'հինգերորդ', 'ութերորդ'], explanation: 'Վեցերորդ means sixth.' },
  { prompt: 'How do you say “seventh”?', hint: '7th · եօթերորդ օրը', example: 'եօթերորդ օրը', answer: 'եօթերորդ', choices: ['եօթերորդ', 'վեցերորդ', 'իններորդ'], explanation: 'Եօթերորդ means seventh.' },
  { prompt: 'How do you say “eighth”?', hint: '8th · ութերորդ օրը', example: 'ութերորդ օրը', answer: 'ութերորդ', choices: ['ութերորդ', 'եօթերորդ', 'տասներորդ'], explanation: 'Ութերորդ means eighth.' },
  { prompt: 'How do you say “ninth”?', hint: '9th · իններորդ օրը', example: 'իններորդ օրը', answer: 'իններորդ', choices: ['իններորդ', 'ութերորդ', 'հինգերորդ'], explanation: 'Իններորդ means ninth.' },
  { prompt: 'How do you say “tenth”?', hint: '10th · տասներորդ օրը', example: 'տասներորդ օրը', answer: 'տասներորդ', choices: ['տասներորդ', 'իններորդ', 'առաջին'], explanation: 'Տասներորդ means tenth.' },
];

const ARMENIAN_ALPHABET: readonly FoundationLetter[] = [
  { letter: 'Ա', name: 'այբ', example: 'անուն', foreignLetter: false },
  { letter: 'Բ', name: 'բեն', example: 'բարի', foreignLetter: false },
  { letter: 'Գ', name: 'գիմ', example: 'գինի', foreignLetter: false },
  { letter: 'Դ', name: 'դա', example: 'դուռ', foreignLetter: false },
  { letter: 'Ե', name: 'եչ', example: 'երեկ', foreignLetter: false },
  { letter: 'Զ', name: 'զա', example: 'զանգ', foreignLetter: false },
  { letter: 'Է', name: 'է', example: 'էջ', foreignLetter: false },
  { letter: 'Ը', name: 'ըթ', example: 'ընկեր', foreignLetter: false },
  { letter: 'Թ', name: 'թո', example: 'թագ', foreignLetter: false },
  { letter: 'Ժ', name: 'ժէ', example: 'ժամ', foreignLetter: false },
  { letter: 'Ի', name: 'ինի', example: 'ինծի', foreignLetter: false },
  { letter: 'Լ', name: 'լիւն', example: 'լուսին', foreignLetter: false },
  { letter: 'Խ', name: 'խէ', example: 'խնձոր', foreignLetter: false },
  { letter: 'Ծ', name: 'ծա', example: 'ծառ', foreignLetter: false },
  { letter: 'Կ', name: 'կեն', example: 'կատու', foreignLetter: false },
  { letter: 'Հ', name: 'հո', example: 'հաւատք', foreignLetter: false },
  { letter: 'Ձ', name: 'ձա', example: 'ձուկ', foreignLetter: false },
  { letter: 'Ղ', name: 'ղատ', example: 'ղեկավար', foreignLetter: false },
  { letter: 'Ճ', name: 'ճէ', example: 'ճամբայ', foreignLetter: false },
  { letter: 'Մ', name: 'մեն', example: 'մայր', foreignLetter: false },
  { letter: 'Յ', name: 'յի', example: 'յոյս', foreignLetter: false },
  { letter: 'Ն', name: 'նու', example: 'նուռ', foreignLetter: false },
  { letter: 'Շ', name: 'շա', example: 'շուն', foreignLetter: false },
  { letter: 'Ո', name: 'ո', example: 'որդի', foreignLetter: false },
  { letter: 'Չ', name: 'չա', example: 'չորս', foreignLetter: false },
  { letter: 'Պ', name: 'պէ', example: 'պատկեր', foreignLetter: false },
  { letter: 'Ջ', name: 'ջէ', example: 'ջուր', foreignLetter: false },
  { letter: 'Ռ', name: 'ռա', example: 'ռադիօ', foreignLetter: false },
  { letter: 'Ս', name: 'սէ', example: 'սիրել', foreignLetter: false },
  { letter: 'Վ', name: 'վեւ', example: 'վարդ', foreignLetter: false },
  { letter: 'Տ', name: 'տիւն', example: 'տուն', foreignLetter: false },
  { letter: 'Ր', name: 'րէ', example: 'րոպէ', foreignLetter: false },
  { letter: 'Ց', name: 'ցո', example: 'ցուրտ', foreignLetter: false },
  { letter: 'Ւ', name: 'հիւն', example: 'հիւսիս', foreignLetter: false },
  { letter: 'Փ', name: 'փիւր', example: 'փողոց', foreignLetter: false },
  { letter: 'Ք', name: 'քէ', example: 'քոյր', foreignLetter: false },
  { letter: 'Օ', name: 'օ', example: 'օր', foreignLetter: false },
  { letter: 'Ֆ', name: 'ֆէ', example: 'ֆիլմ', foreignLetter: false },
];

const italianAlphabetHint = 'Italian’s core alphabet has 21 letters. J, K, W, X, and Y are mainly used in borrowed words.';

export const LANGUAGE_FOUNDATIONS: Record<Language, LanguageFoundationContent> = {
  italian: {
    languageName: 'Italian',
    articleGroups: ARTICLE_GROUPS,
    cardinalQuestions: CARDINAL_QUESTIONS,
    ordinalQuestions: ORDINAL_QUESTIONS,
    prepositionQuestions: PREPOSITION_QUESTIONS.italian,
    prepositionHint: PREPOSITION_HINTS.italian,
    prepositionArticleQuestions: PREPOSITION_ARTICLE_QUESTIONS.italian,
    prepositionArticleHint: PREPOSITION_ARTICLE_HINTS.italian,
    alphabet: ITALIAN_ALPHABET,
    alphabetTitle: '21 core letters · 5 extra',
    alphabetHint: italianAlphabetHint,
    cardinalHint: 'Cardinal numbers tell how many: uno, due, tre…',
    ordinalHint: 'Ordinal numbers show order and agree with the noun: primo giorno, prima volta.',
    tenseTimes: { Present: 'Oggi · today', Past: 'Ieri · yesterday', Future: 'Domani · tomorrow' },
    pastNote: 'Many past-tense drills use passato prossimo: avere or essere + a past participle. With essere, the participle agrees with the subject.',
  },
  french: {
    languageName: 'French',
    articleGroups: FRENCH_ARTICLE_GROUPS,
    cardinalQuestions: FRENCH_CARDINAL_QUESTIONS,
    ordinalQuestions: FRENCH_ORDINAL_QUESTIONS,
    prepositionQuestions: PREPOSITION_QUESTIONS.french,
    prepositionHint: PREPOSITION_HINTS.french,
    prepositionArticleQuestions: PREPOSITION_ARTICLE_QUESTIONS.french,
    prepositionArticleHint: PREPOSITION_ARTICLE_HINTS.french,
    alphabet: FRENCH_ALPHABET,
    alphabetTitle: '26 letters',
    alphabetHint: 'The French alphabet has 26 letters. Accent marks such as é and ç do not add letters; letter names can sound different from sounds in words.',
    cardinalHint: 'Cardinal numbers tell how many: un, deux, trois…',
    ordinalHint: 'Ordinal numbers show order: premier jour, première fois. Most forms end in -ième.',
    tenseTimes: { Present: "Aujourd’hui · today", Past: 'Hier · yesterday', Future: 'Demain · tomorrow' },
    pastNote: 'The passé composé uses avoir or être plus a past participle. With être, the participle often agrees with the subject.',
  },
  spanish: {
    languageName: 'Spanish',
    articleGroups: SPANISH_ARTICLE_GROUPS,
    cardinalQuestions: SPANISH_CARDINAL_QUESTIONS,
    ordinalQuestions: SPANISH_ORDINAL_QUESTIONS,
    prepositionQuestions: PREPOSITION_QUESTIONS.spanish,
    prepositionHint: PREPOSITION_HINTS.spanish,
    prepositionArticleQuestions: PREPOSITION_ARTICLE_QUESTIONS.spanish,
    prepositionArticleHint: PREPOSITION_ARTICLE_HINTS.spanish,
    alphabet: SPANISH_ALPHABET,
    alphabetTitle: '27 letters · including Ñ',
    alphabetHint: 'The Spanish alphabet has 27 letters, including Ñ. Accent marks do not add letters; CH and LL are letter combinations, not separate letters.',
    cardinalHint: 'Cardinal numbers tell how many: uno, dos, tres…',
    ordinalHint: 'Ordinal numbers show order and agree with the noun: primer día, primera vez.',
    tenseTimes: { Present: 'Hoy · today', Past: 'Ayer · yesterday', Future: 'Mañana · tomorrow' },
    pastNote: 'These completed past actions use the preterite (pretérito): comí, hablé. The imperfect is another past tense used for habits and background.',
  },
  armenian: {
    languageName: 'Western Armenian',
    articleGroups: ARMENIAN_ARTICLE_GROUPS,
    cardinalQuestions: ARMENIAN_CARDINAL_QUESTIONS,
    ordinalQuestions: ARMENIAN_ORDINAL_QUESTIONS,
    prepositionQuestions: PREPOSITION_QUESTIONS.armenian,
    prepositionHint: PREPOSITION_HINTS.armenian,
    prepositionArticleQuestions: PREPOSITION_ARTICLE_QUESTIONS.armenian,
    prepositionArticleHint: PREPOSITION_ARTICLE_HINTS.armenian,
    alphabet: ARMENIAN_ALPHABET,
    alphabetTitle: '38 letters · traditional orthography',
    alphabetHint: 'Western Armenian uses the traditional 38-letter alphabet. The Latin readings are English-friendly approximations; և is a common “and” ligature, not an extra letter.',
    cardinalHint: 'Cardinal numbers tell how many: մէկ, երկու, երեք…',
    ordinalHint: 'Ordinal numbers show order: առաջին, երկրորդ, երրորդ…',
    tenseTimes: { Present: 'Այսօր · today', Past: 'Երէկ · yesterday', Future: 'Վաղը · tomorrow' },
    pastNote: 'These past drills use completed-action forms. Western Armenian often forms the future with պիտի plus a present subjunctive form.',
  },
};
