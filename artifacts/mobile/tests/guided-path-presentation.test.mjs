import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAscentFloorOrder, PATH_THEMES, themeFor,
} from '../lib/guided-path-presentation.ts';
import { GUIDED_LEVELS_PER_MILESTONE, GUIDED_MILESTONES } from '../data/guided-curriculum.ts';

test('the tower displays higher Floors above Floor 1 without changing lesson indexes', () => {
  const floorOrder = buildAscentFloorOrder();
  assert.equal(floorOrder.length, GUIDED_MILESTONES.length);
  assert.deepEqual(floorOrder, Array.from({ length: 30 }, (_, index) => 29 - index));
  assert.deepEqual(buildAscentFloorOrder(4), [3, 2, 1, 0]);
  assert.deepEqual(buildAscentFloorOrder(0), []);

  for (const globalIndex of [0, 8, 9, 18, 268, 269]) {
    const milestoneIndex = Math.floor(globalIndex / GUIDED_LEVELS_PER_MILESTONE);
    const levelIndex = globalIndex % GUIDED_LEVELS_PER_MILESTONE;
    assert.equal(floorOrder.includes(milestoneIndex), true);
    assert.equal(milestoneIndex * GUIDED_LEVELS_PER_MILESTONE + levelIndex, globalIndex);
  }
});

test('milestone themes start with blue and cycle without changing the global brand', () => {
  assert.equal(PATH_THEMES.length, 6);
  assert.equal(themeFor(0).main, '#2F6BEA');
  assert.equal(themeFor(6).main, themeFor(0).main);
  assert.equal(themeFor(29).main, PATH_THEMES[5].main);
  for (const theme of PATH_THEMES) {
    assert.notEqual(theme.soft, theme.softDark);
    assert.notEqual(theme.main, theme.lip);
  }
});

test('themed banners and start buttons keep white labels at AA contrast', () => {
  for (const theme of PATH_THEMES) {
    const rgb = [1, 3, 5].map(offset => parseInt(theme.main.slice(offset, offset + 2), 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    const luminance = rgb.reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    assert.ok(1.05 / (luminance + 0.05) >= 4.5, theme.name);
  }
});
