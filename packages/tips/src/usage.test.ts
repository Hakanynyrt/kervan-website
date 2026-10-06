import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carrierTons } from './usage.ts';

test('carrierTons returns the band for a diameter', () => {
  assert.deepEqual(carrierTons(135), { min: 16, max: 26 });
  assert.deepEqual(carrierTons(75), { min: 4, max: 10 });
});

test('carrierTons has no estimate outside the data', () => {
  assert.equal(carrierTons(60), null);
  assert.equal(carrierTons(215), null);
  assert.equal(carrierTons(null), null);
});
