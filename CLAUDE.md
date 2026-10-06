# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

pnpm + Turborepo monorepo for Kervan Makina's two websites:

| App                    | Domain                                     | Cloudflare Pages project |
| ---------------------- | ------------------------------------------ | ------------------------ |
| `apps/heat-treatment/` | kervanheat.com + www (fason ısıl işlem)    | `kervan-heat-treatment`  |
| `apps/breaker-parts/`  | kervanbreaker.com + www (kırıcı parçaları) | `kervan-breaker-parts`   |

Both apps are Vite 5 + React 18 + TypeScript + Tailwind v4 + Framer Motion, sharing code through `packages/*`.

## Commands

```bash
pnpm install                                   # whole workspace
pnpm dev                                       # both apps (turbo)
pnpm --filter @kervan/heat-treatment dev       # http://localhost:5173
pnpm --filter @kervan/breaker-parts dev        # http://localhost:5174
pnpm turbo build                               # build apps + packages
pnpm turbo build --filter=@kervan/breaker-parts
pnpm typecheck                                 # tsc --noEmit across the workspace
pnpm lint                                      # ESLint flat config (eslint.config.js)
pnpm format / pnpm format:check                # Prettier (.prettierrc.json)
```

There is no test suite. Before pushing, run `pnpm typecheck`, `pnpm lint`, `pnpm format:check` (or `pnpm format`) and a build of the affected app.

## Deploying

- `.github/workflows/deploy.yml` deploys with `wrangler pages deploy`. Every deploy waits for the `verify` job (`pnpm typecheck` + `pnpm lint` + `pnpm format:check`), so keep all three green.
- Push to `main` → production deploy of **both** apps, then `.github/scripts/smoke.sh` (GET/OPTIONS probe of the live sites). `main` runs are never cancelled mid-deploy.
- PR → Pages preview (`https://<branch>.<project>.pages.dev`) of the changed apps only: `dorny/paths-filter` maps `apps/<app>/**` (plus the root `public/` assets that app symlinks) to that app; `packages/**`, the lockfile, root configs or the workflow itself → both. Fork PRs and Dependabot runs get no Actions secrets, so they only run `verify` (test an action bump's deploy by running the workflow manually on the Dependabot branch).
- Redeploy without a commit (e.g. after changing a Pages env var): Actions → Deploy → **Run workflow**, pick `both` / `heat-treatment` / `breaker-parts` (on `main` = production).
- `.github/workflows/uptime.yml` runs the same smoke probe every 15 minutes.
- Cloudflare Web Analytics (cookie-free) is on for both sites. kervanbreaker.com: enabled on the Pages project, which adds the beacon at deploy time, so turning it on or changing it only takes effect on the next deploy. kervanheat.com: automatic setup on the zone (beacon injected at the edge), in "Lite" mode, so EU visitors are not counted.
- The Pages projects are **not** connected to Cloudflare's git integration — GitHub Actions is the only deployer. Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- Custom domains are bound to the Pages projects (proxied CNAME → `<project>.pages.dev`). The old `kervan-website` Worker is gone from the repo and has no routes or custom domains.

## Architecture

### Packages

- **`@kervan/ui`** (`packages/ui`) — design tokens (`src/tokens.css`, a Tailwind v4 `@theme` block, plus TS mirrors in `src/tokens/`) and base components (`Button`, `Card`, `Container`, `SectionHeading`, `Marquee`, …). Both apps' `src/styles/globals.css` do `@import "tailwindcss"; @import "@kervan/ui/tokens.css";`.
- **`@kervan/motion`** (`packages/motion`) — shared Framer Motion variants (`fadeUp`, `staggerContainer`, `inViewOnce`, …), `ScrollReveal`, `useParallaxSlow`, a re-export of `useReducedMotion` (true in static mode, see Motion) and the static-mode pieces (`StaticMotionProvider`, `useStaticMotion`, `isAnimatedClient`, the `js-anim` inline script).
- **`@kervan/seo`** (`packages/seo`) — `PageMeta`, `JsonLd` and JSON-LD builders. Used by breaker-parts.

### heat-treatment (kervanheat.com)

- Single-page site (served at `/` and `/en/`): `src/App.tsx` composes the sections in `src/components/` (Hero, Services, TechnicalCapacity, Craft, About, Contact, Footer, …). No router, no 3D.
- **`functions/api/rfq.ts`** — the only server-side code in the repo, a Cloudflare Pages Function. It is the RFQ endpoint for **both** sites (see below).
- `public/_redirects` 301s legacy breaker URLs (`/keski`, `/catalog.html`, `/products/*`, …) to kervanbreaker.com.

### breaker-parts (kervanbreaker.com)

- React Router app: `src/pages/` (Home, Products, ProductDetail, Brands, Production, About, Contact, NotFound); sections in `src/components/` and `src/sections/`; product/brand data in `src/data/`.
- `public/_redirects` has **no** SPA fallback: every route is a prerendered file, unknown paths get `404.html` with HTTP 404. Heat-treatment URLs are 301'd to `https://kervanheat.com/`.
- `src/components/OpeningHold.tsx` — the empty first viewport over the 3D scene. It never fights scrolling: touch and the arrow/Home/End keys are native; only a mouse-wheel flick or Space/PageDown inside the opening glides to the hero (instant under reduced motion, with an instant-jump safety net if the glide is cancelled, never inside form fields). It unmounts only after scrolling has settled, cancelling any glide first, so a touch fling is not cut short and the page cannot land past the hero.
- `src/components/Scene.tsx` — Three.js scene (plain `GLTFLoader`, no DRACO) loading `/kirici-uc.glb`. Keep the model local; never switch it to a remote URL. Both three.js users (`Scene` on Home, `ExportsGlobe` inside `Exports`) are `React.lazy` chunks, the globe only mounts about a screen before its section, so the main bundle stays small and other routes never download three.js. The scene skips drawing once the chisel has faded out, caps the pixel ratio at 1.5 on touch devices (2 elsewhere), follows `prefers-reduced-motion` live, and leaves an ember glow when WebGL is unavailable. The globe draws only while on screen.
- Its only Pages Functions are the owner-only `api/tech/*` endpoints (see "Owner-only Teknik Bilgiler"). The contact form still posts cross-origin to `https://kervanheat.com/api/rfq` in production (`/api/rfq` in dev, which 404s). `smoke.sh` checks `/api/tech/content` returns JSON 401, not HTML.

### RFQ flow

- Both Contact forms POST `multipart/form-data` to the heat-treatment function, with a hidden `hp_ref` honeypot (filled with something that is not the visitor's own name/email/phone/company → the message is dropped with `emailStatus.status: 'honeypot'`; browser autofill copying the visitor's own data into it is let through). The legacy field name `website` is ignored. There is no consent checkbox; the footer links to the KVKK notice.
- The function checks the `Origin` header by exact match (`allowedOrigin()`: both domains + www, plus previews of our own two Pages projects, `*.kervan-heat-treatment.pages.dev` / `*.kervan-breaker-parts.pages.dev` — never a bare `.pages.dev` suffix), then email format; it sends email via Brevo → Resend → MailChannels fallback (email is the only notification channel). It tags each request with its source site.
- Env vars live **only** on the `kervan-heat-treatment` Pages project (Production + Preview): `BREVO_API_KEY`, `MAIL_TO`, `MAIL_FROM`, optional fallbacks `RESEND_API_KEY` / `MAILCHANNELS_DKIM_*`. breaker-parts needs none. Pages env changes take effect on the next deploy.
- The response is `{ ok, emailSent, delivered, emailStatus }`; `emailStatus` is a diagnostic `{ transport, status }` (HTTP status of the last attempt, `'error'` on a thrown fetch, `'honeypot'` when the hidden field was filled) and never carries a body or key. `delivered` is true only when an email went out (Brevo 8 s timeout); all three forms show success only when `delivered` is true (older servers without it fall back to `emailSent`). The public contact address is `ORG_EMAIL` in `@kervan/seo` (`ahmet@kervanheat.com`) everywhere, including both KVKK pages.
- Adding a new domain that posts the form means updating `ALLOWED_ORIGINS` (or `PREVIEW_ORIGIN` for a new Pages project).

### Owner-only "Teknik Bilgiler" (login)

- A single-owner login protects the technical-info tab **on both sites** (separate cookies and separate Pages secrets per project; the two domains cannot share a session). **The text must never be in the repo (it is public), `dict.ts` or the JS bundle** — it lives in the Pages secret `TECH_CONTENT` (JSON `{ "tr": {…}, "en": {…} }`) and is only returned by `GET /api/tech/content` for a valid session.
- Server (identical in both apps apart from the allowed hostnames in `_lib/tech-auth.ts` — keep them in sync): `functions/_lib/tech-auth.ts` + `functions/api/tech/{login,logout,session,content}.ts` (HMAC-signed `__Host-kv_tech` cookie, HttpOnly/Secure/SameSite=Strict, 4 h absolute expiry). Only the custom hostnames are allowed, never `*.pages.dev`. It **fails closed**: missing/short secrets ⇒ login 503, content 401. Every response is `no-store` + `noindex`.
- Secrets (Pages → Variables and Secrets, as Secrets, per project; use different values or leave unset in Preview): `TECH_PASSWORD` (≥16 chars), `SESSION_SECRET` (≥32 chars), `TECH_CONTENT`; optional `SESSION_VERSION` (bump + redeploy to revoke all sessions). Changing any of them needs a redeploy.
- Client: `src/lib/use-tech-auth.ts`; the tab is hidden unless the server confirmed a session. breaker-parts also has a hidden pointer-only entry: the single mint-coloured star circling behind the 3D chisel on `/` (`Scene.tsx`, `onSecret`) navigates to `/teknik-bilgiler`. It is a shortcut only — the page stays password-protected and reachable by URL (the keyboard path). heat-treatment: the login form is reachable only at `/#giris`. breaker-parts: `/teknik-bilgiler` is a `noindex` shell showing the login form or the content, and is not in the sitemap.
- Local testing: put test secrets in `apps/<app>/.dev.vars` (gitignored) and run `wrangler pages dev` from the app directory.
- Never POST to `/api/tech/login` from CI or probes; `smoke.sh` only checks that anonymous `GET /api/tech/content` returns JSON 401.

### Private VEGA tip catalog (breaker-parts, KV)

- The owner-only tip catalog (609 rows, ~420 KB) is **not** in the repo or the bundle and is too big for a Pages secret (5 KB limit). It lives in a Workers KV namespace bound to the `kervan-breaker-parts` Pages project as **`VEGA_CATALOG`** (Production only), key `catalog:v1`.
- `GET /api/tech/catalog` (`functions/api/tech/catalog.ts`) returns it only for a valid owner session (same host + cookie checks as `/api/tech/content`). No session → JSON 401 before KV is read; no binding → 503; empty key → 404. `smoke.sh` checks the anonymous 401 only.
- Update the data without a deploy: `node scripts/vega-import.mjs <catalog.csv> <out.json>` (writes **outside** the repo, refuses paths inside it), then upload `out.json` to KV key `catalog:v1` (dashboard: KV → namespace → Add entry → Upload file). Never commit the CSV or JSON (`*.csv` and `vega-catalog*.json` are gitignored). Keep the namespace unbound in Preview.
- Optional KV key `popular:v1` in the same namespace: `{ schema: 1, models: { "<catalog model>": 1 | 2 }, aliases?: { "<breaker name>": "<catalog model>" } }` (1 = sells most in Turkey, 2 = sells well). The endpoint returns it next to the catalog; missing/malformed ⇒ no badges, catalog unaffected. It is business data: never commit it — the owner pastes it in the dashboard (KV → namespace → `popular:v1`).
- Technical drawings (the side-view drawing with dimensions under each model in the VEGA PDF) live in the same namespace as one value, key `drawings:v1` (~2.4 MB). Build it with `node scripts/vega-drawings.mjs <catalogue.pdf> <catalog.json> <out.json>` (needs `pdftohtml` + ImageMagick `convert`; writes **outside** the repo; exits non-zero if any row has no drawing). The PDF stores the images out of order, so the script pairs them by position and part numbers, never by file order. `GET /api/tech/drawings` serves it under the same session rules as the catalog (401 before KV, 503 without the binding, 404 when empty); the page fetches it once when the first detail panel opens and shows nothing when it is missing. `smoke.sh` checks the anonymous 401 only. Never commit the PDF, images or JSON.
- Drawing-derived features: each catalog row may carry `rearStep` (boolean: the rear end is a narrower stub with a shoulder), `slotEnd` (`'rounded' | 'tapered'`: the key slot ends in a short radius or a long conical ramp) and `tipAngleDeg` (the number printed on the tip view, e.g. 45). They are read from the drawings (two independent vision passes plus a tie-break pass; `rearStep` is cross-checked against the table's rear diameter, `tipAngleDeg` against the catalogue text) and merged with `node scripts/vega-attrs.mjs <catalog.json> <attrs.json> <out.json>` (outside the repo; the result replaces `catalog:v1`). Missing/`null` means unknown, and the catalog tab never hides a tip over an unknown value. The slope of the rear shoulder is **not** offered: the drawings are too small to tell a chamfered shoulder from a square one (the passes agreed on only 71 % of rows).
- Owner-only reading guide: optional KV key `guide:v1` (`{ schema: 1, breakage: { intro, zones[], defectVsMisuse, claimChecklist, disclaimer } }`, TR+EN) is returned as `guide` by `/api/tech/catalog` and shown as a collapsible panel "where a tip breaks / what warranty covers" in the catalog tab. It is industry-norm research, not Kervan's own terms; Kervan's warranty terms are the owner's decision and, if added, belong in this KV key, never in the repo. Missing/malformed ⇒ no panel, catalog unaffected.
- Usage guide and carrier weight (public, generic knowledge, in the repo): `lib/vega-usage.ts` maps the tip diameter to a rough carrier tonnage band (union of manufacturer/dealer data points listed in the file; none below Ø75 or above Ø209) and the dict holds a per-tip-type guide (rock, where, watch-out). Both are labelled as approximate; the breaker maker's own tip recommendation wins.
- Local test: `wrangler kv key put --namespace-id=VEGA_CATALOG --local "catalog:v1" --path <catalog.json>`, then `wrangler pages dev dist --kv VEGA_CATALOG --compatibility-date=2026-04-17` with test secrets in `.dev.vars`.

### i18n

- TR is primary, EN secondary. Strings (incl. page titles/meta descriptions) live in each app's `src/lib/dict.ts`.
- The URL is the only source of language: `/…` = Turkish, `/en/…` = English (breaker keeps Turkish slugs: `/en/urunler/keski`). No redirect by browser language. The toggle links to the same page in the other language and writes `localStorage('kv_lang')`; a legacy `?lang=` is sent to the matching URL client-side (`location.replace`, after hydration).
- The `kv_lang` key is shared between the two sites on purpose — keep it identical in both apps.
- Each page has its own `<html lang>`, title, description, og tags, JSON-LD `inLanguage`, a self canonical and reciprocal `hreflang` tr / en / x-default (= TR).

### Prerender, 404, sitemap, robots

- `build` = `tsc -b && vite build && vite build --ssr src/entry-server.tsx --outDir dist-ssr && node scripts/prerender.mjs`. The script writes one full-text `index.html` per route and language (`dist/…/index.html`, `dist/en/…/index.html`) plus `404.html` (noindex), the generated `sitemap.xml`, then deletes `dist-ssr/`. It never calls `/api/tech/*` or reads `TECH_CONTENT`; `/teknik-bilgiler` (+ `/en/`) is prerendered as a noindex shell without content and is not in the sitemap.
- No SPA fallback in either app: Pages serves the nearest `404.html` with HTTP 404 for unknown paths; Pages Functions (`/api/*`) still take precedence.
- `sitemap.xml` lists only canonical, indexable pages in both languages with `xhtml:link` hreflang alternates; `<lastmod>` is the last git commit date of the page's files, so the deploy jobs check out with `fetch-depth: 0` (build date only if git is unavailable). Do not add a static `public/sitemap.xml`.
- `robots.txt`: allow all, `Disallow: /api/`, sitemap link. KVKK is canonical at `/kvkk` (Pages 308s `/kvkk.html`); link and list `/kvkk`.
- All user-facing text goes through the dict, including `aria-label`s.

### Shared media at the repo root

- Root `public/` now holds only shared media: `photos/` (symlinked as `apps/heat-treatment/public/photos`), `videos/` (symlinked by both apps) and `kirici-uc.glb` (symlinked by breaker-parts). `deploy.yml`'s `paths-filter` watches these paths. Do not delete or move them without updating the symlinks and the filter.
- The old `kervan-website` Worker (`src/worker/`, root `wrangler.jsonc`, the Babel-in-browser root site) was removed; its RFQ logic lives in `functions/api/rfq.ts`. The Worker itself is deleted in the Cloudflare dashboard.

## Design system

`packages/ui/src/tokens.css` is the single source of truth. Use Tailwind token utilities / CSS variables; never hardcode hex values in components.

- **Contrast:** every text token must stay >= 4.5:1 on `bg`, `bg-soft` and `bg-warm` (`ink-soft` is `#918879` for that reason; check with the WCAG formula before changing it). Form fields use `border-ink-soft` (UI boundaries need 3:1). The WhatsApp button uses `bg-whatsapp` (`#128c7e`, white glyph 4.1:1), not the bright brand green.
- **Palette ("Mood C", dark):** `bg #0A0A0B`, `bg-soft #141416`, `bg-warm #1C1C20`; `ink #E8E2D6`, `ink-mid #B8AFA0`, `ink-soft #7A7066`; brand "Forge Ember" `#E8431B` (`brand-hi #FF5C32`, `brand-lo #C53614`).
- **Type:** display Fraunces (`--font-serif`), body/UI Inter (`--font-sans`), loaded from Google Fonts in each app's `index.html`. The Fraunces request must include the italic axis (`ital,opsz,wght@0,…;1,…`), otherwise the browser fakes the italics the headings rely on; the unused `SOFT` axis is not requested.
- **Radius:** 6 / 14 (cards) / 20 (large surfaces) / 999px (pills, buttons).

### Motion

- One ease: `--ease-editorial` = `cubic-bezier(0.22, 1, 0.36, 1)` (`editorialEase` in `@kervan/motion`). Prefer the shared variants over ad-hoc ones.
- Durations: micro 150ms, small 250ms, medium 400ms, large 600ms. Nothing longer than 600ms unless it is a deliberate hero moment. Stagger children 60–80ms.
- In-view reveals animate once (`{ once: true, amount: 0.3 }`); no more than 3 simultaneous animations on screen.
- **`useReducedMotion` is mandatory** in every animated component — short-circuit to the static state. Import it only from `@kervan/motion`, never from `framer-motion`. `globals.css` also has a `prefers-reduced-motion` floor.
- Static vs animated mode: the prerendered HTML is the final static state (no intro, OpeningHold or 3D canvas, no inline hiding). An inline `<head>` script adds `js-anim` to `<html>` only for JS-running humans without reduced motion (bots/headless/webdriver excluded). With `js-anim`, `main.tsx` does `createRoot` (today's animated site; `#root[data-prerendered]` is hidden until the first render); otherwise it `hydrateRoot`s in static mode (`StaticMotionProvider`, where `useReducedMotion()` is true) and must match the server markup exactly. Heavy effects (the 3D scene) mount client-side only.
- Intro: each app's `IntroOverlay` shows once per session (`sessionStorage`). Hero sequences must account for it (delay until it finishes, or skip the delay when the session flag is set).

### Accessibility

- WCAG AA contrast: 4.5:1 body text, 3:1 large text and non-text UI.
- Focus ring: `2px solid` brand with `outline-offset: 2px` (`focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2`). Restyle focus rings, never remove them.
- Every interactive element (buttons, links, form fields, carousel/gallery controls, language toggle, menu) must be keyboard-reachable and Enter/Space-activatable.

### 21st.dev Magic usage

- Start with `21st_magic_component_inspiration`; never generate cold.
- Never accept output verbatim: convert to this repo's conventions — map colors/spacing to `@kervan/ui` tokens, use `@kervan/ui` components where they exist, replace `lucide-react` with inline SVG or the `Icon` component, and apply the motion contract above.
- Brand logo bars: `logo_search` against Atlas Copco, Furukawa, Soosan, Montabert, Indeco, Rammer, Epiroc, Sandvik, NPK, Toku, Kobelco, Hanwoo (existing logos: `apps/breaker-parts/public/brand-logos/`).

## Media

- Photos are cached for 1 year as immutable (`_headers`). To replace an image, use a **new filename** (`-02`, `-v2`), not an overwrite.
- Slot directories and size limits are documented in `README.md` ("Medya ekleme").

## Branch & commit discipline

- **No direct commits to `main`** — it auto-deploys both sites to production.
- Branch naming: `feature/<topic>`.
- Conventional commits with app/area scope, e.g. `feat(breaker): add brand marquee`, `fix(rfq): …`, `chore(deps): …`, `docs: …`.
- Wait for explicit user approval before each major step. Show diffs and intent before writing.
