import { CATEGORIES, type Language } from '@/data/vocabulary';
import { VERB_LESSONS, VERB_PERSONS, type VerbPattern } from '@/data/verb-guide';

export type VerbTenseId =
  | 'present'
  | 'passato-prossimo'
  | 'imperfetto'
  | 'trapassato-prossimo'
  | 'futuro-semplice'
  | 'futuro-anteriore'
  | 'condizionale-presente'
  | 'condizionale-passato'
  | 'congiuntivo-presente'
  | 'congiuntivo-imperfetto'
  | 'congiuntivo-passato'
  | 'congiuntivo-trapassato'
  | 'passe-compose'
  | 'imparfait'
  | 'plus-que-parfait'
  | 'futur-simple'
  | 'futur-anterieur'
  | 'conditionnel-present'
  | 'conditionnel-passe'
  | 'subjonctif-present'
  | 'subjonctif-passe'
  | 'preterite'
  | 'imperfect'
  | 'present-perfect'
  | 'pluperfect'
  | 'future'
  | 'future-perfect'
  | 'conditional'
  | 'conditional-perfect'
  | 'present-subjunctive'
  | 'imperfect-subjunctive'
  | 'perfect-subjunctive'
  | 'pluperfect-subjunctive'
  | 'armenian-present';

export type VerbTenseOption = {
  id: VerbTenseId;
  label: string;
  help: string;
};

export type VerbCurriculumLesson = {
  infinitive: string;
  english: string;
  pattern: VerbPattern;
  forms: string[];
  practiceForms: string[];
};

export const VERB_TENSES: Record<Language, VerbTenseOption[]> = {
  italian: [
    { id: 'present', label: 'Present', help: 'Use the present indicative for habits, facts, and what is happening now. The ending changes with the subject.' },
    { id: 'passato-prossimo', label: 'Recent past', help: 'Passato prossimo uses avere or essere in the present plus a past participle. With essere, the participle agrees with the subject.' },
    { id: 'imperfetto', label: 'Imperfect past', help: 'Use the imperfetto for background, repeated past actions, and states that continued over time.' },
    { id: 'trapassato-prossimo', label: 'Past before past', help: 'Trapassato prossimo uses avere or essere in the imperfetto plus a past participle for an earlier past action.' },
    { id: 'futuro-semplice', label: 'Future', help: 'The futuro semplice describes what will happen. Irregular verbs may use a shortened future stem.' },
    { id: 'futuro-anteriore', label: 'Future completed', help: 'Futuro anteriore uses avere or essere in the future plus a past participle.' },
    { id: 'condizionale-presente', label: 'Conditional', help: 'Use the condizionale for polite requests, possibilities, and what would happen. It shares the future stem.' },
    { id: 'condizionale-passato', label: 'Past conditional', help: 'Condizionale passato uses avere or essere in the conditional plus a past participle.' },
    { id: 'congiuntivo-presente', label: 'Present subjunctive', help: 'The congiuntivo presente often follows expressions of hope, doubt, emotion, or opinion.' },
    { id: 'congiuntivo-passato', label: 'Past subjunctive', help: 'Congiuntivo passato uses avere or essere in the present subjunctive plus a past participle.' },
    { id: 'congiuntivo-imperfetto', label: 'Imperfect subjunctive', help: 'Use the congiuntivo imperfetto after past expressions of doubt, hope, or desire.' },
    { id: 'congiuntivo-trapassato', label: 'Pluperfect subjunctive', help: 'Congiuntivo trapassato uses avere or essere in the imperfect subjunctive plus a past participle.' },
  ],
  french: [
    { id: 'present', label: 'Present', help: 'Use the présent for habits, facts, and actions happening now. Match the ending to the subject.' },
    { id: 'passe-compose', label: 'Recent past', help: 'Passé composé uses avoir or être in the present plus a past participle. With être, the participle agrees with the subject.' },
    { id: 'imparfait', label: 'Imperfect past', help: 'Use the imparfait for background, repeated past actions, and continuing past states.' },
    { id: 'plus-que-parfait', label: 'Past before past', help: 'Plus-que-parfait uses avoir or être in the imparfait plus a past participle.' },
    { id: 'futur-simple', label: 'Future', help: 'The futur simple describes what will happen. Some common verbs use an irregular future stem.' },
    { id: 'futur-anterieur', label: 'Future completed', help: 'Futur antérieur uses avoir or être in the future plus a past participle.' },
    { id: 'conditionnel-present', label: 'Conditional', help: 'Use the conditionnel for polite requests, possibilities, and what would happen.' },
    { id: 'conditionnel-passe', label: 'Past conditional', help: 'Conditionnel passé uses avoir or être in the conditional plus a past participle.' },
    { id: 'subjonctif-present', label: 'Present subjunctive', help: 'The subjonctif présent often follows expressions of hope, doubt, emotion, or necessity.' },
    { id: 'subjonctif-passe', label: 'Past subjunctive', help: 'Subjonctif passé uses avoir or être in the present subjunctive plus a past participle.' },
  ],
  spanish: [
    { id: 'present', label: 'Present', help: 'Use the presente for habits, facts, and what is happening now. Match the ending and any stem change to the subject.' },
    { id: 'preterite', label: 'Preterite', help: 'Use the pretérito for a completed action at a specific time in the past.' },
    { id: 'imperfect', label: 'Imperfect past', help: 'Use the imperfecto for background, repeated past actions, and continuing past states.' },
    { id: 'present-perfect', label: 'Present perfect', help: 'Pretérito perfecto uses haber in the present plus a past participle.' },
    { id: 'pluperfect', label: 'Past before past', help: 'Pluscuamperfecto uses haber in the imperfect plus a past participle.' },
    { id: 'future', label: 'Future', help: 'The futuro describes what will happen. Irregular verbs may use a special future stem.' },
    { id: 'future-perfect', label: 'Future completed', help: 'Futuro perfecto uses haber in the future plus a past participle.' },
    { id: 'conditional', label: 'Conditional', help: 'Use the condicional for polite requests, possibilities, and what would happen.' },
    { id: 'conditional-perfect', label: 'Past conditional', help: 'Condicional perfecto uses haber in the conditional plus a past participle.' },
    { id: 'present-subjunctive', label: 'Present subjunctive', help: 'The presente de subjuntivo often follows expressions of hope, doubt, emotion, or necessity.' },
    { id: 'imperfect-subjunctive', label: 'Imperfect subjunctive', help: 'Use the imperfecto de subjuntivo after past expressions of doubt, hope, or desire.' },
    { id: 'perfect-subjunctive', label: 'Perfect subjunctive', help: 'Pretérito perfecto de subjuntivo uses haber in the present subjunctive plus a past participle.' },
    { id: 'pluperfect-subjunctive', label: 'Pluperfect subjunctive', help: 'Pluscuamperfecto de subjuntivo uses haber in the imperfect subjunctive plus a past participle.' },
  ],
  armenian: [
    { id: 'armenian-present', label: 'Present', help: 'This guide uses Western Armenian forms. The present particle կը commonly comes before the conjugated verb.' },
  ],
};

const SUPPLEMENTAL_VERBS: Record<'italian' | 'french' | 'spanish', Record<string, string>[]> = {
  italian: [
    { key: 'eat', infinitive: 'mangiare' },
    { key: 'drink', infinitive: 'bere' },
    { key: 'sleep', infinitive: 'dormire' },
    { key: 'study', infinitive: 'studiare' },
    { key: 'travel', infinitive: 'viaggiare' },
    { key: 'open', infinitive: 'aprire' },
    { key: 'close', infinitive: 'chiudere' },
    { key: 'drive', infinitive: 'guidare' },
    { key: 'cook', infinitive: 'cucinare' },
    { key: 'clean', infinitive: 'pulire' },
    { key: 'visit', infinitive: 'visitare' },
    { key: 'like', infinitive: 'piacere' },
    { key: 'be (state / location)', infinitive: 'stare' },
    { key: 'know someone', infinitive: 'conoscere' },
  ],
  french: [
    { key: 'eat', infinitive: 'manger' },
    { key: 'drink', infinitive: 'boire' },
    { key: 'sleep', infinitive: 'dormir' },
    { key: 'study', infinitive: 'étudier' },
    { key: 'travel', infinitive: 'voyager' },
    { key: 'open', infinitive: 'ouvrir' },
    { key: 'close', infinitive: 'fermer' },
    { key: 'drive', infinitive: 'conduire' },
    { key: 'cook', infinitive: 'cuisiner' },
    { key: 'clean', infinitive: 'nettoyer' },
    { key: 'visit', infinitive: 'visiter' },
    { key: 'like', infinitive: 'aimer' },
    { key: 'be (state / location)', infinitive: 'être' },
    { key: 'know someone', infinitive: 'connaître' },
  ],
  spanish: [
    { key: 'eat', infinitive: 'comer' },
    { key: 'drink', infinitive: 'beber' },
    { key: 'sleep', infinitive: 'dormir' },
    { key: 'study', infinitive: 'estudiar' },
    { key: 'travel', infinitive: 'viajar' },
    { key: 'open', infinitive: 'abrir' },
    { key: 'close', infinitive: 'cerrar' },
    { key: 'drive', infinitive: 'conducir' },
    { key: 'cook', infinitive: 'cocinar' },
    { key: 'clean', infinitive: 'limpiar' },
    { key: 'visit', infinitive: 'visitar' },
    { key: 'like', infinitive: 'gustar' },
    { key: 'be (state / location)', infinitive: 'estar' },
    { key: 'know someone', infinitive: 'conocer' },
  ],
};

const CANONICAL: Record<'italian' | 'french' | 'spanish', Record<string, string>> = {
  italian: {
    be: 'essere', have: 'avere', do: 'fare', make: 'fare', say: 'dire', get: 'ottenere',
    go: 'andare', know: 'sapere', think: 'pensare', come: 'venire', see: 'vedere',
    take: 'prendere', want: 'volere', give: 'dare', tell: 'dire', put: 'mettere',
    keep: 'tenere', leave: 'partire', stand: 'stare', hold: 'tenere', read: 'leggere',
    write: 'scrivere', understand: 'capire', speak: 'parlare', choose: 'scegliere',
    buy: 'comprare', sell: 'vendere', fall: 'cadere', break: 'rompere', run: 'correre',
    send: 'mandare', grow: 'crescere', build: 'costruire', discover: 'scoprire',
    achieve: 'raggiungere', satisfy: 'soddisfare', prefer: 'preferire',
  },
  french: {
    be: 'être', have: 'avoir', do: 'faire', make: 'faire', say: 'dire', get: 'obtenir',
    go: 'aller', know: 'savoir', think: 'penser', come: 'venir', see: 'voir',
    take: 'prendre', want: 'vouloir', give: 'donner', tell: 'dire', put: 'mettre',
    keep: 'garder', leave: 'partir', stand: 'se tenir', hold: 'tenir', read: 'lire',
    write: 'écrire', understand: 'comprendre', speak: 'parler', choose: 'choisir',
    buy: 'acheter', sell: 'vendre', fall: 'tomber', break: 'casser', run: 'courir',
    send: 'envoyer', grow: 'grandir', build: 'construire', discover: 'découvrir',
    achieve: 'atteindre', satisfy: 'satisfaire', prefer: 'préférer',
    remember: 'se souvenir',
  },
  spanish: {
    be: 'ser', have: 'tener', do: 'hacer', make: 'hacer', say: 'decir', get: 'obtener',
    go: 'ir', know: 'saber', think: 'pensar', come: 'venir', see: 'ver',
    take: 'tomar', want: 'querer', give: 'dar', tell: 'decir', put: 'poner',
    keep: 'guardar', leave: 'salir', stand: 'estar', hold: 'sostener', read: 'leer',
    write: 'escribir', understand: 'entender', speak: 'hablar', choose: 'elegir',
    buy: 'comprar', sell: 'vender', fall: 'caer', break: 'romper', run: 'correr',
    send: 'enviar', grow: 'crecer', build: 'construir', discover: 'descubrir',
    achieve: 'lograr', satisfy: 'satisfacer', prefer: 'preferir',
    remember: 'recordar', begin: 'empezar', meet: 'conocer',
  },
};

const IT_PRESENT: Record<string, string[]> = {
  be: ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'],
  have: ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'],
  do: ['faccio', 'fai', 'fa', 'facciamo', 'fate', 'fanno'],
  make: ['faccio', 'fai', 'fa', 'facciamo', 'fate', 'fanno'],
  say: ['dico', 'dici', 'dice', 'diciamo', 'dite', 'dicono'],
  get: ['ottengo', 'ottieni', 'ottiene', 'otteniamo', 'ottenete', 'ottengono'],
  go: ['vado', 'vai', 'va', 'andiamo', 'andate', 'vanno'],
  know: ['so', 'sai', 'sa', 'sappiamo', 'sapete', 'sanno'],
  come: ['vengo', 'vieni', 'viene', 'veniamo', 'venite', 'vengono'],
  want: ['voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono'],
  give: ['do', 'dai', 'dà', 'diamo', 'date', 'danno'],
  tell: ['dico', 'dici', 'dice', 'diciamo', 'dite', 'dicono'],
  keep: ['tengo', 'tieni', 'tiene', 'teniamo', 'tenete', 'tengono'],
  hold: ['tengo', 'tieni', 'tiene', 'teniamo', 'tenete', 'tengono'],
  stand: ['sto', 'stai', 'sta', 'stiamo', 'state', 'stanno'],
  put: ['metto', 'metti', 'mette', 'mettiamo', 'mettete', 'mettono'],
  read: ['leggo', 'leggi', 'legge', 'leggiamo', 'leggete', 'leggono'],
  write: ['scrivo', 'scrivi', 'scrive', 'scriviamo', 'scrivete', 'scrivono'],
  understand: ['capisco', 'capisci', 'capisce', 'capiamo', 'capite', 'capiscono'],
  choose: ['scelgo', 'scegli', 'sceglie', 'scegliamo', 'scegliete', 'scelgono'],
  break: ['rompo', 'rompi', 'rompe', 'rompiamo', 'rompete', 'rompono'],
  discover: ['scopro', 'scopri', 'scopre', 'scopriamo', 'scoprite', 'scoprono'],
  'be (state / location)': ['sto', 'stai', 'sta', 'stiamo', 'state', 'stanno'],
  drink: ['bevo', 'bevi', 'beve', 'beviamo', 'bevete', 'bevono'],
    'know someone': ['conosco', 'conosci', 'conosce', 'conosciamo', 'conoscete', 'conoscono'],
  'like': ['piaccio', 'piaci', 'piace', 'piacciamo', 'piacete', 'piacciono'],
};

const FR_PRESENT: Record<string, string[]> = {
  be: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'],
  have: ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
  do: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'],
  make: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'],
  say: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'],
  get: ['obtiens', 'obtiens', 'obtient', 'obtenons', 'obtenez', 'obtiennent'],
  go: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'],
  know: ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'],
  come: ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'],
  see: ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'],
  take: ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'],
  want: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'],
  tell: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'],
  put: ['mets', 'mets', 'met', 'mettons', 'mettez', 'mettent'],
  keep: ['garde', 'gardes', 'garde', 'gardons', 'gardez', 'gardent'],
  leave: ['pars', 'pars', 'part', 'partons', 'partez', 'partent'],
  hold: ['tiens', 'tiens', 'tient', 'tenons', 'tenez', 'tiennent'],
  read: ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'],
  write: ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'],
  understand: ['comprends', 'comprends', 'comprend', 'comprenons', 'comprenez', 'comprennent'],
  choose: ['choisis', 'choisis', 'choisit', 'choisissons', 'choisissez', 'choisissent'],
  buy: ['achète', 'achètes', 'achète', 'achetons', 'achetez', 'achètent'],
  run: ['cours', 'cours', 'court', 'courons', 'courez', 'courent'],
  send: ['envoie', 'envoies', 'envoie', 'envoyons', 'envoyez', 'envoient'],
  grow: ['grandis', 'grandis', 'grandit', 'grandissons', 'grandissez', 'grandissent'],
  build: ['construis', 'construis', 'construit', 'construisons', 'construisez', 'construisent'],
  discover: ['découvre', 'découvres', 'découvre', 'découvrons', 'découvrez', 'découvrent'],
  prefer: ['préfère', 'préfères', 'préfère', 'préférons', 'préférez', 'préfèrent'],
  'be (state / location)': ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'],
  'know someone': ['connais', 'connais', 'connaît', 'connaissons', 'connaissez', 'connaissent'],
  'remember': ['souviens', 'souviens', 'souvient', 'souvenons', 'souvenez', 'souviennent'],
  stand: ['tiens', 'tiens', 'tient', 'tenons', 'tenez', 'tiennent'],
  open: ['ouvre', 'ouvres', 'ouvre', 'ouvrons', 'ouvrez', 'ouvrent'],
  drink: ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent'],
  sleep: ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'],
  like: ['aime', 'aimes', 'aime', 'aimons', 'aimez', 'aiment'],
  begin: ['commence', 'commences', 'commence', 'commençons', 'commencez', 'commencent'],
  achieve: ['atteins', 'atteins', 'atteint', 'atteignons', 'atteignez', 'atteignent'],
  receive: ['reçois', 'reçois', 'reçoit', 'recevons', 'recevez', 'reçoivent'],
};

const ES_PRESENT: Record<string, string[]> = {
  be: ['soy', 'eres', 'es', 'somos', 'sois', 'son'],
  have: ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen'],
  do: ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen'],
  make: ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen'],
  say: ['digo', 'dices', 'dice', 'decimos', 'decís', 'dicen'],
  get: ['obtengo', 'obtienes', 'obtiene', 'obtenemos', 'obtenéis', 'obtienen'],
  go: ['voy', 'vas', 'va', 'vamos', 'vais', 'van'],
  know: ['sé', 'sabes', 'sabe', 'sabemos', 'sabéis', 'saben'],
  come: ['vengo', 'vienes', 'viene', 'venimos', 'venís', 'vienen'],
  see: ['veo', 'ves', 've', 'vemos', 'veis', 'ven'],
  take: ['tomo', 'tomas', 'toma', 'tomamos', 'tomáis', 'toman'],
  want: ['quiero', 'quieres', 'quiere', 'queremos', 'queréis', 'quieren'],
  give: ['doy', 'das', 'da', 'damos', 'dais', 'dan'],
  put: ['pongo', 'pones', 'pone', 'ponemos', 'ponéis', 'ponen'],
  keep: ['guardo', 'guardas', 'guarda', 'guardamos', 'guardáis', 'guardan'],
  leave: ['salgo', 'sales', 'sale', 'salimos', 'salís', 'salen'],
  hold: ['sostengo', 'sostienes', 'sostiene', 'sostenemos', 'sostenéis', 'sostienen'],
  read: ['leo', 'lees', 'lee', 'leemos', 'leéis', 'leen'],
  write: ['escribo', 'escribes', 'escribe', 'escribimos', 'escribís', 'escriben'],
  understand: ['entiendo', 'entiendes', 'entiende', 'entendemos', 'entendéis', 'entienden'],
  choose: ['elijo', 'eliges', 'elige', 'elegimos', 'elegís', 'eligen'],
  break: ['rompo', 'rompes', 'rompe', 'rompemos', 'rompéis', 'rompen'],
  discover: ['descubro', 'descubres', 'descubre', 'descubrimos', 'descubrís', 'descubren'],
  'be (state / location)': ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'],
  'know someone': ['conozco', 'conoces', 'conoce', 'conocemos', 'conocéis', 'conocen'],
  stand: ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'],
  follow: ['sigo', 'sigues', 'sigue', 'seguimos', 'seguís', 'siguen'],
  like: ['gusto', 'gustas', 'gusta', 'gustamos', 'gustáis', 'gustan'],
};

const IT_PARTICIPLES: Record<string, string> = {
  be: 'stato', have: 'avuto', do: 'fatto', make: 'fatto', say: 'detto', get: 'ottenuto',
  go: 'andato', know: 'saputo', come: 'venuto', see: 'visto', take: 'preso', want: 'voluto',
  give: 'dato', tell: 'detto', put: 'messo', keep: 'tenuto', leave: 'partito', stand: 'stato',
  hold: 'tenuto', read: 'letto', write: 'scritto', understand: 'capito', choose: 'scelto',
  buy: 'comprato', sell: 'venduto', fall: 'caduto', break: 'rotto', run: 'corso',
  send: 'mandato', grow: 'cresciuto', build: 'costruito', discover: 'scoperto',
  achieve: 'raggiunto', satisfy: 'soddisfatto', drink: 'bevuto', open: 'aperto',
  close: 'chiuso', sleep: 'dormito', like: 'piaciuto', 'know someone': 'conosciuto',
  'be (state / location)': 'stato',
};

const FR_PARTICIPLES: Record<string, string> = {
  be: 'été', have: 'eu', do: 'fait', make: 'fait', say: 'dit', get: 'obtenu',
  go: 'allé', know: 'su', come: 'venu', see: 'vu', take: 'pris', want: 'voulu',
  give: 'donné', tell: 'dit', put: 'mis', keep: 'gardé', leave: 'parti', hold: 'tenu',
  read: 'lu', write: 'écrit', understand: 'compris', choose: 'choisi', buy: 'acheté',
  sell: 'vendu', fall: 'tombé', break: 'cassé', run: 'couru', send: 'envoyé',
  grow: 'grandi', build: 'construit', discover: 'découvert', achieve: 'atteint',
  satisfy: 'satisfait', drink: 'bu', open: 'ouvert', close: 'fermé', sleep: 'dormi',
  remember: 'souvenu', 'know someone': 'connu', like: 'aimé',
  stand: 'tenu',
  receive: 'reçu',
  'be (state / location)': 'été',
};

const ES_PARTICIPLES: Record<string, string> = {
  be: 'sido', have: 'tenido', do: 'hecho', make: 'hecho', say: 'dicho', get: 'obtenido',
  go: 'ido', know: 'sabido', come: 'venido', see: 'visto', take: 'tomado', want: 'querido',
  give: 'dado', tell: 'dicho', put: 'puesto', keep: 'guardado', leave: 'salido',
  hold: 'sostenido', read: 'leído', write: 'escrito', understand: 'entendido',
  choose: 'elegido', buy: 'comprado', sell: 'vendido', fall: 'caído', break: 'roto',
  run: 'corrido', send: 'enviado', grow: 'crecido', build: 'construido',
  discover: 'descubierto', achieve: 'logrado', satisfy: 'satisfecho', drink: 'bebido',
  open: 'abierto', close: 'cerrado', sleep: 'dormido', like: 'gustado',
  'know someone': 'conocido', 'be (state / location)': 'estado',
};

const IT_FUTURE_STEMS: Record<string, string> = {
  be: 'sar', have: 'avr', do: 'far', make: 'far', say: 'dir', get: 'otterr',
  go: 'andr', know: 'sapr', come: 'verr', see: 'vedr', take: 'prender',
  want: 'vorr', give: 'dar', tell: 'dir', put: 'metter', keep: 'terr',
  leave: 'partir', stand: 'star', hold: 'terr', read: 'legger', write: 'scriver',
  buy: 'comprer', fall: 'cader', break: 'romper', run: 'correr', send: 'mander',
  grow: 'crescer', build: 'costruir', discover: 'scoprir', drink: 'berr',
  'be (state / location)': 'star', study: 'studier', 'know someone': 'conoscer',
};

const FR_FUTURE_STEMS: Record<string, string> = {
  be: 'ser', have: 'aur', do: 'fer', make: 'fer', say: 'dir', get: 'obtiendr',
  go: 'ir', know: 'saur', come: 'viendr', see: 'verr', take: 'prendr', want: 'voudr',
  give: 'donner', tell: 'dir', put: 'mettr', keep: 'garder', leave: 'partir',
  hold: 'tiendr', read: 'lir', write: 'écrir', buy: 'achèter', run: 'courr',
  send: 'enverr', build: 'construir', discover: 'découvrir', achieve: 'atteindr',
  drink: 'boir', open: 'ouvrir', sleep: 'dormir', remember: 'souviendr',
  'be (state / location)': 'ser', stand: 'tiendr', 'know someone': 'connaîtr',
  begin: 'commencer', receive: 'recevr', satisfy: 'satisfer',
};

const ES_FUTURE_STEMS: Record<string, string> = {
  have: 'tendr', do: 'har', make: 'har', say: 'dir', get: 'obtendr', go: 'ir',
  know: 'sabr', come: 'vendr', want: 'querr', give: 'dar', put: 'pondr',
  leave: 'saldr', hold: 'sostendr', send: 'enviar', buy: 'comprar',
  satisfy: 'satisfar', can: 'podr', begin: 'empezar', 'be (state / location)': 'estar', stand: 'estar', 'know someone': 'conocer',
};

const IT_SUBJ_PRESENT: Record<string, string[]> = {
  be: ['sia', 'sia', 'sia', 'siamo', 'siate', 'siano'],
  have: ['abbia', 'abbia', 'abbia', 'abbiamo', 'abbiate', 'abbiano'],
  do: ['faccia', 'faccia', 'faccia', 'facciamo', 'facciate', 'facciano'],
  make: ['faccia', 'faccia', 'faccia', 'facciamo', 'facciate', 'facciano'],
  go: ['vada', 'vada', 'vada', 'andiamo', 'andiate', 'vadano'],
  say: ['dica', 'dica', 'dica', 'diciamo', 'diciate', 'dicano'],
  know: ['sappia', 'sappia', 'sappia', 'sappiamo', 'sappiate', 'sappiano'],
  come: ['venga', 'venga', 'venga', 'veniamo', 'veniate', 'vengano'],
  want: ['voglia', 'voglia', 'voglia', 'vogliamo', 'vogliate', 'vogliano'],
  give: ['dia', 'dia', 'dia', 'diamo', 'diate', 'diano'],
  drink: ['beva', 'beva', 'beva', 'beviamo', 'beviate', 'bevano'],
  'be (state / location)': ['stia', 'stia', 'stia', 'stiamo', 'stiate', 'stiano'],
  stand: ['stia', 'stia', 'stia', 'stiamo', 'stiate', 'stiano'],
};

const FR_SUBJ_PRESENT: Record<string, string[]> = {
  be: ['sois', 'sois', 'soit', 'soyons', 'soyez', 'soient'],
  have: ['aie', 'aies', 'ait', 'ayons', 'ayez', 'aient'],
  do: ['fasse', 'fasses', 'fasse', 'fassions', 'fassiez', 'fassent'],
  make: ['fasse', 'fasses', 'fasse', 'fassions', 'fassiez', 'fassent'],
  say: ['dise', 'dises', 'dise', 'disions', 'disiez', 'disent'],
  go: ['aille', 'ailles', 'aille', 'allions', 'alliez', 'aillent'],
  know: ['sache', 'saches', 'sache', 'sachions', 'sachiez', 'sachent'],
  come: ['vienne', 'viennes', 'vienne', 'venions', 'veniez', 'viennent'],
  see: ['voie', 'voies', 'voie', 'voyions', 'voyiez', 'voient'],
  take: ['prenne', 'prennes', 'prenne', 'prenions', 'preniez', 'prennent'],
  want: ['veuille', 'veuilles', 'veuille', 'voulions', 'vouliez', 'veuillent'],
  'remember': ['souvienne', 'souviennes', 'souvienne', 'souvenions', 'souveniez', 'souviennent'],
  open: ['ouvre', 'ouvres', 'ouvre', 'ouvrions', 'ouvriez', 'ouvrent'],
  drink: ['boive', 'boives', 'boive', 'buvions', 'buviez', 'boivent'],
  stand: ['tienne', 'tiennes', 'tienne', 'tenions', 'teniez', 'tiennent'],
};

const ES_PRETERITE: Record<string, string[]> = {
  be: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
  go: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
  have: ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron'],
  do: ['hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron'],
  make: ['hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron'],
  say: ['dije', 'dijiste', 'dijo', 'dijimos', 'dijisteis', 'dijeron'],
  come: ['vine', 'viniste', 'vino', 'vinimos', 'vinisteis', 'vinieron'],
  want: ['quise', 'quisiste', 'quiso', 'quisimos', 'quisisteis', 'quisieron'],
  put: ['puse', 'pusiste', 'puso', 'pusimos', 'pusisteis', 'pusieron'],
  know: ['supe', 'supiste', 'supo', 'supimos', 'supisteis', 'supieron'],
  see: ['vi', 'viste', 'vio', 'vimos', 'visteis', 'vieron'],
  give: ['di', 'diste', 'dio', 'dimos', 'disteis', 'dieron'],
  hold: ['sostuve', 'sostuviste', 'sostuvo', 'sostuvimos', 'sostuvisteis', 'sostuvieron'],
  read: ['leí', 'leíste', 'leyó', 'leímos', 'leísteis', 'leyeron'],
  stand: ['estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron'],
  'be (state / location)': ['estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron'],
  leave: ['salí', 'saliste', 'salió', 'salimos', 'salisteis', 'salieron'],
  can: ['pude', 'pudiste', 'pudo', 'pudimos', 'pudisteis', 'pudieron'],
  get: ['obtuve', 'obtuviste', 'obtuvo', 'obtuvimos', 'obtuvisteis', 'obtuvieron'],
  pay: ['pagué', 'pagaste', 'pagó', 'pagamos', 'pagasteis', 'pagaron'],
  fall: ['caí', 'caíste', 'cayó', 'caímos', 'caísteis', 'cayeron'],
  follow: ['seguí', 'seguiste', 'siguió', 'seguimos', 'seguisteis', 'siguieron'],
  begin: ['empecé', 'empezaste', 'empezó', 'empezamos', 'empezasteis', 'empezaron'],
};

const ES_SUBJ_PRESENT: Record<string, string[]> = {
  be: ['sea', 'seas', 'sea', 'seamos', 'seáis', 'sean'],
  have: ['tenga', 'tengas', 'tenga', 'tengamos', 'tengáis', 'tengan'],
  do: ['haga', 'hagas', 'haga', 'hagamos', 'hagáis', 'hagan'],
  make: ['haga', 'hagas', 'haga', 'hagamos', 'hagáis', 'hagan'],
  say: ['diga', 'digas', 'diga', 'digamos', 'digáis', 'digan'],
  go: ['vaya', 'vayas', 'vaya', 'vayamos', 'vayáis', 'vayan'],
  know: ['sepa', 'sepas', 'sepa', 'sepamos', 'sepáis', 'sepan'],
  come: ['venga', 'vengas', 'venga', 'vengamos', 'vengáis', 'vengan'],
  want: ['quiera', 'quieras', 'quiera', 'queramos', 'queráis', 'quieran'],
  give: ['dé', 'des', 'dé', 'demos', 'deis', 'den'],
  see: ['vea', 'veas', 'vea', 'veamos', 'veáis', 'vean'],
  put: ['ponga', 'pongas', 'ponga', 'pongamos', 'pongáis', 'pongan'],
  leave: ['salga', 'salgas', 'salga', 'salgamos', 'salgáis', 'salgan'],
  understand: ['entienda', 'entiendas', 'entienda', 'entendamos', 'entendáis', 'entiendan'],
  'be (state / location)': ['esté', 'estés', 'esté', 'estemos', 'estéis', 'estén'],
  stand: ['esté', 'estés', 'esté', 'estemos', 'estéis', 'estén'],
  follow: ['siga', 'sigas', 'siga', 'sigamos', 'sigáis', 'sigan'],
  begin: ['empiece', 'empieces', 'empiece', 'empecemos', 'empecéis', 'empiecen'],
};

const IT_IRREGULAR_KEYS = new Set(Object.keys(IT_PRESENT).concat([
  'think', 'take', 'see', 'come', 'want', 'read', 'write', 'choose', 'sell',
  'buy', 'fall', 'break', 'run', 'send', 'grow', 'build', 'discover', 'achieve',
  'satisfy', 'drink', 'open', 'close', 'sleep', 'prefer', 'know someone',
]));
const FR_IRREGULAR_KEYS = new Set(Object.keys(FR_PRESENT).concat([
  'think', 'take', 'read', 'write', 'understand', 'choose', 'buy', 'fall',
  'break', 'run', 'send', 'grow', 'build', 'discover', 'achieve', 'satisfy',
  'drink', 'open', 'sleep', 'prefer', 'know someone',
]));
const ES_IRREGULAR_KEYS = new Set(Object.keys(ES_PRESENT).concat([
  'think', 'take', 'read', 'write', 'understand', 'choose', 'buy', 'fall',
  'break', 'run', 'send', 'grow', 'build', 'discover', 'achieve', 'satisfy',
  'drink', 'sleep', 'prefer', 'know someone',
]));

const IT_PERSON_MAP = [0, 1, 2, 2, 3, 4, 5];
const FR_PERSON_MAP = [0, 1, 2, 2, 3, 4, 5];
const IDENTITY_PERSON_MAP = [0, 1, 2, 3, 4, 5];

function simpleMap(language: Language): number[] {
  if (language === 'italian') return IT_PERSON_MAP;
  if (language === 'french') return FR_PERSON_MAP;
  return IDENTITY_PERSON_MAP;
}

function cleanEnglish(value: string): string {
  return value.replace(/^to\s+/i, '').trim().toLocaleLowerCase();
}

function regularItalianPresent(infinitive: string, key: string): string[] {
  const group = infinitive.slice(-3);
  const stem = infinitive.slice(0, -3);
  if (!['are', 'ere', 'ire'].includes(group)) return Array(6).fill(infinitive);
  if (group === 'ire' && ['understand', 'clean', 'prefer'].includes(key)) {
    return [`${stem}isco`, `${stem}isci`, `${stem}isce`, `${stem}iamo`, `${stem}ite`, `${stem}iscono`];
  }
  if (group === 'are') {
    const endings = ['o', 'i', 'a', 'iamo', 'ate', 'ano'];
    return endings.map((ending, i) => {
      let root = stem;
      if (/[cg]$/.test(root) && [1, 3].includes(i)) root += 'h';
      if (/i$/.test(root) && [1, 3].includes(i)) root = root.slice(0, -1);
      return root + ending;
    });
  }
  const endings = group === 'ere'
    ? ['o', 'i', 'e', 'iamo', 'ete', 'ono']
    : ['o', 'i', 'e', 'iamo', 'ite', 'ono'];
  return endings.map((ending, i) => {
    let root = stem;
    if (group === 'ire' && ['live', 'arrive', 'stay'].includes(key) && i === 0) root = stem;
    return root + ending;
  });
}

function italianFutureStem(infinitive: string, key: string): string {
  const special = IT_FUTURE_STEMS[key];
  if (special) return special;
  if (infinitive.endsWith('care') || infinitive.endsWith('gare')) return `${infinitive.slice(0, -3)}her`.replace('hher', 'her');
  if (/[cg]iare$/.test(infinitive)) return `${infinitive.slice(0, -4)}er`;
  if (infinitive.endsWith('are')) return `${infinitive.slice(0, -3)}er`;
  return infinitive.slice(0, -1);
}

function italianPresent(infinitive: string, key: string): string[] {
  return IT_PRESENT[key] ?? regularItalianPresent(infinitive, key);
}

function italianImperfect(infinitive: string, key: string): string[] {
  const irregularStem: Record<string, string> = { be: 'er', do: 'facev', make: 'facev', say: 'dicev', drink: 'bevev' };
  const stem = irregularStem[key] ?? `${infinitive.slice(0, -3)}${infinitive.endsWith('are') ? 'av' : infinitive.endsWith('ere') ? 'ev' : 'iv'}`;
  const ending = ['o', 'i', 'a', 'amo', 'ate', 'ano'];
  return ending.map((suffix, i) => `${stem}${suffix}`);
}

function italianSubjPresent(infinitive: string, key: string): string[] {
  if (IT_SUBJ_PRESENT[key]) return IT_SUBJ_PRESENT[key];
  const group = infinitive.slice(-3);
  const stem = group === 'are' && /i$/.test(infinitive.slice(0, -3))
    ? infinitive.slice(0, -4)
    : infinitive.slice(0, -3);
  const endings = group === 'are'
    ? ['i', 'i', 'i', 'iamo', 'iate', 'ino']
    : ['a', 'a', 'a', 'iamo', 'iate', 'ano'];
  return endings.map((ending, i) => {
    if (group === 'ire' && ['understand', 'clean', 'prefer'].includes(key) && ![3, 4].includes(i)) {
      return `${infinitive.slice(0, -3)}isc${ending}`;
    }
    return `${stem}${ending}`;
  });
}

function italianSubjImperfect(infinitive: string, key: string): string[] {
  const irregular: Record<string, string[]> = {
    be: ['fossi', 'fossi', 'fosse', 'fossimo', 'foste', 'fossero'],
    have: ['avessi', 'avessi', 'avesse', 'avessimo', 'aveste', 'avessero'],
    do: ['facessi', 'facessi', 'facesse', 'facessimo', 'faceste', 'facessero'],
    make: ['facessi', 'facessi', 'facesse', 'facessimo', 'faceste', 'facessero'],
    say: ['dicessi', 'dicessi', 'dicesse', 'dicessimo', 'diceste', 'dicessero'],
    go: ['andassi', 'andassi', 'andasse', 'andassimo', 'andaste', 'andassero'],
    come: ['venissi', 'venissi', 'venisse', 'venissimo', 'veniste', 'venissero'],
    want: ['volessi', 'volessi', 'volesse', 'volessimo', 'voleste', 'volessero'],
    know: ['sapessi', 'sapessi', 'sapesse', 'sapessimo', 'sapeste', 'sapessero'],
    give: ['dessi', 'dessi', 'desse', 'dessimo', 'deste', 'dessero'],
    stand: ['stessi', 'stessi', 'stesse', 'stessimo', 'steste', 'stessero'],
    'be (state / location)': ['stessi', 'stessi', 'stesse', 'stessimo', 'steste', 'stessero'],
  };
  if (irregular[key]) return irregular[key];
  const group = infinitive.slice(-3);
  const stem = infinitive.slice(0, -3);
  const endings = group === 'are'
    ? ['assi', 'assi', 'asse', 'assimo', 'aste', 'assero']
    : group === 'ere'
      ? ['essi', 'essi', 'esse', 'essimo', 'este', 'essero']
      : ['issi', 'issi', 'isse', 'issimo', 'iste', 'issero'];
  return endings.map(ending => `${stem}${ending}`);
}

function regularFrenchPresent(infinitive: string): string[] {
  const stem = infinitive.slice(0, -2);
  if (infinitive.endsWith('er')) return ['e', 'es', 'e', 'ons', 'ez', 'ent'].map(end => stem + end);
  if (infinitive.endsWith('ir')) return ['is', 'is', 'it', 'issons', 'issez', 'issent'].map(end => stem + end);
  if (infinitive.endsWith('re')) return ['s', 's', '', 'ons', 'ez', 'ent'].map(end => stem + end);
  return Array(6).fill(infinitive);
}

function frenchPresent(infinitive: string, key: string): string[] {
  if (FR_PRESENT[key]) return FR_PRESENT[key];
  const base = regularFrenchPresent(infinitive);
  if (key === 'remember') return FR_PRESENT.remember;
  if (key === 'open') return ['ouvre', 'ouvres', 'ouvre', 'ouvrons', 'ouvrez', 'ouvrent'];
  if (key === 'drink') return ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent'];
  if (key === 'sleep') return ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'];
  if (key === 'stand') return ['tiens', 'tiens', 'tient', 'tenons', 'tenez', 'tiennent'];
  if (infinitive.endsWith('eter') || infinitive.endsWith('eler')) {
    return base.map((form, i) => [0, 1, 2, 5].includes(i)
      ? form.replace(/(t|l)(e|es|ent)$/, '$1$1$2')
      : form);
  }
  if (infinitive.endsWith('oyer') || infinitive.endsWith('uyer')) {
    return base.map((form, i) => [0, 1, 2, 5].includes(i) ? form.replace(/y(?=e|es|ent$)/, 'i') : form);
  }
  return base;
}

function frenchImperfect(infinitive: string, key: string): string[] {
  const irregular: Record<string, string> = { be: 'ét' };
  const nous = frenchPresent(infinitive, key)[3];
  const stem = irregular[key] ?? nous.replace(/ons$/, '');
  return ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'].map(end => stem + end);
}

function frenchFutureStem(infinitive: string, key: string): string {
  return FR_FUTURE_STEMS[key] ?? (infinitive.endsWith('re') ? infinitive.slice(0, -1) : infinitive);
}

function frenchSubjPresent(infinitive: string, key: string): string[] {
  if (FR_SUBJ_PRESENT[key]) return FR_SUBJ_PRESENT[key];
  const thirdPlural = frenchPresent(infinitive, key)[5];
  const stem = thirdPlural.replace(/ent$/, '');
  return ['e', 'es', 'e', 'ions', 'iez', 'ent'].map(end => stem + end);
}

function spanishPresent(infinitive: string, key: string): string[] {
  if (ES_PRESENT[key]) return ES_PRESENT[key];
  const group = infinitive.slice(-2);
  const stem = infinitive.slice(0, -2);
  if (!['ar', 'er', 'ir'].includes(group)) return Array(6).fill(infinitive);
  const endings = group === 'ar'
    ? ['o', 'as', 'a', 'amos', 'áis', 'an']
    : group === 'er'
      ? ['o', 'es', 'e', 'emos', 'éis', 'en']
      : ['o', 'es', 'e', 'imos', 'ís', 'en'];
  const eIe = new Set(['think', 'want', 'prefer', 'begin', 'understand', 'remember', 'meet', 'close']);
  const oUe = new Set(['can', 'sleep', 'find', 'show', 'return', 'resolve', 'satisfy']);
  const eI = new Set(['choose', 'serve', 'repeat']);
  return endings.map((ending, i) => {
    let root = stem;
    const changesApply = ![3, 4].includes(i);
    if (changesApply && eIe.has(key)) root = root.replace(/e(?=[^e]*$)/, 'ie');
    if (changesApply && oUe.has(key)) root = root.replace(/o(?=[^o]*$)/, 'ue');
    if (changesApply && eI.has(key)) root = root.replace(/e(?=[^e]*$)/, 'i');
    if (group === 'ir' && eI.has(key) && [3, 4].includes(i)) root = root.replace(/e(?=[^e]*$)/, 'i');
    if (key === 'play' && changesApply) root = root.replace(/u(?=[^u]*$)/, 'ue');
    return root + ending;
  });
}

function spanishPreterite(infinitive: string, key: string): string[] {
  if (ES_PRETERITE[key]) return ES_PRETERITE[key];
  const group = infinitive.slice(-2);
  const stem = infinitive.slice(0, -2);
  const endings = group === 'ar'
    ? ['é', 'aste', 'ó', 'amos', 'asteis', 'aron']
    : ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'];
  return endings.map(end => `${stem}${end}`);
}

function spanishImperfect(infinitive: string, key: string): string[] {
  const irregular: Record<string, string[]> = {
    be: ['era', 'eras', 'era', 'éramos', 'erais', 'eran'],
    go: ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban'],
    see: ['veía', 'veías', 'veía', 'veíamos', 'veíais', 'veían'],
  };
  if (irregular[key]) return irregular[key];
  const group = infinitive.slice(-2);
  const stem = infinitive.slice(0, -2);
  const endings = group === 'ar'
    ? ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban']
    : ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'];
  return endings.map(end => stem + end);
}

function spanishFutureStem(infinitive: string, key: string): string {
  return ES_FUTURE_STEMS[key] ?? infinitive;
}

function spanishSubjPresent(infinitive: string, key: string): string[] {
  if (ES_SUBJ_PRESENT[key]) return ES_SUBJ_PRESENT[key];
  const yo = spanishPresent(infinitive, key)[0];
  const changedRoot = yo.replace(/o$/, '');
  const originalRoot = infinitive.slice(0, -2);
  const group = infinitive.slice(-2);
  const endings = group === 'ar'
    ? ['e', 'es', 'e', 'emos', 'éis', 'en']
    : ['a', 'as', 'a', 'amos', 'áis', 'an'];
  return endings.map((end, i) => {
    let adjustedRoot = changedRoot;
    if ([3, 4].includes(i)) {
      adjustedRoot = originalRoot;
      if (group === 'ir' && ['prefer', 'sleep', 'choose', 'serve'].includes(key)) {
        adjustedRoot = originalRoot.replace(/e(?=[^e]*$)/, 'i');
      }
    } else if (key === 'close') {
      adjustedRoot = changedRoot;
    }
    return adjustedRoot + end;
  });
}

function spanishImperfectSubj(infinitive: string, key: string): string[] {
  const thirdPlural = spanishPreterite(infinitive, key)[5];
  const stem = thirdPlural.replace(/ron$/, '');
  const accentedStem = stem.replace(/([aeiou])$/, vowel => ({
    a: 'á',
    e: 'é',
    i: 'í',
    o: 'ó',
    u: 'ú',
  }[vowel] ?? vowel));
  return [`${stem}ra`, `${stem}ras`, `${stem}ra`, `${accentedStem}ramos`, `${stem}rais`, `${stem}ran`];
}

function simpleForms(language: Language, key: string, infinitive: string, id: VerbTenseId): string[] {
  if (language === 'italian') {
    if (id === 'present') return italianPresent(infinitive, key);
    if (id === 'imperfetto') return italianImperfect(infinitive, key);
    if (id === 'futuro-semplice') return ['ò', 'ai', 'à', 'emo', 'ete', 'anno'].map(end => italianFutureStem(infinitive, key) + end);
    if (id === 'condizionale-presente') return ['ei', 'esti', 'ebbe', 'emmo', 'este', 'ebbero'].map(end => italianFutureStem(infinitive, key) + end);
    if (id === 'congiuntivo-presente') return italianSubjPresent(infinitive, key);
    if (id === 'congiuntivo-imperfetto') return italianSubjImperfect(infinitive, key);
  }
  if (language === 'french') {
    if (id === 'present') return frenchPresent(infinitive, key);
    if (id === 'imparfait') return frenchImperfect(infinitive, key);
    if (id === 'futur-simple') return ['ai', 'as', 'a', 'ons', 'ez', 'ont'].map(end => frenchFutureStem(infinitive, key) + end);
    if (id === 'conditionnel-present') return ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'].map(end => frenchFutureStem(infinitive, key) + end);
    if (id === 'subjonctif-present') return frenchSubjPresent(infinitive, key);
  }
  if (language === 'spanish') {
    if (id === 'present') return spanishPresent(infinitive, key);
    if (id === 'preterite') return spanishPreterite(infinitive, key);
    if (id === 'imperfect') return spanishImperfect(infinitive, key);
    if (id === 'future') return ['é', 'ás', 'á', 'emos', 'éis', 'án'].map(end => spanishFutureStem(infinitive, key) + end);
    if (id === 'conditional') return ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'].map(end => spanishFutureStem(infinitive, key) + end);
    if (id === 'present-subjunctive') return spanishSubjPresent(infinitive, key);
    if (id === 'imperfect-subjunctive') return spanishImperfectSubj(infinitive, key);
  }
  return [];
}

type CompoundSpec = {
  auxiliaryTense: VerbTenseId;
  auxiliary: 'have' | 'be';
};

function compoundSpec(language: Language, key: string, infinitive: string, id: VerbTenseId): CompoundSpec | null {
  if (language === 'italian') {
    const auxiliary: CompoundSpec['auxiliary'] = new Set([
      'be', 'go', 'come', 'leave', 'fall', 'stay', 'arrive', 'return', 'enter', 'die',
    ]).has(key) || infinitive === 'essere' || infinitive === 'stare' ? 'be' : 'have';
    const specs: Partial<Record<VerbTenseId, VerbTenseId>> = {
      'passato-prossimo': 'present',
      'trapassato-prossimo': 'imperfetto',
      'futuro-anteriore': 'futuro-semplice',
      'condizionale-passato': 'condizionale-presente',
      'congiuntivo-passato': 'congiuntivo-presente',
      'congiuntivo-trapassato': 'congiuntivo-imperfetto',
    };
    return specs[id] ? { auxiliaryTense: specs[id]!, auxiliary } : null;
  }
  if (language === 'french') {
    const reflexive = infinitive.startsWith('se ');
    const auxiliary: CompoundSpec['auxiliary'] = reflexive || new Set([
      'be', 'go', 'come', 'leave', 'fall', 'stay', 'arrive', 'return', 'enter', 'die',
    ]).has(key) || infinitive.startsWith('être ') ? 'be' : 'have';
    const specs: Partial<Record<VerbTenseId, VerbTenseId>> = {
      'passe-compose': 'present',
      'plus-que-parfait': 'imparfait',
      'futur-anterieur': 'futur-simple',
      'conditionnel-passe': 'conditionnel-present',
      'subjonctif-passe': 'subjonctif-present',
    };
    return specs[id] ? { auxiliaryTense: specs[id]!, auxiliary } : null;
  }
  if (language === 'spanish') {
    const specs: Partial<Record<VerbTenseId, VerbTenseId>> = {
      'present-perfect': 'present',
      pluperfect: 'imperfect',
      'future-perfect': 'future',
      'conditional-perfect': 'conditional',
      'perfect-subjunctive': 'present-subjunctive',
      'pluperfect-subjunctive': 'imperfect-subjunctive',
    };
    return specs[id] ? { auxiliaryTense: specs[id]!, auxiliary: 'have' } : null;
  }
  return null;
}

function auxiliaryForms(language: Language, kind: 'have' | 'be', tense: VerbTenseId): string[] {
  if (language === 'italian') {
    const table: Record<string, Record<string, string[]>> = {
      present: {
        have: ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'],
        be: ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'],
      },
      imperfetto: {
        have: ['avevo', 'avevi', 'aveva', 'avevamo', 'avevate', 'avevano'],
        be: ['ero', 'eri', 'era', 'eravamo', 'eravate', 'erano'],
      },
      'futuro-semplice': {
        have: ['avrò', 'avrai', 'avrà', 'avremo', 'avrete', 'avranno'],
        be: ['sarò', 'sarai', 'sarà', 'saremo', 'sarete', 'saranno'],
      },
      'condizionale-presente': {
        have: ['avrei', 'avresti', 'avrebbe', 'avremmo', 'avreste', 'avrebbero'],
        be: ['sarei', 'saresti', 'sarebbe', 'saremmo', 'sareste', 'sarebbero'],
      },
      'congiuntivo-presente': {
        have: ['abbia', 'abbia', 'abbia', 'abbiamo', 'abbiate', 'abbiano'],
        be: ['sia', 'sia', 'sia', 'siamo', 'siate', 'siano'],
      },
      'congiuntivo-imperfetto': {
        have: ['avessi', 'avessi', 'avesse', 'avessimo', 'aveste', 'avessero'],
        be: ['fossi', 'fossi', 'fosse', 'fossimo', 'foste', 'fossero'],
      },
    };
    return table[tense]?.[kind] ?? [];
  }
  if (language === 'french') {
    const table: Record<string, Record<string, string[]>> = {
      present: {
        have: ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
        be: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'],
      },
      imparfait: {
        have: ['avais', 'avais', 'avait', 'avions', 'aviez', 'avaient'],
        be: ['étais', 'étais', 'était', 'étions', 'étiez', 'étaient'],
      },
      'futur-simple': {
        have: ['aurai', 'auras', 'aura', 'aurons', 'aurez', 'auront'],
        be: ['serai', 'seras', 'sera', 'serons', 'serez', 'seront'],
      },
      'conditionnel-present': {
        have: ['aurais', 'aurais', 'aurait', 'aurions', 'auriez', 'auraient'],
        be: ['serais', 'serais', 'serait', 'serions', 'seriez', 'seraient'],
      },
      'subjonctif-present': {
        have: ['aie', 'aies', 'ait', 'ayons', 'ayez', 'aient'],
        be: ['sois', 'sois', 'soit', 'soyons', 'soyez', 'soient'],
      },
    };
    return table[tense]?.[kind] ?? [];
  }
  const table: Record<string, string[]> = {
    present: ['he', 'has', 'ha', 'hemos', 'habéis', 'han'],
    imperfect: ['había', 'habías', 'había', 'habíamos', 'habíais', 'habían'],
    future: ['habré', 'habrás', 'habrá', 'habremos', 'habréis', 'habrán'],
    conditional: ['habría', 'habrías', 'habría', 'habríamos', 'habríais', 'habrían'],
    'present-subjunctive': ['haya', 'hayas', 'haya', 'hayamos', 'hayáis', 'hayan'],
    'imperfect-subjunctive': ['hubiera', 'hubieras', 'hubiera', 'hubiéramos', 'hubierais', 'hubieran'],
  };
  return kind === 'have' ? (table[tense] ?? []) : [];
}

function pastParticiple(language: Language, key: string, infinitive: string): string {
  const known = language === 'italian'
    ? IT_PARTICIPLES[key]
    : language === 'french'
      ? FR_PARTICIPLES[key]
      : ES_PARTICIPLES[key];
  if (known) return known;
  if (language === 'italian') {
    if (infinitive.endsWith('are')) return `${infinitive.slice(0, -3)}ato`;
    if (infinitive.endsWith('ere')) return `${infinitive.slice(0, -3)}uto`;
    if (infinitive.endsWith('ire')) return `${infinitive.slice(0, -3)}ito`;
  } else if (language === 'french') {
    if (infinitive.endsWith('er')) return `${infinitive.slice(0, -2)}é`;
    if (infinitive.endsWith('ir')) return `${infinitive.slice(0, -2)}i`;
    if (infinitive.endsWith('re')) return `${infinitive.slice(0, -2)}u`;
  } else {
    if (infinitive.endsWith('ar')) return `${infinitive.slice(0, -2)}ado`;
    if (infinitive.endsWith('er') || infinitive.endsWith('ir')) return `${infinitive.slice(0, -2)}ido`;
  }
  return infinitive;
}

function agreementVariants(
  language: Language,
  participle: string,
  personIndex: number,
  auxiliary: 'have' | 'be',
): string {
  if (auxiliary !== 'be' || language === 'spanish') return participle;
  const isFeminineSingular = (language === 'italian' || language === 'french') && personIndex === 3;
  const isPluralGroup = language === 'italian' ? personIndex >= 4 : personIndex === 6;
  if (language === 'italian') {
    if (isFeminineSingular) return participle.replace(/o$/, 'a');
    if (isPluralGroup) {
      const stem = participle.replace(/o$/, '');
      return `${stem}i/${stem}e`;
    }
    return participle;
  }
  if (isFeminineSingular) return `${participle}e`;
  if (isPluralGroup) return `${participle}s/${participle}es`;
  return participle;
}

function displayedPronoun(language: Language, personIndex: number): string {
  const value = VERB_PERSONS[language][personIndex].split(' · ')[0];
  return value;
}

function practicePronoun(language: Language, personIndex: number): string {
  if (language === 'french' && personIndex === 6) return 'ils';
  if (language === 'spanish' && personIndex === 2) return 'él';
  if (language === 'spanish' && personIndex === 3) return 'nosotros';
  if (language === 'spanish' && personIndex === 4) return 'vosotros';
  if (language === 'spanish' && personIndex === 5) return 'ellos';
  return displayedPronoun(language, personIndex);
}

function joinSubject(language: Language, personIndex: number, conjugated: string, practice = false): string {
  const subject = practice ? practicePronoun(language, personIndex) : displayedPronoun(language, personIndex);
  if (language === 'french' && subject === 'je' && /^[aeiouyàâäéèêëîïôöùûüœh]/i.test(conjugated)) {
    return `j'${conjugated}`;
  }
  return `${subject} ${conjugated}`.trim();
}

function compoundForms(
  language: Language,
  key: string,
  infinitive: string,
  id: VerbTenseId,
): string[] {
  const spec = compoundSpec(language, key, infinitive, id);
  if (!spec) return [];
  const auxiliary = auxiliaryForms(language, spec.auxiliary, spec.auxiliaryTense);
  const participle = pastParticiple(language, key, infinitive);
  return VERB_PERSONS[language].map((_, personIndex) => {
    const simpleIndex = simpleMap(language)[personIndex];
    const agreed = agreementVariants(language, participle, personIndex, spec.auxiliary);
    const reflexive = language === 'french' && infinitive.startsWith('se ')
      ? ['me ', 'te ', 'se ', 'se ', 'nous ', 'vous ', 'se '][personIndex]
      : '';
    return joinSubject(language, personIndex, `${reflexive}${auxiliary[simpleIndex]} ${agreed}`.trim());
  });
}

function conjugate(language: 'italian' | 'french' | 'spanish', key: string, infinitive: string, id: VerbTenseId): string[] {
  const composite = compoundForms(language, key, infinitive, id);
  if (composite.length) return composite;
  let base = simpleForms(language, key, infinitive, id);
  if (!base.length) return [];
  if (language === 'french' && infinitive.startsWith('se ')) {
    const reflexive = ['me ', 'te ', 'se ', 'se ', 'nous ', 'vous ', 'se '];
    base = VERB_PERSONS.french.map((_, index) => `${reflexive[index]}${base[FR_PERSON_MAP[index]]}`.trim());
  }
  return VERB_PERSONS[language].map((_, personIndex) => {
    const value = base[simpleMap(language)[personIndex]];
    return joinSubject(language, personIndex, value);
  });
}

function makePracticeForms(language: Language, forms: string[]): string[] {
  return forms.map((fullForm, personIndex) => {
    const practiceSubject = practicePronoun(language, personIndex);
    const displaySubject = displayedPronoun(language, personIndex);
    let bare = fullForm;
    if (displaySubject !== practiceSubject && displaySubject.includes('/')) {
      bare = fullForm.replace(displaySubject, practiceSubject);
    }
    if (bare.startsWith(`${practiceSubject} `)) {
      bare = bare.slice(practiceSubject.length + 1);
    } else if (bare.startsWith("j'")) {
      bare = fullForm.slice(2);
    }
    if (bare.includes('/')) {
      const parts = bare.split('/');
      bare = personIndex === 3 ? (parts[1] ?? parts[0]) : parts[0];
    }
    return joinSubject(language, personIndex, bare.trim(), true);
  });
}

const IRREGULAR_KEYS: Record<'italian' | 'french' | 'spanish', Set<string>> = {
  italian: IT_IRREGULAR_KEYS,
  french: FR_IRREGULAR_KEYS,
  spanish: ES_IRREGULAR_KEYS,
};

export function getVerbLessons(
  language: Language,
  tenseId: VerbTenseId,
): Record<VerbPattern, VerbCurriculumLesson[]> {
  if (language === 'armenian') {
    if (tenseId !== 'armenian-present') return { regular: [], irregular: [] };
    return {
      regular: VERB_LESSONS.armenian.regular.map(lesson => ({
        ...lesson,
        forms: [...lesson.forms],
        practiceForms: [...lesson.forms],
      })),
      irregular: VERB_LESSONS.armenian.irregular.map(lesson => ({
        ...lesson,
        forms: [...lesson.forms],
        practiceForms: [...lesson.forms],
      })),
    };
  }
  if (!VERB_TENSES[language].some(tense => tense.id === tenseId)) {
    return { regular: [], irregular: [] };
  }

  const category = CATEGORIES.find(item => item.id === 'verbs');
  const categoryPairs = category?.levels.flatMap(level => level.pairs) ?? [];
  const seenEnglish = new Set<string>();
  const source = categoryPairs.flatMap(pair => {
    const key = cleanEnglish(pair.english);
    if (!key || seenEnglish.has(key)) return [];
    seenEnglish.add(key);
    const override = CANONICAL[language][key];
    const infinitive = (override ?? pair.translations[language]).trim();
    return [{ key, english: `to ${key}`, infinitive }];
  });
  const supplemental = SUPPLEMENTAL_VERBS[language]
    .filter(verb => !seenEnglish.has(verb.key))
    .map(verb => ({
      key: verb.key,
      english: `to ${verb.key}`,
      infinitive: verb.infinitive,
    }));
  const lessons = [...source, ...supplemental].flatMap(verb => {
    const forms = conjugate(language, verb.key, verb.infinitive, tenseId);
    if (forms.length !== VERB_PERSONS[language].length || forms.some(form => !form.trim())) return [];
    const practiceForms = makePracticeForms(language, forms);
    const pattern: VerbPattern = IRREGULAR_KEYS[language].has(verb.key) ? 'irregular' : 'regular';
    return [{
      infinitive: verb.infinitive,
      english: verb.english,
      pattern,
      forms,
      practiceForms,
    }];
  });

  return {
    regular: lessons.filter(lesson => lesson.pattern === 'regular'),
    irregular: lessons.filter(lesson => lesson.pattern === 'irregular'),
  };
}

export function getPracticeVerbForm(lesson: VerbCurriculumLesson, personIndex: number): string {
  return lesson.practiceForms[personIndex] ?? lesson.forms[personIndex] ?? '';
}

export function getTenseOption(language: Language, id: VerbTenseId): VerbTenseOption | undefined {
  return VERB_TENSES[language].find(tense => tense.id === id);
}
