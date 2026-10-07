import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rearSpec, renderSpec, specKey } from './render-spec.ts';
import type { FamilyAttrs, ShankProfile } from './types.ts';

const attrs = (over: Partial<FamilyAttrs> = {}): FamilyAttrs => ({
  diameterMm: 210,
  collarDiameterMm: null,
  key: { count: 2, thicknessMm: 140, slotLengthMm: 445, backEndToSlotMm: 160, slotEnd: null },
  rear: { step: false, diameterMm: null },
  ...over,
});

test('table: two opposite flats leave the printed section between them', () => {
  const r = renderSpec(attrs(), {
    tipType: 'chisel',
    lengthMm: { min: 1600, max: 1800 },
    tipAngleDeg: 50,
  });
  assert.ok(r);
  const s = r.spec;
  assert.equal(s.L, 1800);
  assert.equal(s.slot.floor, 70); // 140 / 2: depth (210 − 140) / 2 = 35 per side
  assert.equal(s.slot.rs, 105);
  assert.equal(s.slot.start, 160);
  assert.equal(s.slot.len, 445);
  assert.equal(s.slot.front.kind, 'ramp');
  assert.equal(s.angle, 50);
  assert.equal(s.sections.length, 1);
  assert.ok(r.assumptions.some((a) => a.includes('1600–1800')));
  assert.ok(r.assumptions.some((a) => a.includes('no drawing profile')));
});

test('table: one key leaves the section to the far side; rear stub from the table Ø', () => {
  const r = renderSpec(
    attrs({
      diameterMm: 52.5,
      key: { count: 1, thicknessMm: 39, slotLengthMm: 76, backEndToSlotMm: 70, slotEnd: null },
      rear: { step: null, diameterMm: 41 },
    }),
    { tipType: 'moil', lengthMm: { min: 580, max: 580 }, tipAngleDeg: null },
  );
  assert.ok(r);
  const s = r.spec;
  assert.equal(s.slot.floor, 12.8); // 39 − 26.25: flat 13.5 below the top
  assert.equal(s.slot.front.kind, 'radius');
  assert.equal(s.sections[0].r, 20.5);
  assert.equal(s.sections[0].y1, 36.8);
  assert.equal(s.angle, 28);
});

test('table: the collar is a short ring past the slot', () => {
  const r = renderSpec(
    attrs({
      diameterMm: 32,
      collarDiameterMm: 48,
      key: { count: 2, thicknessMm: 21, slotLengthMm: 51, backEndToSlotMm: 48, slotEnd: 'rounded' },
    }),
    { tipType: 'chisel', lengthMm: { min: 415, max: 415 }, tipAngleDeg: null },
  );
  assert.ok(r);
  const [shank, collar] = r.spec.sections;
  assert.equal(shank.y1, 150.2);
  assert.equal(collar.r, 24);
  assert.equal(collar.y1, 161.4);
  assert.equal(r.spec.slot.front.kind, 'radius');
});

const profile: ShankProfile = {
  backChamferMm: 3,
  sections: [
    { diameterMm: 115, lengthMm: 60, step: { kind: 'chamfer', lengthMm: 6 } },
    { diameterMm: 165, lengthMm: 900, step: { kind: 'taper', lengthMm: 20 } },
    { diameterMm: 150, lengthMm: null, step: null },
  ],
  slot: {
    count: 2,
    startMm: 235,
    lengthMm: 190,
    sectionMm: 113,
    back: { kind: 'radius', lengthMm: 24 },
    front: { kind: 'ramp', lengthMm: 70 },
  },
};

test('a drawing profile is used as printed: sections, slot ends and the shank it cuts', () => {
  const r = renderSpec(attrs({ diameterMm: 150, collarDiameterMm: 165, profile }), {
    tipType: 'moil',
    lengthMm: { min: 1510, max: 1510 },
    tipAngleDeg: null,
  });
  assert.ok(r);
  const s = r.spec;
  assert.deepEqual(
    s.sections.map((x) => [x.r, x.y0, x.y1]),
    [
      [57.5, 0, 60],
      [82.5, 60, 960],
      [75, 960, 1510],
    ],
  );
  assert.equal(s.D, 150);
  assert.equal(s.slot.rs, 82.5); // cut into the Ø165 shank, not the Ø150 working end
  assert.equal(s.slot.floor, 56.5);
  assert.deepEqual(s.slot.front, { kind: 'ramp', len: 70 });
  assert.ok(!r.assumptions.some((a) => a.includes('no drawing profile')));
});

test('an outline that leaves no room for the working end is refused', () => {
  const r = renderSpec(attrs({ diameterMm: 150, profile }), {
    tipType: 'blunt',
    lengthMm: { min: 1000, max: 1000 },
    tipAngleDeg: null,
  });
  assert.equal(r, null);
});

test('implausible key data falls back to a labelled default depth', () => {
  const bad = renderSpec(
    attrs({
      diameterMm: 110,
      key: { count: 1, thicknessMm: 110, slotLengthMm: 100, backEndToSlotMm: 90, slotEnd: null },
    }),
    { tipType: 'blunt', lengthMm: null, tipAngleDeg: 45 },
  );
  assert.ok(bad);
  assert.equal(bad.spec.slot.floor, 39.6); // 0.14·D below the top
  assert.equal(bad.spec.angle, null);
  assert.equal(bad.spec.L, 1100);
  assert.ok(bad.assumptions.some((a) => a.includes('implausible')));
});

test('asphalt is not supported yet', () => {
  assert.equal(
    renderSpec(attrs(), { tipType: 'asphalt', lengthMm: null, tipAngleDeg: null }),
    null,
  );
});

test('specKey: stable, changes with geometry and view; the rear view ignores the working end', () => {
  const sku = { tipType: 'chisel' as const, lengthMm: { min: 1300, max: 1300 }, tipAngleDeg: null };
  const a = renderSpec(attrs(), sku)!.spec;
  const b = renderSpec(attrs(), sku)!.spec;
  const c = renderSpec(attrs(), { ...sku, lengthMm: { min: 1250, max: 1250 } })!.spec;
  const m = renderSpec(attrs(), { ...sku, tipType: 'moil' })!.spec;
  assert.match(specKey(a), /^[0-9a-f]{16}$/);
  assert.equal(specKey(a), specKey(b));
  assert.notEqual(specKey(a), specKey(c));
  assert.notEqual(specKey(a), specKey(a, 'side'));
  assert.equal(specKey(rearSpec(a), 'rear'), specKey(rearSpec(m), 'rear'));
});

test('uneven two-key slot: the cut depth is split between the key side and the far side', () => {
  const p: ShankProfile = {
    ...profile,
    slot: { ...profile.slot, sectionMm: 125, splitTop: 0.8 },
  };
  const r = renderSpec(attrs({ diameterMm: 150, profile: p }), {
    tipType: 'moil',
    lengthMm: { min: 1510, max: 1510 },
    tipAngleDeg: null,
  });
  assert.ok(r);
  // shank Ø165, section 125 → 40 mm cut in total: 32 on the key side, 8 opposite.
  assert.equal(r.spec.slot.floor, 50.5);
  assert.equal(r.spec.slot.floorB, 74.5);
});
