# kervan-platform

Kervan Makina'nın üç web sitesi tek monorepo'da:

- **kervanheat.com** — fason ısıl işlem hizmetleri (sertleştirme, temperleme)
- **kervanbreaker.com** — hidrolik kırıcı yedek parçaları (keski, piston, burç, kit)
- **kiriciparca.com** — kırıcı yedek parça mağazası (uçlar ve diğer parçalar; arama, ürün
  sayfaları, palet, fiyatlar)

## Stack

- pnpm 10+ workspace · Turborepo 2
- Vite 5 + TypeScript 5 + React 18 (üç app)
- Tailwind v4 + Framer Motion
- Isıl işlem + kırıcı: Mood C dark palette + Forge Ember accent (`#E8431B`)
- Mağaza: açık, kurumsal palet (aynı token adları, açık değerler)
- Cloudflare Pages — statik sayfalar + Functions (RFQ, tema, şifreli teknik katalog);
  mağazanın verisi (katalog, fiyat, stok) D1 veritabanında, repoda değil

## Layout

```
apps/
  heat-treatment/        kervanheat.com — single-page, plain
    functions/api/         RFQ POST handler + şifreli teknik katalog uçları
    functions/_middleware  gündüz/gece teması (konuma göre)
    src/                   React + sections + dict
    public/                static assets, _redirects, _headers, sitemap, robots
  breaker-parts/         kervanbreaker.com — long-scroll + 8 detail routes
    functions/api/tech/    şifreli teknik katalog (giriş, oturum, içerik)
    functions/_middleware  gündüz/gece teması (konuma göre)
    src/                   pages, components, sections, data, lib
    public/                photos, videos symlink, brand-logos, kirici-uc.glb
  parts-shop/            kiriciparca.com — önceden üretilmiş sayfalar + arama
    functions/             Pages Function — gündüz/gece teması (tek sunucu kodu)
    migrations/            D1 şeması
    render/                uç görsellerinin üreteci (headless Chromium)
    scripts/               katalog, prerender, render, veri aktarımı
    src/                   pages, components, lib, dict
    public/                parça/stok fotoğrafları, 3B modeller, _redirects, _headers, _routes.json

packages/
  ui/                    @kervan/ui — Mood C tokens + base components
  motion/                @kervan/motion — Framer variants + ScrollReveal
  seo/                   @kervan/seo — JSON-LD + PageMeta + JsonLd
  tips/                  @kervan/tips — uç kodları, model listeleri, parça mantığı (en çok test)
```

## Komutlar

```bash
pnpm install                                       # workspace tümü
pnpm dev                                           # turbo dev (üç app)
pnpm --filter @kervan/heat-treatment dev           # tek app — http://localhost:5173
pnpm --filter @kervan/breaker-parts dev            # tek app — http://localhost:5174
pnpm --filter @kervan/parts-shop dev               # tek app — http://localhost:5175 (DEMO katalog)
pnpm turbo build                                   # üç app + paketler
pnpm turbo typecheck                               # tüm paketler
pnpm test                                          # birim testleri
pnpm format                                        # Prettier
pnpm lint                                          # ESLint flat config
```

Mağaza veri token'ı olmadan DEMO katalogla açılır (`XX…` kodlar, sayfada "DEMO verisi" uyarısı);
gerçek katalog D1'den gelir ve repoya yazılmaz.

## Deploy

Üç ayrı Cloudflare Pages projesi. `main` branch → production, diğerleri → preview.

| Pages projesi           | Domain            | Build path                 |
| ----------------------- | ----------------- | -------------------------- |
| `kervan-heat-treatment` | kervanheat.com    | `apps/heat-treatment/dist` |
| `kervan-breaker-parts`  | kervanbreaker.com | `apps/breaker-parts/dist`  |
| `kervan-parts-shop`     | kiriciparca.com   | `apps/parts-shop/dist`     |

`www.kiriciparca.com` ve eski `magaza.` / `shop.kervanbreaker.com` adresleri 301 ile
kiriciparca.com'a yönlenir.

GitHub Actions workflow (`.github/workflows/deploy.yml`):

- Önce `verify`: typecheck + lint + format + gizli bilgi kontrolü — geçmezse deploy olmaz
- `dorny/paths-filter` ile değişen app'i tespit eder
- Sadece etkilenen app'i build + deploy eder (`packages/**` değişirse hepsi)
- `cloudflare/wrangler-action` ile `pages deploy`
- `main`'e her push'ta üç app birden yayınlanır, ardından smoke kontrolü çalışır

Bunun dışında zamanlanmış ve elle çalıştırılan workflow'lar var — aşağıdaki
"Zamanlanmış ve yardımcı workflow'lar" bölümüne bak.

### Manuel kurulum (bir kerelik, dashboard'dan)

**A. Cloudflare Pages projeleri oluştur** (dashboard → Workers & Pages → Create → Pages):

| Proje adı               | Production branch | Build command             | Output dir                 |
| ----------------------- | ----------------- | ------------------------- | -------------------------- |
| `kervan-heat-treatment` | `main`            | (empty — Actions yapacak) | `apps/heat-treatment/dist` |
| `kervan-breaker-parts`  | `main`            | (empty — Actions yapacak) | `apps/breaker-parts/dist`  |
| `kervan-parts-shop`     | `main`            | (empty — Actions yapacak) | `apps/parts-shop/dist`     |

> Build command'ı boş bırak — bu repo'yu Cloudflare git integration'a bağlama. Deploy'lar Actions tarafından `wrangler pages deploy` ile yapılır. Pages projesi sadece "host" rolünde.

**B. Custom domain bind:**

- `kervan-heat-treatment` → `kervanheat.com` + `www.kervanheat.com`
- `kervan-breaker-parts` → `kervanbreaker.com` + `www.kervanbreaker.com`
- `kervan-parts-shop` → `kiriciparca.com` (+ `www` ve eski adresler 301)

Domainler Cloudflare'de zaten kayıtlı; Pages otomatik DNS kayıtlarını kuruyor.

**C. GitHub repository secrets** (Settings → Secrets and variables → Actions):

| Secret                       | Source                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`       | dashboard → My Profile → API Tokens → "Edit Cloudflare Workers" template ile yeni token |
| `CLOUDFLARE_ACCOUNT_ID`      | dashboard → Workers & Pages anasayfası → sağ alt "Account ID"                           |
| `CLOUDFLARE_SHOP_DATA_TOKEN` | mağazanın verisini okuyan salt-okunur token (katalog + fiyat çekme adımları için)       |

**D. Heat-treatment Pages env vars** (RFQ Function için — sadece `kervan-heat-treatment` projesinde; breaker'da ve mağazada gerek yok):

| Variable                        | Purpose                                    |
| ------------------------------- | ------------------------------------------ |
| `BREVO_API_KEY`                 | primary email transport (Brevo)            |
| `RESEND_API_KEY`                | fallback transport                         |
| `MAILCHANNELS_DKIM_DOMAIN`      | fallback transport                         |
| `MAILCHANNELS_DKIM_SELECTOR`    | DKIM selector (default: `mailchannels`)    |
| `MAILCHANNELS_DKIM_PRIVATE_KEY` | DKIM private key                           |
| `MAIL_TO`                       | RFQ inbox (default: `info@kervanheat.com`) |
| `MAIL_FROM`                     | sender (default: `noreply@kervanheat.com`) |

**E. Mağaza tarafı:**

- D1 veritabanı (`kervan-shop`) oluşturulur, `migrations/` uygulanır.
- Katalog ve fiyat, D1'e veri aktarım script'leriyle yüklenir; fiyat verisi repoya girmez.
- Fiyat güncelleme ve katalog içe aktarma Actions ile çalışır (`shop-prices.yml`,
  `shop-import.yml`), elle panel işlemi gerekmez.

## RFQ akışı

Isıl işlem ve kırıcı siteleri aynı `/api/rfq` endpoint'ine POST atar:

- **kervanheat.com Contact** → same-origin POST (`/api/rfq` Pages Function)
- **kervanbreaker.com Contact** → cross-origin POST (`https://kervanheat.com/api/rfq`)

Function tarafındaki CORS allowlist'inde `kervanbreaker.com` var; allowlist dışı origin'ler 403 alır.

Email pipeline: Brevo (primary) → Resend → MailChannels (fallbacks). Email is the only notification channel.

Mağazada RFQ formu yok: sipariş isteği, "palete yükle" ile doldurulan paletten WhatsApp veya e-posta
üzerinden gönderilir. Mağazada çalışan sunucu kodu yalnızca gündüz/gece teması Function'ıdır.

## Medya ekleme

### Hızlı yol — Inbox

Ham dosyaları **tek yere** at, ismi ne olursa olsun:

```
public/photos/_inbox/         # repo kökü, eski paylaşılan dizin
```

Sonra Claude'a "yükledim, bakar mısın?" de → içerikleri inceler, doğru isme çevirir, doğru kategoriye taşır, dict'e bağlar, commit eder.

**Video için**: dosya adında ipucu olsun (`forj.mp4`, `cnc-kesim.mp4`) ya da mesajında belirt.

### Manuel yol — Slot referansı

| App            | Dizin                                              | Slotlar                                                                                                                                                       |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| breaker-parts  | `apps/breaker-parts/public/photos/uclar/`          | sivri-uc, yassi, konik, piramit, asfalt                                                                                                                       |
| breaker-parts  | `apps/breaker-parts/public/photos/pistonlar/`      | piston-stack, piston-detay                                                                                                                                    |
| breaker-parts  | `apps/breaker-parts/public/photos/burclar/`        | burclar-raf, burc-detay                                                                                                                                       |
| breaker-parts  | `apps/breaker-parts/public/photos/kit/`            | seal-kit                                                                                                                                                      |
| heat-treatment | `public/photos/isil-islem/` (repo root, symlinked) | `<ad>-640.webp` + `<ad>-1080.webp` (4:5), listed in dict `craft.photos`                                                                                       |
| heat-treatment | `public/videos/isil-islem/` (repo root, symlinked) | `firin-hatti-loop-01.mp4` (720×1280) + `-wide.mp4` (1280×720) + `-poster.webp` / `-wide-poster.webp` = frame 189 (6.3 s), hero film (`HeroFilm.tsx` START_AT) |
| parts-shop     | `apps/parts-shop/public/photos/`                   | stok fotoğrafları: her görsel `-sm` + `-lg` webp (4:3), adı yeni sürümde değişir                                                                              |
| parts-shop     | `apps/parts-shop/public/photos/parca/`             | yedek parça render'ları (alt gövde, burç, kama, saplama, piston, kit); 3B modellerden üretilir, elle eklenmez                                                 |
| parts-shop     | `apps/parts-shop/public/photos/tesis/`             | tesis/atölye fotoğrafları                                                                                                                                     |
| parts-shop     | `apps/parts-shop/public/models/`                   | 3B modeller (GLB, sayfadaki "3B incele" ile açılır)                                                                                                           |

`apps/breaker-parts/public/videos` → repo kökünde `public/videos/` symlink (paylaşılan).

Uç (keski) render'ları ayrıdır: build sırasında `.renders/` içinde üretilir (headless Chromium,
`scripts/render-tips.ts`), `dist/tips/` altında yayınlanır ve repoda tutulmaz. Parça render'ları ise
`public/photos/parca/` altında repodadır.

Tavsiye edilen ölçü/limit:

| Tip   | Boyut              | Format          | Dosya    | Not                    |
| ----- | ------------------ | --------------- | -------- | ---------------------- |
| Foto  | 1600×2000 px (4:5) | JPEG veya WebP  | < 400 KB | sıkıştırılmış          |
| Video | 1080×1350 (4:5)    | MP4 H.264 + AAC | < 10 MB  | seamless loop, ses yok |

### Cache uyarısı

`_headers` `/photos/*` ve `/videos/*` için 1 yıllık immutable cache verir. Aynı dosya adıyla güncelleme yaparsan eski sürüm CDN'de kalır → yeni sürüm için **yeni dosya adı** kullan (`-02`, `-v2`).

## Mimarinin notları

- **Mood C** — dark industrial palette: bg `#0A0A0B`, ink `#E8E2D6` (warm cream), accent `#E8431B` (Forge Ember). Tokens `packages/ui/src/tokens.css` Tailwind v4 `@theme` bloğu ile expose edilir; ısıl işlem ve kırıcı app'leri `@import "@kervan/ui/tokens.css"` ile çeker.
- **Mağaza paleti** — aynı token adları, açık değerler. Kural: açık, kurumsal, resmî; "yapay zekâ görünümü" yok (glow, gradient, italik serif, pill buton yok). Uç render'ları kendi kor rengini taşır.
- **Typography** — ısıl işlem ve kırıcı: Display Fraunces italic serif, body Inter ("Atelier editorial · dark variant"). Mağaza: sade kurumsal dizgi.
- **3D scene** — breaker-parts'ın `/` route'unda (Three.js + GLTF) ve mağazanın parça sayfalarında "3B incele" (lazy yüklenen üç boyut görüntüleyici). heat-treatment'ta 3D yok.
- **Mağaza mimarisi** — router yok, tek sayfa uygulaması yok: her sayfa build sırasında üretilir ve içeriği sayfaya gömülür; linkler düz `<a>`. Katalog, stok ve fiyat D1'den gelir; mağazadaki tek sunucu kodu gündüz/gece teması Function'ıdır. Veri güncellemesi kod değişikliği gerektirmez.
- **i18n** — TR default, EN altyapı. `?lang=` query > `localStorage('kv_lang')` > `navigator.language` > 'tr' fallback.
- **Branch discipline** — `main` korunur (otomatik prod deploy). Feature branch'ler `feature/<topic>`.

## Paylaşılan medya

Kök `public/` yalnızca ısıl işlem ve kırıcı sitelerinin paylaştığı medyayı taşır: `photos/`,
`videos/` ve `kirici-uc.glb`. Mağaza medyasını kendi `apps/parts-shop/public/` dizininde tutar.
Uygulamalar kök medyaya symlink ile bağlanır; taşırken symlink'leri ve `deploy.yml` içindeki
`paths-filter` yollarını da güncelle. Eski Worker (`src/worker/`, kök `wrangler.jsonc`) ve eski
monolit site repodan kaldırıldı.

## Zamanlanmış ve yardımcı workflow'lar

| Workflow          | Ne zaman        | Ne yapar                                                   |
| ----------------- | --------------- | ---------------------------------------------------------- |
| `uptime.yml`      | her 15 dakikada | üç sitenin ayakta olduğunu ve yönlendirmeleri kontrol eder |
| `shop-daily.yml`  | her sabah       | mağazayı yeniden üretip yayınlar (güncel kur ile)          |
| `shop-import.yml` | elle            | katalogu D1'e aktarır, sonra mağazayı yayınlar             |
| `shop-prices.yml` | elle            | fiyatları D1'e aktarır, sonra mağazayı yayınlar            |
