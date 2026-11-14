import type { FxRate } from '@kervan/tips';
import type { Lang } from '../types';
import type { CartItem } from './cart.ts';
import { grossTryCents, leadsGross, vatOf } from './price.ts';

/**
 * What a palet adds up to: the one sum behind /palet's totals, its order message and its printed
 * quote ("Teklifi yazdır", `PaletQuote`), so the three always show the same figures.
 */
export interface PaletSum {
  /** The priced lines in net USD cents; "fiyat sorulacak" lines (`cents: null`) are left out. */
  totalCents: number;
  /** Taxes on it: Turkish pages only (English pages show the export price). */
  vatCents: number;
  grossCents: number;
  /** Some line has no price yet. */
  anyAsk: boolean;
  anyPriced: boolean;
  /** Turkish with a rate: the sum of the lines' tax-inclusive TL amounts, in kuruş; else null. */
  totalTry: number | null;
}

/**
 * A line's amount in kuruş where the page leads with the tax-inclusive TL price (Turkish with a
 * rate; owner, G2): the unit's gross TL price, the product pages' figure, × quantity. Null for a
 * "fiyat sorulacak" line and where the page shows USD.
 */
export function lineTryCents(x: CartItem, lang: Lang, fx: FxRate | null): number | null {
  const unit = x.cents === null || !leadsGross(lang, fx) ? null : grossTryCents(x.cents, fx);
  return unit === null ? null : unit * x.qty;
}

export function paletSum(list: readonly CartItem[], lang: Lang, fx: FxRate | null): PaletSum {
  const totalCents = list.reduce((n, x) => n + (x.cents ?? 0) * x.qty, 0);
  const vatCents = lang === 'tr' ? vatOf(totalCents) : 0;
  return {
    totalCents,
    vatCents,
    grossCents: totalCents + vatCents,
    anyAsk: list.some((x) => x.cents === null),
    anyPriced: list.some((x) => x.cents !== null),
    // The sum of the lines as shown, so the total never differs from them.
    totalTry: leadsGross(lang, fx)
      ? list.reduce((n, x) => n + (lineTryCents(x, lang, fx) ?? 0), 0)
      : null,
  };
}

/** The local calendar day of a moment as `YYYY-MM-DD`: the printed quote's date, read in the
 *  buyer's browser when the print starts. */
export const localDay = (d: Date): string =>
  [d.getFullYear(), d.getMonth() + 1, d.getDate()]
    .map((n, i) => String(n).padStart(i ? 2 : 4, '0'))
    .join('-');
