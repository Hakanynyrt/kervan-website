import type { SisterSiteCopy } from '@kervan/ui';
/* ═══════════════════════════════════════════════════════════════════════
   Dictionary types — heat-treatment app surface.
═══════════════════════════════════════════════════════════════════════ */

export type Lang = 'tr' | 'en';

export interface Stat {
  /** Big number/string (e.g. "1+2", "Ø1200", "42CrMo"). */
  n: string;
  /** Small label below (e.g. "potası", "max çap"). */
  l: string;
}

export interface ServiceItem {
  /** Numeric prefix shown as eyebrow (e.g. "01"). */
  index: string;
  name: string;
  body: string;
  bullets: string[];
}

export interface CapacityItem {
  /** Big value (e.g. "Ø1200mm × 2.5t"). */
  value: string;
  /** Eyebrow / small label. */
  label: string;
  /** Optional one-line note. */
  note?: string;
}

/** Page metadata and JSON-LD text (prerendered into <head>). */
export interface MetaBlock {
  title: string;
  description: string;
  /** WebSite JSON-LD description. */
  siteDescription: string;
  service: {
    type: string;
    name: string;
    description: string;
    catalogName: string;
    offers: { name: string; description: string }[];
  };
}

export interface DictBlock {
  meta: MetaBlock;
  notFound: {
    eyebrow: string;
    title: string;
    body: string;
    home: string;
  };
  nav: {
    services: string;
    capacity: string;
    craft: string;
    about: string;
    contact: string;
    tech: string;
    cta: string;
    home: string;
    menu: string;
    language: string;
  };
  /** Top strip of the fixed header linking to the breaker-parts sister site. */
  sister: SisterSiteCopy;
  hero: {
    eyebrow: string;
    title1: string;
    title2: string;
    sub: string;
    cta: string;
    ctaSecondary: string;
    stats: Stat[];
    /** Hero film card (client-only video over a poster). */
    film: { alt: string; caption: string; pause: string; play: string };
  };
  services: {
    eyebrow: string;
    title: string;
    aside: string;
    items: ServiceItem[];
  };
  capacity: {
    eyebrow: string;
    title: string;
    aside: string;
    items: CapacityItem[];
  };
  techUi: {
    eyebrow: string;
    title: string;
    loginTitle: string;
    passwordLabel: string;
    submit: string;
    sending: string;
    wrong: string;
    notConfigured: string;
    error: string;
    logout: string;
    loading: string;
  };
  craft: {
    eyebrow: string;
    title: string;
    body: string;
    /** Label of the photo row (screen readers). */
    photosLabel: string;
    /** Real photos of our furnaces, 4:5, `${base}-640.webp` and `${base}-1080.webp` under /photos/isil-islem/. */
    photos: { base: string; alt: string; caption: string }[];
  };
  about: {
    eyebrow: string;
    title: string;
    body: string;
    company: string;
    location: string;
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
    /** Reopens the cookie banner. */
    cookies: string;
  };
  /** Cookie banner for Google Ads measurement (ConsentBanner). */
  consent: {
    title: string;
    body: string;
    accept: string;
    reject: string;
    policy: string;
  };
}

export type Dict = Record<Lang, DictBlock>;

/** Shape of the protected content served by /api/tech/content (never bundled). */
export interface TechContent {
  eyebrow: string;
  title: string;
  aside: string;
  groups: { title: string; rows: { k: string; v: string }[] }[];
}
