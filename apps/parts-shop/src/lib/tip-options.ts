import {
  TIP_TYPES,
  type PublicExtra,
  type PublicFamily,
  type PublicSku,
  type TipType,
} from '@kervan/tips';

/** One choice of a tip page's type selector: a catalogue SKU, or a type of an extra product. */
export interface TipOption {
  tipType: TipType;
  sku: PublicSku | null;
  family: PublicFamily | null;
  code: string | null;
  cents: number | null;
}

/**
 * Every tip type a breaker (or family) page offers, in TIP_TYPES order: a type comes from the
 * first tip family that has it. The prerender shows `types[0]` (page head and body share this).
 */
export function tipOptions(
  families: PublicFamily[],
  extra?: PublicExtra,
): { opts: Map<TipType, TipOption>; types: TipType[] } {
  const opts = new Map<TipType, TipOption>();
  for (const f of families)
    for (const s of f.skus)
      if (!opts.has(s.tipType))
        opts.set(s.tipType, {
          tipType: s.tipType,
          sku: s,
          family: f,
          code: s.code,
          cents: s.priceUsdNetCents,
        });
  for (const x of extra?.tipTypes ?? [])
    if (!opts.has(x))
      opts.set(x, {
        tipType: x,
        sku: null,
        family: null,
        code: null,
        cents: extra!.priceUsdNetCents,
      });
  return { opts, types: TIP_TYPES.filter((x) => opts.has(x)) };
}

/** One distinct tip of a breaker: its working diameter and length (owner, 2026-10-21: "İki farklı uç varsa iki farklı model vardır demek. O zaman iki tane uç yap"). */
export interface TipVariant {
  diameterMm: number;
  lengthMm: number | null;
  families: PublicFamily[];
}

/**
 * A breaker's tip families grouped by diameter and length, in catalogue order: families of one
 * size are the same tip (one card, one price); a breaker with two sizes sells two tips.
 */
export function tipVariants(families: PublicFamily[]): TipVariant[] {
  const out = new Map<string, TipVariant>();
  for (const f of families) {
    const lens = f.skus.map((s) => s.lengthMm?.min ?? null).filter((x): x is number => x !== null);
    const lengthMm = lens.length ? Math.min(...lens) : null;
    const key = `${f.attrs.diameterMm}|${lengthMm}`;
    const v = out.get(key);
    if (v) v.families.push(f);
    else out.set(key, { diameterMm: f.attrs.diameterMm, lengthMm, families: [f] });
  }
  return [...out.values()];
}

/**
 * The ordinal of each tip size among the sizes of the same diameter (1-based), null when its
 * diameter is unique. The tip length is never shown (owner, 2026-10-23: "boyu hiçbir yerde
 * söyleme"), so two sizes that differ only in length are told apart by `t.tipSize`'s ordinal.
 */
export function sizeOrdinals(variants: readonly { diameterMm: number }[]): (number | null)[] {
  const count = new Map<number, number>();
  for (const v of variants) count.set(v.diameterMm, (count.get(v.diameterMm) ?? 0) + 1);
  const seen = new Map<number, number>();
  return variants.map((v) => {
    if ((count.get(v.diameterMm) ?? 0) < 2) return null;
    const n = (seen.get(v.diameterMm) ?? 0) + 1;
    seen.set(v.diameterMm, n);
    return n;
  });
}

/**
 * What the prerendered breaker / family page shows (TipProduct: the first size, its first
 * type): that option and its own render. The page head uses the same choice for `og:image`
 * and the offer, so the link preview and the price match the page.
 */
export function shownTip(
  families: PublicFamily[],
  extra?: PublicExtra,
): { opt: TipOption | undefined; image: string | null } {
  const variants = tipVariants(families);
  const { opts, types } = tipOptions(variants.length > 1 ? variants[0].families : families, extra);
  const opt = types.length ? opts.get(types[0]) : undefined;
  return { opt, image: opt?.sku?.image ?? null };
}
