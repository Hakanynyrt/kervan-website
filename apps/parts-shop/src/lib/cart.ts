import type { TipType } from '@kervan/tips';

/**
 * The cart lives only in this browser (localStorage), never on a server: the visitor sends it
 * as an order request (WhatsApp / e-mail). Personal details typed on the cart page are not
 * stored, only put into that message.
 */
export interface CartItem {
  /** Breaker slug + tip type: one line per product. */
  id: string;
  /** Breaker make and model. */
  name: string;
  /** Tips: the tip type (named through the dict). */
  tipType?: TipType;
  /** Spare parts: the part's name as shown when it was added (e.g. "kafa burcu"). */
  label?: string;
  /** Kervan SKU code (for our order handling), null for an extra product. */
  code: string | null;
  /** Neutral path of the product page ('' only for a damaged stored line that had none). */
  path: string;
  /** Unit price at the time it was added (net USD cents), null = ask; /palet reads it again from
   *  the product page when it loads (`refreshLines`). */
  cents: number | null;
  qty: number;
}

const KEY = 'kv_cart_v1';
export const CART_EVENT = 'kv:cart';
export const MAX_QTY = 999;

export function readCart(): CartItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown;
    return Array.isArray(v)
      ? v
          .filter(
            (x): x is CartItem =>
              !!x &&
              typeof x.id === 'string' &&
              typeof x.name === 'string' &&
              Number.isInteger(x.qty),
          )
          // Hand-edited or damaged storage: a price that is not a number reads as "fiyat
          // sorulacak" (never NaN in a total), a missing path as none (the line has no link
          // until /palet's refresh finds its page).
          .map((x) => ({
            ...x,
            cents: Number.isFinite(x.cents) ? x.cents : null,
            path: typeof x.path === 'string' ? x.path : '',
          }))
      : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* private mode: the cart lasts for this page only */
  }
  window.dispatchEvent(new Event(CART_EVENT));
}

export function addToCart(item: Omit<CartItem, 'qty'>, qty: number): void {
  const items = readCart();
  const hit = items.find((x) => x.id === item.id);
  // The line takes the page's current name and price: a part stored while it was "fiyat
  // sorulacak" (cents null) is priced once its page is, and a changed price follows the page.
  if (hit) Object.assign(hit, item, { qty: Math.min(MAX_QTY, hit.qty + qty) });
  else items.push({ ...item, qty: Math.min(MAX_QTY, qty) });
  writeCart(items);
  // An overwritten line carries what this page shows (its language, its copy of the price), not
  // what /palet last read: /palet reads the lines again (review, 2026-11-13: a line added again
  // from its English page kept the English label on the Turkish palet).
  if (hit) dropRefreshStamp();
}

/** How many of this line the cart holds; null when it is not there (private mode, nothing stored). */
export const cartQty = (id: string): number | null =>
  readCart().find((x) => x.id === id)?.qty ?? null;

export const cartCount = (items: CartItem[]): number => items.reduce((n, x) => n + x.qty, 0);

/*
 * /palet reads its stored lines again from their product pages when it loads (`refreshLines`).
 * A finished read is remembered for this tab (sessionStorage): its time, its language and the
 * line ids it covered, never a name or a price, so a reload shortly after does not download
 * every product page again. A line written over from its product page forgets it (`addToCart`).
 */
const FRESH_KEY = 'kv_palet_fresh';
/** How long a read of the lines counts as current. */
export const REFRESH_EVERY_MS = 10 * 60_000;

/** The stamp of a finished read: its time (ms), its language and the line ids, in palet order. */
export const refreshStamp = (now: number, lang: string, ids: readonly string[]): string =>
  JSON.stringify({ at: now, lang, ids });

/**
 * Whether a stamp still covers this palet at `now`: the same language, exactly the same line ids
 * in the same order, and younger than REFRESH_EVERY_MS. Anything else (no stamp, a damaged one,
 * a clock set back) has the lines read again.
 */
export function refreshIsFresh(
  stamp: string | null,
  now: number,
  lang: string,
  ids: readonly string[],
): boolean {
  if (!stamp) return false;
  try {
    const s = JSON.parse(stamp) as { at?: unknown; lang?: unknown; ids?: unknown } | null;
    if (!s || typeof s.at !== 'number' || s.lang !== lang || !Array.isArray(s.ids)) return false;
    const age = now - s.at;
    const stamped: unknown[] = s.ids;
    return (
      age >= 0 &&
      age < REFRESH_EVERY_MS &&
      stamped.length === ids.length &&
      ids.every((id, i) => stamped[i] === id)
    );
  } catch {
    return false;
  }
}

export function readRefreshStamp(): string | null {
  try {
    return sessionStorage.getItem(FRESH_KEY);
  } catch {
    return null;
  }
}

export function writeRefreshStamp(stamp: string): void {
  try {
    sessionStorage.setItem(FRESH_KEY, stamp);
  } catch {
    /* private mode: the lines are read again on the next load */
  }
}

/** Forgets the last read, so the next /palet load reads its lines again (`addToCart`). */
function dropRefreshStamp(): void {
  try {
    sessionStorage.removeItem(FRESH_KEY);
  } catch {
    /* private mode: there is no stamp */
  }
}
