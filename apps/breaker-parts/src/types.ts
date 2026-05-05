export type Lang = 'tr' | 'en';

export interface DictBlock {
  nav: {
    home: string;
    products: string;
    brands: string;
    production: string;
    about: string;
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
  };
  productsPage: {
    eyebrow: string;
    title: string;
    aside: string;
  };
  brandsPage: {
    eyebrow: string;
    title: string;
    aside: string;
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
  contactPage: {
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
    emailLabel: string;
    instagramLabel: string;
    hoursLabel: string;
    hours: string;
    /** Sent by ProductDetail "Get a quote" CTA — prefilled subject line. */
    quotePrefix: string;
  };
  qualityTeaser: {
    eyebrow: string;
    title: string;
    body: string;
    link: string;
  };
  brandStrip: {
    eyebrow: string;
    title: string;
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
  footer: {
    brand: string;
    tag: string;
    rights: string;
    kvkk: string;
  };
  notFound: {
    title: string;
    body: string;
    cta: string;
  };
}

export type Dict = Record<Lang, DictBlock>;

/** Single source of truth for a product category. */
export interface Product {
  slug: string;
  /** Main image relative to /public, e.g. `/photos/uclar/uclar-yard.jpeg`. */
  image: string;
  /** TR + EN bilingual fields. */
  tr: ProductLocale;
  en: ProductLocale;
  /** Optional sub-types — e.g. moil/blunt/asphalt for keski. */
  subTypes?: ProductSubType[];
}

export interface ProductLocale {
  /** Display name (e.g. "Keski", "Chisel"). */
  name: string;
  /** One-liner shown on grid card. */
  tagline: string;
  /** Body paragraph on detail page. */
  body: string;
}

export interface ProductSubType {
  slug: string;
  tr: { name: string; desc: string };
  en: { name: string; desc: string };
}

/** Brand compatibility entry. */
export interface BrandSpec {
  slug: string;
  name: string;
  /** Logo asset under /brand-logos/ (sans extension). Optional — falls back
   *  to wordmark if missing. */
  logo?: string;
  /** Country of origin (display only). */
  country: string;
}
