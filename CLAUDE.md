# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install wrangler
npm run dev        # local preview at http://localhost:8787
npm run deploy     # deploy to Cloudflare (requires wrangler auth)
```

There is no build step, no test suite, and no linter. The site is plain static files — edit and deploy directly.

**Deploying:** every push to `main` auto-deploys via GitHub Actions → Cloudflare Workers. Manual deploy requires `wrangler login` or a `CLOUDFLARE_API_TOKEN` env var. Use `gh auth login --web` for GitHub push access (device flow).

## Architecture

**Two-layer stack:**

1. **`src/worker/index.ts`** — Cloudflare Worker. Routes `/api/rfq` (POST) to `handleRfq()`, everything else falls through to `env.ASSETS.fetch()` (static files). No other API routes exist.

2. **`public/`** — all static assets, served as-is. The homepage is a React 18 app assembled at runtime without a build step:
   - `index.html` fetches `dict.jsx` + `components.jsx` via `fetch()`, concatenates them, runs `Babel.transform()` in-browser, then injects the compiled script tag. React/ReactDOM/Babel all load from unpkg CDN.
   - `dict.jsx` exports `window.DICT` (TR/EN strings) and `window.useLang()` (React hook with localStorage + `?lang=` param + `navigator.language` fallback).
   - `components.jsx` exports all homepage sections as globals: `Nav, Hero, Products, Gallery, Chisels, Stock, Atolye, Craft, Industries, Contact, Footer`. Render order: `Nav → Hero → Products → Chisels → Stock → Atolye → Craft → Industries → Contact → Footer`.
     - `Products` — 4-card family grid (Keski / Piston / Burç / Kit)
     - `Chisels` / `Stock` / `Atolye` — three horizontal scroll-snap galleries built on a shared `<Gallery>` component (img + video + placeholder support)
     - `Craft` ("İmalathanemiz") — 5/7 grid: copy + workshop photo, `--bg-soft` background
     - `Industries` — divided sector list with hover padding-shift
     - `Contact` — 5/7 grid: info `<dl>` + RFQ form (`<form>` with honeypot, KVKK consent, `/api/rfq` POST)
   - Inner pages (`about.html`, `catalog.html`, etc.) each follow the same pattern using `pages-dict.jsx` + `posts.jsx` as needed.

**3D scene (`public/scene.js`):**
- ES module, loaded via `<script type="module">`. Three.js is resolved via importmap pointing to unpkg (this is intentional and approved — it's infrastructure, not an asset).
- The chisel model is `/kirici-uc.glb` from the repo — **do not change this to a remote URL**.
- `GLTFLoader` from `three/addons/` is the only loader; no DRACOLoader.
- Scene runs in a fixed `#scene-root` div behind all content (z-index: 0).

**CSS system:**
- `kit.css` — full design system (variables, all section styles). Soft-cornered industrial aesthetic: `--radius: 14px` for cards, `--radius-lg: 20px` for large surfaces; pill-shaped buttons (`border-radius: 999px`).
- `scene-overlay.css` — overrides that make sections transparent so the 3D scene shows through. Hides `.hero__drawing` SVG when 3D is active.
- `intro.css` — styles for the cinematic intro screen.

**Intro screen (`public/intro.js`):**
- Vanilla JS, runs before React. Shown once per session (`sessionStorage`). 2.1s display + 0.52s fade. No React dependency.

**RFQ form flow:**
- `components.jsx` `<RFQ>` component POSTs `multipart/form-data` to `/api/rfq`.
- Worker validates origin, KVKK consent, email format; then tries Resend → MailChannels fallback → Telegram notification.
- Honeypot field: `name="website"` — if filled, silently returns `{ ok: true }`.

## Key constraints

- **No build step** — changes to `.jsx` and `.css` files are live immediately after deploy. Babel compiles JSX in the browser.
- **No CDN for assets** — GLB files, images, and CSS must live in `public/`. Three.js infrastructure (importmap) is the only approved external dependency in `scene.js`.
- **`dict.jsx` is loaded before `components.jsx`** — globals from `dict.jsx` (`window.DICT`, `window.useLang`, `useState`, `useEffect`, `useRef`) are available in `components.jsx` without re-importing React.
- **i18n** — all user-facing text goes through `window.DICT[lang]`. Language is detected from `?lang=` param → localStorage → `navigator.language` (TR/EN only).

## UI/UX Pro Max — Brand & Motion Guidelines

This section is the contract for any motion, visual, or interaction work added to the site. Existing constraints above always win — anything below is layered on top, never around them.

### Color Tokens
`kit.css` is the single source of truth. Do not hardcode hex values in components — always reference custom properties.

- `--bg #FAFAF7` · `--bg-card #FFFFFF` · `--bg-soft #F3F1EC`
- `--ink #0E0E10` · `--ink-mid #54524E` · `--ink-soft #8A867F`
- `--hair #EAE7DF` · `--hair-2 #D8D3C7`
- `--brand #E8781A` · `--brand-d #C65A0C` (hover/active)
- `--ok #1E8C4A` · `--err #C24130`

### Typography
- Display/UI: **Space Grotesk** 400–700 (`--f-sans`)
- Body: **Inter** 400–600 (`--f-body`)
- Display: `clamp(44px, 6.6vw, 96px)`, letter-spacing `-.035em`, line-height 1.0
- H2: `clamp(30px, 3.6vw, 52px)`, letter-spacing `-.025em`
- Eyebrow: 12px, uppercase, tracking `0.16em`, color `--brand`

### Spacing
- Scale: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96` px
- Container: 1240px; pad-x 40px (mobile 22px)
- Radius: 14px (cards), 20px (large surfaces), 999px (pills/buttons)

### Motion Principles
- **Default ease:** `cubic-bezier(0.22, 1, 0.36, 1)` — identical to `--ease` in `kit.css`. One ease for the whole site.
- **Durations:** micro 150ms, small 250ms, medium 400ms, large 600ms. No animation longer than 600ms unless it is a deliberate hero moment.
- **Stagger children:** 60–80ms.
- **`whileInView` defaults:** `{ once: true, amount: 0.3 }`. Never animate the same element more than once per session.
- **`useReducedMotion` is mandatory** in every motion hook. The kit.css `prefers-reduced-motion` media query is the floor; Framer Motion components must observe the same contract and short-circuit to a static state when reduced motion is requested.
- **Intro coordination:** `intro.js` runs once per session (2.1s display + 0.52s fade = 2.62s total). On the homepage, hero motion sequences must either delay until after the intro or check `sessionStorage` to skip the delay on subsequent visits.
- **Concurrency limit:** never start more than 3 simultaneous animations on screen. Stagger or queue rather than firing everything at once.

### Accessibility
- WCAG AA contrast: 4.5:1 body text, 3:1 large text and non-text UI.
- Focus ring: `2px solid var(--brand)` with `outline-offset: 2px`. Never remove focus rings; restyle them.
- All interactive elements (buttons, links, form fields, gallery controls, language toggle, burger) must be keyboard-reachable and Enter/Space-activatable.
- `aria-label` strings default to Turkish (TR is the primary language). When the user toggles to EN, surface labels via `t.*` keys in `dict.jsx`.

### Framer Motion Loading (CRITICAL)
This project has **no build step**. The `motion@12.38.0` package in `node_modules` never reaches the browser — Wrangler only serves files from `public/`.

**The pattern:** load Motion via the existing importmap in `index.html` (and every inner page). Three.js is already there; Motion sits beside it.

```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/",
    "motion":       "https://esm.sh/motion@12.38.0?bundle",
    "motion/react": "https://esm.sh/motion@12.38.0/react?bundle"
  }
}
</script>
```

A small ES-module shim (e.g. `motion-shim.js`, loaded via `<script type="module">` before the React bundle) imports `motion` and `useReducedMotion` from `motion/react` and assigns them to `window.motion` / `window.useReducedMotion`. From there `components.jsx` consumes them as globals — exactly the same pattern `dict.jsx` uses for `window.DICT` and `window.useLang`.

Constraints:
- Pin the version in the importmap (`@12.38.0`) — never use a floating tag.
- Do not add a bundler, do not import from `node_modules`, do not break the Babel-in-browser pipeline.
- Add the same importmap entries to inner pages (`about.html`, `catalog.html`, etc.) only when those pages actually use Motion.

### 21st.dev Magic Usage Rules
- Start with `21st_magic_component_inspiration` to gather references before generating; never generate cold.
- Never accept Magic output verbatim. Magic ships Tailwind + TS + lucide-react patterns — this codebase ships JSX-in-browser + custom CSS variables.
  - Strip Tailwind classes; map intent to `kit.css` custom properties (`var(--brand)`, `var(--ink)`, `var(--hair)`, etc.).
  - Convert TypeScript to JSX. Remove `import` statements (we have no module system in `components.jsx`).
  - Replace `lucide-react` icons with inline SVG or existing markup.
- For brand-compatibility logo bars use `logo_search` against the hydraulic breaker brand list: Atlas Copco, Furukawa, Soosan, Montabert, Indeco, Rammer, Epiroc, Sandvik, NPK, Toku, Kobelco, Hanwoo.
- Adapt every Magic-derived component to the existing motion contract (`--ease`, `useReducedMotion`, `whileInView` defaults) before committing.

### Branch & Commit Discipline
- **No direct commits to `main`.** Every push to `main` auto-deploys to production via GitHub Actions; treat `main` as protected.
- Branch naming: `feature/<topic>` (e.g. `feature/motion-v1`, `feature/logo-marquee`).
- Conventional commits are mandatory:
  - `feat(hero): add word-by-word reveal`
  - `fix(meters): respect reduced-motion in count-up`
  - `chore(deps): pin motion to 12.38.0 via importmap`
  - `refactor(rfq): wrap states with AnimatePresence`
- Wait for explicit user approval before each major step. Show diffs and intent before writing.
