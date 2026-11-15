import type { PageModel } from '../lib/routes';

/** The props fields that carry a price a page shows (net USD cents, or a [low, high] span). */
const PRICE_KEYS = new Set(['price', 'prices', 'priceFitted', 'priceUsdNetCents', 'cents']);

const isCents = (v: unknown): boolean => typeof v === 'number' && Number.isFinite(v);

/** A price field's value holds at least one price: a number, a span, or a record of numbers. */
function holdsPrice(v: unknown): boolean {
  if (isCents(v)) return true;
  if (Array.isArray(v)) return v.some(isCents);
  if (v && typeof v === 'object') return Object.values(v).some(isCents);
  return false;
}

function scan(v: unknown, depth: number): boolean {
  if (depth > 12 || !v || typeof v !== 'object') return false;
  if (Array.isArray(v)) return v.some((x) => scan(x, depth + 1));
  for (const [k, x] of Object.entries(v)) {
    if (PRICE_KEYS.has(k) && holdsPrice(x)) return true;
    if (scan(x, depth + 1)) return true;
  }
  return false;
}

/**
 * Whether a page shows a price anywhere (its own, a card's, a priced render's, a listed part's),
 * so a saved copy of it gets the dated price line. Wider than PageView's `showsPrice`, which is
 * the site header's "priced page" (the page's own product price) and stays as it is.
 */
export const pageShowsPrices = (model: PageModel): boolean => scan(model, 0);
