# CLAUDE.md — Kervanheat.com

Bu dosya `kervanheat.com` için Claude Code'a kalıcı proje kuralları verir. Her oturumda bu kuralları yükle.

## Rol ve ton

- Türkçe cevap ver, kısa ve öz. Gereksiz açıklama yapma.
- Aksiyon odaklı: "yapıyorum" diyip yap, "yapayım mı?" sorma.
- Kod yorumları İngilizce, kullanıcı iletişimi Türkçe.
- Hata çıkarsa: hatayı göster → 3 olası neden → en olası fix → uygula → doğrula.

## Stack (kesin, değiştirme)

- **Astro 5.16.x LTS** (Astro 6 alpha → KULLANMA)
- **TypeScript strict** + `astro check` her commit öncesi
- **Tailwind v4** (`@tailwindcss/vite` plugin; `@astrojs/tailwind` DEPRECATED)
- **React 18** (sadece interaktif island'lar: FindYourPart, HeroShowcase)
- **Three.js + @react-three/fiber + @react-three/drei** (sadece HeroShowcase için, lazy)
- **model-viewer** (CDN lazy, ürün leaf sayfaları için)
- **Output:** `static` + `build.format: 'directory'` + `trailingSlash: 'always'`
- **Node 20 LTS** (`.nvmrc` = "20")
- **Deploy:** Cloudflare Pages (GitHub integration)
- **Backend:** Pages Functions (`/functions/api/*.ts`)
- **Email:** Resend API (primary) + MailChannels (fallback, Cloudflare native)
- **Storage:** R2 bucket (v2'de, şimdilik metadata-only)

## YASAKLAR

- Vercel/Netlify/shared hosting stack'i önerme. Cloudflare Pages'te kalıyoruz.
- IP-based auto-redirect EKLEME (Google International SEO'ya aykırı)
- `localStorage` SSR'da patlatma — `client:only` veya `typeof window !== 'undefined'` guard
- `@astrojs/tailwind` kurma (deprecated)
- `.htaccess`, PHP yazma (Apache değil, Cloudflare Workers runtime)
- Hero dışı görsele `fetchpriority="high"` koyma
- Secret/token kod içinde hardcode etme
- `main`'e direkt push YOK — feature branch + PR
- Three.js'i her ürün sayfasında kullanma — sadece HeroShowcase (landing + hub)
- 500+ kelime template paraphrasing — her sayfada ≥80 kelime gerçekten ORİJİNAL içerik

## Dil/i18n kuralları

- `defaultLocale: 'tr'`, `locales: ['tr', 'en']`
- `prefixDefaultLocale: true` → `/tr/...` ve `/en/...`
- Root `/` sadece split-hero + dil seçici (BaseLayout kullanma)
- Hreflang her sayfada: tr-TR + en-US + x-default (→ tr)
- Asimetrik içerik OK (TR 40+ sayfa, EN 12+ sayfa, farklı olabilir)
- Manuel dil switcher + soft hint banner; auto-redirect YOK

## Dosya yapısı (sapma yok)

```
src/
├── components/
│   ├── seo/{OrganizationSchema, LocalBusinessSchema, ProductSchema,
│   │       BreadcrumbSchema, ServiceSchema, FAQSchema, ArticleSchema}.astro
│   ├── find-your-part/{FindYourPart.tsx, FindYourPartWrapper.astro}
│   ├── hero-showcase/{HeroShowcase.tsx, HeroShowcaseWrapper.astro}
│   ├── ProductViewer3D.astro
│   ├── Header.astro, Footer.astro, HeroSplit.astro
│   ├── LanguageSwitcher.astro, LanguageHint.astro
│   ├── RfqForm.astro, WhatsAppFloat.astro, CookieBanner.astro
│   └── TrustBar.astro, CaseStudyCard.astro
├── content.config.ts          # Astro 5: ROOT'ta
├── data/{breakers, services, vega-parts, locations, certifications, case-studies, resources}.json
├── i18n/{tr.json, en.json, utils.ts}
├── layouts/BaseLayout.astro
├── pages/
│   ├── index.astro, 404.astro
│   ├── tr/...    (hakkimizda, iletisim, sertifikalar, kvkk, cerez-politikasi,
│   │             isil-islem/{index,[service]}, kirici-parcalari/**,
│   │             parca-bul, referanslar/**, rehber/**, lokasyon/**)
│   └── en/...    (EN karşılıkları; /lokasyon/ TR-only)
├── styles/{tokens.css, global.css}
├── utils/analytics.ts
└── assets/
public/
├── _headers, _redirects, robots.txt
├── fonts/{Inter-Regular, Inter-Bold}.woff2
├── images/{products, facility, certifications, case-studies, resources}/
└── models/{featured/, *.glb, README.md}
functions/api/
├── rfq.ts
└── _middleware.ts
.github/workflows/{ci.yml, deploy.yml}
wrangler.jsonc, CLAUDE.md, README.md
```

## Performans hedefleri

- LCP < 2.0s hedef, < 2.5s tavan
- CLS < 0.05, INP < 200ms
- Build time < 60s (400 sayfada)
- JS per page < 50KB (island'lar hariç)
- ProductViewer3D sayfası +0KB base (CDN lazy)
- HeroShowcase sayfası +150KB max (R3F)
- GLB dosyaları < 1.5 MB / dosya
- Lighthouse: Performance ≥90, SEO 100, A11y ≥95

## Branding

- Renkler: `--accent-orange: #ff7a00` (ısıl işlem), `--accent-steel: #5b6b7a` (parts)
- BG: `#0a0b0d` (bg-0), `#121418` (bg-1), `#1a1d22` (bg-2)
- Font: Inter (self-hosted WOFF2, swap)
- Tema: dark industrial, minimum animasyon, `prefers-reduced-motion` uy
- Animasyonlar: `transform` ve `opacity` only

## İçerik kuralları (thin content engelle)

- Her ürün sayfasında ≥80 kelime orijinal el-yazımı paragraf (TR ve EN ayrı)
- Specs tablosu ≥6 satır
- OEM disclaimer her brand sayfasında: *"OEM trademarks are property of their respective owners; aftermarket replacements."*
- GEO (LLM visibility): her sayfa FAQ schema, tablo formatı, Wikipedia-style tanım, gerçek sayılar
- Pillar content (ilk 3): 42CrMo vs 4140, Jominy test, hidrolik kırıcı bakım — her biri 1500+ kelime

## KVKK/GDPR

- Form'da 2 checkbox: `kvkk_consent` (required), `marketing_consent` (optional)
- Cookie banner: Google Consent Mode v2, default denied
- `/tr/kvkk/` + `/en/privacy/` CANLI olmadan form submit açma
- Honeypot her formda: `<input name="website" hidden>`

## Commit convention

Conventional Commits: `feat(i18n):`, `fix(rfq):`, `perf(images):`, `docs:`, `chore(ci):`, `feat(3d):`
Branch: `feature/astro-rebuild`, `develop`'a PR. `main`'e direkt push yasak.

## Destructive ops

`git reset --hard`, `rm -rf`, `git push --force` → onay bekle.
Normal işlemler (file edit, npm install, build, test, commit) → direkt yap.

## Claude Code tooling (dokunma)

- `.claude/` → settings, slash commands, agents, skills
- `.claude-flow/` → workflow configs, sessions
- `.mcp.json` → MCP server integrations
- `.assetsignore`, `.wranglerignore` → CF Pages / Wrangler ignore

Sadece `CLAUDE.md` revize edilir.

## Build & test

```bash
npm run dev            # localhost:4321
npm run build          # dist/
npm run preview        # Astro preview
npm run check          # astro check
npx wrangler pages dev dist --compatibility-date=2026-04-17
```
