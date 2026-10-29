import type { Language } from '@/data/vocabulary';

export type VerbPattern = 'regular' | 'irregular';

export type VerbLesson = {
  infinitive: string;
  english: string;
  pattern: VerbPattern;
  forms: [string, string, string, string, string, string];
};

export const VERB_PERSONS: Record<Language, string[]> = {
  italian: ['io · I', 'tu · you', 'lui · he', 'lei · she', 'noi · we', 'voi · you all', 'loro · they'],
  french: ['je · I', 'tu · you', 'il · he', 'elle · she', 'nous · we', 'vous · you all', 'ils / elles · they'],
  spanish: ['yo · I', 'tú · you', 'él / ella / usted · he / she / formal you', 'nosotros / nosotras · we', 'vosotros / vosotras · you all (Spain)', 'ellos / ellas / ustedes · they / you all'],
  armenian: ['ես · I', 'դուն · you', 'ան · he / she', 'մենք · we', 'դուք · you all', 'անոնք · they'],
};

export const VERB_LESSONS: Record<Language, Record<VerbPattern, VerbLesson[]>> = {
  italian: {
    regular: [
      {
        infinitive: 'parlare',
        english: 'to speak',
        pattern: 'regular',
        forms: ['io parlo', 'tu parli', 'lui / lei parla', 'noi parliamo', 'voi parlate', 'loro parlano'],
      },
      {
        infinitive: 'mangiare',
        english: 'to eat',
        pattern: 'regular',
        forms: ['io mangio', 'tu mangi', 'lui / lei mangia', 'noi mangiamo', 'voi mangiate', 'loro mangiano'],
      },
      {
        infinitive: 'credere',
        english: 'to believe',
        pattern: 'regular',
        forms: ['io credo', 'tu credi', 'lui / lei crede', 'noi crediamo', 'voi credete', 'loro credono'],
      },
      {
        infinitive: 'dormire',
        english: 'to sleep',
        pattern: 'regular',
        forms: ['io dormo', 'tu dormi', 'lui / lei dorme', 'noi dormiamo', 'voi dormite', 'loro dormono'],
      },
    ],
    irregular: [
      {
        infinitive: 'essere',
        english: 'to be',
        pattern: 'irregular',
        forms: ['io sono', 'tu sei', 'lui / lei è', 'noi siamo', 'voi siete', 'loro sono'],
      },
      {
        infinitive: 'avere',
        english: 'to have',
        pattern: 'irregular',
        forms: ['io ho', 'tu hai', 'lui / lei ha', 'noi abbiamo', 'voi avete', 'loro hanno'],
      },
      {
        infinitive: 'andare',
        english: 'to go',
        pattern: 'irregular',
        forms: ['io vado', 'tu vai', 'lui / lei va', 'noi andiamo', 'voi andate', 'loro vanno'],
      },
      {
        infinitive: 'fare',
        english: 'to do / make',
        pattern: 'irregular',
        forms: ['io faccio', 'tu fai', 'lui / lei fa', 'noi facciamo', 'voi fate', 'loro fanno'],
      },
      {
        infinitive: 'potere',
        english: 'to be able to',
        pattern: 'irregular',
        forms: ['io posso', 'tu puoi', 'lui / lei può', 'noi possiamo', 'voi potete', 'loro possono'],
      },
      {
        infinitive: 'volere',
        english: 'to want',
        pattern: 'irregular',
        forms: ['io voglio', 'tu vuoi', 'lui / lei vuole', 'noi vogliamo', 'voi volete', 'loro vogliono'],
      },
      {
        infinitive: 'venire',
        english: 'to come',
        pattern: 'irregular',
        forms: ['io vengo', 'tu vieni', 'lui / lei viene', 'noi veniamo', 'voi venite', 'loro vengono'],
      },
    ],
  },
  french: {
    regular: [
      {
        infinitive: 'parler',
        english: 'to speak',
        pattern: 'regular',
        forms: ['je parle', 'tu parles', 'il / elle parle', 'nous parlons', 'vous parlez', 'ils / elles parlent'],
      },
      {
        infinitive: 'aimer',
        english: 'to like / love',
        pattern: 'regular',
        forms: ["j'aime", 'tu aimes', 'il / elle aime', 'nous aimons', 'vous aimez', 'ils / elles aiment'],
      },
      {
        infinitive: 'finir',
        english: 'to finish',
        pattern: 'regular',
        forms: ['je finis', 'tu finis', 'il / elle finit', 'nous finissons', 'vous finissez', 'ils / elles finissent'],
      },
      {
        infinitive: 'vendre',
        english: 'to sell',
        pattern: 'regular',
        forms: ['je vends', 'tu vends', 'il / elle vend', 'nous vendons', 'vous vendez', 'ils / elles vendent'],
      },
    ],
    irregular: [
      {
        infinitive: 'être',
        english: 'to be',
        pattern: 'irregular',
        forms: ['je suis', 'tu es', 'il / elle est', 'nous sommes', 'vous êtes', 'ils / elles sont'],
      },
      {
        infinitive: 'avoir',
        english: 'to have',
        pattern: 'irregular',
        forms: ["j'ai", 'tu as', 'il / elle a', 'nous avons', 'vous avez', 'ils / elles ont'],
      },
      {
        infinitive: 'aller',
        english: 'to go',
        pattern: 'irregular',
        forms: ['je vais', 'tu vas', 'il / elle va', 'nous allons', 'vous allez', 'ils / elles vont'],
      },
      {
        infinitive: 'faire',
        english: 'to do / make',
        pattern: 'irregular',
        forms: ['je fais', 'tu fais', 'il / elle fait', 'nous faisons', 'vous faites', 'ils / elles font'],
      },
      {
        infinitive: 'pouvoir',
        english: 'to be able to',
        pattern: 'irregular',
        forms: ['je peux', 'tu peux', 'il / elle peut', 'nous pouvons', 'vous pouvez', 'ils / elles peuvent'],
      },
      {
        infinitive: 'vouloir',
        english: 'to want',
        pattern: 'irregular',
        forms: ['je veux', 'tu veux', 'il / elle veut', 'nous voulons', 'vous voulez', 'ils / elles veulent'],
      },
      {
        infinitive: 'venir',
        english: 'to come',
        pattern: 'irregular',
        forms: ['je viens', 'tu viens', 'il / elle vient', 'nous venons', 'vous venez', 'ils / elles viennent'],
      },
    ],
  },
  spanish: {
    regular: [
      {
        infinitive: 'hablar',
        english: 'to speak',
        pattern: 'regular',
        forms: ['yo hablo', 'tú hablas', 'él / ella habla', 'nosotros / nosotras hablamos', 'ustedes hablan', 'ellos / ellas hablan'],
      },
      {
        infinitive: 'comer',
        english: 'to eat',
        pattern: 'regular',
        forms: ['yo como', 'tú comes', 'él / ella come', 'nosotros / nosotras comemos', 'ustedes comen', 'ellos / ellas comen'],
      },
      {
        infinitive: 'vivir',
        english: 'to live',
        pattern: 'regular',
        forms: ['yo vivo', 'tú vives', 'él / ella vive', 'nosotros / nosotras vivimos', 'ustedes viven', 'ellos / ellas viven'],
      },
      {
        infinitive: 'estudiar',
        english: 'to study',
        pattern: 'regular',
        forms: ['yo estudio', 'tú estudias', 'él / ella estudia', 'nosotros / nosotras estudiamos', 'ustedes estudian', 'ellos / ellas estudian'],
      },
    ],
    irregular: [
      {
        infinitive: 'ser',
        english: 'to be (identity)',
        pattern: 'irregular',
        forms: ['yo soy', 'tú eres', 'él / ella es', 'nosotros / nosotras somos', 'ustedes son', 'ellos / ellas son'],
      },
      {
        infinitive: 'estar',
        english: 'to be (state / location)',
        pattern: 'irregular',
        forms: ['yo estoy', 'tú estás', 'él / ella está', 'nosotros / nosotras estamos', 'ustedes están', 'ellos / ellas están'],
      },
      {
        infinitive: 'tener',
        english: 'to have',
        pattern: 'irregular',
        forms: ['yo tengo', 'tú tienes', 'él / ella tiene', 'nosotros / nosotras tenemos', 'ustedes tienen', 'ellos / ellas tienen'],
      },
      {
        infinitive: 'ir',
        english: 'to go',
        pattern: 'irregular',
        forms: ['yo voy', 'tú vas', 'él / ella va', 'nosotros / nosotras vamos', 'ustedes van', 'ellos / ellas van'],
      },
      {
        infinitive: 'hacer',
        english: 'to do / make',
        pattern: 'irregular',
        forms: ['yo hago', 'tú haces', 'él / ella hace', 'nosotros / nosotras hacemos', 'ustedes hacen', 'ellos / ellas hacen'],
      },
      {
        infinitive: 'poder',
        english: 'to be able to',
        pattern: 'irregular',
        forms: ['yo puedo', 'tú puedes', 'él / ella puede', 'nosotros / nosotras podemos', 'ustedes pueden', 'ellos / ellas pueden'],
      },
      {
        infinitive: 'querer',
        english: 'to want',
        pattern: 'irregular',
        forms: ['yo quiero', 'tú quieres', 'él / ella quiere', 'nosotros / nosotras queremos', 'ustedes quieren', 'ellos / ellas quieren'],
      },
      {
        infinitive: 'venir',
        english: 'to come',
        pattern: 'irregular',
        forms: ['yo vengo', 'tú vienes', 'él / ella viene', 'nosotros / nosotras venimos', 'ustedes vienen', 'ellos / ellas vienen'],
      },
    ],
  },
  armenian: {
    regular: [
      {
        infinitive: 'սիրել',
        english: 'to love',
        pattern: 'regular',
        forms: ['ես կը սիրեմ', 'դուն կը սիրես', 'ան կը սիրէ', 'մենք կը սիրենք', 'դուք կը սիրէք', 'անոնք կը սիրեն'],
      },
      {
        infinitive: 'խօսիլ',
        english: 'to speak',
        pattern: 'regular',
        forms: ['ես կը խօսիմ', 'դուն կը խօսիս', 'ան կը խօսի', 'մենք կը խօսինք', 'դուք կը խօսիք', 'անոնք կը խօսին'],
      },
      {
        infinitive: 'կարդալ',
        english: 'to read',
        pattern: 'regular',
        forms: ['ես կը կարդամ', 'դուն կը կարդաս', 'ան կը կարդայ', 'մենք կը կարդանք', 'դուք կը կարդաք', 'անոնք կը կարդան'],
      },
      {
        infinitive: 'երթալ',
        english: 'to go',
        pattern: 'regular',
        forms: ['ես կը երթամ', 'դուն կը երթաս', 'ան կը երթայ', 'մենք կը երթանք', 'դուք կը երթաք', 'անոնք կը երթան'],
      },
    ],
    irregular: [
      {
        infinitive: 'ըլլալ',
        english: 'to be',
        pattern: 'irregular',
        forms: ['ես եմ', 'դուն ես', 'ան է', 'մենք ենք', 'դուք էք', 'անոնք են'],
      },
      {
        infinitive: 'ունենալ',
        english: 'to have',
        pattern: 'irregular',
        forms: ['ես ունիմ', 'դուն ունիս', 'ան ունի', 'մենք ունինք', 'դուք ունիք', 'անոնք ունին'],
      },
      {
        infinitive: 'գիտնալ',
        english: 'to know',
        pattern: 'irregular',
        forms: ['ես գիտեմ', 'դուն գիտես', 'ան գիտէ', 'մենք գիտենք', 'դուք գիտէք', 'անոնք գիտեն'],
      },
      {
        infinitive: 'կրնալ',
        english: 'to be able to',
        pattern: 'irregular',
        forms: ['ես կրնամ', 'դուն կրնաս', 'ան կրնայ', 'մենք կրնանք', 'դուք կրնաք', 'անոնք կրնան'],
      },
    ],
  },
};
