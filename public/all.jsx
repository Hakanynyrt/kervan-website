/* global React */
const { useState, useEffect, useRef } = React;

// ═══════════════════════════════════════════════════════════════════════════
// Dictionary — TR / EN / DE / RU
// ═══════════════════════════════════════════════════════════════════════════
const DICT = {
  tr: {
    nav: { parts:'Parçalar', compat:'Uyumluluk', furnace:'Fırın', process:'Süreç', contact:'İletişim', quote:'Teklif Al' },
    hero: {
      eyebrow: 'MFG · KARTEPE · SINCE 1999',
      h1a: 'Kırıcı parçaları.', h1b: 'Doğrudan fabrikadan.',
      sub: 'Furukawa, Rammer, Soosan, Atlas Copco ve 40+ marka için keskiler, pistonlar, burçlar, cıvatalar ve tamir kitleri üretiyoruz. 42CrMo çelik, HRC 48–52, kendi atölyemizde üretilir ve ısıl işlemi yapılır.',
      cta1:'Teklif Al', cta2:'Parçaları Gör',
      s:[ {l:'ÇELİK', v:'42CrMoA'}, {l:'SERTLİK', v:'HRC 48–52'}, {l:'TESLİMAT', v:'5–10 GÜN'} ],
      drawA:'KESKI', drawB:'HB20G · Ø80 × 1650 mm', drawC:'REV 00 · KVN-LP-001', drawD:'SCALE 1:8',
      topL:'DWG · KVN · HOMEPAGE', topR:'SHEET 01 / 08',
      botL:'LAT 40.766 N · LON 30.210 E', botR:'KARTEPE · KOCAELI · TR',
    },
    ticker: ['42CrMo ÇELİK', 'HRC 48–52 SERTLİK', '500 t/AY KAPASİTE', '25+ YIL ÜRETİM', '40+ MARKA UYUMLU', '5–10 GÜN TESLİMAT', 'EN 10204 3.1 SERTİFİKA', 'DÜNYAYA SEVKİYAT'],
    parts: {
      label:'01 / ÜRÜN GRUBU', h2a:'Her parça. ', h2b:'Tek çatı.',
      sub:'Kırıcınız için ihtiyacınız olan her şey. Hiçbir aracı yok, hiçbir gecikme yok.',
      items: [
        { ref:'CHS-42', name:'Keskiler', desc:'Düz, sivri, konik, piramit uçlar. Her boy — 500 t/ay stok.', s1:'42CrMo', s2:'HRC 52–54' },
        { ref:'PST-17', name:'Pistonlar', desc:'CNC tornalanmış, taşlanmış, ısıl işlemli. Saatlerce düşünmeden çalışır.', s1:'Dövme', s2:'Tolerans h6' },
        { ref:'BSH-09', name:'Burçlar', desc:'Üst ve alt burçlar, lapatılı yüzey. Oynama yok, gürültü yok.', s1:'Sertleşt.', s2:'Lapatılı' },
        { ref:'BLT-23', name:'Geçme Cıvatalar', desc:'Uzun ömürlü bağlantı cıvataları. Kopmaz, sıyırmaz, gevşemez.', s1:'Sınıf 12.9', s2:'Tam diş' },
        { ref:'HED-11', name:'Ön Kafalar', desc:'Orijinal dökümden değil — bar malzemeden işlenmiş, kaynak yok.', s1:'Bar', s2:'Kaynaksız' },
        { ref:'KIT-00', name:'Tamir Kitleri', desc:'Piston + burç + yıkama + conta. Bize modeli söyleyin, eşleyelim.', s1:'40+ marka', s2:'Eşlenir' },
      ],
    },
    orbit: { label:'02 / UYUMLULUK', h2a:'Kırıcınız ', h2b:'hangi marka olursa olsun.', sub:'40+ kırıcı markasına OEM-eşdeğer fit ve performansla üretiyoruz. Parça numarası ya da fotoğraf yeterli.', caption:'UYUMLU MARKA' },
    furnace: {
      label:'03 / ISIL İŞLEM', h2a:'Kendi fırınımız. ', h2b:'Laboratuvarla birlikte.',
      sub:'Sertleştirme, temperleme, karbürleme, normalleştirme, indüksiyon. Her parça, çıkmadan önce Rockwell ölçülür.',
      steps: [
        { num:'3.1', name:'Normalleştirme', temp:'870 °C · 45 min' },
        { num:'3.2', name:'Karbürleme', temp:'930 °C · 8 h' },
        { num:'3.3', name:'Yağlı Sertleştirme', temp:'850 → 60 °C' },
        { num:'3.4', name:'Temperleme', temp:'180 °C · 2 h' },
        { num:'3.5', name:'Rockwell Ölçüm', temp:'HRC 48–52' },
      ],
      chartT:'ISIL İŞLEM PROFİLİ', chartR:'T(°C) / t(h)',
    },
    process: {
      label:'04 / ÜRETİM AKIŞI', h2a:'Bar malzemeden. ', h2b:'Palete.',
      sub:'Beş dişi el. Bir çatı. Dışarıda kimse yok.',
      steps: [
        { n:'01', name:'Bar Malzeme', desc:'Dövme 42CrMoA çubuk. Partide kimya testi.', tag:'MAT · 42CrMoA' },
        { n:'02', name:'CNC İşleme', desc:'4-eksen torna + freze. Tolerans h6.', tag:'CNC · ±0.01' },
        { n:'03', name:'Isıl İşlem', desc:'Kendi fırınımız. Sertleştir → tempera.', tag:'HRC 48–52' },
        { n:'04', name:'Taşlama', desc:'Silindirik taşlama. Lapatılı yüzey.', tag:'Ra · 0.4' },
        { n:'05', name:'QC', desc:'Sertlik + boyut + yüzey. Her parça.', tag:'EN 10204 3.1' },
        { n:'06', name:'Sevkiyat', desc:'Paletli. Aynı gün fatura.', tag:'WORLDWIDE' },
      ],
    },
    meters: {
      label:'05 / RAKAMLAR', h2a:'Sayılar ', h2b:'konuşur.', sub:'Her iddianın arkasında bir ölçüm var.',
      items: [
        { v:'25', u:'+ YIL', l:'ÜRETİMDE', fill:0.62, hint:'KURULUŞ 1999' },
        { v:'40', u:'+ MARKA', l:'UYUMLU', fill:0.9, hint:'OEM-EŞDEĞER' },
        { v:'500', u:'t / AY', l:'KAPASİTE', fill:0.78, hint:'ÇELİK İŞLEME' },
        { v:'HRC 48–52', u:'', l:'SERTLİK', fill:0.88, hint:'ROCKWELL · C' },
      ],
    },
    rfq: {
      label:'06 / İŞ EMRİ', h2a:'Söyle, ', h2b:'kiti biz eşleyelim.',
      sub:'Parça numarası ya da bir fotoğraf yeter. 24 saat içinde dönüş yapıyoruz.',
      h: ['İŞ EMRİ NO','TARİH','DURUM','YANIT'],
      hv:['KVN-RFQ','2026','AÇIK','< 24 H'],
      f: {
        name:'Adınız', email:'E-posta', phone:'Telefon / WhatsApp', company:'Firma',
        brand:'Kırıcı markası', brandPh:'Seçin',
        qty:'Adet', message:'Mesaj / parça no.',
        messagePh:'HB20G · Ø80 × 1650 — 20 adet. Fotoğraf eklerseniz daha iyi.',
      },
      submit:'Gönder', note:'24 saat içinde yanıt · EN 10204 3.1 sertifikası dahil',
      success:'Aldık. 24 saat içinde dönüş yapacağız.',
    },
    foot: {
      h1:'Ürünler', h2:'Şirket', h3:'İletişim',
      about:'Kartepe, Kocaeli\'de 25+ yıldır kırıcı yedek parçaları ve ısıl işlem üretiyoruz. Kendi fırınımız, kendi CNC\'miz, kendi laboratuvarımız.',
      p:['Keskiler','Pistonlar','Burçlar','Cıvatalar','Ön kafalar','Tamir kitleri'],
      c:['Hakkımızda','Fırın','Galeri','Sertifikalar','İK'],
      cc:['+90 531 669 37 34','hakan@kervanheat.com','Kartepe · Kocaeli · TR'],
      certs:['EN 10204 3.1','ISO 9001','CE'],
      block:[['PROJE','KERVAN HEAT'],['DWG','KVN-LP-001'],['REV','00'],['DATE','2026'],['SCALE','1:1'],['SHEET','08/08']],
      bot:'Türkiye\'de üretildi · İçeride ısıl işlem · Dünyaya sevkiyat',
    },
  },
  en: {
    nav: { parts:'Parts', compat:'Compatibility', furnace:'Heat Shop', process:'Process', contact:'Contact', quote:'Get a Quote' },
    hero: {
      eyebrow: 'MFG · KARTEPE · SINCE 1999',
      h1a: 'Breaker parts.', h1b: 'Direct from the factory.',
      sub: 'We make chisels, pistons, bushings, bolts and repair kits for Furukawa, Rammer, Soosan, Atlas Copco and 40 more brands. 42CrMo steel, HRC 48–52, made and heat-treated in our own shop.',
      cta1:'Get a Quote', cta2:'See the Parts',
      s:[ {l:'STEEL', v:'42CrMoA'}, {l:'HARDNESS', v:'HRC 48–52'}, {l:'LEAD TIME', v:'5–10 DAYS'} ],
      drawA:'CHISEL', drawB:'HB20G · Ø80 × 1650 mm', drawC:'REV 00 · KVN-LP-001', drawD:'SCALE 1:8',
      topL:'DWG · KVN · HOMEPAGE', topR:'SHEET 01 / 08',
      botL:'LAT 40.766 N · LON 30.210 E', botR:'KARTEPE · KOCAELI · TR',
    },
    ticker: ['42CrMo STEEL', 'HRC 48–52 HARDNESS', '500 t/MO CAPACITY', '25+ YEARS MAKING', '40+ BRANDS MATCHED', '5–10 DAY LEAD', 'EN 10204 3.1 CERT', 'SHIPPED WORLDWIDE'],
    parts: {
      label:'01 / PRODUCT CLASS', h2a:'Every part. ', h2b:'One roof.',
      sub:'Everything your breaker needs. No middlemen, no delays.',
      items: [
        { ref:'CHS-42', name:'Chisels', desc:'Moil, flat, taper, pyramid. Every length — 500 t/mo in stock.', s1:'42CrMo', s2:'HRC 52–54' },
        { ref:'PST-17', name:'Pistons', desc:'CNC-turned, ground, heat-treated. Runs for hours you don\'t think about.', s1:'Forged', s2:'Tol. h6' },
        { ref:'BSH-09', name:'Bushings', desc:'Upper and lower, lapped finish. No play, no rattle.', s1:'Hardened', s2:'Lapped' },
        { ref:'BLT-23', name:'Through Bolts', desc:'Long-life assembly bolts. Won\'t shear, strip, or back off.', s1:'Class 12.9', s2:'Full thread' },
        { ref:'HED-11', name:'Front Heads', desc:'Machined from bar stock — not weld-repaired castings.', s1:'Bar', s2:'No welds' },
        { ref:'KIT-00', name:'Repair Kits', desc:'Piston + bushing + wash + seals. Tell us your model, we match.', s1:'40+ brands', s2:'Matched' },
      ],
    },
    orbit: { label:'02 / COMPATIBILITY', h2a:'Whatever brand ', h2b:'your breaker is.', sub:'We manufacture for 40+ breaker brands — OEM-equivalent fit and performance. A part number or photo is enough.', caption:'COMPATIBLE BRANDS' },
    furnace: {
      label:'03 / HEAT SHOP', h2a:'Our furnaces. ', h2b:'Our lab.',
      sub:'Hardening, tempering, carburizing, normalizing, induction. Every part gets a Rockwell reading before it leaves.',
      steps: [
        { num:'3.1', name:'Normalize', temp:'870 °C · 45 min' },
        { num:'3.2', name:'Carburize', temp:'930 °C · 8 h' },
        { num:'3.3', name:'Oil Quench', temp:'850 → 60 °C' },
        { num:'3.4', name:'Temper', temp:'180 °C · 2 h' },
        { num:'3.5', name:'Rockwell Check', temp:'HRC 48–52' },
      ],
      chartT:'HEAT-TREAT PROFILE', chartR:'T(°C) / t(h)',
    },
    process: {
      label:'04 / PRODUCTION FLOW', h2a:'Bar stock. ', h2b:'To pallet.',
      sub:'Five pairs of hands. One roof. No one outside.',
      steps: [
        { n:'01', name:'Bar Stock', desc:'Forged 42CrMoA bar. Batch chemistry tested.', tag:'MAT · 42CrMoA' },
        { n:'02', name:'CNC', desc:'4-axis lathe + mill. Tolerance h6.', tag:'CNC · ±0.01' },
        { n:'03', name:'Heat Treat', desc:'In-house furnace. Harden → temper.', tag:'HRC 48–52' },
        { n:'04', name:'Grinding', desc:'Cylindrical grind. Lapped surface.', tag:'Ra · 0.4' },
        { n:'05', name:'QC', desc:'Hardness + dim + surface. Every piece.', tag:'EN 10204 3.1' },
        { n:'06', name:'Ship', desc:'Palletized. Invoice same day.', tag:'WORLDWIDE' },
      ],
    },
    meters: {
      label:'05 / NUMBERS', h2a:'Numbers ', h2b:'speak.', sub:'Every claim backed by a measurement.',
      items: [
        { v:'25', u:'+ YEARS', l:'MAKING', fill:0.62, hint:'FOUNDED 1999' },
        { v:'40', u:'+ BRANDS', l:'MATCHED', fill:0.9, hint:'OEM-EQUIVALENT' },
        { v:'500', u:'t / MO', l:'CAPACITY', fill:0.78, hint:'STEEL PROCESSED' },
        { v:'HRC 48–52', u:'', l:'HARDNESS', fill:0.88, hint:'ROCKWELL · C' },
      ],
    },
    rfq: {
      label:'06 / WORK ORDER', h2a:'Tell us, ', h2b:'we\'ll match the kit.',
      sub:'A part number or photo is enough. We get back within 24 hours.',
      h: ['WORK ORDER #','DATE','STATUS','REPLY'],
      hv:['KVN-RFQ','2026','OPEN','< 24 H'],
      f: {
        name:'Name', email:'Email', phone:'Phone / WhatsApp', company:'Company',
        brand:'Breaker brand', brandPh:'Choose',
        qty:'Quantity', message:'Message / part no.',
        messagePh:'HB20G · Ø80 × 1650 — 20 pcs. A photo helps.',
      },
      submit:'Send It', note:'Reply within 24h · EN 10204 3.1 cert included',
      success:'Got it. We\'ll get back to you within 24 hours.',
    },
    foot: {
      h1:'Products', h2:'Company', h3:'Contact',
      about:'We\'ve been making breaker parts and heat-treating in Kartepe, Kocaeli for 25+ years. Our furnaces, our CNC, our lab.',
      p:['Chisels','Pistons','Bushings','Bolts','Front heads','Repair kits'],
      c:['About','Heat shop','Gallery','Certificates','Careers'],
      cc:['+90 531 669 37 34','hakan@kervanheat.com','Kartepe · Kocaeli · TR'],
      certs:['EN 10204 3.1','ISO 9001','CE'],
      block:[['PROJECT','KERVAN HEAT'],['DWG','KVN-LP-001'],['REV','00'],['DATE','2026'],['SCALE','1:1'],['SHEET','08/08']],
      bot:'Made in Turkey · Heat-treated in-house · Shipped worldwide',
    },
  },
  de: {
    nav: { parts:'Teile', compat:'Kompatibilität', furnace:'Härterei', process:'Prozess', contact:'Kontakt', quote:'Angebot' },
    hero: {
      eyebrow: 'FERTIGUNG · KARTEPE · SEIT 1999',
      h1a: 'Hammerteile.', h1b: 'Direkt vom Werk.',
      sub: 'Wir fertigen Meißel, Kolben, Buchsen, Bolzen und Reparatursätze für Furukawa, Rammer, Soosan, Atlas Copco und 40 weitere Marken. 42CrMo-Stahl, HRC 48–52, gefertigt und gehärtet im eigenen Werk.',
      cta1:'Angebot anfordern', cta2:'Teile ansehen',
      s:[ {l:'STAHL', v:'42CrMoA'}, {l:'HÄRTE', v:'HRC 48–52'}, {l:'LIEFERUNG', v:'5–10 TAGE'} ],
      drawA:'MEISSEL', drawB:'HB20G · Ø80 × 1650 mm', drawC:'REV 00 · KVN-LP-001', drawD:'SCALE 1:8',
      topL:'DWG · KVN · HOMEPAGE', topR:'BLATT 01 / 08',
      botL:'LAT 40.766 N · LON 30.210 E', botR:'KARTEPE · KOCAELI · TR',
    },
    ticker: ['42CrMo STAHL','HRC 48–52 HÄRTE','500 t/MONAT','25+ JAHRE','40+ MARKEN','5–10 TAGE','EN 10204 3.1','WELTWEIT'],
    parts: {
      label:'01 / PRODUKTKLASSE', h2a:'Jedes Teil. ', h2b:'Ein Dach.',
      sub:'Alles, was Ihr Hammer braucht. Kein Zwischenhändler, keine Verzögerung.',
      items: [
        { ref:'CHS-42', name:'Meißel', desc:'Spitz, flach, konisch, pyramidal. Jede Länge — 500 t/Monat.', s1:'42CrMo', s2:'HRC 52–54' },
        { ref:'PST-17', name:'Kolben', desc:'CNC-gedreht, geschliffen, gehärtet. Läuft ohne Ausfall.', s1:'Geschmiedet', s2:'Tol. h6' },
        { ref:'BSH-09', name:'Buchsen', desc:'Obere und untere, geläppt. Kein Spiel, kein Klappern.', s1:'Gehärtet', s2:'Geläppt' },
        { ref:'BLT-23', name:'Bolzen', desc:'Langzeit-Verbindungsbolzen. Brechen und lösen sich nicht.', s1:'Klasse 12.9', s2:'Vollgewinde' },
        { ref:'HED-11', name:'Vorderköpfe', desc:'Aus Stangenmaterial — keine geschweißten Gussteile.', s1:'Stange', s2:'Ohne Schw.' },
        { ref:'KIT-00', name:'Reparatursätze', desc:'Kolben + Buchse + Dichtungen. Modell nennen, wir liefern.', s1:'40+ Marken', s2:'Passend' },
      ],
    },
    orbit: { label:'02 / KOMPATIBILITÄT', h2a:'Welche Marke ', h2b:'Ihr Hammer auch ist.', sub:'Wir fertigen für 40+ Marken — OEM-gleichwertig. Teilenummer oder Foto reicht.', caption:'KOMPATIBLE MARKEN' },
    furnace: {
      label:'03 / HÄRTEREI', h2a:'Unsere Öfen. ', h2b:'Unser Labor.',
      sub:'Härten, Anlassen, Einsatzhärten, Normalisieren, Induktion. Jedes Teil wird vor dem Versand Rockwell-geprüft.',
      steps: [
        { num:'3.1', name:'Normalisieren', temp:'870 °C · 45 min' },
        { num:'3.2', name:'Einsatzhärten', temp:'930 °C · 8 h' },
        { num:'3.3', name:'Ölabschrecken', temp:'850 → 60 °C' },
        { num:'3.4', name:'Anlassen', temp:'180 °C · 2 h' },
        { num:'3.5', name:'Rockwell-Test', temp:'HRC 48–52' },
      ],
      chartT:'WÄRMEBEHANDLUNG', chartR:'T(°C) / t(h)',
    },
    process: {
      label:'04 / FERTIGUNG', h2a:'Vom Rohmaterial. ', h2b:'Zur Palette.',
      sub:'Fünf Händepaare. Ein Dach. Niemand außerhalb.',
      steps: [
        { n:'01', name:'Rohmaterial', desc:'Geschmiedeter 42CrMoA-Stab. Chargentest.', tag:'MAT · 42CrMoA' },
        { n:'02', name:'CNC', desc:'4-Achs-Drehen + Fräsen. Toleranz h6.', tag:'CNC · ±0.01' },
        { n:'03', name:'Wärmebeh.', desc:'Eigener Ofen. Härten → Anlassen.', tag:'HRC 48–52' },
        { n:'04', name:'Schleifen', desc:'Rundschleifen. Geläppte Oberfläche.', tag:'Ra · 0.4' },
        { n:'05', name:'QS', desc:'Härte + Maß + Oberfläche. Jedes Stück.', tag:'EN 10204 3.1' },
        { n:'06', name:'Versand', desc:'Palettiert. Rechnung am selben Tag.', tag:'WELTWEIT' },
      ],
    },
    meters: {
      label:'05 / ZAHLEN', h2a:'Zahlen ', h2b:'sprechen.', sub:'Jede Behauptung belegt durch eine Messung.',
      items: [
        { v:'25', u:'+ JAHRE', l:'FERTIGUNG', fill:0.62, hint:'GEGRÜNDET 1999' },
        { v:'40', u:'+ MARKEN', l:'PASSEND', fill:0.9, hint:'OEM-GLEICH' },
        { v:'500', u:'t / MO', l:'KAPAZITÄT', fill:0.78, hint:'STAHL' },
        { v:'HRC 48–52', u:'', l:'HÄRTE', fill:0.88, hint:'ROCKWELL · C' },
      ],
    },
    rfq: {
      label:'06 / AUFTRAG', h2a:'Sagen Sie es, ', h2b:'wir liefern das Kit.',
      sub:'Teilenummer oder Foto reicht. Antwort innerhalb 24 Stunden.',
      h: ['AUFTRAG #','DATUM','STATUS','ANTWORT'],
      hv:['KVN-RFQ','2026','OFFEN','< 24 H'],
      f: {
        name:'Name', email:'E-Mail', phone:'Telefon / WhatsApp', company:'Firma',
        brand:'Marke', brandPh:'Wählen',
        qty:'Menge', message:'Nachricht / Teil-Nr.',
        messagePh:'HB20G · Ø80 × 1650 — 20 Stück. Foto hilft.',
      },
      submit:'Senden', note:'Antwort < 24 h · EN 10204 3.1 inklusive',
      success:'Erhalten. Antwort innerhalb 24 Stunden.',
    },
    foot: {
      h1:'Produkte', h2:'Firma', h3:'Kontakt',
      about:'Seit 25+ Jahren fertigen wir in Kartepe, Kocaeli Hammerteile und härten im Haus.',
      p:['Meißel','Kolben','Buchsen','Bolzen','Vorderköpfe','Reparatursätze'],
      c:['Über uns','Härterei','Galerie','Zertifikate','Karriere'],
      cc:['+90 531 669 37 34','hakan@kervanheat.com','Kartepe · Kocaeli · TR'],
      certs:['EN 10204 3.1','ISO 9001','CE'],
      block:[['PROJEKT','KERVAN HEAT'],['DWG','KVN-LP-001'],['REV','00'],['DATUM','2026'],['SCALE','1:1'],['BLATT','08/08']],
      bot:'Hergestellt in der Türkei · Im Haus gehärtet · Weltweit versandt',
    },
  },
  ru: {
    nav: { parts:'Запчасти', compat:'Совместимость', furnace:'Печь', process:'Процесс', contact:'Контакт', quote:'Запросить' },
    hero: {
      eyebrow: 'ПРОИЗВОДСТВО · KARTEPE · С 1999',
      h1a: 'Запчасти для молотов.', h1b: 'Напрямую с завода.',
      sub: 'Мы производим пики, поршни, втулки, болты и ремкомплекты для Furukawa, Rammer, Soosan, Atlas Copco и 40+ марок. Сталь 42CrMo, HRC 48–52, термообработка в собственном цеху.',
      cta1:'Запросить', cta2:'Посмотреть',
      s:[ {l:'СТАЛЬ', v:'42CrMoA'}, {l:'ТВЁРД.', v:'HRC 48–52'}, {l:'СРОК', v:'5–10 ДНЕЙ'} ],
      drawA:'ПИКА', drawB:'HB20G · Ø80 × 1650 mm', drawC:'REV 00 · KVN-LP-001', drawD:'SCALE 1:8',
      topL:'DWG · KVN · HOMEPAGE', topR:'ЛИСТ 01 / 08',
      botL:'LAT 40.766 N · LON 30.210 E', botR:'KARTEPE · KOCAELI · TR',
    },
    ticker: ['42CrMo СТАЛЬ','HRC 48–52','500 т/МЕС','25+ ЛЕТ','40+ МАРОК','5–10 ДНЕЙ','EN 10204 3.1','ПО ВСЕМУ МИРУ'],
    parts: {
      label:'01 / ГРУППА', h2a:'Любая деталь. ', h2b:'Одна крыша.',
      sub:'Всё, что нужно вашему молоту. Без посредников.',
      items: [
        { ref:'CHS-42', name:'Пики', desc:'Острые, плоские, конусные. Любая длина — 500 т/мес.', s1:'42CrMo', s2:'HRC 52–54' },
        { ref:'PST-17', name:'Поршни', desc:'Точёные, шлифованные, закалённые.', s1:'Кованый', s2:'Доп. h6' },
        { ref:'BSH-09', name:'Втулки', desc:'Верх/низ, с притиркой. Без люфта.', s1:'Закал.', s2:'Притёрт.' },
        { ref:'BLT-23', name:'Болты', desc:'Стяжные болты длительного ресурса.', s1:'Кл. 12.9', s2:'Полн. резьба' },
        { ref:'HED-11', name:'Головки', desc:'Из прутка — не литьё со сваркой.', s1:'Пруток', s2:'Без сварки' },
        { ref:'KIT-00', name:'Ремкомплекты', desc:'Поршень + втулка + уплотнения.', s1:'40+ марок', s2:'Подбор' },
      ],
    },
    orbit: { label:'02 / СОВМЕСТИМОСТЬ', h2a:'Какая бы марка ', h2b:'ни была у вашего молота.', sub:'Производим для 40+ марок — эквивалент OEM. Хватит номера или фото.', caption:'МАРОК СОВМЕСТИМО' },
    furnace: {
      label:'03 / ТЕРМООБРАБОТКА', h2a:'Свои печи. ', h2b:'Своя лаборатория.',
      sub:'Закалка, отпуск, цементация, нормализация, индукция. Каждая деталь проходит Rockwell.',
      steps: [
        { num:'3.1', name:'Нормализация', temp:'870 °C · 45 мин' },
        { num:'3.2', name:'Цементация', temp:'930 °C · 8 ч' },
        { num:'3.3', name:'Закалка в масле', temp:'850 → 60 °C' },
        { num:'3.4', name:'Отпуск', temp:'180 °C · 2 ч' },
        { num:'3.5', name:'Rockwell', temp:'HRC 48–52' },
      ],
      chartT:'ПРОФИЛЬ ТЕРМООБР.', chartR:'T(°C) / t(ч)',
    },
    process: {
      label:'04 / ПРОИЗВОДСТВО', h2a:'От прутка. ', h2b:'До паллеты.',
      sub:'Пять пар рук. Одна крыша.',
      steps: [
        { n:'01', name:'Пруток', desc:'Кованый 42CrMoA. Контроль партии.', tag:'MAT · 42CrMoA' },
        { n:'02', name:'ЧПУ', desc:'Токар. + фрез., 4-оси. Доп. h6.', tag:'CNC · ±0.01' },
        { n:'03', name:'Термо', desc:'Своя печь. Закалка → отпуск.', tag:'HRC 48–52' },
        { n:'04', name:'Шлифовка', desc:'Кругл. шлиф. Притирка.', tag:'Ra · 0.4' },
        { n:'05', name:'ОТК', desc:'Твёрд. + размеры. Каждая.', tag:'EN 10204 3.1' },
        { n:'06', name:'Отгрузка', desc:'На паллетах. Инвойс в день.', tag:'ПО МИРУ' },
      ],
    },
    meters: {
      label:'05 / ЦИФРЫ', h2a:'Цифры ', h2b:'говорят.', sub:'Каждое заявление — измерением.',
      items: [
        { v:'25', u:'+ ЛЕТ', l:'ОПЫТ', fill:0.62, hint:'С 1999' },
        { v:'40', u:'+ МАРОК', l:'ПОДБОР', fill:0.9, hint:'OEM-ЭКВ.' },
        { v:'500', u:'т / МЕС', l:'ОБЪЁМ', fill:0.78, hint:'СТАЛЬ' },
        { v:'HRC 48–52', u:'', l:'ТВЁРДОСТЬ', fill:0.88, hint:'ROCKWELL · C' },
      ],
    },
    rfq: {
      label:'06 / ЗАКАЗ', h2a:'Скажите — ', h2b:'мы подберём.',
      sub:'Достаточно номера или фото. Ответ в течение 24 часов.',
      h: ['ЗАКАЗ #','ДАТА','СТАТУС','ОТВЕТ'],
      hv:['KVN-RFQ','2026','ОТКРЫТ','< 24 Ч'],
      f: {
        name:'Имя', email:'Email', phone:'Телефон / WhatsApp', company:'Компания',
        brand:'Марка', brandPh:'Выберите',
        qty:'Кол-во', message:'Сообщение / номер',
        messagePh:'HB20G · Ø80 × 1650 — 20 шт. Фото приветствуется.',
      },
      submit:'Отправить', note:'Ответ < 24 ч · EN 10204 3.1 в комплекте',
      success:'Получили. Ответим в течение 24 часов.',
    },
    foot: {
      h1:'Продукция', h2:'Компания', h3:'Контакт',
      about:'25+ лет мы производим запчасти для молотов и ведём термообработку в Kartepe.',
      p:['Пики','Поршни','Втулки','Болты','Головки','Ремкомплекты'],
      c:['О нас','Печь','Галерея','Сертификаты','Вакансии'],
      cc:['+90 531 669 37 34','hakan@kervanheat.com','Kartepe · Kocaeli · TR'],
      certs:['EN 10204 3.1','ISO 9001','CE'],
      block:[['ПРОЕКТ','KERVAN HEAT'],['DWG','KVN-LP-001'],['REV','00'],['ДАТА','2026'],['МАСШТ','1:1'],['ЛИСТ','08/08']],
      bot:'Сделано в Турции · Термообработка в цеху · Доставка по миру',
    },
  },
};

window.DICT = DICT;

// ═══════════════════════════════════════════════════════════════════════════
// Language detection + switcher
// ═══════════════════════════════════════════════════════════════════════════
function detectLang() {
  try {
    const qs = new URLSearchParams(window.location.search);
    const qp = qs.get('lang');
    if (DICT[qp]) return qp;
    const ls = localStorage.getItem('kv_lang_v2');
    if (DICT[ls]) return ls;
    const nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('tr')) return 'tr';
    if (nav.startsWith('de')) return 'de';
    if (nav.startsWith('ru')) return 'ru';
  } catch {}
  return 'en';
}

const COUNTRY_LANG = { TR:'tr', DE:'de', AT:'de', CH:'de', RU:'ru', BY:'ru', KZ:'ru', UA:'ru', UZ:'ru' };

window.useLang = function useLang() {
  const [lang, setLang] = useState(detectLang);
  useEffect(() => {
    try { localStorage.setItem('kv_lang_v2', lang); } catch {}
    document.documentElement.lang = lang;
  }, [lang]);
  // Geo-IP only if user hasn't locked
  useEffect(() => {
    try { if (localStorage.getItem('kv_lang_v2_locked')) return; } catch {}
    const c = new AbortController();
    fetch('https://ipapi.co/json/', { signal: c.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && COUNTRY_LANG[d.country_code]) setLang(COUNTRY_LANG[d.country_code]); })
      .catch(()=>{});
    return () => c.abort();
  }, []);
  const lockedSet = (l) => {
    try { localStorage.setItem('kv_lang_v2_locked', '1'); } catch {}
    setLang(l);
  };
  return [lang, lockedSet];
};


/* global React */
const { useState, useEffect, useRef } = React;

// ─── Typewriter ──────────────────────────────────────────────
function useTypewriter(text, speed = 50, startDelay = 300) {
  const [out, setOut] = useState('');
  useEffect(() => {
    setOut('');
    let i = 0;
    const start = setTimeout(() => {
      const t = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) clearInterval(t);
      }, speed);
    }, startDelay);
    return () => clearTimeout(start);
  }, [text, speed, startDelay]);
  return out;
}

// ─── Hero drawing: chisel with live dimensions ──────────────
function HeroDrawing({ t }) {
  const [angle, setAngle] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const id = setInterval(() => setAngle(a => a + 0.6), 60);
    return () => clearInterval(id);
  }, []);
  // gentle hover-follow
  const [off, setOff] = useState({ x: 0, y: 0 });
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) / r.width;
    const y = (e.clientY - r.top - r.height / 2) / r.height;
    setOff({ x: x * 8, y: y * 8 });
  };
  return (
    <div className="hero__drawing" ref={ref} onMouseMove={onMove} onMouseLeave={() => setOff({x:0,y:0})}>
      <div className="hero__drawing__title">
        <span><b>●</b> {t.drawA} · {t.drawB}</span>
        <span>{t.drawD}</span>
      </div>
      <div className="hero__drawing__svg" style={{ transform: `translate(${off.x}px, ${off.y}px)`, transition:'transform .25s ease-out' }}>
        <svg viewBox="0 0 400 400" fill="none" stroke="currentColor">
          <defs>
            <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(232,120,26,0.28)" strokeWidth="1"/>
            </pattern>
            <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2A2F3A"/>
              <stop offset="0.5" stopColor="#3B424F"/>
              <stop offset="1" stopColor="#1A1E26"/>
            </linearGradient>
          </defs>

          {/* CHISEL */}
          <g transform="translate(200,200)">
            <g transform={`rotate(${Math.sin(angle*0.02)*2})`}>
              {/* shank body */}
              <rect x="-22" y="-130" width="44" height="200" fill="url(#steel)" stroke="#6B7280" strokeWidth="1"/>
              {/* flutes */}
              <rect x="-22" y="-40" width="44" height="4" fill="rgba(0,0,0,0.45)"/>
              <rect x="-22" y="-20" width="44" height="4" fill="rgba(0,0,0,0.45)"/>
              <rect x="-22" y="0" width="44" height="4" fill="rgba(0,0,0,0.45)"/>
              {/* tapered tip */}
              <polygon points="-22,70 22,70 14,140 -14,140" fill="url(#steel)" stroke="#6B7280" strokeWidth="1"/>
              <polygon points="-14,140 14,140 0,160" fill="url(#steel)" stroke="#E8781A" strokeWidth="1"/>
              {/* tip heat */}
              <polygon points="-14,140 14,140 0,160" fill="url(#hatch)"/>
              {/* highlight */}
              <rect x="-18" y="-128" width="4" height="196" fill="rgba(255,255,255,0.08)"/>
            </g>
          </g>

          {/* DIMENSIONS — top width Ø80 */}
          <g stroke="#E8781A" strokeWidth="1">
            <line x1="178" y1="40" x2="178" y2="68" />
            <line x1="222" y1="40" x2="222" y2="68" />
            <line x1="178" y1="50" x2="222" y2="50" />
            <polygon points="178,50 184,47 184,53" fill="#E8781A"/>
            <polygon points="222,50 216,47 216,53" fill="#E8781A"/>
          </g>
          <text x="200" y="38" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#E8781A" letterSpacing="1">Ø 80</text>

          {/* Length 1650 — left */}
          <g stroke="#E8781A" strokeWidth="1">
            <line x1="60" y1="70" x2="88" y2="70" />
            <line x1="60" y1="360" x2="88" y2="360" />
            <line x1="74" y1="70" x2="74" y2="360" />
            <polygon points="74,70 71,76 77,76" fill="#E8781A"/>
            <polygon points="74,360 71,354 77,354" fill="#E8781A"/>
          </g>
          <text x="54" y="215" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#E8781A" letterSpacing="1" transform="rotate(-90, 54, 215)">1650 mm</text>

          {/* Tip detail bubble */}
          <circle cx="200" cy="360" r="34" fill="none" stroke="#E8781A" strokeDasharray="3 3" strokeWidth="1"/>
          <line x1="214" y1="350" x2="320" y2="310" stroke="#E8781A" strokeWidth="1"/>
          <text x="324" y="308" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#E8781A" letterSpacing="1">DETAIL A</text>
          <text x="324" y="322" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#A8ADB8" letterSpacing="1">HRC 52–54</text>

          {/* Center line */}
          <line x1="200" y1="20" x2="200" y2="390" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="8 4 2 4"/>

          {/* Rulers */}
          <g stroke="rgba(255,255,255,0.2)" strokeWidth="0.5">
            {[...Array(18)].map((_, i) => (
              <line key={i} x1={20 + i*20} y1="388" x2={20 + i*20} y2={i % 5 === 0 ? 380 : 384}/>
            ))}
          </g>
        </svg>
      </div>
      <div className="hero__drawing__bot">
        <span>{t.drawC}</span>
        <span>42CrMoA · FORGED · HEAT-TREATED</span>
      </div>
    </div>
  );
}

// ─── Part spec-sheet card ─────────────────────────────────────
function PartDrawing({ kind }) {
  if (kind === 'CHS-42') return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor">
      <rect x="86" y="20" width="28" height="120" strokeWidth="1.5"/>
      <rect x="86" y="55" width="28" height="3" fill="currentColor"/>
      <rect x="86" y="75" width="28" height="3" fill="currentColor"/>
      <rect x="86" y="95" width="28" height="3" fill="currentColor"/>
      <polygon points="86,140 114,140 106,175 94,175" strokeWidth="1.5"/>
      <polygon points="94,175 106,175 100,190" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3"/>
      <line x1="70" y1="20" x2="75" y2="20" strokeDasharray="2 2"/>
      <line x1="70" y1="190" x2="75" y2="190" strokeDasharray="2 2"/>
    </svg>
  );
  if (kind === 'PST-17') return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor">
      <rect x="40" y="80" width="120" height="40" strokeWidth="1.5"/>
      <rect x="40" y="85" width="120" height="3" fill="currentColor"/>
      <rect x="40" y="92" width="120" height="3" fill="currentColor"/>
      <rect x="40" y="112" width="120" height="3" fill="currentColor"/>
      <rect x="30" y="75" width="10" height="50" strokeWidth="1.5"/>
      <rect x="160" y="75" width="10" height="50" strokeWidth="1.5"/>
      <line x1="30" y1="100" x2="170" y2="100" strokeDasharray="4 3"/>
    </svg>
  );
  if (kind === 'BSH-09') return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor">
      <circle cx="100" cy="100" r="60" strokeWidth="1.5"/>
      <circle cx="100" cy="100" r="35" strokeWidth="1.5"/>
      <circle cx="100" cy="100" r="1.5" fill="currentColor"/>
      <line x1="100" y1="30" x2="100" y2="40" strokeDasharray="2 2"/>
      <line x1="100" y1="160" x2="100" y2="170" strokeDasharray="2 2"/>
      <line x1="30" y1="100" x2="40" y2="100" strokeDasharray="2 2"/>
      <line x1="160" y1="100" x2="170" y2="100" strokeDasharray="2 2"/>
    </svg>
  );
  if (kind === 'BLT-23') return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor">
      <polygon points="70,60 130,60 140,80 130,100 70,100 60,80" strokeWidth="1.5"/>
      <rect x="88" y="100" width="24" height="80" strokeWidth="1.5"/>
      {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
        <line key={i} x1="88" y1={108 + i*7} x2="112" y2={108 + i*7} strokeWidth="1"/>
      ))}
    </svg>
  );
  if (kind === 'HED-11') return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor">
      <path d="M 50 70 L 150 70 L 160 100 L 150 130 L 50 130 L 40 100 Z" strokeWidth="1.5"/>
      <circle cx="100" cy="100" r="16" strokeWidth="1.5"/>
      <circle cx="70" cy="100" r="4" strokeWidth="1"/>
      <circle cx="130" cy="100" r="4" strokeWidth="1"/>
      <line x1="40" y1="100" x2="45" y2="100" strokeDasharray="2 2"/>
      <line x1="155" y1="100" x2="160" y2="100" strokeDasharray="2 2"/>
    </svg>
  );
  // KIT-00
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor">
      <rect x="20" y="20" width="70" height="70" strokeWidth="1.5"/>
      <rect x="110" y="20" width="70" height="70" strokeWidth="1.5"/>
      <rect x="20" y="110" width="70" height="70" strokeWidth="1.5"/>
      <rect x="110" y="110" width="70" height="70" strokeWidth="1.5"/>
      <circle cx="55" cy="55" r="18" strokeWidth="1"/>
      <rect x="130" y="40" width="30" height="30" strokeWidth="1"/>
      <path d="M 40 130 L 70 170 L 80 145 Z" strokeWidth="1"/>
      <line x1="130" y1="120" x2="160" y2="120" strokeWidth="1"/>
      <line x1="130" y1="135" x2="160" y2="135" strokeWidth="1"/>
      <line x1="130" y1="150" x2="160" y2="150" strokeWidth="1"/>
      <line x1="130" y1="165" x2="160" y2="165" strokeWidth="1"/>
    </svg>
  );
}

// ─── Process icons ───────────────────────────────────────────
function ProcessIcon({ n }) {
  const common = { width:48, height:48, fill:"none", stroke:"currentColor", strokeWidth:1.5 };
  if (n === '01') return <svg viewBox="0 0 48 48" {...common}><rect x="8" y="20" width="32" height="8"/><line x1="12" y1="20" x2="12" y2="28"/><line x1="20" y1="20" x2="20" y2="28"/><line x1="28" y1="20" x2="28" y2="28"/><line x1="36" y1="20" x2="36" y2="28"/></svg>;
  if (n === '02') return <svg viewBox="0 0 48 48" {...common}><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="3" fill="currentColor"/><line x1="24" y1="8" x2="24" y2="14"/><line x1="24" y1="34" x2="24" y2="40"/><line x1="8" y1="24" x2="14" y2="24"/><line x1="34" y1="24" x2="40" y2="24"/></svg>;
  if (n === '03') return <svg viewBox="0 0 48 48" {...common}><path d="M 12 34 Q 12 22 18 22 Q 22 22 22 28 Q 22 14 28 14 Q 36 14 36 34 Z"/><line x1="10" y1="38" x2="38" y2="38"/></svg>;
  if (n === '04') return <svg viewBox="0 0 48 48" {...common}><circle cx="24" cy="24" r="14"/><line x1="24" y1="10" x2="24" y2="38"/><line x1="10" y1="24" x2="38" y2="24"/><line x1="14" y1="14" x2="34" y2="34"/><line x1="34" y1="14" x2="14" y2="34"/></svg>;
  if (n === '05') return <svg viewBox="0 0 48 48" {...common}><rect x="10" y="10" width="28" height="28"/><polyline points="16,24 22,30 34,18"/></svg>;
  if (n === '06') return <svg viewBox="0 0 48 48" {...common}><rect x="6" y="18" width="22" height="16"/><polygon points="28,22 38,22 42,28 42,34 28,34"/><circle cx="16" cy="36" r="3"/><circle cx="34" cy="36" r="3"/></svg>;
  return null;
}

// ─── Nav with lang switcher ──────────────────────────────────
function Nav({ lang, setLang, t }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', on);
    on();
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    const close = (e) => { if (!e.target.closest('.lang-menu')) setOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  const langs = [
    { code:'tr', label:'TÜRKÇE', flag:'🇹🇷' },
    { code:'en', label:'ENGLISH', flag:'🇬🇧' },
    { code:'de', label:'DEUTSCH', flag:'🇩🇪' },
    { code:'ru', label:'РУССКИЙ', flag:'🇷🇺' },
  ];
  const cur = langs.find(l => l.code === lang) || langs[1];
  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="wrap">
        <a className="logo" href="#">
          <span className="logo__mark">K</span>
          <span className="logo__word">KERVAN <b>HEAT</b></span>
          <span className="logo__sup">EST·1999</span>
        </a>
        <div className="nav__links">
          <a className="nav__link" href="#parts"><span className="num">01 /</span>{t.nav.parts}</a>
          <a className="nav__link" href="#compat"><span className="num">02 /</span>{t.nav.compat}</a>
          <a className="nav__link" href="#furnace"><span className="num">03 /</span>{t.nav.furnace}</a>
          <a className="nav__link" href="#process"><span className="num">04 /</span>{t.nav.process}</a>
          <a className="nav__link" href="#contact"><span className="num">06 /</span>{t.nav.contact}</a>
        </div>
        <div className="nav__actions">
          <div className={`lang-menu ${open?'open':''}`} onClick={(e)=>{e.stopPropagation(); setOpen(!open);}}>
            <span className="lang-menu__dot"/>
            <span>{cur.code.toUpperCase()}</span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5"/></svg>
            <div className="lang-menu__dropdown">
              {langs.map(l => (
                <div key={l.code} className={`lang-menu__item ${l.code===lang?'active':''}`} onClick={()=>{setLang(l.code); setOpen(false);}}>
                  <span>{l.label}</span>
                  <span className="flag">{l.flag}</span>
                </div>
              ))}
            </div>
          </div>
          <a className="btn-quote" href="#contact">{t.nav.quote} <span>→</span></a>
        </div>
      </div>
    </nav>
  );
}

// ─── HERO ────────────────────────────────────────────────────
function Hero({ t }) {
  const typed = useTypewriter(t.hero.h1a, 60, 200);
  return (
    <section className="hero">
      <div className="hero__grid-bg"/>
      <div className="hero__glow"/>
      <div className="hero__top">
        <span>{t.hero.topL}</span>
        <span>{t.hero.topR}</span>
      </div>
      <div className="hero__main">
        <div className="hero__copy">
          <span className="hero__eyebrow">{t.hero.eyebrow}</span>
          <h1>
            {typed}{typed.length < t.hero.h1a.length && <span className="cursor"/>}
            {typed.length >= t.hero.h1a.length && <><br/><em>{t.hero.h1b}</em></>}
          </h1>
          <p className="hero__sub">{t.hero.sub}</p>
          <div className="hero__ctas">
            <a className="btn-primary" href="#contact">{t.hero.cta1} <span>→</span></a>
            <a className="btn-ghost" href="#parts">{t.hero.cta2}</a>
          </div>
          <div className="hero__specs">
            {t.hero.s.map((s, i) => (
              <div key={i} className="hero__spec">
                <span className="hero__spec__label">{s.l}</span>
                <span className="hero__spec__value">{s.v}</span>
              </div>
            ))}
          </div>
        </div>
        <HeroDrawing t={t.hero}/>
      </div>
      <div className="hero__bot">
        <span>{t.hero.botL}</span>
        <span>{t.hero.botR}</span>
      </div>
    </section>
  );
}

// ─── TICKER ──────────────────────────────────────────────────
function Ticker({ t }) {
  const items = [...t.ticker, ...t.ticker];
  return (
    <div className="ticker">
      <div className="ticker__track">
        {items.map((it, i) => (
          <span key={i} className="ticker__item">
            <span className="ticker__sep"/>
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── PARTS ───────────────────────────────────────────────────
function Parts({ t }) {
  return (
    <section id="parts" className="section" data-screen-label="Parts">
      <span className="section__label"><b>{t.parts.label}</b></span>
      <div className="section__ruler"/>
      <div className="wrap">
        <div className="section__head">
          <h2>{t.parts.h2a}<em>{t.parts.h2b}</em></h2>
          <p>{t.parts.sub}</p>
        </div>
        <div className="parts">
          {t.parts.items.map((p) => (
            <div key={p.ref} className="part">
              <div className="part__head">
                <span><b>REF</b>{p.ref}</span>
                <span>DWG 0{p.ref.slice(-2)}</span>
              </div>
              <div className="part__draw"><PartDrawing kind={p.ref}/></div>
              <span className="part__arrow">→</span>
              <div className="part__foot">
                <span className="part__name">{p.name}</span>
                <p className="part__desc">{p.desc}</p>
                <div className="part__specs">
                  <span><b>●</b>{p.s1}</span>
                  <span><b>●</b>{p.s2}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── COMPATIBILITY orbit ─────────────────────────────────────
const BRANDS = [
  'FURUKAWA','RAMMER','SOOSAN','ATLAS COPCO','MONTABERT','INDECO','NPK','KRUPP',
  'HANWOO','BOBCAT','CAT','DAEMO','OKADA','TOKU','GIANT','KOMATSU',
  'DOOSAN','JCB','TEREX','EVERDIGM','ALLIED','GENERAL','KINSHOFER','EPIROC',
];

function OrbitSection({ t }) {
  return (
    <section id="compat" className="section" data-screen-label="Compatibility">
      <span className="section__label"><b>{t.orbit.label}</b></span>
      <div className="section__ruler"/>
      <div className="wrap">
        <div className="section__head">
          <h2>{t.orbit.h2a}<em>{t.orbit.h2b}</em></h2>
          <p>{t.orbit.sub}</p>
        </div>
        <div className="orbit">
          <div className="orbit__ring"/>
          <div className="orbit__ring orbit__ring--2"/>
          <div className="orbit__ring orbit__ring--3"/>
          <div className="orbit__rotator">
            {BRANDS.map((b, i) => {
              const angle = (i / BRANDS.length) * Math.PI * 2;
              const ring = i % 3; // 3 rings
              const radii = ['48%','38%','28%'];
              const r = radii[ring];
              const x = `calc(50% + ${Math.cos(angle) * 100}% * 0.48 / 1)`;
              const cx = 50 + Math.cos(angle) * (ring === 0 ? 48 : ring === 1 ? 38 : 28);
              const cy = 50 + Math.sin(angle) * (ring === 0 ? 48 : ring === 1 ? 38 : 28);
              return (
                <span key={b} className="orbit__brand"
                  style={{
                    left: `${cx}%`,
                    top: `${cy}%`,
                    transform: `translate(-50%, -50%) rotate(${(i / BRANDS.length) * 360}deg)`,
                    // counter-rotate text so it stays level relative to orbit spin
                  }}>
                  {b}
                </span>
              );
            })}
          </div>
          <div className="orbit__center">
            <div className="orbit__k">K</div>
            <div className="orbit__number">40+</div>
            <div className="orbit__caption">{t.orbit.caption}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FURNACE ─────────────────────────────────────────────────
function Furnace({ t }) {
  // heat curve path (SVG path in 0..100 coords)
  return (
    <section id="furnace" className="section" data-screen-label="Furnace">
      <span className="section__label"><b>{t.furnace.label}</b></span>
      <div className="section__ruler"/>
      <div className="wrap">
        <div className="section__head">
          <h2>{t.furnace.h2a}<em>{t.furnace.h2b}</em></h2>
          <p>{t.furnace.sub}</p>
        </div>
        <div className="furnace">
          <div className="furnace__left">
            <div className="furnace__list">
              {t.furnace.steps.map((s, i) => (
                <div key={i} className="furnace__row">
                  <span className="furnace__row__num">{s.num}</span>
                  <span className="furnace__row__name">{s.name}</span>
                  <span className="furnace__row__temp"><b>{s.temp}</b></span>
                </div>
              ))}
            </div>
          </div>
          <div className="furnace__chart">
            <div className="furnace__chart__title">
              <span><b>●</b> {t.furnace.chartT}</span>
              <span>{t.furnace.chartR}</span>
            </div>
            <svg className="furnace__chart__svg" viewBox="0 0 400 260" preserveAspectRatio="none">
              <defs>
                <linearGradient id="heatfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#E8781A" stopOpacity="0.4"/>
                  <stop offset="1" stopColor="#E8781A" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* grid */}
              {[0,1,2,3,4].map(i => (
                <line key={'h'+i} x1="0" y1={i*65} x2="400" y2={i*65} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              ))}
              {[0,1,2,3,4,5,6].map(i => (
                <line key={'v'+i} x1={i*66} y1="0" x2={i*66} y2="260" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              ))}
              {/* curve: rise → hold high → quench drop → temper rise → final */}
              <path
                d="M 0 240 L 40 60 L 110 40 L 170 35 L 210 230 L 260 180 L 330 170 L 400 140"
                fill="none" stroke="#E8781A" strokeWidth="2"
              />
              <path
                d="M 0 240 L 40 60 L 110 40 L 170 35 L 210 230 L 260 180 L 330 170 L 400 140 L 400 260 L 0 260 Z"
                fill="url(#heatfill)" stroke="none"
              />
              {/* phase markers */}
              {[{x:75,l:'3.1'},{x:140,l:'3.2'},{x:200,l:'3.3'},{x:290,l:'3.4'},{x:380,l:'3.5'}].map((m, i) => (
                <g key={i}>
                  <line x1={m.x} y1="0" x2={m.x} y2="260" stroke="rgba(232,120,26,0.25)" strokeDasharray="3 3" strokeWidth="1"/>
                  <circle cx={m.x} cy={[60,40,230,180,140][i]} r="4" fill="#08090B" stroke="#E8781A" strokeWidth="2"/>
                  <text x={m.x} y="18" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#E8781A" textAnchor="middle" letterSpacing="1">{m.l}</text>
                </g>
              ))}
            </svg>
            <div className="furnace__chart__y">
              <span>1000°</span>
              <span>750°</span>
              <span>500°</span>
              <span>250°</span>
              <span>0°</span>
            </div>
            <div className="furnace__chart__x">
              <span>0 h</span>
              <span>3 h</span>
              <span>6 h</span>
              <span>9 h</span>
              <span>12 h</span>
              <span>15 h</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── PROCESS ─────────────────────────────────────────────────
function Process({ t }) {
  return (
    <section id="process" className="section" data-screen-label="Process">
      <span className="section__label"><b>{t.process.label}</b></span>
      <div className="section__ruler"/>
      <div className="wrap">
        <div className="section__head">
          <h2>{t.process.h2a}<em>{t.process.h2b}</em></h2>
          <p>{t.process.sub}</p>
        </div>
        <div className="process-track">
          {t.process.steps.map((s) => (
            <div key={s.n} className="process-step">
              <span className="process-step__num">{s.n} —</span>
              <span className="process-step__icon"><ProcessIcon n={s.n}/></span>
              <span className="process-step__name">{s.name}</span>
              <p className="process-step__desc">{s.desc}</p>
              <span className="process-step__tag"><b>●</b> {s.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── METERS ──────────────────────────────────────────────────
function Meters({ t }) {
  return (
    <section className="section" data-screen-label="Numbers">
      <span className="section__label"><b>{t.meters.label}</b></span>
      <div className="section__ruler"/>
      <div className="wrap">
        <div className="section__head">
          <h2>{t.meters.h2a}<em>{t.meters.h2b}</em></h2>
          <p>{t.meters.sub}</p>
        </div>
        <div className="meters">
          {t.meters.items.map((m, i) => (
            <div key={i} className="meter">
              <span className="meter__label">{m.l}</span>
              <span className="meter__value">
                <span>{m.v}</span>
                {m.u && <span className="unit">{m.u}</span>}
              </span>
              <div className="meter__bar" style={{ '--fill': m.fill }}/>
              <span className="meter__hint">{m.hint}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── RFQ ─────────────────────────────────────────────────────
function RFQ({ t }) {
  const [sent, setSent] = useState(false);
  const date = new Date().toISOString().slice(0, 10);
  const onSubmit = (e) => { e.preventDefault(); setSent(true); };
  const hv = [...t.rfq.hv];
  hv[1] = date;
  return (
    <section id="contact" className="section" data-screen-label="RFQ">
      <span className="section__label"><b>{t.rfq.label}</b></span>
      <div className="section__ruler"/>
      <div className="wrap">
        <div className="section__head">
          <h2>{t.rfq.h2a}<em>{t.rfq.h2b}</em></h2>
          <p>{t.rfq.sub}</p>
        </div>
        <div className="rfq">
          <div className="rfq__header">
            {t.rfq.h.map((h, i) => (
              <div key={i} className="rfq__header__cell">
                <b>{h}</b>
                <span className={i === 2 ? 'orange' : ''}>{hv[i]}</span>
              </div>
            ))}
          </div>
          <form className="rfq__grid" onSubmit={onSubmit}>
            <div className="rfq__field">
              <label className="rfq__label"><span>{t.rfq.f.name}</span><b>REQ</b></label>
              <input required className="rfq__input" type="text"/>
            </div>
            <div className="rfq__field">
              <label className="rfq__label"><span>{t.rfq.f.email}</span><b>REQ</b></label>
              <input required className="rfq__input" type="email"/>
            </div>
            <div className="rfq__field">
              <label className="rfq__label"><span>{t.rfq.f.phone}</span></label>
              <input className="rfq__input" type="tel" placeholder="+90"/>
            </div>
            <div className="rfq__field">
              <label className="rfq__label"><span>{t.rfq.f.company}</span></label>
              <input className="rfq__input" type="text"/>
            </div>
            <div className="rfq__field">
              <label className="rfq__label"><span>{t.rfq.f.brand}</span></label>
              <select className="rfq__select" defaultValue="">
                <option value="" disabled>— {t.rfq.f.brandPh} —</option>
                {BRANDS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="rfq__field">
              <label className="rfq__label"><span>{t.rfq.f.qty}</span></label>
              <input className="rfq__input" type="text" placeholder="20"/>
            </div>
            <div className="rfq__field rfq__field--full">
              <label className="rfq__label"><span>{t.rfq.f.message}</span><b>REQ</b></label>
              <textarea required className="rfq__textarea" placeholder={t.rfq.f.messagePh}/>
            </div>
            {sent ? (
              <div className="rfq__success">
                <span>✓</span>
                <span>{t.rfq.success}</span>
              </div>
            ) : (
              <div className="rfq__submit">
                <span className="rfq__submit__note"><b>●</b> {t.rfq.note}</span>
                <button type="submit" className="btn-primary">{t.rfq.submit} <span>→</span></button>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────
function Footer({ t }) {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot__grid">
          <div className="foot__col">
            <a className="logo" href="#" style={{marginBottom:20, display:'inline-flex'}}>
              <span className="logo__mark">K</span>
              <span className="logo__word">KERVAN <b>HEAT</b></span>
            </a>
            <p>{t.foot.about}</p>
            <div className="foot__certs">
              {t.foot.certs.map(c => (
                <span key={c} className="foot__cert"><b>✓</b> {c}</span>
              ))}
            </div>
          </div>
          <div className="foot__col">
            <h5>{t.foot.h1}</h5>
            <ul>{t.foot.p.map(p => <li key={p}><a href="#parts">{p}</a></li>)}</ul>
          </div>
          <div className="foot__col">
            <h5>{t.foot.h2}</h5>
            <ul>{t.foot.c.map(c => <li key={c}><a href="#">{c}</a></li>)}</ul>
          </div>
          <div className="foot__col">
            <h5>{t.foot.h3}</h5>
            <ul>{t.foot.cc.map(c => <li key={c}><a href="#contact">{c}</a></li>)}</ul>
          </div>
        </div>
        <div className="foot__block">
          {t.foot.block.map(([k, v], i) => (
            <div key={i} className="foot__block__cell">
              <b>{k}</b>
              <span className={i === 0 ? 'orange' : ''}>{v}</span>
            </div>
          ))}
        </div>
        <div className="foot__bot">
          <span>© 2026 KERVAN HEAT TREATMENT</span>
          <span>{t.foot.bot}</span>
        </div>
      </div>
    </footer>
  );
}

// Expose
Object.assign(window, { Nav, Hero, Ticker, Parts, OrbitSection, Furnace, Process, Meters, RFQ, Footer });
