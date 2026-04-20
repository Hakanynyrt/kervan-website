/* global React */
// Blog post dictionary - 4 articles with TR/EN/DE/RU content
// Used by blog.html (listing) and post.html (detail)

const POSTS = {
  tr: [
    {
      slug: 'keski-degistirme-zamani',
      cat: 'BAKIM',
      date: '2026-01-15',
      readTime: '6 DK',
      title: 'Keskiyi ne zaman değiştirmeli? 3 net işaret',
      excerpt: 'Zamanından önce değişim = para yakmak. Geç değişim = piston çatlağı. Aradaki çizgi aslında çok net.',
      body: [
        { type: 'p', text: 'Sahada en çok sorduğumuz soru: "Keski daha kaç gün dayanır?" Üç net işaret var. Hiçbiri tahmin değil; ölçülebilir, gözlemlenebilir.' },
        { type: 'h2', text: '1. Uç çapı: orijinal ölçünün %12 altına düşmüşse bitmiştir' },
        { type: 'p', text: 'Yeni keskinin uç çapını üretici spec sheet\'inden alın. Her 2 haftada bir kumpasla ölçün. %12 aşınma (tipik olarak 3-4 mm) rejimi değiştirmek için doğru an. Aksi halde darbe enerjisi keski yerine piston üzerinde absorbe edilmeye başlar.' },
        { type: 'h2', text: '2. Mantar deformasyonu' },
        { type: 'p', text: 'Keskinin üst ucu (piston temas yüzeyi) mantar gibi yayılmaya başlamışsa — genelde 1-2 mm kenar taşması — hemen değiştirin. Bu yayılma, burçla metal-metal sürtünmesi demek. Burç 3 haftaya gider.' },
        { type: 'h2', text: '3. Termal renk lekeleri' },
        { type: 'p', text: 'Keski üzerinde mavi/mor lekeler varsa, malzeme tavına yaklaşmış demektir. 300°C üzeri sürekli çalışma sertliği yok eder. Bu aşamadan sonra keski artık sertleştirilmiş çelik değil — yumuşak çelik. Kırma verimi %40+ düşer.' },
        { type: 'h2', text: 'Pratik: 10 günde bir 5 dakika' },
        { type: 'p', text: 'Operatör vardiya başında kumpas + gözle bakış yapar. Deftere yazar. Üç hafta üst üste değişim varsa, keski spec\'i yanlış demektir — daha sert alaşım gerekir. Bu noktada bize yazın: referans tablomuzdan uygun olanı söyleyelim.' },
      ],
    },
    {
      slug: '42crmo-vs-45c-karsilastirma',
      cat: 'MALZEME',
      date: '2026-01-03',
      readTime: '8 DK',
      title: '42CrMo vs 45C: hangi keski için hangi çelik?',
      excerpt: 'Her tonaja 42CrMo atmak doğru değil. 20-30 ton kırıcıda 45C daha uzun ömür verebilir. Neden?',
      body: [
        { type: 'p', text: 'Endüstri standardı gibi görünüyor: "42CrMo al, hata yapmazsın." Yanlış. Her tonajın kendi stresi var, her stresin kendi optimum alaşımı var.' },
        { type: 'h2', text: '42CrMo — yüksek tonaj (30+ ton)' },
        { type: 'p', text: 'Kromlu-molibdenli alaşım. Temperleme sonrası 52-56 HRC. Darbe dayanımı yüksek, ama kırılganlığa meyilli. 35-50 ton arası kırıcılarda ideal. Altındaki tonajlarda "çekiç üzerinde sivrisinek"; gereksiz yere pahalı ve aslında daha kısa ömürlü.' },
        { type: 'h2', text: '45C — orta tonaj (15-30 ton)' },
        { type: 'p', text: 'Sade karbon çelik. 48-52 HRC. Daha sünek, mikro-kırılmalara dayanıklı. 15-30 ton kırıcılarda 42CrMo\'dan %20-30 daha uzun ömür. Daha ucuz. Tek dezavantaj: 35+ ton darbe enerjisinde uç deformasyonu hızlanır.' },
        { type: 'h2', text: 'Karşılaştırma tablosu' },
        { type: 'p', text: '• 42CrMo: 35-60 ton kırıcı, beton/granit, 52-56 HRC\n• 45C: 15-30 ton kırıcı, asfalt/yumuşak kaya, 48-52 HRC\n• S7 aletli çelik: özel uygulamalar, madenim, 58-60 HRC' },
        { type: 'h2', text: 'Saha kararı' },
        { type: 'p', text: 'Makine spec\'i ve şantiye materyali verin, biz spec eşleyelim. Yanlış alaşım = 3 kat hızlı aşınma. Doğru alaşım = 6-8 aylık ömür.' },
      ],
    },
    {
      slug: 'oem-tuzagi',
      cat: 'PAZAR',
      date: '2025-12-12',
      readTime: '5 DK',
      title: 'OEM parçasının gizli maliyeti',
      excerpt: 'Orijinal keski %60 daha pahalı ama aynı ömür veriyor. Hesabını yaparsak...',
      body: [
        { type: 'p', text: 'OEM parçaları "garanti" algısıyla satılır. Peki gerçek rakamlar ne diyor?' },
        { type: 'h2', text: 'Saha verimizi' },
        { type: 'p', text: 'Son 3 yılda 240 kırıcıda karşılaştırmalı veri topladık — OEM keski vs 42CrMo aftermarket. Sonuç: ortalama ömür farkı %4. İstatistiksel olarak gürültü. Fiyat farkı %55-70.' },
        { type: 'h2', text: 'OEM fiyatının içinde ne var?' },
        { type: 'p', text: '• Orijinal logo ve ambalaj: %15\n• 3 kademeli distribütör marjı: %25\n• Lojistik (yurtdışından): %10\n• Üretim maliyeti: %50' },
        { type: 'p', text: 'Yani orijinal keskinin fiziksel üretim maliyeti, aftermarket\'in hemen yanında. Alaşım aynı (genelde aynı Çin/Kore fabrikaları), spec aynı, ısıl işlem prosedürü aynı. Tek fark markalamada.' },
        { type: 'h2', text: 'Ne zaman OEM?' },
        { type: 'p', text: 'İki durumda: (1) garanti dönemindeki yeni makine, (2) leasing\'de "OEM kullanılmalı" klozu varsa. Bunların dışında, EN 10204 3.1 sertifikalı aftermarket aynı işi görür.' },
      ],
    },
    {
      slug: 'temperleme-profili',
      cat: 'ISIL İŞLEM',
      date: '2025-11-20',
      readTime: '10 DK',
      title: 'Temperleme profili: kritik 4 saat',
      excerpt: 'Sertleştirmeden sonra temperleme doğru yapılmazsa, %5 HRC kaybı + uzun vadede mikro-çatlak demek.',
      body: [
        { type: 'p', text: 'Isıl işlem iki aşamalıdır: sertleştirme (hızlı soğutma) + temperleme (kontrollü yeniden ısıtma). Çoğu atölye temperlemeyi baştan savma yapar — bu da ürünün gizli zayıflığıdır.' },
        { type: 'h2', text: 'Temperlemenin fiziği' },
        { type: 'p', text: 'Sertleştirmeden çıkan martensit yapı aşırı sert ama kırılgandır. Temperleme (150-650°C arası), martensiti kontrollü şekilde "yumuşatır" — gerçekte: iç stresleri rahatlatır, mikro-yapıyı stabil hale getirir. 4 saatlik doğru profil, ömrü %40 uzatır.' },
        { type: 'h2', text: 'Kervan profili: 4 saat, 3 kademe' },
        { type: 'p', text: '• Aşama 1 — 0:00-1:30: 450°C sabit, stres giderme\n• Aşama 2 — 1:30-3:00: 550°C, sünek-sert denge\n• Aşama 3 — 3:00-4:00: Kontrollü soğuma 120°C\'ye' },
        { type: 'p', text: 'Her kademe arasında ±5°C tolerans. Doğru yapıldığında, keskinin iç sıkışmış stresleri yok olur. Darbe altında çatlak başlama noktaları ortadan kalkar.' },
        { type: 'h2', text: 'Kötü temperlemenin işaretleri' },
        { type: 'p', text: '• Aynı üretim lotunda bir keski 5 hafta, bir diğeri 2 hafta dayanıyorsa → profil dalgalı.\n• Keski uç kısmında "tuzlu-biberli" parlak noktalar → eşit olmayan sıcaklık dağılımı.\n• Kırılan keskide kırık yüzeyi granüler → temperleme yok denecek kadar az.' },
        { type: 'p', text: 'Bizim fırınımızda 8 termokupul + PLC kontrol var. Her parça kendi log dosyasıyla çıkar; talep edilirse sertifikaya eklenir.' },
      ],
    },
  ],
  en: [
    {
      slug: 'keski-degistirme-zamani',
      cat: 'MAINTENANCE',
      date: '2026-01-15',
      readTime: '6 MIN',
      title: 'When to change a chisel: 3 clear signs',
      excerpt: 'Early swap = burning money. Late swap = piston crack. The line between them is actually very clear.',
      body: [
        { type: 'p', text: 'The question we get most from the field: "How many more days will this chisel last?" There are three clear signs. None are guesses; all measurable, observable.' },
        { type: 'h2', text: '1. Tip diameter: 12% below original = done' },
        { type: 'p', text: 'Get the new chisel\'s tip diameter from the OEM spec sheet. Measure with calipers every 2 weeks. 12% wear (typically 3-4 mm) is the right moment to swap. Otherwise impact energy starts being absorbed by the piston instead of the chisel.' },
        { type: 'h2', text: '2. Mushroom deformation' },
        { type: 'p', text: 'If the chisel\'s top (piston contact face) starts spreading mushroom-like — usually 1-2 mm edge overhang — swap immediately. That spread means metal-metal friction with the bushing. The bushing has 3 weeks left.' },
        { type: 'h2', text: '3. Thermal discoloration' },
        { type: 'p', text: 'If blue/purple marks appear on the chisel, the material is approaching annealing. Continuous work above 300°C erases hardness. After this point the chisel is no longer hardened steel — it\'s soft steel. Breaking efficiency drops 40%+.' },
        { type: 'h2', text: 'Practical: 5 minutes every 10 days' },
        { type: 'p', text: 'Operator does calipers + eye check at start of shift. Logs to the notebook. Three consecutive weekly swaps means chisel spec is wrong — you need a harder alloy. At that point write us: we\'ll tell you which one from our reference table.' },
      ],
    },
    {
      slug: '42crmo-vs-45c-karsilastirma',
      cat: 'MATERIAL',
      date: '2026-01-03',
      readTime: '8 MIN',
      title: '42CrMo vs 45C: which steel for which chisel?',
      excerpt: 'Throwing 42CrMo at every tonnage isn\'t right. On a 20-30 ton breaker 45C can last longer. Why?',
      body: [
        { type: 'p', text: 'Looks like an industry standard: "get 42CrMo, you won\'t go wrong." Wrong. Every tonnage has its own stress; every stress has its own optimum alloy.' },
        { type: 'h2', text: '42CrMo — high tonnage (30+ ton)' },
        { type: 'p', text: 'Chrome-moly alloy. 52-56 HRC after tempering. High impact resistance, but brittleness-prone. Ideal for 35-50 ton breakers. Below that tonnage it\'s "mosquito on a hammer"; unnecessarily expensive and actually shorter-lived.' },
        { type: 'h2', text: '45C — medium tonnage (15-30 ton)' },
        { type: 'p', text: 'Plain carbon steel. 48-52 HRC. More ductile, resists micro-fracture. On 15-30 ton breakers lasts 20-30% longer than 42CrMo. Cheaper. One drawback: tip deformation accelerates above 35+ ton impact energy.' },
        { type: 'h2', text: 'Comparison table' },
        { type: 'p', text: '• 42CrMo: 35-60 ton breakers, concrete/granite, 52-56 HRC\n• 45C: 15-30 ton breakers, asphalt/soft rock, 48-52 HRC\n• S7 tool steel: special applications, mining, 58-60 HRC' },
        { type: 'h2', text: 'Field decision' },
        { type: 'p', text: 'Send the machine spec and site material, we\'ll match the spec. Wrong alloy = 3× faster wear. Right alloy = 6-8 months of life.' },
      ],
    },
    {
      slug: 'oem-tuzagi',
      cat: 'MARKET',
      date: '2025-12-12',
      readTime: '5 MIN',
      title: 'The hidden cost of OEM parts',
      excerpt: 'Original chisel costs 60% more but gives the same life. Let\'s do the math...',
      body: [
        { type: 'p', text: 'OEM parts sell on the "guarantee" narrative. What do the real numbers say?' },
        { type: 'h2', text: 'Our field data' },
        { type: 'p', text: 'Over the last 3 years we collected comparative data on 240 breakers — OEM chisel vs 42CrMo aftermarket. Result: average life difference 4%. Statistically noise. Price difference 55-70%.' },
        { type: 'h2', text: 'What\'s in the OEM price?' },
        { type: 'p', text: '• Original logo and packaging: 15%\n• 3-tier distributor margin: 25%\n• Logistics (overseas): 10%\n• Manufacturing cost: 50%' },
        { type: 'p', text: 'So the physical manufacturing cost of an OEM chisel is right next to aftermarket. Same alloy (usually same Chinese/Korean factories), same spec, same heat-treat procedure. Only difference is branding.' },
        { type: 'h2', text: 'When OEM?' },
        { type: 'p', text: 'Two situations: (1) new machine under warranty, (2) leasing contract with "OEM only" clause. Beyond these, EN 10204 3.1-certified aftermarket does the same job.' },
      ],
    },
    {
      slug: 'temperleme-profili',
      cat: 'HEAT TREATMENT',
      date: '2025-11-20',
      readTime: '10 MIN',
      title: 'Tempering profile: the critical 4 hours',
      excerpt: 'If tempering isn\'t done right after hardening, it means 5% HRC loss + long-term microcracks.',
      body: [
        { type: 'p', text: 'Heat treatment is two-stage: hardening (rapid cooling) + tempering (controlled reheating). Most workshops do tempering carelessly — this is the product\'s hidden weakness.' },
        { type: 'h2', text: 'The physics of tempering' },
        { type: 'p', text: 'The martensitic structure coming out of hardening is extra-hard but brittle. Tempering (between 150-650°C) "softens" the martensite in a controlled way — actually: relieves internal stress, stabilizes the microstructure. The correct 4-hour profile extends life by 40%.' },
        { type: 'h2', text: 'Kervan profile: 4 hours, 3 stages' },
        { type: 'p', text: '• Stage 1 — 0:00-1:30: 450°C constant, stress relief\n• Stage 2 — 1:30-3:00: 550°C, ductile-hard balance\n• Stage 3 — 3:00-4:00: Controlled cooling to 120°C' },
        { type: 'p', text: '±5°C tolerance between stages. Done right, the chisel\'s locked-in internal stresses disappear. Crack initiation points vanish under impact.' },
        { type: 'h2', text: 'Signs of bad tempering' },
        { type: 'p', text: '• If one chisel in the same production lot lasts 5 weeks and another 2 → profile is wavy.\n• "Salt-and-pepper" bright spots on the tip → uneven temperature distribution.\n• Granular fracture surface on broken chisel → almost no tempering.' },
        { type: 'p', text: 'Our furnace has 8 thermocouples + PLC control. Every part leaves with its own log file; can be attached to the certificate on request.' },
      ],
    },
  ],
  de: [], // Same structure - fallback to EN at runtime
  ru: [],
};

// Fallback: if language not available, use EN
function getPosts(lang) {
  const list = POSTS[lang];
  if (list && list.length) return list;
  return POSTS.en;
}
function getPost(lang, slug) {
  return getPosts(lang).find(p => p.slug === slug) || getPosts(lang)[0];
}
