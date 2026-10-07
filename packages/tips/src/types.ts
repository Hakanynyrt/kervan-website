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
    /** Length of the narrower rear stub, read from the drawing (render only). */
    stubLengthMm?: number | null;
  };
  /** Back end → where the collar steps down to D, read from the drawing (render only). */
  collarEndMm?: number | null;
  /** Chisel edge relative to the key slots, read from the drawing (render only). */
  chiselEdge?: 'parallel' | 'perpendicular' | null;
  /** Full shank outline read from the drawing (render only); replaces the defaults above. */
  profile?: ShankProfile | null;
}

export type StepKind = 'square' | 'chamfer' | 'fillet' | 'taper';
export type SlotEndKind = 'radius' | 'ramp' | 'square';

/**
 * Shank outline from the back end, in mm. Printed drawing values are exact; lengths the
 * drawing does not print (stub, collar, transitions) are measured on it with the local
 * scale of the nearest printed dimension.
 */
export interface ShankProfile {
  /** Chamfer on the striking-face edge (axial = radial). */
  backChamferMm: number;
  /**
   * Axisymmetric sections, back to front. `lengthMm` includes the step into the next
   * section; the last section has `lengthMm: null` and runs to the working end.
   */
  sections: {
    diameterMm: number;
    lengthMm: number | null;
    /** Transition into the next section (axial length), null for the last one. */
    step: { kind: StepKind; lengthMm: number } | null;
  }[];
  slot: {
    count: 1 | 2;
    /** From the very back end to where the slot starts / its full length, ends included. */
    startMm: number;
    lengthMm: number;
    /** Material left across the slotted section (one key: to the far side; two: between flats). */
    sectionMm: number;
    /** Two keys cut unevenly: the key side's share of the total cut depth (0.5 when absent). */
    splitTop?: number;
    back: { kind: SlotEndKind; lengthMm: number };
    front: { kind: SlotEndKind; lengthMm: number };
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
  /** Render keys (`/tips/<key>-{sm,lg}.webp`), added at build time when renders exist. */
  image?: string;
  /** Side view, like the catalogue drawing. */
  imageSide?: string;
}

export interface PublicFamily {
  code: string;
  attrs: FamilyAttrs;
  /** 1 = sells most in Turkey, 2 = sells well, null = not listed. */
  popularTier: 1 | 2 | null;
  fits: Breaker[];
  skus: PublicSku[];
  /** Rear end and key slot close-up (same for every tip type), added at build time. */
  imageRear?: string;
}

export interface PublicCatalog {
  schema: 1;
  /** True for the invented DEMO catalog (local builds, forks). */
  demo?: boolean;
  families: PublicFamily[];
}
