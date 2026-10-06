import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromCatalog, type SourceRow } from './from-catalog.ts';

const row = (over: Partial<SourceRow>): SourceRow => ({
  id: 'r1',
  model: 'Acme AB 100',
  brand: 'Acme',
  fitsBreakers: [],
  tipTypes: ['chisel', 'moil'],
  diameterMm: 135,
  collarDiameterMm: 150,
  key: { count: 2, thicknessMm: 30, slotLengthMm: 120, backEndToSlotMm: 80 },
  rearShoulderDiameterMm: null,
  lengthMm: { min: 1200, max: 1300 },
  lengthByType: { moil: { min: 1250, max: 1250 } },
  weightKg: { min: 140, max: 150 },
  weightByType: null,
  rearStep: false,
  slotEnd: 'rounded',
  tipAngleDeg: 45,
  ...over,
});

test('maps a row to a family with codes, attrs, fits and one SKU per type', () => {
  const { families, skipped } = fromCatalog(
    [row({ fitsBreakers: ['Acme AB 100', 'Other X 5', 'Acme AB 110'] })],
    { models: { 'Acme AB 100': 1 } },
    new Map(),
  );
  assert.equal(skipped.length, 0);
  const f = families[0];
  assert.equal(f.ref, 'r1');
  assert.equal(f.code, 'KU135-01');
  assert.equal(f.popularTier, 1);
  assert.deepEqual(f.attrs, {
    diameterMm: 135,
    collarDiameterMm: 150,
    key: { count: 2, thicknessMm: 30, slotLengthMm: 120, backEndToSlotMm: 80, slotEnd: 'rounded' },
    rear: { step: false, diameterMm: null },
  });
  assert.deepEqual(
    f.fits.map((b) => b.slug),
    ['acme/ab-100', 'diger/other-x-5', 'acme/ab-110'],
  );
  assert.deepEqual(
    f.skus.map((s) => [s.code, s.tipType, s.lengthMm, s.weightKg, s.tipAngleDeg]),
    [
      ['KU135-01-C', 'chisel', { min: 1200, max: 1300 }, { min: 140, max: 150 }, null],
      ['KU135-01-M', 'moil', { min: 1250, max: 1250 }, { min: 140, max: 150 }, null],
    ],
  );
});

test('the drawn tip angle is kept only when the row has a single tip type', () => {
  const { families } = fromCatalog([row({ tipTypes: ['moil'] })], null, new Map());
  assert.equal(families[0].skus[0].tipAngleDeg, 45);
});

test('rows without a diameter or a known tip type are skipped with a reason', () => {
  const { families, skipped } = fromCatalog(
    [row({ id: 'a', diameterMm: null }), row({ id: 'b', tipTypes: ['unknown'] })],
    null,
    new Map(),
  );
  assert.equal(families.length, 0);
  assert.deepEqual(skipped, [
    { ref: 'a', reason: 'no-diameter' },
    { ref: 'b', reason: 'no-tip-type' },
  ]);
});

test('popular tiers outside 1|2 are ignored and existing codes are kept', () => {
  const { families } = fromCatalog(
    [row({})],
    { models: { 'Acme AB 100': 7 } },
    new Map([['r1', 'KU135-04']]),
  );
  assert.equal(families[0].popularTier, null);
  assert.equal(families[0].code, 'KU135-04');
});
