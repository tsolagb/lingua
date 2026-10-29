export type ReadingPracticeLanguage = 'italian' | 'french' | 'spanish' | 'armenian';

export interface ReadingPracticeSentence {
  english: string;
  translations: Record<ReadingPracticeLanguage, string>;
}

export interface ReadingPracticePassage {
  id: string;
  title: string;
  level: number;
  levelName: string;
  sentences: ReadingPracticeSentence[];
}

export const READING_PRACTICE_PASSAGES: ReadingPracticePassage[] = [
  {
    id: 'morning',
    title: 'My morning',
    level: 1,
    levelName: 'Beginner',
    sentences: [
      {
        english: 'I wake up early.',
        translations: {
          italian: 'Mi sveglio presto.',
          french: 'Je me réveille tôt.',
          spanish: 'Me despierto temprano.',
          armenian: 'Ես կանուխ կը զարթնամ։',
        },
      },
      {
        english: 'I open the window.',
        translations: {
          italian: 'Apro la finestra.',
          french: "J'ouvre la fenêtre.",
          spanish: 'Abro la ventana.',
          armenian: 'Պատուհանը կը բանամ։',
        },
      },
      {
        english: 'The morning air is cool.',
        translations: {
          italian: "L'aria del mattino è fresca.",
          french: "L'air du matin est frais.",
          spanish: 'El aire de la mañana está fresco.',
          armenian: 'Առաւօտեան օդը զով է։',
        },
      },
      {
        english: 'Then I make tea and read a book.',
        translations: {
          italian: 'Poi preparo il tè e leggo un libro.',
          french: 'Ensuite, je prépare du thé et je lis un livre.',
          spanish: 'Luego preparo té y leo un libro.',
          armenian: 'Ապա թեյ կը պատրաստեմ եւ գիրք մը կը կարդամ։',
        },
      },
    ],
  },
  {
    id: 'cafe',
    title: 'At the café',
    level: 2,
    levelName: 'Beginner',
    sentences: [
      {
        english: 'I enter the café and ask for a table.',
        translations: {
          italian: 'Entro al bar e chiedo un tavolo.',
          french: 'J’entre dans le café et je demande une table.',
          spanish: 'Entro en el café y pido una mesa.',
          armenian: 'Սրճարան կը մտնեմ եւ սեղան մը կը խնդրեմ։',
        },
      },
      {
        english: 'I would like a coffee and a glass of water.',
        translations: {
          italian: 'Vorrei un caffè e un bicchiere d’acqua.',
          french: 'Je voudrais un café et un verre d’eau.',
          spanish: 'Quisiera un café y un vaso de agua.',
          armenian: 'Սուրճ մը եւ ջուրի գաւաթ մը կ’ուզեմ։',
        },
      },
      {
        english: 'The server brings my order.',
        translations: {
          italian: 'Il cameriere porta il mio ordine.',
          french: 'Le serveur apporte ma commande.',
          spanish: 'El camarero trae mi pedido.',
          armenian: 'Մատուցողը պատուէրս կը բերէ։',
        },
      },
      {
        english: 'I say thank you and enjoy breakfast.',
        translations: {
          italian: 'Dico grazie e mi godo la colazione.',
          french: 'Je dis merci et je profite du petit-déjeuner.',
          spanish: 'Doy las gracias y disfruto del desayuno.',
          armenian: 'Շնորհակալութիւն կը յայտնեմ եւ նախաճաշս կը վայելեմ։',
        },
      },
    ],
  },
  {
    id: 'station',
    title: 'Finding the station',
    level: 3,
    levelName: 'Elementary',
    sentences: [
      {
        english: 'Excuse me, where is the train station?',
        translations: {
          italian: 'Mi scusi, dov’è la stazione ferroviaria?',
          french: 'Excusez-moi, où se trouve la gare ?',
          spanish: 'Disculpe, ¿dónde está la estación de tren?',
          armenian: 'Ներեցէ՛ք, երկաթուղիի կայարանը ո՞ւր է։',
        },
      },
      {
        english: 'Go straight and turn left at the bridge.',
        translations: {
          italian: 'Vada dritto e giri a sinistra al ponte.',
          french: 'Allez tout droit et tournez à gauche au pont.',
          spanish: 'Siga recto y gire a la izquierda en el puente.',
          armenian: 'Ուղիղ գացէ՛ք եւ կամուրջին քով ձախ դարձէ՛ք։',
        },
      },
      {
        english: 'The station is next to the city park.',
        translations: {
          italian: 'La stazione è accanto al parco cittadino.',
          french: 'La gare est à côté du parc municipal.',
          spanish: 'La estación está al lado del parque de la ciudad.',
          armenian: 'Կայարանը քաղաքային պարտէզին քով է։',
        },
      },
      {
        english: 'I buy a ticket and wait on the platform.',
        translations: {
          italian: 'Compro un biglietto e aspetto sul binario.',
          french: 'J’achète un billet et j’attends sur le quai.',
          spanish: 'Compro un billete y espero en el andén.',
          armenian: 'Տոմս մը կը գնեմ եւ կառամատոյցին վրայ կը սպասեմ։',
        },
      },
    ],
  },
  {
    id: 'sunday',
    title: 'A quiet Sunday',
    level: 4,
    levelName: 'Elementary',
    sentences: [
      {
        english: 'On Sunday, I visit the church with my family.',
        translations: {
          italian: 'La domenica vado in chiesa con la mia famiglia.',
          french: 'Le dimanche, je vais à l’église avec ma famille.',
          spanish: 'El domingo voy a la iglesia con mi familia.',
          armenian: 'Կիրակի օրը ընտանիքիս հետ եկեղեցի կ’երթամ։',
        },
      },
      {
        english: 'We sit quietly and listen to the choir.',
        translations: {
          italian: 'Ci sediamo in silenzio e ascoltiamo il coro.',
          french: 'Nous nous asseyons en silence et écoutons la chorale.',
          spanish: 'Nos sentamos en silencio y escuchamos al coro.',
          armenian: 'Լուռ կը նստինք եւ երգչախումբին մտիկ կ’ընենք։',
        },
      },
      {
        english: 'After the service, we talk outside.',
        translations: {
          italian: 'Dopo la funzione, parliamo fuori.',
          french: 'Après le service, nous parlons dehors.',
          spanish: 'Después del servicio, hablamos afuera.',
          armenian: 'Պաշտամունքէն ետք դուրսը կը խօսինք։',
        },
      },
      {
        english: 'Then we walk home together.',
        translations: {
          italian: 'Poi torniamo a casa insieme.',
          french: 'Puis, nous rentrons à pied ensemble.',
          spanish: 'Luego caminamos juntos a casa.',
          armenian: 'Ապա միասին տուն կը քալենք։',
        },
      },
    ],
  },
  {
    id: 'tomorrow',
    title: 'Yesterday and tomorrow',
    level: 5,
    levelName: 'Intermediate',
    sentences: [
      {
        english: 'Yesterday it rained, so I spent the day at home.',
        translations: {
          italian: 'Ieri ha piovuto, quindi ho passato la giornata a casa.',
          french: 'Hier, il a plu, alors j’ai passé la journée à la maison.',
          spanish: 'Ayer llovió, así que pasé el día en casa.',
          armenian: 'Երէկ անձրեւեց, ուստի օրը տունը անցուցի։',
        },
      },
      {
        english: 'I made soup and called my friend.',
        translations: {
          italian: 'Ho preparato una zuppa e ho chiamato un amico.',
          french: 'J’ai préparé une soupe et j’ai appelé mon ami.',
          spanish: 'Preparé sopa y llamé a mi amigo.',
          armenian: 'Ապուր պատրաստեցի եւ բարեկամիս հեռաձայնեցի։',
        },
      },
      {
        english: 'Tomorrow there will be sunshine.',
        translations: {
          italian: 'Domani ci sarà il sole.',
          french: 'Demain, il y aura du soleil.',
          spanish: 'Mañana hará sol.',
          armenian: 'Վաղը արեւ պիտի ըլլայ։',
        },
      },
      {
        english: 'We will walk together beside the river.',
        translations: {
          italian: 'Cammineremo insieme lungo il fiume.',
          french: 'Nous marcherons ensemble le long de la rivière.',
          spanish: 'Caminaremos juntos junto al río.',
          armenian: 'Գետին քով միասին պիտի քալենք։',
        },
      },
    ],
  },
];

export const READING_SPEECH_TAGS: Record<ReadingPracticeLanguage, string> = {
  italian: 'it-IT',
  french: 'fr-FR',
  spanish: 'es-ES',
  armenian: 'hy-AM',
};

export function hasSpeechVoiceForLanguage(
  voices: readonly { language: string }[],
  language: ReadingPracticeLanguage,
): boolean {
  const requestedLanguage = READING_SPEECH_TAGS[language].split('-')[0].toLowerCase();
  return voices.some(voice =>
    voice.language
      .replace(/_/g, '-')
      .toLowerCase()
      .split('-')[0] === requestedLanguage,
  );
}
