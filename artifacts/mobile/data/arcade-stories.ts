import type { Language } from '@/data/vocabulary';

/** Multilingual line: English + one hand-written translation per course language. */
export type StoryLine = { en: string } & Record<Language, string>;
const L = (en: string, italian: string, french: string, spanish: string, armenian: string): StoryLine => ({ en, italian, french, spanish, armenian });

export type StoryScene = { icons: string[]; sky: string; ground: string };
export type StoryChoice = { label: StoryLine; to: string };
export type StoryPage = {
  scene: StoryScene;
  lines: StoryLine[];
  choices?: StoryChoice[];
  next?: string;
  /** Present on ending pages: index of the correct comprehension option for this ending. */
  answer?: number;
  endingTitle?: string;
};
export type ArcadeStory = {
  id: string;
  level: number;
  title: StoryLine;
  color: string;
  icon: string;
  pages: Record<string, StoryPage>;
  question: { prompt: string; options: StoryLine[] };
};

const sc = (sky: string, ground: string, ...icons: string[]): StoryScene => ({ sky, ground, icons });

export const ARCADE_STORIES: ArcadeStory[] = [
  {
    id: 'lost-cat', level: 1, color: '#2F8CFF', icon: 'paw',
    title: L('The Missing Cat', 'Il gatto sparito', 'Le chat disparu', 'El gato perdido', 'Անհետացած կատուն'),
    question: {
      prompt: 'How does the cat come down from the tree?',
      options: [
        L('Lia climbs and takes it.', 'Lia sale e lo prende.', 'Lia grimpe et le prend.', 'Lía sube y lo agarra.', 'Լիան կը մագլցի ու զայն կ\'առնէ։'),
        L('Dad brings a ladder.', 'Papà porta una scala.', 'Papa apporte une échelle.', 'Papá trae una escalera.', 'Հայրիկը սանդուխ մը կը բերէ։'),
        L('The cat jumps into the garden.', 'Il gatto salta in giardino.', 'Le chat saute dans le jardin.', 'El gato salta al jardín.', 'Կատուն պարտէզ կը ցատկէ։'),
      ],
    },
    pages: {
      start: {
        scene: sc('#CFE6FF', '#7BC67E', 'home', 'paw'),
        lines: [
          L('Lia has a small cat.', 'Lia ha un gatto piccolo.', 'Lia a un petit chat.', 'Lía tiene un gato pequeño.', 'Լիան պզտիկ կատու մը ունի։'),
          L('Today the cat is not at home.', 'Oggi il gatto non è a casa.', "Aujourd'hui, le chat n'est pas à la maison.", 'Hoy el gato no está en casa.', 'Այսօր կատուն տունը չէ։'),
        ],
        choices: [
          { label: L('Look in the garden', 'Cerca in giardino', 'Chercher dans le jardin', 'Buscar en el jardín', 'Պարտէզին մէջ փնտռել'), to: 'garden' },
          { label: L('Ask the neighbor', 'Chiedi al vicino', 'Demander au voisin', 'Preguntar al vecino', 'Դրացիին հարցնել'), to: 'neighbor' },
        ],
      },
      garden: {
        scene: sc('#D6F2DD', '#5DB86A', 'flower', 'football', 'leaf'),
        lines: [
          L('The garden is green and quiet.', 'Il giardino è verde e tranquillo.', 'Le jardin est vert et calme.', 'El jardín es verde y tranquilo.', 'Պարտէզը կանաչ ու հանդարտ է։'),
          L('Lia sees a red ball, but no cat.', 'Lia vede una palla rossa, ma niente gatto.', 'Lia voit une balle rouge, mais pas de chat.', 'Lía ve una pelota roja, pero ningún gato.', 'Լիան կարմիր գնդակ մը կը տեսնէ, բայց կատու չկայ։'),
        ],
        next: 'tree',
      },
      neighbor: {
        scene: sc('#FFE9C7', '#C9A26B', 'person', 'chatbubble-ellipses'),
        lines: [
          L('The neighbor is an old man.', 'Il vicino è un uomo anziano.', 'Le voisin est un vieil homme.', 'El vecino es un hombre mayor.', 'Դրացին ծեր մարդ մըն է։'),
          L('He says the cat is near the tree.', "Dice che il gatto è vicino all'albero.", "Il dit que le chat est près de l'arbre.", 'Dice que el gato está cerca del árbol.', "Ան կ'ըսէ, որ կատուն ծառին մօտ է։"),
        ],
        next: 'tree',
      },
      tree: {
        scene: sc('#CFE6FF', '#7BC67E', 'leaf', 'paw', 'musical-note'),
        lines: [
          L('Lia hears a small sound.', 'Lia sente un piccolo suono.', 'Lia entend un petit bruit.', 'Lía oye un pequeño ruido.', 'Լիան պզտիկ ձայն մը կը լսէ։'),
          L('The cat is in the tree, very high.', "Il gatto è sull'albero, molto in alto.", "Le chat est dans l'arbre, très haut.", 'El gato está en el árbol, muy alto.', 'Կատուն ծառին վրայ է, շատ բարձր։'),
        ],
        choices: [
          { label: L('Climb the tree', "Sali sull'albero", "Grimper dans l'arbre", 'Subir al árbol', 'Ծառը մագլցիլ'), to: 'climb' },
          { label: L('Call Dad', 'Chiama papà', 'Appeler papa', 'Llamar a papá', 'Հայրիկը կանչել'), to: 'dad' },
        ],
      },
      climb: {
        scene: sc('#FFE3D6', '#7BC67E', 'paw', 'heart', 'home'), answer: 0, endingTitle: 'Brave climber',
        lines: [
          L('Lia climbs slowly and takes the cat.', 'Lia sale piano e prende il gatto.', 'Lia grimpe doucement et prend le chat.', 'Lía sube despacio y agarra al gato.', "Լիան կամաց կը մագլցի ու կատուն կ'առնէ։"),
          L('Now they are at home together.', 'Ora sono a casa insieme.', 'Maintenant, ils sont ensemble à la maison.', 'Ahora están juntos en casa.', 'Հիմա միասին տունն են։'),
        ],
      },
      dad: {
        scene: sc('#FFF1C2', '#7BC67E', 'person', 'reorder-four', 'happy'), answer: 1, endingTitle: 'Team rescue',
        lines: [
          L('Dad comes with a long ladder.', 'Papà arriva con una scala lunga.', 'Papa arrive avec une longue échelle.', 'Papá llega con una escalera larga.', 'Հայրիկը երկար սանդուխով մը կու գայ։'),
          L('The cat comes down and Lia laughs.', 'Il gatto scende e Lia ride.', 'Le chat descend et Lia rit.', 'El gato baja y Lía se ríe.', "Կատուն վար կ'իջնէ ու Լիան կը խնդայ։"),
        ],
      },
    },
  },
  {
    id: 'grandma-cake', level: 1, color: '#FF6B4A', icon: 'basket',
    title: L("Grandma's Cake", 'La torta della nonna', 'Le gâteau de grand-mère', 'El pastel de la abuela', 'Մեծ մայրիկին կարկանդակը'),
    question: {
      prompt: 'What makes the cake sweet in the end?',
      options: [
        L('Honey.', 'Il miele.', 'Du miel.', 'Miel.', 'Մեղր։'),
        L('Sugar from the shop.', 'Lo zucchero del negozio.', 'Du sucre du magasin.', 'Azúcar de la tienda.', 'Խանութին շաքարը։'),
        L('Chocolate.', 'Il cioccolato.', 'Du chocolat.', 'Chocolate.', 'Շոքոլա։'),
      ],
    },
    pages: {
      start: {
        scene: sc('#FFE6D6', '#E8B07A', 'storefront', 'basket'),
        lines: [
          L('Marco goes to the market with Grandma.', 'Marco va al mercato con la nonna.', 'Marco va au marché avec sa grand-mère.', 'Marco va al mercado con su abuela.', "Մարքօ մեծ մօրը հետ շուկայ կ'երթայ։"),
          L('Grandma wants fruit for a cake.', 'La nonna vuole frutta per una torta.', 'Grand-mère veut des fruits pour un gâteau.', 'La abuela quiere fruta para un pastel.', "Մեծ մայրիկը կարկանդակի համար պտուղ կ'ուզէ։"),
        ],
        choices: [
          { label: L('Buy apples', 'Compra le mele', 'Acheter des pommes', 'Comprar manzanas', 'Խնձոր գնել'), to: 'apples' },
          { label: L('Buy strawberries', 'Compra le fragole', 'Acheter des fraises', 'Comprar fresas', 'Ելակ գնել'), to: 'berries' },
        ],
      },
      apples: {
        scene: sc('#E3F6D8', '#9BCB6B', 'nutrition', 'cash'),
        lines: [
          L('The apples are big and cheap.', 'Le mele sono grandi ed economiche.', 'Les pommes sont grosses et pas chères.', 'Las manzanas son grandes y baratas.', 'Խնձորները մեծ ու աժան են։'),
          L('Marco buys six apples.', 'Marco compra sei mele.', 'Marco achète six pommes.', 'Marco compra seis manzanas.', 'Մարքօ վեց խնձոր կը գնէ։'),
        ],
        next: 'kitchen',
      },
      berries: {
        scene: sc('#FFDDE4', '#E58FA0', 'heart', 'cube'),
        lines: [
          L('The strawberries are small and sweet.', 'Le fragole sono piccole e dolci.', 'Les fraises sont petites et sucrées.', 'Las fresas son pequeñas y dulces.', 'Ելակները պզտիկ ու անուշ են։'),
          L('Marco buys a box of strawberries.', 'Marco compra una scatola di fragole.', 'Marco achète une boîte de fraises.', 'Marco compra una caja de fresas.', 'Մարքօ տուփ մը ելակ կը գնէ։'),
        ],
        next: 'kitchen',
      },
      kitchen: {
        scene: sc('#FFF3D1', '#D9B98A', 'home', 'alert-circle'),
        lines: [
          L('At home, Grandma opens the cupboard.', 'A casa, la nonna apre la credenza.', 'À la maison, grand-mère ouvre le placard.', 'En casa, la abuela abre el armario.', 'Տունը, մեծ մայրիկը պահարանը կը բանայ։'),
          L('Oh no, there is no sugar!', "Oh no, non c'è zucchero!", "Oh non, il n'y a pas de sucre !", '¡Ay no, no hay azúcar!', 'Վա՜յ, շաքար չկայ։'),
        ],
        choices: [
          { label: L('Use honey', 'Usa il miele', 'Utiliser du miel', 'Usar miel', 'Մեղր գործածել'), to: 'honey' },
          { label: L('Go to the shop', 'Va\' al negozio', 'Aller au magasin', 'Ir a la tienda', 'Խանութ երթալ'), to: 'shop' },
        ],
      },
      honey: {
        scene: sc('#FFEFC2', '#E7B85A', 'flower', 'pie-chart'), answer: 0, endingTitle: 'Golden idea',
        lines: [
          L('Grandma puts honey in the cake.', 'La nonna mette il miele nella torta.', 'Grand-mère met du miel dans le gâteau.', 'La abuela pone miel en el pastel.', 'Մեծ մայրիկը կարկանդակին մէջ մեղր կը դնէ։'),
          L('The cake is soft and very good.', 'La torta è morbida e molto buona.', 'Le gâteau est moelleux et très bon.', 'El pastel está blando y muy rico.', 'Կարկանդակը կակուղ ու շատ համով է։'),
        ],
      },
      shop: {
        scene: sc('#DCEBFF', '#9DB7D9', 'walk', 'storefront', 'time'), answer: 1, endingTitle: 'Speedy errand',
        lines: [
          L('Marco runs to the shop and buys sugar.', 'Marco corre al negozio e compra lo zucchero.', 'Marco court au magasin et achète du sucre.', 'Marco corre a la tienda y compra azúcar.', 'Մարքօ խանութ կը վազէ ու շաքար կը գնէ։'),
          L('At seven, the cake is ready.', 'Alle sette, la torta è pronta.', 'À sept heures, le gâteau est prêt.', 'A las siete, el pastel está listo.', 'Ժամը եօթին կարկանդակը պատրաստ է։'),
        ],
      },
    },
  },
  {
    id: 'sea-train', level: 2, color: '#14A3A3', icon: 'train',
    title: L('The Train to the Sea', 'Il treno per il mare', 'Le train pour la mer', 'El tren al mar', 'Ծով երթալու շոգեկառքը'),
    question: {
      prompt: 'What does Nina do on the train?',
      options: [
        L('She sings with the girl.', 'Canta con la ragazza.', 'Elle chante avec la fille.', 'Canta con la chica.', "Աղջկան հետ կ'երգէ։"),
        L('She reads and sees the sea.', 'Legge e vede il mare.', 'Elle lit et voit la mer.', 'Lee y ve el mar.', 'Կը կարդայ ու ծովը կը տեսնէ։'),
        L('She sleeps all day.', 'Dorme tutto il giorno.', 'Elle dort toute la journée.', 'Duerme todo el día.', 'Ամբողջ օրը կը քնանայ։'),
      ],
    },
    pages: {
      start: {
        scene: sc('#D7F1F1', '#9AA9B8', 'train', 'time'),
        lines: [
          L('Nina is at the station.', 'Nina è alla stazione.', 'Nina est à la gare.', 'Nina está en la estación.', 'Նինա կայարանն է։'),
          L('Her train to the sea leaves at nine.', 'Il suo treno per il mare parte alle nove.', 'Son train pour la mer part à neuf heures.', 'Su tren al mar sale a las nueve.', 'Ծով երթալու շոգեկառքը ժամը իննին կը մեկնի։'),
        ],
        choices: [
          { label: L('Buy a coffee', 'Prendi un caffè', 'Acheter un café', 'Comprar un café', 'Սուրճ մը գնել'), to: 'coffee' },
          { label: L('Read the board', 'Leggi il tabellone', 'Lire le tableau', 'Leer el panel', 'Ցուցատախտակը կարդալ'), to: 'board' },
        ],
      },
      coffee: {
        scene: sc('#FBE7D6', '#B98C6A', 'cafe', 'people'),
        lines: [
          L('The café is full of people.', 'Il bar è pieno di gente.', 'Le café est plein de monde.', 'La cafetería está llena de gente.', 'Սրճարանը մարդով լեցուն է։'),
          L('Nina waits a long time for her coffee.', 'Nina aspetta molto tempo il suo caffè.', 'Nina attend longtemps son café.', 'Nina espera mucho tiempo su café.', 'Նինա իր սուրճին երկար կը սպասէ։'),
        ],
        next: 'late',
      },
      board: {
        scene: sc('#E0E8FF', '#9AA9B8', 'list', 'footsteps'),
        lines: [
          L('On the board, Nina reads: platform four.', 'Sul tabellone, Nina legge: binario quattro.', 'Sur le tableau, Nina lit : quai quatre.', 'En el panel, Nina lee: andén cuatro.', 'Ցուցատախտակին վրայ Նինա կը կարդայ. չորրորդ կառամատոյց։'),
          L('She walks to the platform early.', 'Va al binario in anticipo.', 'Elle va au quai en avance.', 'Va al andén temprano.', "Կանուխ կառամատոյց կ'երթայ։"),
        ],
        next: 'late',
      },
      late: {
        scene: sc('#EDE3FF', '#9AA9B8', 'megaphone', 'musical-notes'),
        lines: [
          L('A voice says that the train is late.', 'Una voce dice che il treno è in ritardo.', 'Une voix dit que le train est en retard.', 'Una voz dice que el tren llega tarde.', "Ձայն մը կ'ըսէ, որ շոգեկառքը ուշ է։"),
          L('Nina sits next to a girl with a guitar.', 'Nina si siede vicino a una ragazza con una chitarra.', "Nina s'assoit à côté d'une fille avec une guitare.", 'Nina se sienta al lado de una chica con una guitarra.', 'Նինա կիթառով աղջկան մը քով կը նստի։'),
        ],
        choices: [
          { label: L('Talk to the girl', 'Parla con la ragazza', 'Parler à la fille', 'Hablar con la chica', 'Աղջկան հետ խօսիլ'), to: 'song' },
          { label: L('Read a book', 'Leggi un libro', 'Lire un livre', 'Leer un libro', 'Գիրք մը կարդալ'), to: 'book' },
        ],
      },
      song: {
        scene: sc('#FFE3EE', '#14A3A3', 'musical-notes', 'happy'), answer: 0, endingTitle: 'A new duet',
        lines: [
          L('The girl plays a song for Nina.', 'La ragazza suona una canzone per Nina.', 'La fille joue une chanson pour Nina.', 'La chica toca una canción para Nina.', 'Աղջիկը Նինային համար երգ մը կը նուագէ։'),
          L('On the train, they sing together.', 'Sul treno cantano insieme.', 'Dans le train, elles chantent ensemble.', 'En el tren, cantan juntas.', "Շոգեկառքին մէջ միասին կ'երգեն։"),
        ],
      },
      book: {
        scene: sc('#CDEBFF', '#2F8CFF', 'book', 'water', 'sunny'), answer: 1, endingTitle: 'Blue horizon',
        lines: [
          L('Nina reads quietly on the train.', 'Nina legge in silenzio sul treno.', 'Nina lit tranquillement dans le train.', 'Nina lee tranquila en el tren.', 'Նինա շոգեկառքին մէջ հանդարտ կը կարդայ։'),
          L('When she looks up, she sees the blue sea.', 'Quando alza gli occhi, vede il mare blu.', 'Quand elle lève les yeux, elle voit la mer bleue.', 'Cuando levanta la vista, ve el mar azul.', 'Երբ գլուխը կը վերցնէ, կապոյտ ծովը կը տեսնէ։'),
        ],
      },
    },
  },
  {
    id: 'picnic-rain', level: 2, color: '#20B486', icon: 'umbrella',
    title: L('Picnic Weather', 'Tempo da picnic', 'Un temps à pique-nique', 'Tiempo de pícnic', 'Բացօթեայ ճաշի օր'),
    question: {
      prompt: 'How does their day end?',
      options: [
        L('Under a tree, with a rainbow.', 'Sotto un albero, con un arcobaleno.', 'Sous un arbre, avec un arc-en-ciel.', 'Bajo un árbol, con un arcoíris.', 'Ծառի մը տակ, ծիածանով։'),
        L('In a café, playing cards.', 'In un bar, giocando a carte.', 'Dans un café, en jouant aux cartes.', 'En una cafetería, jugando a las cartas.', 'Սրճարանի մը մէջ, թուղթ խաղալով։'),
        L('At home, watching a film.', 'A casa, guardando un film.', 'À la maison, devant un film.', 'En casa, viendo una película.', 'Տունը, ժապաւէն դիտելով։'),
      ],
    },
    pages: {
      start: {
        scene: sc('#DDE3EA', '#7BC67E', 'cloud', 'basket'),
        lines: [
          L('Sara and Luca want to have a picnic in the park.', 'Sara e Luca vogliono fare un picnic al parco.', 'Sara et Luca veulent faire un pique-nique au parc.', 'Sara y Luca quieren hacer un pícnic en el parque.', "Սառա եւ Լուքա կ'ուզեն զբօսայգիին մէջ բացօթեայ ճաշ ընել։"),
          L('But the sky is grey this morning.', 'Ma stamattina il cielo è grigio.', 'Mais ce matin, le ciel est gris.', 'Pero esta mañana el cielo está gris.', 'Բայց այս առտու երկինքը գորշ է։'),
        ],
        choices: [
          { label: L('Take an umbrella', "Prendi l'ombrello", 'Prendre un parapluie', 'Llevar un paraguas', 'Անձրեւանոց առնել'), to: 'umbrella' },
          { label: L('Take sunglasses', 'Prendi gli occhiali da sole', 'Prendre des lunettes de soleil', 'Llevar gafas de sol', 'Արեւի ակնոց առնել'), to: 'sun' },
        ],
      },
      umbrella: {
        scene: sc('#E2E8F0', '#7BC67E', 'umbrella', 'bag-handle'),
        lines: [
          L('Luca puts a big umbrella in the bag.', 'Luca mette un grande ombrello nella borsa.', 'Luca met un grand parapluie dans le sac.', 'Luca pone un paraguas grande en la bolsa.', 'Լուքա մեծ անձրեւանոց մը պայուսակին մէջ կը դնէ։'),
          L('Sara laughs, but Luca is serious.', 'Sara ride, ma Luca è serio.', 'Sara rit, mais Luca est sérieux.', 'Sara se ríe, pero Luca está serio.', 'Սառա կը խնդայ, բայց Լուքա լուրջ է։'),
        ],
        next: 'storm',
      },
      sun: {
        scene: sc('#FFF2C4', '#7BC67E', 'glasses', 'sunny'),
        lines: [
          L('Sara brings sunglasses and a hat.', 'Sara porta gli occhiali da sole e un cappello.', 'Sara apporte des lunettes de soleil et un chapeau.', 'Sara lleva gafas de sol y un sombrero.', 'Սառա արեւի ակնոց եւ գլխարկ մը կը բերէ։'),
          L('She says that the sun will come later.', 'Dice che il sole arriverà più tardi.', 'Elle dit que le soleil va venir plus tard.', 'Dice que el sol saldrá más tarde.', "Կ'ըսէ, որ արեւը աւելի ուշ պիտի գայ։"),
        ],
        next: 'storm',
      },
      storm: {
        scene: sc('#C9D2DE', '#5FA36A', 'rainy', 'thunderstorm', 'walk'),
        lines: [
          L('In the park, it starts to rain hard.', 'Al parco comincia a piovere forte.', 'Au parc, il commence à pleuvoir fort.', 'En el parque empieza a llover fuerte.', 'Զբօսայգիին մէջ սաստիկ անձրեւ կը սկսի։'),
          L('People run under the trees.', 'La gente corre sotto gli alberi.', 'Les gens courent sous les arbres.', 'La gente corre bajo los árboles.', 'Մարդիկ ծառերուն տակ կը վազեն։'),
        ],
        choices: [
          { label: L('Stay in the park', 'Resta al parco', 'Rester au parc', 'Quedarse en el parque', 'Զբօսայգիին մէջ մնալ'), to: 'rainbow' },
          { label: L('Go to a café', 'Va\' in un bar', 'Aller dans un café', 'Ir a una cafetería', 'Սրճարան երթալ'), to: 'cards' },
        ],
      },
      rainbow: {
        scene: sc('#DDF4FF', '#7BC67E', 'leaf', 'color-palette', 'sunny'), answer: 0, endingTitle: 'After the rain',
        lines: [
          L('They eat sandwiches under a big tree.', 'Mangiano panini sotto un grande albero.', 'Ils mangent des sandwichs sous un grand arbre.', 'Comen bocadillos bajo un árbol grande.', "Մեծ ծառի մը տակ սանտուիչ կ'ուտեն։"),
          L('After the rain, they see a rainbow.', 'Dopo la pioggia, vedono un arcobaleno.', 'Après la pluie, ils voient un arc-en-ciel.', 'Después de la lluvia, ven un arcoíris.', 'Անձրեւէն ետք ծիածան մը կը տեսնեն։'),
        ],
      },
      cards: {
        scene: sc('#FBE4D6', '#B98C6A', 'cafe', 'albums'), answer: 1, endingTitle: 'Cozy afternoon',
        lines: [
          L('In the café, they drink hot chocolate.', 'Al bar bevono una cioccolata calda.', 'Au café, ils boivent un chocolat chaud.', 'En la cafetería beben chocolate caliente.', 'Սրճարանին մէջ տաք շոքոլա կը խմեն։'),
          L('They play cards until the evening.', 'Giocano a carte fino a sera.', "Ils jouent aux cartes jusqu'au soir.", 'Juegan a las cartas hasta la noche.', 'Մինչեւ իրիկուն թուղթ կը խաղան։'),
        ],
      },
    },
  },
  {
    id: 'first-day', level: 3, color: '#F59E0B', icon: 'briefcase',
    title: L('First Day at Work', 'Il primo giorno di lavoro', 'Premier jour au travail', 'El primer día de trabajo', 'Գործի առաջին օրը'),
    question: {
      prompt: 'How is the computer problem handled?',
      options: [
        L('Elena finds a loose cable.', 'Elena trova un cavo staccato.', 'Elena trouve un câble débranché.', 'Elena encuentra un cable suelto.', 'Էլենա թուլցած լար մը կը գտնէ։'),
        L('A technician comes, and Elena uses paper.', 'Arriva un tecnico ed Elena usa la carta.', 'Un technicien vient et Elena utilise du papier.', 'Viene un técnico y Elena usa papel.', 'Արհեստագէտ մը կու գայ, իսկ Էլենա թուղթ կը գործածէ։'),
        L('Elena goes home early.', 'Elena torna a casa presto.', 'Elena rentre tôt à la maison.', 'Elena vuelve pronto a casa.', 'Էլենա կանուխ տուն կը դառնայ։'),
      ],
    },
    pages: {
      start: {
        scene: sc('#FFF0CF', '#C9B48E', 'briefcase', 'alarm'),
        lines: [
          L("Today is Elena's first day at a new job.", 'Oggi è il primo giorno di Elena nel nuovo lavoro.', "Aujourd'hui, c'est le premier jour d'Elena dans son nouveau travail.", 'Hoy es el primer día de Elena en su nuevo trabajo.', 'Այսօր Էլենային նոր գործին առաջին օրն է։'),
          L('She wants to arrive early, so she leaves at seven.', 'Vuole arrivare presto, quindi esce alle sette.', 'Elle veut arriver tôt, alors elle part à sept heures.', 'Quiere llegar temprano, así que sale a las siete.', "Կ'ուզէ կանուխ հասնիլ, ուստի ժամը եօթին կ'ելլէ։"),
        ],
        choices: [
          { label: L('Take the bike', 'Prendi la bici', 'Prendre le vélo', 'Ir en bici', 'Հեծանիւով երթալ'), to: 'bike' },
          { label: L('Take the bus', "Prendi l'autobus", 'Prendre le bus', 'Tomar el autobús', 'Հանրակառքով երթալ'), to: 'bus' },
        ],
      },
      bike: {
        scene: sc('#DDF0FF', '#B7A58A', 'bicycle', 'leaf'),
        lines: [
          L('Elena rides fast through the old streets.', 'Elena pedala veloce per le vecchie strade.', 'Elena roule vite dans les vieilles rues.', 'Elena pedalea rápido por las calles antiguas.', 'Էլենա հին փողոցներէն արագ կը քշէ։'),
          L('The air is cold, but she feels free.', "L'aria è fredda, ma si sente libera.", "L'air est froid, mais elle se sent libre.", 'El aire está frío, pero se siente libre.', 'Օդը պաղ է, բայց ինքզինք ազատ կը զգայ։'),
        ],
        next: 'office',
      },
      bus: {
        scene: sc('#E6E8F2', '#9AA9B8', 'bus', 'document-text'),
        lines: [
          L('The bus is full and very slow.', "L'autobus è pieno e molto lento.", 'Le bus est plein et très lent.', 'El autobús está lleno y va muy lento.', 'Հանրակառքը լեցուն է ու շատ դանդաղ։'),
          L('Elena reads her notes for the meeting.', 'Elena legge i suoi appunti per la riunione.', 'Elena lit ses notes pour la réunion.', 'Elena lee sus notas para la reunión.', 'Էլենա ժողովին համար իր նօթերը կը կարդայ։'),
        ],
        next: 'office',
      },
      office: {
        scene: sc('#EFE8FF', '#B9AED6', 'desktop', 'alert-circle', 'people'),
        lines: [
          L("At the office, the boss says that the computer doesn't work.", 'In ufficio, il capo dice che il computer non funziona.', "Au bureau, la cheffe dit que l'ordinateur ne marche pas.", 'En la oficina, la jefa dice que el ordenador no funciona.', "Գրասենեակին մէջ տնօրէնը կ'ըսէ, որ համակարգիչը չ'աշխատիր։"),
          L('Everyone looks at Elena.', 'Tutti guardano Elena.', 'Tout le monde regarde Elena.', 'Todos miran a Elena.', 'Բոլորը Էլենային կը նային։'),
        ],
        choices: [
          { label: L('Try to fix it', 'Prova a ripararlo', 'Essayer de le réparer', 'Intentar arreglarlo', 'Փորձել նորոգել'), to: 'fix' },
          { label: L('Call the technician', 'Chiama il tecnico', 'Appeler le technicien', 'Llamar al técnico', 'Արհեստագէտը կանչել'), to: 'tech' },
        ],
      },
      fix: {
        scene: sc('#DFF7E8', '#8CCFA6', 'construct', 'thumbs-up'), answer: 0, endingTitle: 'Quiet hero',
        lines: [
          L('Elena checks the computer and finds a loose cable.', 'Elena controlla il computer e trova un cavo staccato.', "Elena vérifie l'ordinateur et trouve un câble débranché.", 'Elena revisa el ordenador y encuentra un cable suelto.', 'Էլենա համակարգիչը կը ստուգէ ու թուլցած լար մը կը գտնէ։'),
          L('The boss thanks her in front of everyone.', 'Il capo la ringrazia davanti a tutti.', 'La cheffe la remercie devant tout le monde.', 'La jefa le da las gracias delante de todos.', 'Տնօրէնը բոլորին առջեւ իրեն շնորհակալութիւն կը յայտնէ։'),
        ],
      },
      tech: {
        scene: sc('#FFF3D1', '#D9C08A', 'person', 'bulb', 'clipboard'), answer: 1, endingTitle: 'Plan B on paper',
        lines: [
          L('The technician arrives after an hour.', "Il tecnico arriva dopo un'ora.", 'Le technicien arrive après une heure.', 'El técnico llega después de una hora.', 'Արհեստագէտը ժամ մը ետք կու գայ։'),
          L('Meanwhile, Elena presents her ideas on paper.', 'Intanto Elena presenta le sue idee su carta.', 'En attendant, Elena présente ses idées sur papier.', 'Mientras tanto, Elena presenta sus ideas en papel.', 'Այդ ընթացքին Էլենա իր գաղափարները թուղթի վրայ կը ներկայացնէ։'),
        ],
      },
    },
  },
  {
    id: 'old-letter', level: 3, color: '#8B5CF6', icon: 'mail',
    title: L('The Old Letter', 'La vecchia lettera', 'La vieille lettre', 'La carta antigua', 'Հին նամակը'),
    question: {
      prompt: 'How did Grandpa reconnect with his old friend?',
      options: [
        L('They met at the old school.', 'Si sono incontrati alla vecchia scuola.', 'Ils se sont vus à la vieille école.', 'Se encontraron en la vieja escuela.', 'Հին դպրոցին մէջ հանդիպեցան։'),
        L('He phoned him in the evening.', "L'ha chiamato la sera.", "Il l'a appelé le soir.", 'Lo llamó por la noche.', 'Իրիկունը անոր հեռաձայնեց։'),
        L('He wrote a new letter.', 'Ha scritto una nuova lettera.', 'Il a écrit une nouvelle lettre.', 'Escribió una carta nueva.', 'Նոր նամակ մը գրեց։'),
      ],
    },
    pages: {
      start: {
        scene: sc('#F1E8FF', '#C4B08E', 'book', 'mail'),
        lines: [
          L("Last week, Ani found an old letter in her grandfather's book.", 'La settimana scorsa, Ani ha trovato una vecchia lettera nel libro del nonno.', 'La semaine dernière, Ani a trouvé une vieille lettre dans le livre de son grand-père.', 'La semana pasada, Ani encontró una carta vieja en el libro de su abuelo.', 'Անցեալ շաբաթ Անի մեծ հօրը գիրքին մէջ հին նամակ մը գտաւ։'),
          L('The letter had no name, only a date: 1968.', 'La lettera non aveva nessun nome, solo una data: 1968.', "La lettre n'avait pas de nom, seulement une date : 1968.", 'La carta no tenía nombre, solo una fecha: 1968.', 'Նամակը անուն չունէր, միայն թուական մը՝ 1968։'),
        ],
        choices: [
          { label: L('Ask Grandpa', 'Chiedi al nonno', 'Demander à grand-père', 'Preguntar al abuelo', 'Մեծ հայրիկին հարցնել'), to: 'ask' },
          { label: L('Search alone', 'Cerca da sola', 'Chercher seule', 'Buscar sola', 'Մինակը փնտռել'), to: 'library' },
        ],
      },
      ask: {
        scene: sc('#FFEBD9', '#C9A26B', 'person', 'musical-notes'),
        lines: [
          L('Grandpa smiled and said that the letter came from his best friend.', 'Il nonno ha sorriso e ha detto che la lettera era del suo migliore amico.', 'Grand-père a souri et a dit que la lettre venait de son meilleur ami.', 'El abuelo sonrió y dijo que la carta era de su mejor amigo.', "Մեծ հայրիկը ժպտեցաւ ու ըսաւ, որ նամակը իր լաւագոյն բարեկամէն էր։"),
          L('When they were young, they played music together.', 'Da giovani, suonavano musica insieme.', 'Quand ils étaient jeunes, ils jouaient de la musique ensemble.', 'De jóvenes, tocaban música juntos.', 'Երբ երիտասարդ էին, միասին երաժշտութիւն կը նուագէին։'),
        ],
        next: 'town',
      },
      library: {
        scene: sc('#E3EAFF', '#A9B4D0', 'library', 'image'),
        lines: [
          L('Ani looked for the address in the library.', "Ani ha cercato l'indirizzo in biblioteca.", "Ani a cherché l'adresse à la bibliothèque.", 'Ani buscó la dirección en la biblioteca.', 'Անի հասցէն գրադարանին մէջ փնտռեց։'),
          L('She found an old photo of a music school.', 'Ha trovato una vecchia foto di una scuola di musica.', "Elle a trouvé une vieille photo d'une école de musique.", 'Encontró una foto antigua de una escuela de música.', 'Երաժշտանոցի մը հին լուսանկարը գտաւ։'),
        ],
        next: 'town',
      },
      town: {
        scene: sc('#DFF0FF', '#8FA8C8', 'triangle', 'map'),
        lines: [
          L('The address was in a small town near the mountains.', "L'indirizzo era in un paesino vicino alle montagne.", "L'adresse était dans une petite ville près des montagnes.", 'La dirección estaba en un pueblo cerca de las montañas.', 'Հասցէն լեռներուն մօտ պզտիկ քաղաքի մը մէջ էր։'),
          L('Ani decided to go there on Saturday.', 'Ani ha deciso di andarci sabato.', "Ani a décidé d'y aller samedi.", 'Ani decidió ir allí el sábado.', 'Անի որոշեց շաբաթ օր հոն երթալ։'),
        ],
        choices: [
          { label: L('Take Grandpa', 'Porta il nonno', 'Emmener grand-père', 'Llevar al abuelo', 'Մեծ հայրիկը տանիլ'), to: 'reunion' },
          { label: L('Go with a friend', "Vai con un'amica", 'Y aller avec une amie', 'Ir con una amiga', 'Ընկերուհիի մը հետ երթալ'), to: 'phone' },
        ],
      },
      reunion: {
        scene: sc('#FFE6EC', '#C9A26B', 'people', 'heart'), answer: 0, endingTitle: 'Tears of joy',
        lines: [
          L('Grandpa and Ani visited the old school.', 'Il nonno e Ani hanno visitato la vecchia scuola.', 'Grand-père et Ani ont visité la vieille école.', 'El abuelo y Ani visitaron la vieja escuela.', 'Մեծ հայրիկը եւ Անի հին դպրոցը այցելեցին։'),
          L('There, his old friend recognised him, and they both cried with joy.', "Lì, il suo vecchio amico l'ha riconosciuto e hanno pianto di gioia.", "Là, son vieil ami l'a reconnu, et ils ont pleuré de joie.", 'Allí, su viejo amigo lo reconoció y los dos lloraron de alegría.', 'Հոն իր հին բարեկամը զինք ճանչցաւ, եւ երկուքն ալ ուրախութենէն լացին։'),
        ],
      },
      phone: {
        scene: sc('#E6F6EE', '#8CCFA6', 'lock-closed', 'call'), answer: 1, endingTitle: 'An evening call',
        lines: [
          L('Ani and her friend found the school closed.', 'Ani e la sua amica hanno trovato la scuola chiusa.', "Ani et son amie ont trouvé l'école fermée.", 'Ani y su amiga encontraron la escuela cerrada.', 'Անի եւ իր ընկերուհին դպրոցը գոց գտան։'),
          L('A neighbour gave them a phone number, and that evening Grandpa called his friend.', 'Una vicina ha dato loro un numero, e quella sera il nonno ha chiamato il suo amico.', 'Une voisine leur a donné un numéro, et ce soir-là, grand-père a appelé son ami.', 'Una vecina les dio un número, y esa noche el abuelo llamó a su amigo.', 'Դրացի մը անոնց հեռաձայնի թիւ մը տուաւ, եւ այդ իրիկուն մեծ հայրիկը իր բարեկամին հեռաձայնեց։'),
        ],
      },
    },
  },
  {
    id: 'street-festival', level: 4, color: '#E5484D', icon: 'restaurant',
    title: L('The Street Festival', 'La festa di quartiere', 'La fête du quartier', 'La fiesta del barrio', 'Թաղին տօնախմբութիւնը'),
    question: {
      prompt: 'Where did everyone eat in the end?',
      options: [
        L('In the school gym.', 'Nella palestra della scuola.', "Dans le gymnase de l'école.", 'En el gimnasio de la escuela.', 'Դպրոցին մարզարանին մէջ։'),
        L('Outside, under the open sky.', "Fuori, all'aperto.", 'Dehors, en plein air.', 'Fuera, al aire libre.', 'Դուրսը, բաց երկինքին տակ։'),
        L('In a restaurant downtown.', 'In un ristorante in centro.', 'Dans un restaurant du centre.', 'En un restaurante del centro.', 'Կեդրոնի ճաշարանի մը մէջ։'),
      ],
    },
    pages: {
      start: {
        scene: sc('#FFE3E3', '#D9A08A', 'restaurant', 'medkit'),
        lines: [
          L('Leo was organising a small food festival in his neighbourhood.', 'Leo stava organizzando una piccola festa del cibo nel suo quartiere.', 'Leo organisait une petite fête gourmande dans son quartier.', 'Leo estaba organizando una pequeña fiesta de comida en su barrio.', 'Լէօ իր թաղին մէջ պզտիկ ուտելիքի տօնախմբութիւն մը կը կազմակերպէր։'),
          L('Two days before, the cook got sick.', 'Due giorni prima, il cuoco si è ammalato.', 'Deux jours avant, le cuisinier est tombé malade.', 'Dos días antes, el cocinero se puso enfermo.', 'Երկու օր առաջ խոհարարը հիւանդացաւ։'),
        ],
        choices: [
          { label: L('Cook it all himself', 'Cucinare da solo', 'Cuisiner lui-même', 'Cocinar él mismo', 'Ինք եփել'), to: 'recipes' },
          { label: L('Ask the neighbours', 'Chiedere ai vicini', 'Demander aux voisins', 'Pedir ayuda a los vecinos', 'Դրացիներուն դիմել'), to: 'doors' },
        ],
      },
      recipes: {
        scene: sc('#FFF0D6', '#C9A26B', 'flame', 'moon'),
        lines: [
          L('Leo spent the whole night trying recipes.', 'Leo ha passato tutta la notte a provare ricette.', 'Leo a passé toute la nuit à essayer des recettes.', 'Leo pasó toda la noche probando recetas.', 'Լէօ ամբողջ գիշերը բաղադրատոմսեր փորձեց։'),
          L('The soup was too salty, but the bread came out perfect.', 'La zuppa era troppo salata, ma il pane è venuto perfetto.', 'La soupe était trop salée, mais le pain était parfait.', 'La sopa estaba demasiado salada, pero el pan salió perfecto.', 'Ապուրը շատ աղի էր, բայց հացը կատարեալ եղաւ։'),
        ],
        next: 'wind',
      },
      doors: {
        scene: sc('#E6F0FF', '#A9B4D0', 'home', 'people'),
        lines: [
          L('He knocked on every door in the street.', 'Ha bussato a ogni porta della strada.', 'Il a frappé à toutes les portes de la rue.', 'Llamó a todas las puertas de la calle.', 'Փողոցին բոլոր դռները զարկաւ։'),
          L('An old lady offered her famous rice, and a student offered to make dessert.', 'Una signora anziana ha offerto il suo famoso riso, e uno studente ha proposto di fare il dolce.', 'Une vieille dame a proposé son fameux riz, et un étudiant a proposé de faire le dessert.', 'Una señora mayor ofreció su famoso arroz, y un estudiante se ofreció a hacer el postre.', 'Տարեց տիկին մը իր հռչակաւոր բրինձը առաջարկեց, իսկ ուսանող մը առաջարկեց անուշեղէնը պատրաստել։'),
        ],
        next: 'wind',
      },
      wind: {
        scene: sc('#DCE4EE', '#9AA9B8', 'cloudy', 'warning'),
        lines: [
          L('On the day of the festival, a strong wind knocked over the tables.', 'Il giorno della festa, un vento forte ha rovesciato i tavoli.', 'Le jour de la fête, un vent fort a renversé les tables.', 'El día de la fiesta, un viento fuerte tiró las mesas.', 'Տօնախմբութեան օրը սաստիկ հով մը սեղանները տապալեց։'),
          L('The guests were already arriving.', 'Gli ospiti stavano già arrivando.', 'Les invités arrivaient déjà.', 'Los invitados ya estaban llegando.', 'Հիւրերը արդէն կու գային։'),
        ],
        choices: [
          { label: L('Move into the school', 'Spostarsi nella scuola', "Aller dans l'école", 'Ir a la escuela', 'Դպրոց փոխադրուիլ'), to: 'gym' },
          { label: L('Hold the tables and continue', 'Tenere i tavoli e continuare', 'Tenir les tables et continuer', 'Sujetar las mesas y seguir', 'Սեղանները բռնել ու շարունակել'), to: 'sky' },
        ],
      },
      gym: {
        scene: sc('#FFEFD6', '#E8B07A', 'basketball', 'happy'), answer: 0, endingTitle: 'Warm and crowded',
        lines: [
          L('They carried everything into the school gym.', 'Hanno portato tutto nella palestra della scuola.', "Ils ont tout porté dans le gymnase de l'école.", 'Llevaron todo al gimnasio de la escuela.', 'Ամէն ինչ դպրոցին մարզարանը տարին։'),
          L('It was crowded, but warm and full of laughter.', "C'era molta gente, ma era caldo e pieno di risate.", "Il y avait du monde, mais c'était chaleureux et plein de rires.", 'Había mucha gente, pero era cálido y lleno de risas.', 'Խճողուած էր, բայց տաք ու խնդուքով լեցուն։'),
        ],
      },
      sky: {
        scene: sc('#1E2B55', '#3C4A6E', 'moon', 'star', 'people'), answer: 1, endingTitle: 'Under the stars',
        lines: [
          L('Everyone held the tables together, and slowly the wind calmed down.', 'Tutti hanno tenuto i tavoli insieme, e piano piano il vento si è calmato.', 'Tout le monde a tenu les tables ensemble, et peu à peu le vent s\'est calmé.', 'Todos sujetaron las mesas juntos, y poco a poco el viento se calmó.', 'Բոլորը միասին սեղանները բռնեցին, եւ կամաց-կամաց հովը հանդարտեցաւ։'),
          L('They ate under the open sky until late at night.', "Hanno mangiato all'aperto fino a tarda notte.", "Ils ont mangé en plein air jusque tard dans la nuit.", 'Comieron al aire libre hasta muy tarde.', 'Մինչեւ ուշ գիշեր բաց երկինքին տակ կերան։'),
        ],
      },
    },
  },
  {
    id: 'storm-island', level: 5, color: '#0E7490', icon: 'boat',
    title: L('The Storm Island', "L'isola della tempesta", "L'île de la tempête", 'La isla de la tormenta', 'Փոթորիկին կղզին'),
    question: {
      prompt: 'How was Mara rescued?',
      options: [
        L('She swam, and the fishermen pulled her aboard.', 'Ha nuotato e i pescatori l\'hanno tirata a bordo.', "Elle a nagé et les pêcheurs l'ont hissée à bord.", 'Nadó y los pescadores la subieron a bordo.', 'Լողաց, եւ ձկնորսները զինք նաւակ բարձրացուցին։'),
        L('The fishermen saw her scarf signal.', 'I pescatori hanno visto il segnale della sciarpa.', 'Les pêcheurs ont vu le signal de son écharpe.', 'Los pescadores vieron la señal de su bufanda.', 'Ձկնորսները իր շալին նշանը տեսան։'),
        L('A helicopter found her at night.', "Un elicottero l'ha trovata di notte.", "Un hélicoptère l'a trouvée la nuit.", 'Un helicóptero la encontró de noche.', 'Ուղղաթիռ մը գիշերը զինք գտաւ։'),
      ],
    },
    pages: {
      start: {
        scene: sc('#B9C7D6', '#2E6E8E', 'thunderstorm', 'boat'),
        lines: [
          L('If she had known about the storm, Mara would never have taken the boat.', 'Se avesse saputo della tempesta, Mara non avrebbe mai preso la barca.', "Si elle avait su pour la tempête, Mara n'aurait jamais pris le bateau.", 'Si hubiera sabido lo de la tormenta, Mara nunca habría tomado el barco.', 'Եթէ փոթորիկին մասին գիտնար, Մարա երբեք նաւակը պիտի չառնէր։'),
          L('Now a small island was the only place she could reach.', "Ora una piccola isola era l'unico posto che poteva raggiungere.", "Maintenant, une petite île était le seul endroit qu'elle pouvait atteindre.", 'Ahora una pequeña isla era el único lugar al que podía llegar.', 'Հիմա պզտիկ կղզի մը միակ տեղն էր, ուր կրնար հասնիլ։'),
        ],
        choices: [
          { label: L('Look for shelter', 'Cercare un riparo', 'Chercher un abri', 'Buscar refugio', 'Ապաստան փնտռել'), to: 'lighthouse' },
          { label: L('Light a fire on the beach', 'Accendere un fuoco sulla spiaggia', 'Allumer un feu sur la plage', 'Encender un fuego en la playa', 'Ծովափին վրայ կրակ վառել'), to: 'fire' },
        ],
      },
      lighthouse: {
        scene: sc('#C8D3E0', '#7D8B99', 'flashlight', 'bed'),
        lines: [
          L('Behind the rocks, she discovered an abandoned lighthouse.', 'Dietro gli scogli, ha scoperto un faro abbandonato.', 'Derrière les rochers, elle a découvert un phare abandonné.', 'Detrás de las rocas, descubrió un faro abandonado.', 'Ժայռերուն ետեւ լքուած փարոս մը գտաւ։'),
          L('Inside, she found a dry blanket and slept a few hours.', 'Dentro, ha trovato una coperta asciutta e ha dormito qualche ora.', "À l'intérieur, elle a trouvé une couverture sèche et a dormi quelques heures.", 'Dentro, encontró una manta seca y durmió unas horas.', 'Ներսը չոր ծածկոց մը գտաւ ու քանի մը ժամ քնացաւ։'),
        ],
        next: 'dawn',
      },
      fire: {
        scene: sc('#3B3350', '#C9A26B', 'flame', 'cloud'),
        lines: [
          L('The fire was hard to light, because the wood was wet.', 'Il fuoco era difficile da accendere, perché la legna era bagnata.', 'Le feu était difficile à allumer, car le bois était mouillé.', 'Era difícil encender el fuego, porque la leña estaba mojada.', 'Կրակը վառելը դժուար էր, որովհետեւ փայտը թաց էր։'),
          L('After an hour, though, a thin column of smoke rose into the sky.', "Dopo un'ora, però, una sottile colonna di fumo è salita verso il cielo.", 'Après une heure, pourtant, une fine colonne de fumée est montée vers le ciel.', 'Sin embargo, después de una hora, una fina columna de humo subió al cielo.', 'Սակայն ժամ մը ետք բարակ ծուխի սիւն մը երկինք բարձրացաւ։'),
        ],
        next: 'dawn',
      },
      dawn: {
        scene: sc('#FFD9C2', '#3E8FB0', 'sunny', 'boat', 'eye'),
        lines: [
          L('At dawn the sea was calmer, and Mara noticed a fishing boat in the distance.', "All'alba il mare era più calmo, e Mara ha notato un peschereccio in lontananza.", "À l'aube, la mer était plus calme, et Mara a remarqué un bateau de pêche au loin.", 'Al amanecer el mar estaba más tranquilo, y Mara vio un barco pesquero a lo lejos.', 'Արշալոյսին ծովը աւելի հանդարտ էր, եւ Մարա հեռուն ձկնորսական նաւակ մը նշմարեց։'),
          L('She had to decide quickly.', 'Doveva decidere in fretta.', 'Elle devait décider vite.', 'Tenía que decidir rápido.', 'Պէտք էր արագ որոշէր։'),
        ],
        choices: [
          { label: L('Swim toward the boat', 'Nuotare verso la barca', 'Nager vers le bateau', 'Nadar hacia el barco', 'Դէպի նաւակը լողալ'), to: 'swim' },
          { label: L('Wave and wait', 'Fare segnali e aspettare', 'Faire des signes et attendre', 'Hacer señas y esperar', 'Ձեռքով նշան ընել ու սպասել'), to: 'wave' },
        ],
      },
      swim: {
        scene: sc('#CDEBFF', '#2F7FB5', 'water', 'boat', 'fish'), answer: 0, endingTitle: 'Brave and lucky',
        lines: [
          L('She swam until her arms hurt, and the fishermen pulled her aboard.', 'Ha nuotato finché le braccia le hanno fatto male, e i pescatori l\'hanno tirata a bordo.', "Elle a nagé jusqu'à avoir mal aux bras, et les pêcheurs l'ont hissée à bord.", 'Nadó hasta que le dolieron los brazos, y los pescadores la subieron a bordo.', 'Լողաց մինչեւ որ բազուկները ցաւեցան, եւ ձկնորսները զինք նաւակ բարձրացուցին։'),
          L('They told her she had been brave, but also very lucky.', 'Le hanno detto che era stata coraggiosa, ma anche molto fortunata.', "Ils lui ont dit qu'elle avait été courageuse, mais aussi très chanceuse.", 'Le dijeron que había sido valiente, pero también muy afortunada.', 'Անոր ըսին, որ քաջ եղած էր, բայց նաեւ շատ բախտաւոր։'),
        ],
      },
      wave: {
        scene: sc('#FFF1C2', '#3E8FB0', 'flag', 'boat', 'happy'), answer: 1, endingTitle: 'Signal seen',
        lines: [
          L('She waved her yellow scarf for a long time.', 'Ha agitato a lungo la sua sciarpa gialla.', 'Elle a agité longtemps son écharpe jaune.', 'Agitó su bufanda amarilla durante mucho tiempo.', 'Երկար ատեն իր դեղին շալը թափահարեց։'),
          L('Finally the boat turned, and an old fisherman shouted that they had seen her signal.', 'Alla fine la barca ha girato, e un vecchio pescatore ha gridato che avevano visto il suo segnale.', "Enfin, le bateau a tourné, et un vieux pêcheur a crié qu'ils avaient vu son signal.", 'Por fin el barco giró, y un viejo pescador gritó que habían visto su señal.', 'Վերջապէս նաւակը դարձաւ, եւ ծեր ձկնորս մը պոռաց, որ իր նշանը տեսած էին։'),
        ],
      },
    },
  },
];

export const STORY_LEVEL_LABEL = ['', 'Starter', 'Explorer', 'Traveler', 'Adventurer', 'Storyteller'];
