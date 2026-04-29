# kervanheat.com

Production static site for Kervan Heat Treatment — heat-treated chisels, pistons and kits for hydraulic breakers.

## Stack

- **Static HTML + inline JSX** (React via CDN, Babel standalone) — no build step
- **Cloudflare Worker** (`src/worker/index.ts`) — serves `public/` assets + handles `/api/rfq` RFQ submissions (Resend → MailChannels fallback + Telegram notifications)

## Layout

- `public/` — all static assets served by Cloudflare (HTML, JSX, CSS, images)
- `src/worker/index.ts` — Cloudflare Worker entry (static assets + RFQ API)
- `legacy-astro/` — previous Astro build, archived for reference

## Deploy

Cloudflare Pages is connected to the `main` branch. Every push deploys automatically.

For local preview:
```
npm install
npm run dev
```

## Environment variables (Cloudflare dashboard)

Required for the RFQ form to deliver email + Telegram:

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Primary email sender |
| `MAILCHANNELS_DKIM_DOMAIN` | Fallback email sender |
| `MAILCHANNELS_DKIM_SELECTOR` | DKIM selector |
| `MAILCHANNELS_DKIM_PRIVATE_KEY` | DKIM private key |
| `TG_BOT_TOKEN` | Telegram bot token |
| `TG_CHAT_ID` | Telegram chat ID for RFQ alerts |
| `MAIL_TO` | Destination inbox (default: info@kervanheat.com) |
| `MAIL_FROM` | Sender address (default: noreply@kervanheat.com) |

## Medya ekleme (galerilere foto/video koymak)

Ana sayfada üç galeri var — **Uçlar**, **Stok**, **Atölye**. Her slot `public/dict.jsx` içinde `{ name, desc, img, video }` formatında. `img` veya `video` alanı boşsa, kart isimli placeholder olarak çıkar. Doldurmak için:

### Hızlı yol — Inbox (önerilen)

Ham dosyaları **tek bir yere** at, ismi ne olursa olsun:

```
public/photos/_inbox/
```

GitHub web upload veya `git push` fark etmez. Sonra Claude'a "yükledim, bakar mısın?" de → içeriklere bakar, doğru isme çevirir, doğru kategoriye (`uclar/`, `stok/`, `atolye/`) taşır, `dict.jsx`'e bağlar, commit eder.

**Video için**: Claude video içeriğini göremez — ya dosya adında bir ipucu olsun (`forj.mp4`, `cnc-kesim.mp4`) ya da mesajında kısaca söyle (*"1.mp4 forj, 2.mp4 CNC, 3.mp4 paketleme"*).

### Manuel yol

Eğer yerleri ve isimleri kendin vermek istersen:

```
public/photos/uclar/   # keski foto’ları
public/photos/stok/    # stok/işlenmiş parça foto’ları
public/photos/atolye/  # atölye sahneleri
public/videos/         # video loop’ları
```

### Dosya adlandırma (manuel yoldaysan)

- **Foto**: `kategori-kisa-aciklama-NN.jpg` (ör. `sivri-uc-granit-01.jpg`, `forj-01.jpg`)
- **Video**: `kategori-kisa-NN.mp4` (ör. `cnc-01.mp4`)
- Türkçe karakter yok, hepsi küçük harf, boşluk yerine tire

### Tavsiye edilen ölçüler / limitler

| Tip | Boyut | Format | Dosya | Not |
|---|---|---|---|---|
| Foto | 1600×2000 px (4:5) | JPEG veya WebP | < 400 KB | Web için sıkıştırılmış — ham kamera dosyası koymayın |
| Video | 1080×1350 (4:5) | MP4, H.264 + AAC | < 10 MB | 5–10 sn seamless loop, **ses yok (muted)** |

### `dict.jsx`’e bağla (manuel yoldaysan)

İlgili item’ın `img` veya `video` alanını doldur:

```jsx
{ name: 'Sivri uç', desc: '…', img: 'photos/uclar/sivri-uc-granit-01.jpg', video: '' },
```

Video varsa `img` poster olarak kullanılır (yüklenirken thumbnail). TR ve EN blokları ayrı — aynı dosyayı iki yere de yaz.

### Commit

```
git add public/photos/uclar/sivri-uc-granit-01.jpg public/dict.jsx
git commit -m "media: add sivri-uc-granit-01"
git push
```

Cloudflare deploy otomatik — push’tan 30–60 saniye sonra canlıda.

### Sınırlar

- GitHub tek dosya **100 MB** sert limit. Video için **ham/4K/HDR yüklemeyin** — sıkıştırılmış halde koyun.
- `_headers` `public/photos/` için 1 yıllık cache header’ı yollar. Aynı dosya adıyla güncelleme yaparsan eski sürüm CDN’de kalır → yeni sürüm için yeni dosya adı (`-02`, `-v2` vs.) kullan.

## site_v2 — Atelier Editorial rebuild

Paralel `site_v2/` klasörü, modern stack ile yeniden yazılmış v2 sitesi: Vite 5 + React 18 + TypeScript + Tailwind v4 + Framer Motion. Mevcut site `kervanheat.com` üzerinde dokunulmadan canlıda. site_v2 ayrı Worker (`kervan-website-v2`) olarak `v2.kervanheat.com` üzerinde yayınlanır.

```
cd site_v2
npm install
npm run dev      # http://localhost:5173
npm run build    # → site_v2/dist
npm run typecheck
```

`site_v2/public/photos` ve `site_v2/public/videos` mevcut `public/` klasörüne symlink — galeri medyası tek yerde, iki site de aynı dosyayı kullanır.

### v2 deploy

`site_v2/**` altında her push GitHub Actions'da `Deploy site_v2` workflow'unu tetikler:
1. `npm install` (site_v2)
2. `npm run build` (Vite → site_v2/dist)
3. `wrangler deploy` (kervan-website-v2 Worker)

### v2 için DNS — kullanıcı yapması gereken (bir kerelik)

1. Cloudflare dashboard → **Workers & Pages → kervan-website-v2 → Custom Domains → Add Custom Domain**
2. `v2.kervanheat.com` gir, kaydet
3. CF otomatik `kervanheat.com` zone'una CNAME ekler (`v2 → kervan-website-v2.workers.dev`)
4. ~30 sn sonra `https://v2.kervanheat.com/` çalışır

### Cross-origin RFQ

site_v2'deki form `https://kervanheat.com/api/rfq` adresine POST atar (cross-origin). Mevcut Worker (`src/worker/index.ts`):
- `ALLOWED_ORIGINS` içinde `https://v2.kervanheat.com` var
- Yanıt header'ında `Access-Control-Allow-Origin` echo back ediliyor
- OPTIONS preflight desteği var (form-data POST'u için gerek yok ama gelecekteki JSON için hazır)

## Pages

- `/` — homepage (TR/EN/DE/RU)
- `/about.html` — company story, Hakan Yünyurt bio
- `/catalog.html` — full parts catalog (print-ready)
- `/cases.html` — case studies
- `/gallery.html` — workshop grid
- `/certs.html` — certifications
- `/blog.html` + `/post.html` — resources
- `/diagram.html` — interactive exploded breaker
- `/compat.html` — compatibility finder
- `/part.html` — individual part detail
