import type { Range } from './types.ts';

/** Rough carrier (excavator) weight class from the tip diameter. Pure helper, no I/O.
 *  Built from manufacturer and dealer data points (tool Ø -> breaker -> carrier t):
 *  Indeco HP 1000 FS Ø75 3.5-10.5 t · NPK GH-6 Ø106 10-13.8 t · Furukawa HB15G Ø120 15-19 t ·
 *  Indeco HP 3000 FS Ø122 15-25 t · NPK GH-9 Ø126 18-25 t · Furukawa HB20G Ø135 19-22 t ·
 *  Soosan SB70 Ø135 16-21 t · SB81 Ø140 18-26 t · Furukawa HB30G Ø150 26-32 t · Soosan SB100
 *  Ø150 20-30 t · Atlas Copco HB 2200 Ø150 26-40 t · Montabert V45 Ø150 27-40 t · NPK GH-15
 *  Ø156 30-45 t · Furukawa HB40G Ø160 32-44 t · Atlas Copco HB 3600 Ø170 35-63 t · Montabert V57
 *  Ø170 35-60 t · V67 Ø202 50-80 t. Bands are the union of the points inside them, so the range
 *  is deliberately wide. Below Ø75 and above Ø209 there is no data, hence no estimate. */
export type CarrierBandKey =
  | 'lt75'
  | '75-99'
  | '100-114'
  | '115-129'
  | '130-144'
  | '145-154'
  | '155-164'
  | '165-179'
  | '180-209'
  | 'ge210';

/** A working-diameter band: `from` ≤ Ø < `below` (mm), with its rough carrier weight if known. */
export interface CarrierBand {
  key: CarrierBandKey;
  from: number;
  below: number;
  /** Carrier (excavator) weight in t; null where there is no data (below Ø75, Ø210 and up). */
  tons: Range | null;
}

/** Every band, small to large; they cover every diameter without gaps or overlaps. */
export const CARRIER_BANDS: readonly CarrierBand[] = [
  { key: 'lt75', from: 0, below: 75, tons: null },
  { key: '75-99', from: 75, below: 100, tons: { min: 4, max: 10 } },
  { key: '100-114', from: 100, below: 115, tons: { min: 10, max: 14 } },
  { key: '115-129', from: 115, below: 130, tons: { min: 15, max: 25 } },
  { key: '130-144', from: 130, below: 145, tons: { min: 16, max: 26 } },
  { key: '145-154', from: 145, below: 155, tons: { min: 20, max: 40 } },
  { key: '155-164', from: 155, below: 165, tons: { min: 30, max: 45 } },
  { key: '165-179', from: 165, below: 180, tons: { min: 35, max: 63 } },
  { key: '180-209', from: 180, below: 210, tons: { min: 50, max: 88 } },
  { key: 'ge210', from: 210, below: Infinity, tons: null },
];

/** The band of a working diameter; null when the diameter is unknown. */
export function carrierBand(diameterMm: number | null): CarrierBand | null {
  if (diameterMm == null || !Number.isFinite(diameterMm) || diameterMm < 0) return null;
  return CARRIER_BANDS.find((b) => diameterMm >= b.from && diameterMm < b.below) ?? null;
}

export function carrierTons(diameterMm: number | null): Range | null {
  const t = carrierBand(diameterMm)?.tons;
  return t ? { min: t.min, max: t.max } : null;
}
