/* ═══════════════════════════════════════════════════════════════════════
   Dictionary types — heat-treatment app surface.
═══════════════════════════════════════════════════════════════════════ */

export type Lang = 'tr' | 'en';

/** A bullet that names a sister site: "<label>: <site>", the site linked. */
export interface ServiceLink {
  label: string;
  site: string;
  href: string;
}

export interface ServiceItem {
  /** Numeric prefix shown as eyebrow (e.g. "01"). */
  index: string;
  name: string;
  body: string;
  bullets: (string | ServiceLink)[];
}

/** One cell of the capacity spec table (the owner's figures; never invent one). */
export interface CapacityItem {
  /** Row label (e.g. "Max parça çapı"). */
  label: string;
  /** Big value (e.g. "Ø1200", "42CrMo · 42CrMoA"). */
  value: string;
  /** Unit after the value, smaller (e.g. "mm", "ton"). */
  unit?: string;
  /** One-line note under the value. */
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
    /** Header theme select: auto (by the sun) / light / dark. */
    theme: { label: string; auto: string; light: string; dark: string };
    /** Short names in the language switch ("TR" / "EN"). */
    langShort: Record<Lang, string>;
  };
  /** Small marks used in the UI text. */
  marks: {
    /** After a link that leaves the site ("↗"). */
    external: string;
    /** After a required form field's label ("*"). */
    required: string;
  };
  hero: {
    title1: string;
    title2: string;
    sub: string;
    cta: string;
    /** The one hero photo (the furnace pots): alt text and the caption on the photo. */
    photo: { alt: string; caption: string };
    /** Hero film card (client-only video over a poster). */
    film: { alt: string; caption: string; pause: string; play: string };
  };
  /** The pinned "gear" section after the hero (GearProcess): four heat-treatment stages. */
  gear: {
    title: string;
    sub: string;
    /** aria-label of the 3D scene (role img) */
    sceneLabel: string;
    /** alt of the static poster */
    posterAlt: string;
    /** aria-label of the stage list */
    stagesLabel: string;
    /** Exactly four: heating, quenching, tempering, report (the scene's stages, in order). */
    stages: { no: string; name: string; desc: string }[];
    /** Card shown in the report stage. */
    report: { title: string; note: string };
  };
  services: {
    eyebrow: string;
    title: string;
    aside: string;
    /** aria-label of the process list. */
    processesLabel: string;
    /** The heat treatment processes we offer (owner, Oct 2026). */
    processes: { name: string; body: string }[];
    /** The quality line under the processes (hardness report per batch). */
    quality: { name: string; body: string };
    /** Two cards under the list: contract / special jobs and our own parts. */
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
    /** "* = required" line above the submit button. */
    requiredNote: string;
    /** Optional drawing / photo attachments (limits in lib/attachments.ts). */
    files: {
      label: string;
      hint: string;
      tooMany: string;
      tooBig: string;
      badType: string;
      /** The server refused the files (422 attachment). */
      rejected: string;
    };
    /** One-line KVKK notice next to the submit button: before + link + after. */
    kvkk: { before: string; link: string; after: string };
    addressLabel: string;
    /** Street address (from @kervan/seo), two lines. */
    address: string;
    /** Link text to the Google Maps search for the address. */
    mapLabel: string;
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
