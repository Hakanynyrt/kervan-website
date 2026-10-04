import {
  type Ctx,
  allowedHost,
  clearCookies,
  json,
  methodNotAllowed,
  sameOriginJson,
  withCookies,
} from '../../_lib/tech-auth';

type Fn = (ctx: Ctx) => Response | Promise<Response>;

export const onRequestPost: Fn = ({ request }) => {
  const url = new URL(request.url);
  if (!allowedHost(url)) return json({ ok: false, error: 'host' }, 404);
  if (!sameOriginJson(request, url)) return json({ ok: false, error: 'origin' }, 403);
  return withCookies(json({ ok: true }), clearCookies(url));
};

export const onRequest: Fn = () => methodNotAllowed();
