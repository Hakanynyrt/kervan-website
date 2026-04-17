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

const ALLOWED_ORIGINS = [
  'https://kervanheat.com',
  'https://www.kervanheat.com',
  'https://kervanheat.pages.dev',
];

const clean = (v: FormDataEntryValue | null, max = 500): string =>
  String(v ?? '').trim().slice(0, max);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('Origin') ?? request.headers.get('Referer') ?? '';
  const originOk =
    ALLOWED_ORIGINS.some((a) => origin.startsWith(a)) ||
    origin.includes('.pages.dev'); // preview deployments
  if (!originOk) {
    return Response.json({ ok: false, error: 'origin' }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: 'parse' }, { status: 400 });
  }

  // Honeypot
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
  if (!name || !email || !kvkk || !emailValid) {
    return Response.json({ ok: false, error: 'validation' }, { status: 422 });
  }

  // Attached files — metadata only for v1 (R2 in v2)
  const fileList: string[] = [];
  for (const [key, value] of form.entries()) {
    if (key === 'attachment' && value instanceof File) {
      if (value.size > 50 * 1024 * 1024) continue;
      fileList.push(`${value.name} (${(value.size / 1048576).toFixed(2)} MB)`);
    }
  }

  const emailSubject = `[RFQ] ${company || name}${service ? ' — ' + service : ''}`;
  const emailBody = `New RFQ

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
IP: ${request.headers.get('CF-Connecting-IP') ?? 'unknown'}
Country (CF): ${request.headers.get('CF-IPCountry') ?? 'unknown'}
UA: ${request.headers.get('User-Agent') ?? 'unknown'}`;

  const mailTo = env.MAIL_TO ?? 'info@kervanheat.com';
  const mailFrom = env.MAIL_FROM ?? 'noreply@kervanheat.com';

  // Primary: Resend
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

  // Fallback: MailChannels (Cloudflare-native)
  if (!emailSent && env.MAILCHANNELS_DKIM_DOMAIN) {
    try {
      const personalization: Record<string, unknown> = {
        to: [{ email: mailTo }],
        dkim_domain: env.MAILCHANNELS_DKIM_DOMAIN,
        dkim_selector: env.MAILCHANNELS_DKIM_SELECTOR ?? 'mailchannels',
      };
      if (env.MAILCHANNELS_DKIM_PRIVATE_KEY) {
        personalization.dkim_private_key = env.MAILCHANNELS_DKIM_PRIVATE_KEY;
      }
      const r = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [personalization],
          from: { email: mailFrom, name: 'Kervanheat RFQ' },
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

  // Telegram — always attempt, best-effort
  if (env.TG_BOT_TOKEN && env.TG_CHAT_ID) {
    try {
      const tgText =
        `🔔 *New RFQ*\n\n` +
        `*Name:* ${name}\n*Company:* ${company}\n*Email:* ${email}\n*Phone:* ${phone}\n` +
        `*Country:* ${country}\n*Service:* ${service}\n*Qty:* ${qty}\n*Deadline:* ${deadline}\n` +
        `*Files:* ${fileList.length} item(s)\n\n_${(message || '(no message)').slice(0, 500)}_`;
      await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TG_CHAT_ID,
          text: tgText,
          parse_mode: 'Markdown',
        }),
      });
    } catch (e) {
      console.error('Telegram error', e);
    }
  }

  return Response.json({ ok: true, emailSent });
};
