import {
  isTipType,
  TIP_TYPES,
  type Availability,
  type FamilyAttrs,
  type PublicCatalog,
  type PublicExtra,
  type PublicFamily,
  type PublicSku,
  type Range,
  type ShankProfile,
  type SlotEndKind,
  type StepKind,
} from './types.ts';

/** `SELECT id, code, attrs, popular_tier FROM families WHERE published = 1` */
export interface FamilyRow {
  id: number;
  code: string;
  attrs: string;
  popular_tier: number | null;
}
/** Published SKUs of published families (see FAMILY/SKU/FIT queries in build-catalog). */
export interface SkuRow {
  family_id: number;
  code: string;
  tip_type: string;
  length_min_mm: number | null;
  length_max_mm: number | null;
  weight_min_kg: number | null;
  weight_max_kg: number | null;
  tip_angle_deg: number | null;
  price_usd_net_cents: number | null;
  stock_qty: number;
  lead_time_days: number | null;
}
/** `SELECT brand, model, slug, tip_types, diameter_mm, price_usd_net_cents FROM extra_products WHERE published = 1` */
export interface ExtraRow {
  brand: string;
  model: string;
  slug: string;
  tip_types: string;
  diameter_mm: number | null;
  price_usd_net_cents: number | null;
}

/** Whitelists the extra products; rows with no usable tip type are dropped. */
export function publicExtras(rows: readonly ExtraRow[]): PublicExtra[] {
  const out: PublicExtra[] = [];
  for (const r of rows) {
    if (isHiddenBreaker(r)) continue;
    let types: unknown;
    try {
      types = JSON.parse(r.tip_types);
    } catch {
      continue;
    }
    const tipTypes = Array.isArray(types) ? TIP_TYPES.filter((t) => types.includes(t)) : [];
    if (!tipTypes.length || !r.brand || !r.model || !r.slug) continue;
    const p = num(r.price_usd_net_cents);
    const d = num(r.diameter_mm);
    out.push({
      brand: r.brand,
      model: r.model,
      slug: r.slug,
      tipTypes,
      diameterMm: d !== null && d > 0 ? d : null,
      priceUsdNetCents: p !== null && p > 0 ? Math.round(p) : null,
    });
  }
  return out;
}

export interface FitRow {
  family_id: number;
  brand: string;
  model: string;
  slug: string;
}

/**
 * Breaker makers whose names must never appear on the site (the catalogue's own brand, K4).
 * Their breakers are left out of the public "fits" lists.
 */
export const HIDDEN_BRAND = /\bvega\b/i;
export const isHiddenBreaker = (b: { brand: string; model: string; slug?: string }): boolean =>
  HIDDEN_BRAND.test(b.brand) || HIDDEN_BRAND.test(b.model) || HIDDEN_BRAND.test(b.slug ?? '');

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const range = (a: number | null, b: number | null): Range | null => {
  const min = num(a) ?? num(b);
  const max = num(b) ?? num(a);
  return min === null || max === null ? null : { min, max };
};

const STEP_KINDS: readonly StepKind[] = ['square', 'chamfer', 'fillet', 'taper'];
const SLOT_END_KINDS: readonly SlotEndKind[] = ['radius', 'ramp', 'square'];
const pos = (v: unknown): number | null => {
  const n = num(v);
  return n !== null && n > 0 ? n : null;
};
const nonNeg = (v: unknown): number | null => {
  const n = num(v);
  return n !== null && n >= 0 ? n : null;
};

/** Whitelists a drawing profile; anything malformed drops the whole profile (renders fall back). */
export function publicProfile(v: unknown): ShankProfile | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as Record<string, unknown>;
  const back = nonNeg(p.backChamferMm);
  const secs = Array.isArray(p.sections) ? p.sections : null;
  const slot = (p.slot ?? null) as Record<string, unknown> | null;
  if (back === null || !secs || secs.length === 0 || secs.length > 12 || !slot) return null;
  const sections: ShankProfile['sections'] = [];
  for (let i = 0; i < secs.length; i++) {
    const s = (secs[i] ?? {}) as Record<string, unknown>;
    const last = i === secs.length - 1;
    const d = pos(s.diameterMm);
    const len = last ? null : pos(s.lengthMm);
    const st = (s.step ?? null) as Record<string, unknown> | null;
    const kind = st && STEP_KINDS.includes(st.kind as StepKind) ? (st.kind as StepKind) : null;
    const stLen = st ? nonNeg(st.lengthMm) : null;
    if (d === null || (!last && (len === null || !kind || stLen === null))) return null;
    sections.push({
      diameterMm: d,
      lengthMm: len,
      step: last ? null : { kind: kind!, lengthMm: stLen! },
    });
  }
  const end = (e: unknown): { kind: SlotEndKind; lengthMm: number } | null => {
    const o = (e ?? null) as Record<string, unknown> | null;
    if (!o || !SLOT_END_KINDS.includes(o.kind as SlotEndKind)) return null;
    const l = nonNeg(o.lengthMm);
    return l === null ? null : { kind: o.kind as SlotEndKind, lengthMm: l };
  };
  const count = slot.count === 1 || slot.count === 2 ? slot.count : null;
  const start = nonNeg(slot.startMm);
  const length = pos(slot.lengthMm);
  const section = pos(slot.sectionMm);
  const sb = end(slot.back);
  const sf = end(slot.front);
  if (count === null || start === null || length === null || section === null || !sb || !sf)
    return null;
  const split = num(slot.splitTop);
  return {
    backChamferMm: back,
    sections,
    slot: {
      count,
      startMm: start,
      lengthMm: length,
      sectionMm: section,
      ...(count === 2 && split !== null && split >= 0.05 && split <= 0.95
        ? { splitTop: split }
        : {}),
      back: sb,
      front: sf,
    },
  };
}

const profileField = (v: unknown): { profile?: ShankProfile } => {
  const p = publicProfile(v);
  return p ? { profile: p } : {};
};

/** Rebuilds attrs field by field, so nothing else stored in the JSON can leak. */
function publicAttrs(raw: string): FamilyAttrs | null {
  let a: Record<string, unknown>;
  try {
    a = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
  const d = num(a.diameterMm);
  if (d === null) return null;
  const key = (a.key ?? {}) as Record<string, unknown>;
  const rear = (a.rear ?? {}) as Record<string, unknown>;
  const count = key.count === 1 || key.count === 2 ? key.count : null;
  const slotEnd = key.slotEnd === 'rounded' || key.slotEnd === 'tapered' ? key.slotEnd : null;
  return {
    diameterMm: d,
    collarDiameterMm: num(a.collarDiameterMm),
    key: {
      count,
      thicknessMm: num(key.thicknessMm),
      slotLengthMm: num(key.slotLengthMm),
      backEndToSlotMm: num(key.backEndToSlotMm),
      slotEnd,
    },
    rear: {
      step: typeof rear.step === 'boolean' ? rear.step : null,
      diameterMm: num(rear.diameterMm),
      stubLengthMm: num(rear.stubLengthMm),
    },
    collarEndMm: num(a.collarEndMm),
    chiselEdge:
      a.chiselEdge === 'parallel' || a.chiselEdge === 'perpendicular' ? a.chiselEdge : null,
    ...profileField(a.profile),
  };
}

const availability = (s: SkuRow): Availability =>
  s.stock_qty > 0
    ? { kind: 'stock', qty: s.stock_qty }
    : s.lead_time_days !== null && s.lead_time_days > 0
      ? { kind: 'lead', days: s.lead_time_days }
      : { kind: 'ask' };

const tierRank = (t: 1 | 2 | null): number => t ?? 3;

export function toPublicCatalog(
  families: readonly FamilyRow[],
  skus: readonly SkuRow[],
  fits: readonly FitRow[],
): PublicCatalog {
  const skusBy = new Map<number, PublicSku[]>();
  for (const s of skus) {
    if (!isTipType(s.tip_type)) continue;
    const list = skusBy.get(s.family_id) ?? [];
    list.push({
      code: s.code,
      tipType: s.tip_type,
      lengthMm: range(s.length_min_mm, s.length_max_mm),
      weightKg: range(s.weight_min_kg, s.weight_max_kg),
      tipAngleDeg: num(s.tip_angle_deg),
      priceUsdNetCents: num(s.price_usd_net_cents),
      availability: availability(s),
    });
    skusBy.set(s.family_id, list);
  }
  const fitsBy = new Map<number, PublicFamily['fits']>();
  for (const f of fits) {
    if (isHiddenBreaker(f)) continue;
    const list = fitsBy.get(f.family_id) ?? [];
    list.push({ brand: f.brand, model: f.model, slug: f.slug });
    fitsBy.set(f.family_id, list);
  }
  const out: PublicFamily[] = [];
  for (const f of families) {
    const attrs = publicAttrs(f.attrs);
    const list = skusBy.get(f.id);
    if (!attrs || !list?.length) continue;
    list.sort((a, b) => TIP_TYPES.indexOf(a.tipType) - TIP_TYPES.indexOf(b.tipType));
    out.push({
      code: f.code,
      attrs,
      popularTier: f.popular_tier === 1 || f.popular_tier === 2 ? f.popular_tier : null,
      fits: fitsBy.get(f.id) ?? [],
      skus: list,
    });
  }
  out.sort(
    (a, b) =>
      tierRank(a.popularTier) - tierRank(b.popularTier) ||
      a.attrs.diameterMm - b.attrs.diameterMm ||
      (a.code < b.code ? -1 : a.code > b.code ? 1 : 0),
  );
  return { schema: 1, families: out };
}
