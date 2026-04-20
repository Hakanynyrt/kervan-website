# kervanheat.com

Production static site for Kervan Heat Treatment — heat-treated chisels, pistons and kits for hydraulic breakers.

## Stack

- **Static HTML + inline JSX** (React via CDN, Babel standalone) — no build step
- **Cloudflare Worker** (`src/worker/index.ts`) — serves `public/` assets + handles `/api/rfq` RFQ submissions (Resend → MailChannels fallback + Telegram notifications)

## Layout

- `public/` — all static assets served by Cloudflare (HTML, JSX, CSS, images)
- `src/worker/index.ts` — Cloudflare Worker entry (static assets + RFQ API)
- `legacy-astro/` — previous Astro build, archived for reference

## Deploy

Cloudflare Pages is connected to the `main` branch. Every push deploys automatically.

For local preview:
```
npm install
npm run dev
```

## Environment variables (Cloudflare dashboard)

Required for the RFQ form to deliver email + Telegram:

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Primary email sender |
| `MAILCHANNELS_DKIM_DOMAIN` | Fallback email sender |
| `MAILCHANNELS_DKIM_SELECTOR` | DKIM selector |
| `MAILCHANNELS_DKIM_PRIVATE_KEY` | DKIM private key |
| `TG_BOT_TOKEN` | Telegram bot token |
| `TG_CHAT_ID` | Telegram chat ID for RFQ alerts |
| `MAIL_TO` | Destination inbox (default: info@kervanheat.com) |
| `MAIL_FROM` | Sender address (default: noreply@kervanheat.com) |

## Pages

- `/` — homepage (TR/EN/DE/RU)
- `/about.html` — company story, Hakan Yünyurt bio
- `/catalog.html` — full parts catalog (print-ready)
- `/cases.html` — case studies
- `/gallery.html` — workshop grid
- `/certs.html` — certifications
- `/blog.html` + `/post.html` — resources
- `/diagram.html` — interactive exploded breaker
- `/compat.html` — compatibility finder
- `/part.html` — individual part detail
