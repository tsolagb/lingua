import assert from 'node:assert/strict';
import test from 'node:test';
import { recordingDeadline } from '../lib/recording-deadline.ts';

test('a recording expires at 25 seconds only if it was not stopped or cancelled', context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let stops = 0;
  const clear = recordingDeadline(() => stops++);
  context.mock.timers.tick(24_999);
  assert.equal(stops, 0);
  clear();
  context.mock.timers.tick(25_000);
  assert.equal(stops, 0, 'manual stop must prevent a delayed second stop on a disposed recorder');
  recordingDeadline(() => stops++);
  context.mock.timers.tick(25_000);
  assert.equal(stops, 1);
});
