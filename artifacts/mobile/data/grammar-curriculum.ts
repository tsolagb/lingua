import type { Language } from './vocabulary';

export type GrammarBand = 'A1' | 'A2' | 'B1' | 'B2';
export type GrammarUnitId =
  | 'wordOrder'
  | 'pronounsCopula'
  | 'presentTense'
  | 'adjectiveAgreement'
  | 'negationQuestions'
  | 'pastTenses'
  | 'futureTenses'
  | 'objectPronouns'
  | 'reflexiveVerbs'
  | 'comparisons'
  | 'imperatives'
  | 'conditionalMood'
  | 'subjunctive'
  | 'relativeClauses'
  | 'passiveImpersonal'
  | 'conditionalClauses'
  | 'advancedSubjunctive'
  | 'compoundTenses'
  | 'reportedSpeech'
  | 'pronounOrder';

export type GrammarPracticeQuestion = {
  prompt: string;
  hint: string;
  sentence: string;
  sentenceTranslation: string;
  answer: string;
  choices: string[];
  explanation: string;
};

export type GrammarUnit = {
  id: GrammarUnitId | 'articles' | 'prepositions' | 'verbFoundations';
  band: GrammarBand;
  title: string;
  description: string;
  rule: string;
  foundationArea?: 'articles' | 'prepositions' | 'verbs';
  foundationProgressIndexes?: number[];
  questions: GrammarPracticeQuestion[];
};

export type GrammarCourseSection = {
  band: GrammarBand;
  title: string;
  description: string;
  units: GrammarUnit[];
};

type GrammarRow = [sentence: string, translation: string, answer: string, distractorA: string, distractorB: string];

const lessonInfo: Omit<GrammarUnit, 'questions'>[] = [
  { id: 'wordOrder', band: 'A1', title: 'Build a sentence', description: 'Put the main parts of a sentence in a natural order.', rule: 'A basic sentence usually places the subject, verb, and object in a predictable order. Time and place phrases can move, but the core meaning stays clear.' },
  { id: 'pronounsCopula', band: 'A1', title: 'Pronouns, “be” & “have”', description: 'Connect people and things with the right essential verb.', rule: 'Choose the verb form that agrees with the subject. Each language has its own forms for identity, state, location, and possession.' },
  { id: 'articles', band: 'A1', title: 'Articles and noun forms', description: 'Practice definite and indefinite articles in complete phrases.', rule: 'Articles and noun forms vary by language. Check the noun’s number and the form required by its sentence.', foundationArea: 'articles', foundationProgressIndexes: [0, 1, 2] },
  { id: 'presentTense', band: 'A1', title: 'Present-tense verbs', description: 'Talk about routines, facts, and what is happening now.', rule: 'Present-tense verb endings or helper words change to match the subject and the language’s conjugation pattern.' },
  { id: 'adjectiveAgreement', band: 'A1', title: 'Adjectives & agreement', description: 'Describe people and things with forms that fit the noun.', rule: 'Adjectives may change to agree with a noun’s gender and number, and their usual position can depend on the language.' },
  { id: 'negationQuestions', band: 'A1', title: 'Questions & negatives', description: 'Ask clear questions and say what is not happening.', rule: 'Questions use language-specific word order or question words. Negation also has a characteristic position around the verb.' },
  { id: 'pastTenses', band: 'A2', title: 'Past events & background', description: 'Distinguish completed events from past habits and descriptions.', rule: 'Many languages distinguish a bounded past event from an ongoing, repeated, or descriptive past. Let the sentence context guide the choice.' },
  { id: 'futureTenses', band: 'A2', title: 'Plans & future forms', description: 'Talk about plans, predictions, and events still to come.', rule: 'Future meaning can be expressed with a dedicated future form or a construction for a plan that is already intended.' },
  { id: 'objectPronouns', band: 'A2', title: 'Object pronouns', description: 'Replace repeated names and things with short pronouns.', rule: 'Object pronouns stand for the person or thing receiving the action. Their form and position depend on the language and verb construction.' },
  { id: 'reflexiveVerbs', band: 'A2', title: 'Reflexive verbs', description: 'Describe routines and actions done to or for oneself.', rule: 'Reflexive constructions use a pronoun that agrees with the subject. Its position varies with finite verbs and infinitives.' },
  { id: 'prepositions', band: 'A2', title: 'Prepositions & place', description: 'Practice prepositions, contractions, and place in full sentences.', rule: 'Prepositions express relationships such as place, time, and direction. Some languages combine them with articles; Armenian commonly uses postpositions.' , foundationArea: 'prepositions', foundationProgressIndexes: [6, 7] },
  { id: 'comparisons', band: 'A2', title: 'Comparisons & quantity', description: 'Compare people and things and describe how much or how many.', rule: 'Comparisons pair a comparative form with a language-specific connector. Quantity words can agree with, or precede, the noun they describe.' },
  { id: 'imperatives', band: 'B1', title: 'Instructions & requests', description: 'Give instructions and make polite requests.', rule: 'Imperatives use forms suited to the person being addressed. Negative commands may use a different construction from positive commands.' },
  { id: 'conditionalMood', band: 'B1', title: 'The conditional mood', description: 'Make polite requests and talk about hypothetical outcomes.', rule: 'Conditional forms often express possibility, courtesy, or an imagined result. Match the form to the subject and the meaning.' },
  { id: 'subjunctive', band: 'B1', title: 'Subjunctive & possibility', description: 'Practice wishes, doubts, recommendations, and necessary actions.', rule: 'After expressions of wish, doubt, emotion, or necessity, several languages use a special dependent verb form. The trigger phrase matters.' },
  { id: 'relativeClauses', band: 'B1', title: 'Relative clauses', description: 'Join ideas to describe a person, place, or thing.', rule: 'Relative words connect a noun to extra information. Choose the form that fits the role it plays inside the clause.' },
  { id: 'passiveImpersonal', band: 'B1', title: 'Passive & impersonal forms', description: 'Focus on an action or general statement instead of its actor.', rule: 'Passive and impersonal constructions shift attention away from a specific actor. Choose the auxiliary, participle, or impersonal marker the sentence needs.' },
  { id: 'conditionalClauses', band: 'B2', title: 'If-clauses & hypotheticals', description: 'Connect a condition to a realistic or imagined result.', rule: 'Conditional sentences pair the condition and result carefully. Real, unlikely, and past-unreal conditions use different tense or mood patterns.' },
  { id: 'advancedSubjunctive', band: 'B2', title: 'Subjunctive in complex ideas', description: 'Use the subjunctive with concession, uncertainty, and non-specific references.', rule: 'Advanced subjunctive use depends on meaning as well as the linking expression. Concession and uncertainty often keep the dependent clause in the subjunctive.' },
  { id: 'compoundTenses', band: 'B2', title: 'Compound tenses & time sequence', description: 'Show which past action happened first and relate past actions to later events.', rule: 'Compound tenses locate an action relative to another time. Select the auxiliary and participle or verb construction that matches that relationship.' },
  { id: 'reportedSpeech', band: 'B2', title: 'Reported speech & connectors', description: 'Report what someone said and connect ideas with precision.', rule: 'Reported statements often adjust pronouns, time expressions, and verb tense. Connectors clarify whether ideas contrast, explain, or follow from each other.' },
  { id: 'pronounOrder', band: 'B2', title: 'Pronoun placement & combinations', description: 'Place short pronouns naturally around conjugated and infinitive verbs.', rule: 'When a sentence contains more than one pronoun, languages follow set order and attachment rules. The verb form can change where the pronoun belongs.' },
  { id: 'verbFoundations', band: 'A1', title: 'Verb tense foundations', description: 'Open the verb practice for present, past, future, and sentence construction.', rule: 'Verb practice includes tense examples and interactive sentence-building games.', foundationArea: 'verbs', foundationProgressIndexes: [5] },
];

const R = (sentence: string, translation: string, answer: string, wrong1: string, wrong2: string): GrammarRow =>
  [sentence, translation, answer, wrong1, wrong2];

const rows: Record<Language, Partial<Record<GrammarUnitId, GrammarRow[]>>> = {
  italian: {
    wordOrder: [R('Ogni mattina, Maria ___ il caffè.', 'Every morning, Maria drinks coffee.', 'beve', 'bevi', 'bevo'), R('Dopo il lavoro, noi ___ al supermercato.', 'After work, we go to the supermarket.', 'andiamo', 'vanno', 'vai'), R('I bambini ___ un libro prima di dormire.', 'The children read a book before sleeping.', 'leggono', 'legge', 'leggo')],
    pronounsCopula: [R('Io ___ stanco oggi.', 'I am tired today.', 'sono', 'sei', 'è'), R('Noi ___ due sorelle.', 'We have two sisters.', 'abbiamo', 'avete', 'hanno'), R('Loro ___ a casa.', 'They are at home.', 'sono', 'siamo', 'siete')],
    presentTense: [R('Tu ___ italiano ogni giorno.', 'You study Italian every day.', 'studi', 'studio', 'studia'), R('Mia sorella ___ al lavoro in autobus.', 'My sister goes to work by bus.', 'va', 'vado', 'vai'), R('Noi ___ una pizza per cena.', 'We are making a pizza for dinner.', 'prepariamo', 'preparano', 'prepari')],
    adjectiveAgreement: [R('Le case sono ___.', 'The houses are large.', 'grandi', 'grande', 'grando'), R('Marco indossa una giacca ___.', 'Marco is wearing a new jacket.', 'nuova', 'nuovo', 'nuovi'), R('I miei amici sono molto ___.', 'My friends are very kind.', 'gentili', 'gentile', 'gentilo')],
    negationQuestions: [R('Non ___ carne.', 'I do not eat meat.', 'mangio', 'mangi', 'mangia'), R('Dove ___ il museo?', 'Where is the museum?', 'si trova', 'ti trovi', 'mi trovo'), R('___ un biglietto per il treno?', 'Do you have a train ticket?', 'Hai', 'Ha', 'Ho')],
    pastTenses: [R('Ieri ___ un film italiano.', 'Yesterday I watched an Italian movie.', 'ho visto', 'vedevo', 'vedrò'), R('Da bambino, ___ vicino al mare.', 'As a child, I lived near the sea.', 'vivevo', 'ho vissuto', 'vivrò'), R('Mentre noi ___, è arrivato Luca.', 'While we were having dinner, Luca arrived.', 'cenavamo', 'abbiamo cenato', 'ceneremo')],
    futureTenses: [R('Domani ___ i nonni.', 'Tomorrow I will visit my grandparents.', 'visiterò', 'visitavo', 'ho visitato'), R('Sabato noi ___ al mare.', 'On Saturday we will go to the seaside.', 'andremo', 'andavamo', 'siamo andati'), R('Tra un anno ___ italiano meglio.', 'In a year I will speak Italian better.', 'parlerò', 'parlavo', 'ho parlato')],
    objectPronouns: [R('Maria? ___ vedo ogni giorno.', 'Maria? I see her every day.', 'La', 'Le', 'Li'), R('A Luca ___ telefono stasera.', 'I will call Luca tonight.', 'gli', 'lo', 'la'), R('Hai le chiavi? ___ ho qui.', 'Do you have the keys? I have them here.', 'Le', 'Li', 'La')],
    reflexiveVerbs: [R('Io ___ alle sette.', 'I wake up at seven.', 'mi sveglio', 'si sveglio', 'ti sveglio'), R('I bambini ___ presto.', 'The children fall asleep early.', 'si addormentano', 'ci addormentiamo', 'vi addormentate'), R('Voi ___ per la festa.', 'You are getting ready for the party.', 'vi preparate', 'si preparano', 'ci prepariamo')],
    comparisons: [R('Questo treno è ___ veloce di quello.', 'This train is faster than that one.', 'più', 'molto', 'tanto'), R('Oggi ho ___ tempo libero di ieri.', 'Today I have less free time than yesterday.', 'meno', 'meglio', 'peggio'), R('Il museo costa meno ___ il teatro.', 'The museum costs less than the theater.', 'di', 'che', 'da')],
    imperatives: [R('___ la porta, per favore.', 'Open the door, please.', 'Apri', 'Apre', 'Apro'), R('Non ___ qui.', 'Do not smoke here.', 'fumare', 'fumi', 'fuma'), R('Signora, ___ qui, per favore.', 'Madam, please sit here.', 'si accomodi', 'ti accomodi', 'si accomoda')],
    conditionalMood: [R('___ un tavolo per due, per favore.', 'I would like to reserve a table for two, please.', 'Vorrei', 'Voglio', 'Vorrò'), R('Al tuo posto, ___ più a lungo.', 'In your place, I would stay longer.', 'resterei', 'resto', 'resterò'), R('Mi ___ aiutare con questa valigia?', 'Could you help me with this suitcase?', 'potresti', 'puoi', 'potrai')],
    subjunctive: [R('Penso che lui ___ ragione.', 'I think that he is right.', 'abbia', 'ha', 'avrà'), R('È importante che voi ___ presto.', 'It is important that you arrive early.', 'arriviate', 'arrivate', 'arriverete'), R('Spero che loro ___ bene.', 'I hope they are doing well.', 'stiano', 'stanno', 'staranno')],
    relativeClauses: [R('La ragazza ___ vive qui è mia cugina.', 'The girl who lives here is my cousin.', 'che', 'cui', 'chi'), R('Il libro di ___ parlavi è sul tavolo.', 'The book you were talking about is on the table.', 'cui', 'che', 'chi'), R('Questa è la città in ___ siamo nati.', 'This is the city where we were born.', 'cui', 'che', 'chi')],
    passiveImpersonal: [R('La cena ___ preparata da mia madre.', 'Dinner was prepared by my mother.', 'è stata', 'ha stata', 'è'), R('In biblioteca ___ parlare a bassa voce.', 'In the library, people must speak quietly.', 'si deve', 'ci deve', 'si dobbiamo'), R('Le lettere ___ spedite ieri.', 'The letters were sent yesterday.', 'sono state', 'hanno state', 'è stata')],
    conditionalClauses: [R('Se avessi più tempo, ___ in montagna.', 'If I had more time, I would go to the mountains.', 'andrei', 'vado', 'andrò'), R('Se avessimo prenotato prima, ___ un tavolo.', 'If we had booked earlier, we would have gotten a table.', 'avremmo trovato', 'troveremmo', 'troviamo'), R('Se domani piove, ___ a casa.', 'If it rains tomorrow, we will stay home.', 'resteremo', 'resteremmo', 'siamo restati')],
    advancedSubjunctive: [R('Benché ___ stanco, continua a lavorare.', 'Although he is tired, he keeps working.', 'sia', 'è', 'sarà'), R('Qualunque cosa ___, chiamami.', 'Whatever happens, call me.', 'succeda', 'succede', 'succederà'), R('Non credo che lei ___ già partita.', 'I do not think that she has already left.', 'sia', 'è', 'sarà')],
    compoundTenses: [R('Quando siamo arrivati, il treno ___ già partito.', 'When we arrived, the train had already left.', 'era', 'è', 'sarà'), R('Appena ___ finito, ti chiamo.', 'As soon as I have finished, I will call you.', 'avrò', 'avevo', 'ho'), R('Se avessi saputo, ti ___ prima.', 'If I had known, I would have called you earlier.', 'avrei telefonato', 'telefonavo', 'telefonerò')],
    reportedSpeech: [R('Marco ha detto che ___ malato.', 'Marco said that he was ill.', 'era', 'è', 'sarà'), R('Ha spiegato che ___ il giorno dopo.', 'She explained that she would leave the next day.', 'sarebbe partita', 'parte', 'partirà'), R('Mi ha chiesto se ___ libero.', 'He asked me whether I was free.', 'ero', 'sono', 'sarò')],
    pronounOrder: [R('___ porto il libro domani.', 'I will bring you the book tomorrow.', 'Te lo', 'Lo te', 'Ti il'), R('Voglio ___ dopo la riunione.', 'I want to speak to her after the meeting.', 'parlarle', 'le parlare', 'parlare la'), R('Ho visto Maria e ___ ho salutata.', 'I saw Maria and greeted her.', 'l’', 'le', 'la ho')],
  },
  french: {
    wordOrder: [R('Chaque matin, Marie ___ du café.', 'Every morning, Marie drinks coffee.', 'boit', 'bois', 'buvons'), R('Après le travail, nous ___ au supermarché.', 'After work, we go to the supermarket.', 'allons', 'allez', 'vont'), R('Les enfants ___ un livre avant de dormir.', 'The children read a book before sleeping.', 'lisent', 'lit', 'lisez')],
    pronounsCopula: [R('Je ___ fatigué aujourd’hui.', 'I am tired today.', 'suis', 'es', 'est'), R('Nous ___ deux sœurs.', 'We have two sisters.', 'avons', 'êtes', 'ont'), R('Elles ___ à la maison.', 'They are at home.', 'sont', 'sommes', 'êtes')],
    presentTense: [R('Tu ___ français tous les jours.', 'You study French every day.', 'étudies', 'étudie', 'étudions'), R('Ma sœur ___ au travail en bus.', 'My sister goes to work by bus.', 'va', 'vais', 'vont'), R('Nous ___ une pizza pour le dîner.', 'We are making a pizza for dinner.', 'préparons', 'préparez', 'préparent')],
    adjectiveAgreement: [R('Les maisons sont ___.', 'The houses are large.', 'grandes', 'grand', 'grande'), R('Camille porte une veste ___.', 'Camille is wearing a new jacket.', 'neuve', 'neuf', 'neufs'), R('Mes amies sont très ___.', 'My friends are very kind.', 'gentilles', 'gentil', 'gentille')],
    negationQuestions: [R('Je ne ___ pas de viande.', 'I do not eat meat.', 'mange', 'manges', 'mangent'), R('Où ___ le musée ?', 'Where is the museum?', 'se trouve', 'te trouves', 'me trouve'), R('___-vous un billet de train ?', 'Do you have a train ticket?', 'Avez', 'Avons', 'Ont')],
    pastTenses: [R('Hier, j’___ un film français.', 'Yesterday, I watched a French movie.', 'ai vu', 'voyais', 'verrai'), R('Quand j’étais enfant, j’___ près de la mer.', 'When I was a child, I lived near the sea.', 'habitais', 'ai habité', 'habiterai'), R('Pendant que nous ___, Luc est arrivé.', 'While we were having dinner, Luc arrived.', 'dînions', 'avons dîné', 'dînerons')],
    futureTenses: [R('Demain, je ___ mes grands-parents.', 'Tomorrow, I will visit my grandparents.', 'visiterai', 'visitais', 'ai visité'), R('Samedi, nous ___ à la mer.', 'On Saturday, we will go to the seaside.', 'irons', 'allions', 'sommes allés'), R('Dans un an, je ___ mieux français.', 'In a year, I will speak French better.', 'parlerai', 'parlais', 'ai parlé')],
    objectPronouns: [R('Marie ? Je ___ vois tous les jours.', 'Marie? I see her every day.', 'la', 'lui', 'les'), R('Je ___ téléphone ce soir, à Paul.', 'I will call Paul tonight.', 'lui', 'le', 'la'), R('Tu as les clés ? Je ___ ai ici.', 'Do you have the keys? I have them here.', 'les', 'leur', 'la')],
    reflexiveVerbs: [R('Je ___ à sept heures.', 'I wake up at seven.', 'me réveille', 'se réveille', 'te réveilles'), R('Les enfants ___ tôt.', 'The children fall asleep early.', 's’endorment', 'nous endormons', 'vous endormez'), R('Vous ___ pour la fête.', 'You are getting ready for the party.', 'vous préparez', 'se préparent', 'nous préparons')],
    comparisons: [R('Ce train est ___ rapide que l’autre.', 'This train is faster than the other one.', 'plus', 'très', 'autant'), R('Aujourd’hui, j’ai ___ de temps libre qu’hier.', 'Today I have less free time than yesterday.', 'moins', 'meilleur', 'pire'), R('Le musée coûte moins cher ___ le théâtre.', 'The museum costs less than the theater.', 'que', 'de', 'à')],
    imperatives: [R('___ la porte, s’il vous plaît.', 'Open the door, please.', 'Ouvrez', 'Ouvrons', 'Ouvre-toi'), R('Ne ___ pas ici.', 'Do not smoke here.', 'fumez', 'fumer', 'fumons'), R('___, je vous en prie.', 'Please, sit down.', 'Asseyez-vous', 'Vous asseyez', 'Assoyez')],
    conditionalMood: [R('Je ___ réserver une table pour deux.', 'I would like to reserve a table for two.', 'voudrais', 'veux', 'voudrai'), R('À ta place, je ___ plus longtemps.', 'In your place, I would stay longer.', 'resterais', 'reste', 'resterai'), R('Tu ___ m’aider avec cette valise ?', 'Could you help me with this suitcase?', 'pourrais', 'peux', 'pourras')],
    subjunctive: [R('Je doute qu’il ___ raison.', 'I doubt that he is right.', 'ait', 'a', 'aura'), R('Il faut que vous ___ tôt.', 'It is necessary that you arrive early.', 'arriviez', 'arrivez', 'arriverez'), R('Je souhaite qu’elles ___ bien.', 'I hope they are doing well.', 'aillent', 'vont', 'iront')],
    relativeClauses: [R('La femme ___ habite ici est ma cousine.', 'The woman who lives here is my cousin.', 'qui', 'que', 'dont'), R('Le livre ___ tu parles est sur la table.', 'The book you are talking about is on the table.', 'dont', 'qui', 'où'), R('C’est la ville ___ nous sommes nés.', 'This is the city where we were born.', 'où', 'qui', 'que')],
    passiveImpersonal: [R('Le dîner ___ préparé par ma mère.', 'Dinner was prepared by my mother.', 'a été', 'est été', 'avait'), R('À la bibliothèque, on ___ parler doucement.', 'In the library, people must speak quietly.', 'doit', 'est', 'sont'), R('Les lettres ___ envoyées hier.', 'The letters were sent yesterday.', 'ont été', 'sont eu', 'a été')],
    conditionalClauses: [R('Si j’avais plus de temps, j’___ en montagne.', 'If I had more time, I would go to the mountains.', 'irais', 'vais', 'irai'), R('Si nous avions réservé plus tôt, nous ___ une table.', 'If we had booked earlier, we would have gotten a table.', 'aurions trouvé', 'trouverions', 'trouvons'), R('S’il pleut demain, nous ___ à la maison.', 'If it rains tomorrow, we will stay home.', 'resterons', 'resterions', 'sommes restés')],
    advancedSubjunctive: [R('Bien qu’il ___ fatigué, il continue à travailler.', 'Although he is tired, he keeps working.', 'soit', 'est', 'sera'), R('Quoi qu’il ___, appelle-moi.', 'Whatever happens, call me.', 'arrive', 'arrivera', 'arrivait'), R('Je ne crois pas qu’elle ___ déjà partie.', 'I do not think that she has already left.', 'soit', 'est', 'sera')],
    compoundTenses: [R('Quand nous sommes arrivés, le train ___ déjà parti.', 'When we arrived, the train had already left.', 'était', 'est', 'sera'), R('Dès que j’___ fini, je t’appellerai.', 'As soon as I have finished, I will call you.', 'aurai', 'avais', 'ai'), R('Si j’avais su, je t’___ plus tôt.', 'If I had known, I would have called you earlier.', 'aurais appelé', 'appelais', 'appellerai')],
    reportedSpeech: [R('Marc a dit qu’il ___ malade.', 'Marc said that he was ill.', 'était', 'est', 'sera'), R('Elle a expliqué qu’elle ___ le lendemain.', 'She explained that she would leave the next day.', 'partirait', 'part', 'partira'), R('Il m’a demandé si j’___ libre.', 'He asked me whether I was free.', 'étais', 'suis', 'serai')],
    pronounOrder: [R('Je ___ donne demain.', 'I will give it to you tomorrow.', 'te le', 'le te', 'ton le'), R('Je veux ___ après la réunion.', 'I want to speak to her after the meeting.', 'lui parler', 'parler lui', 'la parler'), R('J’ai vu Marie et je ___ ai saluée.', 'I saw Marie and greeted her.', 'l’', 'lui', 'la lui')],
  },
  spanish: {
    wordOrder: [R('Cada mañana, María ___ café.', 'Every morning, María drinks coffee.', 'bebe', 'bebes', 'bebo'), R('Después del trabajo, nosotros ___ al supermercado.', 'After work, we go to the supermarket.', 'vamos', 'van', 'vas'), R('Los niños ___ un libro antes de dormir.', 'The children read a book before sleeping.', 'leen', 'lee', 'leemos')],
    pronounsCopula: [R('Yo ___ cansado hoy.', 'I am tired today.', 'estoy', 'estás', 'está'), R('Nosotros ___ dos hermanas.', 'We have two sisters.', 'tenemos', 'tienen', 'tengo'), R('Ellas ___ en casa.', 'They are at home.', 'están', 'estamos', 'estáis')],
    presentTense: [R('Tú ___ español todos los días.', 'You study Spanish every day.', 'estudias', 'estudio', 'estudia'), R('Mi hermana ___ al trabajo en autobús.', 'My sister goes to work by bus.', 'va', 'voy', 'van'), R('Nosotros ___ una pizza para cenar.', 'We are making a pizza for dinner.', 'preparamos', 'preparan', 'preparas')],
    adjectiveAgreement: [R('Las casas son ___.', 'The houses are large.', 'grandes', 'grande', 'grando'), R('Camila lleva una chaqueta ___.', 'Camila is wearing a new jacket.', 'nueva', 'nuevo', 'nuevos'), R('Mis amigas son muy ___.', 'My friends are very kind.', 'amables', 'amable', 'amablo')],
    negationQuestions: [R('No ___ carne.', 'I do not eat meat.', 'como', 'comes', 'come'), R('¿Dónde ___ el museo?', 'Where is the museum?', 'está', 'estoy', 'están'), R('¿___ un billete de tren?', 'Do you have a train ticket?', 'Tienes', 'Tiene', 'Tengo')],
    pastTenses: [R('Ayer ___ una película española.', 'Yesterday, I watched a Spanish movie.', 'vi', 'veía', 'veré'), R('Cuando era niño, ___ cerca del mar.', 'When I was a child, I lived near the sea.', 'vivía', 'viví', 'viviré'), R('Mientras nosotros ___, llegó Luis.', 'While we were having dinner, Luis arrived.', 'cenábamos', 'cenamos', 'cenaremos')],
    futureTenses: [R('Mañana ___ a mis abuelos.', 'Tomorrow, I will visit my grandparents.', 'visitaré', 'visitaba', 'he visitado'), R('El sábado nosotros ___ a la playa.', 'On Saturday, we will go to the beach.', 'iremos', 'íbamos', 'fuimos'), R('Dentro de un año ___ mejor español.', 'In a year, I will speak Spanish better.', 'hablaré', 'hablaba', 'he hablado')],
    objectPronouns: [R('¿María? ___ veo todos los días.', 'María? I see her every day.', 'La', 'Le', 'Las'), R('A Pablo ___ llamo esta noche.', 'I will call Pablo tonight.', 'lo', 'le', 'la'), R('¿Tienes las llaves? ___ tengo aquí.', 'Do you have the keys? I have them here.', 'Las', 'Los', 'Le')],
    reflexiveVerbs: [R('Yo ___ a las siete.', 'I wake up at seven.', 'me despierto', 'se despierta', 'te despiertas'), R('Los niños ___ temprano.', 'The children fall asleep early.', 'se duermen', 'nos dormimos', 'os dormís'), R('Vosotros ___ para la fiesta.', 'You are getting ready for the party.', 'os preparáis', 'se preparan', 'nos preparamos')],
    comparisons: [R('Este tren es ___ rápido que el otro.', 'This train is faster than the other one.', 'más', 'muy', 'tan'), R('Hoy tengo ___ tiempo libre que ayer.', 'Today I have less free time than yesterday.', 'menos', 'mejor', 'peor'), R('El museo cuesta menos ___ el teatro.', 'The museum costs less than the theater.', 'que', 'de', 'a')],
    imperatives: [R('___ la puerta, por favor.', 'Open the door, please.', 'Abre', 'Abres', 'Abro'), R('No ___ aquí.', 'Do not smoke here.', 'fumes', 'fuma', 'fumando'), R('Señora, ___ aquí, por favor.', 'Madam, please sit here.', 'siéntese', 'siéntate', 'se sienta')],
    conditionalMood: [R('___ reservar una mesa para dos.', 'I would like to reserve a table for two.', 'Quisiera', 'Quiero', 'Querré'), R('En tu lugar, ___ más tiempo.', 'In your place, I would stay longer.', 'me quedaría', 'me quedo', 'me quedaré'), R('¿___ ayudarme con esta maleta?', 'Could you help me with this suitcase?', 'Podrías', 'Puedes', 'Podrás')],
    subjunctive: [R('Dudo que él ___ razón.', 'I doubt that he is right.', 'tenga', 'tiene', 'tendrá'), R('Es importante que ustedes ___ temprano.', 'It is important that you arrive early.', 'lleguen', 'llegan', 'llegarán'), R('Espero que ellas ___ bien.', 'I hope they are doing well.', 'estén', 'están', 'estarán')],
    relativeClauses: [R('La mujer ___ vive aquí es mi prima.', 'The woman who lives here is my cousin.', 'que', 'quien', 'donde'), R('El libro ___ me hablaste está en la mesa.', 'The book you told me about is on the table.', 'del que', 'quien', 'donde'), R('Esta es la ciudad ___ nacimos.', 'This is the city where we were born.', 'donde', 'quien', 'que')],
    passiveImpersonal: [R('La cena ___ preparada por mi madre.', 'Dinner was prepared by my mother.', 'fue', 'estuvo', 'hizo'), R('En esta biblioteca ___ hablar en voz baja.', 'In this library, people must speak quietly.', 'se debe', 'lo debe', 'se deben'), R('Las cartas ___ enviadas ayer.', 'The letters were sent yesterday.', 'fueron', 'estuvieron', 'eran')],
    conditionalClauses: [R('Si tuviera más tiempo, ___ a las montañas.', 'If I had more time, I would go to the mountains.', 'iría', 'voy', 'iré'), R('Si hubiéramos reservado antes, ___ una mesa.', 'If we had booked earlier, we would have gotten a table.', 'habríamos encontrado', 'encontraríamos', 'encontramos'), R('Si mañana llueve, ___ en casa.', 'If it rains tomorrow, we will stay home.', 'nos quedaremos', 'nos quedaríamos', 'nos quedamos')],
    advancedSubjunctive: [R('Aunque ___ cansado, seguirá trabajando.', 'Even if he is tired, he will keep working.', 'esté', 'está', 'estará'), R('Pase lo que ___, llámame.', 'Whatever happens, call me.', 'pase', 'pasará', 'pasaba'), R('No creo que ella ___ salido ya.', 'I do not think that she has already left.', 'haya', 'ha', 'habrá')],
    compoundTenses: [R('Cuando llegamos, el tren ya ___ salido.', 'When we arrived, the train had already left.', 'había', 'ha', 'habrá'), R('En cuanto ___ terminado, te llamaré.', 'As soon as I have finished, I will call you.', 'haya', 'había', 'he'), R('Si lo hubiera sabido, te ___ antes.', 'If I had known, I would have called you earlier.', 'habría llamado', 'llamaba', 'llamaré')],
    reportedSpeech: [R('Marco dijo que ___ enfermo.', 'Marco said that he was ill.', 'estaba', 'está', 'estará'), R('Ella explicó que ___ al día siguiente.', 'She explained that she would leave the next day.', 'saldría', 'sale', 'saldrá'), R('Me preguntó si ___ libre.', 'He asked me whether I was free.', 'estaba', 'estoy', 'estaré')],
    pronounOrder: [R('Mañana ___ doy el libro.', 'Tomorrow, I will give you the book.', 'te lo', 'lo te', 'tu lo'), R('Quiero ___ después de la reunión.', 'I want to speak to her after the meeting.', 'hablarle', 'le hablar', 'la hablar'), R('Vi a María y ___ saludé.', 'I saw María and greeted her.', 'la', 'le', 'lo')],
  },
  armenian: {
    wordOrder: [R('Ամէն առաւօտ Մարիան սուրճ ___։', 'Every morning, Maria drinks coffee.', 'կը խմէ', 'կը խմեմ', 'կը խմես'), R('Գործէն ետք մենք շուկայ ___։', 'After work, we go to the market.', 'կ’երթանք', 'կ’երթայ', 'կ’երթաս'), R('Երեխաները գիրք ___։', 'The children read a book.', 'կը կարդան', 'կը կարդայ', 'կը կարդամ')],
    pronounsCopula: [R('Ես այսօր յոգնած ___։', 'I am tired today.', 'եմ', 'ես', 'է'), R('Մենք երկու քոյր ___։', 'We have two sisters.', 'ունինք', 'ունի', 'ունիք'), R('Անոնք տունը ___։', 'They are at home.', 'են', 'ենք', 'էք')],
    presentTense: [R('Դուն ամէն օր հայերէն ___։', 'You study Armenian every day.', 'կը սորվիս', 'կը սորվիմ', 'կը սորվի'), R('Քոյրս ամէն օր աշխատանքի ___։', 'My sister goes to work every day.', 'կ’երթայ', 'կ’երթամ', 'կ’երթաս'), R('Մենք ընթրիքի համար ճաշ ___։', 'We prepare food for dinner.', 'կը պատրաստենք', 'կը պատրաստեն', 'կը պատրաստէ')],
    adjectiveAgreement: [R('Այս տուները շատ ___ են։', 'These houses are very large.', 'մեծ', 'մեծեր', 'մեծը'), R('Մարին ___ հագուստ կը հագնի։', 'Mary wears new clothes.', 'նոր', 'նորը', 'նորեր'), R('Իմ բարեկամներս շատ ___ են։', 'My friends are very kind.', 'բարի', 'բարին', 'բարիներ')],
    negationQuestions: [R('Ես միս չեմ ___։', 'I do not eat meat.', 'ուտեր', 'ուտէր', 'կերայ'), R('Թանգարանը ո՞ւր ___։', 'Where is the museum?', 'է', 'եմ', 'ես'), R('Դուն գնացքի տոմս ___։', 'Do you have a train ticket?', 'ունի՞ս', 'ունի՞', 'ունի՞նք')],
    pastTenses: [R('Երէկ հայկական ֆիլմ մը ___։', 'Yesterday, I watched an Armenian film.', 'դիտեցի', 'կը դիտէի', 'պիտի դիտեմ'), R('Երբ երեխայ էի, ծովուն մօտ ___։', 'When I was a child, I lived near the sea.', 'կ’ապրէի', 'ապրեցայ', 'պիտի ապրիմ'), R('Մինչ մենք կ’ընթրէինք, Լեւոնը ___։', 'While we were having dinner, Levon arrived.', 'եկաւ', 'կու գայ', 'պիտի գայ')],
    futureTenses: [R('Վաղը մեծ ծնողներս ___։', 'Tomorrow I will visit my grandparents.', 'պիտի այցելեմ', 'կը այցելէի', 'այցելեցի'), R('Շաբաթ օրը ծովափ ___։', 'On Saturday, we will go to the seaside.', 'պիտի երթանք', 'կ’երթայինք', 'գացինք'), R('Մէկ տարի ետք աւելի լաւ հայերէն ___։', 'In a year, I will speak Armenian better.', 'պիտի խօսիմ', 'կը խօսէի', 'խօսեցայ')],
    objectPronouns: [R('Մարիա՞ն։ Ամէն օր ___ կը տեսնեմ։', 'Maria? I see her every day.', 'զայն', 'զանոնք', 'զիս'), R('Պօղոսին այսօր երեկոյեան ___ կը հեռաձայնեմ։', 'I will call Paul this evening.', 'իրեն', 'զայն', 'ինծի'), R('Բանալիները ունիս՞։ ___ հոս ունիմ։', 'Do you have the keys? I have them here.', 'զանոնք', 'զայն', 'զիս')],
    reflexiveVerbs: [R('Ես առաւօտեան ժամը եօթին ___։', 'I wake up at seven in the morning.', 'կ’արթննամ', 'կ’արթննայ', 'կ’արթննաս'), R('Երեխաները կանուխ ___։', 'The children fall asleep early.', 'կը քնանան', 'կը քնանայ', 'կը քնանամ'), R('Դուք խնջոյթին համար ___։', 'You are getting ready for the party.', 'կը պատրաստուիք', 'կը պատրաստուի', 'կը պատրաստուիմ')],
    comparisons: [R('Այս գնացքը միւսէն ___ արագ է։', 'This train is faster than the other one.', 'աւելի', 'շատ', 'նուազ'), R('Այսօր երէկուընէ ___ ազատ ժամանակ ունիմ։', 'Today I have less free time than yesterday.', 'նուազ', 'աւելի', 'լաւ'), R('Թանգարանը թատրոնէն աւելի աժան ___։', 'The museum is cheaper than the theater.', 'է', 'եմ', 'ես')],
    imperatives: [R('Դուռը ___, խնդրեմ։', 'Open the door, please.', 'բացէ՛', 'կը բանայ', 'բացի'), R('Հոս ___։', 'Do not smoke here.', 'մի՛ ծխեր', 'կը ծխէ', 'ծխեց'), R('Տիկի՛ն, հոս ___, խնդրեմ։', 'Madam, please sit here.', 'նստեցէ՛ք', 'նստեցաւ', 'նստիմ')],
    conditionalMood: [R('Խնդրեմ, երկու հոգիի համար սեղան մը ___։', 'I would like to reserve a table for two, please.', 'կ’ուզէի ամրագրել', 'կը սկսիմ', 'պիտի ամրագրեմ'), R('Քու տեղդ ըլլայի, աւելի երկար ___։', 'In your place, I would stay longer.', 'կը մնայի', 'կը մնայ', 'պիտի մնամ'), R('___ այս ճամպրուկիս օգնել։', 'Could you help me with this suitcase?', 'Կրնա՞յիր', 'Կրնա՞մ', 'Կրնա՞յ')],
    subjunctive: [R('Կարեւոր է, որ դուք կանուխ ___։', 'It is important that you arrive early.', 'հասնիք', 'կը հասնիք', 'հասաք'), R('Կ’ուզեմ, որ ան ___։', 'I want him to come.', 'գայ', 'կու գայ', 'եկաւ'), R('Կը յուսամ, որ անոնք լաւ ___։', 'I hope they are doing well.', 'ըլլան', 'են', 'պիտի ըլլան')],
    relativeClauses: [R('Այն կինը, ___ հոս կ’ապրի, իմ զարմուհիս է։', 'The woman who lives here is my cousin.', 'որ', 'ուր', 'երբ'), R('Այն գիրքը, ___ մասին կը խօսէիր, սեղանին վրայ է։', 'The book you were talking about is on the table.', 'որուն', 'որ', 'ուր'), R('Այս է այն քաղաքը, ___ ծնած ենք։', 'This is the city where we were born.', 'ուր', 'որ', 'ով')],
    passiveImpersonal: [R('Նամակը երէկ ___։', 'The letter was written yesterday.', 'գրուեցաւ', 'կը գրէ', 'պիտի գրէ'), R('Գրադարանին մէջ կամաց ___ պէտք է։', 'In the library, people must speak quietly.', 'խօսիլ', 'խօսեցայ', 'կը խօսիմ'), R('Այս տուները անցեալ տարի ___։', 'These houses were built last year.', 'շինուեցան', 'շինեց', 'կը շինէ')],
    conditionalClauses: [R('Եթէ աւելի ժամանակ ունենայի, լեռները ___։', 'If I had more time, I would go to the mountains.', 'կ’երթայի', 'կ’երթամ', 'պիտի երթամ'), R('Եթէ կանուխ ամրագրէինք, սեղան մը ___։', 'If we had booked earlier, we would have found a table.', 'գտած կ’ըլլայինք', 'կը գտնենք', 'պիտի գտնենք'), R('Եթէ վաղը անձրեւէ, տունը ___։', 'If it rains tomorrow, we will stay home.', 'պիտի մնանք', 'կը մնայինք', 'մնացինք')],
    advancedSubjunctive: [R('Թէեւ ___, կը շարունակէ աշխատիլ։', 'Although he is tired, he keeps working.', 'յոգնած ըլլայ', 'յոգնած է', 'յոգնած էր'), R('Ինչ որ ___, ինծի հեռաձայնէ։', 'Whatever happens, call me.', 'պատահի', 'պատահեցաւ', 'պիտի պատահէ'), R('Չեմ կարծեր, որ ան արդէն ___։', 'I do not think that he has already left.', 'գացած ըլլայ', 'գացած է', 'պիտի երթայ')],
    compoundTenses: [R('Երբ հասանք, գնացքը արդէն ___։', 'When we arrived, the train had already left.', 'գացած էր', 'կը գայ', 'պիտի գայ'), R('Երբ ___, քեզի կը հեռաձայնեմ։', 'As soon as I have finished, I will call you.', 'աւարտեմ', 'աւարտեցի', 'կ’աւարտէի'), R('Եթէ գիտնայի, քեզի աւելի կանուխ ___։', 'If I had known, I would have called you earlier.', 'հեռաձայնած կ’ըլլայի', 'կը հեռաձայնեմ', 'պիտի հեռաձայնեմ')],
    reportedSpeech: [R('Մարկոս ըսաւ, որ ___։', 'Marco said that he was ill.', 'հիւանդ էր', 'հիւանդ է', 'հիւանդ պիտի ըլլայ'), R('Ան բացատրեց, որ յաջորդ օրը ___։', 'She explained that she would leave the next day.', 'պիտի մեկնի', 'կը մեկնէ', 'մեկնեցաւ'), R('Ինծի հարցուց, թէ ___։', 'He asked me whether I was free.', 'ազատ էի', 'ազատ եմ', 'ազատ պիտի ըլլամ')],
    pronounOrder: [R('Գիրքը ___ կու տամ։', 'I give him the book.', 'իրեն', 'զայն', 'ինծի'), R('Ամէն օր ___ կը տեսնեմ։', 'I see her every day.', 'զայն', 'ինքզինք', 'մեզի'), R('Այս նամակը վաղը ___ պիտի ղրկեմ։', 'I will send this letter to them tomorrow.', 'իրենց', 'զանոնք', 'ինծի')],
  },
};

const sections: { band: GrammarBand; title: string; description: string; ids: (GrammarUnit['id'])[] }[] = [
  { band: 'A1', title: 'A1 · Beginner', description: 'Build clear everyday sentences from the essentials.', ids: ['wordOrder', 'pronounsCopula', 'articles', 'presentTense', 'verbFoundations', 'adjectiveAgreement', 'negationQuestions'] },
  { band: 'A2', title: 'A2 · Elementary', description: 'Talk about routines, plans, past events, and people around you.', ids: ['pastTenses', 'futureTenses', 'objectPronouns', 'reflexiveVerbs', 'prepositions', 'comparisons'] },
  { band: 'B1', title: 'B1 · Intermediate', description: 'Connect ideas and express requests, possibilities, and opinions.', ids: ['imperatives', 'conditionalMood', 'subjunctive', 'relativeClauses', 'passiveImpersonal'] },
  { band: 'B2', title: 'B2 · Upper-intermediate', description: 'Handle nuanced, hypothetical, and more complex sentences.', ids: ['conditionalClauses', 'advancedSubjunctive', 'compoundTenses', 'reportedSpeech', 'pronounOrder'] },
];

export function getGrammarCourse(language: Language): GrammarCourseSection[] {
  return sections.map(section => ({
    band: section.band,
    title: section.title,
    description: section.description,
    units: section.ids.map(id => {
      const info = lessonInfo.find(lesson => lesson.id === id);
      if (!info) throw new Error(`Grammar unit metadata is missing: ${id}`);
      const questionRows = id in (rows[language] ?? {}) ? rows[language][id as GrammarUnitId] : undefined;
      const questions = (questionRows ?? []).map(([sentence, sentenceTranslation, answer, wrong1, wrong2]) => ({
        prompt: 'Complete the sentence.',
        hint: info.description,
        sentence,
        sentenceTranslation,
        answer,
        choices: [answer, wrong1, wrong2],
        explanation: info.rule,
      }));
      return { ...info, questions };
    }),
  }));
}

export function getGrammarUnitCount(): number {
  return sections.reduce((count, section) => count + section.ids.length, 0);
}
