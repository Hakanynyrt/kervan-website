import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitChips, rowsOf } from './chip-rows.ts';

test('rows of a wrapping chip row', () => {
  assert.equal(rowsOf([], 100, 8), 0);
  assert.equal(rowsOf([40, 40], 88, 8), 1);
  assert.equal(rowsOf([40, 40], 87, 8), 2);
  assert.equal(rowsOf([40, 40, 40, 40], 100, 8), 2);
  // A chip wider than the row takes a row of its own.
  assert.equal(rowsOf([40, 150, 40], 100, 8), 3);
});

test('two rows of chips, the rest left out', () => {
  // Two chips a row: four shown.
  assert.deepEqual(fitChips([40, 40, 40, 40, 40, 40], -1, 100, 8), [0, 1, 2, 3]);
  // All fit.
  assert.deepEqual(fitChips([40, 40], -1, 100, 8), [0, 1]);
});

test('the picked chip is always shown, at its place', () => {
  // Picked chip 5 replaces the fourth: still two rows.
  assert.deepEqual(fitChips([40, 40, 40, 40, 40, 40], 5, 100, 8), [0, 1, 2, 5]);
  // A wide picked chip takes a row: one chip before it.
  assert.deepEqual(fitChips([40, 40, 40, 40, 90], 4, 100, 8), [0, 1, 4]);
  // Within the first rows: nothing moves.
  assert.deepEqual(fitChips([40, 40, 40, 40, 40, 40], 1, 100, 8), [0, 1, 2, 3]);
});
