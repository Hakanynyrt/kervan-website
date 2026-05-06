/* ═══════════════════════════════════════════════════════════════════════
   Dictionary types — combines the rich kervanbreaker.com long-scroll
   surface with the Faz 3 page routes (ProductDetail, Brands, Production,
   About, NotFound).
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
  /** Slug for routing into /urunler/:slug. Optional — if absent, card
   *  doesn't link out. */
  slug?: string;
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
  opening: {
    scroll: string;
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
  productsPage: {
    eyebrow: string;
    title: string;
    aside: string;
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
  exports: {
    eyebrow: string;
    /** `{count}` placeholder is replaced with destination count. */
    title: string;
    aside: string;
  };
  brands: {
    eyebrow: string;
    title: string;
    items: string[];
    /** Headline shown on the dedicated /uyumluluk page. */
    pageTitle: string;
    pageAside: string;
  };
  productionPage: {
    eyebrow: string;
    title: string;
    body: string;
    metallurgyHeading: string;
    metallurgyBody: string;
    heatHeading: string;
    heatBody: string;
    heatLink: string;
    materialsHeading: string;
    materials: string[];
  };
  aboutPage: {
    eyebrow: string;
    title: string;
    body: string;
    company: string;
    location: string;
  };
  productDetail: {
    materialsLabel: string;
    sizesLabel: string;
    brandFitsLabel: string;
    sizesNote: string;
    backLink: string;
    quoteCta: string;
    notFound: string;
    notFoundCta: string;
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
    /** Sent by ProductDetail "Get a quote" CTA — prefilled subject line. */
    quotePrefix: string;
  };
  notFound: {
    title: string;
    body: string;
    cta: string;
  };
  footer: {
    brand: string;
    tag: string;
    rights: string;
    kvkk: string;
  };
}

export type Dict = Record<Lang, DictBlock>;

/** Single source of truth for a product category (used by ProductDetail
 *  and the /urunler page grid). */
export interface Product {
  slug: string;
  /** Main image relative to /public, e.g. `/photos/uclar/uclar-yard.jpeg`. */
  image: string;
  tr: ProductLocale;
  en: ProductLocale;
  /** Optional sub-types — e.g. moil/blunt/asphalt for keski. */
  subTypes?: ProductSubType[];
}

export interface ProductLocale {
  name: string;
  tagline: string;
  body: string;
}

export interface ProductSubType {
  slug: string;
  tr: { name: string; desc: string };
  en: { name: string; desc: string };
}

export interface BrandSpec {
  slug: string;
  name: string;
  logo?: string;
  country: string;
}
