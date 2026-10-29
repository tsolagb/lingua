import type { Progress } from '../context/progressSnapshot';
import type { Language } from '../data/vocabulary';

const CLASSIC_MODES = ['match', 'flashcards', 'quiz', 'spelling', 'trueorfalse', 'rapidfire', 'wordsearch', 'crossword', 'sentencepractice', 'fillblank'];
function normalizeMode(mode: string) {
  const value = mode.toLowerCase().replace(/[^a-z]/g, '');
  const normalized = value === 'wordmatch' || value === 'game' ? 'match' : value === 'fillintheblank' ? 'fillblank' : value;
  return CLASSIC_MODES.includes(normalized) ? normalized : null;
}
export function classicBestStars(progress: Progress, language: Language, mode: string): number | undefined {
  const id = normalizeMode(mode);
  if (!id) return undefined;
  const record = progress[`${language}::arcade:classic-${id}`]?.[0];
  return record?.completed ? record.arcadeScore ?? 0 : undefined;
}
/** Classic games already award their normal lesson XP. This stores only their best result. */
export function planClassicBestStars(progress: Progress, language: Language, mode: string, stars: number): Progress {
  const id = normalizeMode(mode);
  if (!id || !Number.isInteger(stars) || stars < 0 || stars > 3) return progress;
  const previous = classicBestStars(progress, language, mode);
  if (previous !== undefined && previous >= stars) return progress;
  return { ...progress, [`${language}::arcade:classic-${id}`]: { 0: {
    completed: true, stars: 0, arcadeScore: stars, arcadeXp: 0, arcadeStars: stars,
  } } };
}
