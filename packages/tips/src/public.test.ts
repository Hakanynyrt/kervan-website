import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  publicProfile,
  toPublicCatalog,
  type FamilyRow,
  type FitRow,
  type SkuRow,
} from './public.ts';

const attrs = (d: number, extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    diameterMm: d,
    collarDiameterMm: null,
    key: { count: 1, thicknessMm: null, slotLengthMm: null, backEndToSlotMm: null, slotEnd: null },
    rear: { step: null, diameterMm: null },
    ...extra,
  });

const families: FamilyRow[] = [
  { id: 1, code: 'KU150-01', attrs: attrs(150), popular_tier: null },
  { id: 2, code: 'KU135-01', attrs: attrs(135, { secretNote: 'x' }), popular_tier: 2 },
  { id: 3, code: 'KU100-01', attrs: attrs(100), popular_tier: 1 },
  { id: 4, code: 'KU120-01', attrs: attrs(120), popular_tier: null },
];
const sku = (family_id: number, code: string, over: Partial<SkuRow> = {}): SkuRow => ({
  family_id,
  code,
  tip_type: 'chisel',
  length_min_mm: 1000,
  length_max_mm: null,
  weight_min_kg: null,
  weight_max_kg: null,
  tip_angle_deg: null,
  price_usd_net_cents: null,
  stock_qty: 0,
  lead_time_days: null,
  ...over,
});
const skus: SkuRow[] = [
  sku(1, 'KU150-01-C'),
  sku(2, 'KU135-01-C', { stock_qty: 3 }),
  sku(2, 'KU135-01-X', { tip_type: 'laser' }),
  sku(3, 'KU100-01-M', { tip_type: 'moil', lead_time_days: 10 }),
];
const fits: FitRow[] = [{ family_id: 2, brand: 'Acme', model: 'AB 1', slug: 'acme/ab-1' }];

test('orders by best-seller tier, then diameter; drops families without SKUs', () => {
  const c = toPublicCatalog(families, skus, fits);
  assert.equal(c.schema, 1);
  assert.deepEqual(
    c.families.map((f) => f.code),
    ['KU100-01', 'KU135-01', 'KU150-01'],
  );
});

test('rebuilds attrs from a whitelist and drops unknown tip types', () => {
  const f = toPublicCatalog(families, skus, fits).families[1];
  assert.equal('secretNote' in f.attrs, false);
  assert.deepEqual(
    f.skus.map((s) => s.code),
    ['KU135-01-C'],
  );
  assert.deepEqual(f.fits, [{ brand: 'Acme', model: 'AB 1', slug: 'acme/ab-1' }]);
});

test('ranges fill a missing bound and availability follows stock, then lead time', () => {
  const c = toPublicCatalog(families, skus, fits);
  const byCode = new Map(c.families.flatMap((f) => f.skus).map((s) => [s.code, s]));
  assert.deepEqual(byCode.get('KU150-01-C')!.lengthMm, { min: 1000, max: 1000 });
  assert.equal(byCode.get('KU150-01-C')!.weightKg, null);
  assert.deepEqual(byCode.get('KU135-01-C')!.availability, { kind: 'stock', qty: 3 });
  assert.deepEqual(byCode.get('KU100-01-M')!.availability, { kind: 'lead', days: 10 });
  assert.deepEqual(byCode.get('KU150-01-C')!.availability, { kind: 'ask' });
});

test('the projection has no private keys anywhere', () => {
  const json = JSON.stringify(toPublicCatalog(families, skus, fits));
  for (const k of ['private_ref', 'private_notes', 'cost_try', 'secretNote', 'family_id']) {
    assert.equal(json.includes(k), false, k);
  }
});

test('a drawing profile passes field by field; anything malformed drops it', () => {
  const good = {
    backChamferMm: 3,
    sections: [
      { diameterMm: 77, lengthMm: 73, step: { kind: 'chamfer', lengthMm: 7.6 }, note: 'x' },
      { diameterMm: 100, lengthMm: null, step: null },
    ],
    slot: {
      count: 2,
      startMm: 144,
      lengthMm: 127,
      sectionMm: 68,
      back: { kind: 'radius', lengthMm: 24 },
      front: { kind: 'radius', lengthMm: 25 },
      source: 'private',
    },
    vendor: 'private',
  };
  const p = publicProfile(good);
  assert.ok(p);
  assert.deepEqual(Object.keys(p).sort(), ['backChamferMm', 'sections', 'slot']);
  assert.deepEqual(Object.keys(p.sections[0]).sort(), ['diameterMm', 'lengthMm', 'step']);
  assert.equal(JSON.stringify(p).includes('private'), false);
  assert.equal(publicProfile({ ...good, sections: [] }), null);
  assert.equal(
    publicProfile({ ...good, slot: { ...good.slot, back: { kind: 'wavy', lengthMm: 1 } } }),
    null,
  );
  assert.equal(
    publicProfile({
      ...good,
      sections: [{ diameterMm: 77, lengthMm: null, step: null }, good.sections[1]],
    }),
    null,
  );
  assert.equal(publicProfile('nope'), null);
});
