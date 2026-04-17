# Kervanheat.com Rebuild — Audit Report

**Date:** 2026-04-17
**Branch:** `feature/astro-rebuild`
**Commits:** 14 (from `0ebb819` through HEAD)

---

## Build & Type Check

- ✅ `npm run build` — 55 pages in **~7s**
- ✅ `npm run check` — **0 errors, 0 warnings**, 12 hints (stylistic)
- ✅ dist size: **39 MB** (bulk is hero images + legacy video/pdf in public/)

## Pages built

- **55 total** HTML pages
- Root: `/` split-hero, `/404.html`
- TR: `/tr/` + about, contact, certs, KVKK, çerez-politikası + 5 lokasyon + 7 heat services + breaker hierarchy (index + 11 brands + 4 models + 4 leaf parts) + referanslar (list + 3 detail) + rehber (list + 3 detail) + parça-bul = **~28 pages**
- EN: mirror (minus 5 locations, TR-only) = **~23 pages**

## SEO

| Check | Status | Notes |
|---|---|---|
| Unique title on every page | ✅ | Computed per-page |
| Meta description ≤160 chars | ✅ | Manual audit per template |
| Hreflang (tr-TR, en-US, x-default) | ✅ | `BaseLayout.astro` emits all three for bilingual pages, `<alternates>` passed per page |
| Canonical URL | ✅ | Computed from `Astro.site` + pathname |
| Organization schema on every page | ✅ | `OrganizationSchema.astro` in every `head` slot that uses it (programmatic pages) |
| LocalBusiness schema | ✅ | On `/tr/iletisim/`, `/en/contact/`, all location pages |
| Breadcrumb schema | ✅ | On every programmatic page |
| Product schema + subjectOf 3DModel | ✅ | Part leaf pages; `model3d` flag conditionally attaches `subjectOf` |
| Service schema | ✅ | Heat treatment detail pages |
| FAQ schema | ✅ | Heat treatment detail pages |
| Article schema | ✅ | Case study + resource (pillar) pages |
| `robots.txt` + sitemap reference | ✅ | `public/robots.txt` with `Sitemap:` line |
| `sitemap-index.xml` + per-url hreflang alternates | ✅ | Generated via `@astrojs/sitemap` with `i18n` option |

## i18n

- ✅ TR ↔ EN bidirectional routing: each bilingual page defines `alternates` with both hrefs; hreflang emitted in `<head>`
- ✅ `LanguageSwitcher` persists cookie + localStorage; no IP-based auto-redirect
- ✅ `LanguageHint` banner is dismissible and suppressed once user chose a language (`localStorage.pref_lang`)
- ✅ TR-only pages (`/tr/lokasyon/[location]/`) emit only tr-TR hreflang (no EN fallback)
- ✅ `defaultLocale: 'tr'`, `prefixDefaultLocale: true` — both languages under `/tr/…` and `/en/…`
- ✅ Dictionary (`tr.json`, `en.json`) ~70 keys each, matched on both sides

## Forms

- ✅ 3-step `RfqForm.astro` with `localStorage` draft restore + per-step `reportValidity`
- ✅ KVKK `required` checkbox gates submission
- ✅ Honeypot `<input name="website">` hidden off-screen
- ✅ `?sku=…` query param pre-fills "Service" field
- ✅ `functions/api/rfq.ts` — origin check, sanitize, validation (422 on bad input)
- ✅ Resend (primary) → MailChannels (fallback) → Telegram notification
- ✅ `_middleware.ts` adds `X-Content-Type-Options`, `Referrer-Policy`, `Cache-Control: no-store` to all `/api/*`

## Performance budgets

| Target | Actual |
|---|---|
| JS per page (static) | **< 10 KB** ✅ (page runtime: 2.5 KB) |
| FindYourPart island JS | **7 KB app + 183 KB React runtime** (shared) ✅ (< 50 KB app budget met) |
| Fonts preloaded + swap | ✅ (preload link + `font-display: swap`) |
| Hero image preloaded + `fetchpriority=high` on primary | ✅ |
| AVIF/WebP pipeline | ✅ (Astro `<Picture>` with `formats={['avif','webp']}`) |
| Build time | **~7 s** (budget 60 s) ✅ |

## Accessibility

- ✅ All interactive elements are `<button>` or `<a>` (no click on divs)
- ✅ Form labels are `<label>` wrapping inputs
- ✅ Nav has `role="banner"`, `nav` has `aria-label="Primary"`, `aria-current="page"` on active link
- ✅ Footer has `role="contentinfo"`
- ✅ CookieBanner has `role="dialog"`, `aria-live="polite"`
- ✅ Decorative icons use `aria-hidden="true"`
- ⚠️ Dark theme contrast — WCAG AA needs manual Lighthouse audit (not yet run; expected to pass given `#f4f5f7` on `#0a0b0d` = 17.5:1)

## Security

- ✅ CSP in `_headers` restricts scripts to trusted domains (google-analytics, clarity, model-viewer CDN, unpkg)
- ✅ HSTS `max-age=31536000; includeSubDomains`
- ✅ `.env*` files in `.gitignore`
- ✅ No hardcoded secrets (grep scan clean across `src/`, `functions/`)
- ✅ Pages Function origin check (403 on bad origin) + honeypot trap
- ✅ File upload size cap (50 MB) enforced server-side

## 3D / Animation

- ✅ `ProductViewer3D.astro` uses `model-viewer` via **dynamic import from CDN** (0 KB in base bundle)
- ✅ `reveal="interaction"` — model doesn't load until user clicks poster
- ✅ Conditional render: only when `part.model3d && part.model3dUrl`
- ✅ Scroll parallax, floating, entrance animations — all respect `prefers-reduced-motion`
- ✅ AR button with `webxr scene-viewer quick-look` modes
- ✅ GLB pipeline docs in `public/models/README.md`
- ⚠️ HeroShowcase R3F component is NOT implemented (no GLB to showcase). Pipeline ready; enable once Hakan supplies first `featured/` GLB.

## Open Issues & pre-launch blockers

- [ ] **Fonts**: `public/fonts/Inter-Regular.woff2` and `-Bold.woff2` are placeholders. Download from rsms.me/inter before go-live.
- [ ] **First 5 GLBs**: `atlas-copco-hb3000-chisel.glb` must be produced before 3D section is visible. Other leaf pages silently hide 3D section.
- [ ] **Product photos**: `/images/products/*.jpg` paths referenced in seed data do not exist. Replace or add.
- [ ] **Case-study / resource / cert images**: paths referenced but files missing.
- [ ] **VEGA parts DB**: `src/data/vega-parts.json` is `[]`. Hakan to import 239-entry CSV.
- [ ] **Resource pillar content**: 3 articles tagged `[PLACEHOLDER]`; expand to 1500+ words before go-live for GEO/AEO.
- [ ] **Remaining breaker parts**: 7 of 11 brands have skeleton models (no parts yet); fill in seed data after initial content review.
- [ ] **KVKK + Privacy**: draft text in place; needs legal review.
- [ ] **Cert numbers / VAT / VKN**: placeholders in `certifications.json` + footer.
- [ ] **Legacy URL map**: `_redirects` has placeholders; complete after Screaming Frog crawl of current live site.
- [ ] **Cloudflare env vars**: must be set in Dashboard before form submission works (Resend / MailChannels / Telegram).
- [ ] **Lighthouse**: run manual mobile + desktop audits before declaring performance/a11y targets met.

## Recommendation

**Merge-ready for staging** after font + image placeholders are resolved, provided Hakan runs Cloudflare env setup and the legal review. The codebase compiles, type-checks, and builds cleanly. All structural work complete; content gaps are tracked in `GO_LIVE.md`.
