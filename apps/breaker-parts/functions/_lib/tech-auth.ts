/**
 * Owner-only login for the "Teknik Bilgiler" content.
 *
 * - One shared password (Pages secret TECH_PASSWORD). No user accounts.
 * - Stateless session: an HMAC-signed, expiring, HttpOnly cookie.
 * - Fails CLOSED: if a secret is missing or too short, login answers 503 and
 *   no session is ever accepted.
 * - The protected text is NOT in the repo or the JS bundle; it is read from
 *   the Pages secret TECH_CONTENT and only returned to a valid session.
 *
 * Env (Cloudflare Pages → Settings → Variables and Secrets, as Secrets):
 *   TECH_PASSWORD   ≥ 16 chars (use 20+ random)
 *   SESSION_SECRET  ≥ 32 chars, random
 *   TECH_CONTENT    JSON: { "tr": {...}, "en": {...} }
 *   SESSION_VERSION optional; bump to revoke every session at once
 */

export interface TechEnv {
  TECH_PASSWORD?: string;
  SESSION_SECRET?: string;
  SESSION_VERSION?: string;
  TECH_CONTENT?: string;
}

export type Ctx = { request: Request; env: TechEnv };

export const SESSION_MAX_AGE = 4 * 60 * 60; // 4 h, absolute (no sliding renewal)
export const MIN_PASSWORD = 16;
export const MIN_SECRET = 32;
const HINT_COOKIE = 'kv_tech_hint';

// Only our own custom hostnames may log in or read content — never *.pages.dev
// previews. `localhost` is for `wrangler pages dev`.
const HOSTS = new Set(['kervanbreaker.com', 'www.kervanbreaker.com', 'localhost']);

const enc = new TextEncoder();

export function allowedHost(url: URL): boolean {
  return HOSTS.has(url.hostname);
}

export function isConfigured(env: TechEnv): boolean {
  return (
    typeof env.TECH_PASSWORD === 'string' &&
    env.TECH_PASSWORD.length >= MIN_PASSWORD &&
    typeof env.SESSION_SECRET === 'string' &&
    env.SESSION_SECRET.length >= MIN_SECRET
  );
}

/** Every response (including errors and HEAD) goes through here. */
export function json(body: unknown, status = 200, extra: HeadersInit = {}): Response {
  const h = new Headers(extra);
  h.set('Content-Type', 'application/json; charset=utf-8');
  h.set('Cache-Control', 'private, no-store, max-age=0');
  h.set('Vary', 'Cookie');
  h.set('X-Robots-Tag', 'noindex, nofollow');
  h.set('X-Content-Type-Options', 'nosniff');
  return new Response(JSON.stringify(body), { status, headers: h });
}

export const methodNotAllowed = (): Response => json({ ok: false, error: 'method' }, 405);

/** Mutating requests: same origin + custom header + JSON ⇒ forces a CORS
 *  preflight that this function never approves (we never send Access-Control-*). */
export function sameOriginJson(request: Request, url: URL): boolean {
  return (
    request.headers.get('Origin') === url.origin &&
    request.headers.get('X-Requested-With') === 'kv' &&
    (request.headers.get('Content-Type') ?? '').toLowerCase().startsWith('application/json')
  );
}

const b64url = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromB64url = (s: string): Uint8Array<ArrayBuffer> | null => {
  try {
    const pad = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
    const bin = atob(pad);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
};

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

const hmac = async (key: CryptoKey, msg: string): Promise<Uint8Array<ArrayBuffer>> =>
  new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));

/** Session key depends on SESSION_SECRET, the password and SESSION_VERSION, so
 *  rotating any of them revokes every existing cookie. */
async function sessionKey(env: TechEnv): Promise<CryptoKey> {
  const base = await hmacKey(env.SESSION_SECRET as string);
  const raw = await hmac(
    base,
    `kv-tech-key-v1|${env.TECH_PASSWORD as string}|${env.SESSION_VERSION ?? '1'}`,
  );
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

/** Compare all bytes, no early exit. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const native = (
    crypto.subtle as unknown as {
      timingSafeEqual?: (x: Uint8Array, y: Uint8Array) => boolean;
    }
  ).timingSafeEqual;
  if (a.length !== b.length) return false;
  if (typeof native === 'function') return native.call(crypto.subtle, a, b);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Compares fixed-length HMAC digests of both strings (hides length and timing). */
export async function passwordOk(env: TechEnv, input: string): Promise<boolean> {
  const key = await sessionKey(env);
  const [x, y] = await Promise.all([hmac(key, input), hmac(key, env.TECH_PASSWORD as string)]);
  return timingSafeEqual(x, y);
}

const secureHost = (url: URL): boolean => url.hostname !== 'localhost';
const cookieName = (url: URL): string => (secureHost(url) ? '__Host-kv_tech' : 'kv_tech');

function attrs(url: URL, maxAge: number): string {
  return `Path=/; Max-Age=${maxAge}; SameSite=Strict${secureHost(url) ? '; Secure' : ''}`;
}

export async function sessionCookies(env: TechEnv, url: URL): Promise<string[]> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const payload = `v1.${exp}.${nonce}`;
  const sig = b64url(await hmac(await sessionKey(env), payload));
  return [
    `${cookieName(url)}=${payload}.${sig}; HttpOnly; ${attrs(url, SESSION_MAX_AGE)}`,
    // Non-sensitive hint so the SPA only calls the API when a session may exist.
    `${HINT_COOKIE}=1; ${attrs(url, SESSION_MAX_AGE)}`,
  ];
}

export function clearCookies(url: URL): string[] {
  return [`${cookieName(url)}=; HttpOnly; ${attrs(url, 0)}`, `${HINT_COOKIE}=; ${attrs(url, 0)}`];
}

export const withCookies = (res: Response, cookies: string[]): Response => {
  for (const c of cookies) res.headers.append('Set-Cookie', c);
  return res;
};

export async function isAuthed(request: Request, env: TechEnv, url: URL): Promise<boolean> {
  if (!isConfigured(env)) return false;
  const raw = request.headers.get('Cookie') ?? '';
  const name = cookieName(url);
  const part = raw
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${name}=`));
  if (!part) return false;
  const bits = part.slice(name.length + 1).split('.');
  if (bits.length !== 4 || bits[0] !== 'v1') return false;
  const exp = Number(bits[1]);
  if (!Number.isInteger(exp) || exp <= Math.floor(Date.now() / 1000)) return false;
  const sig = fromB64url(bits[3]);
  if (!sig) return false;
  return crypto.subtle.verify(
    'HMAC',
    await sessionKey(env),
    sig,
    enc.encode(`${bits[0]}.${bits[1]}.${bits[2]}`),
  );
}
