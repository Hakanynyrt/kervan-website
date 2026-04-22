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
   - `dict.jsx` exports `window.DICT` (TR/EN/DE/RU strings) and `window.useLang()` (React hook with localStorage + geo-IP detection via ipapi.co).
   - `components.jsx` exports all homepage sections as globals: `Nav, Hero, Ticker, Parts, OrbitSection, Furnace, Process, Meters, RFQ, Footer, WAFloat`.
   - Inner pages (`about.html`, `catalog.html`, etc.) each follow the same pattern using `pages-dict.jsx` + `posts.jsx` as needed.

**3D scene (`public/scene.js`):**
- ES module, loaded via `<script type="module">`. Three.js is resolved via importmap pointing to unpkg (this is intentional and approved — it's infrastructure, not an asset).
- The chisel model is `/kirici-uc.glb` from the repo — **do not change this to a remote URL**.
- `GLTFLoader` from `three/addons/` is the only loader; no DRACOLoader.
- Scene runs in a fixed `#scene-root` div behind all content (z-index: 0).

**CSS system:**
- `kit.css` — full design system (variables, all section styles). Angular aesthetic, no border-radius.
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
- **i18n** — all user-facing text goes through `window.DICT[lang]`. Language is detected from `?lang=` param → localStorage → geo-IP → `navigator.language`.
