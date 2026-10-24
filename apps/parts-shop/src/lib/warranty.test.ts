import { test } from 'node:test';
import assert from 'node:assert/strict';
import { warrantyMonths } from './warranty.ts';

test('warrantyMonths: front heads and pistons 6, bushings 3, other parts and tips 2', () => {
  assert.equal(warrantyMonths('alt-govde'), 6);
  assert.equal(warrantyMonths('piston'), 6);
  assert.equal(warrantyMonths('burc'), 3);
  for (const k of ['kama', 'saplama', 'akumulator', 'asinma-plakasi', 'tamir-takimi'] as const) {
    assert.equal(warrantyMonths(k), 2, k);
  }
  assert.equal(warrantyMonths(), 2);
  assert.equal(warrantyMonths(null), 2);
});
