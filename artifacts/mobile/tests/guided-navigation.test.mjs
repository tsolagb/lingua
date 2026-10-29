import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const categories = source('../app/categories.tsx');
const home = source('../app/(tabs)/index.tsx');
const path = source('../app/guided-path.tsx');
const pathContent = source('../components/GuidedLearnPath.tsx');
const lesson = source('../app/guided-lesson.tsx');

test('Home learning action opens the Lessons overview rather than an individual guided lesson', () => {
  assert.match(home, /trackEvent\('learning_cta_clicked'[\s\S]*?router\.push\('\/categories'\)/);
  assert.doesNotMatch(home, /router\.push\('\/guided-lesson/);
});

test('Lessons has four practice tabs and defaults to Vocabulary on each new visit', () => {
  const tabList = categories.match(/const LESSON_TABS = \[([\s\S]*?)\] as const/)[1];
  assert.deepEqual([...tabList.matchAll(/id: '([^']+)'/g)].map(match => match[1]), [
    'vocabulary', 'grammar', 'sentences', 'games',
  ]);
  assert.match(categories, /requestedTab as LessonsTab : 'vocabulary'/);
  assert.doesNotMatch(categories, /AsyncStorage\.getItem/);
});

test('one prominent guided entry sits above the tabs; per-tab suggestions are quiet rows', () => {
  assert.ok(categories.indexOf('testID="guided-lessons-entry"') < categories.indexOf('accessibilityRole="tablist"'));
  assert.match(categories, /router\.push\('\/guided-path'/);
  assert.match(categories, /'Floor 1 · Room 1'/);
  assert.match(categories, /Floor \$\{Math\.floor\(currentGuidedLevel/);
  assert.equal((categories.match(/<LinearGradient\b/g) ?? []).length, 1);
  assert.doesNotMatch(categories, /<GuidedLearnPath/);
  for (const entry of ['lessons-up-next-vocabulary', 'grammar-practice-entry', 'sentence-practice-entry', 'fill-in-the-blank-entry']) {
    assert.ok(categories.includes(entry), `${entry} keeps its existing route and identifier`);
  }
});

test('guided path preserves the existing path component and returns through the right screens', () => {
  assert.match(path, /<GuidedLearnPath \/>/);
  assert.match(pathContent, /router\.dismissTo\('\/categories'\)/);
  assert.match(lesson, /function openPath\(\) \{\s*router\.dismissTo\('\/guided-path'/);
  assert.doesNotMatch(lesson, /tab: 'learn'/);
});
