import type { FxRate } from './types.ts';

/**
 * The shop's price arithmetic, shared by kiriciparca.com and kervanbreaker.com's owner-only
 * quote line so both show the same number (owner, G2, 2026-11-01). Catalogue prices are net USD.
 */

/** VAT rate on our products (percent). */
export const VAT_PERCENT = 20;
export const vatOf = (netCents: number): number => Math.round((netCents * VAT_PERCENT) / 100);

/** The Turkish pages' price: net USD plus VAT, times the stated CBRT rate, rounded once to whole
 *  lira. In kuruş (a whole number of lira); null without a rate. */
export const grossTryCents = (netCents: number, fx: FxRate | null): number | null =>
  fx ? Math.round(((netCents + vatOf(netCents)) / 100) * fx.usdTry) * 100 : null;

/** The shop's published rate inside one of its prerendered pages (`"fx":{"usdTry":…,"date":…}`);
 *  null when absent or implausible (never a guessed rate). */
export function fxFromShopHtml(html: string): FxRate | null {
  const m = /"fx":\{"usdTry":([\d.]+),"date":"(\d{4}-\d{2}-\d{2})"\}/.exec(html);
  if (!m) return null;
  const usdTry = Number(m[1]);
  return usdTry > 1 && usdTry < 1000 ? { usdTry, date: m[2] } : null;
}
