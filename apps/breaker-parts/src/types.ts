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
    tech: string;
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
  catalogUi: {
    tabsLabel: string;
    tabGeneral: string;
    tabCatalog: string;
    title: string;
    sub: string;
    loading: string;
    errorUnauthorized: string;
    errorNotConfigured: string;
    errorEmpty: string;
    errorGeneric: string;
    retry: string;
    searchLabel: string;
    searchPlaceholder: string;
    brandLabel: string;
    brandAll: string;
    tipLabel: string;
    hideLow: string;
    measureTitle: string;
    measureHint: string;
    measureDia: string;
    measureKeyThk: string;
    measureKeyCount: string;
    keyAny: string;
    keySingle: string;
    keyDouble: string;
    measureBackToSlot: string;
    measureSlotLen: string;
    measureRearDia: string;
    measureLength: string;
    tolLabel: string;
    clear: string;
    resultsCount: string;
    groupMatch: string;
    groupMaybe: string;
    groupMaybeHint: string;
    groupWear: string;
    groupWearHint: string;
    emptyResults: string;
    emptyHint: string;
    more: string;
    details: string;
    hideDetails: string;
    compare: string;
    compareTitle: string;
    compareClose: string;
    compareMax: string;
    compareRemove: string;
    invalidNumber: string;
    copyLabel: string;
    tipLabels: Record<VegaTip, string>;
    copy: string;
    copied: string;
    warnBadge: string;
    missing: string;
    fDia: string;
    fCollar: string;
    fKey: string;
    fKeyThk: string;
    fBackToSlot: string;
    fSlotLen: string;
    fRearDia: string;
    fLength: string;
    fWeight: string;
    fTips: string;
    fFits: string;
    fPartNos: string;
    fOther: string;
    fNotes: string;
    fSource: string;
    sourceFmt: string;
    byType: string;
    diffLabels: Record<'dia' | 'keyThk' | 'backToSlot' | 'slotLen' | 'rearDia' | 'length', string>;
    qualityLabels: Record<string, string>;
    flagLabels: Record<string, string>;
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

/** Shape of the protected content served by /api/tech/content (never bundled). */
export interface TechContent {
  eyebrow: string;
  title: string;
  aside: string;
  groups: { title: string; rows: { k: string; v: string }[] }[];
}

/* ── Private VEGA tip catalog (served by /api/tech/catalog, never bundled) ── */
export type VegaTip = 'chisel' | 'moil' | 'blunt' | 'pyramid';
export interface VegaRange {
  min: number;
  max: number;
}
export interface VegaItem {
  id: string;
  model: string;
  brand: string;
  seriesRaw: string;
  partNos: string[];
  fitsBreakers: string[];
  tipTypes: VegaTip[];
  diameterMm: number | null;
  collarDiameterMm: number | null;
  key: {
    count: 1 | 2 | null;
    thicknessMm: number | null;
    slotLengthMm: number | null;
    backEndToSlotMm: number | null;
  };
  rearShoulderDiameterMm: number | null;
  lengthMm: VegaRange | null;
  lengthByType: Partial<Record<VegaTip, VegaRange>> | null;
  weightKg: VegaRange | null;
  weightByType: Partial<Record<VegaTip, VegaRange>> | null;
  confidence: 'high' | 'medium' | 'low';
  reviewFlags: string[];
  notes: string[];
  extra: string | null;
  source: { pdfPage: number | null; catalogPage: number | null; line: number };
  quality: string[];
}
export interface VegaCatalog {
  schema: number;
  source: string;
  count: number;
  items: VegaItem[];
}
