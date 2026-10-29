import type { Progress, Currency } from '../context/progressSnapshot';
import type { Language } from '../data/vocabulary';

export const ARCADE_GAME_IDS = ['word-rain', 'speed-swipe', 'letter-chain', 'listen-tap', 'say-it', 'dictation', 'conjugation-slots', 'gender-sort', 'chat-simulator', 'path-stories', 'odd-one-out', 'fix-sentence', 'daily-challenge', 'boss-battle'] as const;
export type ArcadeGameId = typeof ARCADE_GAME_IDS[number];
export type ArcadeResult = {
  sessionId: string; score: number; stars: number; xp: number;
  contentId?: string; won?: boolean; dateKey?: string; grid?: string;
};
type Metadata = { arcadeContentId?: string; arcadeWon?: boolean; arcadeDate?: string; arcadeGrid?: string };
export function normalizeArcadeMetadata(value: Record<string, unknown>): Metadata {
  const result: Metadata = {};
  if (typeof value.arcadeContentId === 'string' && /^[a-zA-Z0-9][\w:-]{0,79}$/.test(value.arcadeContentId)) result.arcadeContentId = value.arcadeContentId;
  if (typeof value.arcadeWon === 'boolean') result.arcadeWon = value.arcadeWon;
  if (typeof value.arcadeDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.arcadeDate)) {
    const date = new Date(`${value.arcadeDate}T00:00:00Z`);
    if (Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value.arcadeDate) result.arcadeDate = value.arcadeDate;
  }
  if (typeof value.arcadeGrid === 'string' && /^[01]{10}$/.test(value.arcadeGrid)) result.arcadeGrid = value.arcadeGrid;
  return result;
}
export function mergeArcadeMetadata(left: Metadata & { arcadeScore?: number }, right: Metadata & { arcadeScore?: number }): Metadata {
  const best = (left.arcadeScore ?? 0) >= (right.arcadeScore ?? 0) ? left : right;
  return {
    ...(left.arcadeContentId || right.arcadeContentId ? { arcadeContentId: left.arcadeContentId ?? right.arcadeContentId } : {}),
    ...(left.arcadeDate || right.arcadeDate ? { arcadeDate: left.arcadeDate ?? right.arcadeDate } : {}),
    ...(left.arcadeWon !== undefined || right.arcadeWon !== undefined ? { arcadeWon: left.arcadeWon === true || right.arcadeWon === true } : {}),
    ...(left.arcadeGrid || right.arcadeGrid ? { arcadeGrid: best.arcadeGrid ?? left.arcadeGrid ?? right.arcadeGrid } : {}),
  };
}
export const arcadeKey = (language: Language, game: ArcadeGameId) => `${language}::arcade:${game}`;
export const isArcadeProgressKey = (key: string) => key.includes('::arcade:');

export function arcadeBestScore(progress: Progress, language: Language, game: ArcadeGameId) {
  return Math.max(0, ...Object.values(progress[arcadeKey(language, game)] ?? {}).map(round => round.arcadeScore ?? 0));
}
export function arcadeContentWon(progress: Progress, language: Language, game: ArcadeGameId, contentId: string) {
  return Object.values(progress[arcadeKey(language, game)] ?? {}).some(round => round.completed && round.arcadeContentId === contentId && round.arcadeWon === true);
}
export function arcadeContentBestScore(progress: Progress, language: Language, game: ArcadeGameId, contentId: string) {
  return Math.max(0, ...Object.values(progress[arcadeKey(language, game)] ?? {}).filter(round => round.arcadeContentId === contentId).map(round => round.arcadeScore ?? 0));
}
export function arcadeDailyHistory(progress: Progress, language: Language) {
  return Object.values(progress[arcadeKey(language, 'daily-challenge')] ?? {}).filter(round => round.completed && round.arcadeDate && round.arcadeGrid)
    .map(round => ({ dateKey: round.arcadeDate!, score: round.arcadeScore ?? 0, stars: round.arcadeStars ?? 0, grid: round.arcadeGrid!, xp: round.arcadeXp ?? 0 }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}
export function arcadeXpTotal(progress: Progress, language: Language) {
  return Object.entries(progress).filter(([key]) => key.startsWith(`${language}::arcade:`))
    .reduce((total, [, rounds]) => total + Object.values(rounds).reduce((sum, round) => sum + (round.arcadeXp ?? 0), 0), 0);
}
export function arcadeSessionIndex(id: string) {
  let hash = 14695981039346656037n;
  for (const character of id) hash = BigInt.asUintN(64, (hash ^ BigInt(character.codePointAt(0)!)) * 1099511628211n);
  return Number(hash & ((1n << 52n) - 1n)) + 1;
}
export function planArcadeReward(progress: Progress, currency: Currency, language: Language, game: ArcadeGameId, result: ArcadeResult, guided?: { categoryId: string; levelsPerMilestone: number; milestoneCount: number }) {
  if (!ARCADE_GAME_IDS.includes(game) || !result.sessionId || result.sessionId.length > 120 ||
      !Number.isFinite(result.score) || result.score < 0 || !Number.isInteger(result.stars) || result.stars < 0 || result.stars > 3 ||
      !Number.isFinite(result.xp) || result.xp < 0) throw new Error('Invalid game result.');
  const key = arcadeKey(language, game);
  const metadata = normalizeArcadeMetadata({ arcadeContentId: result.contentId, arcadeWon: result.won, arcadeDate: result.dateKey, arcadeGrid: result.grid });
  if (game === 'daily-challenge' && (!metadata.arcadeDate || !metadata.arcadeGrid)) throw new Error('A completed daily challenge needs its date and ten answers.');
  if (game === 'chat-simulator') {
    const scenario = /^chat-(\d+)$/.exec(metadata.arcadeContentId ?? '');
    const index = scenario ? Number(scenario[1]) : -1;
    if (index < 0 || index >= 12 || (index > 0 && !arcadeContentWon(progress, language, game, `chat-${index - 1}`))) throw new Error('Finish the previous conversation to unlock this scenario.');
  }
  if (game === 'boss-battle') {
    if (typeof result.won !== 'boolean') throw new Error('A boss result must say whether the battle was won.');
    const milestone = /^milestone-(\d+)$/.exec(metadata.arcadeContentId ?? '');
    const index = milestone ? Number(milestone[1]) : -1;
    if (!guided || index < 0 || index >= guided.milestoneCount || !progress[`${language}::${guided.categoryId}`]?.[(index + 1) * guided.levelsPerMilestone - 1]?.completed) {
      throw new Error('Pass this milestone’s checkpoint before battling its boss.');
    }
  }
  const rewardId = game === 'daily-challenge' ? `daily:${metadata.arcadeDate}`
    : game === 'boss-battle' && result.won === true ? `boss:${metadata.arcadeContentId}` : result.sessionId;
  const index = arcadeSessionIndex(rewardId);
  const bestScore = Math.max(arcadeBestScore(progress, language, game), Math.floor(result.score));
  if (progress[key]?.[index]?.completed) return { progress, currency, xpEarned: 0, bestScore: arcadeBestScore(progress, language, game) };
  const xpEarned = result.score > 0 && !(game === 'boss-battle' && !result.won) ? Math.min(50, Math.floor(result.xp)) : 0;
  return {
    progress: { ...progress, [key]: { ...progress[key], [index]: {
      completed: true, stars: 0, arcadeScore: Math.floor(result.score), arcadeXp: xpEarned, arcadeStars: result.stars,
      ...metadata,
    } } },
    currency: { ...currency, [language]: currency[language] + xpEarned },
    xpEarned, bestScore,
  };
}
