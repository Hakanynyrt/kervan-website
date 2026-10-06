import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSpec, specKey } from './render-spec.ts';
import type { FamilyAttrs } from './types.ts';

const attrs = (over: Partial<FamilyAttrs> = {}): FamilyAttrs => ({
  diameterMm: 135,
  collarDiameterMm: 150,
  key: { count: 2, thicknessMm: 30, slotLengthMm: 120, backEndToSlotMm: 80, slotEnd: 'rounded' },
  rear: { step: false, diameterMm: null },
  ...over,
});

test('uses the longest length, the row angle and the measured slot', () => {
  const r = renderSpec(attrs(), {
    tipType: 'chisel',
    lengthMm: { min: 1200, max: 1300 },
    tipAngleDeg: 50,
  });
  assert.ok(r);
  const s = r.spec;
  assert.equal(s.L, 1300);
  assert.equal(s.angle, 50);
  assert.equal(s.keyCount, 2);
  assert.equal(s.t, 30);
  assert.equal(s.slotStart, 80);
  assert.equal(s.slotLen, 120);
  assert.equal(s.hasCollar, true);
  assert.equal(s.Rb, 75);
  assert.equal(s.R, 67.5);
  assert.equal(s.chiselEdge, 'perpendicular');
  assert.ok(r.assumptions.some((a) => a.includes('1200–1300')));
});

test('falls back to labelled defaults when data is missing', () => {
  const r = renderSpec(
    attrs({
      collarDiameterMm: null,
      key: {
        count: null,
        thicknessMm: null,
        slotLengthMm: null,
        backEndToSlotMm: null,
        slotEnd: null,
      },
    }),
    { tipType: 'moil', lengthMm: null, tipAngleDeg: null },
  );
  assert.ok(r);
  assert.equal(r.spec.L, 1350);
  assert.equal(r.spec.angle, 28);
  assert.equal(r.spec.keyCount, 1);
  assert.equal(r.spec.slotEnd, 'rounded');
  assert.equal(r.spec.hasCollar, false);
  assert.ok(r.assumptions.length >= 5);
});

test('drawing-derived collar end, stub length and chisel edge win over the defaults', () => {
  const r = renderSpec(
    attrs({
      rear: { step: true, diameterMm: 110, stubLengthMm: 40 },
      collarEndMm: 300,
      chiselEdge: 'parallel',
    }),
    { tipType: 'chisel', lengthMm: { min: 1300, max: 1300 }, tipAngleDeg: null },
  );
  assert.ok(r);
  assert.equal(r.spec.collarEnd, 300);
  assert.equal(r.spec.stubLen, 40);
  assert.equal(r.spec.Rs, 55);
  assert.equal(r.spec.chiselEdge, 'parallel');
});

test('blunt has no angle; asphalt is not supported yet', () => {
  const b = renderSpec(attrs(), { tipType: 'blunt', lengthMm: null, tipAngleDeg: 45 });
  assert.equal(b?.spec.angle, null);
  assert.equal(
    renderSpec(attrs(), { tipType: 'asphalt', lengthMm: null, tipAngleDeg: null }),
    null,
  );
});

test('specKey is stable for equal specs and changes with the geometry', () => {
  const sku = { tipType: 'chisel' as const, lengthMm: { min: 1300, max: 1300 }, tipAngleDeg: null };
  const a = renderSpec(attrs(), sku)!.spec;
  const b = renderSpec(attrs(), sku)!.spec;
  const c = renderSpec(attrs(), { ...sku, lengthMm: { min: 1250, max: 1250 } })!.spec;
  assert.match(specKey(a), /^[0-9a-f]{16}$/);
  assert.equal(specKey(a), specKey(b));
  assert.notEqual(specKey(a), specKey(c));
});
