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
  /** Spare parts: the part's name as shown when it was added (e.g. "kafa burcu (alt burç)"). */
  label?: string;
  /** Kervan SKU code (for our order handling), null for an extra product. */
  code: string | null;
  /** Neutral path of the product page. */
  path: string;
  /** Unit price at the time it was added (net USD cents), null = ask. */
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
      ? v.filter(
          (x): x is CartItem =>
            !!x &&
            typeof x.id === 'string' &&
            typeof x.name === 'string' &&
            Number.isInteger(x.qty),
        )
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
  if (hit) hit.qty = Math.min(MAX_QTY, hit.qty + qty);
  else items.push({ ...item, qty: Math.min(MAX_QTY, qty) });
  writeCart(items);
}

export const cartCount = (items: CartItem[]): number => items.reduce((n, x) => n + x.qty, 0);
