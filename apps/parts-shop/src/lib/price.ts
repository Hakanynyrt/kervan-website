import type { FxRate } from '@kervan/tips';
import type { Lang } from '../types';
import type { Dict } from './dict';

const loc = (lang: Lang) => (lang === 'tr' ? 'tr-TR' : 'en-GB');

/** "268 USD" (whole dollars; list prices are whole). */
export const fmtUsd = (cents: number, lang: Lang): string =>
  `${new Intl.NumberFormat(loc(lang), { maximumFractionDigits: 2 }).format(cents / 100)} USD`;

/** "13.180 TL" at the build's CBRT rate, rounded to whole lira; null without a rate. Net, for
 *  the English pages (export price). */
export const fmtTry = (cents: number, fx: FxRate | null, lang: Lang): string | null =>
  fx
    ? `${new Intl.NumberFormat(loc(lang)).format(Math.round((cents / 100) * fx.usdTry))} TL`
    : null;

/** "06.10.2026" / "06/10/2026". */
export const fmtDate = (iso: string, lang: Lang): string => {
  const [y, m, d] = iso.split('-');
  return lang === 'tr' ? `${d}.${m}.${y}` : `${d}/${m}/${y}`;
};

/** VAT rate on our products (percent); catalogue prices are net. */
export const VAT_PERCENT = 20;
export const vatOf = (netCents: number): number => Math.round((netCents * VAT_PERCENT) / 100);

/**
 * The Turkish pages' price (owner, G2, 2026-11-01): the net USD price plus its taxes (`vatOf`),
 * times the stated CBRT rate, rounded once to whole lira. Nothing else enters it. Returned in
 * kuruş (always a whole number of lira); null without a rate. The page, the cart and the JSON-LD
 * all use it, so they cannot disagree.
 */
export const grossTryCents = (netCents: number, fx: FxRate | null): number | null =>
  fx ? Math.round(((netCents + vatOf(netCents)) / 100) * fx.usdTry) * 100 : null;

/** "15.816 TL": an amount in kuruş of whole lira (grossTryCents, or a sum of them). */
export const fmtTryCents = (tryCents: number, lang: Lang): string =>
  `${new Intl.NumberFormat(loc(lang)).format(Math.round(tryCents / 100))} TL`;

/** The gross TL price of a net USD price, formatted ("15.816 TL"); null without a rate. */
export const fmtGrossTry = (netCents: number, fx: FxRate | null, lang: Lang): string | null => {
  const g = grossTryCents(netCents, fx);
  return g === null ? null : fmtTryCents(g, lang);
};

/** schema.org decimal of a TL amount in kuruş: "15816.00". */
export const tryDecimal = (tryCents: number): string => (tryCents / 100).toFixed(2);

/** Turkish pages with a rate lead with the tax-inclusive TL price; English pages (and a build
 *  without a rate) show the net USD price first. */
export const leadsGross = (lang: Lang, fx: FxRate | null): fx is FxRate => lang === 'tr' && !!fx;

/** The unit price in an order message ("15.816 TL vergiler dahil; 268 USD + vergiler"). */
export const unitText = (cents: number, fx: FxRate | null, lang: Lang, t: Dict): string =>
  t.price.unit(leadsGross(lang, fx) ? fmtGrossTry(cents, fx, lang) : null, fmtUsd(cents, lang));
