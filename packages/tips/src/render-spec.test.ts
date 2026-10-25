import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MOIL_NOSE,
  MOIL_NOSE_MATERIAL,
  RENDER_VERSION,
  rearSpec,
  renderFixes,
  renderSpec,
  specKey,
} from './render-spec.ts';
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

/** The key formula before renderFixes: untagged specs must keep these keys (and their images). */
const oldKey = (spec: unknown, view = 'hero'): string => {
  const text = JSON.stringify([RENDER_VERSION, view, spec]);
  let h = 0xcbf29ce484222325n;
  for (let i = 0; i < text.length; i++) {
    h ^= BigInt(text.charCodeAt(i));
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
};
const oneEnd = (rs: number, floor: number, len: number, kind: 'radius' | 'ramp' = 'radius') => ({
  slot: {
    count: 1,
    start: 160,
    len: 120,
    rs,
    floor,
    floorB: floor,
    back: { kind, len },
    front: { kind: 'ramp', len: 10 },
    chamfer: 2,
  },
});

test('renderFixes: tags the radius slot ends the old renderer drew wrong, and only those', () => {
  assert.deepEqual(renderFixes(oneEnd(52.5, 17.5, 35)), ['slot-quarter']); // l = d: the long way round
  assert.deepEqual(renderFixes(oneEnd(70, 40, 36.6)), ['slot-rim']); // arc start an ulp under rs
  assert.deepEqual(renderFixes(oneEnd(70, 40, 36.7)), []);
  assert.deepEqual(renderFixes(oneEnd(70, 40, 20)), []); // shorter than deep: drawn another way
  assert.deepEqual(renderFixes(oneEnd(52.5, 17.5, 35, 'ramp')), []);
  // Two keys: the far side's depth counts too.
  const two = oneEnd(70, 40, 20).slot;
  assert.deepEqual(renderFixes({ slot: { ...two, count: 2, floorB: 50 } }), ['slot-quarter']);
  assert.deepEqual(renderFixes({}), []);
});

test('specKey: tagged specs get new keys, every other key stays as it was', () => {
  const sku = { tipType: 'chisel' as const, lengthMm: { min: 1300, max: 1300 }, tipAngleDeg: null };
  const t = renderSpec(attrs(), sku)!.spec; // table ends: min(depth 35, 445 / 4) = 35
  assert.deepEqual(renderFixes(t), ['slot-quarter']);
  for (const view of ['hero', 'side']) assert.notEqual(specKey(t, view), oldKey(t, view));
  assert.notEqual(specKey(rearSpec(t), 'rear'), oldKey(rearSpec(t), 'rear'));
  const r20 = { kind: 'radius' as const, len: 20 };
  const a = { ...t, slot: { ...t.slot, back: r20, front: r20 } };
  assert.deepEqual(renderFixes(a), []);
  for (const view of ['hero', 'side']) assert.equal(specKey(a, view), oldKey(a, view));
  assert.equal(specKey(rearSpec(a), 'rear'), oldKey(rearSpec(a), 'rear'));
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

test('moil nose: the shared relative profile scaled to D; other types have none', () => {
  const sku = { lengthMm: { min: 1300, max: 1300 }, tipAngleDeg: null };
  const m = renderSpec(attrs(), { ...sku, tipType: 'moil' })!.spec;
  assert.ok(m.nose);
  assert.equal(m.nose.v.length, MOIL_NOSE.length);
  assert.equal(m.nose.m.length, m.nose.v.length - 1);
  assert.deepEqual(m.nose.m, [...MOIL_NOSE_MATERIAL]);
  // Scaled by D, last vertex on the body radius, radii and distances only grow towards the body.
  const last = m.nose.v[m.nose.v.length - 1];
  assert.ok(Math.abs(last[1] - m.D / 2) < 0.01);
  for (let i = 1; i < m.nose.v.length; i++) {
    assert.ok(m.nose.v[i][0] > m.nose.v[i - 1][0]);
    assert.ok(m.nose.v[i][1] > m.nose.v[i - 1][1]);
  }
  // A short blunt cone: the whole nose is about one diameter long and the tip face is small.
  assert.ok(last[0] < 1.25 * m.D);
  assert.ok(m.nose.v[0][1] < 0.1 * m.D);
  // Same relative profile whatever the table angle.
  const other = renderSpec(attrs(), { ...sku, tipType: 'moil', tipAngleDeg: 40 })!.spec;
  assert.deepEqual(other.nose, m.nose);
  MOIL_NOSE.forEach(([x, r], i) => {
    assert.ok(Math.abs(m.nose!.v[i][0] - x * m.D) < 0.01);
    assert.ok(Math.abs(m.nose!.v[i][1] - r * m.D) < 0.01);
  });
  for (const type of ['conical', 'chisel', 'pyramid', 'blunt'] as const)
    assert.equal(renderSpec(attrs(), { ...sku, tipType: type })!.spec.nose, undefined);
});

test('chisel: 30° and a 0.17·D edge land by default; the data wins when it has them', () => {
  const sku = { tipType: 'chisel' as const, lengthMm: { min: 1300, max: 1300 }, tipAngleDeg: null };
  const d = renderSpec(attrs(), sku)!;
  assert.equal(d.spec.angle, 30);
  assert.equal(d.spec.land, 35.7); // 0.17 × 210
  assert.ok(d.assumptions.some((a) => a.includes('edge land unknown')));
  const own = renderSpec(attrs({ chiselLandMm: 40 }), { ...sku, tipAngleDeg: 34 })!;
  assert.equal(own.spec.angle, 34);
  assert.equal(own.spec.land, 40);
  assert.ok(!own.assumptions.some((a) => a.includes('edge land')));
  // A land as wide as the tool is not plausible: back to the default.
  assert.equal(renderSpec(attrs({ chiselLandMm: 300 }), sku)!.spec.land, 35.7);
  assert.equal(renderSpec(attrs(), { ...sku, tipType: 'pyramid' })!.spec.land, 12.6);
  assert.equal(renderSpec(attrs(), { ...sku, tipType: 'moil' })!.spec.land, undefined);
});
