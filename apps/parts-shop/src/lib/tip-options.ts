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
