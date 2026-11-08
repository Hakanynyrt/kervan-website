import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fxFromShopHtml, grossTryCents, vatOf } from './price-math.ts';

// Invented amounts only.
test('grossTryCents adds VAT and rounds once to whole lira', () => {
  assert.equal(vatOf(10000), 2000);
  assert.equal(grossTryCents(10000, { usdTry: 10.5, date: '2026-01-05' }), 126000);
  assert.equal(grossTryCents(10000, null), null);
});

test('fxFromShopHtml reads the page rate and refuses junk', () => {
  assert.deepEqual(fxFromShopHtml('x"fx":{"usdTry":10.5,"date":"2026-01-05"}y'), {
    usdTry: 10.5,
    date: '2026-01-05',
  });
  assert.equal(fxFromShopHtml('"fx":null'), null);
  assert.equal(fxFromShopHtml('"fx":{"usdTry":0.5,"date":"2026-01-05"}'), null);
});
