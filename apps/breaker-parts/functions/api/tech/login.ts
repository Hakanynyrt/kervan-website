import {
  type Ctx,
  allowedHost,
  isConfigured,
  json,
  methodNotAllowed,
  passwordOk,
  sameOriginJson,
  sessionCookies,
  withCookies,
} from '../../_lib/tech-auth';

type Fn = (ctx: Ctx) => Response | Promise<Response>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const onRequestPost: Fn = async ({ request, env }) => {
  const url = new URL(request.url);
  if (!allowedHost(url)) return json({ ok: false, error: 'host' }, 404);
  if (!isConfigured(env)) return json({ ok: false, error: 'not_configured' }, 503);
  if (!sameOriginJson(request, url)) return json({ ok: false, error: 'origin' }, 403);

  const raw = await request.text();
  if (raw.length > 1024) return json({ ok: false, error: 'size' }, 413);
  let password: unknown;
  try {
    password = (JSON.parse(raw) as { password?: unknown }).password;
  } catch {
    return json({ ok: false, error: 'parse' }, 400);
  }
  if (typeof password !== 'string' || password.length === 0 || password.length > 256) {
    return json({ ok: false, error: 'invalid' }, 401);
  }

  if (!(await passwordOk(env, password))) {
    await sleep(800); // slows online guessing; the real defence is a long random password
    return json({ ok: false, error: 'invalid' }, 401);
  }
  return withCookies(json({ ok: true }), await sessionCookies(env, url));
};

export const onRequest: Fn = () => methodNotAllowed();
