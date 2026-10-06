import { test } from 'node:test';
import assert from 'node:assert/strict';
import { breaker, splitBreakerName } from './breakers.ts';

const BRANDS = ['Atlas Copco', 'Atlas', 'Krupp', 'NPK'];

test('splitBreakerName takes the longest known brand prefix', () => {
  assert.deepEqual(splitBreakerName('Atlas  Copco MB 1700', BRANDS), {
    brand: 'Atlas Copco',
    model: 'MB 1700',
  });
  assert.deepEqual(splitBreakerName('npk gh-9', BRANDS), { brand: 'NPK', model: 'gh-9' });
});

test('splitBreakerName falls back to the given brand and keeps the name as the model', () => {
  assert.deepEqual(splitBreakerName('HB 20G', BRANDS, 'Furukawa'), {
    brand: 'Furukawa',
    model: 'HB 20G',
  });
  assert.deepEqual(splitBreakerName('Krupp', BRANDS), { brand: 'Krupp', model: '' });
});

test('breaker builds a brand/model slug, "diger" without a brand', () => {
  assert.equal(breaker('Atlas Copco', 'MB 1700').slug, 'atlas-copco/mb-1700');
  assert.equal(breaker('', 'X 12').slug, 'diger/x-12');
});
