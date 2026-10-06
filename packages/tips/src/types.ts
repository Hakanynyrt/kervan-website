/** Working-end types the shop sells. */
export type TipType = 'chisel' | 'moil' | 'blunt' | 'pyramid' | 'conical' | 'asphalt';

/** Display order. */
export const TIP_TYPES: readonly TipType[] = [
  'chisel',
  'moil',
  'blunt',
  'pyramid',
  'conical',
  'asphalt',
];

export const isTipType = (v: unknown): v is TipType =>
  typeof v === 'string' && (TIP_TYPES as readonly string[]).includes(v);

/** Letter in the SKU code (KU135-07-C). */
export const TIP_LETTER: Record<TipType, string> = {
  chisel: 'C',
  moil: 'M',
  blunt: 'B',
  pyramid: 'P',
  conical: 'K',
  asphalt: 'A',
};

/** Turkish URL slug, kept in both languages. */
export const TIP_SLUG: Record<TipType, string> = {
  chisel: 'keski',
  moil: 'sivri',
  blunt: 'kut',
  pyramid: 'piramit',
  conical: 'konik',
  asphalt: 'asfalt',
};

export interface Range {
  min: number;
  max: number;
}

/** Shank geometry of a tip family (decides fitment). All lengths in mm. */
export interface FamilyAttrs {
  diameterMm: number;
  collarDiameterMm: number | null;
  key: {
    count: 1 | 2 | null;
    thicknessMm: number | null;
    slotLengthMm: number | null;
    backEndToSlotMm: number | null;
    slotEnd: 'rounded' | 'tapered' | null;
  };
  rear: {
    step: boolean | null;
    diameterMm: number | null;
  };
}

export interface Breaker {
  brand: string;
  model: string;
  /** "atlas-copco/mb-1700" (brandless: "diger/<model>"). */
  slug: string;
}

export type Availability =
  | { kind: 'stock'; qty: number }
  | { kind: 'lead'; days: number }
  | { kind: 'ask' };

export interface PublicSku {
  code: string;
  tipType: TipType;
  lengthMm: Range | null;
  weightKg: Range | null;
  tipAngleDeg: number | null;
  /** Net USD list price in cents; null = "ask for a quote". */
  priceUsdNetCents: number | null;
  availability: Availability;
}

export interface PublicFamily {
  code: string;
  attrs: FamilyAttrs;
  /** 1 = sells most in Turkey, 2 = sells well, null = not listed. */
  popularTier: 1 | 2 | null;
  fits: Breaker[];
  skus: PublicSku[];
}

export interface PublicCatalog {
  schema: 1;
  /** True for the invented DEMO catalog (local builds, forks). */
  demo?: boolean;
  families: PublicFamily[];
}
