import type { Language } from '@/data/vocabulary';

export type VerbTenseLabel = 'Present' | 'Past' | 'Future';

export type SentenceBuildExercise = {
  english: string;
  tense: VerbTenseLabel;
  words: string[];
};

export type VerbGapExercise = {
  english: string;
  tense: VerbTenseLabel;
  before: string;
  after: string;
  answer: string;
  options: [string, string, string];
};

export function getVerbTenseHelp(language: Language, tense: VerbTenseLabel): string {
  if (language === 'armenian') {
    if (tense === 'Present') {
      return 'In Western Armenian, կը commonly comes before a present-tense verb. Choose the verb form that agrees with the subject.';
    }
    if (tense === 'Past') {
      return 'Use the past form for an action that has already happened. A clue such as երէկ (yesterday) often points to the past.';
    }
    return 'For many Western Armenian future forms, put պիտի before the verb to show that the action will happen later.';
  }

  if (tense === 'Present') {
    return 'Use the present for routines, facts, or actions happening now. Match the verb form to its subject.';
  }
  if (tense === 'Past') {
    return 'Use a past form for an action that happened before now. Time clues such as “yesterday” can help; some past forms use a helper verb.';
  }
  return 'Use a future form for something that will happen later. Time clues such as “tomorrow” or “next week” point forward.';
}

export const VERB_SENTENCE_EXERCISES: Record<Language, SentenceBuildExercise[]> = {
  italian: [
    { english: 'I speak Italian.', tense: 'Present', words: ['Io', 'parlo', 'italiano.'] },
    { english: 'You eat an apple.', tense: 'Present', words: ['Tu', 'mangi', 'una', 'mela.'] },
    { english: 'We go to the park.', tense: 'Present', words: ['Noi', 'andiamo', 'al', 'parco.'] },
    { english: 'She is at home.', tense: 'Present', words: ['Lei', 'è', 'a', 'casa.'] },
    { english: 'They have time.', tense: 'Present', words: ['Loro', 'hanno', 'tempo.'] },
    { english: 'Yesterday, I ate an apple.', tense: 'Past', words: ['Ieri,', 'io', 'ho', 'mangiato', 'una', 'mela.'] },
    { english: 'Yesterday, she went to the market.', tense: 'Past', words: ['Ieri,', 'lei', 'è', 'andata', 'al', 'mercato.'] },
    { english: 'We saw the museum.', tense: 'Past', words: ['Noi', 'abbiamo', 'visto', 'il', 'museo.'] },
    { english: 'They spoke with the teacher.', tense: 'Past', words: ['Loro', 'hanno', 'parlato', 'con', "l'insegnante."] },
    { english: 'He did his homework.', tense: 'Past', words: ['Lui', 'ha', 'fatto', 'i', 'compiti.'] },
    { english: 'Tomorrow, I will speak with Maria.', tense: 'Future', words: ['Domani,', 'io', 'parlerò', 'con', 'Maria.'] },
    { english: 'You will go to school.', tense: 'Future', words: ['Tu', 'andrai', 'a', 'scuola.'] },
    { english: 'We will eat after work.', tense: 'Future', words: ['Noi', 'mangeremo', 'dopo', 'il', 'lavoro.'] },
    { english: 'She will be at home.', tense: 'Future', words: ['Lei', 'sarà', 'a', 'casa.'] },
    { english: 'They will have time.', tense: 'Future', words: ['Loro', 'avranno', 'tempo.'] },
    { english: 'They do their homework.', tense: 'Present', words: ['Loro', 'fanno', 'i', 'compiti.'] },
  ],
  french: [
    { english: 'I speak French.', tense: 'Present', words: ['Je', 'parle', 'français.'] },
    { english: 'You eat an apple.', tense: 'Present', words: ['Tu', 'manges', 'une', 'pomme.'] },
    { english: 'We go to the park.', tense: 'Present', words: ['Nous', 'allons', 'au', 'parc.'] },
    { english: 'Yesterday, I ate an apple.', tense: 'Past', words: ['Hier,', "j'ai", 'mangé', 'une', 'pomme.'] },
    { english: 'Tomorrow, I will speak with Marie.', tense: 'Future', words: ['Demain,', 'je', 'parlerai', 'avec', 'Marie.'] },
    { english: 'They do their homework.', tense: 'Present', words: ['Ils', 'font', 'leurs', 'devoirs.'] },
    { english: 'Yesterday, Paul went to the market.', tense: 'Past', words: ['Hier,', 'Paul', 'est', 'allé', 'au', 'marché.'] },
    { english: 'Marie chose a book.', tense: 'Past', words: ['Marie', 'a', 'choisi', 'un', 'livre.'] },
    { english: 'We did our homework.', tense: 'Past', words: ['Nous', 'avons', 'fait', 'nos', 'devoirs.'] },
    { english: 'Tomorrow, I will go to school.', tense: 'Future', words: ['Demain,', "j'irai", 'à', "l'école."] },
    { english: 'She will have time.', tense: 'Future', words: ['Elle', 'aura', 'du', 'temps.'] },
    { english: 'They will finish the work.', tense: 'Future', words: ['Ils', 'finiront', 'le', 'travail.'] },
  ],
  spanish: [
    { english: 'I speak Spanish.', tense: 'Present', words: ['Yo', 'hablo', 'español.'] },
    { english: 'You eat an apple.', tense: 'Present', words: ['Tú', 'comes', 'una', 'manzana.'] },
    { english: 'We go to the park.', tense: 'Present', words: ['Nosotros', 'vamos', 'al', 'parque.'] },
    { english: 'Yesterday, I ate an apple.', tense: 'Past', words: ['Ayer,', 'yo', 'comí', 'una', 'manzana.'] },
    { english: 'Tomorrow, I will speak with María.', tense: 'Future', words: ['Mañana,', 'yo', 'hablaré', 'con', 'María.'] },
    { english: 'They do their homework.', tense: 'Present', words: ['Ellos', 'hacen', 'la', 'tarea.'] },
    { english: 'Yesterday, we went to the cinema.', tense: 'Past', words: ['Ayer,', 'nosotros', 'fuimos', 'al', 'cine.'] },
    { english: 'Last night, she had time.', tense: 'Past', words: ['Anoche,', 'ella', 'tuvo', 'tiempo.'] },
    { english: 'I did the homework yesterday.', tense: 'Past', words: ['Ayer,', 'yo', 'hice', 'la', 'tarea.'] },
    { english: 'Tomorrow, we will go to the market.', tense: 'Future', words: ['Mañana,', 'nosotros', 'iremos', 'al', 'mercado.'] },
    { english: 'Ana will live in Chile.', tense: 'Future', words: ['Ana', 'vivirá', 'en', 'Chile.'] },
    { english: 'They will have time.', tense: 'Future', words: ['Ellos', 'tendrán', 'tiempo.'] },
  ],
  armenian: [
    { english: 'I speak Armenian.', tense: 'Present', words: ['Ես', 'կը', 'խօսիմ', 'հայերէն։'] },
    { english: 'You read the book.', tense: 'Present', words: ['Դուն', 'գիրքը', 'կը', 'կարդաս։'] },
    { english: 'She reads the book.', tense: 'Present', words: ['Ան', 'կը', 'կարդայ', 'գիրքը։'] },
    { english: 'We read the book.', tense: 'Present', words: ['Մենք', 'կը', 'կարդանք', 'գիրքը։'] },
    { english: 'Yesterday, I ate an apple.', tense: 'Past', words: ['Երէկ,', 'խնձոր', 'մը', 'կերայ։'] },
    { english: 'Yesterday, I spoke with Ana.', tense: 'Past', words: ['Երէկ,', 'Աննային', 'հետ', 'խօսեցայ։'] },
    { english: 'Yesterday, they went home.', tense: 'Past', words: ['Երէկ,', 'անոնք', 'տուն', 'գացին։'] },
    { english: 'Tomorrow, I will speak Armenian.', tense: 'Future', words: ['Վաղը,', 'ես', 'պիտի', 'խօսիմ', 'հայերէն։'] },
    { english: 'Tomorrow, she will read the book.', tense: 'Future', words: ['Վաղը,', 'ան', 'պիտի', 'կարդայ', 'գիրքը։'] },
    { english: 'Tomorrow, we will go to the park.', tense: 'Future', words: ['Վաղը,', 'մենք', 'պիտի', 'երթանք', 'զբօսայգի։'] },
    { english: 'I have time.', tense: 'Present', words: ['Ժամանակ', 'ունիմ։'] },
    { english: 'They will have time.', tense: 'Future', words: ['Անոնք', 'ժամանակ', 'պիտի', 'ունենան։'] },
  ],
};

export const VERB_GAP_EXERCISES: Record<Language, VerbGapExercise[]> = {
  italian: [
    { english: 'Today, I eat an apple.', tense: 'Present', before: 'Oggi, io ', after: ' una mela.', answer: 'mangio', options: ['mangio', 'ho mangiato', 'mangerò'] },
    { english: 'Yesterday, I ate an apple.', tense: 'Past', before: 'Ieri, io ', after: ' una mela.', answer: 'ho mangiato', options: ['mangio', 'ho mangiato', 'mangerò'] },
    { english: 'Tomorrow, I will eat an apple.', tense: 'Future', before: 'Domani, io ', after: ' una mela.', answer: 'mangerò', options: ['mangio', 'ho mangiato', 'mangerò'] },
    { english: 'Today, I speak with Maria.', tense: 'Present', before: 'Oggi, io ', after: ' con Maria.', answer: 'parlo', options: ['parlo', 'ho parlato', 'parlerò'] },
    { english: 'Yesterday, I spoke with Maria.', tense: 'Past', before: 'Ieri, io ', after: ' con Maria.', answer: 'ho parlato', options: ['parlo', 'ho parlato', 'parlerò'] },
    { english: 'Tomorrow, I will speak with Maria.', tense: 'Future', before: 'Domani, io ', after: ' con Maria.', answer: 'parlerò', options: ['parlo', 'ho parlato', 'parlerò'] },
    { english: 'Today, I go to the park.', tense: 'Present', before: 'Oggi, io ', after: ' al parco.', answer: 'vado', options: ['vado', 'sono andato', 'andrò'] },
    { english: 'Yesterday, she went home.', tense: 'Past', before: 'Ieri, lei ', after: ' a casa.', answer: 'è andata', options: ['va', 'è andata', 'andrà'] },
    { english: 'Yesterday, we saw the museum.', tense: 'Past', before: 'Ieri, noi ', after: ' il museo.', answer: 'abbiamo visto', options: ['vediamo', 'abbiamo visto', 'vedremo'] },
    { english: 'Tomorrow, we will eat after work.', tense: 'Future', before: 'Domani, noi ', after: ' dopo il lavoro.', answer: 'mangeremo', options: ['mangiamo', 'abbiamo mangiato', 'mangeremo'] },
    { english: 'Tomorrow, she will be at home.', tense: 'Future', before: 'Domani, lei ', after: ' a casa.', answer: 'sarà', options: ['è', 'è stata', 'sarà'] },
    { english: 'Yesterday, they did their homework.', tense: 'Past', before: 'Ieri, loro ', after: ' i compiti.', answer: 'hanno fatto', options: ['fanno', 'hanno fatto', 'faranno'] },
    { english: 'Tomorrow, you will go to school.', tense: 'Future', before: 'Domani, tu ', after: ' a scuola.', answer: 'andrai', options: ['vai', 'sei andato', 'andrai'] },
  ],
  french: [
    { english: 'Today, I eat an apple.', tense: 'Present', before: "Aujourd'hui, je ", after: ' une pomme.', answer: 'mange', options: ['mange', 'ai mangé', 'mangerai'] },
    { english: 'Yesterday, I ate an apple.', tense: 'Past', before: "Hier, j'", after: ' une pomme.', answer: 'ai mangé', options: ['mange', 'ai mangé', 'mangerai'] },
    { english: 'Tomorrow, I will eat an apple.', tense: 'Future', before: 'Demain, je ', after: ' une pomme.', answer: 'mangerai', options: ['mange', 'ai mangé', 'mangerai'] },
    { english: 'Today, I speak French with Marie.', tense: 'Present', before: "Aujourd'hui, je ", after: ' français avec Marie.', answer: 'parle', options: ['parle', 'ai parlé', 'parlerai'] },
    { english: 'Yesterday, I spoke French with Marie.', tense: 'Past', before: "Hier, j'", after: ' français avec Marie.', answer: 'ai parlé', options: ['parle', 'ai parlé', 'parlerai'] },
    { english: 'Tomorrow, I will speak French with Marie.', tense: 'Future', before: 'Demain, je ', after: ' français avec Marie.', answer: 'parlerai', options: ['parle', 'ai parlé', 'parlerai'] },
    { english: 'Today, he goes to the park.', tense: 'Present', before: "Aujourd'hui, il ", after: ' au parc.', answer: 'va', options: ['va', 'est allé', 'ira'] },
    { english: 'Today, we are at home.', tense: 'Present', before: "Aujourd'hui, nous ", after: ' à la maison.', answer: 'sommes', options: ['sommes', 'étions', 'serons'] },
    { english: 'Yesterday, Paul went to the market.', tense: 'Past', before: 'Hier, Paul ', after: ' au marché.', answer: 'est allé', options: ['va', 'est allé', 'ira'] },
    { english: 'Yesterday, Marie chose a book.', tense: 'Past', before: 'Hier, Marie ', after: ' un livre.', answer: 'a choisi', options: ['choisit', 'a choisi', 'choisira'] },
    { english: 'Yesterday, we did our homework.', tense: 'Past', before: 'Hier, nous ', after: ' nos devoirs.', answer: 'avons fait', options: ['faisons', 'avons fait', 'ferons'] },
    { english: 'Tomorrow, you will go to the market.', tense: 'Future', before: 'Demain, tu ', after: ' au marché.', answer: 'iras', options: ['vas', 'es allé', 'iras'] },
    { english: 'Next week, she will have more time.', tense: 'Future', before: 'La semaine prochaine, elle ', after: ' plus de temps.', answer: 'aura', options: ['a', 'avait', 'aura'] },
    { english: 'Tomorrow, they will finish the work.', tense: 'Future', before: 'Demain, ils ', after: ' le travail.', answer: 'finiront', options: ['finissent', 'ont fini', 'finiront'] },
  ],
  spanish: [
    { english: 'Today, I eat an apple.', tense: 'Present', before: 'Hoy, yo ', after: ' una manzana.', answer: 'como', options: ['como', 'comí', 'comeré'] },
    { english: 'Yesterday, I ate an apple.', tense: 'Past', before: 'Ayer, yo ', after: ' una manzana.', answer: 'comí', options: ['como', 'comí', 'comeré'] },
    { english: 'Tomorrow, I will eat an apple.', tense: 'Future', before: 'Mañana, yo ', after: ' una manzana.', answer: 'comeré', options: ['como', 'comí', 'comeré'] },
    { english: 'Today, I speak with María.', tense: 'Present', before: 'Hoy, yo ', after: ' con María.', answer: 'hablo', options: ['hablo', 'hablé', 'hablaré'] },
    { english: 'Yesterday, I spoke with María.', tense: 'Past', before: 'Ayer, yo ', after: ' con María.', answer: 'hablé', options: ['hablo', 'hablé', 'hablaré'] },
    { english: 'Tomorrow, I will speak with María.', tense: 'Future', before: 'Mañana, yo ', after: ' con María.', answer: 'hablaré', options: ['hablo', 'hablé', 'hablaré'] },
    { english: 'Today, I go to the park.', tense: 'Present', before: 'Hoy, yo ', after: ' al parque.', answer: 'voy', options: ['voy', 'fui', 'iré'] },
    { english: 'Today, you have time.', tense: 'Present', before: 'Hoy, ustedes ', after: ' tiempo.', answer: 'tienen', options: ['tienen', 'tuvieron', 'tendrán'] },
    { english: 'Yesterday, Ana went to the market.', tense: 'Past', before: 'Ayer, Ana ', after: ' al mercado.', answer: 'fue', options: ['va', 'fue', 'irá'] },
    { english: 'On Saturday, we saw the movie.', tense: 'Past', before: 'El sábado, nosotros ', after: ' la película.', answer: 'vimos', options: ['vemos', 'vimos', 'veremos'] },
    { english: 'Last night, they did the homework.', tense: 'Past', before: 'Anoche, ellos ', after: ' la tarea.', answer: 'hicieron', options: ['hacen', 'hicieron', 'harán'] },
    { english: 'Tomorrow, we will go to the market.', tense: 'Future', before: 'Mañana, nosotros ', after: ' al mercado.', answer: 'iremos', options: ['vamos', 'fuimos', 'iremos'] },
    { english: 'Next year, Ana will live in Chile.', tense: 'Future', before: 'El próximo año, Ana ', after: ' en Chile.', answer: 'vivirá', options: ['vive', 'vivió', 'vivirá'] },
    { english: 'Tomorrow, they will have time.', tense: 'Future', before: 'Mañana, ellos ', after: ' tiempo.', answer: 'tendrán', options: ['tienen', 'tuvieron', 'tendrán'] },
  ],
  armenian: [
    { english: 'Today, I speak Armenian.', tense: 'Present', before: 'Այսօր ես ', after: ' հայերէն։', answer: 'կը խօսիմ', options: ['կը խօսիմ', 'խօսեցայ', 'պիտի խօսիմ'] },
    { english: 'Yesterday, I spoke Armenian.', tense: 'Past', before: 'Երէկ ես ', after: ' հայերէն։', answer: 'խօսեցայ', options: ['կը խօսիմ', 'խօսեցայ', 'պիտի խօսիմ'] },
    { english: 'Tomorrow, I will speak Armenian.', tense: 'Future', before: 'Վաղը ես ', after: ' հայերէն։', answer: 'պիտի խօսիմ', options: ['կը խօսիմ', 'խօսեցայ', 'պիտի խօսիմ'] },
    { english: 'Today, she reads the book.', tense: 'Present', before: 'Այսօր ան ', after: ' գիրքը։', answer: 'կը կարդայ', options: ['կը կարդայ', 'կարդաց', 'պիտի կարդայ'] },
    { english: 'Yesterday, she read the book.', tense: 'Past', before: 'Երէկ ան ', after: ' գիրքը։', answer: 'կարդաց', options: ['կը կարդայ', 'կարդաց', 'պիտի կարդայ'] },
    { english: 'Tomorrow, she will read the book.', tense: 'Future', before: 'Վաղը ան ', after: ' գիրքը։', answer: 'պիտի կարդայ', options: ['կը կարդայ', 'կարդաց', 'պիտի կարդայ'] },
    { english: 'Today, I eat an apple.', tense: 'Present', before: 'Այսօր ես խնձոր մը ', after: '։', answer: 'կ՚ուտեմ', options: ['կ՚ուտեմ', 'կերայ', 'պիտի ուտեմ'] },
    { english: 'Yesterday, I ate an apple.', tense: 'Past', before: 'Երէկ ես խնձոր մը ', after: '։', answer: 'կերայ', options: ['կ՚ուտեմ', 'կերայ', 'պիտի ուտեմ'] },
    { english: 'Tomorrow, I will eat an apple.', tense: 'Future', before: 'Վաղը ես խնձոր մը ', after: '։', answer: 'պիտի ուտեմ', options: ['կ՚ուտեմ', 'կերայ', 'պիտի ուտեմ'] },
    { english: 'They have time.', tense: 'Present', before: 'Անոնք ժամանակ ', after: '։', answer: 'ունին', options: ['ունին', 'ունեցան', 'պիտի ունենան'] },
    { english: 'They had time yesterday.', tense: 'Past', before: 'Երէկ անոնք ժամանակ ', after: '։', answer: 'ունեցան', options: ['ունին', 'ունեցան', 'պիտի ունենան'] },
    { english: 'They will have time.', tense: 'Future', before: 'Վաղը անոնք ժամանակ ', after: '։', answer: 'պիտի ունենան', options: ['ունին', 'ունեցան', 'պիտի ունենան'] },
  ],
};
