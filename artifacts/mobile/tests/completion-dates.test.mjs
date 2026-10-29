import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCompletedAt, mergeCompletionDates, firstCompletionDate } from '../lib/completion-dates.ts';
import { mergeCompletionDates as serverMerge, normalizeCompletedAt as serverNormalize } from '../../api-server/src/lib/completionDates.ts';

const early = '2026-10-22T10:30:00.000Z';
const late = '2026-10-23T10:30:00.000Z';
test('only real canonical UTC dates survive normalization on client and server', () => {
  for (const value of [undefined, null, '', 'yesterday', '2026-02-31T10:30:00.000Z', 42, '2026-10-22', '2026-10-22T10:30:00+00:00']) {
    assert.equal(normalizeCompletedAt(value), undefined);
    assert.equal(serverNormalize(value), undefined);
  }
  assert.equal(normalizeCompletedAt(early), early);
  assert.equal(serverNormalize(early), early);
});
test('first guided completion gets a date; replays preserve it and old progress stays honestly undated', () => {
  const now = () => new Date(late);
  assert.equal(firstCompletionDate(undefined, true, now), late);
  assert.equal(firstCompletionDate(undefined, false, now), undefined);
  assert.equal(firstCompletionDate({ completed: true, completedAt: early }, true, now), early);
  assert.equal(firstCompletionDate({ completed: true }, true, now), undefined);
  assert.equal(firstCompletionDate({ completed: false }, true, now), late);
  assert.equal(firstCompletionDate({ completed: false, completedAt: early }, true, now), late);
});
test('offline merges keep the earliest real completion date in either sync order', () => {
  for (const merge of [mergeCompletionDates, serverMerge]) {
    assert.equal(merge(early, late), early);
    assert.equal(merge(late, early), early);
    assert.equal(merge(undefined, early), early);
    assert.equal(merge(early, undefined), early);
    assert.equal(merge('invalid', late), late);
    assert.equal(merge(undefined, undefined), undefined);
  }
});
