import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDrawings, parseDrawingOverride } from './drawings.ts';
import { toPublicCatalog, type FamilyRow, type SkuRow } from './public.ts';

// Invented values: real drawing data never enters the repository.
const famAttrs = JSON.stringify({
  diameterMm: 100,
  collarDiameterMm: 120,
  key: { count: 2, thicknessMm: 70, slotLengthMm: 150, backEndToSlotMm: 140, slotEnd: null },
  rear: { step: null, diameterMm: null },
  chiselEdge: null,
});
const families: FamilyRow[] = [
  { id: 1, code: 'KU100-01', attrs: famAttrs, popular_tier: null },
  { id: 2, code: 'KU100-02', attrs: famAttrs, popular_tier: null },
];
const sku = (family_id: number, tip_type: string): SkuRow => ({
  family_id,
  code: `KU100-0${family_id}-${tip_type === 'chisel' ? 'C' : 'M'}`,
  tip_type,
  length_min_mm: 1000,
  length_max_mm: 1000,
  weight_min_kg: 50,
  weight_max_kg: 50,
  tip_angle_deg: null,
  price_usd_net_cents: null,
  stock_qty: 0,
  lead_time_days: null,
});
const skus = [sku(1, 'chisel'), sku(1, 'moil'), sku(2, 'chisel')];

test('a drawing replaces whole attrs keys and SKU values of its family only', () => {
  const data = JSON.stringify({
    attrs: { chiselEdge: 'perpendicular', chiselLandMm: 17, collarEndMm: 400 },
    skus: { '*': { lengthMm: 1050 }, chisel: { weightKg: 55, tipAngleDeg: 30 } },
  });
  const r = applyDrawings(families, skus, [{ family_code: 'KU100-01', data }]);
  assert.equal(r.applied, 1);
  const c = toPublicCatalog(r.families, r.skus, []);
  const f1 = c.families.find((f) => f.code === 'KU100-01')!;
  const f2 = c.families.find((f) => f.code === 'KU100-02')!;
  assert.equal(f1.attrs.chiselEdge, 'perpendicular');
  assert.equal(f1.attrs.chiselLandMm, 17);
  assert.equal(f1.attrs.collarEndMm, 400);
  assert.equal(f1.attrs.key.slotLengthMm, 150); // untouched keys stay
  const [c1, m1] = f1.skus;
  assert.deepEqual(c1.lengthMm, { min: 1050, max: 1050 });
  assert.deepEqual(c1.weightKg, { min: 55, max: 55 });
  assert.equal(c1.tipAngleDeg, 30);
  assert.deepEqual(m1.lengthMm, { min: 1050, max: 1050 });
  assert.deepEqual(m1.weightKg, { min: 50, max: 50 });
  assert.equal(m1.tipAngleDeg, null);
  assert.deepEqual(f2.skus[0].lengthMm, { min: 1000, max: 1000 });
  assert.equal(f2.attrs.chiselLandMm, undefined);
});

test('malformed rows and unknown codes change nothing', () => {
  const r = applyDrawings(families, skus, [
    { family_code: 'KU100-01', data: '{not json' },
    { family_code: 'KU100-02', data: JSON.stringify({ attrs: { secret: 1 } }) },
    { family_code: 'XX1234567', data: JSON.stringify({}) },
  ]);
  assert.equal(r.applied, 0);
  assert.deepEqual(r.families, families);
  assert.deepEqual(r.skus, skus);
});

test('parseDrawingOverride refuses unknown keys, types and values', () => {
  assert.throws(() => parseDrawingOverride({ notes: 'x' }));
  assert.throws(() => parseDrawingOverride({ attrs: { privateRef: 'x' } }));
  assert.throws(() => parseDrawingOverride({ skus: { hammer: { lengthMm: 1 } } }));
  assert.throws(() => parseDrawingOverride({ skus: { chisel: { lengthMm: -1 } } }));
  assert.throws(() => parseDrawingOverride({ skus: { chisel: { priceUsd: 1 } } }));
  assert.deepEqual(parseDrawingOverride({ skus: { chisel: { tipAngleDeg: 30 } } }), {
    skus: { chisel: { tipAngleDeg: 30 } },
  });
});
