import type { Language } from './vocabulary';

const NOTES: Record<Language, Record<string, string>> = {
  italian: {
    wordOrder: 'A simple statement usually puts the person or thing first, then the verb, then its object. Italian often leaves out the subject pronoun because the verb ending already shows who acts: parlo means “I speak.”',
    pronounsCopula: 'Use essere for identity or state and avere for possession. The form must match the subject: io sono, tu sei, lui/lei è; io ho, tu hai, lui/lei ha. Do not translate English “am/is/are” with avere.',
    possessives: 'A possessive agrees with the thing owned, not its owner: mio fratello, mia sorella, i miei libri, le mie case. A singular close-family noun normally drops the article: mia sorella, but la loro sorella.',
    articles: 'Choose an article using gender, number, and the next sound. Masculine singular uses il, lo, or l’; feminine uses la or l’. Masculine plural uses i or gli. Use gli before vowels, z, gn, ps/pn, x, y, and s + consonant. Feminine plural uses le.',
    presentTense: 'The verb ending changes with the subject. With regular -are verbs, io uses -o, tu uses -i, and lui/lei uses -a: parlo, parli, parla. -ere and -ire verbs use different patterns, and common verbs such as essere and andare are irregular.',
    adjectiveAgreement: 'Most adjectives change to match the noun: masculine singular -o, feminine singular -a, masculine plural -i, feminine plural -e. Adjectives ending in -e usually have plural -i: grande → grandi.',
    negationQuestions: 'Put non immediately before the conjugated verb to make a negative: non mangio. Question words such as dove, quando, and perché introduce questions; you usually do not need an extra English-style “do.”',
    prepositions: 'Use prepositions to connect a place, direction, time, or owner: a Roma, in Italia, di Maria, con Luca. Some combine with a definite article: a + il = al, di + il = del, in + il = nel. Choose the relationship first, then the article.',
    pastTenses: 'Use passato prossimo for a completed event: an avere or essere form + past participle. With essere, the participle agrees with the subject. The imperfect describes a background, habit, or ongoing past action.',
    futureTenses: 'The future uses a future stem plus endings such as -ò, -ai, and -à: parlerò, parlerai, parlerà. Many -are verbs change the stem vowel to -e-. Common irregular stems, such as andr- and avr-, need separate practice.',
    imperatives: 'A command addresses someone directly. Regular tu commands often end in -a for -are verbs and -i for -ere/-ire verbs. A negative tu command uses non + infinitive: non fumare. Formal Lei commands use a different form.',
    comparisons: 'Use più for “more” and meno for “less,” then the adjective. Use di for many comparisons between people or things: più veloce di quello. Some comparisons between two qualities or actions use che instead.',
    conditionalMood: 'The conditional makes a request less direct or describes an imagined result. Vorrei means “I would like”; potresti means “you could.” It is not the same as a definite future plan.',
    relativeClauses: 'Che can be the subject or direct object of a relative clause. After a preposition, use cui: il libro di cui parlavi. Keep the preposition that the verb or expression requires.',
    subjunctive: 'After many expressions of opinion, wish, doubt, or importance, use the subjunctive: penso che abbia, spero che stiano. The introductory phrase tells you why the dependent verb changes.',
    passiveImpersonal: 'Use essere + a past participle to focus on what receives an action. The participle agrees with that subject. Impersonal si gives a general meaning such as “people” or “one”: si deve parlare piano.',
    reportedSpeech: 'When reporting a past conversation, adjust the person, time words, and sometimes the verb tense. A future event viewed from the past often uses the past conditional: ha detto che sarebbe partita.',
    pronounOrder: 'Before lo, la, li, or le, mi/ti/ci/vi become me/te/ce/ve: te lo porto. With an infinitive, a short pronoun often attaches to the end: parlare + le → parlarle.',
  },
  french: {
    wordOrder: 'A basic statement usually follows subject + verb + object. Keep the subject with the verb: je parle français. Unlike Italian or Spanish, French normally keeps its subject pronoun.',
    pronounsCopula: 'Use être for identity and state, and avoir for possession. Both change with the subject: je suis, tu es, il/elle est; j’ai, tu as, il/elle a. Learn the subject and verb together.',
    possessives: 'Choose the possessive for the noun that follows: mon frère, ma sœur, mes parents. Before a feminine noun beginning with a vowel sound, use mon/ton/son for smooth pronunciation: mon amie.',
    articles: 'Use le for masculine singular, la for feminine singular, and les for either plural. Le and la become l’ before a vowel sound. Un and une mean “a”; des is a common plural indefinite article.',
    presentTense: 'Match the verb ending to its subject. Regular -er verbs use je parle, tu parles, il parle, nous parlons. Some written endings sound alike, so the subject and spelling both matter. Être, avoir, aller, and faire are irregular.',
    adjectiveAgreement: 'An adjective agrees with the noun’s gender and number. A feminine form often adds -e and a plural often adds -s, but many common adjectives are irregular. Adjectives describing a group of feminine nouns need the feminine plural.',
    negationQuestions: 'In careful written French, put ne before the conjugated verb and pas after it: je ne mange pas. Questions can use est-ce que, inversion, or a question word. Spoken French often drops ne, but the course shows the full form.',
    prepositions: 'Prepositions express a relationship: à Paris, en France, avec Marie. À and de combine with some articles: à + le = au, à + les = aux, de + le = du, de + les = des.',
    pastTenses: 'Use passé composé for a completed event: avoir or être + past participle. Use imparfait for a past habit, description, or action already in progress. With être, the participle usually agrees with the subject.',
    futureTenses: 'The simple future usually adds -ai, -as, -a, -ons, -ez, -ont to a future stem. Aller in the present + infinitive expresses a near or intended future: je vais partir. Common verbs have irregular future stems.',
    imperatives: 'A command normally leaves out its subject pronoun: ouvre la porte. Regular -er verbs usually drop the final -s in the tu command. Put ne and pas around a negative command: ne fume pas.',
    comparisons: 'Compare with plus… que, moins… que, or aussi… que. The adjective still agrees with its noun. Meilleur compares bon; mieux compares bien.',
    conditionalMood: 'Use the conditional for a polite request or imagined result. Je voudrais means “I would like.” Its endings resemble the imperfect, but they attach to the future stem.',
    relativeClauses: 'Use qui when the relative word is the subject, and que when it is the direct object. Dont often stands for de + a thing or person: le livre dont tu parles. The role inside the new clause determines the form.',
    subjunctive: 'Expressions such as il faut que, je veux que, and je doute que often take the subjunctive. The verb after que changes because the idea is required, wished for, or uncertain rather than simply stated as fact.',
    passiveImpersonal: 'The passive uses être + a past participle, with agreement with the subject. On is a common way to make a general statement without naming a specific actor. Il faut expresses necessity.',
    reportedSpeech: 'After a past reporting verb, pronouns, time words, and tenses may shift. A future event viewed from the past often uses the conditional: elle a dit qu’elle partirait.',
    pronounOrder: 'Object pronouns normally go before a conjugated verb or before the infinitive they belong to. In common combinations, me/te/se/nous/vous precede le/la/les, then lui/leur, then y, then en.',
  },
  spanish: {
    wordOrder: 'A basic statement often follows subject + verb + object, but Spanish can leave out the subject pronoun when the verb ending makes it clear: hablo means “I speak.” Keep the meaning clear before varying the order.',
    pronounsCopula: 'Use ser for identity and many defining characteristics; use estar for location and many states. Tener means “to have.” Each changes with the subject: soy/eres/es, estoy/estás/está, tengo/tienes/tiene.',
    possessives: 'Short possessives go before the noun and agree in number: mi hermano, mis hermanos. Nuestro and vuestro also agree in gender: nuestra casa. The person who owns the object determines mi, tu, su, or nuestro.',
    articles: 'Articles normally agree with a noun’s gender and number: el/la in the singular, los/las in the plural; un/una means “a.” A stressed initial a- can take el with a feminine singular noun, as in el agua.',
    presentTense: 'The ending changes with the subject and the infinitive group. Regular -ar verbs include hablo, hablas, habla; -er includes como, comes, come; -ir includes vivo, vives, vive. Stem-changing and irregular verbs need their own forms.',
    adjectiveAgreement: 'Most adjectives agree in gender and number: casa nueva, casas nuevas. An adjective ending in -e often uses the same singular form for either gender. Many descriptive adjectives follow the noun.',
    negationQuestions: 'Put no before the conjugated verb to make a negative: no como carne. Question words such as dónde, cuándo, and qué carry written accents in questions. Written questions use both ¿ and ?.',
    prepositions: 'Use a for many destinations, en for location, de for origin or possession, and con for company. A + el becomes al; de + el becomes del. Por and para have different uses and are not interchangeable.',
    pastTenses: 'Use the preterite for a bounded, completed past event. Use the imperfect for habits, descriptions, and actions in progress in the past. A finished event can interrupt an imperfect background.',
    futureTenses: 'The simple future usually keeps the infinitive and adds -é, -ás, -á, -emos, -éis, -án. Ir a + infinitive expresses a plan: voy a salir. Common verbs such as tener have irregular future stems.',
    imperatives: 'A command changes for tú, usted, vosotros, or ustedes. Negative commands often use a subjunctive form rather than the positive command form. Object pronouns attach to positive commands but precede negative ones.',
    comparisons: 'Use más… que or menos… que to compare, and tan… como for equality with an adjective. Mejor and peor are common irregular comparatives. Quantity comparisons can use tanto, tanta, tantos, or tantas.',
    conditionalMood: 'The conditional describes an imagined result or makes a request polite. Its endings attach to the infinitive: hablaría, hablarías. Common future-stem irregularities also appear in the conditional.',
    relativeClauses: 'Que often joins a noun to a defining relative clause. After a preposition, the required relative form can change: con quien, de que, or en el que. Choose the form for its role inside the clause.',
    subjunctive: 'Wishes, doubts, recommendations, and some non-factual ideas trigger the subjunctive after que. A statement of belief may take the indicative, but negating that belief often changes the mood: no creo que sea.',
    passiveImpersonal: 'A passive can use ser + a participle that agrees with the subject. Se also makes many general or passive statements: se venden entradas. The verb agrees with a plural subject in a passive-se sentence.',
    reportedSpeech: 'When reporting a past statement, adjust pronouns and time expressions and use a tense that fits the new point of view. A future seen from a past viewpoint commonly becomes the conditional.',
    pronounOrder: 'Indirect-object pronouns usually come before direct-object pronouns. Le or les changes to se before lo/la/los/las: se lo doy. Pronouns precede finite verbs but can attach to infinitives and positive commands.',
  },
  armenian: {
    wordOrder: 'Western Armenian commonly places the main verb near the end of a statement. Start by identifying who acts and what is affected. Subject pronouns can be omitted when the verb ending makes the person clear.',
    pronounsCopula: 'The present forms of “be” agree with the subject: եմ, ես, է, ենք, էք, են. Possession uses ունենալ, not the same linking verb. Learn the whole short sentence rather than translating each English word separately.',
    possessives: 'Possession can use a possessive word and noun endings. Իմ means “my,” քու means “your,” and մեր means “our.” The suffixes -ս and -դ can also mark “my” and “your.” Notice the complete noun form in each example.',
    articles: 'Western Armenian has no masculine/feminine article distinction. The definite article is attached to the noun as -ը or -ն, while indefinite մը usually follows the noun. Learn the article together with the noun’s sound and sentence form.',
    presentTense: 'Many Western Armenian present-tense statements use կը before the conjugated verb. The ending still changes with the person. Learn կը կարդամ as a complete pattern meaning “I read” rather than treating կը as an English word.',
    adjectiveAgreement: 'Armenian does not have the Romance-language pattern of masculine and feminine adjective endings. An attributive adjective usually comes before the noun. Pay attention to noun number and case rather than inventing gender endings.',
    negationQuestions: 'Negative verb forms use the negative marker չ- and language-specific helper forms. Present negatives do not simply add an English-style “not.” Question words and the question mark’s placement also differ from English.',
    prepositions: 'Many relationships are expressed with a noun’s case and a following postposition, such as սեղանին վրայ, “on the table.” Learn the noun form and relationship word together; do not assume the English preposition comes first.',
    pastTenses: 'Distinguish a completed past event from an action or habit continuing in the past. Western Armenian past forms and helper words do not map one-to-one onto English. Use the time setting in the full example sentence.',
    futureTenses: 'Պիտի commonly introduces a future action with the appropriate verb form. Keep the person ending with the verb. Notice the difference between a future plan and a past description in each example.',
    imperatives: 'A command uses its own form for the person addressed. Negative commands have a distinct construction, often with մի՛. Learn the full polite or familiar request, including its ending and punctuation.',
    comparisons: 'Comparisons commonly use աւելի for “more” and a comparison phrase. The compared noun’s form matters. Armenian adjectives do not need masculine/feminine agreement endings.',
    conditionalMood: 'Use the complete Western Armenian conditional construction for an imagined result or a polite request. The helper words and endings carry the meaning together; copying an English “would” word by word is unreliable.',
    relativeClauses: 'A relative clause adds information about a person or thing. The relative word’s form reflects its role in the clause. Keep the verb and the case relationship of the full example in view.',
    subjunctive: 'Wishes, recommendations, and required actions can use a dependent verb construction. Pay attention to the introductory expression and the person ending, not only to the English tense name.',
    passiveImpersonal: 'Passive and impersonal constructions focus on the action or general situation rather than naming an actor. Armenian may express this with a derived verb or another construction rather than a literal English passive.',
    reportedSpeech: 'Reported speech can change the person, time expression, and verbal viewpoint. Keep clear who originally spoke and who is reporting. Practice the entire example rather than replacing a single verb.',
    pronounOrder: 'Pronouns and noun case show who receives an action. Their order and form do not follow Italian, French, or Spanish clitic rules. Read each Western Armenian example as a complete sentence.',
  },
};

export function getLanguageGrammarNote(language: Language, grammarId: string) {
  return NOTES[language][grammarId];
}

export function getGuidedGrammarTable(language: Language, grammarId: string): { label: string; form: string }[] {
  if (grammarId === 'pronounsCopula') {
    return {
      italian: [{ label: 'I', form: 'io sono' }, { label: 'you', form: 'tu sei' }, { label: 'he / she', form: 'lui / lei è' }, { label: 'we', form: 'noi siamo' }],
      french: [{ label: 'I', form: 'je suis' }, { label: 'you', form: 'tu es' }, { label: 'he / she', form: 'il / elle est' }, { label: 'we', form: 'nous sommes' }],
      spanish: [{ label: 'I am (identity)', form: 'yo soy' }, { label: 'you are (identity)', form: 'tú eres' }, { label: 'he / she is (identity)', form: 'él / ella es' }, { label: 'we are (identity)', form: 'nosotros somos' }],
      armenian: [{ label: 'I am', form: 'ես եմ' }, { label: 'you are', form: 'դուն ես' }, { label: 'he / she is', form: 'ան է' }, { label: 'we are', form: 'մենք ենք' }],
    }[language];
  }
  if (grammarId === 'articles') {
    return {
      italian: [{ label: 'masculine singular', form: 'il / lo / l’' }, { label: 'feminine singular', form: 'la / l’' }, { label: 'masculine plural', form: 'i / gli' }, { label: 'feminine plural', form: 'le' }],
      french: [{ label: 'masculine singular', form: 'le / l’' }, { label: 'feminine singular', form: 'la / l’' }, { label: 'plural', form: 'les' }, { label: 'a / an', form: 'un / une' }],
      spanish: [{ label: 'masculine singular', form: 'el' }, { label: 'feminine singular', form: 'la' }, { label: 'masculine plural', form: 'los' }, { label: 'feminine plural', form: 'las' }],
      armenian: [{ label: 'definite (the)', form: 'noun + ը / ն' }, { label: 'indefinite (a)', form: 'noun + մը' }],
    }[language];
  }
  return [];
}
