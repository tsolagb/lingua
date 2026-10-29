export const ARCADE_GAME_IDS = [
  'word-rain',
  'speed-swipe',
  'letter-chain',
  'listen-tap',
  'say-it',
  'dictation',
  'conjugation-slots',
  'gender-sort',
  'odd-one-out',
  'chat-simulator',
  'path-stories',
  'fix-sentence',
  'boss-battle',
  'daily-challenge',
] as const;

export type ArcadeCatalogId = (typeof ARCADE_GAME_IDS)[number];
export type ArcadeGroup = 'arcade' | 'listen-speak' | 'stories' | 'grammar' | 'daily';

export interface ArcadeGameMeta {
  id: ArcadeCatalogId;
  name: string;
  description: string;
  howTo: string[];
  /** Ionicons glyph name. */
  icon: string;
  color: string;
  darkColor: string;
  group: ArcadeGroup;
}

export const ARCADE_GROUPS: { id: ArcadeGroup; title: string }[] = [
  { id: 'arcade', title: 'Arcade' },
  { id: 'listen-speak', title: 'Listen & speak' },
  { id: 'stories', title: 'Stories & conversation' },
  { id: 'grammar', title: 'Grammar games' },
];

export const ARCADE_CATALOG: Record<ArcadeCatalogId, ArcadeGameMeta> = {
  'word-rain': {
    id: 'word-rain', name: 'Word Rain', group: 'arcade', icon: 'rainy',
    description: 'Catch the right word before it lands',
    howTo: ['Read the English word at the bottom.', 'Tap its translation as it falls.', 'Three misses and the storm wins.'],
    color: '#2F8CFF', darkColor: '#1C64C9',
  },
  'speed-swipe': {
    id: 'speed-swipe', name: 'Speed Swipe', group: 'arcade', icon: 'swap-horizontal',
    description: 'Match or not? Swipe fast',
    howTo: ['Swipe right if the pair matches.', 'Swipe left if it does not.', 'Chain answers to light the fire.'],
    color: '#FF6B4A', darkColor: '#D24529',
  },
  'letter-chain': {
    id: 'letter-chain', name: 'Letter Chain', group: 'arcade', icon: 'link',
    description: 'Spell the word from a ring of letters',
    howTo: ['Read the English clue.', 'Tap letters in order to fill the slots.', 'Hints help, but cost points.'],
    color: '#20B486', darkColor: '#13875F',
  },
  'listen-tap': {
    id: 'listen-tap', name: 'Listen & Tap', group: 'listen-speak', icon: 'ear',
    description: 'Hear it, then tap the meaning',
    howTo: ['Listen to the word.', 'Tap the matching meaning.'],
    color: '#8B5CF6', darkColor: '#6236C9',
  },
  'say-it': {
    id: 'say-it', name: 'Say It', group: 'listen-speak', icon: 'mic',
    description: 'Speak the word out loud',
    howTo: ['Read the prompt.', 'Say the word aloud.'],
    color: '#EC4899', darkColor: '#BE2373',
  },
  dictation: {
    id: 'dictation', name: 'Dictation', group: 'listen-speak', icon: 'create',
    description: 'Type exactly what you hear',
    howTo: ['Listen carefully.', 'Type what you heard.'],
    color: '#0EA5C6', darkColor: '#0A7E98',
  },
  'conjugation-slots': {
    id: 'conjugation-slots', name: 'Conjugation Slots', group: 'grammar', icon: 'grid',
    description: 'Spin up the right verb form',
    howTo: ['Read the subject and tense.', 'Pick the correct form.'],
    color: '#F59E0B', darkColor: '#C27403',
  },
  'gender-sort': {
    id: 'gender-sort', name: 'Gender Sort', group: 'grammar', icon: 'git-branch',
    description: 'Drag each word into its bucket',
    howTo: ['Drag the card into the right bucket.', 'Or tap a bucket to sort it.', 'Keep the streak alive.'],
    color: '#E5484D', darkColor: '#B42328',
  },
  'odd-one-out': {
    id: 'odd-one-out', name: 'Odd One Out', group: 'arcade', icon: 'shapes',
    description: 'Spot the word that does not belong',
    howTo: ['Look at the four words.', 'Tap the one from a different group.', 'Fast, sharp eyes earn the most points.'],
    color: '#14B8A6', darkColor: '#0E8A7C',
  },
  'chat-simulator': {
    id: 'chat-simulator', name: 'Chat Simulator', group: 'stories', icon: 'chatbubbles',
    description: 'Reply your way through a real chat',
    howTo: ['Read the message.', 'Pick the reply that fits.', 'Keep the conversation flowing.'],
    color: '#3B82F6', darkColor: '#1D5FC8',
  },
  'path-stories': {
    id: 'path-stories', name: 'Path Stories', group: 'stories', icon: 'map',
    description: 'Choose your way through a little story',
    howTo: ['Read each scene.', 'Choose what happens next.', 'Understand every line to reach the end.'],
    color: '#F97316', darkColor: '#C25510',
  },
  'fix-sentence': {
    id: 'fix-sentence', name: 'Fix the Sentence', group: 'grammar', icon: 'construct',
    description: 'Find the mistake and repair it',
    howTo: ['Read the sentence.', 'Tap the word that is wrong.', 'Choose the right fix.'],
    color: '#6366F1', darkColor: '#4338CA',
  },
  'boss-battle': {
    id: 'boss-battle', name: 'Boss Battle', group: 'grammar', icon: 'shield',
    description: 'Beat a checkpoint boss for a bonus',
    howTo: ['Answer to land hits on the boss.', 'Mistakes cost you a heart.', 'Win to earn a checkpoint badge.'],
    color: '#DC2626', darkColor: '#991B1B',
  },
  'daily-challenge': {
    id: 'daily-challenge', name: 'Daily Challenge', group: 'daily', icon: 'calendar',
    description: 'Ten questions. Same for everyone today.',
    howTo: ['Ten mixed questions: words, grammar, sentences and listening.', 'Your first answer on each question counts.', 'Your first finish today is official. Replays are practice, with no extra XP.'],
    color: '#2F6BEA', darkColor: '#1F4FB8',
  },
};

export const ARCADE_GAMES: ArcadeGameMeta[] = ARCADE_GAME_IDS.map(id => ARCADE_CATALOG[id]);

export function isArcadeGameId(value: unknown): value is ArcadeCatalogId {
  return typeof value === 'string' && (ARCADE_GAME_IDS as readonly string[]).includes(value);
}
