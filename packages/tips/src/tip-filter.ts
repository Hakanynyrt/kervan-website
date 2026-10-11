import { isTipType, TIP_TYPES, type TipType } from './types.ts';
import { CARRIER_BANDS, carrierBand, type CarrierBand, type CarrierBandKey } from './usage.ts';

/**
 * Narrowing filters for the results of a typed breaker search (shop list and make pages).
 * They only ever narrow what a search found: the shop lists nothing before something is typed
 * (owner), so nothing here lists rows on its own. Pure, no DOM.
 */
export interface TipFilter {
  /** Only breakers that take this tip type. */
  tip: TipType | null;
  /** Only breakers whose working diameter is in this band. */
  cap: CarrierBandKey | null;
  /** Only breakers we make a tool with dust grooves for. */
  grooved: boolean;
}

export const EMPTY_FILTER: TipFilter = Object.freeze({ tip: null, cap: null, grooved: false });

/** What a row needs for the filters (the shop's BreakerCard fits). */
export interface TipFilterRow {
  types: readonly TipType[];
  diameterMm: number | null;
  grooved?: boolean;
}

/** The choices worth offering for a result set. */
export interface TipFacets {
  /** Tip types, in display order; empty unless picking one would narrow the results. */
  types: TipType[];
  /** Diameter bands present in the results, small to large. */
  bands: CarrierBand[];
  /** Some result has a tool with dust grooves. */
  grooved: boolean;
}

export const isFilterActive = (f: TipFilter): boolean =>
  f.tip !== null || f.cap !== null || f.grooved;

/** Facets from the values the rows really have, never from the full lists. */
export function facetsOf(rows: readonly TipFilterRow[]): TipFacets {
  const present = TIP_TYPES.filter((t) => rows.some((r) => r.types.includes(t)));
  const narrows = present.some((t) => rows.some((r) => !r.types.includes(t)));
  const keys = new Set(rows.map((r) => carrierBand(r.diameterMm)?.key));
  return {
    types: narrows ? present : [],
    bands: CARRIER_BANDS.filter((b) => keys.has(b.key)),
    grooved: rows.some((r) => r.grooved === true),
  };
}

/** The rows that pass every set filter (AND), order kept. */
export function applyTipFilter<T extends TipFilterRow>(rows: readonly T[], f: TipFilter): T[] {
  return rows.filter(
    (r) =>
      (f.tip === null || r.types.includes(f.tip)) &&
      (f.cap === null || carrierBand(r.diameterMm)?.key === f.cap) &&
      (!f.grooved || r.grooved === true),
  );
}

const isBandKey = (v: unknown): v is CarrierBandKey =>
  typeof v === 'string' && CARRIER_BANDS.some((b) => b.key === v);

/** `?tip=&cap=&kanal=1` → filter; unknown values are dropped. */
export function parseTipFilter(search: string | URLSearchParams): TipFilter {
  const p = typeof search === 'string' ? new URLSearchParams(search) : search;
  const tip = p.get('tip');
  const cap = p.get('cap');
  return {
    tip: isTipType(tip) ? tip : null,
    cap: isBandKey(cap) ? cap : null,
    grooved: p.get('kanal') === '1',
  };
}

/**
 * The filter written into a query string, merged into `base` (other parameters such as `q`
 * are kept). Returns the query without the leading `?` ('' when empty).
 */
export function tipFilterToSearch(f: TipFilter, base: string | URLSearchParams = ''): string {
  const p = new URLSearchParams(base);
  if (f.tip) p.set('tip', f.tip);
  else p.delete('tip');
  if (f.cap) p.set('cap', f.cap);
  else p.delete('cap');
  if (f.grooved) p.set('kanal', '1');
  else p.delete('kanal');
  return p.toString();
}

/** What a sort by popularity needs. */
export interface PopularityRow {
  name: string;
  diameterMm: number | null;
  popularTier: 1 | 2 | null;
}

const tierRank = (t: 1 | 2 | null): number => t ?? 3;

/** Best-sellers first (tier 1, 2, then the rest), then working diameter (unknown last), then name. */
export const byPopularity = (a: PopularityRow, b: PopularityRow): number =>
  tierRank(a.popularTier) - tierRank(b.popularTier) ||
  (a.diameterMm ?? Infinity) - (b.diameterMm ?? Infinity) ||
  a.name.localeCompare(b.name, 'tr', { numeric: true });
