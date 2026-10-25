import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slotEnd } from './tipgen.ts';

const radius = (len: number) => ({ kind: 'radius' as const, len });

test('slotEnd: a radius end as long as the cut is deep is a quarter circle down to the floor', () => {
  // Shank radius 50, floor 30: depth 20, end length 20.
  const pts = slotEnd(radius(20), 100, 50, 30);
  assert.deepEqual(
    pts[0].map((v) => Math.round(v * 1e6) / 1e6),
    [100, 50],
  );
  const last = pts[pts.length - 1];
  assert.ok(Math.abs(last[0] - 120) < 1e-9 && Math.abs(last[1] - 30) < 1e-9);
  for (let i = 1; i < pts.length; i++) {
    // Runs forward and down, never above the shank or below the floor.
    assert.ok(pts[i][0] >= pts[i - 1][0] - 1e-9 && pts[i][1] <= pts[i - 1][1] + 1e-9);
    assert.ok(pts[i][0] <= 120 + 1e-9 && pts[i][1] >= 30 - 1e-9);
  }
});

test('slotEnd: the curve does not jump when the end length crosses the cut depth', () => {
  const at = slotEnd(radius(20), 100, 50, 30);
  for (const len of [19.9, 20.1]) {
    const near = slotEnd(radius(len), 100, 50, 30);
    const mid = near[Math.floor(near.length / 2)];
    const gap = Math.min(...at.map((p) => Math.hypot(p[0] - mid[0], p[1] - mid[1])));
    assert.ok(gap < 1, `len ${len}: midpoint ${gap.toFixed(2)} mm from the l = d curve`);
  }
});
