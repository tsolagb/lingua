import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const resultsSource = readFileSync(new URL('../app/results.tsx', import.meta.url), 'utf8');

test('Next Level appears between the result summary and lesson review when another level exists', () => {
  const summaryEnd = resultsSource.indexOf('</Text>', resultsSource.indexOf('subtitles[stars] ??'));
  const nextButtonStart = resultsSource.indexOf('testID="next-level"');
  const nextConditionStart = resultsSource.lastIndexOf('{hasNextLevel && (', nextButtonStart);
  const lessonReviewStart = resultsSource.indexOf('{category && categoryId && pairs.length > 0', nextButtonStart);

  assert.ok(summaryEnd >= 0, 'result summary should be present');
  assert.ok(nextConditionStart > summaryEnd, 'Next Level should follow the result summary');
  assert.ok(lessonReviewStart > nextButtonStart, 'Next Level should precede lesson review');
  assert.equal((resultsSource.match(/testID="next-level"/g) ?? []).length, 1);
  assert.match(resultsSource, /const hasNextLevel\s*=\s*nextLevelIndex < \(category\?\.levels\.length \?\? 0\);/);
  assert.match(resultsSource.slice(nextConditionStart, lessonReviewStart), /hasNextLevel && \(/);
});

test('Next Level retains its route, countdown text, and accessible button label', () => {
  const nextButtonStart = resultsSource.indexOf('testID="next-level"');
  const actionsStart = resultsSource.indexOf('{/* Actions */}', nextButtonStart);
  const nextButton = resultsSource.slice(resultsSource.lastIndexOf('{hasNextLevel && (', nextButtonStart), actionsStart);

  assert.match(nextButton, /router\.push\(`\/game\?categoryId=\$\{categoryId\}&levelIndex=\$\{nextLevelIndex\}`\)/);
  assert.match(nextButton, /shouldAutoAdvance \? `Next Level in \$\{countdown\}s` : 'Next Level'/);
  assert.match(nextButton, /accessibilityRole="button"/);
  assert.match(nextButton, /accessibilityLabel=\{shouldAutoAdvance \? `Next Level in \$\{countdown\} seconds` : 'Next Level'\}/);
});
