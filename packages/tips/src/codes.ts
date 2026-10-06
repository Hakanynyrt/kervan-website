import { TIP_LETTER, type TipType } from './types.ts';

const FAMILY_RE = /^KU(\d{2,3})-(\d{2,})$/;

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** KU + rounded working diameter + two-digit sequence: KU135-07. */
export const familyCode = (diameterMm: number, seq: number): string =>
  `KU${Math.round(diameterMm)}-${String(seq).padStart(2, '0')}`;

/** Family code + tip letter: KU135-07-C. */
export const skuCode = (family: string, type: TipType): string => `${family}-${TIP_LETTER[type]}`;

export interface CodeRequest {
  /** Owner's private row reference (never public). */
  ref: string;
  diameterMm: number;
  /** Deterministic order for new rows, e.g. "Brand Model". */
  sortKey: string;
}

/**
 * Codes are permanent once issued. Rows already in `existing` (ref → code) keep their
 * code. New rows are numbered per rounded diameter after the highest sequence ever
 * issued for it, so a deleted row's code is never reused.
 */
export function assignFamilyCodes(
  rows: readonly CodeRequest[],
  existing: ReadonlyMap<string, string>,
): Map<string, string> {
  const out = new Map<string, string>();
  const maxSeq = new Map<number, number>();
  for (const code of existing.values()) {
    const m = FAMILY_RE.exec(code);
    if (!m) continue;
    const d = Number(m[1]);
    maxSeq.set(d, Math.max(maxSeq.get(d) ?? 0, Number(m[2])));
  }
  for (const r of rows) {
    const c = existing.get(r.ref);
    if (c) out.set(r.ref, c);
  }
  const fresh = rows
    .filter((r) => !existing.has(r.ref))
    .sort(
      (a, b) =>
        Math.round(a.diameterMm) - Math.round(b.diameterMm) ||
        cmp(a.sortKey, b.sortKey) ||
        cmp(a.ref, b.ref),
    );
  for (const r of fresh) {
    const d = Math.round(r.diameterMm);
    const next = (maxSeq.get(d) ?? 0) + 1;
    maxSeq.set(d, next);
    out.set(r.ref, familyCode(d, next));
  }
  return out;
}
