# Komut kalıpları

Claude Code oturumunda (claude.ai/code) kopyalayıp yapıştırmak için hazır mesajlar. `<köşeli>` yerleri kendi bilginizle doldurun, köşeli parantezleri silin.

Her kalıpta şu kurallar zaten geçerlidir; ayrıca yazmanıza gerek yok (CLAUDE.md):

- PR taslak açılır, siz "merge et" demeden birleştirilmez.
- Büyük adımlardan önce ekran görüntüsü veya değişiklik listesi gösterilir.
- Fiyat, fiyat listesi, kit ölçüleri ve Teknik Bilgiler metni repoya ve loglara girmez.
- Şifre, token, anahtar sohbete yapıştırılmaz.

Maliyet: **düşük** = tek mesajlık iş, **orta** = birkaç adım, **yüksek** = "workflow kullan" (çok ajan).

---

## A. Günlük işler

**A1. Küçük değişiklik** (düşük)

```
<site> sitesinde <sayfa> içindeki <eski> yerine <yeni> olsun. TR ve EN birlikte. Önce/sonra ekran görüntüsü göster, onaylarsam taslak PR aç.
```

**A2. Yeni özellik, önce plan** (orta)

```
<site> için <istediğim özellik>. Amaç: <neden>. Önce planı ve etkilenecek sayfaları göster, onayımı bekle; onaydan sonra yap, telefon ve masaüstü ekran görüntüsüyle göster, taslak PR aç.
```

**A3. Tek mesajda bitir** (düşük): işin sonunu baştan söyleyin

```
<istek>. Taslak PR aç, CI yeşil olunca merge et ve canlıda doğrula.
```

**A4. Birkaç değişiklik tek seferde** (düşük): video ve render gibi uzun işlerde her ayrı istek yeni bir çizim demek

```
Şunları tek seferde yap: 1) <…> 2) <…> 3) <…>. Bitince tek ekran görüntüsü/video gönder.
```

**A5. Merge öncesi inceleme** (orta): iki ayrı mesaj

```
/code-review high <PR numarası>
```

```
Bulguları Türkçe özetle, düzelt, ekran görüntüsüyle göster.
```

**A6. Merge** (düşük)

```
merge et
```

CI bitmediyse bekleyip yeşil olunca birleştirir, sonra canlı sitede kontrol eder.

---

## B. Toplu işler: "workflow kullan" (yüksek; yalnız büyük işlerde)

Küçük bir araştırma için "low workflow kullan" yazın: az ajan, düşük efor.

**B1. Yeni çizimlerden parça modelleme**

```
workflow kullan: <klasör veya marka/model listesi> çizimlerinden <parça türü> modelle ve renderla. Başka model adı taşıyan, mükerrer, KABA, HATALI, ÖZEL çizimleri ayırıp göster. Her render'ı ikinci bir ajan çizimle karşılaştırsın. Commit'ten önce örnekleri ve toplam dosya sayısını göster.
```

**B2. Render kalite denetimi**

```
workflow kullan: <grup, ör. tüm burçlar> render'larında <konu: pah / pim çentiği / ölçü> denetimi yap. Bulguları ikinci bir ajan çizimle doğrulasın, yalnız doğrulananları yeniden renderla (yeni dosya sürümüyle). Önce/sonra örnekleri göster.
```

**B3. Site denetimi**

```
workflow kullan: <site> için <SEO / mobil görünüm / erişilebilirlik> denetimi yap. Bulguları ikinci bir ajan doğrulasın, düzeltme planını göster, onayımı bekle.
```

**B4. Araştırma**

```
low workflow kullan: <soru>. Kaynaklarıyla kısa bir öneri listesi ver.
```

### Örnek workflow, adım adım (B2 ile)

Gönderdiğiniz mesaj:

```
workflow kullan: tüm burç render'larında pim çentiği denetimi yap. Bulguları ikinci bir ajan çizimle doğrulasın, yalnız doğrulananları yeniden renderla. Önce/sonra örnekleri göster.
```

Ne olur:

1. **Bul.** Her ajan bir grup burcu çizimiyle karşılaştırır: çentik sayısı, yeri, yönü.
2. **Doğrula.** Her bulguyu başka bir ajan çizimden tekrar okur. Çürütülen bulgu düşer ve size ayrıca listelenir.
3. **Yap.** Yalnız doğrulanan parçalar yeniden renderlanır. Dosya adına yeni sürüm eklenir; eski görselin üstüne yazılmaz.
4. **Göster.** Size önce/sonra örnekleri ve sayılar gelir. Commit sizin "onaylıyorum" demenizle atılır.
5. **Yayın.** Taslak PR açılır. CI yeşil olunca "merge et".

İlerlemeyi `/workflows` ile izleyebilirsiniz.

---

## C. Takip

**C1. Beklerken hatırlatma** (orta): yalnız oturum açıkken çalışır

```
/loop 10m <PR numarası> numaralı PR'ın CI'ını kontrol et, yeşil olunca yaz.
```

**C2. Güvenlik incelemesi** (orta): form, giriş, fiyat veya veri akışı değiştiyse

```
/security-review
```

---

## D. Cowork'e iş (düşük)

```
Cowork için <Search Console / Google Ads Tag Assistant / Cloudflare paneli> prompt'u yaz: <ne yapılacak>. Adım adım olsun, hiçbir ayarı silmesin, sonucu tablo olarak getirsin. Gizli değer gerekiyorsa "değeri kendin gir" desin.
```

Cowork'ün raporunu buraya yapıştırın, Claude yorumlar ve gerekeni yapar.

---

## E. Oturum

| Mesaj                                          | Ne zaman                                                       |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `/compact <neyi tut>`                          | Uzun bir işin ortasında, bağlam dolunca                        |
| `/clear`                                       | Konu tamamen değişince (açık PR numarasını not alın)           |
| `/fewer-permission-prompts`                    | Çok "izin ver" sorusu geliyorsa, bir kez                       |
| `/promptup:pp-config`                          | Mesajlarınızın yeniden yazılmasını kapatmak veya azaltmak için |
| `Bunu CLAUDE.md'ye kural olarak ekle: <kural>` | Sık tekrarladığınız bir isteği kalıcı yapmak için              |

Bu ortamda çalışmayanlar: `/autofix-pr`. Denenmemiş olanlar: `/plan`, `/schedule`, `/effort`, `/model`; denediğinizde sonucu söyleyin, bu dosya güncellensin.
