# kervan-platform

Monorepo for Kervan Makina'nın iki web sitesi:
- **kervanheat.com** — fason ısıl işlem hizmetleri (sertleştirme, temperleme, sementasyon)
- **kervanbreaker.com** — hidrolik kırıcı yedek parçaları (keski, piston, burç, kit)

## Stack

- pnpm 10+ workspace · Turborepo 2.9
- Vite 5 + TypeScript 5.9 + React 18 (her iki app)
- Tailwind v4 + Framer Motion
- Mood C dark palette + Forge Ember accent (`#E8431B`)
- Cloudflare Pages (static + Functions için RFQ endpoint)

## Layout

```
apps/
  heat-treatment/        kervanheat.com — single-page, plain
    functions/api/rfq.ts   Pages Function — RFQ POST handler
    src/                   React + sections + dict
    public/                static assets, _redirects, _headers, sitemap, robots
  breaker-parts/         kervanbreaker.com — long-scroll + 8 detail routes
    src/                   pages, components, sections, data, lib
    public/                photos, videos symlink, brand-logos, kirici-uc.glb

packages/
  ui/                    @kervan/ui — Mood C tokens + base components
  motion/                @kervan/motion — Framer variants + ScrollReveal
  seo/                   @kervan/seo — JSON-LD + PageMeta + JsonLd
```

## Komutlar

```bash
pnpm install                                       # workspace tümü
pnpm dev                                           # turbo dev (her iki app)
pnpm --filter @kervan/heat-treatment dev           # tek app — http://localhost:5173
pnpm --filter @kervan/breaker-parts dev            # tek app — http://localhost:5174
pnpm turbo build                                   # her iki app + paketler
pnpm turbo typecheck                               # 5 paket
pnpm format                                        # Prettier
pnpm lint                                          # ESLint flat config
```

## Deploy

İki ayrı Cloudflare Pages projesi. `main` branch → production, diğerleri → preview.

| Pages projesi | Domain | Build path |
|---|---|---|
| `kervan-heat-treatment` | kervanheat.com | `apps/heat-treatment/dist` |
| `kervan-breaker-parts` | kervanbreaker.com | `apps/breaker-parts/dist` |

GitHub Actions workflow (`.github/workflows/deploy.yml`):
- `dorny/paths-filter` ile değişen app'i tespit eder
- Sadece etkilenen app'i build + deploy eder (`packages/**` değişirse ikisini de)
- `cloudflare/wrangler-action@v3` ile `pages deploy`

### Manuel kurulum (bir kerelik, dashboard'dan)

**A. Cloudflare Pages projeleri oluştur** (dashboard → Workers & Pages → Create → Pages):

| Proje adı | Production branch | Build command | Output dir |
|---|---|---|---|
| `kervan-heat-treatment` | `main` | (empty — Actions yapacak) | `apps/heat-treatment/dist` |
| `kervan-breaker-parts` | `main` | (empty — Actions yapacak) | `apps/breaker-parts/dist` |

> Build command'ı boş bırak — bu repo'yu Cloudflare git integration'a bağlama. Deploy'lar Actions tarafından `wrangler pages deploy` ile yapılır. Pages projesi sadece "host" rolünde.

**B. Custom domain bind:**
- `kervan-heat-treatment` → `kervanheat.com` + `www.kervanheat.com`
- `kervan-breaker-parts` → `kervanbreaker.com` + `www.kervanbreaker.com`

Her iki domain Cloudflare'de zaten kayıtlı; Pages otomatik DNS kayıtlarını kuruyor.

**C. GitHub repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Source |
|---|---|
| `CLOUDFLARE_API_TOKEN` | dashboard → My Profile → API Tokens → "Edit Cloudflare Workers" template ile yeni token |
| `CLOUDFLARE_ACCOUNT_ID` | dashboard → Workers & Pages anasayfası → sağ alt "Account ID" |

**D. Heat-treatment Pages env vars** (RFQ Function için — sadece `kervan-heat-treatment` projesinde, breaker'da gerek yok):

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | primary email transport |
| `MAILCHANNELS_DKIM_DOMAIN` | fallback transport |
| `MAILCHANNELS_DKIM_SELECTOR` | DKIM selector (default: `mailchannels`) |
| `MAILCHANNELS_DKIM_PRIVATE_KEY` | DKIM private key |
| `TG_BOT_TOKEN` | Telegram bot token |
| `TG_CHAT_ID` | Telegram chat ID |
| `MAIL_TO` | RFQ inbox (default: `ahmet@kervanheat.com`) |
| `MAIL_FROM` | sender (default: `noreply@kervanheat.com`) |

**E. Cutover sırası — downtime'sız geçiş için:**

1. PR aç (`claude/kervan-dual-site-migration-gKTT3` → `main`) ama **henüz merge etme**
2. PR açılınca workflow tetiklenir → preview deploy
3. Preview URL'leri kontrol et:
   - `https://<branch>.kervan-heat-treatment.pages.dev`
   - `https://<branch>.kervan-breaker-parts.pages.dev`
4. Her şey çalışıyorsa **main'e merge et** → production deploy. Bu noktada Pages projeleri canlı ama özel domain hâlâ eski Worker'a yönlü.
5. Cloudflare dashboard'dan custom domain'leri Pages projelerine bind et — bu DNS cutover anı. Saniyeler içinde traffic Pages'e geçer.
6. Eski Worker route'unu (`kervanheat.com → kervan-website` Worker) deaktive et veya Worker'ı tamamen sil.
7. Sonraki commit'te `src/worker/`, `wrangler.jsonc` ve kök `public/`'in breaker-only HTML'leri (`compat.html`, `part.html`, `gallery.html` vs.) temizlenir.

> **Önemli:** Adım 4'ten önce eski Worker hâlâ canlı, kervanheat.com hizmet vermeye devam ediyor. Pages'e DNS cutover sadece adım 5'te. Bu sıra downtime'sız bir geçiş garanti eder.

## RFQ akışı

Her iki site `/api/rfq` endpoint'ine POST atar:
- **kervanheat.com Contact** → same-origin POST (`/api/rfq` Pages Function)
- **kervanbreaker.com Contact** → cross-origin POST (`https://kervanheat.com/api/rfq`)

Worker tarafı CORS allowlist'inde `kervanbreaker.com` var; allowlist dışı origin'ler 403.

Email pipeline: Resend (primary) → MailChannels (fallback) → Telegram (notification, parallel).

## Medya ekleme

### Hızlı yol — Inbox

Ham dosyaları **tek yere** at, ismi ne olursa olsun:

```
public/photos/_inbox/         # repo kökü, eski paylaşılan dizin
```

Sonra Claude'a "yükledim, bakar mısın?" de → içerikleri inceler, doğru isme çevirir, doğru kategoriye taşır, dict'e bağlar, commit eder.

**Video için**: dosya adında ipucu olsun (`forj.mp4`, `cnc-kesim.mp4`) ya da mesajında belirt.

### Manuel yol — Slot referansı

| App | Dizin | Slotlar |
|---|---|---|
| breaker-parts | `apps/breaker-parts/public/photos/uclar/` | sivri-uc, yassi, konik, piramit, asfalt |
| breaker-parts | `apps/breaker-parts/public/photos/pistonlar/` | piston-stack, piston-detay |
| breaker-parts | `apps/breaker-parts/public/photos/burclar/` | burclar-raf, burc-detay |
| breaker-parts | `apps/breaker-parts/public/photos/kit/` | seal-kit |

`apps/breaker-parts/public/videos` → repo kökünde `public/videos/` symlink (paylaşılan).

Tavsiye edilen ölçü/limit:

| Tip | Boyut | Format | Dosya | Not |
|---|---|---|---|---|
| Foto | 1600×2000 px (4:5) | JPEG veya WebP | < 400 KB | sıkıştırılmış |
| Video | 1080×1350 (4:5) | MP4 H.264 + AAC | < 10 MB | seamless loop, ses yok |

### Cache uyarısı

`_headers` `/photos/*` için 1 yıllık immutable cache verir. Aynı dosya adıyla güncelleme yaparsan eski sürüm CDN'de kalır → yeni sürüm için **yeni dosya adı** kullan (`-02`, `-v2`).

## Mimarinin notları

- **Mood C** — dark industrial palette: bg `#0A0A0B`, ink `#E8E2D6` (warm cream), accent `#E8431B` (Forge Ember). Tokens `packages/ui/src/tokens.css` Tailwind v4 `@theme` bloğu ile expose edilir; her iki app `@import "@kervan/ui/tokens.css"` ile çeker.
- **Typography** — Display Fraunces italic serif, body Inter. "Atelier editorial · dark variant" karakteri.
- **3D scene** — sadece breaker-parts'ın `/` route'unda (Three.js + GLTF). heat-treatment'ta 3D yok.
- **i18n** — TR default, EN altyapı. `?lang=` query > `localStorage('kv_lang')` > `navigator.language` > 'tr' fallback.
- **Branch discipline** — `main` korunur (otomatik prod deploy). Feature branch'ler `feature/<topic>`.

## Legacy

- `src/worker/index.ts` — eski Cloudflare Worker (Pages Function'a port edildi). Pages canlıya geçtikten sonra silinir.
- `wrangler.jsonc` (kök) — eski Worker config. Pages canlıya geçince silinir.
- `public/` (kök) — eski monolit site asset'leri. Bazıları breaker-parts'a kopyalandı, fotolar+videolar paylaşılıyor.
- `legacy-astro/` — daha eski Astro denemesi, arşiv.
