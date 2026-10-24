import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFitsIndex, groupByMake } from './fits-index.ts';
import { toPublicCatalog, type FamilyRow, type FitRow, type SkuRow } from './public.ts';

// Invented rows (codes, sizes and links are not catalogue data).
const attrs = (d: number, collar: number | null = null) =>
  JSON.stringify({
    diameterMm: d,
    collarDiameterMm: collar,
    key: { count: 2, thicknessMm: 20, slotLengthMm: 90, backEndToSlotMm: 60, slotEnd: null },
    rear: { step: true, diameterMm: null },
  });
const families: FamilyRow[] = [
  { id: 1, code: 'KU100-01', attrs: attrs(100, 110), popular_tier: null },
  { id: 2, code: 'KU80-05', attrs: attrs(80), popular_tier: null },
  { id: 3, code: 'KU90-01', attrs: attrs(90), popular_tier: null },
];
const sku = (family_id: number, code: string, tip_type = 'chisel'): SkuRow => ({
  family_id,
  code,
  tip_type,
  length_min_mm: 1000,
  length_max_mm: null,
  weight_min_kg: 50,
  weight_max_kg: null,
  tip_angle_deg: null,
  price_usd_net_cents: 12345,
  stock_qty: 3,
  lead_time_days: null,
});
const skus = [
  sku(1, 'KU100-01-C'),
  sku(1, 'KU100-01-M', 'moil'),
  sku(2, 'KU80-05-C'),
  sku(3, 'KU90-01-C'),
];
const fits: FitRow[] = [
  { family_id: 1, brand: 'Furukawa', model: 'F 2', slug: 'furukawa/f-2' },
  { family_id: 1, brand: 'Furukawa', model: 'F2', slug: 'furukawa/f2' },
  { family_id: 1, brand: 'Rammer', model: 'S 999', slug: 'rammer/s-999' },
  { family_id: 3, brand: 'Rammer', model: 'S 999', slug: 'rammer/s-999' },
  { family_id: 1, brand: 'VEGA', model: 'X 1', slug: 'vega/x-1' },
  // WRONG_FITS: KU80-05 does not fit diger/omal-80.
  { family_id: 2, brand: 'diger', model: 'OMAL 80', slug: 'diger/omal-80' },
  { family_id: 2, brand: 'Krupp', model: 'HM 999', slug: 'krupp/hm-999' },
];
const index = buildFitsIndex(toPublicCatalog(families, skus, fits));

test('families are sorted by diameter and carry geometry, never prices or lengths', () => {
  assert.deepEqual(
    index.families.map((f) => f.code),
    ['KU80-05', 'KU90-01', 'KU100-01'],
  );
  const f = index.families[2];
  assert.equal(f.d, 100);
  assert.equal(f.collarMm, 110);
  assert.equal(f.keyCount, 2);
  assert.equal(f.rearStep, true);
  assert.deepEqual(f.types, ['chisel', 'moil']);
  const text = JSON.stringify(index);
  assert.ok(!text.includes('12345'));
  assert.ok(!/price|length|weight|stock/i.test(text));
});

test('spellings of one model are one breaker; hidden makes and WRONG_FITS are left out', () => {
  const names = index.breakers.map((b) => b.name);
  assert.deepEqual(names, ['Furukawa F 2', 'Krupp HM 999', 'Rammer S 999']);
  assert.ok(!JSON.stringify(index).toLowerCase().includes('vega'));
  assert.ok(!names.some((n) => /omal/i.test(n)));
  const f2 = index.breakers[0];
  assert.match(f2.search, /F2/);
});

test('links run both ways: breaker → families and family → breakers', () => {
  const rammer = index.breakers.findIndex((b) => b.brand === 'Rammer');
  assert.deepEqual(
    index.breakers[rammer].families.map((i) => index.families[i].code),
    ['KU90-01', 'KU100-01'],
  );
  const ku100 = index.families.find((f) => f.code === 'KU100-01')!;
  assert.deepEqual(
    ku100.breakers.map((i) => index.breakers[i].name),
    ['Furukawa F 2', 'Rammer S 999'],
  );
});

test('groupByMake groups with counts, makes A–Z', () => {
  const all = index.breakers.map((_, i) => i);
  assert.deepEqual(
    groupByMake(index, all).map((g) => [g.brand, g.ids.length]),
    [
      ['Furukawa', 1],
      ['Krupp', 1],
      ['Rammer', 1],
    ],
  );
  assert.deepEqual(groupByMake(index, [99]), []);
});
