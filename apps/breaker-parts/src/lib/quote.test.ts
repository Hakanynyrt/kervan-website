import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuote, quoteText } from './quote.ts';

// Invented amounts only: real prices never go in the repo.
const L = {
  gross: '{v} TL (KDV dahil)',
  net: '{v} USD + KDV',
  ask: 'Teklif',
  inStock: 'Stokta {n}',
  lead: '~{n} gün',
  noStock: 'Sorun',
};
const FX = { usdTry: 10.5, date: '2026-01-05' };

test('parseQuote groups by family and drops junk', () => {
  const q = parseQuote({
    skus: [
      {
        family: 'KU1-01',
        code: 'KU1-01-C',
        tipType: 'chisel',
        priceUsdNetCents: 10000,
        stock: 2,
        leadDays: null,
      },
      {
        family: 'KU1-01',
        code: 'KU1-01-M',
        tipType: 'moil',
        priceUsdNetCents: null,
        stock: 0,
        leadDays: 7,
      },
      { code: 'x' },
      null,
    ],
    fx: FX,
  });
  assert.ok(q);
  assert.equal(q.byFamily.get('KU1-01')?.length, 2);
  assert.deepEqual(q.fx, FX);
  assert.equal(parseQuote({}), null);
});

test('quoteText shows the shop price form and availability', () => {
  const q = parseQuote({
    skus: [
      {
        family: 'F',
        code: 'A',
        tipType: 'chisel',
        priceUsdNetCents: 10000,
        stock: 2,
        leadDays: null,
      },
      { family: 'F', code: 'B', tipType: 'moil', priceUsdNetCents: null, stock: 0, leadDays: 7 },
      {
        family: 'F',
        code: 'C',
        tipType: 'blunt',
        priceUsdNetCents: 10000,
        stock: 0,
        leadDays: null,
      },
    ],
    fx: null,
  })!;
  const [a, b, c] = q.byFamily.get('F')!;
  assert.deepEqual(quoteText(a, FX, 'tr', L), {
    price: '1.260 TL (KDV dahil) · 100 USD + KDV',
    avail: 'Stokta 2',
  });
  assert.deepEqual(quoteText(b, FX, 'tr', L), { price: 'Teklif', avail: '~7 gün' });
  assert.deepEqual(quoteText(c, null, 'tr', L), { price: '100 USD + KDV', avail: 'Sorun' });
});
