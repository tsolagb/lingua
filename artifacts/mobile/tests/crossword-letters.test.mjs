import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCrosswordWord } from '../lib/crossword-letters.ts';

test('normalizes accented Latin letters for crossword cells', () => {
  assert.equal(normalizeCrosswordWord('città!'), 'CITTA');
});

test('preserves Greek letters and strips tonos', () => {
  assert.equal(normalizeCrosswordWord('Άνθρωπος'), 'ΑΝΘΡΩΠΟΣ');
  assert.equal(normalizeCrosswordWord('λόγος'), 'ΛΟΓΟΣ');
});

test('preserves Armenian letters', () => {
  assert.equal(normalizeCrosswordWord('բարեւ'), 'ԲԱՐԵՒ');
});
