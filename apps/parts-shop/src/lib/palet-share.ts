import { MAX_QTY, type CartItem } from './cart.ts';

/**
 * "Paleti paylaş": a /palet link that carries only the palet's line ids and quantities
 * (`/palet?p=<id>*<qty>,<id>*<qty>`), never a price, a name or contact details. Opening it asks
 * once, then the lines are merged into this browser's palet with their names and prices read
 * again from the product pages the ids name (`linePagePath`; lib/palet-lines.ts fetches each page
 * and reads its embedded props), so no file ever carries more prices than one page shows. /palet
 * stays noindex with its clean self canonical, and the page drops the query once it is handled.
 */

/** The query parameter of a shared palet. */
export const PALET_PARAM = 'p';
/** At most this many lines are read from one link (a palet is an order, not a catalogue). */
export const MAX_SHARED_LINES = 100;
/** Line ids are product paths (`/kirici/…|keski`, `/yedek-parca/…#b`) or `listed:…`. */
const MAX_ID = 200;
const ID_SHAPE = /^(?:\/|listed:)\S*$/;

/** The shareable part of a palet line. */
export interface SharedLine {
  id: string;
  qty: number;
}

/** A catalogue line as the palet stores it, without the quantity. */
export type PaletLine = Omit<CartItem, 'qty'>;

/** The orderable lines of some product pages in one language, by line id (lib/palet-lines.ts). */
export type PaletLines = Record<string, Omit<PaletLine, 'id'>>;

/** A same-site page path: plain slugs only, never `//host` or `..`. */
const PAGE_PATH = /^\/(?!\/)[A-Za-z0-9._~/-]*$/;

/**
 * The neutral (Turkish) path of the page that puts a line id on the palet, or null for an id of
 * no known shape: a tip's breaker or family page (`path|size|type`), a modelled part's item page
 * (`#b` dropped), a listed part's group page (`partsPath/<part>`).
 */
export function linePagePath(id: string, partsPath: string): string | null {
  let p: string;
  if (id.startsWith('listed:')) p = `${partsPath}/${id.slice(7).split('/')[0]}`;
  else if (id.includes('|')) p = id.slice(0, id.indexOf('|'));
  else p = id.replace(/#b$/, '');
  return PAGE_PATH.test(p) && !p.includes('..') && p.length > 1 ? p : null;
}

/* Ids are percent-encoded, keeping `/` and `:` readable; `*` and `,` (the separators) and `|`,
 * `#` are always encoded. */
const encodeId = (id: string): string =>
  encodeURIComponent(id).replace(/%2F/gi, '/').replace(/%3A/gi, ':').replace(/\*/g, '%2A');

/** The `p` value of a palet: `id*qty` per line, comma separated, in palet order. */
export const encodePalet = (items: readonly SharedLine[]): string =>
  items
    .filter((x) => x.id && Number.isInteger(x.qty) && x.qty >= 1)
    .map((x) => `${encodeId(x.id)}*${Math.min(MAX_QTY, x.qty)}`)
    .join(',');

/** The full shareable link of a palet: `base` is the site, `cartPath` the language's /palet. */
export const paletLink = (base: string, cartPath: string, items: readonly SharedLine[]): string =>
  `${base}${cartPath}?${PALET_PARAM}=${encodePalet(items)}`;

/**
 * The raw (still percent-encoded) `p` value of a query string, or null. Read by hand: the
 * URLSearchParams decoding would turn an encoded `,` or `*` in an id into a separator.
 */
export function paletParam(search: string): string | null {
  for (const part of search.replace(/^\?/, '').split('&')) {
    const eq = part.indexOf('=');
    if (eq > 0 && part.slice(0, eq) === PALET_PARAM) return part.slice(eq + 1);
  }
  return null;
}

/**
 * The lines of a `p` value. A malformed entry (no `*`, bad encoding, an id of another shape, a
 * quantity that is not a whole number from 1) is skipped and counted in `bad`; a quantity above
 * MAX_QTY is cut to it; the same id twice is one line with the quantities added (MAX_QTY at
 * most). At most MAX_SHARED_LINES lines.
 */
export function decodePalet(raw: string | null): { lines: SharedLine[]; bad: number } {
  const lines: SharedLine[] = [];
  let bad = 0;
  if (!raw) return { lines, bad };
  for (const entry of raw.split(',')) {
    if (!entry) continue;
    const star = entry.lastIndexOf('*');
    const qtyText = star > 0 ? entry.slice(star + 1) : '';
    let id: string;
    try {
      id = decodeURIComponent(entry.slice(0, star));
    } catch {
      bad++;
      continue;
    }
    if (star <= 0 || !/^\d{1,6}$/.test(qtyText) || id.length > MAX_ID || !ID_SHAPE.test(id)) {
      bad++;
      continue;
    }
    const qty = Math.min(MAX_QTY, Number(qtyText));
    if (qty < 1) {
      bad++;
      continue;
    }
    const hit = lines.find((x) => x.id === id);
    if (hit) hit.qty = Math.min(MAX_QTY, hit.qty + qty);
    else if (lines.length < MAX_SHARED_LINES) lines.push({ id, qty });
    else bad++;
  }
  return { lines, bad };
}

/**
 * Shared lines merged into the stored palet: each found id with its page's current name and
 * price, its quantity added to a line already there (MAX_QTY at most); ids the catalogue no
 * longer has are left out and counted.
 */
export function mergeShared(
  stored: readonly CartItem[],
  shared: readonly SharedLine[],
  catalogue: PaletLines,
): { items: CartItem[]; added: CartItem[]; dropped: number } {
  const items = stored.map((x) => ({ ...x }));
  const added: CartItem[] = [];
  let dropped = 0;
  for (const s of shared) {
    const line = Object.prototype.hasOwnProperty.call(catalogue, s.id) ? catalogue[s.id] : null;
    if (!line) {
      dropped++;
      continue;
    }
    const fresh: CartItem = { ...line, id: s.id, qty: s.qty };
    added.push(fresh);
    const hit = items.find((x) => x.id === s.id);
    if (hit) Object.assign(hit, line, { qty: Math.min(MAX_QTY, hit.qty + s.qty) });
    else items.push(fresh);
  }
  return { items, added, dropped };
}

/** The query string without the palet parameter ('' or '?…'), for history.replaceState. */
export function withoutPalet(search: string): string {
  const rest = search
    .replace(/^\?/, '')
    .split('&')
    .filter((part) => part && !part.startsWith(`${PALET_PARAM}=`) && part !== PALET_PARAM);
  return rest.length ? `?${rest.join('&')}` : '';
}

/* Line ids, shared by the pages that put lines on the palet and lib/palet-lines.ts. */

/** A tip: the page path, the size (1-based) when the breaker takes two sizes, the tip type. */
export const tipLineId = (path: string, size: number | null, tipType: string): string =>
  `${path}${size !== null ? `|${size}` : ''}|${tipType}`;

/** A modelled part: its item page, `#b` for a front head with its bush fitted (burçlu). */
export const partLineId = (itemPath: string, fitted: boolean): string =>
  fitted ? `${itemPath}#b` : itemPath;

/** A listed part (no page of its own): group, breaker slug and part type. */
export const listedLineId = (part: string, breakerSlug: string, type: string): string =>
  `listed:${part}/${breakerSlug}/${type}`;
