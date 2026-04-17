# Go-Live Checklist — kervanheat.com

Follow this in order. Each section has an owner hint in `[brackets]`.

---

## Pre-launch (T-1 week)

### External services

- [ ] **Resend.com** [Hakan] — create account, verify domain `kervanheat.com` (SPF, DKIM, DMARC), generate API key → save as `RESEND_API_KEY`
- [ ] **MailChannels DKIM fallback** [Hakan]
  - Generate DKIM keypair (openssl or `wrangler` docs)
  - Add TXT DNS record: `mailchannels._domainkey.kervanheat.com` with public key
  - Save `MAILCHANNELS_DKIM_PRIVATE_KEY` as CF env var
  - Set `MAILCHANNELS_DKIM_DOMAIN=kervanheat.com`, `MAILCHANNELS_DKIM_SELECTOR=mailchannels`
- [ ] **Google Analytics 4** [Hakan] — create property, copy `G-XXXXXXX` → `PUBLIC_GA4_ID`
- [ ] **Microsoft Clarity** [Hakan] — create project, copy ID → `PUBLIC_CLARITY_ID`
- [ ] **Telegram bot** [Hakan]
  - Chat with `@BotFather` → `/newbot` → save bot token as `TG_BOT_TOKEN`
  - Send `/start` from your own account to the bot
  - `curl https://api.telegram.org/bot<TOKEN>/getUpdates` → copy `chat.id` → `TG_CHAT_ID`
- [ ] **Google Search Console** [Hakan] — add property `kervanheat.com`, verify via DNS TXT
- [ ] **Bing Webmaster Tools** [Hakan] — add site, submit `https://kervanheat.com/sitemap-index.xml`

### Cloudflare Pages project

- [ ] Dashboard → Workers & Pages → Create → Pages → Connect to Git → select `kervanheat-website` repo
- [ ] Production branch: `main`
- [ ] Build command: `npm run build`
- [ ] Build output directory: `dist`
- [ ] Node version: `20`
- [ ] Set **environment variables** (in **both** Production and Preview):

| Variable | Notes |
|---|---|
| `PUBLIC_SITE_URL` | `https://kervanheat.com` (Production), preview URL (Preview) |
| `PUBLIC_GA4_ID` | `G-XXXXXXX` |
| `PUBLIC_CLARITY_ID` | `xxxxxxxxxx` |
| `RESEND_API_KEY` | `re_…` |
| `MAILCHANNELS_DKIM_DOMAIN` | `kervanheat.com` |
| `MAILCHANNELS_DKIM_SELECTOR` | `mailchannels` |
| `MAILCHANNELS_DKIM_PRIVATE_KEY` | multi-line private key, starts `-----BEGIN…` |
| `TG_BOT_TOKEN` | `nnn:yyy` |
| `TG_CHAT_ID` | `-100…` |
| `MAIL_TO` | `sales@kervanheat.com` (or your preferred inbox) |
| `MAIL_FROM` | `noreply@kervanheat.com` |

- [ ] Custom domain: add `kervanheat.com` in Pages project (Cloudflare auto-provisions SSL + proxied DNS)
- [ ] Add `www.kervanheat.com` CNAME → `kervanheat.com` (proxied); `_redirects` will 301 www → apex

### GitHub Secrets

- [ ] `CLOUDFLARE_API_TOKEN` (Pages:Edit scope)
- [ ] `CLOUDFLARE_ACCOUNT_ID`
- [ ] `PUBLIC_GA4_ID`, `PUBLIC_CLARITY_ID`

---

## Content (before go-live)

- [ ] **ISO 9001 cert**: replace placeholders in `src/data/certifications.json` (issuer name, number, valid until)
- [ ] **Product photos**: add real JPGs under `public/images/products/` matching the paths in `breakers.json`
- [ ] **Facility photos**: 8+ high-quality (1920×1080) WebP under `public/images/facility/`
- [ ] **Company story**: fill `/tr/hakkimizda/` and `/en/about/` with real team info, history
- [ ] **KVKK text** + **Privacy policy**: legal review (Turkish lawyer for KVKK, GDPR-savvy reviewer for EN)
- [ ] **VAT / VKN**: replace `[VKN]` in footer with real tax number
- [ ] **Phone**: confirm the number in `WhatsAppFloat.astro`, contact pages, and schemas matches live number (currently `+905316693734`)
- [ ] **3 case studies**: replace placeholder data in `case-studies.json` with real customer stories
- [ ] **3 pillar articles**: expand `[PLACEHOLDER]` bodies in `resources.json` to 1500+ words each
- [ ] **9+ remaining breaker models**: fill skeleton entries in `breakers.json` (Montabert, Indeco, NPK, Epiroc, Krupp, Hanwoo, Toku) with parts + 80+ word TR/EN paragraphs each
- [ ] **VEGA parts CSV → JSON**: import 239-entry catalogue into `src/data/vega-parts.json`

## Fonts & 3D

- [ ] **Inter WOFF2**: download Regular (400) + Bold (700) from rsms.me/inter, place in `public/fonts/`
- [ ] **First 5 GLBs**:
  1. `atlas-copco-hb3000-chisel.glb` ⭐
  2. `featured/hb3000-chisel.glb` (hero showcase)
  3. `furukawa-hb30g-chisel.glb`
  4. `soosan-sb81-chisel.glb`
  5. `atlas-copco-hb3000-piston.glb`
- [ ] Run `gltf-transform optimize` on each, verify < 1.5 MB

## SEO migration (T-1 day)

- [ ] **Screaming Frog** [Hakan] — crawl current live `kervanheat.com`, export URL list
- [ ] **Update `public/_redirects`** — map each legacy URL to new equivalent, uncomment placeholder lines
- [ ] **Sitemap sanity check** — `dist/sitemap-0.xml` should include every programmatic URL + root locales
- [ ] **Hreflang bidirectional test** — pick 5 sample URLs, verify all 3 hreflang lines present
- [ ] **GSC URL inspection** — `https://kervanheat.com/`, `/tr/`, `/en/`, `/tr/kirici-parcalari/atlas-copco/hb3000/chisel/` — manual fetch request
- [ ] **Bing Webmaster** submit sitemap
- [ ] **Rich Results Test** on 5 sample pages:
  - `/tr/kirici-parcalari/atlas-copco/hb3000/chisel/` (Product + Breadcrumb)
  - `/tr/isil-islem/karburizasyon/` (Service + FAQ + Breadcrumb)
  - `/tr/iletisim/` (LocalBusiness + Organization)
  - `/tr/referanslar/otomotiv-disli-sementasyon/` (Article)
  - `/tr/rehber/42crmo-vs-4140-celik-karsilastirmasi/` (Article)

---

## Go-Live (D-Day)

1. [ ] Merge `feature/astro-rebuild` → `develop` → staging preview works
2. [ ] Merge `develop` → `main` via PR (squash recommended)
3. [ ] Cloudflare Pages auto-deploys on push to `main`
4. [ ] DNS switch: if moving from another host, update NS or A/CNAME → Cloudflare
5. [ ] SSL (Universal SSL) auto-issues; verify padlock in browser
6. [ ] Smoke test from real phone + desktop:
   - Hero loads on `/`
   - Nav works, switch TR ↔ EN
   - Browse to a leaf product → Request Quote → fill form → submit → email arrives + Telegram notification
   - WhatsApp float opens correct number
   - Cookie banner appears, Accept → GA4 Realtime shows the visit
7. [ ] GSC URL Inspection: re-fetch the 5 sample URLs, request indexing

## 24–72 hours post-launch

- [ ] **GSC Coverage** report: no critical errors
- [ ] **Crawl errors**: monitor for unexpected 404s → add to `_redirects` if real traffic
- [ ] **Core Web Vitals** (PageSpeed Insights `/chrome-ux-report`): LCP < 2.5s, CLS < 0.05
- [ ] **Form submit** — ensure Telegram messages still flow, Resend dashboard shows deliveries
- [ ] **GA4 Goals** — configure `form_submit`, `whatsapp_click`, `csv_download` as conversions
- [ ] **Rollback dry-run** — test reverting to the previous Cloudflare deployment (don't commit; practice the flow)

## Rollback procedure (critical-error emergency)

1. **Fastest**: Cloudflare Pages → Deployments → previous deployment → **Rollback to this deployment** (≈30 s)
2. **Via git**: `git revert HEAD && git push` → GH Actions redeploys
3. **Nuclear**: flip DNS back to the old host (last resort; breaks form + analytics)

---

## Branch summary (as of final commit)

Run these locally to verify before merging:

```bash
git log --oneline feature/astro-rebuild
git diff --stat main..feature/astro-rebuild
npm run check
npm run build
```

Expected:
- ~14 commits from FAZ 0 through FAZ 14
- **0 TypeScript errors**
- **55 HTML pages**
- **~39 MB dist/** (hero video + pdf dominate)

## Next steps after launch

- Add Hero R3F showcase once GLBs land (stub already in `@react-three/drei` deps)
- Expand programmatic SEO: dimensional variants per chisel (diameter × length → one page each)
- Set up A/B on the RFQ form (3-step vs. single-step) once you have ≥50 submissions/month baseline
- Eng-facing: `@tailwindcss/forms` if you want more polished inputs; not yet needed
