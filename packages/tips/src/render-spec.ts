import type { FamilyAttrs, PublicSku, TipType } from './types.ts';

/** Bump when the renderer's look or geometry rules change: every image gets a new key. */
export const RENDER_VERSION = 1;

/** Included angle (deg) when the data has none. Assumptions, labelled as such. */
export const DEFAULT_INCLUDED_ANGLE: Record<'moil' | 'conical' | 'chisel' | 'pyramid', number> = {
  moil: 28,
  conical: 60,
  chisel: 45,
  pyramid: 40,
};

/** Concrete geometry for the renderer (mm). Local frame: axis +Y, back end at y = 0. */
export interface TipSpec {
  type: Exclude<TipType, 'asphalt'>;
  D: number;
  R: number;
  /** Shank radius above the working diameter (collar), R when there is no collar. */
  Rb: number;
  hasCollar: boolean;
  /** Where the collar steps down to D; null = placed by rule. */
  collarEnd: number | null;
  L: number;
  keyCount: 1 | 2;
  t: number;
  slotLen: number;
  slotStart: number;
  slotEnd: 'rounded' | 'tapered';
  rearStep: boolean;
  Rs: number | null;
  stubLen: number;
  /** Included tip angle; null for blunt. */
  angle: number | null;
  /** Chisel edge relative to the key slots. */
  chiselEdge: 'parallel' | 'perpendicular';
}

const r1 = (v: number): number => Math.round(v * 10) / 10;

/**
 * Turns a family's public dimensions and one SKU into renderer geometry, recording every guess.
 * Returns null for types the generator does not draw yet (asphalt).
 */
export function renderSpec(
  a: FamilyAttrs,
  sku: Pick<PublicSku, 'tipType' | 'lengthMm' | 'tipAngleDeg'>,
): { spec: TipSpec; assumptions: string[] } | null {
  if (sku.tipType === 'asphalt') return null;
  const A: string[] = [];
  const D = a.diameterMm;
  const R = D / 2;

  const hasCollar = a.collarDiameterMm != null && a.collarDiameterMm > D;
  const Rb = hasCollar ? a.collarDiameterMm! / 2 : R;
  const collarEnd = hasCollar ? (a.collarEndMm ?? null) : null;
  if (hasCollar && collarEnd === null) A.push('collar end placed 0.6·D past the key slot');

  let L: number;
  if (sku.lengthMm) {
    L = sku.lengthMm.max;
    if (sku.lengthMm.min !== sku.lengthMm.max)
      A.push(`length ${sku.lengthMm.min}–${sku.lengthMm.max} mm, longest drawn`);
  } else {
    L = 10 * D;
    A.push('length missing → 10·D');
  }

  const k = a.key;
  const keyCount = k.count ?? 1;
  if (k.count == null) A.push('key count missing → 1');
  const t = k.thicknessMm ?? Math.round(0.14 * D);
  if (k.thicknessMm == null) A.push('key thickness missing → 0.14·D');
  const slotLen = k.slotLengthMm ?? Math.round(1.3 * D);
  if (k.slotLengthMm == null) A.push('slot length missing → 1.3·D');
  const slotStart = k.backEndToSlotMm ?? Math.round(0.9 * D);
  if (k.backEndToSlotMm == null) A.push('back end → slot missing → 0.9·D');
  const slotEnd = k.slotEnd ?? 'rounded';
  if (k.slotEnd == null) A.push('slot end unknown → rounded');

  const rearStep = a.rear.step ?? a.rear.diameterMm != null;
  let Rs: number | null = null;
  let stubLen = 0;
  if (rearStep) {
    Rs = a.rear.diameterMm != null ? a.rear.diameterMm / 2 : 0.85 * Rb;
    if (a.rear.diameterMm == null) A.push('rear stub Ø missing → 0.85·shank Ø');
    stubLen = a.rear.stubLengthMm ?? Math.min(0.4 * D, 0.55 * slotStart);
    if (a.rear.stubLengthMm == null) A.push('rear stub length guessed');
  }

  const type = sku.tipType;
  let angle: number | null = null;
  if (type !== 'blunt') {
    angle = sku.tipAngleDeg ?? DEFAULT_INCLUDED_ANGLE[type];
    if (sku.tipAngleDeg == null) A.push(`tip angle unknown → ${angle}° (default for ${type})`);
  }
  const chiselEdge = a.chiselEdge ?? 'perpendicular';
  if ((type === 'chisel' || type === 'pyramid') && a.chiselEdge == null)
    A.push('chisel edge drawn perpendicular to the key slots');

  return {
    spec: {
      type,
      D: r1(D),
      R: r1(R),
      Rb: r1(Rb),
      hasCollar,
      collarEnd: collarEnd === null ? null : r1(collarEnd),
      L: r1(L),
      keyCount,
      t: r1(t),
      slotLen: r1(slotLen),
      slotStart: r1(slotStart),
      slotEnd,
      rearStep,
      Rs: Rs === null ? null : r1(Rs),
      stubLen: r1(stubLen),
      angle,
      chiselEdge,
    },
    assumptions: A,
  };
}

/** 64-bit FNV-1a over the spec and RENDER_VERSION, as 16 hex chars: the image file name. */
export function specKey(spec: TipSpec): string {
  const text = JSON.stringify([RENDER_VERSION, spec]);
  let h = 0xcbf29ce484222325n;
  for (let i = 0; i < text.length; i++) {
    h ^= BigInt(text.charCodeAt(i));
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
}
