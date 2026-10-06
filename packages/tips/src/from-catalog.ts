import { breaker, splitBreakerName } from './breakers.ts';
import { assignFamilyCodes, skuCode } from './codes.ts';
import {
  isTipType,
  TIP_TYPES,
  type Breaker,
  type FamilyAttrs,
  type Range,
  type TipType,
} from './types.ts';

/** One row of the owner's private catalog JSON (`items[]`); only the fields the shop uses. */
export interface SourceRow {
  id: string;
  model: string;
  brand: string;
  fitsBreakers: string[];
  tipTypes: string[];
  diameterMm: number | null;
  collarDiameterMm: number | null;
  key: {
    count: 1 | 2 | null;
    thicknessMm: number | null;
    slotLengthMm: number | null;
    backEndToSlotMm: number | null;
  };
  rearShoulderDiameterMm: number | null;
  lengthMm: Range | null;
  lengthByType: Partial<Record<string, Range>> | null;
  weightKg: Range | null;
  weightByType: Partial<Record<string, Range>> | null;
  rearStep?: boolean | null;
  slotEnd?: 'rounded' | 'tapered' | null;
  tipAngleDeg?: number | null;
}

/** Owner's best-seller list: catalog model name → tier. */
export interface SourcePopular {
  models?: Record<string, number>;
}

export interface ImportSku {
  code: string;
  tipType: TipType;
  lengthMm: Range | null;
  weightKg: Range | null;
  tipAngleDeg: number | null;
}

export interface ImportFamily {
  /** Private row reference (stored in D1 only, never public). */
  ref: string;
  code: string;
  attrs: FamilyAttrs;
  popularTier: 1 | 2 | null;
  fits: Breaker[];
  skus: ImportSku[];
}

export interface ImportResult {
  families: ImportFamily[];
  skipped: { ref: string; reason: 'no-diameter' | 'no-tip-type' }[];
}

const tier = (v: unknown): 1 | 2 | null => (v === 1 || v === 2 ? v : null);

export function fromCatalog(
  rows: readonly SourceRow[],
  popular: SourcePopular | null,
  existing: ReadonlyMap<string, string>,
): ImportResult {
  const skipped: ImportResult['skipped'] = [];
  const valid: { row: SourceRow; d: number; types: TipType[] }[] = [];
  for (const row of rows) {
    if (row.diameterMm == null) {
      skipped.push({ ref: row.id, reason: 'no-diameter' });
      continue;
    }
    const types = TIP_TYPES.filter((t) => row.tipTypes.some((x) => x === t && isTipType(x)));
    if (types.length === 0) {
      skipped.push({ ref: row.id, reason: 'no-tip-type' });
      continue;
    }
    valid.push({ row, d: row.diameterMm, types });
  }

  const brands = [...new Set(rows.map((r) => r.brand).filter(Boolean))];
  const codes = assignFamilyCodes(
    valid.map(({ row, d }) => ({
      ref: row.id,
      diameterMm: d,
      sortKey: `${row.brand} ${row.model}`,
    })),
    existing,
  );

  const families = valid.map(({ row, d, types }): ImportFamily => {
    const code = codes.get(row.id)!;
    const seen = new Set<string>();
    const fits: Breaker[] = [];
    const names = [
      splitBreakerName(row.model, brands, row.brand),
      ...row.fitsBreakers.map((n) => splitBreakerName(n, brands)),
    ];
    for (const n of names) {
      if (!n.model) continue;
      const b = breaker(n.brand, n.model);
      if (seen.has(b.slug)) continue;
      seen.add(b.slug);
      fits.push(b);
    }
    return {
      ref: row.id,
      code,
      attrs: {
        diameterMm: d,
        collarDiameterMm: row.collarDiameterMm,
        key: {
          count: row.key.count,
          thicknessMm: row.key.thicknessMm,
          slotLengthMm: row.key.slotLengthMm,
          backEndToSlotMm: row.key.backEndToSlotMm,
          slotEnd: row.slotEnd ?? null,
        },
        rear: { step: row.rearStep ?? null, diameterMm: row.rearShoulderDiameterMm },
      },
      popularTier: tier(popular?.models?.[row.model]),
      fits,
      skus: types.map((t) => ({
        code: skuCode(code, t),
        tipType: t,
        lengthMm: row.lengthByType?.[t] ?? row.lengthMm,
        weightKg: row.weightByType?.[t] ?? row.weightKg,
        // The catalogue prints one angle per drawing; it is only unambiguous for a single type.
        tipAngleDeg: types.length === 1 ? (row.tipAngleDeg ?? null) : null,
      })),
    };
  });

  return { families, skipped };
}
