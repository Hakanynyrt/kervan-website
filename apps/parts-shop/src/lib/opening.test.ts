import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DICT } from './dict.ts';
import {
  EXTRA,
  groupName,
  NAME_GAP,
  nameRows,
  OPEN_H,
  OPEN_W,
  PHONE_L,
  SPOTS,
  upright,
} from './opening.ts';

/** The whole dot (radius r) lies inside the box. */
const inside = ([x0, y0, x1, y1]: number[], [x, y]: number[], r: number) =>
  x - r >= x0 && x + r <= x1 && y - r >= y0 && y + r <= y1;
/** Dot radii in render px: desktop r 6.5; phones 2.6 CSS px on a 580 px tall picture. */
const DOT = 6.5;
const DOT_PHONE = (2.6 * OPEN_W) / PHONE_L;

test('every leader line ends inside a box of its own part', () => {
  // The boxes only bound the parts; the ends were also checked against the picture's alpha.
  for (const s of SPOTS) {
    assert.ok(
      s.boxes.some((b) => inside(b, s.to, DOT)),
      `${s.g}: desktop end ${s.to} is off its part`,
    );
    assert.ok(
      s.boxes.some((b) => inside(b, s.side, DOT_PHONE)),
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

/** Inter 500 advance widths (1/1000 em), from the font Google Fonts serves; others count as
 *  wide (900). */
const ADV = new Map<string, number>([
  [' ', 267],
  ...(
    'a568 b618 c577 d618 e587 f379 g620 h602 i252 j252 k559 l252 m888 n602 o604 p618 q618 ' +
    'r387 s539 t340 u602 v575 w829 x557 y575 z559 A709 B657 C733 D722 E603 F589 G748 H745 ' +
    'I272 K688 L565 M913 N756 O767 P642 R648 S646 T653 U740 W1003 ç577 ğ620 ı252 ö604 ş539 ü602'
  )
    .split(' ')
    .map((x): [string, number] => [x[0], Number(x.slice(1))]),
]);
const textWidth = (s: string, px: number) =>
  ([...s].reduce((w, c) => w + (ADV.get(c) ?? 900), 0) / 1000) * px * 1.05;

test('desktop names in a row never run into the next one, in both languages', () => {
  // Viewport → picture width (`--kv-pw`: the page less 40 px) and name size (globals.css).
  for (const vw of [768, 900, 1023, 1184, 1440]) {
    const pw = vw - 40;
    const px = vw < 1184 ? 13.5 : 15;
    const scale = pw / OPEN_W;
    for (const lang of ['tr', 'en'] as const) {
      for (const up of [true, false]) {
        // A name: its number (28 px, centred on the line) and gap (10 px), then the text.
        const row = SPOTS.filter((s) => s.name.up === up)
          .map((s) => {
            const left = 20 + s.name.x * scale - 14;
            return { g: s.g, left, right: left + 38 + textWidth(groupName(DICT[lang], s.g), px) };
          })
          .sort((a, b) => a.left - b.left);
        for (let i = 1; i < row.length; i++)
          assert.ok(
            row[i - 1].right + 6 <= row[i].left,
            `${lang} ${vw} px: ${row[i - 1].g} runs into ${row[i].g}`,
          );
        assert.ok(row[0].left >= 0 && row[row.length - 1].right <= vw, `${lang} ${vw} px: off`);
      }
    }
  }
});
