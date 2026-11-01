# Site fotograf paketi

Uc site icin kirpilmis, gerekli yerleri bulaniklastirilmis, meta verisi temizlenmis JPEG'ler.

## Klasorler
- `heat/` - kervanheat.com
- `breaker/` - kervanbreaker.com
- `shop/` - kiriciparca.com
- `eslesme.json` - her dosyanin hangi sayfa/bolume ait oldugu

## Dosyalar
- sRGB JPEG, kalite 90, progressive; uzun kenar en fazla 2560 px (kucultuldu, hic buyutulmedi).
- EXIF, GPS, tarih yok; yalniz sRGB ICC profili var.
- Yazi/etiket/damga iceren kucuk alanlar Gaussian ile bulaniklastirildi.

## eslesme.json alanlari
- `site`, `sayfa`, `bolum`, `sira` - kullanim yeri ve bolum icindeki sira
- `dosya` - bu klasore gore yol (ornek `heat/heat-404-1.jpg`)
- `en`, `boy` - piksel boyutu
- `oran` - hedef en-boy orani
- `kaynak_yil` - cekim yili (2025 / 2026)
- `video` - true ise kare videodan kesilmistir
- `bulanik_kutu` - bulaniklastirilan alan sayisi
- `not` - kadraj ve kullanim notu (UYARI iceren notlara dikkat)

## Sitede kullanirken
- Dosyayi siteye koyarken yeni, aciklayici bir ad ver; marka/model, musteri, kisi adi, katalog no yazma.
- Kirpmayi buyutme: gorseli kendi boyutundan buyuk gosterme, gerekirse yalniz kucult (srcset/width).
- Video kareleri (`video: true`) dusuk cozunurluklu; yalniz kucuk kart/serit boyunda kullan.
- Yeni kirpma gerekirse bu dosyalardan degil, kaynaktan yeniden uret (`paket.py`).
