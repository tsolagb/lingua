import type { Category, Language, WordPair } from './vocabulary';

type TranslationSet = Record<Language, string>;

const pending = (english: string, translations: TranslationSet): WordPair => ({
  english,
  translations,
  translationReviewStatus: 'pending-review',
});

const reviewNotice =
  'New translations are pending review. Western Armenian wording needs Nayiri or qualified native-speaker verification.';

export const THEMATIC_CATEGORIES: Category[] = [
  {
    id: 'fruit-vegetables',
    name: 'Fruit & Vegetables',
    icon: 'food-apple',
    emoji: '🍓',
    bgColor: '#ECFDF5',
    accentColor: '#059669',
    section: 'vocabulary',
    translationReviewNotice: reviewNotice,
    levels: [
      { pairs: [
        pending('apple', { italian: 'mela', french: 'pomme', spanish: 'manzana', armenian: 'խնձոր' }),
        pending('banana', { italian: 'banana', french: 'banane', spanish: 'banana', armenian: 'բանան' }),
        pending('orange', { italian: 'arancia', french: 'orange', spanish: 'naranja', armenian: 'նարինջ' }),
        pending('grape', { italian: 'uva', french: 'raisin', spanish: 'uva', armenian: 'խաղող' }),
        pending('strawberry', { italian: 'fragola', french: 'fraise', spanish: 'fresa', armenian: 'ելակ' }),
        pending('pear', { italian: 'pera', french: 'poire', spanish: 'pera', armenian: 'տանձ' }),
      ]},
      { pairs: [
        pending('tomato', { italian: 'pomodoro', french: 'tomate', spanish: 'tomate', armenian: 'լոլիկ' }),
        pending('carrot', { italian: 'carota', french: 'carotte', spanish: 'zanahoria', armenian: 'գազար' }),
        pending('potato', { italian: 'patata', french: 'pomme de terre', spanish: 'patata', armenian: 'կարտոֆիլ' }),
        pending('onion', { italian: 'cipolla', french: 'oignon', spanish: 'cebolla', armenian: 'սոխ' }),
        pending('cucumber', { italian: 'cetriolo', french: 'concombre', spanish: 'pepino', armenian: 'վարունգ' }),
        pending('lettuce', { italian: 'lattuga', french: 'laitue', spanish: 'lechuga', armenian: 'հազար' }),
      ]},
      { pairs: [
        pending('peach', { italian: 'pesca', french: 'pêche', spanish: 'melocotón', armenian: 'դեղձ' }),
        pending('lemon', { italian: 'limone', french: 'citron', spanish: 'limón', armenian: 'կիտրոն' }),
        pending('watermelon', { italian: 'anguria', french: 'pastèque', spanish: 'sandía', armenian: 'ձմերուկ' }),
        pending('spinach', { italian: 'spinaci', french: 'épinards', spanish: 'espinacas', armenian: 'սպանախ' }),
        pending('broccoli', { italian: 'broccoli', french: 'brocoli', spanish: 'brócoli', armenian: 'բրոկոլի' }),
        pending('mushroom', { italian: 'fungo', french: 'champignon', spanish: 'champiñón', armenian: 'սունկ' }),
      ]},
    ],
  },
  {
    id: 'grocery-store',
    name: 'Grocery Store',
    icon: 'cart',
    emoji: '🛒',
    bgColor: '#EFF6FF',
    accentColor: '#1F6FEB',
    section: 'real-life',
    translationReviewNotice: reviewNotice,
    levels: [
      { pairs: [
        pending('grocery store', { italian: 'negozio di alimentari', french: 'épicerie', spanish: 'tienda de comestibles', armenian: 'մթերքի խանութ' }),
        pending('shopping basket', { italian: 'cestino della spesa', french: 'panier', spanish: 'cesta de la compra', armenian: 'գնումներու զամբիւղ' }),
        pending('shopping cart', { italian: 'carrello della spesa', french: 'chariot', spanish: 'carrito de compras', armenian: 'գնումներու սայլակ' }),
        pending('aisle', { italian: 'corsia', french: 'rayon', spanish: 'pasillo', armenian: 'դարակներու միջանցք' }),
        pending('cashier', { italian: 'cassiere', french: 'caissier', spanish: 'cajero', armenian: 'գանձապահ' }),
        pending('checkout', { italian: 'cassa', french: 'caisse', spanish: 'caja', armenian: 'դրամարկղ' }),
      ]},
      { pairs: [
        pending('price', { italian: 'prezzo', french: 'prix', spanish: 'precio', armenian: 'գին' }),
        pending('receipt', { italian: 'scontrino', french: 'ticket de caisse', spanish: 'recibo', armenian: 'կտրոն' }),
        pending('shopping bag', { italian: 'borsa della spesa', french: 'sac de courses', spanish: 'bolsa de la compra', armenian: 'գնումներու տոպրակ' }),
        pending('dairy products', { italian: 'latticini', french: 'produits laitiers', spanish: 'productos lácteos', armenian: 'կաթնամթերք' }),
        pending('bakery', { italian: 'panetteria', french: 'boulangerie', spanish: 'panadería', armenian: 'հացթուխարան' }),
        pending('fresh produce', { italian: 'frutta e verdura fresca', french: 'fruits et légumes frais', spanish: 'frutas y verduras frescas', armenian: 'թարմ միրգ ու բանջարեղէն' }),
      ]},
      { pairs: [
        pending('frozen food', { italian: 'cibi surgelati', french: 'aliments surgelés', spanish: 'alimentos congelados', armenian: 'սառեցուած սնունդ' }),
        pending('canned food', { italian: 'cibo in scatola', french: 'conserves', spanish: 'comida enlatada', armenian: 'պահածոյուած սնունդ' }),
        pending('ingredient', { italian: 'ingrediente', french: 'ingrédient', spanish: 'ingrediente', armenian: 'բաղադրիչ' }),
        pending('brand', { italian: 'marca', french: 'marque', spanish: 'marca', armenian: 'ապրանքանիշ' }),
        pending('discount', { italian: 'sconto', french: 'réduction', spanish: 'descuento', armenian: 'զեղչ' }),
        pending('self-checkout', { italian: 'cassa automatica', french: 'caisse automatique', spanish: 'caja de autopago', armenian: 'ինքնասպասարկման դրամարկղ' }),
      ]},
    ],
  },
  {
    id: 'restaurant-menus',
    name: 'Restaurant Menus',
    icon: 'silverware-fork-knife',
    emoji: '🍽️',
    bgColor: '#FDF2F8',
    accentColor: '#BE185D',
    section: 'real-life',
    translationReviewNotice: reviewNotice,
    levels: [
      { pairs: [
        pending('appetizer', { italian: 'antipasto', french: 'entrée', spanish: 'aperitivo', armenian: 'նախուտեստ' }),
        pending('main course', { italian: 'piatto principale', french: 'plat principal', spanish: 'plato principal', armenian: 'հիմնական ուտեստ' }),
        pending('side dish', { italian: 'contorno', french: 'accompagnement', spanish: 'guarnición', armenian: 'կողքի ճաշատեսակ' }),
        pending('dessert', { italian: 'dolce', french: 'dessert', spanish: 'postre', armenian: 'անուշեղէն' }),
        pending('daily special', { italian: 'piatto del giorno', french: 'plat du jour', spanish: 'plato del día', armenian: 'օրուան յատուկ ուտեստ' }),
        pending('reservation', { italian: 'prenotazione', french: 'réservation', spanish: 'reserva', armenian: 'ամրագրում' }),
      ]},
      { pairs: [
        pending('vegetarian', { italian: 'vegetariano', french: 'végétarien', spanish: 'vegetariano', armenian: 'բուսակերական' }),
        pending('vegan', { italian: 'vegano', french: 'végétalien', spanish: 'vegano', armenian: 'կենդանական մթերք չպարունակող' }),
        pending('ingredient', { italian: 'ingrediente', french: 'ingrédient', spanish: 'ingrediente', armenian: 'բաղադրիչ' }),
        pending('food allergy', { italian: 'allergia alimentare', french: 'allergie alimentaire', spanish: 'alergia alimentaria', armenian: 'սննդային ալերգիա' }),
        pending('tap water', { italian: 'acqua del rubinetto', french: 'eau du robinet', spanish: 'agua del grifo', armenian: 'ծորակի ջուր' }),
        pending('sparkling water', { italian: 'acqua frizzante', french: 'eau gazeuse', spanish: 'agua con gas', armenian: 'կազաւորուած ջուր' }),
      ]},
      { pairs: [
        pending('well-done', { italian: 'ben cotto', french: 'bien cuit', spanish: 'bien hecho', armenian: 'լաւ եփուած' }),
        pending('medium (cooked)', { italian: 'cottura media', french: 'à point', spanish: 'en su punto', armenian: 'միջին եփուած' }),
        pending('rare (cooked)', { italian: 'al sangue', french: 'saignant', spanish: 'poco hecho', armenian: 'քիչ եփուած' }),
        pending('takeaway', { italian: 'da asporto', french: 'à emporter', spanish: 'para llevar', armenian: 'հետդ տանելու համար' }),
        pending('leftovers', { italian: 'avanzi', french: 'restes', spanish: 'sobras', armenian: 'մնացորդներ' }),
        pending('tip (money)', { italian: 'mancia', french: 'pourboire', spanish: 'propina', armenian: 'թեյավճար' }),
      ]},
    ],
  },
  {
    id: 'museum-streets',
    name: 'Museums & Streets',
    icon: 'map-marker-outline',
    emoji: '🏛️',
    bgColor: '#F5F3FF',
    accentColor: '#7C3AED',
    section: 'real-life',
    translationReviewNotice: reviewNotice,
    levels: [
      { pairs: [
        pending('art gallery', { italian: 'galleria d’arte', french: 'galerie d’art', spanish: 'galería de arte', armenian: 'արուեստի պատկերասրահ' }),
        pending('exhibition', { italian: 'mostra', french: 'exposition', spanish: 'exposición', armenian: 'ցուցահանդէս' }),
        pending('painting (artwork)', { italian: 'dipinto', french: 'tableau', spanish: 'cuadro', armenian: 'նկար' }),
        pending('sculpture', { italian: 'scultura', french: 'sculpture', spanish: 'escultura', armenian: 'քանդակ' }),
        pending('visitor', { italian: 'visitatore', french: 'visiteur', spanish: 'visitante', armenian: 'այցելու' }),
        pending('museum guide', { italian: 'guida del museo', french: 'guide du musée', spanish: 'guía del museo', armenian: 'թանգարանի ուղեցոյց' }),
      ]},
      { pairs: [
        pending('entrance', { italian: 'ingresso', french: 'entrée', spanish: 'entrada', armenian: 'մուտք' }),
        pending('exit', { italian: 'uscita', french: 'sortie', spanish: 'salida', armenian: 'ելք' }),
        pending('audio guide', { italian: 'audioguida', french: 'audioguide', spanish: 'audioguía', armenian: 'ձայնային ուղեցոյց' }),
        pending('museum map', { italian: 'mappa del museo', french: 'plan du musée', spanish: 'mapa del museo', armenian: 'թանգարանի քարտէս' }),
        pending('historical artifact', { italian: 'reperto storico', french: 'objet historique', spanish: 'objeto histórico', armenian: 'պատմական նմուշ' }),
        pending('museum ticket', { italian: 'biglietto del museo', french: 'billet du musée', spanish: 'entrada del museo', armenian: 'թանգարանի տոմս' }),
      ]},
      { pairs: [
        pending('street', { italian: 'strada', french: 'rue', spanish: 'calle', armenian: 'փողոց' }),
        pending('sidewalk', { italian: 'marciapiede', french: 'trottoir', spanish: 'acera', armenian: 'մայթ' }),
        pending('crosswalk', { italian: 'strisce pedonali', french: 'passage piéton', spanish: 'paso de peatones', armenian: 'հետիոտնի անցում' }),
        pending('traffic light', { italian: 'semaforo', french: 'feu tricolore', spanish: 'semáforo', armenian: 'լուսացոյց' }),
        pending('intersection', { italian: 'incrocio', french: 'carrefour', spanish: 'cruce', armenian: 'խաչմերուկ' }),
        pending('bus stop', { italian: 'fermata dell’autobus', french: 'arrêt de bus', spanish: 'parada de autobús', armenian: 'աւտոպուսի կանգառ' }),
      ]},
    ],
  },
  {
    id: 'civic-politics',
    name: 'Politics & Civic Life',
    icon: 'bank',
    emoji: '🏛️',
    bgColor: '#EFF6FF',
    accentColor: '#185AC7',
    section: 'vocabulary',
    translationReviewNotice: reviewNotice,
    levels: [
      { pairs: [
        pending('government', { italian: 'governo', french: 'gouvernement', spanish: 'gobierno', armenian: 'կառավարութիւն' }),
        pending('election', { italian: 'elezione', french: 'élection', spanish: 'elección', armenian: 'ընտրութիւն' }),
        pending('vote (noun)', { italian: 'voto', french: 'vote', spanish: 'voto', armenian: 'քուէ' }),
        pending('candidate', { italian: 'candidato', french: 'candidat', spanish: 'candidato', armenian: 'թեկնածու' }),
        pending('mayor', { italian: 'sindaco', french: 'maire', spanish: 'alcalde', armenian: 'քաղաքապետ' }),
        pending('citizen', { italian: 'cittadino', french: 'citoyen', spanish: 'ciudadano', armenian: 'քաղաքացի' }),
      ]},
      { pairs: [
        pending('law', { italian: 'legge', french: 'loi', spanish: 'ley', armenian: 'օրէնք' }),
        pending('rights', { italian: 'diritti', french: 'droits', spanish: 'derechos', armenian: 'իրաւունքներ' }),
        pending('public policy', { italian: 'politica pubblica', french: 'politique publique', spanish: 'política pública', armenian: 'հանրային քաղաքականութիւն' }),
        pending('parliament', { italian: 'parlamento', french: 'parlement', spanish: 'parlamento', armenian: 'խորհրդարան' }),
        pending('democracy', { italian: 'democrazia', french: 'démocratie', spanish: 'democracia', armenian: 'ժողովրդավարութիւն' }),
        pending('public service', { italian: 'servizio pubblico', french: 'service public', spanish: 'servicio público', armenian: 'հանրային ծառայութիւն' }),
      ]},
      { pairs: [
        pending('campaign', { italian: 'campagna elettorale', french: 'campagne électorale', spanish: 'campaña electoral', armenian: 'ընտրական քարոզարշաւ' }),
        pending('debate', { italian: 'dibattito', french: 'débat', spanish: 'debate', armenian: 'բանավէճ' }),
        pending('representative', { italian: 'rappresentante', french: 'représentant', spanish: 'representante', armenian: 'ներկայացուցիչ' }),
        pending('city council', { italian: 'consiglio comunale', french: 'conseil municipal', spanish: 'concejo municipal', armenian: 'քաղաքային խորհուրդ' }),
        pending('ballot', { italian: 'scheda elettorale', french: 'bulletin de vote', spanish: 'papeleta electoral', armenian: 'քուէաթերթիկ' }),
        pending('public opinion', { italian: 'opinione pubblica', french: 'opinion publique', spanish: 'opinión pública', armenian: 'հանրային կարծիք' }),
      ]},
    ],
  },
  {
    id: 'business-terms',
    name: 'Business Terms',
    icon: 'briefcase-outline',
    emoji: '💼',
    bgColor: '#EEF2FF',
    accentColor: '#4F46E5',
    section: 'vocabulary',
    translationReviewNotice: reviewNotice,
    levels: [
      { pairs: [
        pending('business', { italian: 'affari', french: 'affaires', spanish: 'negocios', armenian: 'գործ' }),
        pending('company', { italian: 'azienda', french: 'entreprise', spanish: 'empresa', armenian: 'ընկերութիւն' }),
        pending('customer', { italian: 'cliente', french: 'client', spanish: 'cliente', armenian: 'յաճախորդ' }),
        pending('employee', { italian: 'dipendente', french: 'employé', spanish: 'empleado', armenian: 'աշխատակից' }),
        pending('manager', { italian: 'dirigente', french: 'responsable', spanish: 'gerente', armenian: 'տնօրէն' }),
        pending('meeting', { italian: 'riunione', french: 'réunion', spanish: 'reunión', armenian: 'ժողով' }),
      ]},
      { pairs: [
        pending('contract', { italian: 'contratto', french: 'contrat', spanish: 'contrato', armenian: 'պայմանագիր' }),
        pending('budget', { italian: 'bilancio', french: 'budget', spanish: 'presupuesto', armenian: 'պիւտճէ' }),
        pending('salary', { italian: 'stipendio', french: 'salaire', spanish: 'salario', armenian: 'աշխատավարձ' }),
        pending('invoice', { italian: 'fattura', french: 'facture', spanish: 'factura', armenian: 'հաշուագիր' }),
        pending('supplier', { italian: 'fornitore', french: 'fournisseur', spanish: 'proveedor', armenian: 'մատակարար' }),
        pending('deadline', { italian: 'scadenza', french: 'date limite', spanish: 'fecha límite', armenian: 'վերջնաժամկէտ' }),
      ]},
      { pairs: [
        pending('profit', { italian: 'profitto', french: 'bénéfice', spanish: 'beneficio', armenian: 'շահոյթ' }),
        pending('expense', { italian: 'spesa', french: 'dépense', spanish: 'gasto', armenian: 'ծախս' }),
        pending('revenue', { italian: 'ricavo', french: 'revenu', spanish: 'ingreso', armenian: 'եկամուտ' }),
        pending('product', { italian: 'prodotto', french: 'produit', spanish: 'producto', armenian: 'արտադրանք' }),
        pending('service', { italian: 'servizio', french: 'service', spanish: 'servicio', armenian: 'ծառայութիւն' }),
        pending('negotiate', { italian: 'negoziare', french: 'négocier', spanish: 'negociar', armenian: 'բանակցիլ' }),
      ]},
    ],
  },
  {
    id: 'conversation-topics',
    name: 'Conversation Topics',
    icon: 'chat-processing-outline',
    emoji: '🗣️',
    bgColor: '#F5F3FF',
    accentColor: '#7C3AED',
    section: 'real-life',
    translationReviewNotice: reviewNotice,
    levels: [
      { pairs: [
        pending('What do you like to eat?', { italian: 'Che cosa ti piace mangiare?', french: 'Qu’est-ce que tu aimes manger ?', spanish: '¿Qué te gusta comer?', armenian: 'Ի՞նչ կը սիրես ուտել։' }),
        pending('What do you like to do on weekends?', { italian: 'Che cosa ti piace fare nei fine settimana?', french: 'Qu’est-ce que tu aimes faire le week-end ?', spanish: '¿Qué te gusta hacer los fines de semana?', armenian: 'Շաբաթավերջին ի՞նչ կը սիրես ընել։' }),
        pending('I like listening to music.', { italian: 'Mi piace ascoltare la musica.', french: 'J’aime écouter de la musique.', spanish: 'Me gusta escuchar música.', armenian: 'Կը սիրեմ երաժշտութիւն լսել։' }),
        pending('How was your day?', { italian: 'Com’è andata la tua giornata?', french: 'Comment s’est passée ta journée ?', spanish: '¿Cómo estuvo tu día?', armenian: 'Օրդ ինչպէ՞ս անցաւ։' }),
        pending('What are you doing this weekend?', { italian: 'Che cosa fai questo fine settimana?', french: 'Qu’est-ce que tu fais ce week-end ?', spanish: '¿Qué vas a hacer este fin de semana?', armenian: 'Այս շաբաթավերջին ի՞նչ պիտի ընես։' }),
        pending('That sounds fun.', { italian: 'Sembra divertente.', french: 'Ça a l’air amusant.', spanish: 'Suena divertido.', armenian: 'Ատիկա զուարճալի կը թուի։' }),
      ]},
      { pairs: [
        pending('What kind of music do you like?', { italian: 'Che tipo di musica ti piace?', french: 'Quel genre de musique aimes-tu ?', spanish: '¿Qué tipo de música te gusta?', armenian: 'Ի՞նչ տեսակ երաժշտութիւն կը սիրես։' }),
        pending('What do you like to do in your free time?', { italian: 'Che cosa ti piace fare nel tempo libero?', french: 'Qu’est-ce que tu aimes faire pendant ton temps libre ?', spanish: '¿Qué te gusta hacer en tu tiempo libre?', armenian: 'Ազատ ժամանակդ ի՞նչ կը սիրես ընել։' }),
        pending('What are your plans for tomorrow?', { italian: 'Quali sono i tuoi programmi per domani?', french: 'Quels sont tes projets pour demain ?', spanish: '¿Qué planes tienes para mañana?', armenian: 'Վաղուան համար ի՞նչ ծրագիրներ ունիս։' }),
        pending('Have you tried this before?', { italian: 'L’hai già provato?', french: 'Tu as déjà essayé ça ?', spanish: '¿Ya lo has probado?', armenian: 'Ասիկա փորձա՞ծ ես։' }),
        pending('What do you think about it?', { italian: 'Che cosa ne pensi?', french: 'Qu’est-ce que tu en penses ?', spanish: '¿Qué opinas de eso?', armenian: 'Ասոր մասին ի՞նչ կը մտածես։' }),
        pending('I agree with you.', { italian: 'Sono d’accordo con te.', french: 'Je suis d’accord avec toi.', spanish: 'Estoy de acuerdo contigo.', armenian: 'Քեզի հետ համամիտ եմ։' }),
      ]},
      { pairs: [
        pending('I am looking forward to it.', { italian: 'Non vedo l’ora.', french: 'J’ai hâte.', spanish: 'Tengo muchas ganas.', armenian: 'Անոր կը սպասեմ անհամբերութեամբ։' }),
        pending('Could you tell me more?', { italian: 'Potresti raccontarmi di più?', french: 'Tu pourrais m’en dire plus ?', spanish: '¿Podrías contarme más?', armenian: 'Կրնա՞ս ինծի աւելի պատմել։' }),
        pending('I have a different opinion.', { italian: 'Ho un’opinione diversa.', french: 'J’ai un avis différent.', spanish: 'Tengo una opinión diferente.', armenian: 'Ուրիշ կարծիք ունիմ։' }),
        pending('That reminds me of something.', { italian: 'Questo mi fa venire in mente qualcosa.', french: 'Ça me fait penser à quelque chose.', spanish: 'Eso me recuerda a algo.', armenian: 'Ասիկա ինծի բան մը կը յիշեցնէ։' }),
        pending('Let’s keep in touch.', { italian: 'Restiamo in contatto.', french: 'Restons en contact.', spanish: 'Sigamos en contacto.', armenian: 'Կապի մէջ մնանք։' }),
        pending('It was nice talking with you.', { italian: 'È stato bello parlare con te.', french: 'C’était un plaisir de parler avec toi.', spanish: 'Fue agradable hablar contigo.', armenian: 'Քեզի հետ խօսիլը հաճելի էր։' }),
      ]},
    ],
  },
];

export type EverydayDialogueTopicId =
  | 'groceries'
  | 'restaurant'
  | 'museum'
  | 'school'
  | 'home'
  | 'social';

export interface EverydayDialogueLine {
  speaker: 'A' | 'B';
  english: string;
  translations: TranslationSet;
}

export interface EverydayDialogueTopic {
  id: EverydayDialogueTopicId;
  title: string;
  description: string;
  categoryIds: string[];
  lines: EverydayDialogueLine[];
}

export interface EverydayDialogueExchange {
  prompt: EverydayDialogueLine;
  reply: EverydayDialogueLine;
}

export function getEverydayDialogueExchanges(
  topic: EverydayDialogueTopic,
): EverydayDialogueExchange[] {
  return topic.lines.flatMap((line, index) => {
    const prompt = topic.lines[index - 1];
    return line.speaker === 'B' && prompt?.speaker === 'A'
      ? [{ prompt, reply: line }]
      : [];
  });
}

export const EVERYDAY_DIALOGUE_TOPICS: EverydayDialogueTopic[] = [
  {
    id: 'groceries',
    title: 'At the grocery store',
    description: 'Find something and ask about the price.',
    categoryIds: ['grocery-store', 'fruit-vegetables'],
    lines: [
      {
        speaker: 'A',
        english: 'Excuse me, where can I find the apples?',
        translations: {
          italian: 'Scusi, dove posso trovare le mele?',
          french: 'Excusez-moi, où puis-je trouver les pommes ?',
          spanish: 'Disculpe, ¿dónde puedo encontrar las manzanas?',
          armenian: 'Ներեցէ՛ք, ո՞ւր կրնամ խնձորները գտնել։',
        },
      },
      {
        speaker: 'B',
        english: 'They are in the fruit section, next to the pears.',
        translations: {
          italian: 'Sono nel reparto frutta, accanto alle pere.',
          french: 'Elles sont au rayon fruits, à côté des poires.',
          spanish: 'Están en la sección de frutas, al lado de las peras.',
          armenian: 'Անոնք պտուղներու բաժնին մէջ են՝ տանձերուն քով։',
        },
      },
      {
        speaker: 'A',
        english: 'Thank you. Are these on sale?',
        translations: {
          italian: 'Grazie. Sono in offerta?',
          french: 'Merci. Elles sont en promotion ?',
          spanish: 'Gracias. ¿Están en oferta?',
          armenian: 'Շնորհակալութիւն։ Ասոնք զեղչո՞վ են։',
        },
      },
      {
        speaker: 'B',
        english: 'Yes, they are two euros a kilo.',
        translations: {
          italian: 'Sì, costano due euro al chilo.',
          french: 'Oui, elles sont à deux euros le kilo.',
          spanish: 'Sí, cuestan dos euros el kilo.',
          armenian: 'Այո՛, մէկ քիլոն երկու եւրօ է։',
        },
      },
    ],
  },
  {
    id: 'restaurant',
    title: 'At a restaurant',
    description: 'Ask for a table and order a meal.',
    categoryIds: ['restaurant', 'restaurant-menus'],
    lines: [
      {
        speaker: 'A',
        english: 'Could we have a table for two, please?',
        translations: {
          italian: 'Possiamo avere un tavolo per due, per favore?',
          french: 'Nous voudrions une table pour deux, s’il vous plaît.',
          spanish: '¿Nos puede dar una mesa para dos, por favor?',
          armenian: 'Կրնա՞նք երկու հոգիի համար սեղան մը ունենալ, խնդրեմ։',
        },
      },
      {
        speaker: 'B',
        english: 'Of course. Would you like to sit inside or outside?',
        translations: {
          italian: 'Certo. Preferite sedervi dentro o fuori?',
          french: 'Bien sûr. Vous préférez vous installer à l’intérieur ou en terrasse ?',
          spanish: 'Claro. ¿Prefieren sentarse dentro o fuera?',
          armenian: 'Անշուշտ։ Ներսը՞ կ’ուզէք նստիլ, թէ դուրսը։',
        },
      },
      {
        speaker: 'A',
        english: 'Outside, please. Could I see the menu?',
        translations: {
          italian: 'Fuori, per favore. Posso vedere il menu?',
          french: 'En terrasse, s’il vous plaît. Puis-je voir le menu ?',
          spanish: 'Fuera, por favor. ¿Puedo ver el menú?',
          armenian: 'Դուրսը, խնդրեմ։ Ճաշացանկը կրնա՞մ տեսնել։',
        },
      },
      {
        speaker: 'B',
        english: 'Certainly. I will bring it right away.',
        translations: {
          italian: 'Certamente. Lo porto subito.',
          french: 'Bien sûr. Je vous l’apporte tout de suite.',
          spanish: 'Claro. Se lo traigo enseguida.',
          armenian: 'Անշուշտ։ Անմիջապէս կը բերեմ։',
        },
      },
    ],
  },
  {
    id: 'museum',
    title: 'At the museum',
    description: 'Ask about an exhibition and a ticket.',
    categoryIds: ['museum-streets', 'places'],
    lines: [
      {
        speaker: 'A',
        english: 'Where is the modern art exhibition?',
        translations: {
          italian: 'Dov’è la mostra di arte moderna?',
          french: 'Où se trouve l’exposition d’art moderne ?',
          spanish: '¿Dónde está la exposición de arte moderno?',
          armenian: 'Արդի արուեստի ցուցահանդէսը ո՞ւր է։',
        },
      },
      {
        speaker: 'B',
        english: 'It is on the second floor, to your right.',
        translations: {
          italian: 'È al secondo piano, alla sua destra.',
          french: 'Elle est au deuxième étage, sur votre droite.',
          spanish: 'Está en la segunda planta, a su derecha.',
          armenian: 'Երկրորդ յարկին վրայ է՝ ձեր աջ կողմը։',
        },
      },
      {
        speaker: 'A',
        english: 'Do I need a ticket?',
        translations: {
          italian: 'Mi serve un biglietto?',
          french: 'Est-ce qu’il me faut un billet ?',
          spanish: '¿Necesito una entrada?',
          armenian: 'Տոմսի պէ՞տք ունիմ։',
        },
      },
      {
        speaker: 'B',
        english: 'Yes, you can get one at the entrance.',
        translations: {
          italian: 'Sì, può prenderne uno all’ingresso.',
          french: 'Oui, vous pouvez en prendre un à l’entrée.',
          spanish: 'Sí, puede comprar una en la entrada.',
          armenian: 'Այո՛, կրնաք մուտքին քովէն գնել։',
        },
      },
    ],
  },
  {
    id: 'school',
    title: 'At school',
    description: 'Share supplies before class starts.',
    categoryIds: ['school'],
    lines: [
      {
        speaker: 'A',
        english: 'Did you bring your notebook?',
        translations: {
          italian: 'Hai portato il quaderno?',
          french: 'Tu as apporté ton cahier ?',
          spanish: '¿Trajiste tu cuaderno?',
          armenian: 'Տետրակդ բերե՞ր ես։',
        },
      },
      {
        speaker: 'B',
        english: 'Yes, but I forgot my pencil.',
        translations: {
          italian: 'Sì, ma ho dimenticato la matita.',
          french: 'Oui, mais j’ai oublié mon crayon.',
          spanish: 'Sí, pero olvidé mi lápiz.',
          armenian: 'Այո՛, բայց մատիտս մոռցայ։',
        },
      },
      {
        speaker: 'A',
        english: 'I have an extra one. Would you like it?',
        translations: {
          italian: 'Ne ho uno in più. Lo vuoi?',
          french: 'J’en ai un en plus. Tu le veux ?',
          spanish: 'Tengo uno de sobra. ¿Lo quieres?',
          armenian: 'Աւելորդ մը ունիմ։ Կ’ուզե՞ս։',
        },
      },
      {
        speaker: 'B',
        english: 'Thanks! That would help me.',
        translations: {
          italian: 'Grazie! Mi sarebbe utile.',
          french: 'Merci ! Ça m’aiderait.',
          spanish: '¡Gracias! Me vendría bien.',
          armenian: 'Շնորհակալութիւն։ Ինծի օգտակար կ’ըլլայ։',
        },
      },
    ],
  },
  {
    id: 'home',
    title: 'At home',
    description: 'Help set the table before dinner.',
    categoryIds: ['home'],
    lines: [
      {
        speaker: 'A',
        english: 'Can you set the table, please?',
        translations: {
          italian: 'Puoi apparecchiare la tavola, per favore?',
          french: 'Tu peux mettre la table, s’il te plaît ?',
          spanish: '¿Puedes poner la mesa, por favor?',
          armenian: 'Կրնա՞ս սեղանը պատրաստել, խնդրեմ։',
        },
      },
      {
        speaker: 'B',
        english: 'Sure. Where are the plates?',
        translations: {
          italian: 'Certo. Dove sono i piatti?',
          french: 'Bien sûr. Où sont les assiettes ?',
          spanish: 'Claro. ¿Dónde están los platos?',
          armenian: 'Անշուշտ։ Ափսէները ո՞ւր են։',
        },
      },
      {
        speaker: 'A',
        english: 'They are in the kitchen cupboard, next to the glasses.',
        translations: {
          italian: 'Sono nella credenza della cucina, accanto ai bicchieri.',
          french: 'Elles sont dans le placard de la cuisine, à côté des verres.',
          spanish: 'Están en el armario de la cocina, al lado de los vasos.',
          armenian: 'Խոհանոցի պահարանին մէջ են՝ գաւաթներուն քով։',
        },
      },
      {
        speaker: 'B',
        english: 'Got it. Dinner will be ready soon.',
        translations: {
          italian: 'Capito. La cena sarà pronta presto.',
          french: 'D’accord. Le dîner sera bientôt prêt.',
          spanish: 'Entendido. La cena estará lista pronto.',
          armenian: 'Հասկցայ։ Ընթրիքը շուտով պատրաստ կ’ըլլայ։',
        },
      },
    ],
  },
  {
    id: 'social',
    title: 'Meeting someone',
    description: 'Introduce yourself and find a connection.',
    categoryIds: ['conversations', 'conversation-topics'],
    lines: [
      {
        speaker: 'A',
        english: 'Hi, I’m Alex. Have we met before?',
        translations: {
          italian: 'Ciao, sono Alex. Ci siamo già conosciuti?',
          french: 'Bonjour, je m’appelle Alex. On s’est déjà rencontrés ?',
          spanish: 'Hola, soy Alex. ¿Nos conocemos de antes?',
          armenian: 'Բարեւ, ես Ալեքսն եմ։ Նախապէս հանդիպա՞ծ ենք։',
        },
      },
      {
        speaker: 'B',
        english: 'I don’t think so. I’m Maya. Nice to meet you.',
        translations: {
          italian: 'Non credo. Sono Maya. Piacere di conoscerti.',
          french: 'Je ne crois pas. Je m’appelle Maya. Enchantée.',
          spanish: 'No lo creo. Soy Maya. Mucho gusto.',
          armenian: 'Չեմ կարծեր։ Ես Մայան եմ։ Ուրախ եմ ծանօթանալուդ։',
        },
      },
      {
        speaker: 'A',
        english: 'Nice to meet you too. How do you know Sam?',
        translations: {
          italian: 'Piacere mio. Come conosci Sam?',
          french: 'Enchanté. Comment connais-tu Sam ?',
          spanish: 'Igualmente. ¿Cómo conoces a Sam?',
          armenian: 'Ես ալ ուրախ եմ։ Սամին ուրկէ՞ կը ճանչնաս։',
        },
      },
      {
        speaker: 'B',
        english: 'We work together.',
        translations: {
          italian: 'Lavoriamo insieme.',
          french: 'Nous travaillons ensemble.',
          spanish: 'Trabajamos juntos.',
          armenian: 'Միասին կ’աշխատինք։',
        },
      },
    ],
  },
];
