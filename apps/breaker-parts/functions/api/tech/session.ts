import {
  type Ctx,
  allowedHost,
  isAuthed,
  isConfigured,
  json,
  methodNotAllowed,
} from '../../_lib/tech-auth';

type Fn = (ctx: Ctx) => Response | Promise<Response>;

/** Always 200. `authed` is only a UI hint; /api/tech/content re-verifies. */
export const onRequestGet: Fn = async ({ request, env }) => {
  const url = new URL(request.url);
  if (!allowedHost(url)) return json({ ok: true, authed: false, configured: false });
  return json({
    ok: true,
    authed: await isAuthed(request, env, url),
    configured: isConfigured(env),
  });
};

export const onRequest: Fn = () => methodNotAllowed();
