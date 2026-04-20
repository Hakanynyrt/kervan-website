/* global React */
const { useState, useEffect, useRef } = React;

// ═══════════════════════════════════════════════════════════════════════════
// Dictionary — TR / EN / DE / RU
// ═══════════════════════════════════════════════════════════════════════════
const DICT = {
  tr: {
    nav: { parts:'Parçalar', compat:'Uyumluluk', furnace:'Fırın', process:'Süreç', contact:'İletişim', quote:'Teklif Al', about:'Hakkımızda', cases:'Referans', blog:'Bilgi' },
    hero: {
      eyebrow: 'MFG · KARTEPE · SINCE 1999',
      h1a: 'Kırıcı parçaları.', h1b: 'Doğrudan fabrikadan.',
      sub: 'Furukawa, Rammer, Soosan, Atlas Copco ve 40+ marka için keskiler, pistonlar, burçlar, cıvatalar ve tamir kitleri üretiyoruz. Hepsi kendi atölyemizde — ısıl işlem dahil.',
      cta1:'Teklif Al', cta2:'Parçaları Gör',
      s:[ {l:'MARKA UYUMU', v:'40+'}, {l:'TESLİMAT', v:'5–10 GÜN'}, {l:'SERTİFİKA', v:'EN 10204 3.1'} ],
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
        file:'Fotoğraf / PDF (opsiyonel)', fileBtn:'DOSYA SEÇ', fileHint:'Maks 5 MB · parça no. bilinmiyorsa yardımcı olur',
      },
      submit:'Gönder', note:'24 saat içinde yanıt · EN 10204 3.1 sertifikası dahil',
      consentA:'Form üzerinden ilettiğim kişisel verilerin fiyat teklifi hazırlanması amacıyla işlenmesini kabul ediyorum. ',
      consentLink:'KVKK Aydınlatma Metni',
      consentB:'’ni okudum.',
      consentErr:'Devam etmek için KVKK onayı gerekli.',
      success:'Aldık. 24 saat içinde dönüş yapacağız.',
    },
    foot: {
      h1:'Ürünler', h2:'Şirket', h3:'İletişim',
      about:'Kartepe, Kocaeli\'de 25+ yıldır kırıcı yedek parçaları ve ısıl işlem üretiyoruz. Kendi fırınımız, kendi CNC\'miz, kendi laboratuvarımız.',
      p:['Keskiler','Pistonlar','Burçlar','Cıvatalar','Ön kafalar','Tamir kitleri'],
      c:['Hakkımızda','Fırın','Galeri','Sertifikalar','İK'],
      cc:['+90 531 669 37 34','info@kervanheat.com','Kartepe · Kocaeli · TR'],
      certs:['EN 10204 3.1','ISO 9001','CE'],
      block:[['PROJE','KERVAN HEAT'],['DWG','KVN-LP-001'],['REV','00'],['DATE','2026'],['SCALE','1:1'],['SHEET','08/08']],
      bot:'Türkiye\'de üretildi · İçeride ısıl işlem · Dünyaya sevkiyat',
    },
  },
  en: {
    nav: { parts:'Parts', compat:'Compatibility', furnace:'Heat Shop', process:'Process', contact:'Contact', quote:'Get a Quote', about:'About', cases:'Cases', blog:'Knowledge' },
    hero: {
      eyebrow: 'MFG · KARTEPE · SINCE 1999',
      h1a: 'Breaker parts.', h1b: 'Direct from the factory.',
      sub: 'We make chisels, pistons, bushings, bolts and repair kits for Furukawa, Rammer, Soosan, Atlas Copco and 40 more brands. All made — and heat-treated — under one roof.',
      cta1:'Get a Quote', cta2:'See the Parts',
      s:[ {l:'BRANDS FIT', v:'40+'}, {l:'LEAD TIME', v:'5–10 DAYS'}, {l:'CERT', v:'EN 10204 3.1'} ],
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
        file:'Photo / PDF (optional)', fileBtn:'SELECT FILE', fileHint:'Max 5 MB · helps when part no. is unknown',
      },
      submit:'Send It', note:'Reply within 24h · EN 10204 3.1 cert included',
      consentA:'I consent to processing of my personal data for the purpose of preparing a quote. ',
      consentLink:'Privacy Notice (KVKK)',
      consentB:' read and acknowledged.',
      consentErr:'Privacy consent is required to continue.',
      success:'Got it. We\'ll get back to you within 24 hours.',
    },
    foot: {
      h1:'Products', h2:'Company', h3:'Contact',
      about:'We\'ve been making breaker parts and heat-treating in Kartepe, Kocaeli for 25+ years. Our furnaces, our CNC, our lab.',
      p:['Chisels','Pistons','Bushings','Bolts','Front heads','Repair kits'],
      c:['About','Heat shop','Gallery','Certificates','Careers'],
      cc:['+90 531 669 37 34','info@kervanheat.com','Kartepe · Kocaeli · TR'],
      certs:['EN 10204 3.1','ISO 9001','CE'],
      block:[['PROJECT','KERVAN HEAT'],['DWG','KVN-LP-001'],['REV','00'],['DATE','2026'],['SCALE','1:1'],['SHEET','08/08']],
      bot:'Made in Turkey · Heat-treated in-house · Shipped worldwide',
    },
  },
  de: {
    nav: { parts:'Teile', compat:'Kompatibilität', furnace:'Härterei', process:'Prozess', contact:'Kontakt', quote:'Angebot', about:'Über uns', cases:'Cases', blog:'Wissen' },
    hero: {
      eyebrow: 'FERTIGUNG · KARTEPE · SEIT 1999',
      h1a: 'Hammerteile.', h1b: 'Direkt vom Werk.',
      sub: 'Wir fertigen Meißel, Kolben, Buchsen, Bolzen und Reparatursätze für Furukawa, Rammer, Soosan, Atlas Copco und 40 weitere Marken. Alles im eigenen Werk — Wärmebehandlung inklusive.',
      cta1:'Angebot anfordern', cta2:'Teile ansehen',
      s:[ {l:'MARKEN', v:'40+'}, {l:'LIEFERUNG', v:'5–10 TAGE'}, {l:'ZERTIFIKAT', v:'EN 10204 3.1'} ],
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
        file:'Foto / PDF (optional)', fileBtn:'DATEI WÄHLEN', fileHint:'Max 5 MB · hilft wenn Teile-Nr. unbekannt',
      },
      submit:'Senden', note:'Antwort < 24 h · EN 10204 3.1 inklusive',
      consentA:'Ich willige in die Verarbeitung meiner personenbezogenen Daten zum Zweck der Angebotserstellung ein. ',
      consentLink:'Datenschutzhinweis (KVKK)',
      consentB:' gelesen.',
      consentErr:'Datenschutz-Einwilligung erforderlich.',
      success:'Erhalten. Antwort innerhalb 24 Stunden.',
    },
    foot: {
      h1:'Produkte', h2:'Firma', h3:'Kontakt',
      about:'Seit 25+ Jahren fertigen wir in Kartepe, Kocaeli Hammerteile und härten im Haus.',
      p:['Meißel','Kolben','Buchsen','Bolzen','Vorderköpfe','Reparatursätze'],
      c:['Über uns','Härterei','Galerie','Zertifikate','Karriere'],
      cc:['+90 531 669 37 34','info@kervanheat.com','Kartepe · Kocaeli · TR'],
      certs:['EN 10204 3.1','ISO 9001','CE'],
      block:[['PROJEKT','KERVAN HEAT'],['DWG','KVN-LP-001'],['REV','00'],['DATUM','2026'],['SCALE','1:1'],['BLATT','08/08']],
      bot:'Hergestellt in der Türkei · Im Haus gehärtet · Weltweit versandt',
    },
  },
  ru: {
    nav: { parts:'Запчасти', compat:'Совместимость', furnace:'Печь', process:'Процесс', contact:'Контакт', quote:'Запросить', about:'О нас', cases:'Проекты', blog:'База' },
    hero: {
      eyebrow: 'ПРОИЗВОДСТВО · KARTEPE · С 1999',
      h1a: 'Запчасти для молотов.', h1b: 'Напрямую с завода.',
      sub: 'Мы производим пики, поршни, втулки, болты и ремкомплекты для Furukawa, Rammer, Soosan, Atlas Copco и 40+ марок. Всё под одной крышей — включая термообработку',
      cta1:'Запросить', cta2:'Посмотреть',
      s:[ {l:'МАРОК', v:'40+'}, {l:'СРОК', v:'5–10 ДНЕЙ'}, {l:'СЕРТИФИКАТ', v:'EN 10204 3.1'} ],
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
        file:'Фото / PDF (опц.)', fileBtn:'ВЫБРАТЬ ФАЙЛ', fileHint:'Макс 5 МБ · помогает без номера',
      },
      submit:'Отправить', note:'Ответ < 24 ч · EN 10204 3.1 в комплекте',
      consentA:'Я согласен(на) на обработку моих персональных данных для подготовки коммерческого предложения. ',
      consentLink:'Уведомление о конфиденциальности (KVKK)',
      consentB:' прочитано.',
      consentErr:'Требуется согласие на обработку данных.',
      success:'Получили. Ответим в течение 24 часов.',
    },
    foot: {
      h1:'Продукция', h2:'Компания', h3:'Контакт',
      about:'25+ лет мы производим запчасти для молотов и ведём термообработку в Kartepe.',
      p:['Пики','Поршни','Втулки','Болты','Головки','Ремкомплекты'],
      c:['О нас','Печь','Галерея','Сертификаты','Вакансии'],
      cc:['+90 531 669 37 34','info@kervanheat.com','Kartepe · Kocaeli · TR'],
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
