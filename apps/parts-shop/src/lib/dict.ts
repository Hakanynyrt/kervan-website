import type { TipType } from '@kervan/tips';
import type { Lang } from '../types';

export interface Dict {
  meta: {
    siteName: string;
    homeTitle: string;
    homeDesc: string;
    listTitle: string;
    listDesc: string;
    familyTitle: (code: string, d: string, fits: string) => string;
    familyDesc: (code: string, d: string, types: string) => string;
    notFoundTitle: string;
    popularTitle: string;
    popularDesc: string;
  };
  nav: {
    label: string;
    tips: string;
    popular: string;
    catalogSite: string;
    quote: string;
    quoteText: string;
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
  card: { fits: string; more: (n: number) => string; view: string };
  popular: { title: string; lead: string };
  list: {
    title: string;
    lead: string;
    code: string;
    diameter: string;
    types: string;
    fits: string;
  };
  family: {
    kicker: (d: string) => string;
    crumbHome: string;
    crumbLabel: string;
    dims: string;
    diameter: string;
    collar: string;
    keyCount: string;
    keyThickness: string;
    slotLength: string;
    backEndToSlot: string;
    slotEnd: string;
    slotRounded: string;
    slotTapered: string;
    rearStep: string;
    yes: string;
    no: string;
    rearDiameter: string;
    variants: string;
    type: string;
    length: string;
    weight: string;
    angle: string;
    availability: string;
    inStock: (n: number) => string;
    lead: (days: number) => string;
    ask: string;
    fits: string;
    carrier: string;
    carrierValue: (min: number, max: number) => string;
    carrierNote: string;
    quoteTitle: string;
    quoteBody: string;
    whatsapp: string;
    email: string;
    whatsappText: (code: string) => string;
    measureNote: string;
    renderNote: string;
    renderAlt: (code: string, type: string) => string;
    sideAlt: (code: string, type: string) => string;
    rearAlt: (code: string) => string;
    viewRear: string;
    marks: string;
  };
  footer: {
    legal: string;
    kvkk: string;
    marks: string;
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
        'Kervan üretimi hidrolik kırıcı uçları: ölçüler, uyumlu kırıcılar ve fiyat teklifi.',
      listTitle: 'Tüm kırıcı uçları | Kervan Mağaza',
      listDesc: 'Kervan kırıcı uçlarının tam listesi: çap, uç tipleri ve uyumlu kırıcılar.',
      familyTitle: (code, d, fits) =>
        `${code} kırıcı ucu Ø${d}${fits ? ` – ${fits}` : ''} | Kervan Mağaza`,
      familyDesc: (code, d, types) =>
        `${code}: Ø${d} mm kırıcı ucu (${types}). Ölçü tablosu ve uyumlu kırıcılar.`,
      notFoundTitle: 'Sayfa bulunamadı | Kervan Mağaza',
      popularTitle: 'Çok satan kırıcı uçları | Kervan Mağaza',
      popularDesc:
        'En çok sipariş edilen Kervan kırıcı uçları: çap, uç tipleri ve uyumlu kırıcılar.',
    },
    nav: {
      label: 'Ana menü',
      tips: 'Kırıcı uçları',
      popular: 'Çok satanlar',
      catalogSite: 'Kurumsal',
      quote: 'Teklif iste',
      quoteText: 'Merhaba, kırıcı ucu için fiyat teklifi almak istiyorum.',
      langLabel: 'English',
      langOther: 'EN',
    },
    top: { tagline: 'Hidrolik kırıcı ucu üreticisi', shop: 'Kırıcı ucu mağazası' },
    banner: {
      preview: 'Önizleme: mağaza hazırlanıyor, henüz sipariş alınmıyor. Fiyat için bize yazın.',
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
      title: 'Hidrolik kırıcı uçları',
      lead: 'Kendi tezgâhımızda işlenen, kendi tesisimizde ısıl işlem gören uçlar. Ölçüleri karşılaştırın, kırıcınıza uyan ucu seçin; fiyat ve teslim süresini doğrudan bize sorun.',
      cta: 'Tüm uçlar',
      ctaQuote: 'Teklif iste',
      popular: 'Çok satanlar',
      featured: 'Uçlar',
      morePopular: 'Tüm çok satanlar',
      count: (n) => `${n} uç ailesi`,
      trust: [
        {
          title: 'Kendi üretimimiz',
          body: 'Uçlar Kartepe’deki tesisimizde işlenir; aracı yoktur.',
        },
        {
          title: 'Kendi ısıl işlemimiz',
          body: 'Isıl işlem kendi fırınlarımızda, kontrollü olarak yapılır.',
        },
        {
          title: 'Ölçüyle seçim',
          body: 'Her uç için kama kanalı, arka uç ve gövde ölçüleri.',
        },
        {
          title: 'Doğrudan teklif',
          body: 'Fiyat ve teslim süresi için üreticiye doğrudan yazın.',
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
    card: {
      fits: 'Uyumlu',
      more: (n) => `+${n} kırıcı`,
      view: 'Ölçüleri gör',
    },
    list: {
      title: 'Tüm kırıcı uçları',
      lead: 'Çapa göre sıralıdır. En çok sipariş edilenler ayrı sayfada.',
      code: 'Kod',
      diameter: 'Çap',
      types: 'Tipler',
      fits: 'Uyumlu kırıcılar',
    },
    popular: {
      title: 'Çok satanlar',
      lead: 'En çok sipariş edilen uç aileleri. Kırıcınızın çapına uyanı seçin.',
    },
    family: {
      kicker: (d) => `Ø${d} mm hidrolik kırıcı ucu`,
      crumbHome: 'Ana sayfa',
      crumbLabel: 'Bulunduğunuz yer',
      dims: 'Gövde ölçüleri',
      diameter: 'Çalışma çapı (D)',
      collar: 'Yaka çapı',
      keyCount: 'Kama yuvası sayısı',
      keyThickness: 'Kama kalınlığı',
      slotLength: 'Kama yuvası boyu',
      backEndToSlot: 'Arka uç – kama yuvası',
      slotEnd: 'Kama yuvası ucu',
      slotRounded: 'Yuvarlak',
      slotTapered: 'Konik rampa',
      rearStep: 'Arka kademe',
      yes: 'Var',
      no: 'Yok',
      rearDiameter: 'Arka çap',
      variants: 'Uç tipleri',
      type: 'Tip',
      length: 'Boy',
      weight: 'Ağırlık',
      angle: 'Uç açısı',
      availability: 'Durum',
      inStock: (n) => (n >= 10 ? 'Stokta (10+)' : `Stokta (${n})`),
      lead: (days) => `Üretim ~${days} iş günü`,
      ask: 'Fiyat ve süre için sorun',
      fits: 'Uyumlu kırıcılar',
      carrier: 'Taşıyıcı (yaklaşık)',
      carrierValue: (min, max) => `${min}–${max} t ekskavatör`,
      carrierNote: 'Yaklaşık değerdir; kırıcı üreticisinin önerisi geçerlidir.',
      quoteTitle: 'Fiyat teklifi isteyin',
      quoteBody: 'Kodu ve kırıcınızın modelini yazın; fiyat ve teslim süresini iletelim.',
      whatsapp: 'WhatsApp ile sor',
      email: 'E-posta gönder',
      whatsappText: (code) =>
        `Merhaba, ${code} kırıcı ucu için fiyat ve teslim süresi öğrenmek istiyorum.`,
      measureNote:
        'Ölçüler tablodaki gibidir. Sipariş vermeden önce eski ucunuzla ve kırıcınızın modeliyle karşılaştırın.',
      renderNote: 'Temsili görsel: ölçülerden üretilmiştir. Ölçüler tablodaki gibidir.',
      renderAlt: (code, type) =>
        `${code} ${type} kırıcı ucu, ölçülerinden üretilmiş temsili görsel`,
      sideAlt: (code, type) => `${code} ${type} kırıcı ucu, yandan görünüş (temsili)`,
      rearAlt: (code) => `${code} kırıcı ucunun kama kanalı ve arka ucu, yakın görünüş (temsili)`,
      viewRear: 'Kama kanalı ve arka uç',
      marks:
        'Kırıcı marka ve model adları yalnız uyumu belirtmek içindir; markalar sahiplerine aittir.',
    },
    footer: {
      legal: 'Üretici ve satıcı',
      kvkk: 'KVKK aydınlatma metni',
      marks: 'Markalar sahiplerine aittir.',
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
      homeDesc: 'Hydraulic breaker tips made by Kervan: dimensions, fitting breakers and quotes.',
      listTitle: 'All breaker tips | Kervan Shop',
      listDesc: 'The full list of Kervan breaker tips: diameter, tip types and fitting breakers.',
      familyTitle: (code, d, fits) =>
        `${code} breaker tip Ø${d}${fits ? ` – ${fits}` : ''} | Kervan Shop`,
      familyDesc: (code, d, types) =>
        `${code}: Ø${d} mm breaker tip (${types}). Dimension table and fitting breakers.`,
      notFoundTitle: 'Page not found | Kervan Shop',
      popularTitle: 'Best-selling breaker tips | Kervan Shop',
      popularDesc:
        'The most ordered Kervan breaker tips: diameter, tip types and fitting breakers.',
    },
    nav: {
      label: 'Main menu',
      tips: 'Breaker tips',
      popular: 'Best sellers',
      catalogSite: 'Company',
      quote: 'Request a quote',
      quoteText: 'Hello, I would like a quote for a breaker tip.',
      langLabel: 'Türkçe',
      langOther: 'TR',
    },
    top: { tagline: 'Hydraulic breaker tip manufacturer', shop: 'Breaker tip shop' },
    banner: {
      preview:
        'Preview: the shop is being prepared and does not take orders yet. Write to us for prices.',
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
      title: 'Hydraulic breaker tips',
      lead: 'Machined on our own lathes and heat-treated in our own plant. Compare the dimensions, pick the tip for your breaker and ask us directly for price and delivery time.',
      cta: 'All tips',
      ctaQuote: 'Request a quote',
      popular: 'Best sellers',
      featured: 'Tips',
      morePopular: 'All best sellers',
      count: (n) => `${n} tip families`,
      trust: [
        {
          title: 'Our own production',
          body: 'Machined in our plant in Kartepe, Türkiye; no middlemen.',
        },
        {
          title: 'Our own heat treatment',
          body: 'Heat-treated in our own furnaces, under control.',
        },
        {
          title: 'Chosen by dimensions',
          body: 'Key slot, back end and body dimensions for every tip.',
        },
        { title: 'Direct quotes', body: 'Write to the manufacturer for price and delivery time.' },
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
    card: {
      fits: 'Fits',
      more: (n) => `+${n} breakers`,
      view: 'See dimensions',
    },
    list: {
      title: 'All breaker tips',
      lead: 'Sorted by diameter. The most ordered tips have their own page.',
      code: 'Code',
      diameter: 'Diameter',
      types: 'Types',
      fits: 'Fitting breakers',
    },
    popular: {
      title: 'Best sellers',
      lead: 'The most ordered tip families. Pick the one that matches your breaker.',
    },
    family: {
      kicker: (d) => `Ø${d} mm hydraulic breaker tip`,
      crumbHome: 'Home',
      crumbLabel: 'Breadcrumb',
      dims: 'Shank dimensions',
      diameter: 'Working diameter (D)',
      collar: 'Collar diameter',
      keyCount: 'Key slots',
      keyThickness: 'Key thickness',
      slotLength: 'Key slot length',
      backEndToSlot: 'Back end to slot',
      slotEnd: 'Slot end',
      slotRounded: 'Rounded',
      slotTapered: 'Tapered ramp',
      rearStep: 'Rear step',
      yes: 'Yes',
      no: 'No',
      rearDiameter: 'Rear diameter',
      variants: 'Tip types',
      type: 'Type',
      length: 'Length',
      weight: 'Weight',
      angle: 'Tip angle',
      availability: 'Availability',
      inStock: (n) => (n >= 10 ? 'In stock (10+)' : `In stock (${n})`),
      lead: (days) => `Made to order, ~${days} working days`,
      ask: 'Ask for price and lead time',
      fits: 'Fitting breakers',
      carrier: 'Carrier (approx.)',
      carrierValue: (min, max) => `${min}–${max} t excavator`,
      carrierNote: 'Approximate; the breaker maker’s recommendation wins.',
      quoteTitle: 'Ask for a quote',
      quoteBody: 'Send the code and your breaker model; we will reply with price and lead time.',
      whatsapp: 'Ask on WhatsApp',
      email: 'Send an email',
      whatsappText: (code) =>
        `Hello, I would like the price and lead time for breaker tip ${code}.`,
      measureNote:
        'Dimensions are as in the table. Compare them with your old tip and your breaker model before ordering.',
      renderNote: 'Illustration generated from the dimensions. The table is binding.',
      renderAlt: (code, type) =>
        `${code} ${type} breaker tip, illustration generated from its dimensions`,
      sideAlt: (code, type) => `${code} ${type} breaker tip, side view (illustration)`,
      rearAlt: (code) => `${code} breaker tip key slot and rear end, close-up (illustration)`,
      viewRear: 'Key slot and rear end',
      marks: 'Breaker brand and model names only indicate fit; the marks belong to their owners.',
    },
    footer: {
      legal: 'Manufacturer and seller',
      kvkk: 'Privacy notice (KVKK)',
      marks: 'Marks belong to their owners.',
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
