import type { WordPair } from './vocabulary';

/**
 * Existing course-pool headwords to surface in practical topic lessons.
 * These entries are reused rather than added to the 7,000-word course pool.
 */
export const PRACTICAL_TOPIC_HEADWORDS: Record<string, string[]> = {
  food: [
    'meal', 'juice', 'chicken', 'meat', 'breakfast', 'tea', 'spoon',
    'fork', 'plate', 'bowl', 'cup', 'fruit', 'snack', 'vegetable',
  ],
  home: [
    'bedroom', 'shower', 'toilet', 'soap', 'towel', 'blanket', 'pillow',
    'fridge', 'laundry', 'stove', 'pantry', 'kettle', 'laundry basket', 'toothbrush',
  ],
  school: [
    'study', 'lesson', 'subject', 'desk', 'page', 'paper', 'test',
    'grade', 'course', 'college', 'computer', 'classmate', 'whiteboard', 'chalk',
  ],
  jobs: [
    'worker', 'colleague', 'salary', 'office', 'meeting', 'email', 'customer',
    'business', 'company', 'job', 'boss', 'project', 'profession', 'coworker',
  ],
  places: [
    'city', 'town', 'street', 'road', 'store', 'shop', 'trip',
    'journey', 'map', 'route', 'subway', 'platform', 'abroad', 'pedestrian crossing',
  ],
  transport: [
    'ride', 'flight', 'bicycle', 'traveling', 'commuter', 'railway', 'vehicle',
    'carriage', 'fare', 'trip', 'journey', 'terminal', 'bus pass', 'commute',
  ],
  'grocery-store': [
    'buy', 'sell', 'pay', 'money', 'food', 'fruit', 'meat', 'juice',
    'meal', 'shop', 'store', 'cash', 'card', 'bag', 'basket', 'customer',
    'chicken', 'tea', 'spoon', 'fork', 'plate', 'bowl', 'cup',
    'breakfast', 'lunch', 'dinner', 'supermarket', 'sale', 'expensive',
    'cheap', 'change', 'checkout counter',
  ],
  'museum-streets': [
    'city', 'town', 'road', 'market', 'shop', 'store', 'subway', 'platform',
    'trip', 'journey', 'route', 'map', 'abroad', 'country', 'world', 'driver',
    'car', 'bus', 'train', 'station', 'bank', 'park', 'theatre', 'college',
    'university', 'hotel', 'airport', 'school', 'library', 'museum', 'church',
    'pharmacy',
  ],
  'business-terms': [
    'worker', 'colleague', 'office', 'job', 'boss', 'project', 'profession',
    'paperwork', 'email', 'task', 'plan', 'money', 'pay', 'deal',
    'businessman', 'work', 'working', 'team', 'client', 'owner', 'staff',
    'career', 'interview', 'promotion', 'performance', 'experience',
    'application', 'accountant', 'income', 'cost', 'department', 'hire',
  ],
};

/** New pool headwords that fill the existing 13-word shortfall to 7,000. */
export const NEW_PRACTICAL_WORDS: Record<string, WordPair> = {
  vegetable: {
    english: 'vegetable',
    translations: { italian: 'verdura', french: 'légume', spanish: 'verdura', armenian: 'բանջարեղէն' },
    translationReviewStatus: 'pending-review',
  },
  pantry: {
    english: 'pantry',
    translations: { italian: 'dispensa', french: 'garde-manger', spanish: 'despensa', armenian: 'մթերանոց' },
    translationReviewStatus: 'pending-review',
  },
  kettle: {
    english: 'kettle',
    translations: { italian: 'bollitore', french: 'bouilloire', spanish: 'hervidor', armenian: 'թեյնիկ' },
    translationReviewStatus: 'pending-review',
  },
  'laundry basket': {
    english: 'laundry basket',
    translations: { italian: 'cesto della biancheria', french: 'panier à linge', spanish: 'cesta de ropa', armenian: 'լուացքի զամբիւղ' },
    translationReviewStatus: 'pending-review',
  },
  toothbrush: {
    english: 'toothbrush',
    translations: { italian: 'spazzolino da denti', french: 'brosse à dents', spanish: 'cepillo de dientes', armenian: 'ակռայի խոզանակ' },
    translationReviewStatus: 'pending-review',
  },
  classmate: {
    english: 'classmate',
    translations: { italian: 'compagno di classe', french: 'camarade de classe', spanish: 'compañero de clase', armenian: 'դասընկեր' },
    translationReviewStatus: 'pending-review',
  },
  whiteboard: {
    english: 'whiteboard',
    translations: { italian: 'lavagna bianca', french: 'tableau blanc', spanish: 'pizarra blanca', armenian: 'սպիտակ գրատախտակ' },
    translationReviewStatus: 'pending-review',
  },
  chalk: {
    english: 'chalk',
    translations: { italian: 'gesso', french: 'craie', spanish: 'tiza', armenian: 'կաւիճ' },
    translationReviewStatus: 'pending-review',
  },
  coworker: {
    english: 'coworker',
    translations: { italian: 'collega', french: 'collègue', spanish: 'compañero de trabajo', armenian: 'գործընկեր' },
    translationReviewStatus: 'pending-review',
  },
  'pedestrian crossing': {
    english: 'pedestrian crossing',
    translations: { italian: 'attraversamento pedonale', french: 'passage piéton', spanish: 'paso peatonal', armenian: 'հետիոտնի անցում' },
    translationReviewStatus: 'pending-review',
  },
  'bus pass': {
    english: 'bus pass',
    translations: { italian: 'abbonamento dell’autobus', french: 'abonnement de bus', spanish: 'abono de autobús', armenian: 'աւտոպուսի երթեւեկութեան քարտ' },
    translationReviewStatus: 'pending-review',
  },
  commute: {
    english: 'commute',
    translations: { italian: 'tragitto casa-lavoro', french: 'trajet domicile-travail', spanish: 'desplazamiento al trabajo', armenian: 'աշխատանքի երթեւեկութիւնը' },
    translationReviewStatus: 'pending-review',
  },
  'checkout counter': {
    english: 'checkout counter',
    translations: { italian: 'cassa', french: 'comptoir de caisse', spanish: 'caja', armenian: 'դրամարկղի մօտ' },
    translationReviewStatus: 'pending-review',
  },
};

export const PRACTICAL_TOPIC_REVIEW_NOTICE =
  'Translations are pending review. Western Armenian wording needs Nayiri or qualified native-speaker verification.';
