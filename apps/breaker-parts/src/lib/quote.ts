import { type FxRate, grossTryCents } from '@kervan/tips';
import type { Lang } from '../types';

/** One tip SKU as /api/tech/quote returns it (owner only; held in memory, never stored). */
export interface QuoteSku {
  family: string;
  code: string;
  tipType: string;
  priceUsdNetCents: number | null;
  stock: number;
  leadDays: number | null;
}
export interface Quote {
  byFamily: Map<string, QuoteSku[]>;
  fx: FxRate | null;
}

/** The answer of /api/tech/quote, checked; malformed rows are dropped. */
export function parseQuote(raw: unknown): Quote | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as { skus?: unknown; fx?: unknown };
  if (!Array.isArray(b.skus)) return null;
  const byFamily = new Map<string, QuoteSku[]>();
  for (const x of b.skus) {
    if (!x || typeof x !== 'object') continue;
    const r = x as Record<string, unknown>;
    if (typeof r.family !== 'string' || typeof r.code !== 'string') continue;
    const sku: QuoteSku = {
      family: r.family,
      code: r.code,
      tipType: typeof r.tipType === 'string' ? r.tipType : '',
      priceUsdNetCents:
        typeof r.priceUsdNetCents === 'number' && r.priceUsdNetCents > 0
          ? r.priceUsdNetCents
          : null,
      stock: typeof r.stock === 'number' && r.stock > 0 ? r.stock : 0,
      leadDays: typeof r.leadDays === 'number' && r.leadDays > 0 ? r.leadDays : null,
    };
    const list = byFamily.get(sku.family) ?? [];
    list.push(sku);
    byFamily.set(sku.family, list);
  }
  const f = b.fx as { usdTry?: unknown; date?: unknown } | null;
  const fx =
    f && typeof f.usdTry === 'number' && typeof f.date === 'string'
      ? { usdTry: f.usdTry, date: f.date }
      : null;
  return { byFamily, fx };
}

export interface QuoteLabels {
  gross: string;
  net: string;
  ask: string;
  inStock: string;
  lead: string;
  noStock: string;
}

const loc = (lang: Lang) => (lang === 'tr' ? 'tr-TR' : 'en-GB');
const fill = (s: string, v: Record<string, string | number>) =>
  Object.entries(v).reduce((acc, [k, x]) => acc.replace(`{${k}}`, String(x)), s);

/** The price and availability text of one SKU, the way the shop shows them: tax-inclusive TL at
 *  the shop's rate (when known) and the net USD price; else "ask for an offer". */
export function quoteText(
  s: QuoteSku,
  fx: FxRate | null,
  lang: Lang,
  l: QuoteLabels,
): { price: string; avail: string } {
  let price = l.ask;
  if (s.priceUsdNetCents !== null) {
    const nf = new Intl.NumberFormat(loc(lang), { maximumFractionDigits: 2 });
    const net = fill(l.net, { v: nf.format(s.priceUsdNetCents / 100) });
    const g = grossTryCents(s.priceUsdNetCents, fx);
    price =
      g === null
        ? net
        : `${fill(l.gross, { v: new Intl.NumberFormat(loc(lang)).format(g / 100) })} · ${net}`;
  }
  const avail =
    s.stock > 0
      ? fill(l.inStock, { n: s.stock })
      : s.leadDays !== null
        ? fill(l.lead, { n: s.leadDays })
        : l.noStock;
  return { price, avail };
}
