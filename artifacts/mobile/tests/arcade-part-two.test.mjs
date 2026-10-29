import assert from 'node:assert/strict';
import test from 'node:test';
import { planArcadeReward, arcadeContentWon, arcadeContentBestScore, arcadeDailyHistory, mergeArcadeMetadata, normalizeArcadeMetadata } from '../lib/arcade-progress.ts';
const currency = { italian: 10, french: 20, spanish: 0, armenian: 0 };
const result = (sessionId, extra = {}) => ({ sessionId, score: 500, stars: 2, xp: 30, ...extra });
test('chat scenario completion unlocks only the next scenario in the same language', () => {
  assert.throws(() => planArcadeReward({}, currency, 'italian', 'chat-simulator', result('locked', { contentId: 'chat-1', won: true })));
  const first = planArcadeReward({}, currency, 'italian', 'chat-simulator', result('first', { contentId: 'chat-0', won: true }));
  assert.equal(arcadeContentWon(first.progress, 'italian', 'chat-simulator', 'chat-0'), true);
  assert.equal(arcadeContentWon(first.progress, 'french', 'chat-simulator', 'chat-0'), false);
  assert.equal(arcadeContentBestScore(first.progress, 'italian', 'chat-simulator', 'chat-0'), 500);
  const second = planArcadeReward(first.progress, first.currency, 'italian', 'chat-simulator', result('second', { contentId: 'chat-1', won: true }));
  assert.equal(second.xpEarned, 30);
});
test('Daily Challenge pays only once per language and date, including a new random replay session', () => {
  const daily = { dateKey: '2026-10-22', grid: '1101011100' };
  const first = planArcadeReward({}, currency, 'italian', 'daily-challenge', result('daily-a', daily));
  const replay = planArcadeReward(first.progress, first.currency, 'italian', 'daily-challenge', result('daily-b', { ...daily, score: 1000 }));
  assert.equal(replay.xpEarned, 0);
  assert.equal(replay.bestScore, 500);
  assert.equal(arcadeDailyHistory(replay.progress, 'italian').length, 1);
  assert.equal(arcadeDailyHistory(replay.progress, 'italian')[0].grid, daily.grid);
  assert.equal(planArcadeReward(first.progress, first.currency, 'french', 'daily-challenge', result('fr', daily)).xpEarned, 30);
  assert.throws(() => planArcadeReward({}, currency, 'italian', 'daily-challenge', result('bad', { dateKey: '2026-02-30', grid: '111' })));
});
test('boss bonus needs the completed checkpoint and cannot be farmed on victory replays', () => {
  const guided = { categoryId: 'guided-learn', levelsPerMilestone: 9, milestoneCount: 30 };
  const victory = result('boss-a', { contentId: 'milestone-0', won: true, xp: 40 });
  assert.throws(() => planArcadeReward({}, currency, 'italian', 'boss-battle', victory, guided));
  const progress = { 'italian::guided-learn': { 8: { completed: true, stars: 2 } } };
  const first = planArcadeReward(progress, currency, 'italian', 'boss-battle', victory, guided);
  assert.equal(first.xpEarned, 40);
  const replay = planArcadeReward(first.progress, first.currency, 'italian', 'boss-battle', { ...victory, sessionId: 'boss-b' }, guided);
  assert.equal(replay.xpEarned, 0);
  assert.equal(arcadeContentWon(first.progress, 'italian', 'boss-battle', 'milestone-0'), true);
  assert.equal(planArcadeReward(progress, currency, 'italian', 'boss-battle', result('lost', { contentId: 'milestone-0', won: false, xp: 40 }), guided).xpEarned, 0);
});
test('metadata keeps the winning daily grid in score merges and preserves completion', () => {
  assert.deepEqual(normalizeArcadeMetadata({ arcadeDate: 'invalid', arcadeGrid: '<script>' }), {});
  const merged = mergeArcadeMetadata({ arcadeScore: 200, arcadeGrid: '1100000000', arcadeWon: true }, { arcadeScore: 800, arcadeGrid: '1111111100', arcadeWon: false });
  assert.equal(merged.arcadeGrid, '1111111100');
  assert.equal(merged.arcadeWon, true);
});
