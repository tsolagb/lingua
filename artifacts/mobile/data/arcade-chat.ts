import type { Language } from '@/data/vocabulary';

/** A bilingual chat line: English + hand-written course-language versions. */
export type ChatLine = { en: string } & Record<Language, string>;
const L = (en: string, italian: string, french: string, spanish: string, armenian: string): ChatLine => ({ en, italian, french, spanish, armenian });

export type ChatTurn = {
  /** What the other person says before the learner replies. */
  other: ChatLine;
  /** The natural reply the learner should give. */
  answer: ChatLine;
  /** Two plausible-sounding but off-context replies. Also feed distractor tiles in builder turns. */
  wrong: [ChatLine, ChatLine];
  /** Gentle English hint shown after a wrong reply. */
  hint: string;
  /** Builder turn: the learner assembles the answer from word tiles. */
  build?: boolean;
};

export type ChatScenario = {
  id: string;
  title: string;
  setting: string;
  icon: string;
  partner: { name: Record<Language, string>; role: string; color: string; hair: string; skin: string };
  turns: ChatTurn[];
  closing: ChatLine;
};

export const CHAT_CONFUSED: Record<Language, ChatLine[]> = {
  italian: [L("Sorry? I didn't quite understand.", 'Scusa? Non ho capito bene.', '', '', ''), L('Hmm... sorry, what?', 'Hmm... come, scusa?', '', '', '')],
  french: [L("Sorry? I didn't quite understand.", '', "Pardon ? Je n'ai pas bien compris.", '', ''), L('Hmm... sorry, what?', '', 'Euh... comment ?', '', '')],
  spanish: [L("Sorry? I didn't quite understand.", '', '', '¿Perdón? No te he entendido bien.', ''), L('Hmm... sorry, what?', '', '', 'Mmm... ¿cómo?', '')],
  armenian: [L("Sorry, I didn't quite understand.", '', '', '', 'Կը ներես, լաւ չհասկցայ։'), L('Hmm... what did you say?', '', '', '', 'Հըմ... ի՞նչ ըսիր։')],
};

// Reusable off-context replies (still natural sentences, just wrong for the moment).
const W = {
  age: L("I'm twenty years old.", 'Ho vent\'anni.', "J'ai vingt ans.", 'Tengo veinte años.', 'Քսան տարեկան եմ։'),
  station: L('The station is over there.', 'La stazione è laggiù.', 'La gare est là-bas.', 'La estación está allí.', 'Կայարանը հոն է։'),
  brother: L('No, I have a brother.', 'No, ho un fratello.', "Non, j'ai un frère.", 'No, tengo un hermano.', 'Ոչ, եղբայր մը ունիմ։'),
  eight: L('Yes, at eight o\'clock.', 'Sì, alle otto.', 'Oui, à huit heures.', 'Sí, a las ocho.', 'Այո, ժամը ութին։'),
  night: L('Good night, see you tomorrow.', 'Buonanotte, a domani.', 'Bonne nuit, à demain.', 'Buenas noches, hasta mañana.', 'Բարի գիշեր, վաղը կը տեսնուինք։'),
  dogs: L("I don't like dogs.", 'Non mi piacciono i cani.', "Je n'aime pas les chiens.", 'No me gustan los perros.', 'Շուները չեմ սիրեր։'),
  coffee: L("Yes, I'd like a coffee.", 'Sì, vorrei un caffè.', 'Oui, je voudrais un café.', 'Sí, quiero un café.', "Այո, սուրճ մը կ'ուզեմ։"),
  name: L('My name is Sam.', 'Mi chiamo Sam.', "Je m'appelle Sam.", 'Me llamo Sam.', 'Անունս Սամ է։'),
  hungry: L('I am very hungry.', 'Ho molta fame.', "J'ai très faim.", 'Tengo mucha hambre.', 'Շատ անօթի եմ։'),
  birthday: L('Is it your birthday today?', 'Oggi è il tuo compleanno?', "C'est ton anniversaire aujourd'hui ?", '¿Hoy es tu cumpleaños?', 'Այսօր ծնունդդ է՞։'),
  tickets: L('Two tickets, please.', 'Due biglietti, per favore.', 'Deux billets, s\'il vous plaît.', 'Dos entradas, por favor.', 'Երկու տոմս, կը խնդրեմ։'),
  rain: L("It's raining today.", 'Oggi piove.', "Il pleut aujourd'hui.", 'Hoy llueve.', 'Այսօր անձրեւ կու գայ։'),
  bill: L('The bill, please.', 'Il conto, per favore.', "L'addition, s'il vous plaît.", 'La cuenta, por favor.', 'Հաշիւը, կը խնդրեմ։'),
  right: L('Turn right at the bank.', 'Gira a destra alla banca.', 'Tourne à droite à la banque.', 'Gira a la derecha en el banco.', 'Դրամատան քով աջ դարձիր։'),
  hotel: L('I am at the hotel.', 'Sono in albergo.', "Je suis à l'hôtel.", 'Estoy en el hotel.', 'Պանդոկն եմ։'),
  thirsty: L('I am thirsty.', 'Ho sete.', "J'ai soif.", 'Tengo sed.', 'Ծարաւ եմ։'),
  room: L('Room 214, please.', 'Camera 214, per favore.', "Chambre 214, s'il vous plaît.", 'Habitación 214, por favor.', 'Սենեակ 214, կը խնդրեմ։'),
  left: L('Go straight, then left.', 'Vai dritto, poi a sinistra.', 'Va tout droit, puis à gauche.', 'Sigue recto y luego a la izquierda.', 'Ուղիղ գնա, յետոյ ձախ։'),
  late: L('No, the train is late.', 'No, il treno è in ritardo.', 'Non, le train est en retard.', 'No, el tren llega tarde.', 'Ոչ, շոգեկառքը ուշ է։'),
  milk: L('Yes, with a little milk.', 'Sì, con un po\' di latte.', 'Oui, avec un peu de lait.', 'Sí, con un poco de leche.', 'Այո, քիչ մը կաթով։'),
  seven: L("At seven o'clock.", 'Alle sette.', 'À sept heures.', 'A las siete.', 'Ժամը եօթին։'),
  nights: L('Three nights.', 'Tre notti.', 'Trois nuits.', 'Tres noches.', 'Երեք գիշեր։'),
  soup: L('Can I order the soup?', 'Posso ordinare la zuppa?', 'Je peux commander la soupe ?', '¿Puedo pedir la sopa?', 'Կրնա՞մ ապուրը ապսպրել։'),
  platform: L('Where is the platform?', 'Dov\'è il binario?', 'Où est le quai ?', '¿Dónde está el andén?', 'Կառամատոյցը ո՞ւր է։'),
  jacket: L("I'd like a blue jacket.", 'Vorrei una giacca blu.', 'Je voudrais une veste bleue.', 'Quiero una chaqueta azul.', "Կապոյտ բաճկոն մը կ'ուզեմ։"),
  breakfast: L('Breakfast is at seven.', 'La colazione è alle sette.', 'Le petit-déjeuner est à sept heures.', 'El desayuno es a las siete.', 'Նախաճաշը ժամը եօթին է։'),
  medium: L('Medium, I think.', 'La media, credo.', 'Du M, je crois.', 'La mediana, creo.', 'Միջին, կարծեմ։'),
  table: L('Okay, a table for two.', 'Va bene, un tavolo per due.', "D'accord, une table pour deux.", 'Vale, una mesa para dos.', 'Լաւ, երկու հոգիի սեղան մը։'),
  tryOn: L('Can I try it on?', 'Posso provarla?', "Je peux l'essayer ?", '¿Me la puedo probar?', 'Կրնա՞մ փորձել։'),
  since: L('Since yesterday evening.', 'Da ieri sera.', 'Depuis hier soir.', 'Desde anoche.', 'Երէկ իրիկունէն ի վեր։'),
  doubleRoom: L('A double room, please.', 'Una camera doppia, per favore.', "Une chambre double, s'il vous plaît.", 'Una habitación doble, por favor.', 'Երկու հոգիի սենեակ մը, կը խնդրեմ։'),
  far: L('The museum is far.', 'Il museo è lontano.', 'Le musée est loin.', 'El museo está lejos.', 'Թանգարանը հեռու է։'),
  canada: L('I am from Canada.', 'Sono del Canada.', 'Je viens du Canada.', 'Soy de Canadá.', 'Գանատայէն եմ։'),
  two: L('For two, please.', 'Per due, per favore.', "Pour deux, s'il vous plaît.", 'Para dos, por favor.', 'Երկու հոգիի, կը խնդրեմ։'),
  fever: L('I have a fever.', 'Ho la febbre.', "J'ai de la fièvre.", 'Tengo fiebre.', 'Ջերմ ունիմ։'),
  water: L('Sparkling water, thanks.', 'Acqua frizzante, grazie.', "De l'eau gazeuse, merci.", 'Agua con gas, gracias.', 'Գազով ջուր, շնորհակալ եմ։'),
  returnToday: L('Return, for today.', 'Andata e ritorno, per oggi.', "Aller-retour, pour aujourd'hui.", 'Ida y vuelta, para hoy.', 'Երթ ու դարձ, այսօրուան համար։'),
  meals: L('Before or after meals?', 'Prima o dopo i pasti?', 'Avant ou après les repas ?', '¿Antes o después de comer?', 'Ճաշէն առա՞ջ թէ ետք։'),
  isFar: L('Is it far from here?', 'È lontano da qui?', "C'est loin d'ici ?", '¿Está lejos de aquí?', 'Հոսկէ հեռո՞ւ է։'),
  tomatoes: L('A kilo of tomatoes, please.', 'Un chilo di pomodori, per favore.', "Un kilo de tomates, s'il vous plaît.", 'Un kilo de tomates, por favor.', 'Քիլօ մը լոլիկ, կը խնդրեմ։'),
  fish: L('The fish with salad, please.', "Il pesce con l'insalata, per favore.", "Le poisson avec une salade, s'il vous plaît.", 'El pescado con ensalada, por favor.', 'Ձուկը աղցանով, կը խնդրեմ։'),
  lemons: L('Yes, two lemons too.', 'Sì, anche due limoni.', 'Oui, deux citrons aussi.', 'Sí, también dos limones.', 'Այո, երկու կիտրոն ալ։'),
  platform3: L('Platform three, thanks.', 'Binario tre, grazie.', 'Quai trois, merci.', 'Andén tres, gracias.', 'Երրորդ կառամատոյց, շնորհակալ եմ։'),
  appointment: L("I'd like an appointment.", 'Vorrei un appuntamento.', 'Je voudrais un rendez-vous.', 'Quisiera una cita.', "Ժամադրութիւն մը կ'ուզեմ։"),
  museum: L('Where is the museum?', "Dov'è il museo?", 'Où est le musée ?', '¿Dónde está el museo?', 'Թանգարանը ո՞ւր է։'),
  five: L("Here's five euros.", 'Ecco cinque euro.', 'Voilà cinq euros.', 'Aquí tiene cinco euros.', 'Ահա՛ հինգ եւրօ։'),
  eightHome: L('At eight, at my house.', 'Alle otto, a casa mia.', 'À huit heures, chez moi.', 'A las ocho, en mi casa.', 'Ժամը ութին, մեր տունը։'),
  cold: L("No, it's very cold.", 'No, fa molto freddo.', 'Non, il fait très froid.', 'No, hace mucho frío.', 'Ոչ, շատ ցուրտ է։'),
  kiloYes: L('Yes, a kilo, please.', 'Sì, un chilo, per favore.', "Oui, un kilo, s'il vous plaît.", 'Sí, un kilo, por favor.', 'Այո, քիլօ մը, կը խնդրեմ։'),
};

const P = (it: string, fr: string, es: string, hy: string) => ({ italian: it, french: fr, spanish: es, armenian: hy });

export const CHAT_SCENARIOS: ChatScenario[] = [
  {
    id: 'coffee', title: 'Morning coffee', setting: 'A busy café counter', icon: 'cafe',
    partner: { name: P('Giulia', 'Camille', 'Lucía', 'Արփի'), role: 'Barista', color: '#FF6B4A', hair: '#5B3A29', skin: '#F2C7A5' },
    turns: [
      { other: L('Good morning! What would you like?', 'Buongiorno! Cosa prende?', "Bonjour ! Qu'est-ce que vous prenez ?", '¡Buenos días! ¿Qué le pongo?', "Բարի լոյս։ Ի՞նչ կ'ուզէք։"),
        answer: L('A coffee, please.', 'Un caffè, per favore.', "Un café, s'il vous plaît.", 'Un café, por favor.', 'Սուրճ մը, կը խնդրեմ։'),
        wrong: [W.age, W.station], hint: 'They want your order. Name a drink and add "please".' },
      { other: L('Would you like it with milk?', 'Lo vuole con il latte?', 'Vous le voulez avec du lait ?', '¿Lo quiere con leche?', "Կաթով կ'ուզէ՞ք։"),
        answer: W.milk, wrong: [W.brother, W.eight], hint: 'This is about milk: say yes, with a little milk.', build: true },
      { other: L("Here you go. That's two euros.", 'Ecco a lei. Sono due euro.', 'Voilà. Ça fait deux euros.', 'Aquí tiene. Son dos euros.', "Ահա՛։ Երկու եւրօ կ'ընէ։"),
        answer: L('Thank you, here you are.', 'Grazie, ecco.', 'Merci, voilà.', 'Gracias, aquí tiene.', 'Շնորհակալ եմ, ահա՛։'),
        wrong: [W.night, W.dogs], hint: 'You are paying. Say thanks as you hand over the money.' },
    ],
    closing: L('Enjoy your coffee! Have a nice day.', 'Buon caffè! Buona giornata.', 'Bon café ! Bonne journée.', '¡Que aproveche! Que tenga un buen día.', 'Անուշ ըլլայ։ Բարի օր։'),
  },
  {
    id: 'directions', title: 'Lost in town', setting: 'A sunny street corner', icon: 'navigate',
    partner: { name: P('Paolo', 'Julien', 'Andrés', 'Գրիգոր'), role: 'Friendly local', color: '#2F8CFF', hair: '#2B2B2B', skin: '#D9A07E' },
    turns: [
      { other: L('Hi! You look lost. Can I help you?', 'Ciao! Sembri perso. Posso aiutarti?', "Bonjour ! Vous avez l'air perdu. Je peux vous aider ?", '¡Hola! Pareces perdido. ¿Te puedo ayudar?', 'Բարեւ։ Կարծես թէ կորսուած ես։ Կրնա՞մ օգնել։'),
        answer: L('Yes, where is the museum?', "Sì, dov'è il museo?", 'Oui, où est le musée ?', 'Sí, ¿dónde está el museo?', 'Այո, թանգարանը ո՞ւր է։'),
        wrong: [W.coffee, W.name], hint: 'Accept the help and ask where a place is.' },
      { other: L('Go straight, then turn left at the bank.', 'Vai dritto, poi gira a sinistra alla banca.', 'Allez tout droit, puis tournez à gauche à la banque.', 'Sigue recto y luego gira a la izquierda en el banco.', 'Ուղիղ գնա, յետոյ դրամատան քով ձախ դարձիր։'),
        answer: W.isFar, wrong: [W.hungry, W.birthday], hint: 'Ask about the distance: is it far from here?', build: true },
      { other: L("No, it's five minutes on foot.", 'No, sono cinque minuti a piedi.', "Non, c'est à cinq minutes à pied.", 'No, son cinco minutos a pie.', 'Ոչ, քալելով հինգ վայրկեան է։'),
        answer: L('Great, thank you so much!', 'Perfetto, grazie mille!', 'Super, merci beaucoup !', '¡Genial, muchas gracias!', 'Հիանալի՛, շատ շնորհակալ եմ։'),
        wrong: [W.tickets, W.rain], hint: 'They solved your problem. Thank them warmly.' },
    ],
    closing: L("You're welcome! Enjoy the museum.", 'Prego! Buona visita al museo.', 'De rien ! Bonne visite au musée.', '¡De nada! Disfruta del museo.', 'Խնդրեմ։ Թանգարանը վայելէ։'),
  },
  {
    id: 'new-friend', title: 'A new friend', setting: 'First day of language class', icon: 'people',
    partner: { name: P('Chiara', 'Inès', 'Valeria', 'Թալին'), role: 'Classmate', color: '#20B486', hair: '#8A4B2A', skin: '#E9B98F' },
    turns: [
      { other: L("Hi! I'm new here. What's your name?", 'Ciao! Sono nuova qui. Come ti chiami?', "Salut ! Je suis nouvelle ici. Tu t'appelles comment ?", '¡Hola! Soy nueva aquí. ¿Cómo te llamas?', 'Բարեւ։ Հոս նոր եմ։ Անունդ ի՞նչ է։'),
        answer: L('Hi! My name is Sam. Nice to meet you.', 'Ciao! Mi chiamo Sam. Piacere.', "Salut ! Je m'appelle Sam. Enchanté.", '¡Hola! Me llamo Sam. Mucho gusto.', 'Բարեւ։ Անունս Սամ է։ Ուրախ եմ։'),
        wrong: [W.bill, W.right], hint: 'Greet them back and say your name.' },
      { other: L('Where are you from?', 'Di dove sei?', "Tu viens d'où ?", '¿De dónde eres?', 'Ուրկէ՞ ես։'),
        answer: W.canada, wrong: [W.hotel, W.thirsty], hint: 'Say which country you come from.', build: true },
      { other: L('Cool! Shall we have coffee together after class?', 'Bello! Prendiamo un caffè insieme dopo la lezione?', 'Cool ! On prend un café ensemble après le cours ?', '¡Qué bien! ¿Tomamos un café juntos después de clase?', 'Հիանալի՛։ Դասէն ետք միասին սուրճ խմե՞նք։'),
        answer: L('Yes, gladly! See you later.', 'Sì, volentieri! A dopo.', 'Oui, avec plaisir ! À plus tard.', '¡Sí, con mucho gusto! Hasta luego.', 'Այո, սիրով։ Յետոյ կը տեսնուինք։'),
        wrong: [W.room, W.left], hint: 'This is an invitation. Accept it warmly.' },
    ],
    closing: L('Great, see you at four!', 'Perfetto, ci vediamo alle quattro!', 'Super, à quatre heures !', '¡Genial, nos vemos a las cuatro!', 'Հիանալի՛, ժամը չորսին կը տեսնուինք։'),
  },
  {
    id: 'shopping', title: 'Jacket hunt', setting: 'A small clothes boutique', icon: 'shirt',
    partner: { name: P('Marta', 'Léa', 'Carmen', 'Սոնա'), role: 'Shop assistant', color: '#8B5CF6', hair: '#1F1B2E', skin: '#C98E6B' },
    turns: [
      { other: L('Hello! Are you looking for something?', 'Salve! Cerca qualcosa?', 'Bonjour ! Vous cherchez quelque chose ?', '¡Hola! ¿Busca algo?', 'Բարեւ։ Բան մը կը փնտռէ՞ք։'),
        answer: L("Yes, I'm looking for a jacket.", 'Sì, cerco una giacca.', 'Oui, je cherche une veste.', 'Sí, busco una chaqueta.', 'Այո, բաճկոն մը կը փնտռեմ։'),
        wrong: [W.late, W.milk], hint: 'Tell the assistant which item you want.' },
      { other: L('What size do you wear?', 'Che taglia porta?', 'Quelle taille faites-vous ?', '¿Qué talla usa?', 'Ի՞նչ չափ կը հագնիք։'),
        answer: W.medium, wrong: [W.seven, W.nights], hint: 'They asked your size. Try: medium, I think.', build: true },
      { other: L('This blue one is on sale: forty euros.', 'Questa blu è in saldo: quaranta euro.', 'Celle-ci, la bleue, est en solde : quarante euros.', 'Esta azul está rebajada: cuarenta euros.', 'Այս կապոյտը զեղչի մէջ է. քառասուն եւրօ։'),
        answer: W.tryOn, wrong: [W.soup, W.platform], hint: 'Before buying, ask to try the jacket on.' },
    ],
    closing: L('Of course! The fitting room is on the right.', 'Certo! Il camerino è a destra.', 'Bien sûr ! La cabine est à droite.', '¡Claro! El probador está a la derecha.', 'Անշուշտ։ Փորձելու սենեակը աջ կողմն է։'),
  },
  {
    id: 'restaurant', title: 'Dinner for two', setting: 'A cozy neighbourhood restaurant', icon: 'restaurant',
    partner: { name: P('Lorenzo', 'Hugo', 'Javier', 'Վահէ'), role: 'Waiter', color: '#E5484D', hair: '#3A2A20', skin: '#E0AC85' },
    turns: [
      { other: L('Good evening! A table for how many?', 'Buonasera! Un tavolo per quanti?', 'Bonsoir ! Une table pour combien ?', '¡Buenas noches! ¿Mesa para cuántos?', 'Բարի իրիկուն։ Քանի՞ հոգիի համար սեղան։'),
        answer: W.two, wrong: [W.since, W.medium], hint: 'Say how many people are eating.' },
      { other: L('What would you like to eat?', 'Cosa desidera mangiare?', "Qu'est-ce que vous voulez manger ?", '¿Qué desea comer?', "Ի՞նչ կ'ուզէք ուտել։"),
        answer: W.fish, wrong: [W.doubleRoom, W.far], hint: 'Order a dish: the fish with salad.', build: true },
      { other: L('And to drink?', 'E da bere?', 'Et comme boisson ?', '¿Y para beber?', 'Իսկ խմելու համա՞ր։'),
        answer: W.water, wrong: [W.room, W.canada], hint: 'Name a drink, like sparkling water.' },
    ],
    closing: L("Perfect, I'll bring it right away.", 'Perfetto, arriva subito.', 'Parfait, je vous apporte ça tout de suite.', 'Perfecto, se lo traigo enseguida.', 'Շատ լաւ, անմիջապէս կը բերեմ։'),
  },
  {
    id: 'market', title: 'Saturday market', setting: 'A fruit and vegetable stall', icon: 'basket',
    partner: { name: P('Signora Rosa', 'Madame Colette', 'Doña Pilar', 'Տիկին Անահիտ'), role: 'Stall owner', color: '#F59E0B', hair: '#B9B4AE', skin: '#EAB892' },
    turns: [
      { other: L('Fresh tomatoes today! What do you need?', 'Pomodori freschi oggi! Cosa le serve?', "Tomates fraîches aujourd'hui ! Qu'est-ce qu'il vous faut ?", '¡Tomates frescos hoy! ¿Qué necesita?', 'Այսօր թարմ լոլիկ ունինք։ Ի՞նչ պէտք է։'),
        answer: W.tomatoes, wrong: [W.tickets, W.fever], hint: 'Ask for an amount of tomatoes.' },
      { other: L('Anything else?', 'Altro?', 'Et avec ceci ?', '¿Algo más?', 'Ուրիշ բա՞ն։'),
        answer: W.lemons, wrong: [W.returnToday, W.two], hint: 'Add one more thing: two lemons too.', build: true },
      { other: L("That's three euros fifty.", 'Sono tre euro e cinquanta.', 'Ça fait trois euros cinquante.', 'Son tres euros con cincuenta.', 'Երեք եւրօ յիսուն է։'),
        answer: W.five, wrong: [W.meals, W.isFar], hint: 'Pay: hand over five euros.' },
    ],
    closing: L("Here's your change. Thanks, see you soon!", 'Ecco il resto. Grazie, a presto!', 'Voici votre monnaie. Merci, à bientôt !', 'Aquí tiene el cambio. ¡Gracias, hasta pronto!', 'Ահա՛ մնացորդը։ Շնորհակալ եմ, շուտով կը տեսնուինք։'),
  },
  {
    id: 'hotel', title: 'Hotel check-in', setting: 'A small family-run hotel', icon: 'bed',
    partner: { name: P('Francesca', 'Sophie', 'Elena', 'Նայիրի'), role: 'Receptionist', color: '#14A3A3', hair: '#6B3E26', skin: '#F0C29E' },
    turns: [
      { other: L('Good evening, welcome! Do you have a reservation?', 'Buonasera e benvenuto! Ha una prenotazione?', 'Bonsoir et bienvenue ! Vous avez une réservation ?', '¡Buenas tardes y bienvenido! ¿Tiene una reserva?', 'Բարի իրիկուն եւ բարի եկաք։ Ամրագրում ունի՞ք։'),
        answer: L('Yes, under the name Martin.', 'Sì, a nome Martin.', 'Oui, au nom de Martin.', 'Sí, a nombre de Martin.', 'Այո, Մարթին անունով։'),
        wrong: [W.cold, W.dogs], hint: 'Confirm the booking and give the name.' },
      { other: L('Perfect. A double room for three nights.', 'Perfetto. Una camera doppia per tre notti.', 'Parfait. Une chambre double pour trois nuits.', 'Perfecto. Una habitación doble para tres noches.', 'Շատ լաւ։ Երկու հոգիի սենեակ մը, երեք գիշերով։'),
        answer: L('What time is breakfast?', 'A che ora è la colazione?', 'À quelle heure est le petit-déjeuner ?', '¿A qué hora es el desayuno?', 'Նախաճաշը ժամը քանի՞ին է։'),
        wrong: [W.museum, W.thirsty], hint: 'Ask a hotel question: what time is breakfast?', build: true },
      { other: L('From seven to ten. Here is your key, room 214.', 'Dalle sette alle dieci. Ecco la chiave, camera 214.', 'De sept heures à dix heures. Voici votre clé, chambre 214.', 'De siete a diez. Aquí tiene la llave, habitación 214.', 'Եօթնէն տասը։ Ահա՛ ձեր բանալին, սենեակ 214։'),
        answer: L('Thank you. Is there Wi-Fi in the room?', 'Grazie. C\'è il Wi-Fi in camera?', 'Merci. Il y a le wifi dans la chambre ?', 'Gracias. ¿Hay wifi en la habitación?', 'Շնորհակալ եմ։ Սենեակին մէջ Wi-Fi կա՞յ։'),
        wrong: [W.tomatoes, W.two], hint: 'Take the key, say thanks, and ask about the room.' },
    ],
    closing: L('Of course, the password is on the card. Have a good stay!', 'Certo, la password è sul biglietto. Buon soggiorno!', 'Bien sûr, le mot de passe est sur la carte. Bon séjour !', 'Claro, la contraseña está en la tarjeta. ¡Buena estancia!', 'Անշուշտ, գաղտնաբառը քարտին վրայ է։ Հաճելի մնացում։'),
  },
  {
    id: 'train', title: 'Ticket to the airport', setting: 'The station ticket window', icon: 'train',
    partner: { name: P('Davide', 'Mathieu', 'Raúl', 'Կարօ'), role: 'Ticket clerk', color: '#0E7490', hair: '#4A4A4A', skin: '#D8A27D' },
    turns: [
      { other: L('Hello, where are you going?', 'Buongiorno, dove va?', 'Bonjour, vous allez où ?', 'Hola, ¿adónde va?', "Բարեւ, ո՞ւր կ'երթաք։"),
        answer: L('A ticket to the airport, please.', "Un biglietto per l'aeroporto, per favore.", "Un billet pour l'aéroport, s'il vous plaît.", 'Un billete para el aeropuerto, por favor.', 'Օդակայանի տոմս մը, կը խնդրեմ։'),
        wrong: [W.two, W.since], hint: 'Ask for a ticket to where you are going.' },
      { other: L('One way or return?', 'Solo andata o andata e ritorno?', 'Aller simple ou aller-retour ?', '¿Ida o ida y vuelta?', 'Միայն երթալո՞ւ, թէ երթ ու դարձ։'),
        answer: W.returnToday, wrong: [W.water, W.milk], hint: 'Choose a return ticket, for today.', build: true },
      { other: L("That's twelve euros. The train leaves from platform three.", 'Sono dodici euro. Il treno parte dal binario tre.', 'Ça fait douze euros. Le train part du quai trois.', 'Son doce euros. El tren sale del andén tres.', 'Տասներկու եւրօ է։ Շոգեկառքը երրորդ կառամատոյցէն կը մեկնի։'),
        answer: L('Thanks. What time does it leave?', 'Grazie. A che ora parte?', 'Merci. Il part à quelle heure ?', 'Gracias. ¿A qué hora sale?', 'Շնորհակալ եմ։ Ժամը քանի՞ին կը մեկնի։'),
        wrong: [W.tryOn, W.name], hint: 'Ask when the train leaves.' },
    ],
    closing: L('In ten minutes. Have a good trip!', 'Tra dieci minuti. Buon viaggio!', 'Dans dix minutes. Bon voyage !', 'En diez minutos. ¡Buen viaje!', 'Տասը վայրկեանէն։ Բարի ճամբայ։'),
  },
  {
    id: 'doctor', title: 'At the doctor', setting: 'A quiet clinic room', icon: 'medkit',
    partner: { name: P('Dottoressa Bianchi', 'Docteure Moreau', 'Doctora Ruiz', 'Բժշկուհի Սարգսեան'), role: 'Doctor', color: '#20B486', hair: '#2F2A26', skin: '#E6B48E' },
    turns: [
      { other: L("Good morning. What's wrong?", 'Buongiorno. Cosa si sente?', "Bonjour. Qu'est-ce qui ne va pas ?", 'Buenos días. ¿Qué le pasa?', 'Բարի լոյս։ Ի՞նչ ունիք։'),
        answer: L('I have a sore throat and a fever.', 'Ho mal di gola e la febbre.', "J'ai mal à la gorge et de la fièvre.", 'Me duele la garganta y tengo fiebre.', 'Կոկորդս կը ցաւի եւ ջերմ ունիմ։'),
        wrong: [W.jacket, W.breakfast], hint: 'Describe how you feel: sore throat and fever.' },
      { other: L('Since when?', 'Da quando?', 'Depuis quand ?', '¿Desde cuándo?', 'Երբուընէ՞ վեր։'),
        answer: W.since, wrong: [W.medium, W.milk], hint: 'Say when it started: since yesterday evening.', build: true },
      { other: L('Drink a lot of water and take this medicine twice a day.', 'Beva molta acqua e prenda questa medicina due volte al giorno.', "Buvez beaucoup d'eau et prenez ce médicament deux fois par jour.", 'Beba mucha agua y tome esta medicina dos veces al día.', 'Շատ ջուր խմեցէք եւ այս դեղը օրը երկու անգամ առէք։'),
        answer: L('Okay. Before or after meals?', 'Va bene. Prima o dopo i pasti?', "D'accord. Avant ou après les repas ?", 'Vale. ¿Antes o después de comer?', 'Լաւ։ Ճաշէն առա՞ջ թէ ետք։'),
        wrong: [W.table, W.tryOn], hint: 'Ask a useful follow-up: before or after meals?' },
    ],
    closing: L('After meals. Get well soon!', 'Dopo i pasti. Guarisca presto!', 'Après les repas. Bon rétablissement !', 'Después de comer. ¡Que se mejore!', 'Ճաշէն ետք։ Շուտ առողջացէք։'),
  },
  {
    id: 'hairdresser', title: 'Booking a haircut', setting: 'A phone call to the salon', icon: 'cut',
    partner: { name: P('Simona', 'Chloé', 'Rocío', 'Լուսինէ'), role: 'Salon receptionist', color: '#EC4899', hair: '#C2410C', skin: '#F3CBA8' },
    turns: [
      { other: L('Hello, hair salon. How can I help?', 'Pronto, parrucchiere. Come posso aiutarla?', 'Allô, salon de coiffure. Je peux vous aider ?', 'Hola, peluquería. ¿En qué puedo ayudarle?', 'Բարեւ, վարսայարդարման սրահ։ Ինչո՞վ կրնամ օգնել։'),
        answer: L("I'd like an appointment, please.", 'Vorrei un appuntamento, per favore.', "Je voudrais un rendez-vous, s'il vous plaît.", 'Quisiera una cita, por favor.', "Ժամադրութիւն մը կ'ուզեմ, կը խնդրեմ։"),
        wrong: [W.tomatoes, W.fish], hint: 'You are calling to book an appointment.' },
      { other: L('When would you like to come?', 'Quando vuole venire?', 'Quand voulez-vous venir ?', '¿Cuándo quiere venir?', "Ե՞րբ կ'ուզէք գալ։"),
        answer: L('On Friday morning, if possible.', 'Venerdì mattina, se possibile.', 'Vendredi matin, si possible.', 'El viernes por la mañana, si es posible.', 'Ուրբաթ առտու, եթէ կարելի է։'),
        wrong: [W.lemons, W.medium], hint: 'Give a day and time: Friday morning.', build: true },
      { other: L("Friday at ten is free. What's your name?", 'Venerdì alle dieci è libero. Come si chiama?', "Vendredi à dix heures, c'est libre. Votre nom ?", 'El viernes a las diez está libre. ¿Cómo se llama?', 'Ուրբաթ ժամը տասը ազատ է։ Ձեր անունը ի՞նչ է։'),
        answer: L('Sam Martin. Ten is perfect.', 'Sam Martin. Le dieci vanno benissimo.', "Sam Martin. Dix heures, c'est parfait.", 'Sam Martin. A las diez está perfecto.', 'Սամ Մարթին։ Ժամը տասը շատ լաւ է։'),
        wrong: [W.platform3, W.since], hint: 'Give your name and confirm the time.' },
    ],
    closing: L('Wonderful, see you Friday, Sam!', 'Benissimo, a venerdì, Sam!', 'Très bien, à vendredi, Sam !', '¡Estupendo, hasta el viernes, Sam!', 'Հիանալի՛, ուրբաթ կը տեսնուինք, Սամ։'),
  },
  {
    id: 'birthday', title: 'Party invitation', setting: 'Chatting with your neighbour', icon: 'gift',
    partner: { name: P('Matteo', 'Noé', 'Diego', 'Արամ'), role: 'Neighbour', color: '#F59E0B', hair: '#3B2416', skin: '#C88A63' },
    turns: [
      { other: L('Hi! Saturday is my birthday. Do you want to come to my party?', 'Ciao! Sabato è il mio compleanno. Vuoi venire alla mia festa?', "Salut ! Samedi, c'est mon anniversaire. Tu veux venir à ma fête ?", '¡Hola! El sábado es mi cumpleaños. ¿Quieres venir a mi fiesta?', "Բարեւ։ Շաբաթ օր ծնունդս է։ Կ'ուզե՞ս տօնախմբութեանս գալ։"),
        answer: L('Of course! What time?', 'Certo! A che ora?', 'Bien sûr ! À quelle heure ?', '¡Claro! ¿A qué hora?', 'Անշուշտ։ Ժամը քանի՞ին։'),
        wrong: [W.tomatoes, W.returnToday], hint: 'Accept the invitation and ask what time.' },
      { other: L('At eight, at my house.', 'Alle otto, a casa mia.', 'À huit heures, chez moi.', 'A las ocho, en mi casa.', 'Ժամը ութին, մեր տունը։'),
        answer: L('Can I bring something?', 'Posso portare qualcosa?', 'Je peux apporter quelque chose ?', '¿Puedo llevar algo?', 'Կրնա՞մ բան մը բերել։'),
        wrong: [W.tryOn, W.museum], hint: 'Be a good guest: offer to bring something.', build: true },
      { other: L('Maybe a dessert? I love chocolate.', 'Magari un dolce? Adoro il cioccolato.', "Peut-être un dessert ? J'adore le chocolat.", '¿Quizás un postre? Me encanta el chocolate.', 'Թերեւս անուշեղէն մը։ Շոքոլա շատ կը սիրեմ։'),
        answer: L("Perfect, I'll make a chocolate cake!", 'Perfetto, faccio una torta al cioccolato!', 'Parfait, je fais un gâteau au chocolat !', '¡Perfecto, hago una tarta de chocolate!', 'Հիանալի՛, շոքոլայով կարկանդակ մը կը պատրաստեմ։'),
        wrong: [W.doubleRoom, W.five], hint: 'Agree to bring something chocolatey.' },
    ],
    closing: L('Amazing! See you Saturday!', 'Fantastico! A sabato!', 'Génial ! À samedi !', '¡Genial! ¡Nos vemos el sábado!', 'Սքանչելի՛։ Շաբաթ կը տեսնուինք։'),
  },
  {
    id: 'lost-phone', title: 'The lost phone', setting: 'The lost-and-found office', icon: 'phone-portrait',
    partner: { name: P('Signor Gallo', 'Monsieur Petit', 'Señor Ortega', 'Պարոն Յակոբ'), role: 'Office clerk', color: '#64748B', hair: '#9CA3AF', skin: '#E3B08C' },
    turns: [
      { other: L('Hello, lost and found. What did you lose?', 'Buongiorno, oggetti smarriti. Cosa ha perso?', "Bonjour, objets trouvés. Qu'avez-vous perdu ?", 'Hola, objetos perdidos. ¿Qué ha perdido?', 'Բարեւ, կորսուած իրերու գրասենեակ։ Ի՞նչ կորսնցուցիք։'),
        answer: L('I lost my phone on the bus.', "Ho perso il telefono sull'autobus.", "J'ai perdu mon téléphone dans le bus.", 'Perdí mi móvil en el autobús.', 'Հեռաձայնս հանրակառքին մէջ կորսնցուցի։'),
        wrong: [W.appointment, W.table], hint: 'Say what you lost and where.' },
      { other: L('What color is it?', 'Di che colore è?', 'Il est de quelle couleur ?', '¿De qué color es?', 'Ի՞նչ գոյն է։'),
        answer: L('It is black with a red case.', 'È nero con una cover rossa.', 'Il est noir avec une coque rouge.', 'Es negro con una funda roja.', 'Սեւ է, կարմիր պատեանով։'),
        wrong: [W.eightHome, W.medium], hint: 'Describe it: black with a red case.', build: true },
      { other: L('Is this it?', 'È questo?', "C'est celui-ci ?", '¿Es este?', 'Ա՞յս է։'),
        answer: L("Yes, that's mine! Thank you!", 'Sì, è il mio! Grazie!', "Oui, c'est le mien ! Merci !", '¡Sí, es el mío! ¡Gracias!', 'Այո, իմս է։ Շնորհակալ եմ։'),
        wrong: [W.kiloYes, W.cold], hint: 'Recognise your phone and thank them.' },
    ],
    closing: L('Lucky day! Please sign here.', 'Che fortuna! Firmi qui, per favore.', 'Quelle chance ! Signez ici, s\'il vous plaît.', '¡Qué suerte! Firme aquí, por favor.', 'Բախտաւոր օր։ Հաճեցէք հոս ստորագրել։'),
  },
];

/** Strip trailing punctuation from a word tile for display/comparison. */
export function chatTileWord(word: string) {
  return word.replace(/^[¡¿«"]+/, '').replace(/[.,!?։:;»"]+$/, '');
}

/** Tokens a learner must assemble for a builder turn. */
export function chatAnswerTokens(text: string) {
  return text.split(/\s+/).map(chatTileWord).filter(Boolean);
}
