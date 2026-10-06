import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSpec, specKey } from './render-spec.ts';
import type { FamilyAttrs } from './types.ts';

const attrs = (over: Partial<FamilyAttrs> = {}): FamilyAttrs => ({
  diameterMm: 210,
  collarDiameterMm: null,
  key: { count: 2, thicknessMm: 140, slotLengthMm: 445, backEndToSlotMm: 160, slotEnd: null },
  rear: { step: false, diameterMm: null },
  ...over,
});

test('key thickness is the section left: two opposite flats', () => {
  const r = renderSpec(attrs(), {
    tipType: 'chisel',
    lengthMm: { min: 1600, max: 1800 },
    tipAngleDeg: 50,
  });
  assert.ok(r);
  const s = r.spec;
  assert.equal(s.L, 1800);
  assert.equal(s.depth, 35);
  assert.equal(s.slotStart, 160);
  assert.equal(s.slotLen, 445);
  assert.equal(s.slotEnd, 'tapered');
  assert.equal(s.angle, 50);
  assert.equal(s.collar, null);
  assert.ok(r.assumptions.some((a) => a.includes('1600–1800')));
});

test('one key: depth = D − t, rounded end; slot measured from the very back end', () => {
  const r = renderSpec(
    attrs({
      diameterMm: 52.5,
      key: { count: 1, thicknessMm: 39, slotLengthMm: 76, backEndToSlotMm: 70, slotEnd: null },
      rear: { step: null, diameterMm: 41 },
    }),
    { tipType: 'moil', lengthMm: { min: 580, max: 580 }, tipAngleDeg: null },
  );
  assert.ok(r);
  assert.equal(r.spec.depth, 13.5);
  assert.equal(r.spec.slotEnd, 'rounded');
  assert.equal(r.spec.rearStep, true);
  assert.equal(r.spec.Rs, 20.5);
  assert.equal(r.spec.stubLen, 36.8);
  assert.equal(r.spec.slotStart, 70);
  assert.equal(r.spec.angle, 28);
});

test('the collar is a short ring past the slot', () => {
  const r = renderSpec(
    attrs({
      diameterMm: 32,
      collarDiameterMm: 48,
      key: { count: 2, thicknessMm: 21, slotLengthMm: 51, backEndToSlotMm: 48, slotEnd: 'rounded' },
    }),
    { tipType: 'chisel', lengthMm: { min: 415, max: 415 }, tipAngleDeg: null },
  );
  assert.ok(r);
  assert.deepEqual(r.spec.collar, { Rc: 24, start: 150.2, width: 11.2 });
  assert.equal(r.spec.slotEnd, 'rounded');
});

test('implausible or missing key data falls back to a labelled default depth', () => {
  const bad = renderSpec(
    attrs({
      diameterMm: 110,
      key: { count: 1, thicknessMm: 110, slotLengthMm: 100, backEndToSlotMm: 90, slotEnd: null },
    }),
    { tipType: 'blunt', lengthMm: null, tipAngleDeg: 45 },
  );
  assert.ok(bad);
  assert.equal(bad.spec.depth, 15.4);
  assert.equal(bad.spec.angle, null);
  assert.equal(bad.spec.L, 1100);
  assert.ok(bad.assumptions.some((a) => a.includes('implausible')));
});

test('drawing-derived stub length, collar position and chisel edge win over the defaults', () => {
  const r = renderSpec(
    attrs({
      collarDiameterMm: 240,
      rear: { step: true, diameterMm: 170, stubLengthMm: 120 },
      collarEndMm: 900,
      chiselEdge: 'parallel',
    }),
    { tipType: 'pyramid', lengthMm: null, tipAngleDeg: null },
  );
  assert.ok(r);
  assert.equal(r.spec.stubLen, 120);
  assert.equal(r.spec.slotStart, 160);
  assert.equal(r.spec.collar?.start, 900);
  assert.equal(r.spec.chiselEdge, 'parallel');
});

test('asphalt is not supported yet', () => {
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
