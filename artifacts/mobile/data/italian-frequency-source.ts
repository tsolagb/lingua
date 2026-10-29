/**
 * Ranked Italian-English vocabulary entries adapted from Strommen Inc.'s public
 * 1,000 most common Italian words list. The source contains repeated rank values
 * and its glosses are not independently verified; keep them pending review.
 * Source: https://strommeninc.com/1000-most-common-italian-words-frequency-vocabulary-using-the-80-20-principle/
 */
export interface ItalianFrequencySourceEntry {
  rank: number;
  english: string;
  italian: string;
}

export const ITALIAN_FREQUENCY_SOURCE: readonly ItalianFrequencySourceEntry[] = [
  {
    "rank": 1,
    "english": "I am",
    "italian": "sono"
  },
  {
    "rank": 2,
    "english": "I",
    "italian": "io"
  },
  {
    "rank": 3,
    "english": "his",
    "italian": "il suo"
  },
  {
    "rank": 4,
    "english": "that",
    "italian": "che"
  },
  {
    "rank": 5,
    "english": "he",
    "italian": "lui"
  },
  {
    "rank": 6,
    "english": "he/she was",
    "italian": "era"
  },
  {
    "rank": 7,
    "english": "for",
    "italian": "per"
  },
  {
    "rank": 8,
    "english": "on",
    "italian": "su"
  },
  {
    "rank": 9,
    "english": "as/like",
    "italian": "come"
  },
  {
    "rank": 10,
    "english": "with",
    "italian": "con"
  },
  {
    "rank": 11,
    "english": "they",
    "italian": "loro"
  },
  {
    "rank": 12,
    "english": "to be",
    "italian": "essere"
  },
  {
    "rank": 13,
    "english": "at",
    "italian": "a"
  },
  {
    "rank": 14,
    "english": "one",
    "italian": "uno"
  },
  {
    "rank": 15,
    "english": "to have",
    "italian": "avere"
  },
  {
    "rank": 16,
    "english": "this",
    "italian": "questo"
  },
  {
    "rank": 17,
    "english": "from",
    "italian": "da"
  },
  {
    "rank": 18,
    "english": "by",
    "italian": "di"
  },
  {
    "rank": 19,
    "english": "hot",
    "italian": "caldo"
  },
  {
    "rank": 20,
    "english": "word",
    "italian": "parola"
  },
  {
    "rank": 21,
    "english": "but",
    "italian": "ma"
  },
  {
    "rank": 22,
    "english": "what",
    "italian": "cosa"
  },
  {
    "rank": 23,
    "english": "some",
    "italian": "alcuni"
  },
  {
    "rank": 24,
    "english": "is",
    "italian": "è"
  },
  {
    "rank": 25,
    "english": "that",
    "italian": "quello"
  },
  {
    "rank": 26,
    "english": "you (pl)",
    "italian": "voi"
  },
  {
    "rank": 27,
    "english": "or",
    "italian": "o"
  },
  {
    "rank": 28,
    "english": "had",
    "italian": "aveva"
  },
  {
    "rank": 29,
    "english": "the",
    "italian": "il"
  },
  {
    "rank": 30,
    "english": "of",
    "italian": "di"
  },
  {
    "rank": 31,
    "english": "to",
    "italian": "a"
  },
  {
    "rank": 32,
    "english": "and",
    "italian": "e"
  },
  {
    "rank": 33,
    "english": "a",
    "italian": "un"
  },
  {
    "rank": 34,
    "english": "in",
    "italian": "in"
  },
  {
    "rank": 35,
    "english": "we",
    "italian": "noi"
  },
  {
    "rank": 36,
    "english": "can (of soda)",
    "italian": "lattina"
  },
  {
    "rank": 37,
    "english": "out",
    "italian": "fuori"
  },
  {
    "rank": 38,
    "english": "other",
    "italian": "altro"
  },
  {
    "rank": 39,
    "english": "were",
    "italian": "erano"
  },
  {
    "rank": 40,
    "english": "which",
    "italian": "che / quale"
  },
  {
    "rank": 41,
    "english": "to do/make",
    "italian": "fare"
  },
  {
    "rank": 42,
    "english": "their",
    "italian": "loro"
  },
  {
    "rank": 43,
    "english": "time",
    "italian": "tempo"
  },
  {
    "rank": 44,
    "english": "if",
    "italian": "se"
  },
  {
    "rank": 45,
    "english": "will",
    "italian": "volontà"
  },
  {
    "rank": 46,
    "english": "how",
    "italian": "come"
  },
  {
    "rank": 47,
    "english": "said",
    "italian": "detto"
  },
  {
    "rank": 48,
    "english": "an",
    "italian": "un"
  },
  {
    "rank": 49,
    "english": "each",
    "italian": "ogni"
  },
  {
    "rank": 50,
    "english": "tell",
    "italian": "dire"
  },
  {
    "rank": 51,
    "english": "does",
    "italian": "fa"
  },
  {
    "rank": 52,
    "english": "set (unchanging)",
    "italian": "fisso"
  },
  {
    "rank": 53,
    "english": "three",
    "italian": "tre"
  },
  {
    "rank": 54,
    "english": "desire",
    "italian": "desiderare"
  },
  {
    "rank": 55,
    "english": "air",
    "italian": "aria"
  },
  {
    "rank": 56,
    "english": "well",
    "italian": "bene"
  },
  {
    "rank": 57,
    "english": "also",
    "italian": "anche"
  },
  {
    "rank": 58,
    "english": "play",
    "italian": "giocare"
  },
  {
    "rank": 59,
    "english": "small",
    "italian": "piccolo"
  },
  {
    "rank": 60,
    "english": "end",
    "italian": "fine"
  },
  {
    "rank": 61,
    "english": "put",
    "italian": "mettere"
  },
  {
    "rank": 62,
    "english": "home",
    "italian": "casa"
  },
  {
    "rank": 63,
    "english": "read",
    "italian": "leggere"
  },
  {
    "rank": 64,
    "english": "hand",
    "italian": "mano"
  },
  {
    "rank": 65,
    "english": "carry",
    "italian": "portare"
  },
  {
    "rank": 66,
    "english": "large",
    "italian": "grande"
  },
  {
    "rank": 67,
    "english": "spell (words)",
    "italian": "compitare"
  },
  {
    "rank": 68,
    "english": "add",
    "italian": "aggiungere"
  },
  {
    "rank": 69,
    "english": "even/also",
    "italian": "anche"
  },
  {
    "rank": 70,
    "english": "land",
    "italian": "terra"
  },
  {
    "rank": 71,
    "english": "here",
    "italian": "qui"
  },
  {
    "rank": 72,
    "english": "I must",
    "italian": "devo"
  },
  {
    "rank": 73,
    "english": "big",
    "italian": "grande"
  },
  {
    "rank": 74,
    "english": "high/tall",
    "italian": "alto"
  },
  {
    "rank": 75,
    "english": "such",
    "italian": "tale"
  },
  {
    "rank": 76,
    "english": "follow",
    "italian": "seguire"
  },
  {
    "rank": 77,
    "english": "an act",
    "italian": "atto"
  },
  {
    "rank": 78,
    "english": "why",
    "italian": "perché"
  },
  {
    "rank": 79,
    "english": "ask",
    "italian": "chiedere"
  },
  {
    "rank": 80,
    "english": "men",
    "italian": "maschi"
  },
  {
    "rank": 81,
    "english": "a change",
    "italian": "cambiamento"
  },
  {
    "rank": 82,
    "english": "he/she went",
    "italian": "è andato"
  },
  {
    "rank": 83,
    "english": "light",
    "italian": "luce"
  },
  {
    "rank": 84,
    "english": "kind (of thing)",
    "italian": "tipo"
  },
  {
    "rank": 85,
    "english": "turned off",
    "italian": "spento"
  },
  {
    "rank": 86,
    "english": "need",
    "italian": "bisogno"
  },
  {
    "rank": 87,
    "english": "house",
    "italian": "casa"
  },
  {
    "rank": 88,
    "english": "image",
    "italian": "immagine"
  },
  {
    "rank": 89,
    "english": "try",
    "italian": "provare"
  },
  {
    "rank": 90,
    "english": "us",
    "italian": "noi"
  },
  {
    "rank": 91,
    "english": "again",
    "italian": "di nuovo"
  },
  {
    "rank": 92,
    "english": "animal",
    "italian": "animale"
  },
  {
    "rank": 93,
    "english": "point",
    "italian": "punto"
  },
  {
    "rank": 94,
    "english": "mother",
    "italian": "madre"
  },
  {
    "rank": 95,
    "english": "world",
    "italian": "mondo"
  },
  {
    "rank": 96,
    "english": "near",
    "italian": "vicino"
  },
  {
    "rank": 97,
    "english": "build",
    "italian": "costruire"
  },
  {
    "rank": 98,
    "english": "himself",
    "italian": "se stesso"
  },
  {
    "rank": 99,
    "english": "earth",
    "italian": "terra"
  },
  {
    "rank": 100,
    "english": "father",
    "italian": "padre"
  },
  {
    "rank": 101,
    "english": "any",
    "italian": "qualsiasi"
  },
  {
    "rank": 102,
    "english": "new",
    "italian": "nuovo"
  },
  {
    "rank": 103,
    "english": "work",
    "italian": "lavoro"
  },
  {
    "rank": 104,
    "english": "part",
    "italian": "parte"
  },
  {
    "rank": 105,
    "english": "take",
    "italian": "prendere"
  },
  {
    "rank": 106,
    "english": "get",
    "italian": "ottenere"
  },
  {
    "rank": 107,
    "english": "place",
    "italian": "posto"
  },
  {
    "rank": 108,
    "english": "made",
    "italian": "fatto"
  },
  {
    "rank": 109,
    "english": "live",
    "italian": "vivere"
  },
  {
    "rank": 110,
    "english": "where",
    "italian": "dove"
  },
  {
    "rank": 111,
    "english": "after",
    "italian": "dopo"
  },
  {
    "rank": 112,
    "english": "back",
    "italian": "indietro"
  },
  {
    "rank": 113,
    "english": "little",
    "italian": "poco"
  },
  {
    "rank": 114,
    "english": "only",
    "italian": "solo"
  },
  {
    "rank": 115,
    "english": "round",
    "italian": "turno"
  },
  {
    "rank": 116,
    "english": "man",
    "italian": "uomo"
  },
  {
    "rank": 117,
    "english": "year",
    "italian": "anno"
  },
  {
    "rank": 118,
    "english": "came",
    "italian": "è venuto"
  },
  {
    "rank": 119,
    "english": "show",
    "italian": "spettacolo"
  },
  {
    "rank": 120,
    "english": "every",
    "italian": "ogni"
  },
  {
    "rank": 121,
    "english": "good",
    "italian": "buono"
  },
  {
    "rank": 122,
    "english": "me",
    "italian": "me"
  },
  {
    "rank": 123,
    "english": "give",
    "italian": "dare"
  },
  {
    "rank": 124,
    "english": "our",
    "italian": "il nostro"
  },
  {
    "rank": 125,
    "english": "under",
    "italian": "sotto"
  },
  {
    "rank": 126,
    "english": "name",
    "italian": "nome"
  },
  {
    "rank": 127,
    "english": "very",
    "italian": "molto"
  },
  {
    "rank": 128,
    "english": "through",
    "italian": "attraverso"
  },
  {
    "rank": 129,
    "english": "just",
    "italian": "solo"
  },
  {
    "rank": 130,
    "english": "form",
    "italian": "forma"
  },
  {
    "rank": 131,
    "english": "sentence",
    "italian": "frase"
  },
  {
    "rank": 132,
    "english": "great",
    "italian": "grande"
  },
  {
    "rank": 133,
    "english": "think",
    "italian": "pensare"
  },
  {
    "rank": 134,
    "english": "say",
    "italian": "dire"
  },
  {
    "rank": 135,
    "english": "help",
    "italian": "aiutare"
  },
  {
    "rank": 136,
    "english": "low",
    "italian": "basso"
  },
  {
    "rank": 137,
    "english": "line",
    "italian": "linea"
  },
  {
    "rank": 138,
    "english": "differ",
    "italian": "differire"
  },
  {
    "rank": 139,
    "english": "turn",
    "italian": "turno"
  },
  {
    "rank": 140,
    "english": "cause",
    "italian": "causa"
  },
  {
    "rank": 141,
    "english": "much",
    "italian": "molto"
  },
  {
    "rank": 142,
    "english": "mean",
    "italian": "dire"
  },
  {
    "rank": 143,
    "english": "before",
    "italian": "prima"
  },
  {
    "rank": 144,
    "english": "move",
    "italian": "spostare"
  },
  {
    "rank": 145,
    "english": "right",
    "italian": "diritto"
  },
  {
    "rank": 146,
    "english": "boy",
    "italian": "ragazzo"
  },
  {
    "rank": 147,
    "english": "old",
    "italian": "vecchio"
  },
  {
    "rank": 148,
    "english": "too",
    "italian": "troppo"
  },
  {
    "rank": 149,
    "english": "same",
    "italian": "stesso"
  },
  {
    "rank": 150,
    "english": "she",
    "italian": "lei"
  },
  {
    "rank": 151,
    "english": "all",
    "italian": "tutto"
  },
  {
    "rank": 152,
    "english": "there",
    "italian": "ci"
  },
  {
    "rank": 153,
    "english": "when",
    "italian": "quando"
  },
  {
    "rank": 154,
    "english": "up",
    "italian": "su"
  },
  {
    "rank": 155,
    "english": "use",
    "italian": "uso"
  },
  {
    "rank": 156,
    "english": "your",
    "italian": "il tuo"
  },
  {
    "rank": 157,
    "english": "way",
    "italian": "modo"
  },
  {
    "rank": 158,
    "english": "about",
    "italian": "circa"
  },
  {
    "rank": 159,
    "english": "many",
    "italian": "molti"
  },
  {
    "rank": 160,
    "english": "then",
    "italian": "allora"
  },
  {
    "rank": 161,
    "english": "them",
    "italian": "loro"
  },
  {
    "rank": 162,
    "english": "write",
    "italian": "scrivere"
  },
  {
    "rank": 163,
    "english": "would",
    "italian": "sarebbe"
  },
  {
    "rank": 164,
    "english": "like",
    "italian": "come"
  },
  {
    "rank": 165,
    "english": "so",
    "italian": "così"
  },
  {
    "rank": 166,
    "english": "these",
    "italian": "queste"
  },
  {
    "rank": 167,
    "english": "her",
    "italian": "lei"
  },
  {
    "rank": 168,
    "english": "long",
    "italian": "lungo"
  },
  {
    "rank": 169,
    "english": "make",
    "italian": "rendere"
  },
  {
    "rank": 170,
    "english": "thing",
    "italian": "cosa"
  },
  {
    "rank": 171,
    "english": "see",
    "italian": "vedere"
  },
  {
    "rank": 172,
    "english": "him",
    "italian": "lui"
  },
  {
    "rank": 173,
    "english": "two",
    "italian": "due"
  },
  {
    "rank": 174,
    "english": "has",
    "italian": "ha"
  },
  {
    "rank": 175,
    "english": "look",
    "italian": "guardare"
  },
  {
    "rank": 176,
    "english": "more",
    "italian": "di più"
  },
  {
    "rank": 177,
    "english": "day",
    "italian": "giorno"
  },
  {
    "rank": 178,
    "english": "could",
    "italian": "potuto"
  },
  {
    "rank": 179,
    "english": "go",
    "italian": "andare"
  },
  {
    "rank": 180,
    "english": "come",
    "italian": "venire"
  },
  {
    "rank": 181,
    "english": "did",
    "italian": "ha fatto"
  },
  {
    "rank": 182,
    "english": "number",
    "italian": "numero"
  },
  {
    "rank": 183,
    "english": "sound",
    "italian": "suono"
  },
  {
    "rank": 184,
    "english": "no",
    "italian": "no"
  },
  {
    "rank": 185,
    "english": "most",
    "italian": "più"
  },
  {
    "rank": 186,
    "english": "people",
    "italian": "persone"
  },
  {
    "rank": 187,
    "english": "my",
    "italian": "il mio"
  },
  {
    "rank": 188,
    "english": "over",
    "italian": "oltre"
  },
  {
    "rank": 189,
    "english": "know",
    "italian": "sapere"
  },
  {
    "rank": 190,
    "english": "water",
    "italian": "acqua"
  },
  {
    "rank": 191,
    "english": "than",
    "italian": "di"
  },
  {
    "rank": 192,
    "english": "call",
    "italian": "chiamata"
  },
  {
    "rank": 193,
    "english": "first",
    "italian": "primo"
  },
  {
    "rank": 194,
    "english": "who",
    "italian": "che"
  },
  {
    "rank": 195,
    "english": "may",
    "italian": "può"
  },
  {
    "rank": 196,
    "english": "down",
    "italian": "giù"
  },
  {
    "rank": 197,
    "english": "side",
    "italian": "lato"
  },
  {
    "rank": 198,
    "english": "been",
    "italian": "stato"
  },
  {
    "rank": 199,
    "english": "now",
    "italian": "ora"
  },
  {
    "rank": 200,
    "english": "find",
    "italian": "trovare"
  },
  {
    "rank": 201,
    "english": "head",
    "italian": "testa"
  },
  {
    "rank": 202,
    "english": "stand",
    "italian": "stare in piedi"
  },
  {
    "rank": 203,
    "english": "own",
    "italian": "proprio"
  },
  {
    "rank": 204,
    "english": "page",
    "italian": "pagina"
  },
  {
    "rank": 205,
    "english": "should",
    "italian": "dovrebbe"
  },
  {
    "rank": 206,
    "english": "country",
    "italian": "paese"
  },
  {
    "rank": 207,
    "english": "found",
    "italian": "fondare"
  },
  {
    "rank": 208,
    "english": "answer",
    "italian": "risposta"
  },
  {
    "rank": 209,
    "english": "school",
    "italian": "scuola"
  },
  {
    "rank": 210,
    "english": "grow",
    "italian": "crescere"
  },
  {
    "rank": 211,
    "english": "study",
    "italian": "studio"
  },
  {
    "rank": 212,
    "english": "still",
    "italian": "ancora"
  },
  {
    "rank": 213,
    "english": "learn",
    "italian": "imparare"
  },
  {
    "rank": 214,
    "english": "plant",
    "italian": "impianto"
  },
  {
    "rank": 215,
    "english": "cover",
    "italian": "copertura"
  },
  {
    "rank": 216,
    "english": "food",
    "italian": "cibo"
  },
  {
    "rank": 217,
    "english": "sun",
    "italian": "sole"
  },
  {
    "rank": 218,
    "english": "four",
    "italian": "quattro"
  },
  {
    "rank": 219,
    "english": "between",
    "italian": "fra"
  },
  {
    "rank": 220,
    "english": "state",
    "italian": "stato"
  },
  {
    "rank": 221,
    "english": "keep",
    "italian": "mantenere"
  },
  {
    "rank": 222,
    "english": "eye",
    "italian": "occhio"
  },
  {
    "rank": 223,
    "english": "never",
    "italian": "mai"
  },
  {
    "rank": 224,
    "english": "last",
    "italian": "ultimo"
  },
  {
    "rank": 225,
    "english": "let",
    "italian": "lasciare"
  },
  {
    "rank": 226,
    "english": "thought",
    "italian": "pensiero"
  },
  {
    "rank": 227,
    "english": "city",
    "italian": "città"
  },
  {
    "rank": 228,
    "english": "tree",
    "italian": "albero"
  },
  {
    "rank": 229,
    "english": "cross",
    "italian": "attraversare"
  },
  {
    "rank": 230,
    "english": "farm",
    "italian": "fattoria"
  },
  {
    "rank": 231,
    "english": "hard",
    "italian": "difficile"
  },
  {
    "rank": 232,
    "english": "start",
    "italian": "inizio"
  },
  {
    "rank": 233,
    "english": "might",
    "italian": "forza"
  },
  {
    "rank": 234,
    "english": "story",
    "italian": "storia"
  },
  {
    "rank": 235,
    "english": "saw",
    "italian": "sega"
  },
  {
    "rank": 236,
    "english": "far",
    "italian": "lontano"
  },
  {
    "rank": 237,
    "english": "sea",
    "italian": "mare"
  },
  {
    "rank": 238,
    "english": "draw",
    "italian": "disegnare"
  },
  {
    "rank": 239,
    "english": "left",
    "italian": "sinistra"
  },
  {
    "rank": 240,
    "english": "late",
    "italian": "tardi"
  },
  {
    "rank": 241,
    "english": "run",
    "italian": "run"
  },
  {
    "rank": 242,
    "english": "don’t",
    "italian": "non"
  },
  {
    "rank": 243,
    "english": "while",
    "italian": "mentre"
  },
  {
    "rank": 244,
    "english": "press",
    "italian": "stampa"
  },
  {
    "rank": 245,
    "english": "close",
    "italian": "close"
  },
  {
    "rank": 246,
    "english": "night",
    "italian": "notte"
  },
  {
    "rank": 247,
    "english": "real",
    "italian": "reale"
  },
  {
    "rank": 248,
    "english": "life",
    "italian": "vita"
  },
  {
    "rank": 249,
    "english": "few",
    "italian": "pochi"
  },
  {
    "rank": 250,
    "english": "north",
    "italian": "nord"
  },
  {
    "rank": 251,
    "english": "book",
    "italian": "libro"
  },
  {
    "rank": 252,
    "english": "carry",
    "italian": "portare"
  },
  {
    "rank": 253,
    "english": "took",
    "italian": "ha preso"
  },
  {
    "rank": 254,
    "english": "science",
    "italian": "scienza"
  },
  {
    "rank": 255,
    "english": "eat",
    "italian": "mangiare"
  },
  {
    "rank": 256,
    "english": "room",
    "italian": "camera"
  },
  {
    "rank": 257,
    "english": "friend",
    "italian": "amico"
  },
  {
    "rank": 258,
    "english": "began",
    "italian": "ha iniziato"
  },
  {
    "rank": 259,
    "english": "idea",
    "italian": "idea"
  },
  {
    "rank": 260,
    "english": "fish",
    "italian": "pesce"
  },
  {
    "rank": 261,
    "english": "mountain",
    "italian": "montagna"
  },
  {
    "rank": 262,
    "english": "stop",
    "italian": "stop"
  },
  {
    "rank": 263,
    "english": "once",
    "italian": "una volta"
  },
  {
    "rank": 264,
    "english": "base",
    "italian": "base"
  },
  {
    "rank": 265,
    "english": "hear",
    "italian": "sentire"
  },
  {
    "rank": 266,
    "english": "horse",
    "italian": "cavallo"
  },
  {
    "rank": 267,
    "english": "cut",
    "italian": "taglio"
  },
  {
    "rank": 268,
    "english": "sure",
    "italian": "sicuro"
  },
  {
    "rank": 269,
    "english": "watch",
    "italian": "orologio"
  },
  {
    "rank": 270,
    "english": "color",
    "italian": "colore"
  },
  {
    "rank": 271,
    "english": "face",
    "italian": "volto"
  },
  {
    "rank": 272,
    "english": "wood",
    "italian": "legno"
  },
  {
    "rank": 273,
    "english": "main",
    "italian": "principale"
  },
  {
    "rank": 274,
    "english": "open",
    "italian": "aperto"
  },
  {
    "rank": 275,
    "english": "seem",
    "italian": "sembrare"
  },
  {
    "rank": 276,
    "english": "together",
    "italian": "insieme"
  },
  {
    "rank": 277,
    "english": "next",
    "italian": "prossimo"
  },
  {
    "rank": 278,
    "english": "white",
    "italian": "bianco"
  },
  {
    "rank": 279,
    "english": "children",
    "italian": "bambini"
  },
  {
    "rank": 280,
    "english": "begin",
    "italian": "inizio"
  },
  {
    "rank": 281,
    "english": "got",
    "italian": "ottenuto"
  },
  {
    "rank": 282,
    "english": "walk",
    "italian": "camminare"
  },
  {
    "rank": 283,
    "english": "example",
    "italian": "esempio"
  },
  {
    "rank": 284,
    "english": "ease",
    "italian": "alleviare"
  },
  {
    "rank": 284,
    "english": "sight",
    "italian": "vista"
  },
  {
    "rank": 285,
    "english": "paper",
    "italian": "carta"
  },
  {
    "rank": 286,
    "english": "group",
    "italian": "gruppo"
  },
  {
    "rank": 287,
    "english": "always",
    "italian": "sempre"
  },
  {
    "rank": 288,
    "english": "music",
    "italian": "musica"
  },
  {
    "rank": 289,
    "english": "those",
    "italian": "quelli"
  },
  {
    "rank": 290,
    "english": "both",
    "italian": "entrambi"
  },
  {
    "rank": 291,
    "english": "mark",
    "italian": "marchio"
  },
  {
    "rank": 292,
    "english": "often",
    "italian": "spesso"
  },
  {
    "rank": 293,
    "english": "letter",
    "italian": "lettera"
  },
  {
    "rank": 294,
    "english": "until",
    "italian": "fino a quando"
  },
  {
    "rank": 295,
    "english": "mile",
    "italian": "miglio"
  },
  {
    "rank": 296,
    "english": "river",
    "italian": "fiume"
  },
  {
    "rank": 297,
    "english": "car",
    "italian": "auto"
  },
  {
    "rank": 298,
    "english": "feet",
    "italian": "piedi"
  },
  {
    "rank": 299,
    "english": "care",
    "italian": "cura"
  },
  {
    "rank": 300,
    "english": "second",
    "italian": "secondo"
  },
  {
    "rank": 301,
    "english": "enough",
    "italian": "abbastanza"
  },
  {
    "rank": 302,
    "english": "plain",
    "italian": "pianura"
  },
  {
    "rank": 303,
    "english": "girl",
    "italian": "ragazza"
  },
  {
    "rank": 304,
    "english": "usual",
    "italian": "solito"
  },
  {
    "rank": 305,
    "english": "young",
    "italian": "giovane"
  },
  {
    "rank": 306,
    "english": "ready",
    "italian": "pronto"
  },
  {
    "rank": 307,
    "english": "above",
    "italian": "sopra"
  },
  {
    "rank": 308,
    "english": "ever",
    "italian": "mai"
  },
  {
    "rank": 309,
    "english": "red",
    "italian": "rosso"
  },
  {
    "rank": 310,
    "english": "list",
    "italian": "elenco"
  },
  {
    "rank": 311,
    "english": "though",
    "italian": "anche se"
  },
  {
    "rank": 312,
    "english": "feel",
    "italian": "sentire"
  },
  {
    "rank": 313,
    "english": "talk",
    "italian": "Discussioni"
  },
  {
    "rank": 314,
    "english": "bird",
    "italian": "uccello"
  },
  {
    "rank": 315,
    "english": "soon",
    "italian": "presto"
  },
  {
    "rank": 316,
    "english": "body",
    "italian": "corpo"
  },
  {
    "rank": 317,
    "english": "dog",
    "italian": "cane"
  },
  {
    "rank": 318,
    "english": "family",
    "italian": "famiglia"
  },
  {
    "rank": 319,
    "english": "direct",
    "italian": "diretto"
  },
  {
    "rank": 320,
    "english": "pose",
    "italian": "posa"
  },
  {
    "rank": 321,
    "english": "leave",
    "italian": "lasciare"
  },
  {
    "rank": 322,
    "english": "song",
    "italian": "canzone"
  },
  {
    "rank": 323,
    "english": "measure",
    "italian": "misurare"
  },
  {
    "rank": 324,
    "english": "door",
    "italian": "porta"
  },
  {
    "rank": 325,
    "english": "product",
    "italian": "prodotto"
  },
  {
    "rank": 326,
    "english": "black",
    "italian": "nero"
  },
  {
    "rank": 327,
    "english": "short",
    "italian": "breve"
  },
  {
    "rank": 328,
    "english": "numeral",
    "italian": "numerale"
  },
  {
    "rank": 329,
    "english": "class",
    "italian": "classe"
  },
  {
    "rank": 330,
    "english": "wind",
    "italian": "vento"
  },
  {
    "rank": 331,
    "english": "question",
    "italian": "domanda"
  },
  {
    "rank": 332,
    "english": "happen",
    "italian": "accadere"
  },
  {
    "rank": 333,
    "english": "complete",
    "italian": "integrale"
  },
  {
    "rank": 334,
    "english": "ship",
    "italian": "nave"
  },
  {
    "rank": 335,
    "english": "area",
    "italian": "area"
  },
  {
    "rank": 336,
    "english": "half",
    "italian": "metà"
  },
  {
    "rank": 337,
    "english": "rock",
    "italian": "rock"
  },
  {
    "rank": 338,
    "english": "order",
    "italian": "ordine"
  },
  {
    "rank": 339,
    "english": "fire",
    "italian": "fuoco"
  },
  {
    "rank": 340,
    "english": "south",
    "italian": "sud"
  },
  {
    "rank": 341,
    "english": "problem",
    "italian": "problema"
  },
  {
    "rank": 342,
    "english": "piece",
    "italian": "pezzo"
  },
  {
    "rank": 343,
    "english": "told",
    "italian": "ha detto"
  },
  {
    "rank": 344,
    "english": "knew",
    "italian": "sapeva"
  },
  {
    "rank": 345,
    "english": "pass",
    "italian": "passare"
  },
  {
    "rank": 346,
    "english": "since",
    "italian": "da"
  },
  {
    "rank": 347,
    "english": "top",
    "italian": "top"
  },
  {
    "rank": 348,
    "english": "whole",
    "italian": "tutto"
  },
  {
    "rank": 349,
    "english": "king",
    "italian": "re"
  },
  {
    "rank": 350,
    "english": "street",
    "italian": "strada"
  },
  {
    "rank": 351,
    "english": "inch",
    "italian": "pollice"
  },
  {
    "rank": 352,
    "english": "multiply",
    "italian": "moltiplicare"
  },
  {
    "rank": 353,
    "english": "nothing",
    "italian": "niente"
  },
  {
    "rank": 354,
    "english": "course",
    "italian": "corso"
  },
  {
    "rank": 355,
    "english": "stay",
    "italian": "soggiornare"
  },
  {
    "rank": 356,
    "english": "wheel",
    "italian": "ruota"
  },
  {
    "rank": 357,
    "english": "full",
    "italian": "completo"
  },
  {
    "rank": 358,
    "english": "force",
    "italian": "vigore"
  },
  {
    "rank": 359,
    "english": "blue",
    "italian": "blu"
  },
  {
    "rank": 360,
    "english": "object",
    "italian": "oggetto"
  },
  {
    "rank": 361,
    "english": "decide",
    "italian": "decidere"
  },
  {
    "rank": 362,
    "english": "surface",
    "italian": "superficie"
  },
  {
    "rank": 363,
    "english": "deep",
    "italian": "profondità"
  },
  {
    "rank": 364,
    "english": "moon",
    "italian": "luna"
  },
  {
    "rank": 365,
    "english": "island",
    "italian": "isola"
  },
  {
    "rank": 366,
    "english": "foot",
    "italian": "piede"
  },
  {
    "rank": 367,
    "english": "system",
    "italian": "sistema"
  },
  {
    "rank": 368,
    "english": "busy",
    "italian": "occupato"
  },
  {
    "rank": 369,
    "english": "test",
    "italian": "test"
  },
  {
    "rank": 370,
    "english": "record",
    "italian": "record"
  },
  {
    "rank": 371,
    "english": "boat",
    "italian": "barca"
  },
  {
    "rank": 372,
    "english": "common",
    "italian": "comune"
  },
  {
    "rank": 373,
    "english": "gold",
    "italian": "oro"
  },
  {
    "rank": 374,
    "english": "possible",
    "italian": "possibile"
  },
  {
    "rank": 375,
    "english": "plane",
    "italian": "piano"
  },
  {
    "rank": 376,
    "english": "stead",
    "italian": "vece"
  },
  {
    "rank": 377,
    "english": "dry",
    "italian": "asciutto"
  },
  {
    "rank": 378,
    "english": "wonder",
    "italian": "meraviglia"
  },
  {
    "rank": 379,
    "english": "laugh",
    "italian": "ridere"
  },
  {
    "rank": 380,
    "english": "thousand",
    "italian": "migliaia"
  },
  {
    "rank": 381,
    "english": "ago",
    "italian": "fa"
  },
  {
    "rank": 382,
    "english": "ran",
    "italian": "corse"
  },
  {
    "rank": 383,
    "english": "check",
    "italian": "controllare"
  },
  {
    "rank": 384,
    "english": "game",
    "italian": "gioco"
  },
  {
    "rank": 385,
    "english": "shape",
    "italian": "forma"
  },
  {
    "rank": 386,
    "english": "equate",
    "italian": "uguagliare"
  },
  {
    "rank": 387,
    "english": "hot",
    "italian": "caldo"
  },
  {
    "rank": 388,
    "english": "miss",
    "italian": "perdere"
  },
  {
    "rank": 389,
    "english": "brought",
    "italian": "portato"
  },
  {
    "rank": 390,
    "english": "heat",
    "italian": "calore"
  },
  {
    "rank": 391,
    "english": "snow",
    "italian": "neve"
  },
  {
    "rank": 392,
    "english": "tire",
    "italian": "pneumatico"
  },
  {
    "rank": 393,
    "english": "bring",
    "italian": "portare"
  },
  {
    "rank": 394,
    "english": "yes",
    "italian": "sì"
  },
  {
    "rank": 395,
    "english": "distant",
    "italian": "lontano"
  },
  {
    "rank": 396,
    "english": "fill",
    "italian": "riempire"
  },
  {
    "rank": 397,
    "english": "east",
    "italian": "est"
  },
  {
    "rank": 398,
    "english": "paint",
    "italian": "dipingere"
  },
  {
    "rank": 399,
    "english": "language",
    "italian": "lingua"
  },
  {
    "rank": 400,
    "english": "among",
    "italian": "tra"
  },
  {
    "rank": 401,
    "english": "unit",
    "italian": "unità"
  },
  {
    "rank": 402,
    "english": "power",
    "italian": "potenza"
  },
  {
    "rank": 403,
    "english": "town",
    "italian": "città"
  },
  {
    "rank": 404,
    "english": "fine",
    "italian": "fine"
  },
  {
    "rank": 405,
    "english": "certain",
    "italian": "certo"
  },
  {
    "rank": 406,
    "english": "fly",
    "italian": "volare"
  },
  {
    "rank": 407,
    "english": "fall",
    "italian": "cadere"
  },
  {
    "rank": 408,
    "english": "lead",
    "italian": "portare"
  },
  {
    "rank": 409,
    "english": "cry",
    "italian": "grido"
  },
  {
    "rank": 410,
    "english": "dark",
    "italian": "scuro"
  },
  {
    "rank": 411,
    "english": "machine",
    "italian": "macchina"
  },
  {
    "rank": 412,
    "english": "note",
    "italian": "nota"
  },
  {
    "rank": 413,
    "english": "wait",
    "italian": "aspettare"
  },
  {
    "rank": 414,
    "english": "plan",
    "italian": "piano"
  },
  {
    "rank": 415,
    "english": "figure",
    "italian": "figura"
  },
  {
    "rank": 416,
    "english": "star",
    "italian": "stella"
  },
  {
    "rank": 417,
    "english": "box",
    "italian": "scatola"
  },
  {
    "rank": 418,
    "english": "noun",
    "italian": "sostantivo"
  },
  {
    "rank": 419,
    "english": "field",
    "italian": "campo"
  },
  {
    "rank": 420,
    "english": "rest",
    "italian": "resto"
  },
  {
    "rank": 421,
    "english": "correct",
    "italian": "corretto"
  },
  {
    "rank": 422,
    "english": "able",
    "italian": "in grado di"
  },
  {
    "rank": 423,
    "english": "pound",
    "italian": "libbra"
  },
  {
    "rank": 424,
    "english": "done",
    "italian": "done"
  },
  {
    "rank": 425,
    "english": "beauty",
    "italian": "bellezza"
  },
  {
    "rank": 426,
    "english": "drive",
    "italian": "unità"
  },
  {
    "rank": 427,
    "english": "stood",
    "italian": "sorgeva"
  },
  {
    "rank": 428,
    "english": "contain",
    "italian": "contenere"
  },
  {
    "rank": 429,
    "english": "front",
    "italian": "frontale"
  },
  {
    "rank": 430,
    "english": "teach",
    "italian": "insegnare"
  },
  {
    "rank": 431,
    "english": "week",
    "italian": "settimana"
  },
  {
    "rank": 432,
    "english": "final",
    "italian": "finale"
  },
  {
    "rank": 433,
    "english": "gave",
    "italian": "ha dato"
  },
  {
    "rank": 434,
    "english": "green",
    "italian": "verde"
  },
  {
    "rank": 435,
    "english": "oh",
    "italian": "oh"
  },
  {
    "rank": 436,
    "english": "quick",
    "italian": "veloce"
  },
  {
    "rank": 437,
    "english": "develop",
    "italian": "sviluppare"
  },
  {
    "rank": 438,
    "english": "ocean",
    "italian": "oceano"
  },
  {
    "rank": 439,
    "english": "warm",
    "italian": "caldo"
  },
  {
    "rank": 440,
    "english": "free",
    "italian": "gratuito"
  },
  {
    "rank": 441,
    "english": "minute",
    "italian": "minuto"
  },
  {
    "rank": 442,
    "english": "strong",
    "italian": "forte"
  },
  {
    "rank": 443,
    "english": "special",
    "italian": "speciale"
  },
  {
    "rank": 444,
    "english": "mind",
    "italian": "mente"
  },
  {
    "rank": 445,
    "english": "behind",
    "italian": "dietro"
  },
  {
    "rank": 446,
    "english": "clear",
    "italian": "chiaro"
  },
  {
    "rank": 447,
    "english": "tail",
    "italian": "coda"
  },
  {
    "rank": 448,
    "english": "produce",
    "italian": "produrre"
  },
  {
    "rank": 449,
    "english": "fact",
    "italian": "fatto"
  },
  {
    "rank": 450,
    "english": "space",
    "italian": "spazio"
  },
  {
    "rank": 451,
    "english": "heard",
    "italian": "sentito"
  },
  {
    "rank": 452,
    "english": "best",
    "italian": "migliore"
  },
  {
    "rank": 453,
    "english": "hour",
    "italian": "ora"
  },
  {
    "rank": 454,
    "english": "better",
    "italian": "meglio"
  },
  {
    "rank": 455,
    "english": "true",
    "italian": "vero"
  },
  {
    "rank": 456,
    "english": "during",
    "italian": "durante"
  },
  {
    "rank": 457,
    "english": "hundred",
    "italian": "cento"
  },
  {
    "rank": 458,
    "english": "five",
    "italian": "cinque"
  },
  {
    "rank": 459,
    "english": "remember",
    "italian": "ricordare"
  },
  {
    "rank": 460,
    "english": "step",
    "italian": "passo"
  },
  {
    "rank": 461,
    "english": "early",
    "italian": "presto"
  },
  {
    "rank": 462,
    "english": "hold",
    "italian": "tenere"
  },
  {
    "rank": 463,
    "english": "west",
    "italian": "ovest"
  },
  {
    "rank": 464,
    "english": "ground",
    "italian": "terra"
  },
  {
    "rank": 465,
    "english": "interest",
    "italian": "interesse"
  },
  {
    "rank": 466,
    "english": "reach",
    "italian": "raggiungere"
  },
  {
    "rank": 467,
    "english": "fast",
    "italian": "veloce"
  },
  {
    "rank": 468,
    "english": "verb",
    "italian": "verbo"
  },
  {
    "rank": 469,
    "english": "sing",
    "italian": "cantare"
  },
  {
    "rank": 470,
    "english": "listen",
    "italian": "ascoltare"
  },
  {
    "rank": 471,
    "english": "six",
    "italian": "sei"
  },
  {
    "rank": 472,
    "english": "table",
    "italian": "tavolo"
  },
  {
    "rank": 473,
    "english": "travel",
    "italian": "viaggi"
  },
  {
    "rank": 474,
    "english": "less",
    "italian": "meno"
  },
  {
    "rank": 475,
    "english": "morning",
    "italian": "mattina"
  },
  {
    "rank": 476,
    "english": "ten",
    "italian": "dieci"
  },
  {
    "rank": 477,
    "english": "simple",
    "italian": "semplice"
  },
  {
    "rank": 478,
    "english": "several",
    "italian": "alcuni"
  },
  {
    "rank": 479,
    "english": "vowel",
    "italian": "vocale"
  },
  {
    "rank": 480,
    "english": "toward",
    "italian": "verso"
  },
  {
    "rank": 481,
    "english": "war",
    "italian": "guerra"
  },
  {
    "rank": 482,
    "english": "lay",
    "italian": "porre"
  },
  {
    "rank": 483,
    "english": "against",
    "italian": "contro"
  },
  {
    "rank": 484,
    "english": "pattern",
    "italian": "modello"
  },
  {
    "rank": 485,
    "english": "slow",
    "italian": "lento"
  },
  {
    "rank": 486,
    "english": "center",
    "italian": "centro"
  },
  {
    "rank": 487,
    "english": "love",
    "italian": "amore"
  },
  {
    "rank": 488,
    "english": "person",
    "italian": "persona"
  },
  {
    "rank": 489,
    "english": "money",
    "italian": "soldi"
  },
  {
    "rank": 490,
    "english": "serve",
    "italian": "servire"
  },
  {
    "rank": 491,
    "english": "appear",
    "italian": "apparire"
  },
  {
    "rank": 492,
    "english": "road",
    "italian": "strada"
  },
  {
    "rank": 493,
    "english": "map",
    "italian": "mappa"
  },
  {
    "rank": 494,
    "english": "rain",
    "italian": "pioggia"
  },
  {
    "rank": 495,
    "english": "rule",
    "italian": "regola"
  },
  {
    "rank": 496,
    "english": "govern",
    "italian": "governare"
  },
  {
    "rank": 497,
    "english": "pull",
    "italian": "tirare"
  },
  {
    "rank": 498,
    "english": "cold",
    "italian": "freddo"
  },
  {
    "rank": 499,
    "english": "notice",
    "italian": "avviso"
  },
  {
    "rank": 500,
    "english": "voice",
    "italian": "voce"
  },
  {
    "rank": 501,
    "english": "energy",
    "italian": "energia"
  },
  {
    "rank": 502,
    "english": "hunt",
    "italian": "caccia"
  },
  {
    "rank": 503,
    "english": "probable",
    "italian": "probabile"
  },
  {
    "rank": 504,
    "english": "bed",
    "italian": "letto"
  },
  {
    "rank": 505,
    "english": "brother",
    "italian": "fratello"
  },
  {
    "rank": 506,
    "english": "egg",
    "italian": "uovo"
  },
  {
    "rank": 507,
    "english": "ride",
    "italian": "giro"
  },
  {
    "rank": 508,
    "english": "cell",
    "italian": "cella"
  },
  {
    "rank": 509,
    "english": "believe",
    "italian": "credere"
  },
  {
    "rank": 510,
    "english": "perhaps",
    "italian": "forse"
  },
  {
    "rank": 511,
    "english": "pick",
    "italian": "scegliere"
  },
  {
    "rank": 512,
    "english": "sudden",
    "italian": "improvviso"
  },
  {
    "rank": 513,
    "english": "count",
    "italian": "contare"
  },
  {
    "rank": 514,
    "english": "square",
    "italian": "piazza"
  },
  {
    "rank": 515,
    "english": "reason",
    "italian": "motivo"
  },
  {
    "rank": 516,
    "english": "length",
    "italian": "lunghezza"
  },
  {
    "rank": 517,
    "english": "represent",
    "italian": "rappresentare"
  },
  {
    "rank": 518,
    "english": "art",
    "italian": "arte"
  },
  {
    "rank": 519,
    "english": "subject",
    "italian": "soggetto"
  },
  {
    "rank": 520,
    "english": "region",
    "italian": "regione"
  },
  {
    "rank": 521,
    "english": "size",
    "italian": "dimensione"
  },
  {
    "rank": 522,
    "english": "vary",
    "italian": "variare"
  },
  {
    "rank": 523,
    "english": "settle",
    "italian": "risolvere"
  },
  {
    "rank": 524,
    "english": "speak",
    "italian": "parlare"
  },
  {
    "rank": 525,
    "english": "weight",
    "italian": "peso"
  },
  {
    "rank": 526,
    "english": "general",
    "italian": "generale"
  },
  {
    "rank": 527,
    "english": "ice",
    "italian": "ghiaccio"
  },
  {
    "rank": 528,
    "english": "matter",
    "italian": "materia"
  },
  {
    "rank": 529,
    "english": "circle",
    "italian": "cerchio"
  },
  {
    "rank": 530,
    "english": "pair",
    "italian": "coppia"
  },
  {
    "rank": 531,
    "english": "include",
    "italian": "includere"
  },
  {
    "rank": 532,
    "english": "divide",
    "italian": "divide"
  },
  {
    "rank": 533,
    "english": "syllable",
    "italian": "sillaba"
  },
  {
    "rank": 534,
    "english": "felt",
    "italian": "feltro"
  },
  {
    "rank": 535,
    "english": "grand",
    "italian": "grande"
  },
  {
    "rank": 536,
    "english": "ball",
    "italian": "palla"
  },
  {
    "rank": 537,
    "english": "yet",
    "italian": "ancora"
  },
  {
    "rank": 538,
    "english": "wave",
    "italian": "onda"
  },
  {
    "rank": 539,
    "english": "drop",
    "italian": "cadere"
  },
  {
    "rank": 540,
    "english": "heart",
    "italian": "cuore"
  },
  {
    "rank": 541,
    "english": "am",
    "italian": "am"
  },
  {
    "rank": 542,
    "english": "present",
    "italian": "presente"
  },
  {
    "rank": 543,
    "english": "heavy",
    "italian": "pesante"
  },
  {
    "rank": 544,
    "english": "dance",
    "italian": "danza"
  },
  {
    "rank": 545,
    "english": "engine",
    "italian": "motore"
  },
  {
    "rank": 546,
    "english": "position",
    "italian": "posizione"
  },
  {
    "rank": 547,
    "english": "arm",
    "italian": "braccio"
  },
  {
    "rank": 548,
    "english": "wide",
    "italian": "ampio"
  },
  {
    "rank": 549,
    "english": "sail",
    "italian": "vela"
  },
  {
    "rank": 550,
    "english": "material",
    "italian": "materiale"
  },
  {
    "rank": 551,
    "english": "fraction",
    "italian": "frazione"
  },
  {
    "rank": 552,
    "english": "forest",
    "italian": "foresta"
  },
  {
    "rank": 553,
    "english": "sit",
    "italian": "sedersi"
  },
  {
    "rank": 554,
    "english": "race",
    "italian": "gara"
  },
  {
    "rank": 555,
    "english": "window",
    "italian": "finestra"
  },
  {
    "rank": 556,
    "english": "store",
    "italian": "negozio"
  },
  {
    "rank": 557,
    "english": "summer",
    "italian": "estate"
  },
  {
    "rank": 558,
    "english": "train",
    "italian": "treno"
  },
  {
    "rank": 559,
    "english": "sleep",
    "italian": "sonno"
  },
  {
    "rank": 560,
    "english": "prove",
    "italian": "dimostrare"
  },
  {
    "rank": 561,
    "english": "lone",
    "italian": "solitario"
  },
  {
    "rank": 562,
    "english": "leg",
    "italian": "gamba"
  },
  {
    "rank": 563,
    "english": "exercise",
    "italian": "esercizio"
  },
  {
    "rank": 564,
    "english": "wall",
    "italian": "muro"
  },
  {
    "rank": 565,
    "english": "catch",
    "italian": "prendere"
  },
  {
    "rank": 566,
    "english": "mount",
    "italian": "monte"
  },
  {
    "rank": 567,
    "english": "wish",
    "italian": "desiderio"
  },
  {
    "rank": 568,
    "english": "sky",
    "italian": "cielo"
  },
  {
    "rank": 569,
    "english": "board",
    "italian": "pensione"
  },
  {
    "rank": 570,
    "english": "joy",
    "italian": "gioia"
  },
  {
    "rank": 571,
    "english": "winter",
    "italian": "inverno"
  },
  {
    "rank": 572,
    "english": "sat",
    "italian": "sat"
  },
  {
    "rank": 573,
    "english": "written",
    "italian": "scritto"
  },
  {
    "rank": 574,
    "english": "wild",
    "italian": "selvaggio"
  },
  {
    "rank": 575,
    "english": "instrument",
    "italian": "strumento"
  },
  {
    "rank": 576,
    "english": "kept",
    "italian": "tenere"
  },
  {
    "rank": 577,
    "english": "glass",
    "italian": "vetro"
  },
  {
    "rank": 578,
    "english": "grass",
    "italian": "erba"
  },
  {
    "rank": 579,
    "english": "cow",
    "italian": "mucca"
  },
  {
    "rank": 580,
    "english": "job",
    "italian": "lavoro"
  },
  {
    "rank": 581,
    "english": "edge",
    "italian": "bordo"
  },
  {
    "rank": 582,
    "english": "sign",
    "italian": "segno"
  },
  {
    "rank": 583,
    "english": "visit",
    "italian": "visita"
  },
  {
    "rank": 584,
    "english": "past",
    "italian": "passato"
  },
  {
    "rank": 585,
    "english": "soft",
    "italian": "morbido"
  },
  {
    "rank": 586,
    "english": "fun",
    "italian": "divertimento"
  },
  {
    "rank": 587,
    "english": "bright",
    "italian": "luminoso"
  },
  {
    "rank": 588,
    "english": "gas",
    "italian": "gas"
  },
  {
    "rank": 589,
    "english": "weather",
    "italian": "tempo"
  },
  {
    "rank": 590,
    "english": "month",
    "italian": "mese"
  },
  {
    "rank": 591,
    "english": "million",
    "italian": "milione"
  },
  {
    "rank": 592,
    "english": "bear",
    "italian": "sopportare"
  },
  {
    "rank": 593,
    "english": "finish",
    "italian": "finitura"
  },
  {
    "rank": 594,
    "english": "happy",
    "italian": "felice"
  },
  {
    "rank": 595,
    "english": "hope",
    "italian": "speranza"
  },
  {
    "rank": 596,
    "english": "flower",
    "italian": "fiore"
  },
  {
    "rank": 597,
    "english": "clothe",
    "italian": "vestire"
  },
  {
    "rank": 598,
    "english": "strange",
    "italian": "strano"
  },
  {
    "rank": 599,
    "english": "gone",
    "italian": "gone"
  },
  {
    "rank": 600,
    "english": "trade",
    "italian": "commercio"
  },
  {
    "rank": 601,
    "english": "melody",
    "italian": "melodia"
  },
  {
    "rank": 602,
    "english": "trip",
    "italian": "viaggio"
  },
  {
    "rank": 603,
    "english": "office",
    "italian": "ufficio"
  },
  {
    "rank": 604,
    "english": "receive",
    "italian": "ricevere"
  },
  {
    "rank": 605,
    "english": "row",
    "italian": "fila"
  },
  {
    "rank": 606,
    "english": "mouth",
    "italian": "bocca"
  },
  {
    "rank": 607,
    "english": "exact",
    "italian": "esatto"
  },
  {
    "rank": 608,
    "english": "symbol",
    "italian": "simbolo"
  },
  {
    "rank": 609,
    "english": "die",
    "italian": "morire"
  },
  {
    "rank": 610,
    "english": "least",
    "italian": "meno"
  },
  {
    "rank": 611,
    "english": "trouble",
    "italian": "difficoltà"
  },
  {
    "rank": 612,
    "english": "shout",
    "italian": "shout"
  },
  {
    "rank": 613,
    "english": "except",
    "italian": "tranne"
  },
  {
    "rank": 614,
    "english": "wrote",
    "italian": "ha scritto"
  },
  {
    "rank": 615,
    "english": "seed",
    "italian": "seme"
  },
  {
    "rank": 616,
    "english": "tone",
    "italian": "tono"
  },
  {
    "rank": 617,
    "english": "join",
    "italian": "aderire"
  },
  {
    "rank": 618,
    "english": "suggest",
    "italian": "suggerire"
  },
  {
    "rank": 619,
    "english": "clean",
    "italian": "pulito"
  },
  {
    "rank": 620,
    "english": "break",
    "italian": "pausa"
  },
  {
    "rank": 621,
    "english": "lady",
    "italian": "signora"
  },
  {
    "rank": 622,
    "english": "yard",
    "italian": "cantiere"
  },
  {
    "rank": 623,
    "english": "rise",
    "italian": "salire"
  },
  {
    "rank": 624,
    "english": "bad",
    "italian": "male"
  },
  {
    "rank": 625,
    "english": "blow",
    "italian": "colpo"
  },
  {
    "rank": 626,
    "english": "oil",
    "italian": "olio"
  },
  {
    "rank": 627,
    "english": "blood",
    "italian": "sangue"
  },
  {
    "rank": 628,
    "english": "touch",
    "italian": "toccare"
  },
  {
    "rank": 629,
    "english": "grew",
    "italian": "è cresciuto"
  },
  {
    "rank": 630,
    "english": "cent",
    "italian": "cent"
  },
  {
    "rank": 631,
    "english": "mix",
    "italian": "mescolare"
  },
  {
    "rank": 632,
    "english": "team",
    "italian": "team"
  },
  {
    "rank": 633,
    "english": "wire",
    "italian": "filo"
  },
  {
    "rank": 634,
    "english": "cost",
    "italian": "costo"
  },
  {
    "rank": 635,
    "english": "lost",
    "italian": "perso"
  },
  {
    "rank": 636,
    "english": "brown",
    "italian": "marrone"
  },
  {
    "rank": 637,
    "english": "wear",
    "italian": "indossare"
  },
  {
    "rank": 638,
    "english": "garden",
    "italian": "giardino"
  },
  {
    "rank": 639,
    "english": "equal",
    "italian": "pari"
  },
  {
    "rank": 640,
    "english": "sent",
    "italian": "inviato"
  },
  {
    "rank": 641,
    "english": "choose",
    "italian": "scegliere"
  },
  {
    "rank": 642,
    "english": "fell",
    "italian": "caduto"
  },
  {
    "rank": 643,
    "english": "fit",
    "italian": "adattarsi"
  },
  {
    "rank": 644,
    "english": "flow",
    "italian": "flusso"
  },
  {
    "rank": 645,
    "english": "fair",
    "italian": "fiera"
  },
  {
    "rank": 646,
    "english": "bank",
    "italian": "banca"
  },
  {
    "rank": 647,
    "english": "collect",
    "italian": "raccogliere"
  },
  {
    "rank": 648,
    "english": "save",
    "italian": "salvare"
  },
  {
    "rank": 649,
    "english": "control",
    "italian": "controllo"
  },
  {
    "rank": 650,
    "english": "decimal",
    "italian": "decimale"
  },
  {
    "rank": 651,
    "english": "ear",
    "italian": "orecchio"
  },
  {
    "rank": 652,
    "english": "else",
    "italian": "altro"
  },
  {
    "rank": 653,
    "english": "quite",
    "italian": "abbastanza"
  },
  {
    "rank": 654,
    "english": "broke",
    "italian": "rotto"
  },
  {
    "rank": 655,
    "english": "case",
    "italian": "caso"
  },
  {
    "rank": 656,
    "english": "middle",
    "italian": "mezzo"
  },
  {
    "rank": 657,
    "english": "kill",
    "italian": "uccidere"
  },
  {
    "rank": 658,
    "english": "son",
    "italian": "figlio"
  },
  {
    "rank": 659,
    "english": "lake",
    "italian": "lago"
  },
  {
    "rank": 660,
    "english": "moment",
    "italian": "momento"
  },
  {
    "rank": 661,
    "english": "scale",
    "italian": "scala"
  },
  {
    "rank": 662,
    "english": "loud",
    "italian": "forte"
  },
  {
    "rank": 663,
    "english": "spring",
    "italian": "primavera"
  },
  {
    "rank": 664,
    "english": "observe",
    "italian": "osservare"
  },
  {
    "rank": 665,
    "english": "child",
    "italian": "bambino"
  },
  {
    "rank": 666,
    "english": "straight",
    "italian": "dritto"
  },
  {
    "rank": 667,
    "english": "consonant",
    "italian": "consonante"
  },
  {
    "rank": 668,
    "english": "nation",
    "italian": "nazione"
  },
  {
    "rank": 669,
    "english": "dictionary",
    "italian": "dizionario"
  },
  {
    "rank": 670,
    "english": "milk",
    "italian": "latte"
  },
  {
    "rank": 671,
    "english": "speed",
    "italian": "velocità"
  },
  {
    "rank": 672,
    "english": "method",
    "italian": "metodo"
  },
  {
    "rank": 673,
    "english": "organ",
    "italian": "organo"
  },
  {
    "rank": 674,
    "english": "pay",
    "italian": "pagare"
  },
  {
    "rank": 675,
    "english": "age",
    "italian": "età"
  },
  {
    "rank": 676,
    "english": "section",
    "italian": "sezione"
  },
  {
    "rank": 677,
    "english": "dress",
    "italian": "vestito"
  },
  {
    "rank": 678,
    "english": "cloud",
    "italian": "nube"
  },
  {
    "rank": 679,
    "english": "surprise",
    "italian": "sorpresa"
  },
  {
    "rank": 680,
    "english": "quiet",
    "italian": "tranquillo"
  },
  {
    "rank": 681,
    "english": "stone",
    "italian": "pietra"
  },
  {
    "rank": 682,
    "english": "tiny",
    "italian": "piccolo"
  },
  {
    "rank": 683,
    "english": "climb",
    "italian": "salita"
  },
  {
    "rank": 684,
    "english": "cool",
    "italian": "fresco"
  },
  {
    "rank": 685,
    "english": "design",
    "italian": "design"
  },
  {
    "rank": 686,
    "english": "poor",
    "italian": "povero"
  },
  {
    "rank": 687,
    "english": "lot",
    "italian": "lotto"
  },
  {
    "rank": 688,
    "english": "experiment",
    "italian": "esperimento"
  },
  {
    "rank": 689,
    "english": "bottom",
    "italian": "fondo"
  },
  {
    "rank": 690,
    "english": "key",
    "italian": "chiave"
  },
  {
    "rank": 691,
    "english": "iron",
    "italian": "ferro"
  },
  {
    "rank": 692,
    "english": "single",
    "italian": "singolo"
  },
  {
    "rank": 693,
    "english": "stick",
    "italian": "bastone"
  },
  {
    "rank": 694,
    "english": "flat",
    "italian": "appartamento"
  },
  {
    "rank": 695,
    "english": "twenty",
    "italian": "venti"
  },
  {
    "rank": 696,
    "english": "skin",
    "italian": "pelle"
  },
  {
    "rank": 697,
    "english": "smile",
    "italian": "sorriso"
  },
  {
    "rank": 698,
    "english": "crease",
    "italian": "piega"
  },
  {
    "rank": 699,
    "english": "hole",
    "italian": "foro"
  },
  {
    "rank": 700,
    "english": "jump",
    "italian": "salto"
  },
  {
    "rank": 701,
    "english": "baby",
    "italian": "bambino"
  },
  {
    "rank": 702,
    "english": "eight",
    "italian": "otto"
  },
  {
    "rank": 703,
    "english": "village",
    "italian": "villaggio"
  },
  {
    "rank": 704,
    "english": "meet",
    "italian": "si incontrano"
  },
  {
    "rank": 705,
    "english": "root",
    "italian": "radice"
  },
  {
    "rank": 706,
    "english": "buy",
    "italian": "acquistare"
  },
  {
    "rank": 707,
    "english": "raise",
    "italian": "aumentare"
  },
  {
    "rank": 708,
    "english": "solve",
    "italian": "risolvere"
  },
  {
    "rank": 709,
    "english": "metal",
    "italian": "metallo"
  },
  {
    "rank": 710,
    "english": "whether",
    "italian": "se"
  },
  {
    "rank": 711,
    "english": "push",
    "italian": "spingere"
  },
  {
    "rank": 712,
    "english": "seven",
    "italian": "sette"
  },
  {
    "rank": 713,
    "english": "paragraph",
    "italian": "paragrafo"
  },
  {
    "rank": 714,
    "english": "third",
    "italian": "terzo"
  },
  {
    "rank": 715,
    "english": "shall",
    "italian": "deve"
  },
  {
    "rank": 716,
    "english": "held",
    "italian": "tenuto"
  },
  {
    "rank": 717,
    "english": "hair",
    "italian": "capelli"
  },
  {
    "rank": 718,
    "english": "describe",
    "italian": "descrivere"
  },
  {
    "rank": 719,
    "english": "cook",
    "italian": "cuoco"
  },
  {
    "rank": 720,
    "english": "floor",
    "italian": "piano"
  },
  {
    "rank": 721,
    "english": "either",
    "italian": "o"
  },
  {
    "rank": 722,
    "english": "result",
    "italian": "risultato"
  },
  {
    "rank": 723,
    "english": "burn",
    "italian": "bruciare"
  },
  {
    "rank": 724,
    "english": "hill",
    "italian": "collina"
  },
  {
    "rank": 725,
    "english": "safe",
    "italian": "sicuro"
  },
  {
    "rank": 726,
    "english": "cat",
    "italian": "gatto"
  },
  {
    "rank": 727,
    "english": "century",
    "italian": "secolo"
  },
  {
    "rank": 728,
    "english": "consider",
    "italian": "considerare"
  },
  {
    "rank": 729,
    "english": "type",
    "italian": "tipo"
  },
  {
    "rank": 730,
    "english": "law",
    "italian": "legge"
  },
  {
    "rank": 731,
    "english": "bit",
    "italian": "bit"
  },
  {
    "rank": 732,
    "english": "coast",
    "italian": "costa"
  },
  {
    "rank": 733,
    "english": "copy",
    "italian": "copia"
  },
  {
    "rank": 734,
    "english": "phrase",
    "italian": "frase"
  },
  {
    "rank": 735,
    "english": "silent",
    "italian": "silenzioso"
  },
  {
    "rank": 736,
    "english": "tall",
    "italian": "alto"
  },
  {
    "rank": 737,
    "english": "sand",
    "italian": "sabbia"
  },
  {
    "rank": 738,
    "english": "soil",
    "italian": "suolo"
  },
  {
    "rank": 739,
    "english": "roll",
    "italian": "rotolo"
  },
  {
    "rank": 740,
    "english": "temperature",
    "italian": "temperatura"
  },
  {
    "rank": 741,
    "english": "finger",
    "italian": "dito"
  },
  {
    "rank": 742,
    "english": "industry",
    "italian": "industria"
  },
  {
    "rank": 743,
    "english": "value",
    "italian": "valore"
  },
  {
    "rank": 744,
    "english": "fight",
    "italian": "lotta"
  },
  {
    "rank": 745,
    "english": "lie",
    "italian": "bugia"
  },
  {
    "rank": 746,
    "english": "beat",
    "italian": "battere"
  },
  {
    "rank": 747,
    "english": "excite",
    "italian": "eccitare"
  },
  {
    "rank": 748,
    "english": "natural",
    "italian": "naturale"
  },
  {
    "rank": 749,
    "english": "view",
    "italian": "vista"
  },
  {
    "rank": 750,
    "english": "sense",
    "italian": "senso"
  },
  {
    "rank": 751,
    "english": "capital",
    "italian": "capitale"
  },
  {
    "rank": 752,
    "english": "won’t",
    "italian": "non sarà"
  },
  {
    "rank": 753,
    "english": "chair",
    "italian": "sedia"
  },
  {
    "rank": 754,
    "english": "danger",
    "italian": "pericolo"
  },
  {
    "rank": 755,
    "english": "fruit",
    "italian": "frutta"
  },
  {
    "rank": 756,
    "english": "rich",
    "italian": "ricco"
  },
  {
    "rank": 757,
    "english": "thick",
    "italian": "spesso"
  },
  {
    "rank": 758,
    "english": "soldier",
    "italian": "soldato"
  },
  {
    "rank": 759,
    "english": "process",
    "italian": "processo"
  },
  {
    "rank": 760,
    "english": "operate",
    "italian": "operare"
  },
  {
    "rank": 761,
    "english": "practice",
    "italian": "pratica"
  },
  {
    "rank": 762,
    "english": "separate",
    "italian": "separato"
  },
  {
    "rank": 763,
    "english": "difficult",
    "italian": "difficile"
  },
  {
    "rank": 764,
    "english": "doctor",
    "italian": "medico"
  },
  {
    "rank": 765,
    "english": "please",
    "italian": "per favore"
  },
  {
    "rank": 766,
    "english": "protect",
    "italian": "proteggere"
  },
  {
    "rank": 767,
    "english": "noon",
    "italian": "mezzogiorno"
  },
  {
    "rank": 768,
    "english": "crop",
    "italian": "raccolto"
  },
  {
    "rank": 769,
    "english": "modern",
    "italian": "moderno"
  },
  {
    "rank": 770,
    "english": "element",
    "italian": "elemento"
  },
  {
    "rank": 771,
    "english": "hit",
    "italian": "colpire"
  },
  {
    "rank": 772,
    "english": "student",
    "italian": "studente"
  },
  {
    "rank": 773,
    "english": "corner",
    "italian": "angolo"
  },
  {
    "rank": 774,
    "english": "party",
    "italian": "partito"
  },
  {
    "rank": 775,
    "english": "supply",
    "italian": "fornitura"
  },
  {
    "rank": 776,
    "english": "whose",
    "italian": "la cui"
  },
  {
    "rank": 777,
    "english": "locate",
    "italian": "individuare"
  },
  {
    "rank": 778,
    "english": "ring",
    "italian": "anello"
  },
  {
    "rank": 779,
    "english": "character",
    "italian": "carattere"
  },
  {
    "rank": 780,
    "english": "insect",
    "italian": "insetto"
  },
  {
    "rank": 781,
    "english": "caught",
    "italian": "catturato"
  },
  {
    "rank": 782,
    "english": "period",
    "italian": "periodo"
  },
  {
    "rank": 783,
    "english": "indicate",
    "italian": "indicare"
  },
  {
    "rank": 784,
    "english": "radio",
    "italian": "radio"
  },
  {
    "rank": 785,
    "english": "spoke",
    "italian": "raggio"
  },
  {
    "rank": 786,
    "english": "atom",
    "italian": "atomo"
  },
  {
    "rank": 787,
    "english": "human",
    "italian": "umano"
  },
  {
    "rank": 788,
    "english": "history",
    "italian": "storia"
  },
  {
    "rank": 789,
    "english": "effect",
    "italian": "effetto"
  },
  {
    "rank": 790,
    "english": "electric",
    "italian": "elettrico"
  },
  {
    "rank": 791,
    "english": "expect",
    "italian": "aspettare"
  },
  {
    "rank": 792,
    "english": "bone",
    "italian": "osso"
  },
  {
    "rank": 793,
    "english": "rail",
    "italian": "ferrovia"
  },
  {
    "rank": 794,
    "english": "imagine",
    "italian": "immaginare"
  },
  {
    "rank": 795,
    "english": "provide",
    "italian": "fornire"
  },
  {
    "rank": 796,
    "english": "agree",
    "italian": "concordare"
  },
  {
    "rank": 797,
    "english": "thus",
    "italian": "così"
  },
  {
    "rank": 798,
    "english": "gentle",
    "italian": "dolce"
  },
  {
    "rank": 799,
    "english": "woman",
    "italian": "donna"
  },
  {
    "rank": 800,
    "english": "captain",
    "italian": "capitano"
  },
  {
    "rank": 801,
    "english": "guess",
    "italian": "indovinare"
  },
  {
    "rank": 802,
    "english": "necessary",
    "italian": "necessario"
  },
  {
    "rank": 803,
    "english": "sharp",
    "italian": "tagliente"
  },
  {
    "rank": 804,
    "english": "wing",
    "italian": "ala"
  },
  {
    "rank": 805,
    "english": "create",
    "italian": "creare"
  },
  {
    "rank": 806,
    "english": "neighbor",
    "italian": "prossimo"
  },
  {
    "rank": 807,
    "english": "wash",
    "italian": "lavaggio"
  },
  {
    "rank": 808,
    "english": "bat",
    "italian": "pipistrello"
  },
  {
    "rank": 809,
    "english": "rather",
    "italian": "piuttosto"
  },
  {
    "rank": 810,
    "english": "crowd",
    "italian": "folla"
  },
  {
    "rank": 811,
    "english": "corn",
    "italian": "mais"
  },
  {
    "rank": 812,
    "english": "compare",
    "italian": "confrontare"
  },
  {
    "rank": 813,
    "english": "poem",
    "italian": "poesia"
  },
  {
    "rank": 814,
    "english": "string",
    "italian": "stringa"
  },
  {
    "rank": 815,
    "english": "bell",
    "italian": "campana"
  },
  {
    "rank": 816,
    "english": "depend",
    "italian": "dipendere"
  },
  {
    "rank": 817,
    "english": "meat",
    "italian": "carne"
  },
  {
    "rank": 818,
    "english": "rub",
    "italian": "strofinare"
  },
  {
    "rank": 819,
    "english": "tube",
    "italian": "tubo"
  },
  {
    "rank": 820,
    "english": "famous",
    "italian": "famoso"
  },
  {
    "rank": 822,
    "english": "stream",
    "italian": "ruscello"
  },
  {
    "rank": 823,
    "english": "fear",
    "italian": "paura"
  },
  {
    "rank": 825,
    "english": "thin",
    "italian": "sottile"
  },
  {
    "rank": 826,
    "english": "triangle",
    "italian": "triangolo"
  },
  {
    "rank": 827,
    "english": "planet",
    "italian": "pianeta"
  },
  {
    "rank": 828,
    "english": "hurry",
    "italian": "fretta"
  },
  {
    "rank": 829,
    "english": "chief",
    "italian": "capo"
  },
  {
    "rank": 830,
    "english": "colony",
    "italian": "colonia"
  },
  {
    "rank": 831,
    "english": "clock",
    "italian": "orologio"
  },
  {
    "rank": 832,
    "english": "mine",
    "italian": "miniera"
  },
  {
    "rank": 833,
    "english": "tie",
    "italian": "cravatta"
  },
  {
    "rank": 834,
    "english": "enter",
    "italian": "inserire"
  },
  {
    "rank": 835,
    "english": "major",
    "italian": "maggiore"
  },
  {
    "rank": 836,
    "english": "fresh",
    "italian": "fresco"
  },
  {
    "rank": 837,
    "english": "search",
    "italian": "ricerca"
  },
  {
    "rank": 838,
    "english": "send",
    "italian": "inviare"
  },
  {
    "rank": 839,
    "english": "yellow",
    "italian": "giallo"
  },
  {
    "rank": 840,
    "english": "gun",
    "italian": "pistola"
  },
  {
    "rank": 840,
    "english": "rose",
    "italian": "rosa"
  },
  {
    "rank": 841,
    "english": "allow",
    "italian": "consentire"
  },
  {
    "rank": 842,
    "english": "print",
    "italian": "stampa"
  },
  {
    "rank": 843,
    "english": "dead",
    "italian": "morto"
  },
  {
    "rank": 844,
    "english": "spot",
    "italian": "spot"
  },
  {
    "rank": 845,
    "english": "desert",
    "italian": "deserto"
  },
  {
    "rank": 846,
    "english": "suit",
    "italian": "tuta"
  },
  {
    "rank": 847,
    "english": "current",
    "italian": "corrente"
  },
  {
    "rank": 848,
    "english": "lift",
    "italian": "ascensore"
  },
  {
    "rank": 850,
    "english": "arrive",
    "italian": "arrivare"
  },
  {
    "rank": 851,
    "english": "master",
    "italian": "master"
  },
  {
    "rank": 852,
    "english": "track",
    "italian": "pista"
  },
  {
    "rank": 853,
    "english": "parent",
    "italian": "genitore"
  },
  {
    "rank": 854,
    "english": "shore",
    "italian": "riva"
  },
  {
    "rank": 855,
    "english": "division",
    "italian": "divisione"
  },
  {
    "rank": 856,
    "english": "sheet",
    "italian": "foglio"
  },
  {
    "rank": 857,
    "english": "substance",
    "italian": "sostanza"
  },
  {
    "rank": 858,
    "english": "favor",
    "italian": "favorire"
  },
  {
    "rank": 859,
    "english": "connect",
    "italian": "collegare"
  },
  {
    "rank": 860,
    "english": "post",
    "italian": "Messaggio"
  },
  {
    "rank": 861,
    "english": "spend",
    "italian": "spendere"
  },
  {
    "rank": 862,
    "english": "chord",
    "italian": "accordo"
  },
  {
    "rank": 863,
    "english": "fat",
    "italian": "grasso"
  },
  {
    "rank": 864,
    "english": "glad",
    "italian": "felice"
  },
  {
    "rank": 865,
    "english": "original",
    "italian": "originale"
  },
  {
    "rank": 866,
    "english": "share",
    "italian": "quota"
  },
  {
    "rank": 867,
    "english": "station",
    "italian": "stazione"
  },
  {
    "rank": 868,
    "english": "dad",
    "italian": "papà"
  },
  {
    "rank": 869,
    "english": "bread",
    "italian": "pane"
  },
  {
    "rank": 870,
    "english": "charge",
    "italian": "carica"
  },
  {
    "rank": 871,
    "english": "proper",
    "italian": "corretto"
  },
  {
    "rank": 872,
    "english": "bar",
    "italian": "bar"
  },
  {
    "rank": 873,
    "english": "offer",
    "italian": "offerta"
  },
  {
    "rank": 874,
    "english": "segment",
    "italian": "segmento"
  },
  {
    "rank": 875,
    "english": "slave",
    "italian": "schiavo"
  },
  {
    "rank": 876,
    "english": "duck",
    "italian": "anatra"
  },
  {
    "rank": 877,
    "english": "instant",
    "italian": "immediato"
  },
  {
    "rank": 878,
    "english": "market",
    "italian": "mercato"
  },
  {
    "rank": 879,
    "english": "degree",
    "italian": "grado"
  },
  {
    "rank": 880,
    "english": "populate",
    "italian": "popolare"
  },
  {
    "rank": 881,
    "english": "chick",
    "italian": "pulcino"
  },
  {
    "rank": 882,
    "english": "dear",
    "italian": "caro"
  },
  {
    "rank": 883,
    "english": "enemy",
    "italian": "nemico"
  },
  {
    "rank": 884,
    "english": "reply",
    "italian": "rispondere"
  },
  {
    "rank": 885,
    "english": "drink",
    "italian": "bevanda"
  },
  {
    "rank": 886,
    "english": "occur",
    "italian": "verificarsi"
  },
  {
    "rank": 887,
    "english": "support",
    "italian": "supporto"
  },
  {
    "rank": 888,
    "english": "speech",
    "italian": "discorso"
  },
  {
    "rank": 889,
    "english": "nature",
    "italian": "natura"
  },
  {
    "rank": 890,
    "english": "range",
    "italian": "gamma"
  },
  {
    "rank": 891,
    "english": "steam",
    "italian": "vapore"
  },
  {
    "rank": 892,
    "english": "motion",
    "italian": "moto"
  },
  {
    "rank": 893,
    "english": "path",
    "italian": "sentiero"
  },
  {
    "rank": 894,
    "english": "liquid",
    "italian": "liquido"
  },
  {
    "rank": 895,
    "english": "log",
    "italian": "log"
  },
  {
    "rank": 896,
    "english": "meant",
    "italian": "significava"
  },
  {
    "rank": 897,
    "english": "quotient",
    "italian": "quoziente"
  },
  {
    "rank": 898,
    "english": "teeth",
    "italian": "denti"
  },
  {
    "rank": 899,
    "english": "shell",
    "italian": "guscio"
  },
  {
    "rank": 900,
    "english": "neck",
    "italian": "collo"
  },
  {
    "rank": 901,
    "english": "oxygen",
    "italian": "ossigeno"
  },
  {
    "rank": 902,
    "english": "sugar",
    "italian": "zucchero"
  },
  {
    "rank": 903,
    "english": "death",
    "italian": "morte"
  },
  {
    "rank": 904,
    "english": "pretty",
    "italian": "piuttosto"
  },
  {
    "rank": 905,
    "english": "skill",
    "italian": "abilità"
  },
  {
    "rank": 906,
    "english": "women",
    "italian": "donne"
  },
  {
    "rank": 907,
    "english": "season",
    "italian": "stagione"
  },
  {
    "rank": 908,
    "english": "solution",
    "italian": "soluzione"
  },
  {
    "rank": 909,
    "english": "magnet",
    "italian": "magnete"
  },
  {
    "rank": 910,
    "english": "silver",
    "italian": "argento"
  },
  {
    "rank": 911,
    "english": "thank",
    "italian": "grazie"
  },
  {
    "rank": 912,
    "english": "branch",
    "italian": "ramo"
  },
  {
    "rank": 913,
    "english": "match",
    "italian": "partita"
  },
  {
    "rank": 914,
    "english": "suffix",
    "italian": "suffisso"
  },
  {
    "rank": 915,
    "english": "especially",
    "italian": "particolarmente"
  },
  {
    "rank": 916,
    "english": "fig",
    "italian": "fico"
  },
  {
    "rank": 917,
    "english": "afraid",
    "italian": "impaurito"
  },
  {
    "rank": 918,
    "english": "huge",
    "italian": "enorme"
  },
  {
    "rank": 919,
    "english": "sister",
    "italian": "sorella"
  },
  {
    "rank": 920,
    "english": "steel",
    "italian": "acciaio"
  },
  {
    "rank": 921,
    "english": "dollar",
    "italian": "dollaro"
  },
  {
    "rank": 921,
    "english": "discuss",
    "italian": "discutere"
  },
  {
    "rank": 922,
    "english": "forward",
    "italian": "avanti"
  },
  {
    "rank": 923,
    "english": "similar",
    "italian": "simile"
  },
  {
    "rank": 924,
    "english": "guide",
    "italian": "guidare"
  },
  {
    "rank": 925,
    "english": "experience",
    "italian": "esperienza"
  },
  {
    "rank": 926,
    "english": "score (noun)",
    "italian": "punteggio"
  },
  {
    "rank": 927,
    "english": "apple",
    "italian": "mela"
  },
  {
    "rank": 928,
    "english": "bought",
    "italian": "comprato"
  },
  {
    "rank": 929,
    "english": "led",
    "italian": "portato"
  },
  {
    "rank": 930,
    "english": "pitch",
    "italian": "pece"
  },
  {
    "rank": 931,
    "english": "coat",
    "italian": "cappotto"
  },
  {
    "rank": 932,
    "english": "mass",
    "italian": "massa"
  },
  {
    "rank": 933,
    "english": "card",
    "italian": "scheda"
  },
  {
    "rank": 934,
    "english": "band (rubber)",
    "italian": "banda"
  },
  {
    "rank": 935,
    "english": "rope",
    "italian": "corda"
  },
  {
    "rank": 936,
    "english": "slip",
    "italian": "slittamento"
  },
  {
    "rank": 937,
    "english": "win",
    "italian": "vittoria"
  },
  {
    "rank": 938,
    "english": "dream",
    "italian": "sognare"
  },
  {
    "rank": 939,
    "english": "evening",
    "italian": "sera"
  },
  {
    "rank": 940,
    "english": "condition",
    "italian": "condizione"
  },
  {
    "rank": 941,
    "english": "feed",
    "italian": "alimentazione"
  },
  {
    "rank": 942,
    "english": "tool",
    "italian": "strumento"
  },
  {
    "rank": 943,
    "english": "total",
    "italian": "totale"
  },
  {
    "rank": 944,
    "english": "basic",
    "italian": "di base"
  },
  {
    "rank": 945,
    "english": "smell",
    "italian": "odore"
  },
  {
    "rank": 946,
    "english": "valley",
    "italian": "valle"
  },
  {
    "rank": 947,
    "english": "nor",
    "italian": "né"
  },
  {
    "rank": 948,
    "english": "double",
    "italian": "doppio"
  },
  {
    "rank": 949,
    "english": "seat (in a car)",
    "italian": "sedile"
  },
  {
    "rank": 950,
    "english": "continue",
    "italian": "continuare"
  },
  {
    "rank": 951,
    "english": "a block",
    "italian": "blocco"
  },
  {
    "rank": 952,
    "english": "chart",
    "italian": "grafico"
  },
  {
    "rank": 953,
    "english": "hat",
    "italian": "cappello"
  },
  {
    "rank": 954,
    "english": "sell",
    "italian": "vendere"
  },
  {
    "rank": 955,
    "english": "success",
    "italian": "successo"
  },
  {
    "rank": 956,
    "english": "a company",
    "italian": "azienda"
  },
  {
    "rank": 957,
    "english": "subtract",
    "italian": "sottrarre"
  },
  {
    "rank": 958,
    "english": "event",
    "italian": "evento"
  },
  {
    "rank": 959,
    "english": "particular",
    "italian": "particolare"
  },
  {
    "rank": 960,
    "english": "deal",
    "italian": "affare"
  },
  {
    "rank": 961,
    "english": "swim",
    "italian": "nuoto"
  },
  {
    "rank": 962,
    "english": "term",
    "italian": "termine"
  },
  {
    "rank": 963,
    "english": "opposite",
    "italian": "opposto"
  },
  {
    "rank": 964,
    "english": "wife",
    "italian": "moglie"
  },
  {
    "rank": 965,
    "english": "shoe",
    "italian": "scarpa"
  },
  {
    "rank": 966,
    "english": "shoulder",
    "italian": "spalla"
  },
  {
    "rank": 967,
    "english": "spread",
    "italian": "spargere"
  },
  {
    "rank": 968,
    "english": "arrange",
    "italian": "organizzare"
  },
  {
    "rank": 969,
    "english": "a camp",
    "italian": "campo"
  },
  {
    "rank": 970,
    "english": "invent",
    "italian": "inventare"
  },
  {
    "rank": 971,
    "english": "cotton",
    "italian": "cotone"
  },
  {
    "rank": 972,
    "english": "birth",
    "italian": "nascita"
  },
  {
    "rank": 973,
    "english": "determine",
    "italian": "determinare"
  },
  {
    "rank": 974,
    "english": "quart",
    "italian": "quarto di gallone"
  },
  {
    "rank": 975,
    "english": "nine",
    "italian": "nove"
  },
  {
    "rank": 976,
    "english": "truck",
    "italian": "camion"
  },
  {
    "rank": 977,
    "english": "noise",
    "italian": "rumore"
  },
  {
    "rank": 978,
    "english": "level",
    "italian": "livello"
  },
  {
    "rank": 979,
    "english": "a chance",
    "italian": "possibilità"
  },
  {
    "rank": 980,
    "english": "gather",
    "italian": "raccogliere"
  },
  {
    "rank": 981,
    "english": "a shop",
    "italian": "negozio"
  },
  {
    "rank": 982,
    "english": "stretch (of land)",
    "italian": "tratto"
  },
  {
    "rank": 983,
    "english": "throw",
    "italian": "gettare"
  },
  {
    "rank": 984,
    "english": "shine",
    "italian": "brillare"
  },
  {
    "rank": 985,
    "english": "property",
    "italian": "proprietà"
  },
  {
    "rank": 986,
    "english": "column",
    "italian": "colonna"
  },
  {
    "rank": 987,
    "english": "molecule",
    "italian": "molecola"
  },
  {
    "rank": 988,
    "english": "select",
    "italian": "selezionare"
  },
  {
    "rank": 989,
    "english": "wrong",
    "italian": "sbagliato"
  },
  {
    "rank": 990,
    "english": "gray",
    "italian": "grigio"
  },
  {
    "rank": 991,
    "english": "repeat",
    "italian": "ripetizione"
  },
  {
    "rank": 992,
    "english": "require",
    "italian": "richiedere"
  },
  {
    "rank": 993,
    "english": "broad",
    "italian": "ampio"
  },
  {
    "rank": 994,
    "english": "prepare",
    "italian": "preparare"
  },
  {
    "rank": 995,
    "english": "salt",
    "italian": "sale"
  },
  {
    "rank": 996,
    "english": "nose",
    "italian": "naso"
  },
  {
    "rank": 997,
    "english": "plural",
    "italian": "plurale"
  },
  {
    "rank": 998,
    "english": "anger",
    "italian": "rabbia"
  },
  {
    "rank": 999,
    "english": "claim",
    "italian": "richiesta"
  },
  {
    "rank": 1000,
    "english": "continent",
    "italian": "continente"
  }
];
