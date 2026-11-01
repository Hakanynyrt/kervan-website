import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fmtGrossTry,
  fmtTryCents,
  grossTryCents,
  tryDecimal,
  VAT_PERCENT,
  vatOf,
} from './price.ts';

// Invented values only: never a catalogue price.
const fx = (usdTry: number) => ({ usdTry, date: '2026-01-05' });

test('grossTryCents: (net + vatOf(net)) × rate, rounded once to whole lira', () => {
  for (const net of [100, 1234, 5000, 99_999, 250_001]) {
    for (const rate of [1.5, 33.3333, 41.9876]) {
      const expected = Math.round(((net + vatOf(net)) / 100) * rate) * 100;
      assert.equal(grossTryCents(net, fx(rate)), expected, `${net} @ ${rate}`);
    }
  }
});

test('grossTryCents: no other factor (VAT is the only addition)', () => {
  // 100.00 USD net at rate 10: 100 × 1.2 × 10 = 1200 TL exactly.
  assert.equal(VAT_PERCENT, 20);
  assert.equal(grossTryCents(10_000, fx(10)), 120_000);
  // Rate 1: the gross equals net + VAT, to the lira.
  assert.equal(grossTryCents(10_000, fx(1)), 12_000);
});

test('grossTryCents: rounds once, half up, to whole lira', () => {
  // 1.00 USD net → 1.20 USD gross; × 2.5 = 3.00 TL; × 2.6 = 3.12 → 3 TL; × 2.95 = 3.54 → 4 TL.
  assert.equal(grossTryCents(100, fx(2.5)), 300);
  assert.equal(grossTryCents(100, fx(2.6)), 300);
  assert.equal(grossTryCents(100, fx(2.95)), 400);
  // Rounding the net TL first, then adding VAT, would give a different figure here; we do not.
  const net = 130;
  const rate = 1.9;
  const twice = Math.round((net / 100) * rate) + Math.round((vatOf(net) / 100) * rate);
  assert.equal(grossTryCents(net, fx(rate)), Math.round(((net + vatOf(net)) / 100) * rate) * 100);
  assert.notEqual(twice * 100, grossTryCents(net, fx(rate)));
});

test('grossTryCents: whole lira, null without a rate', () => {
  assert.equal(grossTryCents(777, null), null);
  const g = grossTryCents(12_345, fx(37.123));
  assert.ok(g !== null && g % 100 === 0);
});

test('fmtTryCents / fmtGrossTry / tryDecimal', () => {
  assert.equal(fmtTryCents(1_234_500, 'tr'), '12.345 TL');
  assert.equal(fmtGrossTry(10_000, fx(10), 'tr'), '1.200 TL');
  assert.equal(fmtGrossTry(10_000, null, 'tr'), null);
  assert.equal(tryDecimal(120_000), '1200.00');
});
