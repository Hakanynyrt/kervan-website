import { test } from 'node:test';
import assert from 'node:assert/strict';
import { warrantyMonths } from './warranty.ts';

test('warrantyMonths: front heads and pistons 6, other parts and tips 2', () => {
  assert.equal(warrantyMonths('alt-govde'), 6);
  assert.equal(warrantyMonths('piston'), 6);
  for (const k of [
    'burc',
    'kama',
    'saplama',
    'akumulator',
    'asinma-plakasi',
    'tamir-takimi',
  ] as const) {
    assert.equal(warrantyMonths(k), 2, k);
  }
  assert.equal(warrantyMonths(), 2);
  assert.equal(warrantyMonths(null), 2);
});
