/**
 * RFQ Pages Function — kervanheat.com/api/rfq
 *
 * Ported from src/worker/index.ts (legacy Cloudflare Worker). Same logic:
 * validate origin → KVKK consent → email format → Resend → MailChannels
 * fallback → Telegram notification. Both kervanheat.com (same-origin) and
 * kervanbreaker.com (cross-origin) post here; CORS allowlist gates access.
 *
 * Env vars (set in Cloudflare Pages project settings, not via .env):
 *   RESEND_API_KEY                    — primary email transport
 *   MAILCHANNELS_DKIM_DOMAIN          — fallback transport
 *   MAILCHANNELS_DKIM_SELECTOR        — DKIM selector for MailChannels
 *   MAILCHANNELS_DKIM_PRIVATE_KEY     — DKIM private key for MailChannels
 *   TG_BOT_TOKEN, TG_CHAT_ID          — Telegram alerts
 *   MAIL_TO                           — RFQ inbox (default: ahmet@kervanheat.com)
 *   MAIL_FROM                         — sender (default: noreply@kervanheat.com)
 */

interface Env {
  RESEND_API_KEY?: string;
  MAILCHANNELS_DKIM_DOMAIN?: string;
  MAILCHANNELS_DKIM_SELECTOR?: string;
  MAILCHANNELS_DKIM_PRIVATE_KEY?: string;
  TG_BOT_TOKEN?: string;
  TG_CHAT_ID?: string;
  MAIL_TO?: string;
  MAIL_FROM?: string;
}

// Self-contained Pages Function type — avoids needing @cloudflare/workers-types
// here. Cloudflare Pages bundles this file at deploy time; this type is just
// for editor / typecheck correctness.
type PagesFunction<E = unknown> = (context: {
  request: Request;
  env: E;
  params: Record<string, string | string[]>;
  data: Record<string, unknown>;
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
}) => Response | Promise<Response>;

const ALLOWED_ORIGINS = [
  'https://kervanheat.com',
  'https://www.kervanheat.com',
  'https://kervanbreaker.com',
  'https://www.kervanbreaker.com',
];

function corsOrigin(request: Request): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // Cloudflare Pages preview deployments
  if (origin.endsWith('.pages.dev')) return origin;
  return null;
}

function withCors(res: Response, request: Request): Response {
  const allow = corsOrigin(request);
  if (!allow) return res;
  const h = new Headers(res.headers);
  h.set('Access-Control-Allow-Origin', allow);
  h.set('Vary', 'Origin');
  return new Response(res.body, { status: res.status, headers: h });
}

function withSecurityHeaders(res: Response): Response {
  const h = new Headers(res.headers);
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'no-referrer');
  h.set('Cache-Control', 'no-store');
  return new Response(res.body, { status: res.status, headers: h });
}

const clean = (v: FormDataEntryValue | null, max = 500): string =>
  String(v ?? '').trim().slice(0, max);

async function handleRfq(
  request: Request,
  env: Env,
  waitUntil: (promise: Promise<unknown>) => void,
): Promise<Response> {
  const origin = request.headers.get('Origin') ?? request.headers.get('Referer') ?? '';
  const originOk =
    ALLOWED_ORIGINS.some((a) => origin.startsWith(a)) || origin.includes('.pages.dev');
  if (!originOk) return Response.json({ ok: false, error: 'origin' }, { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: 'parse' }, { status: 400 });
  }

  // Honeypot — silently accept and discard
  if (form.get('website')) return Response.json({ ok: true });

  const name = clean(form.get('name'), 100);
  const email = clean(form.get('email'), 200);
  const phone = clean(form.get('phone'), 30);
  const company = clean(form.get('company'), 150);
  const service = clean(form.get('service'), 80);
  const qty = clean(form.get('qty'), 20);
  const deadline = clean(form.get('deadline'), 50);
  const country = clean(form.get('country'), 80);
  const specs = clean(form.get('specs'), 2000);
  const message = clean(form.get('message'), 3000);
  const kvkk = form.get('kvkk_consent') === '1' || form.get('kvkk_consent') === 'on';
  const marketing =
    form.get('marketing_consent') === '1' || form.get('marketing_consent') === 'on';

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (!name || !email || !kvkk || !emailValid)
    return Response.json({ ok: false, error: 'validation' }, { status: 422 });

  const fileList: string[] = [];
  for (const [key, value] of form.entries()) {
    if (key === 'attachment' && value instanceof File) {
      if (value.size > 50 * 1024 * 1024) continue;
      fileList.push(`${value.name} (${(value.size / 1048576).toFixed(2)} MB)`);
    }
  }

  // Identify which site sent the request — useful for routing in inbox
  const sourceSite = origin.includes('kervanbreaker.com')
    ? 'kervanbreaker.com'
    : 'kervanheat.com';

  const emailSubject = `[RFQ · ${sourceSite}] ${company || name}${service ? ' — ' + service : ''}`;
  const emailBody = `New RFQ — ${sourceSite}

Name: ${name}
Company: ${company}
Email: ${email}
Phone: ${phone}
Country: ${country}
Service/Part: ${service}
Quantity: ${qty}
Deadline: ${deadline}

Specs:
${specs || '(not specified)'}

Message:
${message || '(none)'}

Files:
${fileList.length ? fileList.join('\n') : 'No attachments'}

Marketing consent: ${marketing ? 'YES' : 'NO'}
KVKK consent: ${kvkk ? 'YES' : 'NO'}
Source: ${sourceSite}
IP: ${request.headers.get('CF-Connecting-IP') ?? 'unknown'}
Country (CF): ${request.headers.get('CF-IPCountry') ?? 'unknown'}
UA: ${request.headers.get('User-Agent') ?? 'unknown'}`;

  const mailTo = env.MAIL_TO ?? 'ahmet@kervanheat.com';
  const mailFrom = env.MAIL_FROM ?? 'noreply@kervanheat.com';

  let emailSent = false;
  if (env.RESEND_API_KEY) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: mailFrom,
          to: mailTo,
          reply_to: email,
          subject: emailSubject,
          text: emailBody,
        }),
      });
      emailSent = r.ok;
    } catch (e) {
      console.error('Resend error', e);
    }
  }

  if (!emailSent && env.MAILCHANNELS_DKIM_DOMAIN) {
    try {
      const personalization: Record<string, unknown> = {
        to: [{ email: mailTo }],
        dkim_domain: env.MAILCHANNELS_DKIM_DOMAIN,
        dkim_selector: env.MAILCHANNELS_DKIM_SELECTOR ?? 'mailchannels',
      };
      if (env.MAILCHANNELS_DKIM_PRIVATE_KEY)
        personalization.dkim_private_key = env.MAILCHANNELS_DKIM_PRIVATE_KEY;
      const r = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [personalization],
          from: { email: mailFrom, name: 'Kervan RFQ' },
          reply_to: { email },
          subject: emailSubject,
          content: [{ type: 'text/plain', value: emailBody }],
        }),
      });
      emailSent = r.ok;
    } catch (e) {
      console.error('MailChannels error', e);
    }
  }

  if (env.TG_BOT_TOKEN && env.TG_CHAT_ID) {
    const tgText = `🔔 New RFQ — ${sourceSite}\n\nName: ${name}\nCompany: ${company}\nEmail: ${email}\nPhone: ${phone}\nCountry: ${country}\nService: ${service}\nQty: ${qty}\nFiles: ${fileList.length} item(s)\n\nMessage:\n${(message || '(no message)').slice(0, 500)}`;
    waitUntil(
      fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TG_CHAT_ID,
          text: tgText,
        }),
      })
        .then(async (r) => {
          if (!r.ok) {
            const body = await r.text().catch(() => '<no body>');
            console.error('telegram fail:', r.status, body);
          } else {
            console.log('telegram ok');
          }
        })
        .catch((err: unknown) => {
          const e = err as { message?: string; stack?: string };
          console.error('telegram throw:', e?.message, e?.stack);
        }),
    );
  }

  return Response.json({ ok: true, emailSent });
}

/* ═══════════════════════════════════════════════════════════════════════
   Pages Function exports — Cloudflare invokes the matching one based on
   request method.
═══════════════════════════════════════════════════════════════════════ */

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  return withCors(withSecurityHeaders(await handleRfq(request, env, waitUntil)), request);
};

export const onRequestOptions: PagesFunction<Env> = async ({ request }) => {
  // CORS preflight for cross-origin form posts (kervanbreaker.com → here).
  const allow = corsOrigin(request);
  if (!allow) return new Response(null, { status: 204 });
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allow,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    },
  });
};

export const onRequest: PagesFunction<Env> = async () => {
  // Any other method (GET, PUT, DELETE) → 405
  return Response.json({ ok: false, error: 'method' }, { status: 405 });
};
