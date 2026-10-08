import type { TipType } from '@kervan/tips';
import type { PartKey } from './routes';
import type { Lang } from '../types';

export interface Dict {
  meta: {
    siteName: string;
    homeTitle: string;
    homeDesc: string;
    listTitle: string;
    listDesc: string;
    familyTitle: (code: string, d: string) => string;
    familyDesc: (code: string, d: string, types: string) => string;
    breakerTitle: (name: string, d: string) => string;
    breakerDesc: (name: string, d: string, types: string) => string;
    notFoundTitle: string;
    popularTitle: string;
    popularDesc: string;
    brandTitle: (brand: string) => string;
    brandDesc: (brand: string, n: number) => string;
    partsTitle: string;
    partsDesc: string;
    partTitle: (name: string) => string;
    partDesc: (name: string) => string;
    cartTitle: string;
  };
  nav: {
    label: string;
    tips: string;
    popular: string;
    catalogSite: string;
    quote: string;
    quoteText: string;
    parts: string;
    call: string;
    cart: string;
    langLabel: string;
    langOther: string;
  };
  top: { tagline: string; shop: string };
  banner: { preview: string; demo: string };
  tip: Record<TipType, string>;
  home: {
    title: string;
    lead: string;
    cta: string;
    ctaQuote: string;
    popular: string;
    featured: string;
    morePopular: string;
    groups: string;
    count: (n: number) => string;
    trust: { title: string; body: string }[];
    sectors: {
      title: string;
      lead: string;
      typesLabel: string;
      note: string;
      items: { name: string; body: string; types: TipType[] }[];
    };
  };
  card: { view: string };
  breaker: { title: (name: string) => string };
  popular: { title: string; lead: string };
  list: {
    title: string;
    lead: string;
    model: string;
    diameter: string;
    types: string;
  };
  family: {
    kicker: (d: string) => string;
    crumbHome: string;
    crumbLabel: string;
    diameter: string;
    type: string;
    qty: string;
    stockTitle: string;
    stockNote: string;
    stockAlt: (i: number) => string;
    angle: string;
    availability: string;
    inStock: (n: number) => string;
    lead: (days: number) => string;
    ask: string;
    askLead: string;
    carrier: string;
    carrierValue: (min: number, max: number) => string;
    carrierNote: string;
    quoteTitle: string;
    quoteBody: string;
    whatsapp: string;
    email: string;
    quoteText: (name: string, type: string, code: string, qty: string) => string;
    renderAlt: (name: string, type: string) => string;
    sideAlt: (name: string, type: string) => string;
    rearAlt: (name: string) => string;
    viewRear: string;
  };
  search: {
    label: string;
    placeholder: string;
    button: string;
    none: (q: string) => string;
    count: (n: number) => string;
    brands: string;
    all: string;
  };
  missing: { title: string; body: string; button: string; text: string };
  price: {
    label: string;
    fxNote: (date: string) => string;
    add: string;
    added: string;
    goCart: string;
  };
  cart: {
    title: string;
    empty: string;
    browse: string;
    product: string;
    qty: string;
    unit: string;
    lineTotal: string;
    ask: string;
    total: string;
    subtotal: string;
    vat: (pct: number) => string;
    totalNote: string;
    remove: (name: string) => string;
    less: string;
    more: string;
    contactTitle: string;
    name: string;
    company: string;
    phone: string;
    city: string;
    note: string;
    sendWa: string;
    sendMail: string;
    clear: string;
    info: string;
    message: (lines: string[], total: string, contact: string[]) => string;
  };
  brand: { title: (brand: string) => string; lead: (n: number) => string };
  /** Sales terms shown on every product page: quality, shipping, payment, warranty. */
  terms: { title: string; rows: [string, string][]; note: string };
  parts: {
    title: string;
    lead: string;
    tips: { name: string; body: string };
    items: Record<PartKey, { name: string; body: string }>;
    view: string;
    photosAlt: (name: string) => string;
    /** "Rammer E68 alt gövde". */
    renderCaption: (model: string, name: string) => string;
    renderView: Record<'front' | 'rear' | 'side' | 'detail', string>;
    viewer: {
      open: string;
      close: string;
      hint: string;
      loading: string;
      error: string;
      cut: string;
      cutOff: string;
      cutLabel: string;
      cutHint: string;
    };
    series: { title: (series: string) => string; hint: string; prev: string; next: string };
    quoteTitle: string;
    quoteBody: string;
    modelLabel: string;
    modelPlaceholder: string;
    text: (part: string, model: string, qty: string) => string;
    noPhoto: string;
  };
  /** Under product pictures. */
  imgNote: string;
  /** Quality line under every product title. */
  oem: string;
  legal: { nav: string; agree: string; and: string };
  footer: {
    legal: string;
    docs: string;
    images: string;
    shop: string;
    company: string;
    contact: string;
  };
  notFound: { title: string; body: string; home: string };
}

export const DICT: Record<Lang, Dict> = {
  tr: {
    meta: {
      siteName: 'Kervan Mağaza',
      homeTitle: 'Hidrolik kırıcı uçları | Kervan Mağaza',
      homeDesc:
        'Kervan üretimi hidrolik kırıcı uçları: kırıcınızın marka ve modeline göre uç, fiyat teklifi.',
      listTitle: 'Tüm kırıcı uçları | Kervan Mağaza',
      listDesc: 'Marka ve modele göre tüm Kervan kırıcı uçları: çalışma çapı ve uç tipleri.',
      familyTitle: (code, d) => `${code} kırıcı ucu Ø${d} | Kervan Mağaza`,
      familyDesc: (code, d, types) => `${code}: Ø${d} mm kırıcı ucu (${types}).`,
      breakerTitle: (name, d) => `${name} kırıcı ucu${d ? ` Ø${d}` : ''} | Kervan Mağaza`,
      breakerDesc: (name, d, types) =>
        `${name} hidrolik kırıcı için Kervan ucu: ${d ? `Ø${d} mm, ` : ''}${types}.`,
      notFoundTitle: 'Sayfa bulunamadı | Kervan Mağaza',
      popularTitle: 'Çok satan kırıcı uçları | Kervan Mağaza',
      popularDesc: 'En çok sipariş edilen Kervan kırıcı uçları, kırıcı marka ve modeline göre.',
      brandTitle: (brand) => `${brand} kırıcı uçları | Kervan Mağaza`,
      brandDesc: (brand, n) => `${brand} hidrolik kırıcılar için Kervan uçları: ${n} model.`,
      partsTitle: 'Kırıcı yedek parçaları | Kervan Mağaza',
      partsDesc: 'Hidrolik kırıcı ucu, alt gövde, burç, kama, saplama ve piston: Kervan üretimi.',
      partTitle: (name) => `Kırıcı ${name.toLocaleLowerCase('tr')} | Kervan Mağaza`,
      partDesc: (name) =>
        `Hidrolik kırıcı ${name.toLocaleLowerCase('tr')}: Kervan üretimi, kırıcınızın modeline göre teklif.`,
      cartTitle: 'Palet | Kervan Mağaza',
    },
    nav: {
      label: 'Ana menü',
      tips: 'Kırıcı uçları',
      popular: 'Çok satanlar',
      catalogSite: 'Kurumsal',
      quote: 'Teklif iste',
      quoteText: 'Merhaba, kırıcı ucu için fiyat teklifi almak istiyorum.',
      parts: 'Yedek parçalar',
      call: 'Ara',
      cart: 'Palet',
      langLabel: 'English',
      langOther: 'EN',
    },
    top: {
      tagline: 'Hidrolik kırıcı ucu ve yedek parça üreticisi',
      shop: 'Kırıcı yedek parça mağazası',
    },
    banner: {
      preview: 'Online ödeme henüz yok: paletinizi sipariş talebi olarak gönderin, size dönelim.',
      demo: 'DEMO verisi: bu ürünler gerçek değildir.',
    },
    tip: {
      chisel: 'Keski',
      moil: 'Sivri',
      blunt: 'Küt',
      pyramid: 'Piramit',
      conical: 'Konik',
      asphalt: 'Asfalt',
    },
    home: {
      title: 'Hidrolik kırıcı ucu ve yedek parçaları',
      lead: 'Kendi tezgâhımızda işlenen, kendi tesisimizde ısıl işlem gören uçlar. Ölçüleri karşılaştırın, kırıcınıza uyan ucu seçin. Stoktan aynı gün kargo.',
      cta: 'Tüm uçlar',
      ctaQuote: 'Teklif iste',
      popular: 'Çok satanlar',
      featured: 'Uçlar',
      morePopular: 'Tüm çok satanlar',
      groups: 'Ürün gruplarımız',
      count: (n) => `${n} kırıcı modeli`,
      trust: [
        {
          title: 'Kendi üretimimiz',
          body: 'Kartepe’deki tesisimizde, orijinal ölçülerde ve OEM kalitesinde işlenir; aracı yoktur.',
        },
        {
          title: 'Kendi ısıl işlemimiz',
          body: 'Isıl işlem kendi fırınlarımızda, kontrollü olarak yapılır.',
        },
        {
          title: 'Modele göre seçim',
          body: 'Kırıcınızın marka ve modelini seçin, uyan ucu görün.',
        },
        {
          title: 'Stoktan aynı gün kargo',
          body: 'Stoktaki uçlar siparişiniz onaylandığı gün kargoya verilir.',
        },
      ],
      sectors: {
        title: 'Sizin işinizi yapanlar hangi ucu seçiyor?',
        lead: 'Sahada aynı işi yapan firmaların genellikle tercih ettiği uç tipleri.',
        typesLabel: 'Genellikle tercih edilen',
        note: 'Genel saha uygulamasıdır; kırıcı üreticisinin önerisi geçerlidir.',
        items: [
          {
            name: 'Taş ocağı',
            body: 'Sert kayada kırma ve iri blokların parçalanması.',
            types: ['pyramid', 'conical', 'blunt'],
          },
          {
            name: 'Maden',
            body: 'Cevher ve sert kaya; yüksek aşınma.',
            types: ['conical', 'moil'],
          },
          {
            name: 'Yıkım',
            body: 'Betonarme yapılar ve temel kırma.',
            types: ['moil', 'chisel'],
          },
          {
            name: 'Altyapı ve kazı',
            body: 'Kanal açma, katmanlı zemin ve asfalt.',
            types: ['chisel', 'asphalt', 'moil'],
          },
        ],
      },
    },
    card: { view: 'Ucu gör' },
    breaker: { title: (name) => `${name} kırıcı ucu` },
    list: {
      title: 'Tüm kırıcı uçları',
      lead: 'Kırıcınızın marka ve modelini bulun. En çok sipariş edilenler ayrı sayfada.',
      model: 'Kırıcı',
      diameter: 'Çalışma çapı',
      types: 'Uç tipleri',
    },
    popular: {
      title: 'Çok satanlar',
      lead: 'En çok sipariş edilen kırıcı uçları.',
    },
    family: {
      kicker: (d) => `Ø${d} mm hidrolik kırıcı ucu`,
      crumbHome: 'Ana sayfa',
      crumbLabel: 'Bulunduğunuz yer',
      diameter: 'Çalışma çapı',
      type: 'Uç tipi',
      qty: 'Adet',
      stockTitle: 'Stoğumuzdan',
      stockNote: 'Atölyemizdeki stoktan kırıcı uçları.',
      stockAlt: (i) => `Kervan atölyesinde stoktaki kırıcı uçları (${i})`,
      angle: 'Uç açısı',
      availability: 'Durum',
      inStock: (n) => (n >= 10 ? 'Stokta (10+)' : `Stokta (${n})`),
      lead: (days) => `Üretim ~${days} iş günü`,
      ask: 'Fiyat için sorun',
      askLead: 'Stoktan aynı gün kargo',
      carrier: 'Taşıyıcı (yaklaşık)',
      carrierValue: (min, max) => `${min}–${max} t ekskavatör`,
      carrierNote: 'Yaklaşık değerdir; kırıcı üreticisinin önerisi geçerlidir.',
      quoteTitle: 'Fiyat teklifi isteyin',
      quoteBody: 'Kırıcınız ve seçtiğiniz uç mesaja yazılır; size hemen dönelim.',
      whatsapp: 'WhatsApp ile sor',
      email: 'E-posta gönder',
      quoteText: (name, type, code, qty) =>
        `Merhaba, ${name} için ${type} kırıcı ucu${code ? ` (${code})` : ''}, ${qty} adet sipariş vermek istiyorum.`,
      renderAlt: (name, type) => `${name} ${type} kırıcı ucu`,
      sideAlt: (name, type) => `${name} ${type} kırıcı ucu, yandan görünüş`,
      rearAlt: (name) => `${name} kırıcı ucunun kama kanalı ve arka ucu, yakın görünüş`,
      viewRear: 'Kama kanalı ve arka uç',
    },
    search: {
      label: 'Kırıcı modeli ara',
      placeholder: 'Ör. HB 20G, MB 700, Furukawa F22',
      button: 'Ara',
      none: (q) => `"${q}" için model bulunamadı.`,
      count: (n) => `${n} model`,
      brands: 'Markalar',
      all: 'Tüm markalar',
    },
    missing: {
      title: 'Modeliniz listede yok mu, emin değil misiniz?',
      body: 'Kırıcınızın marka ve modelini, mümkünse ucun çapını ve bir fotoğrafını WhatsApp’tan gönderin; uyan ucu biz bulalım. Çap, ucun çalışan (ön) kısmında kumpasla ölçülür.',
      button: 'WhatsApp ile sor',
      text: 'Merhaba, kırıcımın markası/modeli: … Ölçtüğüm uç çapı: … mm. Fotoğraf ekliyorum.',
    },
    price: {
      label: 'Fiyat',
      fxNote: (date) => `TL fiyatı TCMB döviz satış kuruyla (${date}) hesaplanır.`,
      add: 'Palete yükle',
      added: 'Palete yüklendi',
      goCart: 'Palete git',
    },
    cart: {
      title: 'Palet',
      empty: 'Paletiniz boş.',
      browse: 'Kırıcı uçlarına göz atın',
      product: 'Ürün',
      qty: 'Adet',
      unit: 'Birim fiyat (KDV hariç)',
      lineTotal: 'Tutar',
      ask: 'Fiyat sorulacak',
      total: 'Toplam (KDV dahil)',
      subtotal: 'Ara toplam (KDV hariç)',
      vat: (pct) => `KDV (%${pct})`,
      totalNote: 'Fiyatı sorulacak ürünler toplama dahil değildir.',
      remove: (name) => `${name} ürününü paletten indir`,
      less: 'Bir azalt',
      more: 'Bir artır',
      contactTitle: 'İletişim bilgileriniz',
      name: 'Ad soyad',
      company: 'Firma',
      phone: 'Telefon',
      city: 'Şehir',
      note: 'Not',
      sendWa: 'Sipariş talebini WhatsApp ile gönder',
      sendMail: 'E-posta ile gönder',
      clear: 'Paleti boşalt',
      info: 'Online ödeme henüz yok: sipariş talebinizi alınca size dönüyoruz; ödeme kredi kartı veya havale/EFT ile. Stoktaki ürünler aynı gün kargoya verilir; kargo ücreti alıcıya aittir. Bilgileriniz yalnız bu mesaja yazılır, sitede saklanmaz.',
      message: (lines, total, contact) =>
        [
          'Merhaba, sipariş talebim:',
          ...lines,
          total,
          ...(contact.length ? ['', ...contact] : []),
        ].join('\n'),
    },
    brand: {
      title: (brand) => `${brand} kırıcı uçları`,
      lead: (n) => `${n} model. Kırıcınızın modelini seçin.`,
    },
    terms: {
      title: 'Satış koşulları',
      rows: [
        ['Kalite', 'OEM kalitesinde, orijinal ölçülerde'],
        ['Kargo', 'Kargo ücreti alıcıya aittir'],
        ['Ödeme', 'Kredi kartı veya havale/EFT'],
        ['Garanti', 'Teslimden itibaren 3 ay, malzeme ve üretim hatalarına karşı'],
      ],
      note: 'Ürünlerimiz Kervan Makina üretimidir, kırıcı üreticisinin orijinal parçası değildir; marka ve model adları yalnızca uyumu belirtir. Garanti malzeme ve üretim (ısıl işlem dahil) hatalarını kapsar; normal aşınma, boşta vuruş, ucu levye gibi kullanma, yanal veya eğik vuruş, aşınmış burç ile çalışma, yağlamasız kullanma ve yanlış uç seçiminden doğan hasarlar kapsam dışıdır. İnceleme için kırık parça ve fotoğrafları istenir.',
    },
    parts: {
      title: 'Kırıcı yedek parçaları',
      lead: 'Kırıcı ucunun yanında alt gövde, burç, kama, saplama ve piston da üretip satıyoruz. Kırıcınızın marka ve modelini yazın, fiyatı hemen iletelim.',
      tips: {
        name: 'Kırıcı ucu',
        body: 'Keski, sivri, küt, piramit ve konik uçlar; kırıcı modeline göre.',
      },
      items: {
        'alt-govde': {
          name: 'Alt gövde',
          body: 'Ucu ve burçları taşıyan alt gövde (ön kafa). Aşınmış ya da çatlamış gövdenin yerine.',
        },
        burc: {
          name: 'Burç',
          body: 'Ucu yönlendiren alt ve üst burçlar. Aşınmış burç ucu erken kırar; uçla birlikte kontrol edin.',
        },
        kama: { name: 'Kama', body: 'Ucu gövdede tutan kamalar ve tutucu pimler.' },
        saplama: {
          name: 'Saplama',
          body: 'Kırıcı gövdesini bir arada tutan saplamalar, somun ve pullarıyla.',
        },
        piston: { name: 'Piston', body: 'Kırıcının darbe pistonu; kırıcı modeline göre.' },
      },
      view: 'İncele',
      photosAlt: (name) =>
        `Kervan atölyesinde stoktaki kırıcı ${name.toLocaleLowerCase('tr')} parçaları`,
      renderCaption: (model, name) => `${model} ${name.toLocaleLowerCase('tr')}`,
      renderView: {
        front: 'ön görünüş',
        rear: 'arka görünüş',
        side: 'yan görünüş',
        detail: 'saplama somunu penceresi',
      },
      viewer: {
        open: '3B incele',
        close: 'Görsele dön',
        hint: 'Sürükleyerek çevirin, iki parmakla ya da tekerlekle yakınlaştırın; ok tuşlarıyla da çevrilir.',
        loading: '3B model yükleniyor…',
        error: '3B model açılamadı.',
        cut: 'Kesit',
        cutOff: 'Kesiti kapat',
        cutLabel: 'Kesit konumu',
        cutHint: 'Sürgüyü sağa sola kaydırın: parça baştan sona kesilerek iç yapısı görünür.',
      },
      series: {
        title: (series) => `${series} modelleri`,
        hint: 'Modeli seçmek için yana kaydırın.',
        prev: 'Önceki model',
        next: 'Sonraki model',
      },
      quoteTitle: 'Fiyat teklifi isteyin',
      quoteBody: 'Kırıcınızın marka ve modelini yazın; mesaja eklenir.',
      modelLabel: 'Kırıcı marka ve modeli',
      modelPlaceholder: 'Ör. Furukawa HB 20G',
      text: (part, model, qty) =>
        `Merhaba, ${model || '(kırıcı modeli)'} için ${part.toLocaleLowerCase('tr')}, ${qty} adet için fiyat almak istiyorum.`,
      noPhoto: 'Fotoğraf yakında',
    },
    imgNote: 'Görseller temsilidir.',
    oem: 'OEM / orijinal kalitesinde, orijinal ölçülerde üretilir.',
    legal: {
      nav: 'Yasal metinler',
      agree: 'Sipariş talebi göndererek aşağıdaki metinleri okuduğunuzu kabul edersiniz:',
      and: 've',
    },
    footer: {
      legal: 'Üretici ve satıcı',
      docs: 'Yasal',
      shop: 'Mağaza',
      company: 'Kurumsal',
      contact: 'İletişim',
      images:
        '© Kervan Makina. Ürün görselleri Kervan Makina’ya aittir, temsilidir; izinsiz kullanılamaz.',
    },
    notFound: {
      title: 'Sayfa bulunamadı',
      body: 'Aradığınız sayfa yok ya da taşındı.',
      home: 'Ana sayfaya dön',
    },
  },
  en: {
    meta: {
      siteName: 'Kervan Shop',
      homeTitle: 'Hydraulic breaker tips | Kervan Shop',
      homeDesc:
        'Hydraulic breaker tips made by Kervan: find the tip for your breaker make and model.',
      listTitle: 'All breaker tips | Kervan Shop',
      listDesc:
        'All Kervan breaker tips by breaker make and model: working diameter and tip types.',
      familyTitle: (code, d) => `${code} breaker tip Ø${d} | Kervan Shop`,
      familyDesc: (code, d, types) => `${code}: Ø${d} mm breaker tip (${types}).`,
      breakerTitle: (name, d) => `${name} breaker tip${d ? ` Ø${d}` : ''} | Kervan Shop`,
      breakerDesc: (name, d, types) =>
        `Kervan tip for the ${name} hydraulic breaker: ${d ? `Ø${d} mm, ` : ''}${types}.`,
      notFoundTitle: 'Page not found | Kervan Shop',
      popularTitle: 'Best-selling breaker tips | Kervan Shop',
      popularDesc: 'The most ordered Kervan breaker tips, by breaker make and model.',
      brandTitle: (brand) => `${brand} breaker tips | Kervan Shop`,
      brandDesc: (brand, n) => `Kervan tips for ${brand} hydraulic breakers: ${n} models.`,
      partsTitle: 'Breaker spare parts | Kervan Shop',
      partsDesc:
        'Hydraulic breaker tips, front heads, bushings, retainer keys, tie rods and pistons made by Kervan.',
      partTitle: (name) => `Breaker ${name.toLowerCase()} | Kervan Shop`,
      partDesc: (name) =>
        `Hydraulic breaker ${name.toLowerCase()} made by Kervan; quotes by breaker model.`,
      cartTitle: 'Pallet | Kervan Shop',
    },
    nav: {
      label: 'Main menu',
      tips: 'Breaker tips',
      popular: 'Best sellers',
      catalogSite: 'Company',
      quote: 'Request a quote',
      quoteText: 'Hello, I would like a quote for a breaker tip.',
      parts: 'Spare parts',
      call: 'Call',
      cart: 'Pallet',
      langLabel: 'Türkçe',
      langOther: 'TR',
    },
    top: {
      tagline: 'Hydraulic breaker tip and spare parts maker',
      shop: 'Breaker spare parts shop',
    },
    banner: {
      preview:
        'No online payment yet: send your pallet as an order request and we will get back to you.',
      demo: 'DEMO data: these products are not real.',
    },
    tip: {
      chisel: 'Chisel',
      moil: 'Moil',
      blunt: 'Blunt',
      pyramid: 'Pyramid',
      conical: 'Conical',
      asphalt: 'Asphalt',
    },
    home: {
      title: 'Hydraulic breaker tips and spare parts',
      lead: 'Machined on our own lathes and heat-treated in our own plant. Compare the dimensions, pick the tip for your breaker. Ships from stock the same day.',
      cta: 'All tips',
      ctaQuote: 'Request a quote',
      popular: 'Best sellers',
      featured: 'Tips',
      morePopular: 'All best sellers',
      groups: 'Our product groups',
      count: (n) => `${n} breaker models`,
      trust: [
        {
          title: 'Our own production',
          body: 'Machined in our plant in Kartepe, Türkiye, to original dimensions and OEM quality; no middlemen.',
        },
        {
          title: 'Our own heat treatment',
          body: 'Heat-treated in our own furnaces, under control.',
        },
        {
          title: 'Chosen by model',
          body: 'Pick your breaker make and model and see the tip that fits.',
        },
        {
          title: 'Ships from stock the same day',
          body: 'Tips in stock ship the day your order is confirmed.',
        },
      ],
      sectors: {
        title: 'Which tip do people doing your work choose?',
        lead: 'The tip types companies doing the same work usually choose on site.',
        typesLabel: 'Usually chosen',
        note: 'General site practice; the breaker maker’s recommendation comes first.',
        items: [
          {
            name: 'Quarrying',
            body: 'Breaking hard rock and oversize boulders.',
            types: ['pyramid', 'conical', 'blunt'],
          },
          { name: 'Mining', body: 'Ore and hard rock; high wear.', types: ['conical', 'moil'] },
          {
            name: 'Demolition',
            body: 'Reinforced concrete and foundations.',
            types: ['moil', 'chisel'],
          },
          {
            name: 'Utilities and excavation',
            body: 'Trenching, layered ground and asphalt.',
            types: ['chisel', 'asphalt', 'moil'],
          },
        ],
      },
    },
    card: { view: 'View tip' },
    breaker: { title: (name) => `${name} breaker tip` },
    list: {
      title: 'All breaker tips',
      lead: 'Find your breaker make and model. The most ordered tips have their own page.',
      model: 'Breaker',
      diameter: 'Working diameter',
      types: 'Tip types',
    },
    popular: {
      title: 'Best sellers',
      lead: 'The most ordered breaker tips.',
    },
    family: {
      kicker: (d) => `Ø${d} mm hydraulic breaker tip`,
      crumbHome: 'Home',
      crumbLabel: 'Breadcrumb',
      diameter: 'Working diameter',
      type: 'Tip type',
      qty: 'Quantity',
      stockTitle: 'From our stock',
      stockNote: 'Breaker tips in stock at our plant.',
      stockAlt: (i) => `Breaker tips in stock at the Kervan plant (${i})`,
      angle: 'Tip angle',
      availability: 'Availability',
      inStock: (n) => (n >= 10 ? 'In stock (10+)' : `In stock (${n})`),
      lead: (days) => `Made to order, ~${days} working days`,
      ask: 'Price on request',
      askLead: 'Ships from stock the same day',
      carrier: 'Carrier (approx.)',
      carrierValue: (min, max) => `${min}–${max} t excavator`,
      carrierNote: 'Approximate; the breaker maker’s recommendation wins.',
      quoteTitle: 'Request a quote',
      quoteBody: 'Your breaker and the tip you chose go into the message; we reply right away.',
      whatsapp: 'Ask on WhatsApp',
      email: 'Send an e-mail',
      quoteText: (name, type, code, qty) =>
        `Hello, I would like to order the ${type} tip${code ? ` (${code})` : ''} for the ${name}, quantity ${qty}.`,
      renderAlt: (name, type) => `${name} ${type} breaker tip`,
      sideAlt: (name, type) => `${name} ${type} breaker tip, side view`,
      rearAlt: (name) => `${name} breaker tip key slot and rear end, close-up`,
      viewRear: 'Key slot and rear end',
    },
    search: {
      label: 'Search breaker model',
      placeholder: 'E.g. HB 20G, MB 700, Furukawa F22',
      button: 'Search',
      none: (q) => `No model found for "${q}".`,
      count: (n) => `${n} models`,
      brands: 'Makes',
      all: 'All makes',
    },
    missing: {
      title: 'Model not listed, or not sure?',
      body: 'Send your breaker make and model, if possible the tip diameter and a photo, on WhatsApp; we will find the tip that fits. Measure the diameter with a caliper on the working (front) part of the tip.',
      button: 'Ask on WhatsApp',
      text: 'Hello, my breaker make/model: … Tip diameter I measured: … mm. Photo attached.',
    },
    price: {
      label: 'Price',
      fxNote: (date) => `TRY prices use the CBRT USD selling rate of ${date}.`,
      add: 'Load onto pallet',
      added: 'Loaded onto pallet',
      goCart: 'Go to pallet',
    },
    cart: {
      title: 'Pallet',
      empty: 'Your pallet is empty.',
      browse: 'Browse breaker tips',
      product: 'Product',
      qty: 'Qty',
      unit: 'Unit price (excl. VAT)',
      lineTotal: 'Amount',
      ask: 'Price on request',
      total: 'Total (incl. VAT)',
      subtotal: 'Subtotal (excl. VAT)',
      vat: (pct) => `VAT (${pct}%)`,
      totalNote: 'Products priced on request are not in the total.',
      remove: (name) => `Remove ${name} from the pallet`,
      less: 'One less',
      more: 'One more',
      contactTitle: 'Your contact details',
      name: 'Name',
      company: 'Company',
      phone: 'Phone',
      city: 'City',
      note: 'Note',
      sendWa: 'Send the order request on WhatsApp',
      sendMail: 'Send by e-mail',
      clear: 'Empty the pallet',
      info: 'No online payment yet: once we receive your request we get back to you; payment by credit card or bank transfer. Items in stock ship the same day; shipping is paid by the buyer. Your details only go into this message; the site does not store them.',
      message: (lines, total, contact) =>
        [
          'Hello, my order request:',
          ...lines,
          total,
          ...(contact.length ? ['', ...contact] : []),
        ].join('\n'),
    },
    brand: {
      title: (brand) => `${brand} breaker tips`,
      lead: (n) => `${n} models. Pick your breaker model.`,
    },
    terms: {
      title: 'Terms of sale',
      rows: [
        ['Quality', 'OEM quality, original dimensions'],
        ['Shipping', 'Paid by the buyer'],
        ['Payment', 'Credit card or bank transfer'],
        ['Warranty', '3 months from delivery, against material and manufacturing defects'],
      ],
      note: 'Our products are made by Kervan Makina and are not the breaker maker’s original parts; make and model names only show the fit. The warranty covers material and manufacturing (including heat treatment) defects; normal wear, blank firing, prying with the tip, side or angled strikes, working with a worn bushing, running without grease and choosing the wrong tip are not covered. We ask for the broken part and photos to assess a claim.',
    },
    parts: {
      title: 'Breaker spare parts',
      lead: 'Besides tips we make and sell front heads, bushings, retainer keys, tie rods and pistons. Send your breaker make and model and we reply with the price right away.',
      tips: {
        name: 'Breaker tips',
        body: 'Chisel, moil, blunt, pyramid and conical tips, by breaker model.',
      },
      items: {
        'alt-govde': {
          name: 'Front head',
          body: 'The lower body that holds the tip and bushings; replaces a worn or cracked one.',
        },
        burc: {
          name: 'Bushings',
          body: 'Upper and lower bushings that guide the tip. A worn bushing breaks tips early; check both together.',
        },
        kama: {
          name: 'Retainer keys',
          body: 'Keys and retainer pins that hold the tip in the front head.',
        },
        saplama: {
          name: 'Tie rods',
          body: 'Tie rods that hold the breaker body together, with nuts and washers.',
        },
        piston: { name: 'Pistons', body: 'The breaker’s impact piston, by breaker model.' },
      },
      view: 'View',
      photosAlt: (name) => `${name} in stock at the Kervan plant`,
      renderCaption: (model, name) => `${model} ${name.toLowerCase()}`,
      renderView: {
        front: 'front view',
        rear: 'rear view',
        side: 'side view',
        detail: 'tie-rod nut window',
      },
      viewer: {
        open: 'View in 3D',
        close: 'Back to the picture',
        hint: 'Drag to turn, pinch or scroll to zoom; the arrow keys turn it too.',
        loading: 'Loading the 3D model…',
        error: 'The 3D model could not be opened.',
        cut: 'Section',
        cutOff: 'Hide the section',
        cutLabel: 'Section position',
        cutHint: 'Move the slider left and right to cut the part from end to end and see inside.',
      },
      series: {
        title: (series) => `${series} models`,
        hint: 'Swipe sideways to pick a model.',
        prev: 'Previous model',
        next: 'Next model',
      },
      quoteTitle: 'Request a quote',
      quoteBody: 'Type your breaker make and model; it goes into the message.',
      modelLabel: 'Breaker make and model',
      modelPlaceholder: 'E.g. Furukawa HB 20G',
      text: (part, model, qty) =>
        `Hello, I would like the price of ${part.toLowerCase()} for the ${model || '(breaker model)'}, quantity ${qty}.`,
      noPhoto: 'Photo coming soon',
    },
    imgNote: 'Images are for illustration.',
    oem: 'Made to OEM / original quality and original dimensions.',
    legal: {
      nav: 'Legal',
      agree: 'By sending an order request you confirm you have read:',
      and: 'and',
    },
    footer: {
      legal: 'Manufacturer and seller',
      docs: 'Legal',
      shop: 'Shop',
      company: 'Company',
      contact: 'Contact',
      images:
        '© Kervan Makina. Product images belong to Kervan Makina and are illustrations; do not use without permission.',
    },
    notFound: {
      title: 'Page not found',
      body: 'The page does not exist or has moved.',
      home: 'Back to the home page',
    },
  },
};
