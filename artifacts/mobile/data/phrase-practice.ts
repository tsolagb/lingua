export type PhraseLanguage = 'italian' | 'french' | 'spanish' | 'armenian';
export type PhraseLevelId = 'simple' | 'casual' | 'native';

export interface PhrasePracticeItem {
  id: string;
  meaning: string;
  translations: Record<PhraseLanguage, string>;
  usageNotes?: Partial<Record<PhraseLanguage, string>>;
}

export interface PhrasePracticeLevel {
  id: PhraseLevelId;
  title: string;
  description: string;
  phrases: PhrasePracticeItem[];
}

export const PHRASE_PRACTICE_LEVELS: PhrasePracticeLevel[] = [
  {
    id: 'simple',
    title: 'Simple phrases',
    description: 'Polite phrases for greetings, requests, and everyday needs.',
    phrases: [
      {
        id: 'hello',
        meaning: 'Hello.',
        translations: {
          italian: 'Salve.',
          french: 'Bonjour.',
          spanish: 'Hola.',
          armenian: 'Բարեւ ձեզ։',
        },
      },
      {
        id: 'good-morning',
        meaning: 'Good morning.',
        translations: {
          italian: 'Buongiorno.',
          french: 'Bonjour.',
          spanish: 'Buenos días.',
          armenian: 'Բարի լոյս։',
        },
      },
      {
        id: 'please',
        meaning: 'Please.',
        translations: {
          italian: 'Per favore.',
          french: 'S’il vous plaît.',
          spanish: 'Por favor.',
          armenian: 'Խնդրեմ։',
        },
      },
      {
        id: 'thank-you',
        meaning: 'Thank you.',
        translations: {
          italian: 'Grazie.',
          french: 'Merci.',
          spanish: 'Gracias.',
          armenian: 'Շնորհակալութիւն։',
        },
      },
      {
        id: 'youre-welcome',
        meaning: 'You’re welcome.',
        translations: {
          italian: 'Prego.',
          french: 'Je vous en prie.',
          spanish: 'De nada.',
          armenian: 'Խնդրեմ։',
        },
      },
      {
        id: 'excuse-me',
        meaning: 'Excuse me.',
        translations: {
          italian: 'Mi scusi.',
          french: 'Excusez-moi.',
          spanish: 'Disculpe.',
          armenian: 'Ներեցէ՛ք։',
        },
      },
      {
        id: 'dont-understand',
        meaning: 'I don’t understand.',
        translations: {
          italian: 'Non capisco.',
          french: 'Je ne comprends pas.',
          spanish: 'No entiendo.',
          armenian: 'Չեմ հասկնար։',
        },
      },
      {
        id: 'help-me',
        meaning: 'Could you help me?',
        translations: {
          italian: 'Potrebbe aiutarmi?',
          french: 'Pourriez-vous m’aider ?',
          spanish: '¿Podría ayudarme?',
          armenian: 'Կրնա՞ք ինծի օգնել։',
        },
      },
    ],
  },
  {
    id: 'casual',
    title: 'Casual phrases',
    description: 'Relaxed expressions for conversations with friends.',
    phrases: [
      {
        id: 'how-going',
        meaning: 'How’s it going?',
        translations: {
          italian: 'Come va?',
          french: 'Ça va ?',
          spanish: '¿Qué tal?',
          armenian: 'Ի՞նչ կայ-չկայ։',
        },
      },
      {
        id: 'no-worries',
        meaning: 'No worries.',
        translations: {
          italian: 'Non ti preoccupare.',
          french: 'T’inquiète.',
          spanish: 'No te preocupes.',
          armenian: 'Հոգ մի՛ ըներ։',
        },
      },
      {
        id: 'sounds-good',
        meaning: 'That sounds good.',
        translations: {
          italian: 'Mi sembra una buona idea.',
          french: 'Ça me va.',
          spanish: 'Me parece bien.',
          armenian: 'Լաւ է, կը համաձայնիմ։',
        },
      },
      {
        id: 'see-you-later',
        meaning: 'See you later.',
        translations: {
          italian: 'A dopo!',
          french: 'À plus tard !',
          spanish: '¡Hasta luego!',
          armenian: 'Կը տեսնուինք։',
        },
      },
      {
        id: 'on-my-way',
        meaning: 'I’m on my way.',
        translations: {
          italian: 'Sto arrivando.',
          french: 'J’arrive.',
          spanish: 'Ya voy.',
          armenian: 'Ճամբայ ելայ։',
        },
      },
      {
        id: 'what-doing',
        meaning: 'What are you up to?',
        translations: {
          italian: 'Che fai?',
          french: 'Tu fais quoi ?',
          spanish: '¿Qué haces?',
          armenian: 'Ի՞նչ կ’ընես։',
        },
      },
      {
        id: 'grab-food',
        meaning: 'Let’s get something to eat.',
        translations: {
          italian: 'Andiamo a mangiare qualcosa.',
          french: 'On va manger un truc ?',
          spanish: 'Vamos a comer algo.',
          armenian: 'Եկ բան մը ուտենք։',
        },
      },
      {
        id: 'i-dont-mind',
        meaning: 'I don’t mind.',
        translations: {
          italian: 'Per me va bene tutto.',
          french: 'Ça m’est égal.',
          spanish: 'Me da igual.',
          armenian: 'Ինծի համար միեւնոյնն է։',
        },
        usageNotes: {
          french: 'In French, this can sound indifferent depending on tone.',
          spanish: 'In Spanish, this can sound indifferent depending on tone.',
        },
      },
    ],
  },
  {
    id: 'native',
    title: 'Native phrases',
    description: 'Common idioms and natural expressions. Meanings are conversational, not always word-for-word.',
    phrases: [
      {
        id: 'good-luck-idiom',
        meaning: 'Good luck!',
        translations: {
          italian: 'In bocca al lupo!',
          french: 'Bonne chance !',
          spanish: '¡Mucha suerte!',
          armenian: 'Յաջողութիւն կը մաղթեմ։',
        },
        usageNotes: {
          italian: 'People often answer “Crepi!” or “Crepi il lupo!” to this idiomatic good-luck wish.',
        },
      },
      {
        id: 'thank-goodness',
        meaning: 'Thank goodness!',
        translations: {
          italian: 'Meno male!',
          french: 'Heureusement !',
          spanish: '¡Menos mal!',
          armenian: 'Փառք Աստուծոյ։',
        },
      },
      {
        id: 'that-works',
        meaning: 'That works for me.',
        translations: {
          italian: 'Ci sta.',
          french: 'Ça marche.',
          spanish: 'Me parece bien.',
          armenian: 'Ինծի կը յարմարի։',
        },
        usageNotes: {
          italian: '“Ci sta” is informal Italian; it means an idea or plan is acceptable.',
        },
      },
      {
        id: 'fed-up',
        meaning: 'I’m fed up.',
        translations: {
          italian: 'Ne ho abbastanza.',
          french: 'J’en ai marre.',
          spanish: 'Estoy harto.',
          armenian: 'Բաւական է ինծի։',
        },
        usageNotes: {
          spanish: 'The Spanish form “harto” is masculine; “harta” is used by a female speaker.',
        },
      },
      {
        id: 'keep-posted',
        meaning: 'Let’s keep each other posted.',
        translations: {
          italian: 'Teniamoci aggiornati.',
          french: 'On se tient au courant.',
          spanish: 'Nos mantenemos al tanto.',
          armenian: 'Իրարու լուր տանք։',
        },
      },
      {
        id: 'cost-a-fortune',
        meaning: 'It costs a fortune.',
        translations: {
          italian: 'Costa un occhio della testa.',
          french: 'Ça coûte les yeux de la tête.',
          spanish: 'Cuesta un ojo de la cara.',
          armenian: 'Շատ սուղ է։',
        },
        usageNotes: {
          italian: 'Literally, this is “it costs an eye from the head.”',
          french: 'Literally, this is “it costs the eyes of the head.”',
          spanish: 'Literally, this is “it costs an eye from the face.”',
          armenian: 'This is a direct way to say something is very expensive.',
        },
      },
      {
        id: 'thats-awesome',
        meaning: 'That’s awesome!',
        translations: {
          italian: 'Che figata!',
          french: 'C’est génial !',
          spanish: '¡Qué guay!',
          armenian: 'Շատ լաւ է։',
        },
        usageNotes: {
          italian: '“Che figata” is informal Italian.',
          spanish: '“Qué guay” is especially common in Spain.',
        },
      },
      {
        id: 'dont-worry-native',
        meaning: 'Don’t worry about it.',
        translations: {
          italian: 'Non fa niente.',
          french: 'Ce n’est pas grave.',
          spanish: 'No pasa nada.',
          armenian: 'Հոգ մի՛ ըներ։',
        },
        usageNotes: {
          italian: 'A natural way to reassure someone after a small mistake.',
          french: 'A natural way to reassure someone after a small mistake.',
          spanish: 'A natural way to reassure someone after a small mistake.',
          armenian: 'A natural way to reassure someone after a small mistake.',
        },
      },
    ],
  },
];
