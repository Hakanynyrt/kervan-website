import { type Ctx, allowedHost, isAuthed, json, methodNotAllowed } from '../../_lib/tech-auth';

type Fn = (ctx: Ctx) => Response | Promise<Response>;

const handle: Fn = async ({ request, env }) => {
  const url = new URL(request.url);
  if (!allowedHost(url) || !(await isAuthed(request, env, url))) {
    return json({ ok: false, authed: false }, 401);
  }
  let content: unknown;
  try {
    content = JSON.parse(env.TECH_CONTENT ?? '');
  } catch {
    return json({ ok: false, authed: true, error: 'content' }, 500);
  }
  return json({ ok: true, authed: true, content });
};

export const onRequestGet: Fn = handle;
export const onRequestHead: Fn = handle;
export const onRequest: Fn = () => methodNotAllowed();
