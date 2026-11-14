import assert from 'node:assert/strict';
import test from 'node:test';
import type { CartItem } from './cart.ts';
import { lineTryCents, localDay, paletSum } from './palet-quote.ts';
import { grossTryCents, vatOf } from './price.ts';

// Invented values only: never a catalogue price.
const fx = { usdTry: 10, date: '2026-01-05' };
const line = (id: string, cents: number | null, qty: number): CartItem => ({
  id,
  name: id,
  code: null,
  path: '/kirici/ornek/m-1',
  cents,
  qty,
});
const PRICED = line('a', 10_000, 2);
const SECOND = line('b', 104, 3);
const ASK = line('c', null, 5);

test('paletSum: "fiyat sorulacak" lines stay out of the subtotal, taxes and total', () => {
  const s = paletSum([PRICED, ASK], 'tr', null);
  assert.equal(s.totalCents, 20_000);
  assert.equal(s.vatCents, vatOf(20_000));
  assert.equal(s.grossCents, 20_000 + vatOf(20_000));
  assert.equal(s.anyAsk, true);
  assert.equal(s.anyPriced, true);
  assert.deepEqual(paletSum([PRICED], 'tr', null), { ...s, anyAsk: false });
});

test('paletSum: a palet of unpriced lines only adds up to nothing', () => {
  for (const lang of ['tr', 'en'] as const)
    assert.deepEqual(paletSum([ASK], lang, lang === 'tr' ? fx : null), {
      totalCents: 0,
      vatCents: 0,
      grossCents: 0,
      anyAsk: true,
      anyPriced: false,
      totalTry: lang === 'tr' ? 0 : null,
    });
});

test('paletSum: taxes on Turkish pages only; English pages keep the export price', () => {
  const en = paletSum([PRICED, SECOND], 'en', fx);
  assert.equal(en.totalCents, 20_000 + 312);
  assert.equal(en.vatCents, 0);
  assert.equal(en.grossCents, en.totalCents);
  // English pages lead with USD even with a rate.
  assert.equal(en.totalTry, null);
});

test('paletSum: the TL total is the sum of the lines as shown (unit gross TL × quantity)', () => {
  const list = [PRICED, SECOND, ASK];
  const s = paletSum(list, 'tr', fx);
  assert.equal(lineTryCents(PRICED, 'tr', fx), grossTryCents(10_000, fx)! * 2);
  assert.equal(lineTryCents(SECOND, 'tr', fx), grossTryCents(104, fx)! * 3);
  assert.equal(s.totalTry, grossTryCents(10_000, fx)! * 2 + grossTryCents(104, fx)! * 3);
  // Each unit is rounded to the lira before it is multiplied, as on the product pages.
  assert.notEqual(grossTryCents(104, fx)! * 3, grossTryCents(312, fx));
  // The USD rows are the same with or without a rate.
  const { totalTry, ...usd } = paletSum(list, 'tr', null);
  assert.equal(totalTry, null);
  assert.deepEqual({ ...usd, totalTry: s.totalTry }, s);
});

test('lineTryCents: null without a price, without a rate and on English pages', () => {
  assert.equal(lineTryCents(ASK, 'tr', fx), null);
  assert.equal(lineTryCents(PRICED, 'tr', null), null);
  assert.equal(lineTryCents(PRICED, 'en', fx), null);
});

test('localDay: the local calendar day, zero-padded', () => {
  assert.equal(localDay(new Date(2026, 10, 13, 23, 59, 59)), '2026-11-13');
  assert.equal(localDay(new Date(2026, 0, 5, 0, 0, 0)), '2026-01-05');
  assert.equal(localDay(new Date(2027, 11, 31, 12)), '2027-12-31');
});
