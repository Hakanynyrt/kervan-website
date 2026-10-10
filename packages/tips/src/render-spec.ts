import type {
  FamilyAttrs,
  PublicSku,
  ShankProfile,
  SlotEndKind,
  StepKind,
  TipType,
} from './types.ts';

/** Bump when the renderer's look or geometry rules change: every image gets a new key. */
export const RENDER_VERSION = 11;

/** Included angle (deg) when the data has none. Assumptions, labelled as such. */
/** Moil point in two stages: the second, blunter cone starts at this fraction of the body radius. */
export const MOIL_MID = 0.32;
/** Included angle of the moil's second (point) cone. */
export const MOIL_POINT_ANGLE = 60;

export const DEFAULT_INCLUDED_ANGLE: Record<'moil' | 'conical' | 'chisel' | 'pyramid', number> = {
  moil: 28,
  conical: 60,
  chisel: 45,
  // Face to face (what a side view square to a face shows). About 26-30° on OEM pyramid points
  // (Rammer's own render): faces about 2 × D long. Was 40°, too blunt (owner asked to check).
  pyramid: 30,
};

/** One axisymmetric section of the tool: radius r from y0 to y1 (step into the next included). */
export interface SpecSection {
  r: number;
  y0: number;
  y1: number;
  step: { kind: StepKind; len: number } | null;
}

/**
 * Concrete geometry for the renderer (mm). Local frame: axis +Y, back end at y = 0.
 * Built from the drawing profile when there is one, otherwise from the table with
 * labelled defaults (see renderSpec).
 */
export interface TipSpec {
  type: Exclude<TipType, 'asphalt'>;
  L: number;
  /** Diameter of the working end (the last section). */
  D: number;
  backChamfer: number;
  sections: SpecSection[];
  slot: {
    count: 1 | 2;
    start: number;
    len: number;
    /** Radius of the shank the slot is cut into. */
    rs: number;
    /** Distance of the slot floor plane from the axis (towards the cut side). */
    floor: number;
    /** Two keys: the opposite floor (equal to floor unless the cuts are uneven). */
    floorB: number;
    back: { kind: SlotEndKind; len: number };
    front: { kind: SlotEndKind; len: number };
    /** Chamfer on the slot rim and at the end/floor corner (machining practice, not on the drawings). */
    chamfer: number;
  };
  /** Included tip angle; null for blunt. */
  angle: number | null;
  /**
   * Moil only: the cone in two stages (owner). The main cone at `angle` runs from the body down
   * to radius `rMid`, then a blunter cone at `angle2` runs to the point.
   */
  point?: {
    rMid: number;
    angle2: number;
    /** Radius of a flat end face (none: a rounded point). */ flat?: number;
  };
  /** Chisel edge relative to the key slots. */
  chiselEdge: 'parallel' | 'perpendicular';
}

const r1 = (v: number): number => Math.round(v * 10) / 10;

/**
 * Shank outline from the table alone. Reading of the catalogue table, checked against its
 * drawings: key "thickness" is the material left across the slotted section, "back end →
 * slot" is measured from the very back end, the collar is a short ring past the slot.
 */
function profileFromTable(a: FamilyAttrs, A: string[]): ShankProfile {
  const D = a.diameterMm;
  const R = D / 2;
  const k = a.key;
  const count = k.count ?? 1;
  if (k.count == null) A.push('key count missing → 1');
  const slotLen = k.slotLengthMm ?? Math.round(1.3 * D);
  if (k.slotLengthMm == null) A.push('slot length missing → 1.3·D');
  const slotStart = k.backEndToSlotMm ?? Math.round(0.9 * D);
  if (k.backEndToSlotMm == null) A.push('back end → slot missing → 0.9·D');
  const t = k.thicknessMm;
  let section = t ?? NaN;
  const depth = count === 2 ? (D - section) / 2 : D - section;
  if (!(depth >= 0.03 * D && depth <= 0.45 * D)) {
    section = count === 2 ? D - 2 * 0.14 * D : D - 0.14 * D;
    A.push(
      t == null ? 'key section missing → depth 0.14·D' : 'key section implausible → depth 0.14·D',
    );
  }
  const d = count === 2 ? (D - section) / 2 : D - section;
  const slotEnd = k.slotEnd ?? (count === 2 ? 'tapered' : 'rounded');
  if (k.slotEnd == null) A.push(`slot end unknown → ${slotEnd} (usual for ${count} key)`);
  const rr = Math.max(1, Math.min(d, slotLen / 4));
  const ramp = Math.min(d / Math.tan((12 * Math.PI) / 180), 0.4 * slotLen);

  const sections: ShankProfile['sections'] = [];
  const rearStep = a.rear.step ?? a.rear.diameterMm != null;
  if (rearStep) {
    const Rs = a.rear.diameterMm != null ? a.rear.diameterMm / 2 : 0.8 * R;
    if (a.rear.diameterMm == null) A.push('rear stub Ø missing → 0.8·D');
    const stubLen = a.rear.stubLengthMm ?? Math.min(0.7 * D, 0.8 * slotStart);
    if (a.rear.stubLengthMm == null) A.push('rear stub length → 0.7·D (catalogue drawings)');
    const ch = Math.min(0.3 * Math.abs(R - Rs), 0.03 * D) + 0.5;
    sections.push({
      diameterMm: 2 * Rs,
      lengthMm: stubLen,
      step: { kind: 'chamfer', lengthMm: ch },
    });
  }
  if (a.collarDiameterMm != null && a.collarDiameterMm > D) {
    const used = sections.reduce((s, x) => s + (x.lengthMm ?? 0), 0);
    const start = a.collarEndMm ?? slotStart + slotLen + 1.6 * D;
    if (a.collarEndMm == null) A.push('collar ring placed 1.6·D past the slot');
    const Rc = a.collarDiameterMm / 2;
    const ch = Math.min(0.15 * (Rc - R), 0.02 * D) + 0.3;
    sections.push({
      diameterMm: D,
      lengthMm: start - used,
      step: { kind: 'chamfer', lengthMm: ch },
    });
    sections.push({
      diameterMm: a.collarDiameterMm,
      lengthMm: 0.35 * D,
      step: { kind: 'fillet', lengthMm: 0.6 * D },
    });
  }
  sections.push({ diameterMm: D, lengthMm: null, step: null });
  return {
    backChamferMm: Math.max(1.5, 0.03 * D),
    sections,
    slot: {
      count,
      startMm: slotStart,
      lengthMm: slotLen,
      sectionMm: section,
      back: { kind: 'radius', lengthMm: rr },
      front:
        slotEnd === 'tapered' ? { kind: 'ramp', lengthMm: ramp } : { kind: 'radius', lengthMm: rr },
    },
  };
}

/**
 * Turns a family's public dimensions and one SKU into renderer geometry, recording every guess.
 * Returns null for types the generator does not draw yet (asphalt) or an outline that does
 * not fit the length.
 */
export function renderSpec(
  a: FamilyAttrs,
  sku: Pick<PublicSku, 'tipType' | 'lengthMm' | 'tipAngleDeg'>,
): { spec: TipSpec; assumptions: string[] } | null {
  if (sku.tipType === 'asphalt') return null;
  const A: string[] = [];

  const p = a.profile ?? profileFromTable(a, A);
  if (!a.profile) A.push('no drawing profile → outline from the table');
  const D = p.sections[p.sections.length - 1].diameterMm;

  let L: number;
  if (sku.lengthMm) {
    L = sku.lengthMm.max;
    if (sku.lengthMm.min !== sku.lengthMm.max)
      A.push(`length ${sku.lengthMm.min}–${sku.lengthMm.max} mm, longest drawn`);
  } else {
    L = 10 * a.diameterMm;
    A.push('length missing → 10·D');
  }

  const sections: SpecSection[] = [];
  const radii: number[] = [];
  let y = 0;
  for (const s of p.sections) {
    radii.push(s.diameterMm / 2);
    const y1 = s.lengthMm === null ? L : y + s.lengthMm;
    sections.push({
      r: r1(s.diameterMm / 2),
      y0: r1(y),
      y1: r1(y1),
      step: s.step ? { kind: s.step.kind, len: r1(s.step.lengthMm) } : null,
    });
    y = y1;
  }
  // The working end needs about one diameter of plain body in front of the last step.
  if (sections[sections.length - 1].y0 > L - 1.2 * D) return null;

  const sl = p.slot;
  const mid = sl.startMm + sl.lengthMm / 2;
  const hostAt = sections.findIndex((s) => mid >= s.y0 && mid < s.y1);
  const rs = radii[Math.max(0, hostAt)];
  const cut = sl.count === 2 ? 2 * rs - sl.sectionMm : 0;
  const split = sl.splitTop ?? 0.5;
  const floor = sl.count === 2 ? rs - cut * split : sl.sectionMm - rs;
  const floorB = sl.count === 2 ? rs - cut * (1 - split) : floor;

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
      L: r1(L),
      D: r1(D),
      backChamfer: r1(p.backChamferMm),
      sections,
      slot: {
        count: sl.count,
        start: r1(sl.startMm),
        len: r1(sl.lengthMm),
        rs: r1(rs),
        floor: r1(floor),
        floorB: r1(floorB),
        back: { kind: sl.back.kind, len: r1(sl.back.lengthMm) },
        front: { kind: sl.front.kind, len: r1(sl.front.lengthMm) },
        chamfer: r1(Math.min(5, Math.max(1.5, 0.03 * 2 * rs))),
      },
      angle,
      ...(type === 'moil'
        ? { point: { rMid: r1(MOIL_MID * (D / 2)), angle2: MOIL_POINT_ANGLE } }
        : {}),
      chiselEdge,
    },
    assumptions: A,
  };
}

/** The part of a spec a rear close-up shows: everything but the working end. */
export function rearSpec(spec: TipSpec): unknown {
  const last = spec.sections[spec.sections.length - 1];
  return {
    backChamfer: spec.backChamfer,
    sections: spec.sections.slice(0, -1),
    last: { r: last.r, y0: last.y0 },
    slot: spec.slot,
  };
}

/** 64-bit FNV-1a over a value and RENDER_VERSION, as 16 hex chars: the image file name. */
export function specKey(spec: unknown, view = 'hero'): string {
  const text = JSON.stringify([RENDER_VERSION, view, spec]);
  let h = 0xcbf29ce484222325n;
  for (let i = 0; i < text.length; i++) {
    h ^= BigInt(text.charCodeAt(i));
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
}
