import {
  type DrawingRow,
  type FamilyRow,
  type FitRow,
  type FitsIndex,
  type SkuRow,
  applyDrawings,
  buildFitsIndex,
  toPublicCatalog,
} from '@kervan/tips';
import { DRAWINGS_SQL, FAMILIES_SQL, FITS_SQL, SKUS_NO_PRICES_SQL } from '@kervan/tips/catalog-sql';
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
type FitsCtx = { request: Ctx['request']; env: TechEnv & { SHOP_DB?: D1Like } };
type Fn = (ctx: FitsCtx) => Response | Promise<Response>;

/** One isolate serves many requests: keep the built index a few minutes. */
const TTL_MS = 5 * 60 * 1000;
let cached: { at: number; fits: FitsIndex } | null = null;

async function rows<T>(db: D1Like, sql: string): Promise<T[]> {
  return (await db.prepare(sql).all<T>()).results ?? [];
}

/** Which breakers share one tip ("Ortak uçlar"), owner only. Read from the shop's D1
 *  database (bound read-only in use as SHOP_DB, Production only) the same way the shop's
 *  build reads it: published rows, Kervan's drawings applied, WRONG_FITS and hidden makes
 *  left out (toPublicCatalog). Prices and stock are never selected.
 *  Fails closed: no session -> 401 before D1 is touched; no binding -> 503; no rows -> 404. */
const handle: Fn = async ({ request, env }) => {
  const url = new URL(request.url);
  if (!allowedHost(url) || !(await isAuthed(request, env, url))) {
    return json({ ok: false, authed: false }, 401);
  }
  const db = env.SHOP_DB;
  if (!db) return json({ ok: false, authed: true, error: 'not_configured' }, 503);
  if (cached && Date.now() - cached.at < TTL_MS)
    return json({ ok: true, authed: true, fits: cached.fits });
  let fits: FitsIndex;
  try {
    // The drawings table comes with migration 0004; before it exists there are none.
    let drawings: DrawingRow[] = [];
    try {
      drawings = await rows<DrawingRow>(db, DRAWINGS_SQL);
    } catch {
      drawings = [];
    }
    const [families, skus, links] = await Promise.all([
      rows<FamilyRow>(db, FAMILIES_SQL),
      rows<SkuRow>(db, SKUS_NO_PRICES_SQL),
      rows<FitRow>(db, FITS_SQL),
    ]);
    const own = applyDrawings(families, skus, drawings);
    fits = buildFitsIndex(toPublicCatalog(own.families, own.skus, links));
  } catch {
    return json({ ok: false, authed: true, error: 'fits' }, 500);
  }
  if (fits.families.length === 0) return json({ ok: false, authed: true, error: 'empty' }, 404);
  cached = { at: Date.now(), fits };
  return json({ ok: true, authed: true, fits });
};

export const onRequestGet: Fn = handle;
export const onRequestHead: Fn = handle;
export const onRequest: Fn = () => methodNotAllowed();
