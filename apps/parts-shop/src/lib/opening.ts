import type { PartKey } from './routes';

/**
 * Geometry of the home opening (`ExplodedPicker`): where each part group is on the final picture
 * (`acilis-acik-05`, every frame has the same crop), where its name stands and where its leader
 * line ends. Desktop: the picture lies along the page, each name above or below it. Phones: the
 * same picture turned upright (tip down), each name beside it.
 */

/** A group on the picture: the tips (`/kirici-ucu`) or a part group. */
export type OpeningGroup = 'tips' | PartKey;
type Box = [number, number, number, number];
type Pt = [number, number];

/** Picture size in render pixels; every box and point below is in these. */
export const OPEN_W = 2864;
export const OPEN_H = 620;

/** Phones: the upright picture's height (CSS px), its left edge in the stage box, and where the
 *  names start; keep in sync with `--kv-l`, `--kv-x` and `--kv-name` in globals.css. */
export const PHONE_L = 580;
export const PHONE_X = 20;
export const PHONE_NAME_X = 166;
/** Phones: the least distance between two names (a 44 px tap target and some air). */
export const NAME_GAP = 56;

export interface Spot {
  g: OpeningGroup;
  /** Pointer targets on the picture (the names are the links for the keyboard). */
  boxes: Box[];
  /** Desktop: the name's x and side (above or below the picture), and the point its line ends on. */
  name: { x: number; up: boolean };
  to: Pt;
  /** Phones: the point the line from the name beside the upright picture ends on. */
  side: Pt;
}

/**
 * Left to right along the breaker; the order gives the numbers (1–8, also on the home's group
 * cards). Owner, 2026-10-25 ("buralar tam uyuşmuyor"): every line ends on its part, checked on
 * overlays of `acilis-acik-05-lg`.
 */
export const SPOTS: Spot[] = [
  {
    g: 'akumulator',
    boxes: [[44, 168, 548, 392]],
    name: { x: 270, up: true },
    to: [258, 280],
    side: [296, 200],
  },
  {
    g: 'saplama',
    boxes: [
      [516, 72, 1228, 240],
      [524, 368, 1228, 560],
    ],
    name: { x: 1000, up: true },
    to: [1000, 128],
    side: [680, 122],
  },
  {
    g: 'piston',
    boxes: [[716, 262, 1228, 376]],
    name: { x: 900, up: false },
    to: [960, 308],
    side: [1000, 300],
  },
  {
    g: 'burc',
    boxes: [
      [1220, 248, 1372, 392],
      [1828, 264, 1996, 432],
    ],
    name: { x: 1990, up: true },
    to: [1915, 350],
    side: [1296, 280],
  },
  {
    g: 'alt-govde',
    boxes: [[1380, 232, 1792, 432]],
    name: { x: 1450, up: false },
    to: [1420, 412],
    side: [1590, 245],
  },
  {
    g: 'kama',
    boxes: [[1630, 64, 1732, 250]],
    name: { x: 1580, up: true },
    to: [1672, 200],
    side: [1670, 100],
  },
  {
    g: 'asinma-plakasi',
    boxes: [
      [1389, 130, 1504, 162],
      [1389, 484, 1504, 522],
      [1606, 500, 1786, 536],
      [2004, 232, 2092, 480],
    ],
    name: { x: 1990, up: false },
    to: [2040, 444],
    side: [2048, 262],
  },
  {
    g: 'tips',
    boxes: [[2100, 288, 2828, 448]],
    name: { x: 2470, up: true },
    to: [2470, 362],
    side: [2450, 330],
  },
];

/** Groups not on the picture: named after the numbered ones on phones, a note on desktop. */
export const EXTRA: OpeningGroup[] = ['tamir-takimi'];

/** The numbered groups, in picture order (the home's group cards use the same numbers). */
export const NUMBERED: OpeningGroup[] = SPOTS.map((s) => s.g);

/** Phones: a point of the picture (render px) on the upright picture, in CSS px from the top left
 *  of the stage box (the picture turned 90° clockwise about its centre, left edge at PHONE_X). */
export const upright = ([x, y]: Pt): Pt => [
  PHONE_X + ((OPEN_H - y) * PHONE_L) / OPEN_W,
  (x * PHONE_L) / OPEN_W,
];

/**
 * Phones: the height of each name beside the upright picture (CSS px): level with its part,
 * pushed down to keep NAME_GAP from the one above; `extra` more names follow at the same gap.
 */
export function nameRows(extra = EXTRA.length): number[] {
  const rows: number[] = [];
  for (const s of SPOTS) {
    const y = upright(s.side)[1];
    rows.push(rows.length ? Math.max(y, rows[rows.length - 1] + NAME_GAP) : y);
  }
  for (let i = 0; i < extra; i++) rows.push(rows[rows.length - 1] + NAME_GAP);
  return rows;
}
