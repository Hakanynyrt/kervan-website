import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyTipFilter,
  byPopularity,
  EMPTY_FILTER,
  facetsOf,
  isFilterActive,
  parseTipFilter,
  tipFilterToSearch,
} from './tip-filter.ts';
import { CARRIER_BANDS, carrierBand, carrierTons } from './usage.ts';
import type { TipType } from './types.ts';

const row = (
  name: string,
  diameterMm: number | null,
  types: TipType[] = ['chisel', 'moil'],
  extra: { grooved?: boolean; popularTier?: 1 | 2 | null } = {},
) => ({ name, diameterMm, types, grooved: extra.grooved, popularTier: extra.popularTier ?? null });

test('carrierBand: boundaries are half-open, no tonnage below Ø75 or from Ø210', () => {
  assert.equal(carrierBand(74.99)?.key, 'lt75');
  assert.equal(carrierBand(74.99)?.tons, null);
  assert.equal(carrierBand(75)?.key, '75-99');
  assert.equal(carrierBand(99.99)?.key, '75-99');
  assert.equal(carrierBand(100)?.key, '100-114');
  assert.equal(carrierBand(209.99)?.key, '180-209');
  assert.equal(carrierBand(210)?.key, 'ge210');
  assert.equal(carrierBand(210)?.tons, null);
  assert.equal(carrierBand(null), null);
});

test('carrierBand: bands touch without gaps', () => {
  for (let i = 1; i < CARRIER_BANDS.length; i++)
    assert.equal(CARRIER_BANDS[i].from, CARRIER_BANDS[i - 1].below);
});

test('carrierTons keeps its values', () => {
  assert.deepEqual(carrierTons(135), { min: 16, max: 26 });
  assert.deepEqual(carrierTons(209.99), { min: 50, max: 88 });
  assert.equal(carrierTons(74.99), null);
  assert.equal(carrierTons(210), null);
});

test('facetsOf: only values the rows have', () => {
  const f = facetsOf([row('A 1', 120), row('A 2', 125, ['chisel']), row('A 3', 185)]);
  assert.deepEqual(f.types, ['chisel', 'moil']);
  assert.deepEqual(
    f.bands.map((b) => b.key),
    ['115-129', '180-209'],
  );
  assert.equal(f.grooved, false);
  assert.equal(facetsOf([row('A 1', 120, ['chisel'], { grooved: true })]).grooved, true);
});

test('facetsOf: no type choice when every row takes every type', () => {
  assert.deepEqual(facetsOf([row('A 1', 120), row('A 2', 140)]).types, []);
  assert.deepEqual(facetsOf([]), { types: [], bands: [], grooved: false });
});

test('applyTipFilter: filters combine with AND, order kept', () => {
  const rows = [
    row('A 1', 120, ['chisel', 'moil'], { grooved: true }),
    row('A 2', 125, ['chisel']),
    row('A 3', 185, ['chisel', 'moil'], { grooved: true }),
    row('A 4', null, ['moil']),
  ];
  assert.deepEqual(applyTipFilter(rows, EMPTY_FILTER), rows);
  const names = (f: Parameters<typeof applyTipFilter>[1]) =>
    applyTipFilter(rows, f).map((r) => r.name);
  assert.deepEqual(names({ tip: 'moil', cap: null, grooved: false }), ['A 1', 'A 3', 'A 4']);
  assert.deepEqual(names({ tip: 'moil', cap: '115-129', grooved: false }), ['A 1']);
  assert.deepEqual(names({ tip: null, cap: null, grooved: true }), ['A 1', 'A 3']);
  assert.deepEqual(names({ tip: 'moil', cap: '180-209', grooved: true }), ['A 3']);
  assert.deepEqual(names({ tip: 'blunt', cap: null, grooved: false }), []);
});

test('URL: round trip, other parameters kept, unknown values dropped', () => {
  const f = { tip: 'moil', cap: '180-209', grooved: true } as const;
  const s = tipFilterToSearch(f, 'q=mtb');
  assert.equal(s, 'q=mtb&tip=moil&cap=180-209&kanal=1');
  assert.deepEqual(parseTipFilter(s), f);
  assert.equal(tipFilterToSearch(EMPTY_FILTER, s), 'q=mtb');
  assert.equal(tipFilterToSearch(EMPTY_FILTER), '');
  assert.deepEqual(parseTipFilter('?tip=foo&cap=1-2&kanal=yes'), EMPTY_FILTER);
  assert.deepEqual(parseTipFilter(new URLSearchParams('tip=chisel')), {
    tip: 'chisel',
    cap: null,
    grooved: false,
  });
  assert.equal(isFilterActive(EMPTY_FILTER), false);
  assert.equal(isFilterActive(f), true);
});

test('byPopularity: tier, then diameter (unknown last), not A–Z', () => {
  const rows = [
    row('A 9', 100),
    row('Z 1', 150, undefined, { popularTier: 1 }),
    row('B 1', null),
    row('C 1', 90, undefined, { popularTier: 2 }),
    row('M 1', 140, undefined, { popularTier: 1 }),
    row('A 1', 100),
  ];
  assert.deepEqual(
    [...rows].sort(byPopularity).map((r) => r.name),
    ['M 1', 'Z 1', 'C 1', 'A 1', 'A 9', 'B 1'],
  );
});
