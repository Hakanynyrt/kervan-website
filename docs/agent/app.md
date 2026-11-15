# iPhone app "Kervan Kırıcı Parça" (kiriciparca.com)

<!-- Read before working on the app (apps/parts-shop/src/app, the app build and its checks). Keep it current with each change. -->

## What it is

- An iPhone app for the shop kiriciparca.com: "Kervan Kırıcı Parça" (TR) / "Kervan Breaker Parts" (EN). Individual Apple account, no Mac, iPhone first.
- It is the shop's own React code built a second time: the app renders the shop's page components (`src/PageView.tsx`) inside its own shell. It reads every page from the live site at run time and carries no catalogue and no prices.
- No accounts, no sign-up, no server-side user data, no analytics, no ads. What it keeps (saved machines, language) stays on the phone.
- M1 (this stage) is the app as a **web build** only: no native project, no Capacitor, no Apple secret. M2 wraps the same build in the native project.

## How it works (M1)

- **Build:** `vite.app.config.ts`, entry `app.html` → `src/app/main.tsx`, output `apps/parts-shop/dist-app/` (gitignored): `index.html` (from `app.html`, Capacitor's start file, with a CSP that allows only the site origin and the picture host), the bundle and the two Inter fonts; no `public/` copy, no catalogue, no price file. `scripts/build-app.mjs` runs it with `VITE_APP=1` and `VITE_SITE_ORIGIN` (default `https://kiriciparca.com`; any other origin must be https, or http on localhost) and makes sure `index.html` and the fonts are there. Against the canonical origin the config sets `VITE_TIP_IMG_BASE=https://img.kiriciparca.com` unless it is given.
- **Shell:** `src/app/AppShell.tsx`: a top bar (back, title, "Makinelerime ekle" on breaker model pages; below 400 px wide the button shows its icon only, with the text as its `aria-label`, so the model's name keeps its room). The title is the page's own `main h1` (read when the page is parsed; the `<title>` only when there is none), the model's name on breaker pages, and on the app's own screens it is the screen's `h1` (shop pages bring their own `h1`, so there it is a plain line) and a tab bar Ana ekran / Rehber / Tara / Makinelerim / Palet (EN: Home / Guides / Scan / My machines / Palet). The site's `Layout`, header, footer, `ConsentBanner`, `ads.ts`, `page-head` and the sun middleware are not used. The shell provides `AstryxProvider` and `FinderPickProvider` as `Layout` does.
- **Data:** a route fetches `SITE_ORIGIN + localePath(path, lang)`, parses the HTML with `DOMParser` and `readPageProps()`, and renders `PageView`. Stale-while-revalidate cache in IndexedDB (at most 300 pages, with the fetch date). A page read in this session counts as today's for 10 minutes (`SESSION_TTL_MS`, as the palet's own re-read); after that, on going back online (which forgets the session's reads) or on coming back to the app, it shows as a saved copy while the site is asked again. The fresh copy re-renders the page in place (keyed by address only), so what was typed stays. An IndexedDB that does not answer within 1.5 s (`CACHE_WAIT_MS`) is given up for the session (memory only). A cached page not re-fetched in this session shows one dated line where the page shows prices ("Fiyatlar <tarih> tarihlidir; bağlantı olunca güncellenir."; `pageShowsPrices` in `src/app/prices.ts`: any filled price field in the props, so cards, priced renders and listed parts count too; `showsPrice` from `PageView.tsx` stays the site header's narrower "priced page"). The Palet's prices are its lines' own (stored when each was added): when it is not fresh and a line has a price, the line reads "Fiyatlar ürünün eklendiği günün fiyatıdır; bağlantı olunca güncellenir.", and the Cart page itself marks every priced line "Fiyat güncellenemedi" when no line's page could be read (site behaviour too). No network and no cache: the Offline screen, except `/palet`, which is built on the phone (`offlinePage` in `main.tsx`: the cart model with the exchange rate of the newest saved page). A picture that fails to load (offline) leaves an empty frame (`img[data-broken]`), not the broken-picture mark. An unknown page kind, or a page that throws: the UpdateNeeded screen with "Sitede aç" (error boundary).
- **Router:** History API on real paths, no library. A document-level click listener (and submit, for the two GET search forms) turns same-site links (relative, or absolute on the site origin) into `navigate()`; `wa.me`, `mailto:`, `tel:` and other hosts are left alone. Query strings (`?p=`, `?uc=`, `?tip=`, `?q=`, `?burc=`) and `#hash` keep working, because shop code reads `window.location` and calls `history.replaceState`. In-page `#anchor` links also go through `navigate()`: each jump is a history entry with the app's index (Back returns to where it started; the target takes the focus). An entry without the index is stamped on Back/Forward, and an entry from before a language change gets its address rewritten into the app's language.
- **Screens** (`src/app/screens`): Start (make/model search over the public `/kirici-modelleri.json`, shortcuts to `/kirici-ucu`, `/yedek-parca`, `/rehber`, `/palet`, the saved machines, language switch), Machines (saved `{path, name}` rows; each opens only its own `/kirici/<make>/<model>` page; parts lists of different models are never merged), Scan (M1: a placeholder and a field for a Kervan link; only https links on the site origin open, anything else gets "Bu bir Kervan bağlantısı değil"), Offline, UpdateNeeded. The Rehber and Palet tabs are the shop's own `/rehber` and `/palet` pages.
- **Device state:** `src/app/store.ts`, a small async key-value interface (web build: `localStorage`; M2: `@capacitor/preferences`): machines and language. First run takes the language from `navigator.language` (`tr` → tr, else en).
- **Text:** every app string, `aria-label`s included, is in `src/app/dict.ts` (TR primary, EN secondary), never in components. The look is the shop's (tokens of `styles/globals.css`, Inter, `rounded-sm`; no gradients, glows, pill buttons, eyebrow kickers or serif italics); tap targets at least 44 px; safe-area insets on the top bar, the tab bar and the page's order bar (`data-sticky-bar`, bottom and sides); `prefers-reduced-motion` respected. The tab bar is a fixed 3.5 rem row plus its border (`--kv-tab`); labels never wrap (10 px below 400 px wide, 11 px above), checked by the e2e at 320 and 375 px in both languages.
- **Orientation:** not decided yet. The web build already keeps its bars clear of the side insets in landscape, but in landscape the top bar, the order bar and the tab bar together cover about half of the screen. M2 sets `UISupportedInterfaceOrientations` in `Info.plist`: portrait only is the recommendation; the owner decides.

## The seams in the shop: the site output must not change

The app reaches the shop through four seams. On the site each one keeps today's behaviour, and the prerendered HTML must stay **identical apart from hashed asset file names** (proof for a change here: build the shop before and after with the DEMO catalogue and compare every HTML file with the `/assets/<name>-<hash>` names normalised).

- `src/PageView.tsx`: the page switch, split out of `App.tsx` (`App` = `Layout` + `PageView`). Also exports `showsPrice(model)`.
- `src/lib/page-source.ts`: `IS_APP`, `SITE_ORIGIN`, `PAGE_SOURCE` and `sourceUrl(path)`: where page HTML and `/kirici-modelleri.json` are fetched from (`''` on the site, `SITE_ORIGIN` in the app). Used by `palet-lines.ts` and `BreakerSearch.tsx`.
- `src/lib/asset-base.ts`: `ASSET_BASE` and `assetUrl(path)`: the prefix for media hosted on Pages (`/photos`, `/videos`, `/models`, opening frames; `''` on the site). Used by `photo-url.ts`, `tip-img.ts`, `ExplodedPicker.tsx`, `GuideVideo.tsx`, `PartViewer.tsx`. Tip and part pictures keep `VITE_TIP_IMG_BASE` when it is set.
- `src/lib/nav.ts`: `go(url)`, the one programmatic navigation (`BreakerSearch.tsx`): `location.assign` on the site, the app's router after `setNavigator()`.

The flags are read at run time with `readAppEnv(import.meta.env)`; only `VITE_APP=1` switches a seam to the app value. A new place that builds a Pages media URL or fetches a site page goes through these seams.

## Contract rule

`src/app/contract.ts` lists the page kinds the app knows (`KNOWN_KINDS`) and holds a compile-time test: a type equality between `PageModel['kind']` and that list. A kind added to or renamed in the shop (`src/lib/routes.ts`) fails `pnpm typecheck` until it is added to the list and to `PageView`. At run time an installed app that meets a kind it does not know shows UpdateNeeded instead of a broken page. Never change the shape of a page's embedded props (`kv-page`) without checking what an older app does with it.

## Rules that bite here

- The repo and CI logs are public: no prices, no price file, no catalogue in the app or its build. Prices reach the app one page at a time from the site. `build-app.mjs` and `check-app-dist.mjs` print counts only.
- Never show that parts of different models are the same: Makinelerim never merges parts lists.
- No invented numbers or references; no explanatory filler sentences on screens. Images are immutable (a changed picture gets a new file name).

## Build and test

```bash
pnpm --filter @kervan/parts-shop build:app    # dist-app/, pages from https://kiriciparca.com
pnpm --filter @kervan/parts-shop check:app    # the checks below
# against a local stand-in site (the e2e): build the shop (DEMO), then
VITE_SITE_ORIGIN=http://127.0.0.1:4173 pnpm --filter @kervan/parts-shop build:app
cd apps/parts-shop && VITE_SITE_ORIGIN=http://127.0.0.1:4173 node --experimental-strip-types --no-warnings --test e2e/app.spec.ts
```

- `scripts/check-app-dist.mjs` fails when `dist-app/` has a price-looking field with a value (JSON or JS), a tip or SKU code of the catalogue snapshot that the source does not spell out, a DEMO catalogue marker, an ads id or host of `src/lib/ads.ts` or the Cloudflare beacon, a private string (the `check-dist.mjs` list), an absolute URL to a host other than the site origin and `img.kiriciparca.com` (plus the short, commented lists of link-out hosts such as `wa.me` and of library names such as `www.w3.org`; reserved `*.invalid` parsing bases do not count; run it with the same `VITE_SITE_ORIGIN` as the build), a site file (prerendered pages, `_headers`, `tips/`, `photos/` …), or passes its size or file budget (`MAX_BYTES`, `MAX_FILES`; raise them in the same PR when the app really grows, for example the bundled videos of M4).
- Unit tests run with the shop's tests (`pnpm test`; node's runner, not vitest): `src/app/*.test.ts`, the seam tests in `src/lib/`, `scripts/check-app-dist.test.ts`.
- `.github/workflows/app.yml` (PRs touching `apps/parts-shop/**` or `packages/**`): DEMO catalogue, the shop's build as the stand-in site, `build:app` and `check:app` pointed at `http://127.0.0.1:4173`, then the Playwright e2e (`e2e/app.spec.ts`, iPhone size, run with node; it serves `dist/` at the origin with CORS and clean URLs and `dist-app/` with an SPA fallback, builds `dist-app` with `build-app.mjs` when it was built for another origin, and writes the owner's screenshots when `E2E_SHOTS=<dir>` is set). CI builds the DEMO site without part prices (`SHOP_DEMO_PART_PRICES` is local only), so there the e2e gives one part item the DEMO price in the response the app reads (`editProps`); locally the real DEMO-priced page is used. It needs no secrets, has no Apple steps and never blocks a deploy. `deploy.yml` deploys `dist/` only, never `dist-app/`.
- `scripts/secret-guard.mjs` refuses Apple signing files (`*.p8`, `*.p12`, `*.mobileprovision`, `*.provisionprofile`, `*.cer`, `*.certSigningRequest`, `AuthKey_*`): signing material lives only in the GitHub environment (M3).

## Next milestones

- **M2 — native project, unsigned build.** `apps/parts-app` with Capacitor and the committed `ios/` project (plist keys, privacy manifest, TR/EN camera strings, icon, iPhone only), fed from `dist-app/`.
  A PR job builds it for the simulator on macOS without secrets; the owner fixes the app name and bundle ID (permanent) and approves the icon.
- **M3 — signing spike to TestFlight (go/no-go).** One signed build on the owner's iPhone through TestFlight, with the signing route settled (cloud signing, or a short-lived certificate as fallback).
  The device answers (pictures, deep paths, `wa.me`/`mailto`/`tel` hand-off, 3D viewer, safe areas) are recorded here; the owner enrols, creates the API key and types the secrets into the GitHub environment.
- **M4 — app-only features.** "Son siparişi tekrarla", the QR scanner with the host allow-list, offline Rehber with bundled videos, Settings (language, "Verilerimi sil"), the Palet mirror on the phone, "Siparişi kopyala" and the share sheet.
  Unit tests and Playwright with web stand-ins on Linux; camera and WhatsApp are checked by the owner on TestFlight.
- **M5 — universal links and site texts.** The `apple-app-site-association` file on kiriciparca.com, the Associated Domains entitlement and deep-link routing, so the iPhone camera opens crate links in the app.
  One app paragraph in the privacy/KVKK text; `check-dist.mjs` checks the file is valid JSON and price-free.
- **M6 — store listing and submission.** Listing texts TR/EN, simulator screenshots, review notes and the metadata lane; first submission and one review round.
  Store texts are checked by a unit test (length limits, no makers' names, no prices); submission happens only on the owner's word.
