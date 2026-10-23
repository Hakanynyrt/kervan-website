import type { FamilyRow, SkuRow } from './public.ts';
import { isTipType, type FamilyAttrs, type TipType } from './types.ts';

/**
 * Kervan's own approved drawing for a tip family overrides the catalogue-derived data. Stored in
 * D1 `drawing_overrides` (never in git: the values are drawing data), written by the "Shop
 * prices" workflow (`drawings` in the price sheet), applied by build-catalog on top of the
 * `families` / `skus` rows. The catalogue import never touches that table, so a re-import
 * cannot undo a drawing.
 */
export interface DrawingOverride {
  /** Top-level FamilyAttrs keys; each replaces the catalogue's key as a whole. */
  attrs?: Partial<FamilyAttrs>;
  /** Per tip type ('*' = every type; a type's own entry wins). Exact drawing values. */
  skus?: Partial<Record<TipType | '*', DrawingSku>>;
}

export interface DrawingSku {
  lengthMm?: number;
  weightKg?: number;
  tipAngleDeg?: number;
}

/** `SELECT family_code, data FROM drawing_overrides` */
export interface DrawingRow {
  family_code: string;
  data: string;
}

const ATTR_KEYS: readonly (keyof FamilyAttrs)[] = [
  'diameterMm',
  'collarDiameterMm',
  'key',
  'rear',
  'collarEndMm',
  'chiselEdge',
  'chiselLandMm',
  'profile',
];
export const DRAWING_FAMILY = /^KU\d+(?:\.\d+)?-\d{2}$/;

const pos = (v: unknown, max: number): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 && v < max ? v : undefined;

/**
 * Validates an override (throws on anything it does not know, so a bad sheet never half-applies).
 * The attrs values are checked again field by field by the public whitelist at build time.
 */
export function parseDrawingOverride(v: unknown): DrawingOverride {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('bad drawing override');
  const o = v as Record<string, unknown>;
  for (const k of Object.keys(o))
    if (k !== 'attrs' && k !== 'skus') throw new Error(`bad drawing key ${k}`);
  const out: DrawingOverride = {};
  if (o.attrs !== undefined) {
    if (!o.attrs || typeof o.attrs !== 'object' || Array.isArray(o.attrs))
      throw new Error('bad drawing attrs');
    for (const k of Object.keys(o.attrs))
      if (!(ATTR_KEYS as readonly string[]).includes(k))
        throw new Error(`bad drawing attrs key ${k}`);
    out.attrs = o.attrs as Partial<FamilyAttrs>;
  }
  if (o.skus !== undefined) {
    if (!o.skus || typeof o.skus !== 'object' || Array.isArray(o.skus))
      throw new Error('bad drawing skus');
    const skus: Partial<Record<TipType | '*', DrawingSku>> = {};
    for (const [t, raw] of Object.entries(o.skus as Record<string, unknown>)) {
      if (t !== '*' && !isTipType(t)) throw new Error(`bad drawing tip type ${t}`);
      if (!raw || typeof raw !== 'object') throw new Error('bad drawing sku');
      const r = raw as Record<string, unknown>;
      const s: DrawingSku = {};
      for (const [k, max] of [
        ['lengthMm', 5000],
        ['weightKg', 2000],
        ['tipAngleDeg', 180],
      ] as const) {
        if (r[k] === undefined) continue;
        const n = pos(r[k], max);
        if (n === undefined) throw new Error(`bad drawing ${k}`);
        s[k] = n;
      }
      for (const k of Object.keys(r))
        if (k !== 'lengthMm' && k !== 'weightKg' && k !== 'tipAngleDeg')
          throw new Error(`bad drawing sku key ${k}`);
      skus[t as TipType | '*'] = s;
    }
    out.skus = skus;
  }
  return out;
}

/**
 * Applies the drawing overrides to the D1 rows (before toPublicCatalog, so its whitelist still
 * checks every value). Unreadable rows are skipped; returns new arrays and the number applied.
 */
export function applyDrawings(
  families: readonly FamilyRow[],
  skus: readonly SkuRow[],
  rows: readonly DrawingRow[],
): { families: FamilyRow[]; skus: SkuRow[]; applied: number } {
  const by = new Map<string, DrawingOverride>();
  for (const r of rows) {
    if (!DRAWING_FAMILY.test(r.family_code)) continue;
    try {
      by.set(r.family_code, parseDrawingOverride(JSON.parse(r.data)));
    } catch {
      // A malformed row is ignored rather than breaking the build; the catalogue data stays.
    }
  }
  const idOf = new Map<number, DrawingOverride>();
  let applied = 0;
  const outF = families.map((f) => {
    const o = by.get(f.code);
    if (!o) return f;
    idOf.set(f.id, o);
    applied++;
    if (!o.attrs) return f;
    let base: Record<string, unknown>;
    try {
      base = JSON.parse(f.attrs) as Record<string, unknown>;
    } catch {
      return f;
    }
    return { ...f, attrs: JSON.stringify({ ...base, ...o.attrs }) };
  });
  const outS = skus.map((s) => {
    const o = idOf.get(s.family_id);
    if (!o?.skus) return s;
    const d = { ...o.skus['*'], ...(isTipType(s.tip_type) ? o.skus[s.tip_type] : undefined) };
    return {
      ...s,
      ...(d.lengthMm !== undefined ? { length_min_mm: d.lengthMm, length_max_mm: d.lengthMm } : {}),
      ...(d.weightKg !== undefined ? { weight_min_kg: d.weightKg, weight_max_kg: d.weightKg } : {}),
      ...(d.tipAngleDeg !== undefined ? { tip_angle_deg: d.tipAngleDeg } : {}),
    };
  });
  return { families: outF, skus: outS, applied };
}
