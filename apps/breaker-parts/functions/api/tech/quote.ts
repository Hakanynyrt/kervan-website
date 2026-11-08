import { fxFromShopHtml } from '@kervan/tips';
import { FAMILIES_SQL, SKUS_SQL } from '@kervan/tips/catalog-sql';
import {
  type Ctx,
  type TechEnv,
  allowedHost,
  isAuthed,
  json,
  methodNotAllowed,
} from '../../_lib/tech-auth';

/** Minimal slice of a D1 binding (avoids a workers-types dependency). Read-only use: SELECT. */
interface D1Like {
  prepare(sql: string): { all<T>(): Promise<{ results?: T[] }> };
}
type QuoteCtx = { request: Ctx['request']; env: TechEnv & { SHOP_DB?: D1Like } };
type Fn = (ctx: QuoteCtx) => Response | Promise<Response>;

interface FamilyRow {
  id: number;
  code: string;
}
interface SkuRow {
  family_id: number;
  code: string;
  tip_type: string;
  price_usd_net_cents: number | null;
  stock_qty: number | null;
  lead_time_days: number | null;
}
export interface QuoteSku {
  family: string;
  code: string;
  tipType: string;
  priceUsdNetCents: number | null;
  stock: number;
  leadDays: number | null;
}

/** Shop page that carries the shop's published CBRT rate in its page JSON. */
const SHOP_FX_PAGE = 'https://kiriciparca.com/';
const TTL_MS = 5 * 60 * 1000;
let cached: { at: number; body: unknown } | null = null;

/** Owner-only quote data for the shared-tips tab: per tip SKU the shop's net price, stock and lead
 *  time (shop D1, the same published rows the shop shows), plus the shop's own rate so the TL
 *  figure matches kiriciparca.com. Fails closed: no session -> 401 before D1 is touched; no
 *  binding -> 503. Prices never leave this answer: no logging, held in browser memory only. */
const handle: Fn = async ({ request, env }) => {
  const url = new URL(request.url);
  if (!allowedHost(url) || !(await isAuthed(request, env, url))) {
    return json({ ok: false, authed: false }, 401);
  }
  const db = env.SHOP_DB;
  if (!db) return json({ ok: false, authed: true, error: 'not_configured' }, 503);
  if (cached && Date.now() - cached.at < TTL_MS) return json(cached.body);
  let skus: QuoteSku[];
  try {
    const [fams, rows] = await Promise.all([
      db.prepare(FAMILIES_SQL).all<FamilyRow>(),
      db.prepare(SKUS_SQL).all<SkuRow>(),
    ]);
    const code = new Map((fams.results ?? []).map((f) => [f.id, f.code]));
    skus = (rows.results ?? []).flatMap((r) => {
      const family = code.get(r.family_id);
      return family
        ? [
            {
              family,
              code: r.code,
              tipType: r.tip_type,
              priceUsdNetCents: r.price_usd_net_cents ?? null,
              stock: r.stock_qty ?? 0,
              leadDays: r.lead_time_days ?? null,
            },
          ]
        : [];
    });
  } catch {
    return json({ ok: false, authed: true, error: 'quote' }, 500);
  }
  // The shop's own published rate; without it the line shows USD only (never a guessed rate).
  let fx = null;
  try {
    const r = await fetch(SHOP_FX_PAGE, { headers: { Accept: 'text/html' } });
    if (r.ok) fx = fxFromShopHtml(await r.text());
  } catch {
    fx = null;
  }
  const body = { ok: true, authed: true, skus, fx };
  cached = { at: Date.now(), body };
  return json(body);
};

export const onRequestGet: Fn = handle;
export const onRequestHead: Fn = handle;
export const onRequest: Fn = () => methodNotAllowed();
