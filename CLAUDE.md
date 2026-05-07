# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install                                    # install all workspace deps
pnpm dev                                        # turbo run dev (all apps in parallel)
pnpm dev --filter=@kervan/heat-treatment        # one app only
pnpm dev --filter=@kervan/breaker-parts
pnpm build                                      # all apps + packages
pnpm typecheck                                  # tsc --noEmit per workspace
pnpm lint                                       # eslint per workspace
pnpm format                                     # prettier --write
```

Each app runs Vite on port 5173. Run them on separate ports if developing both at once (`vite --port 5174` etc.).

**Deploying:** `.github/workflows/deploy.yml` runs on every push to `main` and on PRs. `dorny/paths-filter` decides which app deploys — only the changed app rebuilds. PR pushes get Cloudflare Pages branch previews automatically.

## Repo layout

```
apps/
  heat-treatment/      kervanheat.com — fason ısıl işlem (single-page)
  breaker-parts/       kervanbreaker.com — kırıcı parçaları (React Router, 8 routes)
packages/
  ui/                  @kervan/ui — Mood C tokens (tokens.css, Tailwind v4 @theme)
                       + base components (Button, Card, Container, SectionHeading,
                       Badge, Divider, Link, Icon, Marquee)
  motion/              @kervan/motion — Framer Motion variants + ScrollReveal
                       + useReducedMotion re-export
  seo/                 @kervan/seo — JsonLd / PageMeta + Org/Product schema builders
public/                Yalnızca symlink hedefi 3 öğe: photos/, videos/, kirici-uc.glb.
                       apps/*/public bunlara symlink'liyor (paylaşılan medya).
legacy-astro/          Eski Astro denemesi, arşiv — dokunma.
```

Workspace is `pnpm` + `turbo`. Both apps depend on `@kervan/ui` and `@kervan/motion`; only `breaker-parts` depends on `@kervan/seo` and `react-router-dom`.

## Apps

### apps/heat-treatment (kervanheat.com)

Single-page Vite + React 18. Render order in `src/App.tsx`:

```
IntroOverlay → Nav → Hero → Services → TechnicalCapacity → Craft → About → Contact → Footer + WhatsAppFAB
```

- `src/lib/use-lang.ts` — `[Lang, setLang]` hook. Storage key `kv_lang`. Resolution: `?lang=` → `localStorage` → `navigator.language` → `'tr'`.
- `src/lib/dict.ts` — TR/EN string tables (`DICT.tr`, `DICT.en`). Components consume via `t.*`.
- `src/lib/motion.ts` — local motion helpers when `@kervan/motion` is too generic.
- `src/styles/globals.css` — `@import "tailwindcss"` + `@import "@kervan/ui/tokens.css"` + `@source` directive so utility classes used inside `@kervan/ui` source files are emitted in the bundle.
- `functions/api/rfq.ts` — Cloudflare Pages Function. Both apps post here; CORS allowlist gates origin.

### apps/breaker-parts (kervanbreaker.com)

Multi-route Vite + React 18 + react-router-dom. `src/App.tsx` routes:

```
/                     → Home
/urunler              → Products       (4-card family grid)
/urunler/:slug        → ProductDetail  (sub-types + brand fits + quote CTA)
/uyumluluk            → Brands         (15 marka grid)
/uretim-kalite        → Production     (kervanheat.com'a internal link)
/hakkimizda           → About
/iletisim             → Contact        (RFQ form, cross-origin POST)
*                     → NotFound
```

`public/_redirects` has SPA catch-all (`/* /index.html 200`) so the React Router routes resolve on direct URL access.

Specialty components: `Scene.tsx` (3D chisel — Three.js npm dep, NOT importmap; only mounted on Home), `BrandMarquee`, `Atolye`, `Chisels`, `Stock`, `ExportsGlobe`, `OpeningHold`, `StackedCarousel`, `Industries`, `WorkshopShowcase`, `Gallery`, `ErrorBoundary`.

3D dependencies: `three`, `@react-three/fiber`, `@react-three/drei` (only in this app's package.json — heat-treatment doesn't pay this bundle cost).

## Packages

### @kervan/ui

`src/tokens.css` is the **single source of truth for design tokens** — Tailwind v4 `@theme` block exports them as both CSS variables and Tailwind utility classes. Both apps import it.

```css
--color-bg #0A0A0B · --color-bg-soft #141416 · --color-bg-warm #1C1C20
--color-ink #E8E2D6 · --color-ink-mid #B8AFA0 · --color-ink-soft #7A7066
--color-brand #E8431B · --color-brand-hi #FF5C32 · --color-brand-lo #C53614
--color-hair #262629 · --color-hair-strong #36363B
--color-ok #3FB173 · --color-err #FF7B6E
--font-serif Fraunces · --font-sans Inter
--radius-sm 6px · --radius-md 14px · --radius-lg 20px · --radius-pill 999px
--ease-editorial cubic-bezier(0.22, 1, 0.36, 1)
--ease-soft     cubic-bezier(0.4, 0, 0.2, 1)
```

Use Tailwind classes (`bg-brand`, `text-ink`, `border-hair`) — they resolve to these tokens. `src/tokens/index.ts` also exports them as TS values for runtime use.

Base components (`src/components/*`): wrap Tailwind primitives with the brand contract. Prefer them over raw `<button>`/`<div>` for anything that needs to feel on-brand.

### @kervan/motion

- Variants: `staggerContainer`, `lineReveal`, `fadeUp`, `slowFade`, `kenBurns`, `cardHover`, `hoverLift`, `inViewOnce`, `revealOnScroll`.
- Easings: `editorialEase`, `softEase`. Durations: `durations.{xs,sm,md,lg}`.
- `<ScrollReveal>` component for one-shot reveal-on-scroll patterns.
- `useParallaxSlow()` hook.
- Re-exports `useReducedMotion` from framer-motion for one-import ergonomics.

### @kervan/seo

`<PageMeta>` (per-route head tags) + `<JsonLd>` + Org/Product/Breadcrumb schema builders. Currently only consumed by `breaker-parts` (heat-treatment uses static index.html meta).

## Shared assets via symlinks

`public/photos/`, `public/videos/`, `public/kirici-uc.glb` live at repo root. Apps symlink to them:

```
apps/heat-treatment/public/photos  → ../../../public/photos
apps/heat-treatment/public/videos  → ../../../public/videos
apps/breaker-parts/public/videos   → ../../../public/videos
apps/breaker-parts/public/kirici-uc.glb → ../../../public/kirici-uc.glb
```

`apps/breaker-parts/public/photos` is a **real directory** (different photo set). Vite copies the symlinks' targets into each app's `dist/` at build time, so deploys are self-contained per app.

**Do NOT delete root `public/{photos,videos,kirici-uc.glb}`** — they are the canonical sources. To restructure (kill symlinks, fully duplicate), do it as a deliberate commit, not as part of cleanup.

## RFQ flow

Both apps' Contact form POST `multipart/form-data` to `apps/heat-treatment/functions/api/rfq.ts`:

- heat-treatment → same-origin `/api/rfq`
- breaker-parts → cross-origin `https://kervanheat.com/api/rfq` (CORS allowlist permits `kervanbreaker.com`)

Pages Function: validate origin → KVKK consent → email format → Resend (primary) → MailChannels (fallback) → Telegram alert. Honeypot field `name="website"` — if filled, silently returns `{ ok: true }`.

Env vars (set in Cloudflare Pages **project settings**, not via `.env`): `RESEND_API_KEY`, `MAILCHANNELS_DKIM_DOMAIN/SELECTOR/PRIVATE_KEY`, `TG_BOT_TOKEN`, `TG_CHAT_ID`, `MAIL_TO`, `MAIL_FROM`.

## Deploy

`.github/workflows/deploy.yml`:

1. `changes` job — `dorny/paths-filter` outputs `heat-treatment` / `breaker-parts` flags. Both `apps/<name>/**` AND `packages/**` (+ root config) trigger their respective app.
2. `deploy-heat-treatment` job (conditional) — `pnpm install` → `pnpm turbo build --filter=@kervan/heat-treatment` → `cloudflare/wrangler-action@v3` deploys to Pages project `kervan-heat-treatment`.
3. `deploy-breaker-parts` job (conditional, parallel) — same shape, project `kervan-breaker-parts`.

PR pushes get branch preview URLs at `https://<branch>.kervan-heat-treatment.pages.dev` and `https://<branch>.kervan-breaker-parts.pages.dev`.

DNS bind happens **outside the workflow** — custom domain (kervanheat.com / kervanbreaker.com) is bound to each Pages project once, in the Cloudflare dashboard.

## UI/UX Pro Max — Brand & Motion Guidelines

This section is the contract for any motion, visual, or interaction work. Existing constraints above always win.

### Brand identity

**Mood C — Forge Ember.** Industrial monograph aesthetic: parchment-warm cream ink (`#E8E2D6`) on near-black (`#0A0A0B`), forge ember accent (`#E8431B`), Fraunces italic display + Inter body. Editorial, hand-set, dark-room.

### Color tokens

`packages/ui/src/tokens.css` is the single source of truth — never hardcode hex. Use Tailwind utilities (`bg-brand`, `text-ink-mid`, `border-hair-strong`) which compile to these vars.

### Typography

- Display: **Fraunces** italic (`var(--font-serif)`). `clamp(48px, 7vw, 96px)`, line-height 1.0–1.05, letter-spacing −0.02em.
- Body: **Inter** 400–600 (`var(--font-sans)`). 17px base.
- Eyebrow / metadata: 11–12px, uppercase, tracking 0.18–0.2em, soft ink color.

### Spacing & shape

- Container: `max-w-[1280px]`, pad-x 32px (mobile 24px).
- Radius scale: `--radius-sm 6px` · `--radius-md 14px` (cards) · `--radius-lg 20px` (large surfaces) · `--radius-pill 999px` (buttons).

### Motion Principles

- **Default ease:** `--ease-editorial` (`cubic-bezier(0.22, 1, 0.36, 1)`). One ease for the whole site.
- **Durations:** micro 150ms, small 250ms, medium 400ms, large 600ms. No animation longer than 600ms unless it's a deliberate hero moment.
- **Stagger children:** 60–80ms.
- **`whileInView` defaults:** `{ once: true, amount: 0.3 }`. Never animate the same element more than once per session.
- **`useReducedMotion` is mandatory** in every motion hook. Components must short-circuit to a static state when reduced motion is requested. The `prefers-reduced-motion` media query in `globals.css` is the floor.
- **Intro coordination:** `IntroOverlay.tsx` runs once per session (sessionStorage gated). Hero motion sequences must either delay until after the intro or check sessionStorage to skip on subsequent visits.
- **Concurrency limit:** never start more than 3 simultaneous animations on screen. Stagger or queue.

### Accessibility

- WCAG AA contrast: 4.5:1 body text, 3:1 large text and non-text UI.
- Focus ring: `2px solid var(--color-brand)` with `outline-offset: 2px`. Never remove focus rings — restyle them.
- All interactive elements (buttons, links, form fields, gallery controls, language toggle, burger) must be keyboard-reachable and Enter/Space-activatable.
- `aria-label` strings default to Turkish (TR is the primary language). When the user toggles to EN, surface labels via `t.*` keys in the dict.

### 21st.dev Magic Usage Rules

- Start with `21st_magic_component_inspiration` to gather references before generating; never generate cold.
- Never accept Magic output verbatim. Magic ships Tailwind + lucide-react patterns — adapt to this codebase:
  - Map color intent to `--color-*` Mood C tokens, not arbitrary Tailwind palette classes (`bg-orange-500` → `bg-brand`).
  - `lucide-react` icons → either keep (we already use Tailwind) or replace with inline SVG / `@kervan/ui` Icon.
  - Adapt to the motion contract (`--ease-editorial`, `useReducedMotion`, `whileInView` defaults) before committing.
- For brand-compatibility logo bars use `logo_search` against the hydraulic breaker brand list: Atlas Copco, Furukawa, Soosan, Montabert, Indeco, Rammer, Epiroc, Sandvik, NPK, Toku, Kobelco, Hanwoo.

## Branch & Commit Discipline

- **No direct commits to `main`.** Every push to `main` auto-deploys to production via GitHub Actions; treat `main` as protected.
- Branch naming: `feature/<topic>` (e.g. `feature/motion-v1`, `feature/logo-marquee`).
- Conventional commits are mandatory:
  - `feat(hero): add word-by-word reveal`
  - `fix(rfq): respect reduced-motion in send button`
  - `chore(deps): bump motion to 12.38.0`
  - `refactor(contact): wrap states with AnimatePresence`
  - Scope follows the affected app or package: `feat(heat-treatment): …`, `chore(ui): …`, `feat(breaker-parts): …`.
- Wait for explicit user approval before each major step. Show diffs and intent before writing.
