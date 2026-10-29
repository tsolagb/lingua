import assert from 'node:assert/strict';
import test from 'node:test';
import { ARCADE_GAME_IDS, planArcadeReward, arcadeBestScore, arcadeXpTotal, arcadeSessionIndex } from '../lib/arcade-progress.ts';
import { countCompletedLearningLevels } from '../lib/guided-path-rewards.ts';

const balances = { italian: 10, french: 20, spanish: 0, armenian: 0 };
test('all fourteen games have stable non-colliding session ledgers', () => {
  assert.equal(ARCADE_GAME_IDS.length, 14);
  const indices = Array.from({ length: 1000 }, (_, i) => arcadeSessionIndex(`round-${i}`));
  assert.equal(new Set(indices).size, 1000);
  assert.ok(indices.every(index => Number.isSafeInteger(index) && index > 0));
});
test('a finished game awards actual XP once, stores best score, and leaves lesson stars alone', () => {
  const result = { sessionId: 'round-one', score: 250, stars: 3, xp: 15 };
  const first = planArcadeReward({}, balances, 'italian', 'word-rain', result);
  assert.equal(first.currency.italian, 25);
  assert.equal(first.currency.french, 20);
  assert.equal(first.xpEarned, 15);
  assert.equal(arcadeBestScore(first.progress, 'italian', 'word-rain'), 250);
  assert.equal(arcadeXpTotal(first.progress, 'italian'), 15);
  assert.equal(Object.values(first.progress['italian::arcade:word-rain'])[0].stars, 0);
  const duplicate = planArcadeReward(first.progress, first.currency, 'italian', 'word-rain', result);
  assert.equal(duplicate.xpEarned, 0);
  assert.equal(duplicate.currency.italian, 25);
});
test('scores and rewards are separate for each language and game, with best surviving lower rounds', () => {
  let state = planArcadeReward({}, balances, 'armenian', 'say-it', { sessionId: 'a', score: 200, stars: 2, xp: 10 });
  state = planArcadeReward(state.progress, state.currency, 'armenian', 'say-it', { sessionId: 'b', score: 50, stars: 1, xp: 5 });
  assert.equal(arcadeBestScore(state.progress, 'armenian', 'say-it'), 200);
  assert.equal(arcadeBestScore(state.progress, 'italian', 'say-it'), 0);
  assert.equal(arcadeBestScore(state.progress, 'armenian', 'dictation'), 0);
  assert.equal(state.currency.armenian, 15);
});
test('skipped/zero-score games cannot give free XP and rewards are bounded', () => {
  assert.equal(planArcadeReward({}, balances, 'italian', 'say-it', { sessionId: 'skip', score: 0, stars: 0, xp: 50 }).xpEarned, 0);
  assert.equal(planArcadeReward({}, balances, 'italian', 'word-rain', { sessionId: 'large', score: 1000, stars: 3, xp: 9999 }).xpEarned, 50);
  assert.throws(() => planArcadeReward({}, balances, 'italian', 'word-rain', { sessionId: 'bad', score: NaN, stars: 3, xp: 5 }));
});
test('arcade sessions cannot count as completed learning levels or unlock milestones', () => {
  const lessons = { 'italian::verbs': { 0: { completed: true, stars: 3 } } };
  const round = planArcadeReward(lessons, balances, 'italian', 'word-rain', { sessionId: 'arcade', score: 50, stars: 3, xp: 10 });
  assert.equal(countCompletedLearningLevels(round.progress), 1);
});
