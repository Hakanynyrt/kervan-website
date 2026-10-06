import {
  isTipType,
  TIP_TYPES,
  type Availability,
  type FamilyAttrs,
  type PublicCatalog,
  type PublicFamily,
  type PublicSku,
  type Range,
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
export interface FitRow {
  family_id: number;
  brand: string;
  model: string;
  slug: string;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const range = (a: number | null, b: number | null): Range | null => {
  const min = num(a) ?? num(b);
  const max = num(b) ?? num(a);
  return min === null || max === null ? null : { min, max };
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
