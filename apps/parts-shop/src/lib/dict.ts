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
  };
  nav: { label: string; tips: string; catalogSite: string; langLabel: string; langOther: string };
  banner: { preview: string; demo: string };
  tip: Record<TipType, string>;
  home: {
    eyebrow: string;
    title: string;
    lead: string;
    cta: string;
    popular: string;
    featured: string;
    count: (n: number) => string;
  };
  card: { popular: string; fits: string; more: (n: number) => string; view: string };
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
    marks: string;
  };
  footer: { legal: string; kvkk: string; marks: string };
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
    },
    nav: {
      label: 'Ana menü',
      tips: 'Kırıcı uçları',
      catalogSite: 'kervanbreaker.com',
      langLabel: 'English',
      langOther: 'EN',
    },
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
      eyebrow: 'Kervan üretimi · Kartepe',
      title: 'Hidrolik kırıcı uçları',
      lead: 'Kendi tezgâhımızda işlenen, kendi fırınlarımızda ısıl işlem gören uçlar. Ölçüleri karşılaştırın, kırıcınıza uyanı bulun.',
      cta: 'Tüm uçları gör',
      popular: 'Çok satanlar',
      featured: 'Uçlar',
      count: (n) => `${n} uç ailesi`,
    },
    card: {
      popular: 'Çok satan',
      fits: 'Uyumlu',
      more: (n) => `+${n} kırıcı`,
      view: 'Ölçüleri gör',
    },
    list: {
      title: 'Tüm kırıcı uçları',
      lead: 'Çok satanlar önce, sonra çapa göre.',
      code: 'Kod',
      diameter: 'Çap',
      types: 'Tipler',
      fits: 'Uyumlu kırıcılar',
    },
    family: {
      kicker: (d) => `Ø${d} mm hidrolik kırıcı ucu`,
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
      marks:
        'Kırıcı marka ve model adları yalnız uyumu belirtmek içindir; markalar sahiplerine aittir.',
    },
    footer: {
      legal: 'Üretici ve satıcı',
      kvkk: 'KVKK aydınlatma metni',
      marks: 'Markalar sahiplerine aittir.',
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
    },
    nav: {
      label: 'Main menu',
      tips: 'Breaker tips',
      catalogSite: 'kervanbreaker.com',
      langLabel: 'Türkçe',
      langOther: 'TR',
    },
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
      eyebrow: 'Made by Kervan · Kartepe, Türkiye',
      title: 'Hydraulic breaker tips',
      lead: 'Machined on our own lathes and heat-treated in our own furnaces. Compare the dimensions and find the tip for your breaker.',
      cta: 'See all tips',
      popular: 'Best sellers',
      featured: 'Tips',
      count: (n) => `${n} tip families`,
    },
    card: {
      popular: 'Best seller',
      fits: 'Fits',
      more: (n) => `+${n} breakers`,
      view: 'See dimensions',
    },
    list: {
      title: 'All breaker tips',
      lead: 'Best sellers first, then by diameter.',
      code: 'Code',
      diameter: 'Diameter',
      types: 'Types',
      fits: 'Fitting breakers',
    },
    family: {
      kicker: (d) => `Ø${d} mm hydraulic breaker tip`,
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
      marks: 'Breaker brand and model names only indicate fit; the marks belong to their owners.',
    },
    footer: {
      legal: 'Manufacturer and seller',
      kvkk: 'Privacy notice (KVKK)',
      marks: 'Marks belong to their owners.',
    },
    notFound: {
      title: 'Page not found',
      body: 'The page does not exist or has moved.',
      home: 'Back to the home page',
    },
  },
};
