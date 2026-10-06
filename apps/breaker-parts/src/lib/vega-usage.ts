import { carrierTons as tonsFor } from '@kervan/tips';
import type { VegaItem } from '../types';

export interface CarrierRange {
  min: number;
  max: number;
}

/** Rough carrier weight class for a tip (bands live in @kervan/tips, shared with the shop). */
export function carrierTons(it: Pick<VegaItem, 'diameterMm'>): CarrierRange | null {
  return tonsFor(it.diameterMm);
}

/** Does the tip suit a carrier of `tons`? Tips with no estimate are not excluded. */
export function suitsCarrier(it: Pick<VegaItem, 'diameterMm'>, tons: number): boolean {
  const r = carrierTons(it);
  return !r || (tons >= r.min && tons <= r.max);
}
