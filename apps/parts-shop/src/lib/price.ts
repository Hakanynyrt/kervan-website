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
