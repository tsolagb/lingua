export type ItalianArticleGroup = 'definite' | 'indefinite' | 'partitive';
export type ItalianNumberGroup = 'cardinal' | 'ordinal';

export type ItalianPracticeQuestion = {
  prompt: string;
  hint: string;
  answer: string;
  choices: string[];
  explanation: string;
  sentence?: string;
  sentenceTranslation?: string;
  example?: string;
};

const GLI_RULE_EXPLANATION =
  'For masculine plurals, use gli before a vowel or z, gn, ps/pn, x, y, or s + a consonant (for example: gli amici, gli zaini, gli gnocchi, gli psicologi, gli pneumatici, gli xilofoni, gli yogurt, gli studenti). Use i before most other consonants, as in i libri.';

export const ARTICLE_GROUPS: Record<ItalianArticleGroup, {
  title: string;
  label: string;
  hint: string;
  questions: ItalianPracticeQuestion[];
}> = {
  definite: {
    title: 'Articoli determinativi',
    label: 'THE',
    hint: 'For a specific person or thing: il, lo, la, l’ in the singular; i, gli, le in the plural.',
    questions: [
      { prompt: '“the book”', hint: 'Masculine · singular · most consonants', sentence: '___ libro è nuovo.', sentenceTranslation: 'The book is new.', answer: 'il', choices: ['il', 'lo', 'la'], explanation: 'Libro is masculine singular and starts with an ordinary consonant, so use il.' },
      { prompt: '“the student”', hint: 'Masculine · singular · s + consonant', sentence: '___ studente studia.', sentenceTranslation: 'The student is studying.', answer: 'lo', choices: ['il', 'lo', "l’"], explanation: 'Use lo before masculine singular nouns beginning with s + consonant.' },
      { prompt: '“the house”', hint: 'Feminine · singular', sentence: '___ casa è grande.', sentenceTranslation: 'The house is big.', answer: 'la', choices: ['la', 'il', "l’"], explanation: 'Casa is feminine singular and begins with a consonant, so use la.' },
      { prompt: '“the friend” (male)', hint: 'Masculine · singular · vowel', sentence: '___ amico arriva.', sentenceTranslation: 'The friend is arriving.', answer: "l’", choices: ['il', 'lo', "l’"], explanation: 'Use l’ before a masculine singular noun starting with a vowel. It is written without a space.' },
      { prompt: '“the friend” (female)', hint: 'Feminine · singular · vowel', sentence: '___ amica arriva.', sentenceTranslation: 'The friend is arriving.', answer: "l’", choices: ['la', "l’", 'una'], explanation: 'Use l’ before a feminine singular noun starting with a vowel.' },
      { prompt: '“the backpack”', hint: 'Masculine · singular · z', sentence: '___ zaino è pesante.', sentenceTranslation: 'The backpack is heavy.', answer: 'lo', choices: ['il', 'lo', 'l’'], explanation: 'Use lo before a masculine singular noun beginning with z.' },
      { prompt: '“the books”', hint: 'Masculine · plural · most consonants', sentence: '___ libri sono nuovi.', sentenceTranslation: 'The books are new.', answer: 'i', choices: ['i', 'gli', 'le'], explanation: 'Use i for masculine plural nouns beginning with most consonants.' },
      { prompt: '“the students”', hint: 'Masculine · plural · s + consonant', sentence: '___ studenti studiano.', sentenceTranslation: 'The students are studying.', answer: 'gli', choices: ['i', 'gli', 'le'], explanation: GLI_RULE_EXPLANATION },
      { prompt: '“the schools”', hint: 'Feminine · plural', sentence: '___ scuole sono aperte.', sentenceTranslation: 'The schools are open.', answer: 'le', choices: ['i', 'gli', 'le'], explanation: 'Use le for feminine plural nouns.' },
      { prompt: '“the backpacks”', hint: 'Masculine · plural · z', sentence: '___ zaini sono pesanti.', sentenceTranslation: 'The backpacks are heavy.', answer: 'gli', choices: ['i', 'gli', 'le'], explanation: GLI_RULE_EXPLANATION },
      { prompt: '“the friends” (male or mixed group)', hint: 'Masculine · plural · vowel', sentence: '___ amici sono qui.', sentenceTranslation: 'The friends are here.', answer: 'gli', choices: ['i', 'gli', 'le'], explanation: GLI_RULE_EXPLANATION },
      { prompt: '“the girls”', hint: 'Feminine · plural', sentence: '___ ragazze giocano.', sentenceTranslation: 'The girls are playing.', answer: 'le', choices: ['i', 'gli', 'le'], explanation: 'Ragazze is feminine plural, so use le.' },
    ],
  },
  indefinite: {
    title: 'Articoli indeterminativi',
    label: 'A / AN',
    hint: 'For one non-specific thing: un, uno, una, un’. Italian indefinite articles are singular.',
    questions: [
      { prompt: '“a book”', hint: 'Masculine · singular · most consonants', sentence: 'Ho comprato ___ libro.', sentenceTranslation: 'I bought a book.', answer: 'un', choices: ['un', 'uno', 'una'], explanation: 'Use un before a masculine singular noun starting with most consonants.' },
      { prompt: '“a student”', hint: 'Masculine · singular · s + consonant', sentence: 'Cerco ___ studente.', sentenceTranslation: 'I am looking for a student.', answer: 'uno', choices: ['un', 'uno', 'una'], explanation: 'Use uno before a masculine singular noun beginning with s + consonant.' },
      { prompt: '“a house”', hint: 'Feminine · singular', sentence: 'È ___ casa nuova.', sentenceTranslation: 'It is a new house.', answer: 'una', choices: ['un', 'una', "un’"], explanation: 'Use una before a feminine singular noun starting with a consonant.' },
      { prompt: '“a friend” (male)', hint: 'Masculine · singular · vowel', sentence: 'Luca è ___ amico.', sentenceTranslation: 'Luca is a friend.', answer: 'un', choices: ['un', "un’", 'uno'], explanation: 'Use un before a masculine singular noun starting with a vowel, without an apostrophe.' },
      { prompt: '“a friend” (female)', hint: 'Feminine · singular · vowel', sentence: 'Sara è ___ amica.', sentenceTranslation: 'Sara is a friend.', answer: "un’", choices: ['una', "un’", 'un'], explanation: 'Use un’ before a feminine singular noun starting with a vowel.' },
      { prompt: '“a backpack”', hint: 'Masculine · singular · z', sentence: 'Ho ___ zaino blu.', sentenceTranslation: 'I have a blue backpack.', answer: 'uno', choices: ['un', 'uno', 'una'], explanation: 'Use uno before a masculine singular noun beginning with z.' },
      { prompt: '“an idea”', hint: 'Feminine · singular · vowel', sentence: 'Ho ___ idea.', sentenceTranslation: 'I have an idea.', answer: "un’", choices: ['un', "un’", 'una'], explanation: 'Idea is feminine and starts with a vowel, so use un’.' },
      { prompt: '“a school”', hint: 'Feminine · singular', sentence: 'Visito ___ scuola.', sentenceTranslation: 'I visit a school.', answer: 'una', choices: ['uno', 'un', 'una'], explanation: 'Scuola is feminine singular, so use una.' },
    ],
  },
  partitive: {
    title: 'Articoli partitivi',
    label: 'SOME',
    hint: 'For plural “some,” use dei, degli, delle. Singular partitives include del, dello, della, dell’.',
    questions: [
      { prompt: '“some cookies”', hint: 'Masculine · plural', sentence: 'Vorrei ___ biscotti.', sentenceTranslation: 'I would like some cookies.', answer: 'dei', choices: ['dei', 'degli', 'delle'], explanation: 'Use dei for masculine plural nouns beginning with most consonants.' },
      { prompt: '“some students”', hint: 'Masculine · plural · s + consonant', sentence: 'Vedo ___ studenti.', sentenceTranslation: 'I see some students.', answer: 'degli', choices: ['dei', 'degli', 'delle'], explanation: 'Use degli before masculine plural nouns beginning with s + consonant.' },
      { prompt: '“some apples”', hint: 'Feminine · plural', sentence: 'Compro ___ mele.', sentenceTranslation: 'I am buying some apples.', answer: 'delle', choices: ['dei', 'degli', 'delle'], explanation: 'Use delle for feminine plural nouns.' },
      { prompt: '“some friends” (male or mixed group)', hint: 'Masculine · plural · vowel', sentence: 'Invito ___ amici.', sentenceTranslation: 'I invite some friends.', answer: 'degli', choices: ['dei', 'degli', 'delle'], explanation: 'Use degli before masculine plural nouns beginning with a vowel.' },
      { prompt: '“some girls”', hint: 'Feminine · plural', sentence: 'Ci sono ___ ragazze.', sentenceTranslation: 'There are some girls.', answer: 'delle', choices: ['dei', 'degli', 'delle'], explanation: 'Ragazze is feminine plural, so use delle.' },
      { prompt: '“some backpacks”', hint: 'Masculine · plural · z', sentence: 'Compro ___ zaini.', sentenceTranslation: 'I buy some backpacks.', answer: 'degli', choices: ['dei', 'degli', 'delle'], explanation: 'Use degli before masculine plural nouns beginning with z.' },
      { prompt: '“some bread”', hint: 'Singular · masculine · most consonants', sentence: 'Mangio ___ pane.', sentenceTranslation: 'I eat some bread.', answer: 'del', choices: ['del', 'dello', 'della'], explanation: 'Del is a singular partitive. The plural “some breads” would use dei.' },
      { prompt: '“some sugar”', hint: 'Singular · masculine · z', sentence: 'Aggiungo ___ zucchero.', sentenceTranslation: 'I add some sugar.', answer: 'dello', choices: ['del', 'dello', 'della'], explanation: 'Use dello before a masculine singular noun beginning with z.' },
      { prompt: '“some water”', hint: 'Singular · feminine · vowel', sentence: 'Bevo ___ acqua.', sentenceTranslation: 'I drink some water.', answer: "dell’", choices: ['della', "dell’", 'delle'], explanation: 'Use dell’ before this feminine singular noun beginning with a vowel.' },
    ],
  },
};

export const CARDINAL_QUESTIONS: ItalianPracticeQuestion[] = [
  { prompt: 'How do you count 0?', hint: 'zero · zero', example: 'zero', answer: 'zero', choices: ['zero', 'uno', 'dieci'], explanation: 'Zero means zero.' },
  { prompt: 'How do you count 1?', hint: 'one · one', example: 'uno', answer: 'uno', choices: ['uno', 'un', 'due'], explanation: 'The number by itself is uno. Before a masculine noun, it usually becomes un: un libro.' },
  { prompt: 'How do you count 2?', hint: 'two · two', example: 'due', answer: 'due', choices: ['due', 'dieci', 'duo'], explanation: 'Due means two.' },
  { prompt: 'How do you count 3?', hint: 'three · three', example: 'tre', answer: 'tre', choices: ['tre', 'sei', 'trenta'], explanation: 'Tre means three. At the end of a compound number it takes an accent: ventitré.' },
  { prompt: 'How do you count 4?', hint: 'four · four', example: 'quattro', answer: 'quattro', choices: ['quattro', 'otto', 'sei'], explanation: 'Quattro means four.' },
  { prompt: 'How do you count 5?', hint: 'five · five', example: 'cinque', answer: 'cinque', choices: ['cinque', 'sette', 'nove'], explanation: 'Cinque means five.' },
  { prompt: 'How do you count 6?', hint: 'six · six', example: 'sei', answer: 'sei', choices: ['sei', 'cinque', 'dieci'], explanation: 'Sei means six.' },
  { prompt: 'How do you count 7?', hint: 'seven · seven', example: 'sette', answer: 'sette', choices: ['sette', 'cinque', 'quattordici'], explanation: 'Sette means seven.' },
  { prompt: 'How do you count 8?', hint: 'eight · eight', example: 'otto', answer: 'otto', choices: ['otto', 'sei', 'dieci'], explanation: 'Otto means eight.' },
  { prompt: 'How do you count 9?', hint: 'nine · nine', example: 'nove', answer: 'nove', choices: ['nove', 'otto', 'sette'], explanation: 'Nove means nine.' },
  { prompt: 'How do you count 10?', hint: 'ten · ten', example: 'dieci', answer: 'dieci', choices: ['dieci', 'dodici', 'venti'], explanation: 'Dieci means ten.' },
  { prompt: 'How do you count 11?', hint: 'eleven · eleven', example: 'undici', answer: 'undici', choices: ['undici', 'dodici', 'ventuno'], explanation: 'Undici means eleven.' },
  { prompt: 'How do you count 12?', hint: 'twelve · twelve', example: 'dodici', answer: 'dodici', choices: ['dodici', 'tredici', 'undici'], explanation: 'Dodici means twelve.' },
  { prompt: 'How do you count 13?', hint: 'thirteen · thirteen', example: 'tredici', answer: 'tredici', choices: ['tredici', 'quattordici', 'trenta'], explanation: 'Tredici means thirteen.' },
  { prompt: 'How do you count 14?', hint: 'fourteen · fourteen', example: 'quattordici', answer: 'quattordici', choices: ['quattordici', 'quattro', 'diciotto'], explanation: 'Quattordici means fourteen.' },
  { prompt: 'How do you count 15?', hint: 'fifteen · fifteen', example: 'quindici', answer: 'quindici', choices: ['quindici', 'quattordici', 'venti'], explanation: 'Quindici means fifteen.' },
  { prompt: 'How do you count 16?', hint: 'sixteen · sixteen', example: 'sedici', answer: 'sedici', choices: ['sedici', 'sei', 'ventisei'], explanation: 'Sedici means sixteen.' },
  { prompt: 'How do you count 17?', hint: 'seventeen · seventeen', example: 'diciassette', answer: 'diciassette', choices: ['diciassette', 'diciotto', 'settanta'], explanation: 'Diciassette means seventeen.' },
  { prompt: 'How do you count 18?', hint: 'eighteen · eighteen', example: 'diciotto', answer: 'diciotto', choices: ['diciotto', 'diciassette', 'otto'], explanation: 'Diciotto means eighteen.' },
  { prompt: 'How do you count 19?', hint: 'nineteen · nineteen', example: 'diciannove', answer: 'diciannove', choices: ['diciannove', 'venti', 'novanta'], explanation: 'Diciannove means nineteen.' },
  { prompt: 'How do you count 20?', hint: 'twenty · twenty', example: 'venti', answer: 'venti', choices: ['venti', 'dodici', 'trenta'], explanation: 'Venti means twenty.' },
  { prompt: 'How do you say 21?', hint: 'twenty-one · 21', example: 'ventuno', answer: 'ventuno', choices: ['ventuno', 'ventitré', 'ventotto'], explanation: 'Ventuno means twenty-one.' },
  { prompt: 'How do you say 23?', hint: 'twenty-three · 23', example: 'ventitré', answer: 'ventitré', choices: ['ventitré', 'ventuno', 'ventotto'], explanation: 'Ventitré ends in stressed é, so it is written with an accent.' },
  { prompt: 'How do you say 28?', hint: 'twenty-eight · 28', example: 'ventotto', answer: 'ventotto', choices: ['ventotto', 'ventuno', 'trentotto'], explanation: 'Ventotto means twenty-eight; the final vowel of venti drops before otto.' },
  { prompt: 'How do you say 30?', hint: 'thirty · 30', example: 'trenta', answer: 'trenta', choices: ['trenta', 'tre', 'trecento'], explanation: 'Trenta means thirty.' },
  { prompt: 'How do you say 40?', hint: 'forty · 40', example: 'quaranta', answer: 'quaranta', choices: ['quaranta', 'quattordici', 'sessanta'], explanation: 'Quaranta means forty.' },
  { prompt: 'How do you say 50?', hint: 'fifty · 50', example: 'cinquanta', answer: 'cinquanta', choices: ['cinquanta', 'quindici', 'cinquecento'], explanation: 'Cinquanta means fifty.' },
  { prompt: 'How do you say 60?', hint: 'sixty · 60', example: 'sessanta', answer: 'sessanta', choices: ['sessanta', 'sedici', 'settanta'], explanation: 'Sessanta means sixty.' },
  { prompt: 'How do you say 70?', hint: 'seventy · 70', example: 'settanta', answer: 'settanta', choices: ['settanta', 'diciassette', 'sessanta'], explanation: 'Settanta means seventy.' },
  { prompt: 'How do you say 80?', hint: 'eighty · 80', example: 'ottanta', answer: 'ottanta', choices: ['ottanta', 'otto', 'novanta'], explanation: 'Ottanta means eighty.' },
  { prompt: 'How do you say 90?', hint: 'ninety · 90', example: 'novanta', answer: 'novanta', choices: ['novanta', 'diciannove', 'ottanta'], explanation: 'Novanta means ninety.' },
  { prompt: 'How do you say 100?', hint: 'one hundred · 100', example: 'cento', answer: 'cento', choices: ['cento', 'centomila', 'dieci'], explanation: 'Cento means one hundred.' },
  { prompt: 'How do you say 1,000?', hint: 'one thousand · 1,000', example: 'mille', answer: 'mille', choices: ['mille', 'milione', 'cento'], explanation: 'Mille means one thousand.' },
];

export const ORDINAL_QUESTIONS: ItalianPracticeQuestion[] = [
  { prompt: '“first” · masculine', hint: '1st · “the first day”', example: 'il primo giorno', answer: 'primo', choices: ['primo', 'prima', 'secondo'], explanation: 'Primo is the masculine form of first: il primo giorno.' },
  { prompt: '“first” · feminine', hint: '1st · “the first time”', example: 'la prima volta', answer: 'prima', choices: ['primo', 'prima', 'terza'], explanation: 'Prima is the feminine form of first: la prima volta.' },
  { prompt: '“second” · masculine', hint: '2nd · “the second floor”', example: 'il secondo piano', answer: 'secondo', choices: ['seconda', 'secondo', 'terzo'], explanation: 'Secondo is the masculine form of second.' },
  { prompt: '“second” · feminine', hint: '2nd · “the second question”', example: 'la seconda domanda', answer: 'seconda', choices: ['secondo', 'seconda', 'quarta'], explanation: 'Seconda is the feminine form of second.' },
  { prompt: '“third” · masculine', hint: '3rd · “the third book”', example: 'il terzo libro', answer: 'terzo', choices: ['terza', 'terzo', 'quarto'], explanation: 'Terzo is the masculine form of third.' },
  { prompt: '“third” · feminine', hint: '3rd · “the third street”', example: 'la terza strada', answer: 'terza', choices: ['terzo', 'terza', 'quinta'], explanation: 'Terza is the feminine form of third.' },
  { prompt: '“fourth” · masculine', hint: '4th · “the fourth month”', example: 'il quarto mese', answer: 'quarto', choices: ['quarto', 'quarta', 'quinto'], explanation: 'Quarto is the masculine form of fourth.' },
  { prompt: '“fourth” · feminine', hint: '4th · “the fourth page”', example: 'la quarta pagina', answer: 'quarta', choices: ['quarto', 'quarta', 'sesta'], explanation: 'Quarta is the feminine form of fourth.' },
  { prompt: '“fifth” · masculine', hint: '5th · “the fifth day”', example: 'il quinto giorno', answer: 'quinto', choices: ['quinta', 'quinto', 'sesto'], explanation: 'Quinto is the masculine form of fifth.' },
  { prompt: '“fifth” · feminine', hint: '5th · “the fifth lesson”', example: 'la quinta lezione', answer: 'quinta', choices: ['quinto', 'quinta', 'settima'], explanation: 'Quinta is the feminine form of fifth.' },
  { prompt: '“sixth” · masculine', hint: '6th · “the sixth student”', example: 'il sesto studente', answer: 'sesto', choices: ['sesta', 'sesto', 'settimo'], explanation: 'Sesto is the masculine form of sixth.' },
  { prompt: '“sixth” · feminine', hint: '6th · “the sixth page”', example: 'la sesta pagina', answer: 'sesta', choices: ['sesto', 'sesta', 'ottava'], explanation: 'Sesta is the feminine form of sixth.' },
  { prompt: '“seventh” · masculine', hint: '7th · “the seventh day”', example: 'il settimo giorno', answer: 'settimo', choices: ['settima', 'settimo', 'ottavo'], explanation: 'Settimo is the masculine form of seventh.' },
  { prompt: '“seventh” · feminine', hint: '7th · “the seventh week”', example: 'la settima settimana', answer: 'settima', choices: ['settimo', 'settima', 'nona'], explanation: 'Settima is the feminine form of seventh.' },
  { prompt: '“eighth” · masculine', hint: '8th · “the eighth floor”', example: 'l’ottavo piano', answer: 'ottavo', choices: ['ottava', 'ottavo', 'nono'], explanation: 'Ottavo is the masculine form of eighth.' },
  { prompt: '“eighth” · feminine', hint: '8th · “the eighth time”', example: 'l’ottava volta', answer: 'ottava', choices: ['ottavo', 'ottava', 'decima'], explanation: 'Ottava is the feminine form of eighth.' },
  { prompt: '“ninth” · masculine', hint: '9th · “the ninth month”', example: 'il nono mese', answer: 'nono', choices: ['nona', 'nono', 'decimo'], explanation: 'Nono is the masculine form of ninth.' },
  { prompt: '“ninth” · feminine', hint: '9th · “the ninth hour”', example: 'la nona ora', answer: 'nona', choices: ['nono', 'nona', 'prima'], explanation: 'Nona is the feminine form of ninth.' },
  { prompt: '“tenth” · masculine', hint: '10th · “the tenth day”', example: 'il decimo giorno', answer: 'decimo', choices: ['decima', 'decimo', 'nono'], explanation: 'Decimo is the masculine form of tenth.' },
  { prompt: '“tenth” · feminine', hint: '10th · “the tenth question”', example: 'la decima domanda', answer: 'decima', choices: ['decimo', 'decima', 'seconda'], explanation: 'Decima is the feminine form of tenth.' },
];

export const ITALIAN_ALPHABET = [
  { letter: 'A', name: 'a', example: 'amico', foreignLetter: false },
  { letter: 'B', name: 'bi', example: 'bene', foreignLetter: false },
  { letter: 'C', name: 'ci', example: 'casa', foreignLetter: false },
  { letter: 'D', name: 'di', example: 'dado', foreignLetter: false },
  { letter: 'E', name: 'e', example: 'estate', foreignLetter: false },
  { letter: 'F', name: 'effe', example: 'fiore', foreignLetter: false },
  { letter: 'G', name: 'gi', example: 'gatto', foreignLetter: false },
  { letter: 'H', name: 'acca', example: 'hotel', foreignLetter: false },
  { letter: 'I', name: 'i', example: 'isola', foreignLetter: false },
  { letter: 'J', name: 'i lunga', example: 'jazz', foreignLetter: true },
  { letter: 'K', name: 'cappa', example: 'kiwi', foreignLetter: true },
  { letter: 'L', name: 'elle', example: 'luna', foreignLetter: false },
  { letter: 'M', name: 'emme', example: 'mela', foreignLetter: false },
  { letter: 'N', name: 'enne', example: 'neve', foreignLetter: false },
  { letter: 'O', name: 'o', example: 'orso', foreignLetter: false },
  { letter: 'P', name: 'pi', example: 'pane', foreignLetter: false },
  { letter: 'Q', name: 'cu', example: 'quadro', foreignLetter: false },
  { letter: 'R', name: 'erre', example: 'rosa', foreignLetter: false },
  { letter: 'S', name: 'esse', example: 'sole', foreignLetter: false },
  { letter: 'T', name: 'ti', example: 'tavolo', foreignLetter: false },
  { letter: 'U', name: 'u', example: 'uva', foreignLetter: false },
  { letter: 'V', name: 'vu', example: 'vaso', foreignLetter: false },
  { letter: 'W', name: 'doppia vu', example: 'web', foreignLetter: true },
  { letter: 'X', name: 'ics', example: 'xilofono', foreignLetter: true },
  { letter: 'Y', name: 'ipsilon', example: 'yogurt', foreignLetter: true },
  { letter: 'Z', name: 'zeta', example: 'zaino', foreignLetter: false },
] as const;

export const ITALIAN_ALPHABET_QUESTIONS: ItalianPracticeQuestion[] = ITALIAN_ALPHABET.map((entry, index) => {
  const next = ITALIAN_ALPHABET[(index + 1) % ITALIAN_ALPHABET.length];
  const later = ITALIAN_ALPHABET[(index + 7) % ITALIAN_ALPHABET.length];
  return {
    prompt: `Which letter is called “${entry.name}” in Italian?`,
    hint: entry.foreignLetter ? 'This letter is mostly used in borrowed words.' : 'Part of the 21-letter Italian alphabet.',
    answer: entry.letter,
    choices: [entry.letter, next.letter, later.letter],
    example: entry.example,
    explanation: `${entry.letter} is called “${entry.name}” in Italian. For example: ${entry.example}.`,
  };
});
