import { breakerGroupKey, displayBreakers, preferredSpelling } from './breaker-display.ts';
import { searchName } from './search.ts';
import type { PublicCatalog, TipType } from './types.ts';

/**
 * Which breakers share one tip, for the owner-only "Ortak uçlar" panel on kervanbreaker.com.
 * Built from the shop's own public catalogue projection (published families, WRONG_FITS and
 * hidden makes already left out, Kervan's drawings applied), with the breakers grouped the
 * way the shop groups its breaker pages (one entry per model, spellings merged). The result
 * is private business data: it is only ever served to an owner session, never bundled.
 * No prices, lengths or weights.
 */
export interface FitsFamily {
  /** Kervan family code, e.g. "KU135-21". */
  code: string;
  /** Working diameter, mm. */
  d: number;
  collarMm: number | null;
  keyCount: 1 | 2 | null;
  keyMm: number | null;
  slotMm: number | null;
  rearStep: boolean | null;
  rearMm: number | null;
  types: TipType[];
  /** Indexes into `FitsIndex.breakers`, sorted by make and model. */
  breakers: number[];
}

export interface FitsBreaker {
  brand: string;
  model: string;
  /** "Atlas Copco MB 1000". */
  name: string;
  /** The shop's breaker slug ("atlas-copco/mb-1000"). */
  slug: string;
  /** Text a search matches: the name, the other catalogue spellings and the same model's
   *  other name (SAME_MODELS). */
  search: string;
  /** Indexes into `FitsIndex.families`, by diameter. */
  families: number[];
}

export interface FitsIndex {
  schema: 1;
  families: FitsFamily[];
  breakers: FitsBreaker[];
}

const byNameTr = (a: string, b: string): number => a.localeCompare(b, 'tr', { numeric: true });

export function buildFitsIndex(c: PublicCatalog): FitsIndex {
  const fams = [...c.families].sort(
    (a, b) => a.attrs.diameterMm - b.attrs.diameterMm || (a.code < b.code ? -1 : 1),
  );
  // One group per model, like the shop's groupBreakers (spellings differing only by spaces,
  // dashes or case are one breaker under the spaced spelling).
  const groups = new Map<
    string,
    { brand: string; spellings: Map<string, string>; fams: Set<number> }
  >();
  fams.forEach((f, i) => {
    for (const raw of f.fits)
      for (const b of displayBreakers(raw.brand, raw.model)) {
        const key = breakerGroupKey(b);
        const g = groups.get(key) ?? {
          brand: b.brand,
          spellings: new Map<string, string>(),
          fams: new Set<number>(),
        };
        if (!g.spellings.has(b.model)) g.spellings.set(b.model, b.slug);
        g.fams.add(i);
        groups.set(key, g);
      }
  });
  // Spellings that differ by other punctuation can still share a slug: one breaker.
  const bySlug = new Map<
    string,
    { brand: string; model: string; spellings: Set<string>; fams: Set<number> }
  >();
  for (const g of groups.values()) {
    const model = preferredSpelling([...g.spellings.keys()]);
    const slug = g.spellings.get(model)!;
    const same = bySlug.get(slug);
    if (same) {
      for (const s of g.spellings.keys()) same.spellings.add(s);
      for (const i of g.fams) same.fams.add(i);
      continue;
    }
    bySlug.set(slug, {
      brand: g.brand,
      model,
      spellings: new Set(g.spellings.keys()),
      fams: new Set(g.fams),
    });
  }
  const list = [...bySlug].map(([slug, b]) => {
    const name = `${b.brand} ${b.model}`.trim();
    const others = [...b.spellings].filter((s) => s !== b.model).map((s) => `${b.brand} ${s}`);
    return {
      brand: b.brand,
      model: b.model,
      name,
      slug,
      search: [searchName(name), ...others].join(' / '),
      families: [...b.fams].sort((x, y) => x - y),
    };
  });
  list.sort((a, b) => byNameTr(a.brand, b.brand) || byNameTr(a.model, b.model));
  const families: FitsFamily[] = fams.map((f) => ({
    code: f.code,
    d: f.attrs.diameterMm,
    collarMm: f.attrs.collarDiameterMm,
    keyCount: f.attrs.key.count,
    keyMm: f.attrs.key.thicknessMm,
    slotMm: f.attrs.key.slotLengthMm,
    rearStep: f.attrs.rear.step,
    rearMm: f.attrs.rear.diameterMm,
    types: [...new Set(f.skus.map((s) => s.tipType))],
    breakers: [],
  }));
  list.forEach((b, i) => {
    for (const fi of b.families) families[fi].breakers.push(i);
  });
  return { schema: 1, families, breakers: list };
}

/** Breakers of `index` grouped by make (makes A–Z, models in index order), with counts. */
export function groupByMake(
  index: FitsIndex,
  ids: readonly number[],
): { brand: string; ids: number[] }[] {
  const out = new Map<string, number[]>();
  for (const i of ids) {
    const b = index.breakers[i];
    if (!b) continue;
    out.set(b.brand, [...(out.get(b.brand) ?? []), i]);
  }
  return [...out]
    .map(([brand, list]) => ({ brand, ids: list }))
    .sort((a, b) => byNameTr(a.brand, b.brand));
}
