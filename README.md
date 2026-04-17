# Kervan Isıl İşlem — kervanheat.com

Astro 5 + TypeScript + Tailwind v4 + React + Three.js (R3F) + Cloudflare Pages.

**Domain:** kervanheat.com · **Hosting:** Cloudflare Pages (GitHub integration)

## Development

```bash
npm install          # first time
npm run dev          # localhost:4321
npm run check        # astro check (TS + content schema)
npm run build        # dist/
npm run preview:pages # wrangler pages dev — full Pages Functions locally
```

## Project structure

See `CLAUDE.md` for canonical project rules and file tree.

## Deploy

`main` → Cloudflare Pages production (`kervanheat.com`).
`develop` / `feature/*` → preview deployments.

Legacy vanilla HTML/JS site archived in `legacy-backup/` — kept in git history for reference and 301 redirect mapping.

## Cloudflare Pages setup (one-time)

1. Cloudflare Dashboard → Workers & Pages → Create project → Connect to Git
2. Repository: `hakanynyrt/kervan-website`
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
   - Node version: `20`
4. Environment variables (set in Production + Preview):
   - `PUBLIC_GA4_ID`, `PUBLIC_CLARITY_ID`
   - `RESEND_API_KEY`, `MAIL_TO`, `MAIL_FROM`
   - `MAILCHANNELS_DKIM_DOMAIN`, `MAILCHANNELS_DKIM_SELECTOR`, `MAILCHANNELS_DKIM_PRIVATE_KEY`
   - `TG_BOT_TOKEN`, `TG_CHAT_ID`
5. Custom domain: `kervanheat.com` (DNS proxied via Cloudflare, orange cloud ON)
6. Pages Functions: auto-deployed from `functions/` on every build

### GitHub Secrets (for deploy.yml)

- `CLOUDFLARE_API_TOKEN` (scope: Pages edit)
- `CLOUDFLARE_ACCOUNT_ID`
- `PUBLIC_GA4_ID`, `PUBLIC_CLARITY_ID`

### Branch flow

- `feature/*` → preview deploy
- `develop` → staging
- `main` → production

### Rollback

Cloudflare Pages → Deployments → select older deployment → **Rollback to this deployment**.
