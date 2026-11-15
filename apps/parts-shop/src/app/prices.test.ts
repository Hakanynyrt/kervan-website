import assert from 'node:assert/strict';
import test from 'node:test';
import type { PageModel } from '../lib/routes';
import { pageShowsPrices } from './prices.ts';

const m = (v: object) => v as unknown as PageModel;

test('a page with no price field filled shows no price', () => {
  assert.equal(pageShowsPrices(m({ kind: 'guide', demo: false })), false);
  assert.equal(
    pageShowsPrices(m({ kind: 'partItem', price: null, priceFitted: null, related: [] })),
    false,
  );
  assert.equal(pageShowsPrices(m({ kind: 'brand', rows: [{ price: null, name: 'A 1' }] })), false);
  assert.equal(pageShowsPrices(m({ kind: 'part', prices: {}, listed: [] })), false);
});

test('a price anywhere in the page props counts', () => {
  assert.ok(pageShowsPrices(m({ kind: 'partItem', price: 1200, priceFitted: null })));
  assert.ok(pageShowsPrices(m({ kind: 'partItem', price: null, priceFitted: 900 })));
  assert.ok(pageShowsPrices(m({ kind: 'part', prices: { a: 500 }, listed: [] })));
  assert.ok(pageShowsPrices(m({ kind: 'list', rows: [{ price: null }, { price: [100, 200] }] })));
  assert.ok(
    pageShowsPrices(m({ kind: 'breaker', families: [{ skus: [{ priceUsdNetCents: 4500 }] }] })),
  );
  assert.ok(pageShowsPrices(m({ kind: 'home', made: [{ kind: 'part', cents: 300 }] })));
});

test('other numbers are not prices', () => {
  assert.equal(pageShowsPrices(m({ kind: 'breaker', diameterMm: 135, n: 2 })), false);
  assert.equal(pageShowsPrices(m({ kind: 'home', tips: { families: 6, skus: 40 } })), false);
});
