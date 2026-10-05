import type { VegaItem } from '../types';

/** Rough carrier (excavator) weight class from the tip diameter. Pure helper, no I/O.
 *  Built from manufacturer and dealer data points (tool Ø -> breaker -> carrier t):
 *  Indeco HP 1000 FS Ø75 3.5-10.5 t · NPK GH-6 Ø106 10-13.8 t · Furukawa HB15G Ø120 15-19 t ·
 *  Indeco HP 3000 FS Ø122 15-25 t · NPK GH-9 Ø126 18-25 t · Furukawa HB20G Ø135 19-22 t ·
 *  Soosan SB70 Ø135 16-21 t · SB81 Ø140 18-26 t · Furukawa HB30G Ø150 26-32 t · Soosan SB100
 *  Ø150 20-30 t · Atlas Copco HB 2200 Ø150 26-40 t · Montabert V45 Ø150 27-40 t · NPK GH-15
 *  Ø156 30-45 t · Furukawa HB40G Ø160 32-44 t · Atlas Copco HB 3600 Ø170 35-63 t · Montabert V57
 *  Ø170 35-60 t · V67 Ø202 50-80 t. Bands are the union of the points inside them, so the range
 *  is deliberately wide. Below Ø75 and above Ø209 there is no data, hence no estimate. */
const BANDS: { from: number; to: number; min: number; max: number }[] = [
  { from: 75, to: 99.99, min: 4, max: 10 },
  { from: 100, to: 114.99, min: 10, max: 14 },
  { from: 115, to: 129.99, min: 15, max: 25 },
  { from: 130, to: 144.99, min: 16, max: 26 },
  { from: 145, to: 154.99, min: 20, max: 40 },
  { from: 155, to: 164.99, min: 30, max: 45 },
  { from: 165, to: 179.99, min: 35, max: 63 },
  { from: 180, to: 209.99, min: 50, max: 88 },
];

export interface CarrierRange {
  min: number;
  max: number;
}

export function carrierTons(it: Pick<VegaItem, 'diameterMm'>): CarrierRange | null {
  const d = it.diameterMm;
  if (d == null) return null;
  const b = BANDS.find((x) => d >= x.from && d <= x.to);
  return b ? { min: b.min, max: b.max } : null;
}

/** Does the tip suit a carrier of `tons`? Tips with no estimate are not excluded. */
export function suitsCarrier(it: Pick<VegaItem, 'diameterMm'>, tons: number): boolean {
  const r = carrierTons(it);
  return !r || (tons >= r.min && tons <= r.max);
}
