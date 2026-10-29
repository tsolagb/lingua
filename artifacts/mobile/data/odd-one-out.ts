import type { Language } from './vocabulary';

/**
 * Hand-authored Odd One Out sets. Every set is exactly 3 members of one verified
 * class + 1 member of a different class. Classification is explicit metadata,
 * never inferred at runtime, so there is only ever one defensible answer.
 */
export type OddKind = 'meaning' | 'gender' | 'number' | 'tense' | 'wordtype';
export interface OddWord { word: string; english: string }
export interface OddSet {
  id: string;
  kind: OddKind;
  /** Class shared by the three matching words. */
  groupLabel: string;
  /** Class of the odd word. */
  oddLabel: string;
  words: [OddWord, OddWord, OddWord, OddWord];
  /** Index (0-3) of the odd word in `words`. */
  odd: number;
  why: string;
  /** Natural context sentence for grammatical sets (review key). */
  context?: { english: string; target: string };
}

const W = (word: string, english: string): OddWord => ({ word, english });
type Row = Omit<OddSet, 'id'>;

const DATA: Record<Language, Row[]> = {
  italian: [
    { kind: 'meaning', groupLabel: 'Fruit', oddLabel: 'Furniture', words: [W('mela', 'apple'), W('pera', 'pear'), W('sedia', 'chair'), W('banana', 'banana')], odd: 2, why: 'Mela, pera and banana are fruit. Sedia is a chair.' },
    { kind: 'meaning', groupLabel: 'Animals', oddLabel: 'Furniture', words: [W('cane', 'dog'), W('tavolo', 'table'), W('gatto', 'cat'), W('cavallo', 'horse')], odd: 1, why: 'Cane, gatto and cavallo are animals. Tavolo is a table.' },
    { kind: 'meaning', groupLabel: 'Colors', oddLabel: 'Food', words: [W('rosso', 'red'), W('blu', 'blue'), W('verde', 'green'), W('pane', 'bread')], odd: 3, why: 'Rosso, blu and verde are colors. Pane is bread.' },
    { kind: 'meaning', groupLabel: 'Days', oddLabel: 'Season', words: [W('estate', 'summer'), W('lunedì', 'Monday'), W('martedì', 'Tuesday'), W('venerdì', 'Friday')], odd: 0, why: 'Lunedì, martedì and venerdì are days of the week. Estate is a season.' },
    { kind: 'meaning', groupLabel: 'Family', oddLabel: 'Transport', words: [W('madre', 'mother'), W('padre', 'father'), W('treno', 'train'), W('fratello', 'brother')], odd: 2, why: 'Madre, padre and fratello are family members. Treno is a train.' },
    { kind: 'meaning', groupLabel: 'Transport', oddLabel: 'Room', words: [W('autobus', 'bus'), W('aereo', 'airplane'), W('nave', 'ship'), W('cucina', 'kitchen')], odd: 3, why: 'Autobus, aereo and nave are ways to travel. Cucina is a room.' },
    { kind: 'gender', groupLabel: 'Masculine', oddLabel: 'Feminine', words: [W('libro', 'book'), W('finestra', 'window'), W('ragazzo', 'boy'), W('vino', 'wine')], odd: 1, why: 'Il libro, il ragazzo, il vino are masculine. La finestra is feminine.', context: { english: 'I open the window.', target: 'Apro la finestra.' } },
    { kind: 'gender', groupLabel: 'Feminine', oddLabel: 'Masculine', words: [W('casa', 'house'), W('scuola', 'school'), W('mela', 'apple'), W('piatto', 'plate')], odd: 3, why: 'La casa, la scuola, la mela are feminine. Il piatto is masculine.', context: { english: 'The plate is on the table.', target: 'Il piatto è sul tavolo.' } },
    { kind: 'tense', groupLabel: 'Past (passato prossimo)', oddLabel: 'Future', words: [W('ho mangiato', 'I ate'), W('sono andato', 'I went'), W('mangerò', 'I will eat'), W('ho visto', 'I saw')], odd: 2, why: 'Three use avere/essere + participle for a finished past action. Mangerò is future.', context: { english: 'Tomorrow I will eat pizza.', target: 'Domani mangerò la pizza.' } },
    { kind: 'tense', groupLabel: 'Future', oddLabel: 'Imperfect (past)', words: [W('partirò', 'I will leave'), W('parlavo', 'I was speaking'), W('vedrò', 'I will see'), W('visiterò', 'I will visit')], odd: 1, why: 'The -rò endings mark the future. Parlavo is the imperfect past.', context: { english: 'I was speaking with Maria.', target: 'Parlavo con Maria.' } },
    { kind: 'wordtype', groupLabel: 'Verbs', oddLabel: 'Adjective', words: [W('correre', 'to run'), W('mangiare', 'to eat'), W('felice', 'happy'), W('dormire', 'to sleep')], odd: 2, why: 'The -are/-ere/-ire endings mark infinitive verbs. Felice is an adjective.' },
    { kind: 'wordtype', groupLabel: 'Adjectives', oddLabel: 'Verb', words: [W('grande', 'big'), W('piccolo', 'small'), W('bello', 'beautiful'), W('parlare', 'to speak')], odd: 3, why: 'Grande, piccolo and bello describe nouns. Parlare is a verb.' },
  ],
  french: [
    { kind: 'meaning', groupLabel: 'Fruit', oddLabel: 'Furniture', words: [W('pomme', 'apple'), W('poire', 'pear'), W('chaise', 'chair'), W('banane', 'banana')], odd: 2, why: 'Pomme, poire and banane are fruit. Chaise is a chair.' },
    { kind: 'meaning', groupLabel: 'Animals', oddLabel: 'Furniture', words: [W('chien', 'dog'), W('table', 'table'), W('chat', 'cat'), W('cheval', 'horse')], odd: 1, why: 'Chien, chat and cheval are animals. Table is furniture.' },
    { kind: 'meaning', groupLabel: 'Colors', oddLabel: 'Food', words: [W('rouge', 'red'), W('bleu', 'blue'), W('vert', 'green'), W('pain', 'bread')], odd: 3, why: 'Rouge, bleu and vert are colors. Pain is bread.' },
    { kind: 'meaning', groupLabel: 'Days', oddLabel: 'Season', words: [W('été', 'summer'), W('lundi', 'Monday'), W('mardi', 'Tuesday'), W('vendredi', 'Friday')], odd: 0, why: 'Lundi, mardi and vendredi are days. Été is a season.' },
    { kind: 'meaning', groupLabel: 'Family', oddLabel: 'Transport', words: [W('mère', 'mother'), W('père', 'father'), W('train', 'train'), W('frère', 'brother')], odd: 2, why: 'Mère, père and frère are family. Train is transport.' },
    { kind: 'meaning', groupLabel: 'Transport', oddLabel: 'Room', words: [W('bus', 'bus'), W('avion', 'airplane'), W('bateau', 'boat'), W('cuisine', 'kitchen')], odd: 3, why: 'Bus, avion and bateau are ways to travel. Cuisine is a room.' },
    { kind: 'gender', groupLabel: 'Masculine', oddLabel: 'Feminine', words: [W('livre', 'book'), W('fenêtre', 'window'), W('garçon', 'boy'), W('vin', 'wine')], odd: 1, why: 'Le livre, le garçon, le vin are masculine. La fenêtre is feminine.', context: { english: 'I open the window.', target: 'J’ouvre la fenêtre.' } },
    { kind: 'gender', groupLabel: 'Feminine', oddLabel: 'Masculine', words: [W('maison', 'house'), W('école', 'school'), W('pomme', 'apple'), W('chien', 'dog')], odd: 3, why: 'La maison, l’école, la pomme are feminine. Le chien is masculine.', context: { english: 'The dog sleeps.', target: 'Le chien dort.' } },
    { kind: 'tense', groupLabel: 'Passé composé', oddLabel: 'Future', words: [W('j’ai mangé', 'I ate'), W('je suis allé', 'I went'), W('je mangerai', 'I will eat'), W('j’ai vu', 'I saw')], odd: 2, why: 'Three use avoir/être + participle for a finished past action. Je mangerai is future.', context: { english: 'Tomorrow I will eat pizza.', target: 'Demain, je mangerai une pizza.' } },
    { kind: 'tense', groupLabel: 'Future', oddLabel: 'Imperfect (past)', words: [W('je partirai', 'I will leave'), W('je parlais', 'I was speaking'), W('je verrai', 'I will see'), W('je visiterai', 'I will visit')], odd: 1, why: 'The -rai endings mark the future. Je parlais is the imperfect.', context: { english: 'I was speaking with Marie.', target: 'Je parlais avec Marie.' } },
    { kind: 'wordtype', groupLabel: 'Verbs', oddLabel: 'Adjective', words: [W('courir', 'to run'), W('manger', 'to eat'), W('heureux', 'happy'), W('dormir', 'to sleep')], odd: 2, why: 'Courir, manger and dormir are infinitive verbs. Heureux is an adjective.' },
    { kind: 'wordtype', groupLabel: 'Adjectives', oddLabel: 'Verb', words: [W('grand', 'big'), W('petit', 'small'), W('beau', 'beautiful'), W('parler', 'to speak')], odd: 3, why: 'Grand, petit and beau describe nouns. Parler is a verb.' },
  ],
  spanish: [
    { kind: 'meaning', groupLabel: 'Fruit', oddLabel: 'Furniture', words: [W('manzana', 'apple'), W('pera', 'pear'), W('silla', 'chair'), W('plátano', 'banana')], odd: 2, why: 'Manzana, pera and plátano are fruit. Silla is a chair.' },
    { kind: 'meaning', groupLabel: 'Animals', oddLabel: 'Furniture', words: [W('perro', 'dog'), W('mesa', 'table'), W('gato', 'cat'), W('caballo', 'horse')], odd: 1, why: 'Perro, gato and caballo are animals. Mesa is a table.' },
    { kind: 'meaning', groupLabel: 'Colors', oddLabel: 'Food', words: [W('rojo', 'red'), W('azul', 'blue'), W('verde', 'green'), W('pan', 'bread')], odd: 3, why: 'Rojo, azul and verde are colors. Pan is bread.' },
    { kind: 'meaning', groupLabel: 'Days', oddLabel: 'Season', words: [W('verano', 'summer'), W('lunes', 'Monday'), W('martes', 'Tuesday'), W('viernes', 'Friday')], odd: 0, why: 'Lunes, martes and viernes are days. Verano is a season.' },
    { kind: 'meaning', groupLabel: 'Family', oddLabel: 'Transport', words: [W('madre', 'mother'), W('padre', 'father'), W('tren', 'train'), W('hermano', 'brother')], odd: 2, why: 'Madre, padre and hermano are family. Tren is a train.' },
    { kind: 'meaning', groupLabel: 'Transport', oddLabel: 'Room', words: [W('autobús', 'bus'), W('avión', 'airplane'), W('barco', 'boat'), W('cocina', 'kitchen')], odd: 3, why: 'Autobús, avión and barco are ways to travel. Cocina is a room.' },
    { kind: 'gender', groupLabel: 'Masculine', oddLabel: 'Feminine', words: [W('libro', 'book'), W('ventana', 'window'), W('chico', 'boy'), W('vino', 'wine')], odd: 1, why: 'El libro, el chico, el vino are masculine. La ventana is feminine.', context: { english: 'I open the window.', target: 'Abro la ventana.' } },
    { kind: 'gender', groupLabel: 'Feminine', oddLabel: 'Masculine', words: [W('casa', 'house'), W('escuela', 'school'), W('manzana', 'apple'), W('plato', 'plate')], odd: 3, why: 'La casa, la escuela, la manzana are feminine. El plato is masculine.', context: { english: 'The plate is on the table.', target: 'El plato está en la mesa.' } },
    { kind: 'tense', groupLabel: 'Preterite (past)', oddLabel: 'Future', words: [W('comí', 'I ate'), W('fui', 'I went'), W('comeré', 'I will eat'), W('vi', 'I saw')], odd: 2, why: 'Comí, fui and vi are finished past actions. Comeré is future.', context: { english: 'Tomorrow I will eat pizza.', target: 'Mañana comeré pizza.' } },
    { kind: 'tense', groupLabel: 'Future', oddLabel: 'Imperfect (past)', words: [W('saldré', 'I will leave'), W('hablaba', 'I was speaking'), W('veré', 'I will see'), W('visitaré', 'I will visit')], odd: 1, why: 'The -ré endings mark the future. Hablaba is the imperfect past.', context: { english: 'I was speaking with María.', target: 'Hablaba con María.' } },
    { kind: 'wordtype', groupLabel: 'Verbs', oddLabel: 'Adjective', words: [W('correr', 'to run'), W('comer', 'to eat'), W('feliz', 'happy'), W('dormir', 'to sleep')], odd: 2, why: 'Correr, comer and dormir are infinitive verbs. Feliz is an adjective.' },
    { kind: 'wordtype', groupLabel: 'Adjectives', oddLabel: 'Verb', words: [W('grande', 'big'), W('pequeño', 'small'), W('bonito', 'pretty'), W('hablar', 'to speak')], odd: 3, why: 'Grande, pequeño and bonito describe nouns. Hablar is a verb.' },
  ],
  armenian: [
    { kind: 'meaning', groupLabel: 'Fruit', oddLabel: 'Furniture', words: [W('խնձոր', 'apple'), W('տանձ', 'pear'), W('աթոռ', 'chair'), W('խաղող', 'grape')], odd: 2, why: 'Խնձոր, տանձ and խաղող are fruit. Աթոռ is a chair.' },
    { kind: 'meaning', groupLabel: 'Animals', oddLabel: 'Furniture', words: [W('շուն', 'dog'), W('սեղան', 'table'), W('կատու', 'cat'), W('ձի', 'horse')], odd: 1, why: 'Շուն, կատու and ձի are animals. Սեղան is a table.' },
    { kind: 'meaning', groupLabel: 'Colors', oddLabel: 'Food', words: [W('կարմիր', 'red'), W('կապոյտ', 'blue'), W('կանաչ', 'green'), W('հաց', 'bread')], odd: 3, why: 'Կարմիր, կապոյտ and կանաչ are colors. Հաց is bread.' },
    { kind: 'meaning', groupLabel: 'Days', oddLabel: 'Season', words: [W('ամառ', 'summer'), W('Երկուշաբթի', 'Monday'), W('Երեքշաբթի', 'Tuesday'), W('Ուրբաթ', 'Friday')], odd: 0, why: 'Երկուշաբթի, Երեքշաբթի and Ուրբաթ are days. Ամառ is a season.' },
    { kind: 'meaning', groupLabel: 'Family', oddLabel: 'Food', words: [W('մայր', 'mother'), W('հայր', 'father'), W('պանիր', 'cheese'), W('եղբայր', 'brother')], odd: 2, why: 'Մայր, հայր and եղբայր are family. Պանիր is cheese.' },
    { kind: 'meaning', groupLabel: 'Transport', oddLabel: 'Room', words: [W('օդանաւ', 'airplane'), W('նաւ', 'ship'), W('ինքնաշարժ', 'car'), W('խոհանոց', 'kitchen')], odd: 3, why: 'Օդանաւ, նաւ and ինքնաշարժ carry you places. Խոհանոց is a kitchen.' },
    { kind: 'number', groupLabel: 'Plural', oddLabel: 'Singular', words: [W('տուներ', 'houses'), W('շուն', 'dog'), W('գիրքեր', 'books'), W('կատուներ', 'cats')], odd: 1, why: 'Armenian has no gender. The -եր / -ներ ending marks plural; շուն is singular.', context: { english: 'The dog is at home.', target: 'Շունը տունն է։' } },
    { kind: 'number', groupLabel: 'Singular', oddLabel: 'Plural', words: [W('գիրք', 'book'), W('տուն', 'house'), W('աթոռներ', 'chairs'), W('սեղան', 'table')], odd: 2, why: 'Գիրք, տուն and սեղան are singular. Աթոռներ has the plural -ներ ending.', context: { english: 'The chairs are new.', target: 'Աթոռները նոր են։' } },
    { kind: 'tense', groupLabel: 'Present (կը …)', oddLabel: 'Past', words: [W('կը խմեմ', 'I drink'), W('կը կարդամ', 'I read'), W('խմեցի', 'I drank'), W('կ’երթամ', 'I go')], odd: 2, why: 'The particle կը / կ’ marks the present. Խմեցի is the simple past.', context: { english: 'Yesterday I drank coffee.', target: 'Երէկ սուրճ խմեցի։' } },
    { kind: 'tense', groupLabel: 'Simple past', oddLabel: 'Future', words: [W('կերայ', 'I ate'), W('պիտի խմեմ', 'I will drink'), W('տեսայ', 'I saw'), W('դիտեցի', 'I watched')], odd: 1, why: 'Կերայ, տեսայ and դիտեցի are finished past actions. Պիտի marks the future.', context: { english: 'Tomorrow I will drink tea.', target: 'Վաղը թէյ պիտի խմեմ։' } },
    { kind: 'wordtype', groupLabel: 'Verbs', oddLabel: 'Adjective', words: [W('ուտել', 'to eat'), W('խմել', 'to drink'), W('մեծ', 'big'), W('կարդալ', 'to read')], odd: 2, why: 'The -ել / -ալ endings mark infinitive verbs. Մեծ is an adjective.' },
    { kind: 'wordtype', groupLabel: 'Adjectives', oddLabel: 'Verb', words: [W('պզտիկ', 'small'), W('գեղեցիկ', 'beautiful'), W('նոր', 'new'), W('խօսիլ', 'to speak')], odd: 3, why: 'Պզտիկ, գեղեցիկ and նոր describe nouns. Խօսիլ is a verb.' },
  ],
};

export function getOddSets(language: Language): OddSet[] {
  return DATA[language].map((row, i) => ({ ...row, id: `odd-${language}-${i}` }));
}

export const ODD_KIND_LABEL: Record<OddKind, string> = {
  meaning: 'Meaning', gender: 'Gender', number: 'Number', tense: 'Tense', wordtype: 'Word type',
};
