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
type DrawingsCtx = { request: Ctx['request']; env: TechEnv & { VEGA_CATALOG?: KvLike } };
type Fn = (ctx: DrawingsCtx) => Response | Promise<Response>;

const KEY = 'drawings:v1';

/** Owner-only technical drawings of the VEGA tips ({ images: { <item id>: base64 PNG } }).
 *  Same rules as /api/tech/catalog: the data lives only in the KV namespace bound as
 *  VEGA_CATALOG, is returned only to a valid session, and the endpoint fails closed
 *  (no session -> 401 before KV is touched; no binding -> 503; empty key -> 404). */
const handle: Fn = async ({ request, env }) => {
  const url = new URL(request.url);
  if (!allowedHost(url) || !(await isAuthed(request, env, url))) {
    return json({ ok: false, authed: false }, 401);
  }
  if (!env.VEGA_CATALOG) return json({ ok: false, authed: true, error: 'not_configured' }, 503);
  let drawings: unknown;
  try {
    drawings = await env.VEGA_CATALOG.get(KEY, 'json');
  } catch {
    return json({ ok: false, authed: true, error: 'drawings' }, 500);
  }
  if (!drawings) return json({ ok: false, authed: true, error: 'empty' }, 404);
  return json({ ok: true, authed: true, drawings });
};

export const onRequestGet: Fn = handle;
export const onRequestHead: Fn = handle;
export const onRequest: Fn = () => methodNotAllowed();
