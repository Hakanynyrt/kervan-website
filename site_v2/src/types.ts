/* ═══════════════════════════════════════════════════════════════════════
   Dictionary types — mirrors public/dict.jsx structure.
═══════════════════════════════════════════════════════════════════════ */

export type Lang = 'tr' | 'en';

export interface Stat {
  n: string;
  l: string;
}

export interface ProductItem {
  name: string;
  desc: string;
  img: string;
}

export interface GalleryItem {
  name: string;
  desc?: string;
  img: string;
  video?: string;
}

export interface IndustryItem {
  name: string;
  desc: string;
}

export interface DictBlock {
  nav: {
    products: string;
    atolye: string;
    craft: string;
    industries: string;
    contact: string;
    cta: string;
  };
  hero: {
    eyebrow: string;
    title1: string;
    title2: string;
    sub: string;
    cta: string;
    ctaSecondary: string;
    stats: Stat[];
  };
  products: {
    eyebrow: string;
    title: string;
    aside: string;
    items: ProductItem[];
  };
  chisels: {
    eyebrow: string;
    title: string;
    aside: string;
    items: GalleryItem[];
  };
  stock: {
    eyebrow: string;
    title: string;
    aside: string;
    items: GalleryItem[];
  };
  atolye: {
    eyebrow: string;
    title: string;
    aside: string;
    items: GalleryItem[];
  };
  craft: {
    eyebrow: string;
    title: string;
    body: string;
  };
  industries: {
    eyebrow: string;
    title: string;
    aside: string;
    items: IndustryItem[];
    marquee: string[];
  };
  brands: {
    eyebrow: string;
    title: string;
    items: string[];
  };
  contact: {
    eyebrow: string;
    title: string;
    sub: string;
    fields: {
      name: string;
      company: string;
      email: string;
      phone: string;
      message: string;
    };
    kvkk: string;
    submit: string;
    sending: string;
    success: string;
    error: string;
    address: string;
    phoneLabel: string;
    whatsappLabel: string;
    emailLabel: string;
    instagramLabel: string;
    hoursLabel: string;
    hours: string;
  };
  footer: {
    brand: string;
    tag: string;
    rights: string;
    kvkk: string;
  };
}

export type Dict = Record<Lang, DictBlock>;
