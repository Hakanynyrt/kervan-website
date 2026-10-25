import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXTRA, NAME_GAP, nameRows, OPEN_H, OPEN_W, PHONE_L, SPOTS, upright } from './opening.ts';

const inside = ([x0, y0, x1, y1]: number[], [x, y]: number[], pad = 24) =>
  x >= x0 - pad && x <= x1 + pad && y >= y0 - pad && y <= y1 + pad;

test('every leader line ends on a box of its own part', () => {
  for (const s of SPOTS) {
    assert.ok(
      s.boxes.some((b) => inside(b, s.to)),
      `${s.g}: desktop end ${s.to} is off its part`,
    );
    assert.ok(
      s.boxes.some((b) => inside(b, s.side)),
      `${s.g}: phone end ${s.side} is off its part`,
    );
  }
});

test('the upright picture keeps the accumulator at the top and the tip at the bottom', () => {
  assert.deepEqual(upright([0, OPEN_H]), [20, 0]);
  assert.equal(upright([OPEN_W, 0])[1], PHONE_L);
  const ys = SPOTS.map((s) => upright(s.side)[1]);
  assert.ok(ys[0] < ys[ys.length - 1]);
});

test('names beside the upright picture never crowd and stay beside it', () => {
  const rows = nameRows();
  assert.equal(rows.length, SPOTS.length + EXTRA.length);
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i] - rows[i - 1] >= NAME_GAP);
  assert.ok(rows[rows.length - 1] + 22 <= PHONE_L, 'last name below the picture');
});

test('desktop names in one row are far enough apart to stay readable at 768 px', () => {
  // At 768 px the picture is 728 px wide; a name takes up to ~190 px (number + text).
  const scale = 728 / OPEN_W;
  for (const up of [true, false]) {
    const xs = SPOTS.filter((s) => s.name.up === up)
      .map((s) => s.name.x * scale)
      .sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 60, `row ${up}: ${xs}`);
  }
});
