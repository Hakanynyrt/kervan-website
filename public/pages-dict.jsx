/* global React */
// Sub-page dictionary — about / gallery / cases / certs / catalog / diagram / blog
// Used by all sub-pages (about.html, gallery.html, cases.html, etc.)

const PAGES_DICT = {
  tr: {
    about: {
      label: 'HAKKIMIZDA',
      h1a: 'Yirmi beş yıl, ', h1b: 'ateşin ve metalin hikayesi.',
      sub: 'Hakan Yünyurt ve Kervan Carbon, bir aile atölyesinden başlayarak dört kıtaya kırıcı keskisi gönderen bir operasyona büyüdü.',
      stats: [
        ['25+', 'YIL DENEYIM'],
        ['40+', 'ÜLKE İHRACAT'],
        ['12', 'ISIL İŞLEM FIRINI'],
        ['8000+', 'YILLIK ÜRETIM ADEDI'],
      ],
      quote: {
        text: 'İşe başladığımda bir fırın, bir tesviye tezgahı ve babamın 30 yıllık deneyimi vardı. Şimdi 40 ülkeye gönderiyoruz. Ama yöntem değişmedi: her keski elle kontrol edilir, her serti Rockwell\'den geçer.',
        by: 'HAKAN YÜNYURT · KURUCU',
      },
      timeline: [
        ['2001', 'Aile atölyesi devir', 'Babam Salih Yünyurt\'tan tezgahı devraldım. İlk iş: Samsun limanındaki bir ekskavatör için 3 keski.'],
        ['2008', 'İlk ısıl işlem fırını', 'Yurtdışından ithal PLC kontrollü fırın kuruldu. O güne kadar sertleştirme dışarıya veriliyordu.'],
        ['2018', 'İlk yurtdışı müşteri', 'Rusya Uralmash grubuna ilk 400 keski. Bu sipariş 5 yıldır devam ediyor.'],
        ['2021', 'Kervan Carbon markası', 'KRV/Carbon periyodik tablo logosu tescil edildi. Carbon: karbon çelik. Krv: Kervan.'],
        ['2026', '40 ülke, 12 fırın', 'Bugün Endonezya\'dan Brezilya\'ya, Mısır\'dan Finlandiya\'ya gönderiyoruz. Aile atölyesi ruhu aynı.'],
      ],
    },
    gallery: {
      label: 'ATÖLYE',
      h1a: 'Tezgahtan ', h1b: 'pakete.',
      sub: 'Üretim hattımızdan 9 kesit. CNC tesviyeden final ambalaja kadar süreç.',
      cells: [
        ['01 · CNC TESVIYE', 'cnc'],
        ['02 · ISIL İŞLEM FIRINI', 'furnace'],
        ['03 · SERTLIK KONTROL', 'rockwell'],
        ['04 · TAŞLAMA', 'grind'],
        ['05 · SPEKTROMETRE', 'spectro'],
        ['06 · PAKETLEME', 'pack'],
        ['07 · FORJ ÜNITESI', 'forge'],
        ['09 · SEVKIYAT', 'ship'],
      ],
    },
    cases: {
      label: 'SAHA KAYITLARI',
      h1a: 'Üç proje, ', h1b: 'üç kıta.',
      sub: 'Soru teknik — cevap da teknik. Her dosya bir telefondan, bir ölçümden ve bir sevkiyattan ibaret.',
      items: [
        {
          top: [['MÜŞTERI', 'PT. Bukit Mining'], ['EKIPMAN', 'Furukawa HB30G ×4'], ['LOKASYON', 'Kalimantan, Endonezya'], ['SÜRE', '14 ay']],
          title: 'Furukawa HB30G filosu — kömür madeninde 14 ay',
          prose: 'Yıllık 180 keski + 24 piston. Isıl işlem 42CrMo, 54 HRC. Tropik nem koşullarında korozyon koruması için ekstra manganez fosfat. Raporlara göre aftermarket\'e göre %18 daha uzun ömür.',
          quote: '"4 makina, 14 ay, bir tek garanti çağrısı yok. Bu eskiden OEM ile bile zor oluyordu."',
          quoteBy: 'BAKIM MÜDÜRÜ · PT. BUKIT',
          results: [
            ['%18', 'DAHA UZUN ÖMÜR'],
            ['0', 'GARANTI ÇAĞRISI'],
            ['14 AY', 'SÜREKLI SEVKIYAT'],
          ],
        },
        {
          top: [['MÜŞTERI', 'UralStroy Tech'], ['EKIPMAN', 'Rammer G120 ×12'], ['LOKASYON', 'Ural bölgesi, Rusya'], ['SÜRE', '5 yıl']],
          title: 'Rammer filosu — 5 yıllık sürekli operasyon',
          prose: '2021\'den beri Rammer G120 filosu için aylık 80 keski. -40°C\'den +35°C\'ye kadar operasyon. Düşük sıcaklıkta kırılgan kırılmayı önlemek için özel temperleme profili (düşük sıcaklık varyantı).',
          quote: '"Sibirya\'da eksi 40\'ta çalışan keski bulmak kolay değil. Kervan bunu çözdü."',
          quoteBy: 'PROJE ŞEFI · URALSTROY',
          results: [
            ['60 AY', 'SÜREKLI SEVKIYAT'],
            ['%0', 'SOĞUK KIRILMA'],
            ['12', 'MAKINE FILOSU'],
          ],
        },
        {
          top: [['MÜŞTERI', 'Al-Raed Group'], ['EKIPMAN', 'Soosan SB121'], ['LOKASYON', 'Kahire, Mısır'], ['SÜRE', '8 ay']],
          title: 'Acil sipariş — 48 saatte gümrükte',
          prose: 'Şantiyede üç kırıcı devre dışı. Cıvata + burç + iki keski. Pazartesi RFQ, Salı üretim tamamlandı, Perşembe gümrükte, Cuma sahada. Proje gecikmedi.',
          quote: '"Türkiye\'den Mısır\'a 4 günde parça. Bu iş genelde 3 hafta sürer."',
          quoteBy: 'PROJE ŞEFI · AL-RAED',
          results: [
            ['4 GÜN', 'FABRIKA→SAHA'],
            ['0', 'PROJE GECIKMESI'],
            ['3×', 'TEKRAR SIPARIŞ'],
          ],
        },
      ],
    },
    certs: { items: [] },
    catalog: {
      label: 'KATALOG',
      h1a: 'Kırıcı parçaları — ', h1b: 'tek sayfa.',
      sub: 'Yazdır → PDF olarak kaydet. Ofis masasında açık tut.',
      printBtn: 'YAZDIR / PDF',
      groups: [
        {
          name: 'Keskiler (Chisels)',
          headers: ['REF', 'AD', 'ÇAP', 'UZUNLUK', 'MALZEME', 'SERTLIK', 'UYUMLU MARKA'],
          rows: [
            ['CHS-42', 'Keski 42mm', '42', '520', '42CrMo', '52-56 HRC', 'Atlas Copco, Furukawa, Rammer'],
            ['CHS-50', 'Keski 50mm', '50', '580', '42CrMo', '52-56 HRC', 'Soosan, Epiroc, Indeco'],
            ['CHS-68', 'Keski 68mm', '68', '720', '42CrMo', '54-58 HRC', 'NPK, Krupp, Hanwoo'],
            ['CHS-80', 'Keski 80mm', '80', '880', '42CrMo', '54-58 HRC', 'Montabert, Toku'],
            ['CHS-95', 'Keski 95mm', '95', '980', '42CrMo', '54-58 HRC', 'Atlas Copco HB5000+'],
            ['CHS-45C-50', 'Keski 50mm (45C)', '50', '580', '45C', '48-52 HRC', '15-25 ton kırıcılar'],
          ],
        },
        {
          name: 'Pistonlar (Pistons)',
          headers: ['REF', 'AD', 'ÇAP', 'UZUNLUK', 'MALZEME', 'SERTLIK'],
          rows: [
            ['PST-A120', 'Piston HB3000', '120', '720', '42CrMo', '54-58 HRC'],
            ['PST-A140', 'Piston HB4100', '140', '850', '42CrMo', '54-58 HRC'],
            ['PST-F110', 'Piston HB30G', '110', '680', '42CrMo', '54-58 HRC'],
            ['PST-R130', 'Piston G120', '130', '780', '42CrMo', '54-58 HRC'],
            ['PST-S95', 'Piston SB81', '95', '620', '42CrMo', '54-58 HRC'],
          ],
        },
        {
          name: 'Burçlar (Bushings)',
          headers: ['REF', 'AD', 'İÇ ÇAP', 'DIŞ ÇAP', 'UZUNLUK', 'MALZEME'],
          rows: [
            ['BSH-42', 'Burç 42mm', '42', '68', '180', 'Bronz + Çelik'],
            ['BSH-50', 'Burç 50mm', '50', '78', '200', 'Bronz + Çelik'],
            ['BSH-68', 'Burç 68mm', '68', '100', '240', 'Bronz + Çelik'],
            ['BSH-80', 'Burç 80mm', '80', '120', '280', 'Bronz + Çelik'],
          ],
        },
        {
          name: 'Bağlantı elemanları',
          headers: ['REF', 'AD', 'AÇIKLAMA', 'MALZEME'],
          rows: [
            ['BLT-23', 'Yan cıvata M23', 'Kırıcı gövdesi yan cıvatası', 'Sertleştirilmiş 10.9'],
            ['BLT-M30', 'Uzun cıvata M30', 'Üst kapak cıvatası', 'Sertleştirilmiş 12.9'],
            ['RNG-42', 'Sızdırmazlık halkası', 'Piston alt yüzey', 'Viton'],
            ['KIT-STD', 'Standart bakım kiti', '2 keski + 1 burç + cıvatalar', 'Karışık'],
          ],
        },
      ],
    },
    diagram: {
      label: 'PATLATILMIŞ GÖRÜNÜM',
      h1a: 'Parçaya tıkla, ', h1b: 'özelliği oku.',
      sub: 'Hidrolik kırıcının ana parçaları. Her biri bizim üretim kapsamımızda.',
      parts: {
        chisel: {
          name: 'Keski',
          desc: 'Beton, kaya ve asfaltı kıran uç parça. Doğrudan piston darbesini alır. En sık değiştirilen parça.',
          specs: [['MALZEME', '42CrMo / 45C'], ['SERTLIK', '52-58 HRC'], ['ÖMÜR', '3-6 ay']],
        },
        piston: {
          name: 'Piston',
          desc: 'Kırıcının kalbi. Hidrolik yağ basıncını darbe enerjisine çevirir. 8-12 ayda bir değiştirilir.',
          specs: [['MALZEME', '42CrMo'], ['SERTLIK', '54-58 HRC'], ['ÖMÜR', '8-12 ay']],
        },
        bushing: {
          name: 'Burç',
          desc: 'Keskinin hareket ettiği yatak. Keski değiştirildiğinde yaklaşık %30 olasılıkla beraber değişir.',
          specs: [['MALZEME', 'Bronz + çelik'], ['TOLERANS', 'H7'], ['ÖMÜR', '6-10 ay']],
        },
        bolt: {
          name: 'Yan cıvata',
          desc: 'Gövde yan plakalarını birleştiren yüksek dayanımlı cıvata. 12 ayda bir kontrol edilir.',
          specs: [['SINIF', '10.9'], ['SERTLIK', '32 HRC'], ['TORK', '380 Nm']],
        },
      },
      hint: 'Herhangi bir parçaya tıklayın.',
    },
    blog: {
      label: 'KAYNAK',
      h1a: 'Saha notları, ', h1b: 'atölye bilgisi.',
      sub: 'Çoğunlukla teknik, bazen içerden. Her yazıyı gerçek bir telefondan yazıyoruz.',
      allPosts: 'Tüm yazılar',
      backToBlog: '← Tüm yazılar',
    },
  },

  en: {
    about: {
      label: 'ABOUT',
      h1a: 'Twenty-five years of ', h1b: 'fire and metal.',
      sub: 'Hakan Yünyurt and Kervan Carbon: from a family workshop to a four-continent operation shipping breaker chisels.',
      stats: [
        ['25+', 'YEARS EXPERIENCE'],
        ['40+', 'EXPORT COUNTRIES'],
        ['12', 'HEAT-TREAT FURNACES'],
        ['8000+', 'ANNUAL UNITS'],
      ],
      quote: {
        text: 'When I started there was one furnace, one lathe, and my father\'s 30 years of experience. Now we ship to 40 countries. But the method didn\'t change: every chisel hand-inspected, every hardness through Rockwell.',
        by: 'HAKAN YÜNYURT · FOUNDER',
      },
      timeline: [
        ['2001', 'Family workshop handover', 'Took over the shop from my father Salih Yünyurt. First job: 3 chisels for an excavator at Samsun port.'],
        ['2008', 'First heat-treat furnace', 'Imported PLC-controlled furnace installed. Before then, hardening was outsourced.'],
        ['2018', 'First overseas customer', 'First 400 chisels to Russia\'s Uralmash group. Order still running after 5 years.'],
        ['2021', 'Kervan Carbon brand', 'KRV/Carbon periodic-table logo registered. Carbon: carbon steel. Krv: Kervan.'],
        ['2026', '40 countries, 12 furnaces', 'Today we ship from Indonesia to Brazil, Egypt to Finland. The family-workshop spirit is the same.'],
      ],
    },
    gallery: {
      label: 'WORKSHOP',
      h1a: 'From lathe ', h1b: 'to package.',
      sub: 'Nine sections from our production line. From CNC turning to final packaging.',
      cells: [
        ['01 · CNC TURNING', 'cnc'],
        ['02 · HEAT-TREAT FURNACE', 'furnace'],
        ['03 · HARDNESS CONTROL', 'rockwell'],
        ['04 · GRINDING', 'grind'],
        ['05 · SPECTROMETER', 'spectro'],
        ['06 · METALLOGRAPHY', 'micro'],
        ['07 · PACKAGING', 'pack'],
        ['08 · FORGE UNIT', 'forge'],
        ['09 · SHIPPING', 'ship'],
      ],
    },
    cases: {
      label: 'FIELD RECORDS',
      h1a: 'Three projects, ', h1b: 'three continents.',
      sub: 'Technical question — technical answer. Each file: a phone call, a measurement, a shipment.',
      items: [
        {
          top: [['CUSTOMER', 'PT. Bukit Mining'], ['EQUIPMENT', 'Furukawa HB30G ×4'], ['LOCATION', 'Kalimantan, Indonesia'], ['DURATION', '14 months']],
          title: 'Furukawa HB30G fleet — 14 months in a coal mine',
          prose: 'Yearly 180 chisels + 24 pistons. Heat-treated 42CrMo, 54 HRC. Extra manganese phosphate for tropical humidity corrosion protection. Reports show 18% longer life vs aftermarket.',
          quote: '"4 machines, 14 months, zero warranty calls. Used to be hard even with OEM."',
          quoteBy: 'MAINTENANCE MANAGER · PT. BUKIT',
          results: [
            ['18%', 'LONGER LIFE'],
            ['0', 'WARRANTY CALLS'],
            ['14 MO', 'CONTINUOUS SHIPPING'],
          ],
        },
        {
          top: [['CUSTOMER', 'UralStroy Tech'], ['EQUIPMENT', 'Rammer G120 ×12'], ['LOCATION', 'Ural region, Russia'], ['DURATION', '5 years']],
          title: 'Rammer fleet — 5 years continuous operation',
          prose: 'Since 2021, 80 chisels/month for the Rammer G120 fleet. -40°C to +35°C operation. Special low-temp tempering profile to prevent brittle fracture in cold.',
          quote: '"Finding chisels that work at -40 in Siberia isn\'t easy. Kervan solved it."',
          quoteBy: 'PROJECT LEAD · URALSTROY',
          results: [
            ['60 MO', 'CONTINUOUS SHIPPING'],
            ['0%', 'COLD FRACTURE'],
            ['12', 'MACHINE FLEET'],
          ],
        },
        {
          top: [['CUSTOMER', 'Al-Raed Group'], ['EQUIPMENT', 'Soosan SB121'], ['LOCATION', 'Cairo, Egypt'], ['DURATION', '8 months']],
          title: 'Rush order — customs in 48 hours',
          prose: 'Three breakers down on site. Bolt + bushing + two chisels. Monday RFQ, Tuesday finished, Thursday at customs, Friday on site. Project on schedule.',
          quote: '"Turkey to Egypt, 4 days. This usually takes 3 weeks."',
          quoteBy: 'PROJECT LEAD · AL-RAED',
          results: [
            ['4 DAYS', 'FACTORY→SITE'],
            ['0', 'PROJECT DELAY'],
            ['3×', 'REPEAT ORDER'],
          ],
        },
      ],
    },
    certs: { items: [] },
    catalog: {
      label: 'CATALOG',
      h1a: 'Breaker parts — ', h1b: 'one page.',
      sub: 'Print → save as PDF. Keep open on your desk.',
      printBtn: 'PRINT / PDF',
      groups: [
        {
          name: 'Chisels',
          headers: ['REF', 'NAME', 'DIA', 'LENGTH', 'MATERIAL', 'HARDNESS', 'COMPATIBLE BRANDS'],
          rows: [
            ['CHS-42', 'Chisel 42mm', '42', '520', '42CrMo', '52-56 HRC', 'Atlas Copco, Furukawa, Rammer'],
            ['CHS-50', 'Chisel 50mm', '50', '580', '42CrMo', '52-56 HRC', 'Soosan, Epiroc, Indeco'],
            ['CHS-68', 'Chisel 68mm', '68', '720', '42CrMo', '54-58 HRC', 'NPK, Krupp, Hanwoo'],
            ['CHS-80', 'Chisel 80mm', '80', '880', '42CrMo', '54-58 HRC', 'Montabert, Toku'],
            ['CHS-95', 'Chisel 95mm', '95', '980', '42CrMo', '54-58 HRC', 'Atlas Copco HB5000+'],
            ['CHS-45C-50', 'Chisel 50mm (45C)', '50', '580', '45C', '48-52 HRC', '15-25 ton breakers'],
          ],
        },
        {
          name: 'Pistons',
          headers: ['REF', 'NAME', 'DIA', 'LENGTH', 'MATERIAL', 'HARDNESS'],
          rows: [
            ['PST-A120', 'Piston HB3000', '120', '720', '42CrMo', '54-58 HRC'],
            ['PST-A140', 'Piston HB4100', '140', '850', '42CrMo', '54-58 HRC'],
            ['PST-F110', 'Piston HB30G', '110', '680', '42CrMo', '54-58 HRC'],
            ['PST-R130', 'Piston G120', '130', '780', '42CrMo', '54-58 HRC'],
            ['PST-S95', 'Piston SB81', '95', '620', '42CrMo', '54-58 HRC'],
          ],
        },
        {
          name: 'Bushings',
          headers: ['REF', 'NAME', 'ID', 'OD', 'LENGTH', 'MATERIAL'],
          rows: [
            ['BSH-42', 'Bushing 42mm', '42', '68', '180', 'Bronze + Steel'],
            ['BSH-50', 'Bushing 50mm', '50', '78', '200', 'Bronze + Steel'],
            ['BSH-68', 'Bushing 68mm', '68', '100', '240', 'Bronze + Steel'],
            ['BSH-80', 'Bushing 80mm', '80', '120', '280', 'Bronze + Steel'],
          ],
        },
        {
          name: 'Fasteners',
          headers: ['REF', 'NAME', 'DESCRIPTION', 'MATERIAL'],
          rows: [
            ['BLT-23', 'Side bolt M23', 'Breaker body side bolt', 'Hardened 10.9'],
            ['BLT-M30', 'Long bolt M30', 'Top cap bolt', 'Hardened 12.9'],
            ['RNG-42', 'Seal ring', 'Piston lower face', 'Viton'],
            ['KIT-STD', 'Standard maintenance kit', '2 chisels + 1 bushing + bolts', 'Mixed'],
          ],
        },
      ],
    },
    diagram: {
      label: 'EXPLODED VIEW',
      h1a: 'Click a part, ', h1b: 'read the spec.',
      sub: 'Main parts of a hydraulic breaker. Every one within our production scope.',
      parts: {
        chisel: {
          name: 'Chisel',
          desc: 'Tip piece that breaks concrete, rock and asphalt. Takes the piston impact directly. Most frequently replaced part.',
          specs: [['MATERIAL', '42CrMo / 45C'], ['HARDNESS', '52-58 HRC'], ['LIFE', '3-6 months']],
        },
        piston: {
          name: 'Piston',
          desc: 'Heart of the breaker. Converts hydraulic oil pressure into impact energy. Replaced every 8-12 months.',
          specs: [['MATERIAL', '42CrMo'], ['HARDNESS', '54-58 HRC'], ['LIFE', '8-12 months']],
        },
        bushing: {
          name: 'Bushing',
          desc: 'Bearing in which the chisel moves. Replaced alongside the chisel ~30% of the time.',
          specs: [['MATERIAL', 'Bronze + steel'], ['TOLERANCE', 'H7'], ['LIFE', '6-10 months']],
        },
        bolt: {
          name: 'Side bolt',
          desc: 'High-strength bolt joining the body side plates. Inspected every 12 months.',
          specs: [['GRADE', '10.9'], ['HARDNESS', '32 HRC'], ['TORQUE', '380 Nm']],
        },
      },
      hint: 'Click any part.',
    },
    blog: {
      label: 'RESOURCES',
      h1a: 'Field notes, ', h1b: 'workshop knowledge.',
      sub: 'Mostly technical, sometimes insider. Every article from a real phone call.',
      allPosts: 'All articles',
      backToBlog: '← All articles',
    },
  },

};
// DE/RU fallback to EN so direct PAGES_DICT[lang].about access works
PAGES_DICT.de = PAGES_DICT.en;
PAGES_DICT.ru = PAGES_DICT.en;


// Runtime fallback: if lang content not provided, use EN
function getPage(lang, page) {
  const dict = PAGES_DICT[lang];
  if (dict && dict[page]) return dict[page];
  return PAGES_DICT.en[page];
}
