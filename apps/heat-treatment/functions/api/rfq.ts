/**
 * RFQ Pages Function — kervanheat.com/api/rfq
 *
 * Ported from src/worker/index.ts (legacy Cloudflare Worker). Same logic:
 * validate origin → email format → Brevo → Resend → MailChannels
 * fallback. Both kervanheat.com (same-origin) and
 * kervanbreaker.com (cross-origin) post here; CORS allowlist gates access.
 *
 * Env vars (set in Cloudflare Pages project settings, not via .env):
 *   BREVO_API_KEY                     — primary email transport (Brevo transactional API)
 *   RESEND_API_KEY                    — fallback transport
 *   MAILCHANNELS_DKIM_DOMAIN          — fallback transport
 *   MAILCHANNELS_DKIM_SELECTOR        — DKIM selector for MailChannels
 *   MAILCHANNELS_DKIM_PRIVATE_KEY     — DKIM private key for MailChannels
 *   MAIL_TO                           — RFQ inbox (default: ahmet@kervanheat.com)
 *   MAIL_FROM                         — sender (default: noreply@kervanheat.com)
 *
 * Response: { ok, emailSent, delivered, emailStatus } — `emailStatus` is a diagnostic
 * (transport name + HTTP status of the last attempt, never a body or key); a honeypot hit
 * reports `{ transport: 'none', status: 'honeypot' }`. `delivered` is true only when an email went
 * out; the forms show success only when it is true.
 */

interface Env {
  BREVO_API_KEY?: string;
  RESEND_API_KEY?: string;
  MAILCHANNELS_DKIM_DOMAIN?: string;
  MAILCHANNELS_DKIM_SELECTOR?: string;
  MAILCHANNELS_DKIM_PRIVATE_KEY?: string;
  MAIL_TO?: string;
  MAIL_FROM?: string;
}

// Which transport was tried last and how it ended. Diagnostic only: a status code or a
// short marker, never a response body, key or address.
type EmailStatus = {
  transport: 'brevo' | 'resend' | 'mailchannels' | 'none';
  status: number | 'error' | 'honeypot';
};

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

const ALLOWED_ORIGINS = new Set([
  'https://kervanheat.com',
  'https://www.kervanheat.com',
  'https://kervanbreaker.com',
  'https://www.kervanbreaker.com',
]);

// Our own Pages projects only: <project>.pages.dev and <branch|hash>.<project>.pages.dev.
// A bare `.pages.dev` suffix check would let any attacker-owned Pages site through.
const PREVIEW_ORIGIN =
  /^https:\/\/(?:[a-z0-9-]+\.)?kervan-(?:heat-treatment|breaker-parts)\.pages\.dev$/;

// Exact-match check on the Origin header, shared by CORS and the POST gate.
// Browsers always send Origin on POST, so there is no Referer fallback.
function allowedOrigin(request: Request): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  return ALLOWED_ORIGINS.has(origin) || PREVIEW_ORIGIN.test(origin) ? origin : null;
}

function withCors(res: Response, request: Request): Response {
  const allow = allowedOrigin(request);
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
  String(v ?? '')
    .trim()
    .slice(0, max);

async function handleRfq(request: Request, env: Env): Promise<Response> {
  const origin = allowedOrigin(request);
  if (!origin) return Response.json({ ok: false, error: 'origin' }, { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: 'parse' }, { status: 400 });
  }

  // Honeypot — accept and discard. The marker lets a real person who tripped it (autofill)
  // be told apart from a delivery failure when the response is inspected.
  if (form.get('website')) {
    const honeypot: EmailStatus = { transport: 'none', status: 'honeypot' };
    return Response.json({ ok: true, emailSent: false, delivered: false, emailStatus: honeypot });
  }

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
  const marketing = form.get('marketing_consent') === '1' || form.get('marketing_consent') === 'on';

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (!name || !email || !emailValid)
    return Response.json({ ok: false, error: 'validation' }, { status: 422 });

  const fileList: string[] = [];
  for (const [key, value] of form.entries()) {
    if (key === 'attachment' && value instanceof File) {
      if (value.size > 50 * 1024 * 1024) continue;
      fileList.push(`${value.name} (${(value.size / 1048576).toFixed(2)} MB)`);
    }
  }

  // Identify which site sent the request — useful for routing in inbox
  const host = new URL(origin).hostname;
  const sourceSite =
    host.endsWith('kervanbreaker.com') || host.endsWith('kervan-breaker-parts.pages.dev')
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
Source: ${sourceSite}
IP: ${request.headers.get('CF-Connecting-IP') ?? 'unknown'}
Country (CF): ${request.headers.get('CF-IPCountry') ?? 'unknown'}
UA: ${request.headers.get('User-Agent') ?? 'unknown'}`;

  const mailTo = env.MAIL_TO ?? 'ahmet@kervanheat.com';
  const mailFrom = env.MAIL_FROM ?? 'noreply@kervanheat.com';

  let emailSent = false;
  let emailStatus: EmailStatus = { transport: 'none', status: 'error' };
  if (env.BREVO_API_KEY) {
    try {
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { email: mailFrom, name: 'Kervan RFQ' },
          to: [{ email: mailTo }],
          replyTo: { email, name },
          subject: emailSubject,
          textContent: emailBody,
        }),
        signal: AbortSignal.timeout(8000),
      });
      emailSent = r.ok;
      emailStatus = { transport: 'brevo', status: r.status };
      if (!r.ok) console.error('Brevo fail:', r.status, await r.text().catch(() => '<no body>'));
    } catch (e) {
      emailStatus = { transport: 'brevo', status: 'error' };
      console.error('Brevo error', e);
    }
  }

  if (!emailSent && env.RESEND_API_KEY) {
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
      emailStatus = { transport: 'resend', status: r.status };
    } catch (e) {
      emailStatus = { transport: 'resend', status: 'error' };
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
      emailStatus = { transport: 'mailchannels', status: r.status };
    } catch (e) {
      emailStatus = { transport: 'mailchannels', status: 'error' };
      console.error('MailChannels error', e);
    }
  }

  // `delivered` is what the forms trust: the request reached the owner by email.
  // (`emailSent` stays for older clients.)
  return Response.json({ ok: true, emailSent, delivered: emailSent, emailStatus });
}

/* ═══════════════════════════════════════════════════════════════════════
   Pages Function exports — Cloudflare invokes the matching one based on
   request method.
═══════════════════════════════════════════════════════════════════════ */

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  return withCors(withSecurityHeaders(await handleRfq(request, env)), request);
};

export const onRequestOptions: PagesFunction<Env> = async ({ request }) => {
  // CORS preflight for cross-origin form posts (kervanbreaker.com → here).
  const allow = allowedOrigin(request);
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
