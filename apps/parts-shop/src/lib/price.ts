import type { FxRate } from '@kervan/tips';
import type { Lang } from '../types';

const loc = (lang: Lang) => (lang === 'tr' ? 'tr-TR' : 'en-GB');

/** "268 USD" (whole dollars; list prices are whole). */
export const fmtUsd = (cents: number, lang: Lang): string =>
  `${new Intl.NumberFormat(loc(lang), { maximumFractionDigits: 2 }).format(cents / 100)} USD`;

/** "13.180 TL" at the build day's rate, rounded to whole lira; null without a rate. */
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
 * The price a page shows from a net catalogue price: Turkish pages show it with taxes in, as
 * consumer price rules require (6502 md. 54, Fiyat Etiketi Yönetmeliği md. 4/1-h); English
 * pages show the net export price (KDVK md. 11). No tax wording on either (owner, 2026-10-21:
 * "kdv yazısı görünmesin hiçbir yerde").
 */
export const shownCents = (netCents: number, lang: Lang): number =>
  lang === 'tr' ? netCents + vatOf(netCents) : netCents;
