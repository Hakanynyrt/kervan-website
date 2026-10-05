import {
  type Ctx,
  type TechEnv,
  allowedHost,
  isAuthed,
  json,
  methodNotAllowed,
} from '../../_lib/tech-auth';

/** Minimal slice of a Workers KV binding (avoids a workers-types dependency). */
interface KvLike {
  get(key: string, type: 'json'): Promise<unknown>;
}
type CatalogCtx = { request: Ctx['request']; env: TechEnv & { VEGA_CATALOG?: KvLike } };
type Fn = (ctx: CatalogCtx) => Response | Promise<Response>;

const KEY = 'catalog:v1';
/** Owner-edited list of tips that sell well in Turkey (optional, small JSON). */
const POPULAR_KEY = 'popular:v1';
/** Owner-only reading guide (e.g. where a tip breaks and how warranty is judged). */
const GUIDE_KEY = 'guide:v1';

/** Owner-only VEGA tip catalog. The data lives in the KV namespace bound as
 *  VEGA_CATALOG (never in git or the bundle) and is returned only to a valid session.
 *  Fails closed: no session -> 401 before KV is touched; no binding -> 503. */
const handle: Fn = async ({ request, env }) => {
  const url = new URL(request.url);
  if (!allowedHost(url) || !(await isAuthed(request, env, url))) {
    return json({ ok: false, authed: false }, 401);
  }
  if (!env.VEGA_CATALOG) return json({ ok: false, authed: true, error: 'not_configured' }, 503);
  let catalog: unknown;
  try {
    catalog = await env.VEGA_CATALOG.get(KEY, 'json');
  } catch {
    return json({ ok: false, authed: true, error: 'catalog' }, 500);
  }
  if (!catalog) return json({ ok: false, authed: true, error: 'empty' }, 404);
  // A missing or malformed popular list must never break the catalog.
  let popular: unknown = null;
  try {
    popular = await env.VEGA_CATALOG.get(POPULAR_KEY, 'json');
  } catch {
    popular = null;
  }
  let guide: unknown = null;
  try {
    guide = await env.VEGA_CATALOG.get(GUIDE_KEY, 'json');
  } catch {
    guide = null;
  }
  return json({ ok: true, authed: true, catalog, popular, guide });
};

export const onRequestGet: Fn = handle;
export const onRequestHead: Fn = handle;
export const onRequest: Fn = () => methodNotAllowed();
