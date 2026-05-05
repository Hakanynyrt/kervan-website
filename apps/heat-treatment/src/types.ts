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

export interface DictBlock {
  nav: {
    services: string;
    capacity: string;
    craft: string;
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
    stats: Stat[];
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
  craft: {
    eyebrow: string;
    title: string;
    body: string;
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
