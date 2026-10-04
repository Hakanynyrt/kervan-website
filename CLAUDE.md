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
- The Pages projects are **not** connected to Cloudflare's git integration — GitHub Actions is the only deployer. Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- Custom domains are bound to the Pages projects (proxied CNAME → `<project>.pages.dev`). The legacy `kervan-website` Worker no longer has any routes or custom domains.

## Architecture

### Packages

- **`@kervan/ui`** (`packages/ui`) — design tokens (`src/tokens.css`, a Tailwind v4 `@theme` block, plus TS mirrors in `src/tokens/`) and base components (`Button`, `Card`, `Container`, `SectionHeading`, `Marquee`, …). Both apps' `src/styles/globals.css` do `@import "tailwindcss"; @import "@kervan/ui/tokens.css";`.
- **`@kervan/motion`** (`packages/motion`) — shared Framer Motion variants (`fadeUp`, `staggerContainer`, `inViewOnce`, …), `ScrollReveal`, `useParallaxSlow`, and a re-export of `useReducedMotion`.
- **`@kervan/seo`** (`packages/seo`) — `PageMeta`, `JsonLd` and JSON-LD builders. Used by breaker-parts.

### heat-treatment (kervanheat.com)

- Single-page site: `src/App.tsx` composes the sections in `src/components/` (Hero, Services, TechnicalCapacity, Craft, About, Contact, Footer, …). No router, no 3D.
- **`functions/api/rfq.ts`** — the only server-side code in the repo, a Cloudflare Pages Function. It is the RFQ endpoint for **both** sites (see below).
- `public/_redirects` 301s legacy breaker URLs (`/keski`, `/catalog.html`, `/products/*`, …) to kervanbreaker.com.

### breaker-parts (kervanbreaker.com)

- React Router app: `src/pages/` (Home, Products, ProductDetail, Brands, Production, About, Contact, NotFound); sections in `src/components/` and `src/sections/`; product/brand data in `src/data/`.
- `public/_redirects` ends with the SPA fallback `/* /index.html 200` — add explicit redirects **above** it. Heat-treatment URLs are 301'd to kervanheat.com.
- `src/components/Scene.tsx` — Three.js scene (plain `GLTFLoader`, no DRACO) loading `/kirici-uc.glb`. Keep the model local; never switch it to a remote URL.
- No Pages Functions here. The contact form posts cross-origin to `https://kervanheat.com/api/rfq` in production (`/api/rfq` in dev, which 404s).

### RFQ flow

- Both Contact forms POST `multipart/form-data` to the heat-treatment function, with a `website` honeypot (filled → silent `{ ok: true }`). There is no consent checkbox; the footer links to the KVKK notice.
- The function checks the `Origin` header by exact match (`allowedOrigin()`: both domains + www, plus previews of our own two Pages projects, `*.kervan-heat-treatment.pages.dev` / `*.kervan-breaker-parts.pages.dev` — never a bare `.pages.dev` suffix), then email format; it sends email via Resend → MailChannels fallback and a Telegram notification. It tags each request with its source site.
- Env vars live **only** on the `kervan-heat-treatment` Pages project (Production + Preview): `RESEND_API_KEY`, `MAIL_TO`, `MAIL_FROM`, `TG_BOT_TOKEN`, `TG_CHAT_ID`, `MAILCHANNELS_DKIM_*`. breaker-parts needs none. Pages env changes take effect on the next deploy.
- Adding a new domain that posts the form means updating `ALLOWED_ORIGINS` (or `PREVIEW_ORIGIN` for a new Pages project).

### Owner-only "Teknik Bilgiler" (login)

- A single-owner login protects the technical-info tab. **The text must never be in the repo (it is public), `dict.ts` or the JS bundle** — it lives in the Pages secret `TECH_CONTENT` (JSON `{ "tr": {…}, "en": {…} }`) and is only returned by `GET /api/tech/content` for a valid session.
- Server: `functions/_lib/tech-auth.ts` + `functions/api/tech/{login,logout,session,content}.ts` (HMAC-signed `__Host-kv_tech` cookie, HttpOnly/Secure/SameSite=Strict, 4 h absolute expiry). Only the custom hostnames are allowed, never `*.pages.dev`. It **fails closed**: missing/short secrets ⇒ login 503, content 401. Every response is `no-store` + `noindex`.
- Secrets (Pages → Variables and Secrets, as Secrets, per project; use different values or leave unset in Preview): `TECH_PASSWORD` (≥16 chars), `SESSION_SECRET` (≥32 chars), `TECH_CONTENT`; optional `SESSION_VERSION` (bump + redeploy to revoke all sessions). Changing any of them needs a redeploy.
- Client: `src/lib/use-tech-auth.ts`; the tab is hidden unless the server confirmed a session. The login form is reachable only at `/#giris`.
- Local testing: put test secrets in `apps/heat-treatment/.dev.vars` (gitignored) and run `wrangler pages dev` from a copy of the app **outside the repo** — the legacy root `wrangler.jsonc` breaks it inside the repo.
- Never POST to `/api/tech/login` from CI or probes; `smoke.sh` only checks that anonymous `GET /api/tech/content` returns JSON 401.

### i18n

- TR is primary, EN secondary. Strings live in each app's `src/lib/dict.ts`; `src/lib/use-lang.ts` resolves `?lang=` → `localStorage('kv_lang')` → `navigator.language` → `'tr'`.
- The `kv_lang` key is shared between the two sites on purpose — keep it identical in both apps.
- All user-facing text goes through the dict, including `aria-label`s.

### Legacy (do not build on)

- `src/worker/index.ts` + root `wrangler.jsonc` — the old `kervan-website` Worker. It is detached from all domains and no longer deployed by CI; its RFQ logic was ported to `functions/api/rfq.ts`.
- Root `public/` — the old no-build site (Babel-in-browser JSX, `kit.css`, importmap). Its pages are dead, **but it is still referenced**: `apps/breaker-parts/public/kirici-uc.glb` and `apps/breaker-parts/public/videos` are symlinks into it. Do not delete root `public/` wholesale without moving those assets first.

## Design system

`packages/ui/src/tokens.css` is the single source of truth. Use Tailwind token utilities / CSS variables; never hardcode hex values in components.

- **Palette ("Mood C", dark):** `bg #0A0A0B`, `bg-soft #141416`, `bg-warm #1C1C20`; `ink #E8E2D6`, `ink-mid #B8AFA0`, `ink-soft #7A7066`; brand "Forge Ember" `#E8431B` (`brand-hi #FF5C32`, `brand-lo #C53614`).
- **Type:** display Fraunces (`--font-serif`), body/UI Inter (`--font-sans`), loaded from Google Fonts in each app's `index.html`.
- **Radius:** 6 / 14 (cards) / 20 (large surfaces) / 999px (pills, buttons).

### Motion

- One ease: `--ease-editorial` = `cubic-bezier(0.22, 1, 0.36, 1)` (`editorialEase` in `@kervan/motion`). Prefer the shared variants over ad-hoc ones.
- Durations: micro 150ms, small 250ms, medium 400ms, large 600ms. Nothing longer than 600ms unless it is a deliberate hero moment. Stagger children 60–80ms.
- In-view reveals animate once (`{ once: true, amount: 0.3 }`); no more than 3 simultaneous animations on screen.
- **`useReducedMotion` is mandatory** in every animated component — short-circuit to the static state. `globals.css` also has a `prefers-reduced-motion` floor.
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
