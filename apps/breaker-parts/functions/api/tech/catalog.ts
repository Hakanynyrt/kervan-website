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
  return json({ ok: true, authed: true, catalog });
};

export const onRequestGet: Fn = handle;
export const onRequestHead: Fn = handle;
export const onRequest: Fn = () => methodNotAllowed();
