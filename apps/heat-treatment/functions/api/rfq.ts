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
 *   MAIL_TO                           — RFQ inbox (default: info@kervanheat.com)
 *   MAIL_FROM                         — sender (default: noreply@kervanheat.com)
 *
 * Attachments: optional files in the multipart field `attachment` (kervanheat.com's form; the
 * breaker form sends none): at most 3, 8 MB in all, PDF / DWG / DXF / STEP / JPG / PNG / WebP,
 * content checked against the extension (functions/_lib/rfq-attachments.ts). Anything else →
 * 422 `{ ok: false, error: 'attachment', reason: 'count' | 'size' | 'type' }`. Accepted files go
 * to the owner as e-mail attachments (CAD files and WebP wrapped in a one-file zip).
 *
 * Response: { ok, emailSent, delivered, emailStatus } — `emailStatus` is a diagnostic
 * (transport name + HTTP status of the last attempt, never a body or key); a honeypot hit
 * reports `{ transport: 'none', status: 'honeypot' }`. `delivered` is true only when an email went
 * out; the forms show success only when it is true.
 */

import {
  MAX_FILES,
  MAX_TOTAL_BYTES,
  toMailAttachments,
  validateAttachments,
  type IncomingFile,
} from '../_lib/rfq-attachments';

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

  // Honeypot — accept and discard. The field is hidden from people, but browser autofill can
  // still copy the visitor's own data into it (a phone number did exactly that), so a value that
  // equals one of the visitor's own fields is treated as autofill, not a bot. The legacy field
  // name "website" is ignored for the same reason. The marker lets a real person who tripped it
  // be told apart from a delivery failure when the response is inspected.
  const trap = clean(form.get('hp_ref'), 200);
  const own = [name, email, phone, company].filter(Boolean);
  if (trap && !own.includes(trap)) {
    const honeypot: EmailStatus = { transport: 'none', status: 'honeypot' };
    return Response.json({ ok: true, emailSent: false, delivered: false, emailStatus: honeypot });
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (!name || !email || !emailValid)
    return Response.json({ ok: false, error: 'validation' }, { status: 422 });

  // Attachments (kervanheat.com form: drawings / photos, field "attachment"). Count and total
  // size are checked before anything is read; then extension and content signature.
  // A refused file fails the whole request (422) so the visitor can fix it; contents are never logged.
  const uploads = form
    .getAll('attachment')
    .filter((v): v is File => typeof v !== 'string' && (v.size > 0 || v.name !== ''));
  if (uploads.length > MAX_FILES)
    return Response.json({ ok: false, error: 'attachment', reason: 'count' }, { status: 422 });
  if (uploads.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES)
    return Response.json({ ok: false, error: 'attachment', reason: 'size' }, { status: 422 });
  const files: IncomingFile[] = [];
  for (const f of uploads)
    files.push({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) });
  const fileError = validateAttachments(files);
  if (fileError)
    return Response.json({ ok: false, error: 'attachment', reason: fileError }, { status: 422 });
  const attachments = toMailAttachments(files);
  const fileList = attachments.map(
    (a, i) => `${a.name} (${(files[i].bytes.length / 1048576).toFixed(2)} MB)`,
  );

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

Files (attached to this email; CAD files and WebP inside a .zip):
${fileList.length ? fileList.join('\n') : 'No attachments'}

Marketing consent: ${marketing ? 'YES' : 'NO'}
Source: ${sourceSite}
IP: ${request.headers.get('CF-Connecting-IP') ?? 'unknown'}
Country (CF): ${request.headers.get('CF-IPCountry') ?? 'unknown'}
UA: ${request.headers.get('User-Agent') ?? 'unknown'}`;

  const mailTo = env.MAIL_TO ?? 'info@kervanheat.com';
  const mailFrom = env.MAIL_FROM ?? 'noreply@kervanheat.com';

  let emailSent = false;
  let emailStatus: EmailStatus = { transport: 'none', status: 'error' };
  if (env.BREVO_API_KEY) {
    const brevo = async (withFiles: boolean): Promise<Response> =>
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': env.BREVO_API_KEY!,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { email: mailFrom, name: 'Kervan RFQ' },
          to: [{ email: mailTo }],
          replyTo: { email, name },
          subject: emailSubject,
          textContent: withFiles
            ? emailBody
            : emailBody +
              (attachments.length
                ? '\n\nNOTE: the mail service refused the attached files; ask the sender to e-mail them.'
                : ''),
          ...(withFiles && attachments.length
            ? { attachment: attachments.map(({ name, content }) => ({ name, content })) }
            : {}),
        }),
        signal: AbortSignal.timeout(8000),
      });
    try {
      let r = await brevo(true);
      // A 400 with files is most likely a refused attachment: send the request without them,
      // so the owner still gets it (the note in the body says the files are missing).
      if (r.status === 400 && attachments.length) {
        console.error('Brevo refused the message with attachments; retrying without them');
        r = await brevo(false);
      }
      emailSent = r.ok;
      emailStatus = { transport: 'brevo', status: r.status };
      // Brevo's error text names the problem; it never echoes attachment contents. Capped anyway.
      if (!r.ok)
        console.error(
          'Brevo fail:',
          r.status,
          (await r.text().catch(() => '<no body>')).slice(0, 300),
        );
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
          ...(attachments.length
            ? {
                attachments: attachments.map(({ name, content }) => ({
                  filename: name,
                  content,
                })),
              }
            : {}),
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
          ...(attachments.length
            ? {
                attachments: attachments.map(({ name, content, type }) => ({
                  filename: name,
                  content,
                  type,
                })),
              }
            : {}),
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
