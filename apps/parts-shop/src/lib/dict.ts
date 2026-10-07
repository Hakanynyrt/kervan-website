import type { TipType } from '@kervan/tips';
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
    option: string;
    type: string;
    code: string;
    angle: string;
    availability: string;
    inStock: (n: number) => string;
    lead: (days: number) => string;
    ask: string;
    carrier: string;
    carrierValue: (min: number, max: number) => string;
    carrierNote: string;
    quoteTitle: string;
    quoteBody: string;
    whatsapp: string;
    email: string;
    quoteText: (name: string, type: string, code: string) => string;
    renderNote: string;
    renderAlt: (name: string, type: string) => string;
    sideAlt: (name: string, type: string) => string;
    rearAlt: (name: string) => string;
    viewRear: string;
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
        'Kervan üretimi hidrolik kırıcı uçları: kırıcınızın marka ve modeline göre uç, fiyat teklifi.',
      listTitle: 'Tüm kırıcı uçları | Kervan Mağaza',
      listDesc: 'Marka ve modele göre tüm Kervan kırıcı uçları: çalışma çapı ve uç tipleri.',
      familyTitle: (code, d) => `${code} kırıcı ucu Ø${d} | Kervan Mağaza`,
      familyDesc: (code, d, types) => `${code}: Ø${d} mm kırıcı ucu (${types}).`,
      breakerTitle: (name, d) => `${name} kırıcı ucu Ø${d} | Kervan Mağaza`,
      breakerDesc: (name, d, types) =>
        `${name} hidrolik kırıcı için Kervan ucu: Ø${d} mm, ${types}. Fiyat teklifi isteyin.`,
      notFoundTitle: 'Sayfa bulunamadı | Kervan Mağaza',
      popularTitle: 'Çok satan kırıcı uçları | Kervan Mağaza',
      popularDesc: 'En çok sipariş edilen Kervan kırıcı uçları, kırıcı marka ve modeline göre.',
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
      count: (n) => `${n} kırıcı modeli`,
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
      option: 'Uç kodu',
      type: 'Uç tipi',
      code: 'Kod',
      angle: 'Uç açısı',
      availability: 'Durum',
      inStock: (n) => (n >= 10 ? 'Stokta (10+)' : `Stokta (${n})`),
      lead: (days) => `Üretim ~${days} iş günü`,
      ask: 'Fiyat ve süre için sorun',
      carrier: 'Taşıyıcı (yaklaşık)',
      carrierValue: (min, max) => `${min}–${max} t ekskavatör`,
      carrierNote: 'Yaklaşık değerdir; kırıcı üreticisinin önerisi geçerlidir.',
      quoteTitle: 'Fiyat teklifi isteyin',
      quoteBody: 'Kırıcınız ve seçtiğiniz uç mesaja yazılır; fiyat ve teslim süresini iletelim.',
      whatsapp: 'WhatsApp ile sor',
      email: 'E-posta gönder',
      quoteText: (name, type, code) =>
        `Merhaba, ${name} için ${type} kırıcı ucu (${code}) fiyat ve teslim süresi öğrenmek istiyorum.`,
      renderNote: 'Temsili görsel: ucun ölçülerinden üretilmiştir.',
      renderAlt: (name, type) => `${name} ${type} kırıcı ucu, temsili görsel`,
      sideAlt: (name, type) => `${name} ${type} kırıcı ucu, yandan görünüş (temsili)`,
      rearAlt: (name) => `${name} kırıcı ucunun kama kanalı ve arka ucu, yakın görünüş (temsili)`,
      viewRear: 'Kama kanalı ve arka uç',
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
      homeDesc:
        'Hydraulic breaker tips made by Kervan: find the tip for your breaker make and model.',
      listTitle: 'All breaker tips | Kervan Shop',
      listDesc:
        'All Kervan breaker tips by breaker make and model: working diameter and tip types.',
      familyTitle: (code, d) => `${code} breaker tip Ø${d} | Kervan Shop`,
      familyDesc: (code, d, types) => `${code}: Ø${d} mm breaker tip (${types}).`,
      breakerTitle: (name, d) => `${name} breaker tip Ø${d} | Kervan Shop`,
      breakerDesc: (name, d, types) =>
        `Kervan tip for the ${name} hydraulic breaker: Ø${d} mm, ${types}. Request a quote.`,
      notFoundTitle: 'Page not found | Kervan Shop',
      popularTitle: 'Best-selling breaker tips | Kervan Shop',
      popularDesc: 'The most ordered Kervan breaker tips, by breaker make and model.',
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
      count: (n) => `${n} breaker models`,
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
      option: 'Tip code',
      type: 'Tip type',
      code: 'Code',
      angle: 'Tip angle',
      availability: 'Availability',
      inStock: (n) => (n >= 10 ? 'In stock (10+)' : `In stock (${n})`),
      lead: (days) => `Made to order, ~${days} working days`,
      ask: 'Ask for price and lead time',
      carrier: 'Carrier (approx.)',
      carrierValue: (min, max) => `${min}–${max} t excavator`,
      carrierNote: 'Approximate; the breaker maker’s recommendation wins.',
      quoteTitle: 'Request a quote',
      quoteBody:
        'Your breaker and the tip you chose go into the message; we reply with price and lead time.',
      whatsapp: 'Ask on WhatsApp',
      email: 'Send an e-mail',
      quoteText: (name, type, code) =>
        `Hello, I would like the price and lead time of the ${type} tip (${code}) for the ${name}.`,
      renderNote: 'Illustration generated from the tip’s dimensions.',
      renderAlt: (name, type) => `${name} ${type} breaker tip, illustration`,
      sideAlt: (name, type) => `${name} ${type} breaker tip, side view (illustration)`,
      rearAlt: (name) => `${name} breaker tip key slot and rear end, close-up (illustration)`,
      viewRear: 'Key slot and rear end',
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
