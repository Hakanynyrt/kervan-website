import type { VegaItem, VegaRange, VegaTip } from '../types';

/** Pure search/matching helpers for the private tip catalog. No I/O, no storage. */

export const TOLERANCES = [1, 2, 5] as const;
export const DEFAULT_TOL = 5;
export const TIP_TYPES: VegaTip[] = ['chisel', 'moil', 'blunt', 'pyramid'];
export const TIP_LABEL: Record<VegaTip, string> = {
  chisel: 'Chisel',
  moil: 'Moil Point',
  blunt: 'Blunt Tool',
  pyramid: 'Pyramid',
};

export type MeasureKey = 'dia' | 'keyThk' | 'backToSlot' | 'slotLen' | 'rearDia' | 'length';
export type Measure = Partial<Record<MeasureKey, number>> & { keyCount?: 1 | 2 };
export type FieldKey = MeasureKey | 'keyCount';
export type Group = 'match' | 'maybe' | 'wear';

export interface Query {
  text: string;
  brand: string;
  tip: VegaTip | '';
  hideLow: boolean;
  measure: Measure;
  tol: number;
}
export interface Hit {
  item: VegaItem;
  group: Group | null;
  score: number;
  /** item value minus entered value (0 when an entered range contains it) */
  diffs: Partial<Record<MeasureKey, number>>;
  unknown: FieldKey[];
}
export interface Results {
  measuring: boolean;
  groups: Record<Group, Hit[]>;
  list: Hit[];
  total: number;
}

/** "52,5" | "52.5" -> 52.5; empty/invalid/negative -> undefined */
export function parseNum(raw: string): number | undefined {
  const s = raw.trim().replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

const TR_MAP: Record<string, string> = { ı: 'i', ğ: 'g', ü: 'u', ş: 's', ö: 'o', ç: 'c', İ: 'i' };
export const compact = (s: string): string =>
  s
    .replace(/[ıİğüşöç]/g, (c) => TR_MAP[c] ?? c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
const hay = new WeakMap<VegaItem, { fields: string[] }>();
function haystack(it: VegaItem) {
  let h = hay.get(it);
  if (!h) {
    h = { fields: [it.model, ...it.partNos, ...it.fitsBreakers, it.brand].map(compact) };
    hay.set(it, h);
  }
  return h;
}

function textMatches(it: VegaItem, text: string): boolean {
  const q = text.trim();
  if (!q) return true;
  const h = haystack(it);
  const cq = compact(q);
  return cq === '' || h.fields.some((f) => f.includes(cq));
}

type Verdict = { kind: 'ok'; diff: number } | { kind: 'miss' } | { kind: 'unknown' };

function numVerdict(entered: number, actual: number | null, tol: number): Verdict {
  if (actual == null) return { kind: 'unknown' };
  const diff = actual - entered;
  return Math.abs(diff) <= tol ? { kind: 'ok', diff } : { kind: 'miss' };
}
function rangeVerdict(entered: number, r: VegaRange | null, tol: number): Verdict {
  if (!r) return { kind: 'unknown' };
  const diff = entered < r.min ? r.min - entered : entered > r.max ? r.max - entered : 0;
  return Math.abs(diff) <= tol ? { kind: 'ok', diff } : { kind: 'miss' };
}
function diaVerdict(entered: number, it: VegaItem, tol: number): Verdict {
  const vals = [it.diameterMm, it.collarDiameterMm].filter((v): v is number => v != null);
  if (!vals.length) return { kind: 'unknown' };
  const diff = vals.map((v) => v - entered).sort((a, b) => Math.abs(a) - Math.abs(b))[0];
  return Math.abs(diff) <= tol ? { kind: 'ok', diff } : { kind: 'miss' };
}

const MEASURE_KEYS: MeasureKey[] = ['dia', 'keyThk', 'backToSlot', 'slotLen', 'rearDia', 'length'];

export const hasMeasure = (m: Measure): boolean =>
  m.keyCount !== undefined || MEASURE_KEYS.some((k) => m[k] !== undefined);

function evaluate(it: VegaItem, m: Measure, tol: number): Hit | null {
  const diffs: Hit['diffs'] = {};
  const unknown: FieldKey[] = [];
  const misses: string[] = [];
  let ok = 0;
  let score = 0;
  const take = (k: MeasureKey, v: Verdict) => {
    if (v.kind === 'ok') {
      ok++;
      score += Math.abs(v.diff);
      diffs[k] = v.diff;
    } else if (v.kind === 'unknown') unknown.push(k);
    else misses.push(k);
  };
  if (m.dia !== undefined) take('dia', diaVerdict(m.dia, it, tol));
  if (m.keyThk !== undefined) take('keyThk', numVerdict(m.keyThk, it.key.thicknessMm, tol));
  if (m.backToSlot !== undefined)
    take('backToSlot', numVerdict(m.backToSlot, it.key.backEndToSlotMm, tol));
  if (m.slotLen !== undefined) take('slotLen', numVerdict(m.slotLen, it.key.slotLengthMm, tol));
  if (m.rearDia !== undefined)
    take('rearDia', numVerdict(m.rearDia, it.rearShoulderDiameterMm, tol));
  if (m.length !== undefined) take('length', rangeVerdict(m.length, it.lengthMm, tol));
  if (m.keyCount !== undefined) {
    if (it.key.count == null) unknown.push('keyCount');
    else if (it.key.count !== m.keyCount) misses.push('keyCount');
    else ok++;
  }
  if (misses.length === 0) {
    if (ok === 0) return null; // nothing we could actually compare
    return { item: it, group: unknown.length ? 'maybe' : 'match', score, diffs, unknown };
  }
  // Only the length differs while something else matched: worn tip candidate.
  if (misses.length === 1 && misses[0] === 'length' && ok > 0) {
    return { item: it, group: 'wear', score, diffs, unknown };
  }
  return null;
}

export function searchCatalog(items: VegaItem[], q: Query): Results {
  const pool = items.filter(
    (it) =>
      (!q.brand || it.brand === q.brand) &&
      (!q.tip || it.tipTypes.includes(q.tip)) &&
      (!q.hideLow || it.confidence === 'high') &&
      textMatches(it, q.text),
  );
  const measuring = hasMeasure(q.measure);
  const groups: Record<Group, Hit[]> = { match: [], maybe: [], wear: [] };
  if (!measuring) {
    const list = pool
      .map((item): Hit => ({ item, group: null, score: 0, diffs: {}, unknown: [] }))
      .sort(
        (a, b) =>
          a.item.brand.localeCompare(b.item.brand) ||
          a.item.model.localeCompare(b.item.model, 'en', { numeric: true }),
      );
    return { measuring, groups, list, total: list.length };
  }
  for (const it of pool) {
    const h = evaluate(it, q.measure, q.tol);
    if (h && h.group) groups[h.group].push(h);
  }
  for (const g of Object.keys(groups) as Group[]) {
    groups[g].sort(
      (a, b) =>
        a.score - b.score || a.item.model.localeCompare(b.item.model, 'en', { numeric: true }),
    );
  }
  return {
    measuring,
    groups,
    list: [],
    total: groups.match.length + groups.maybe.length + groups.wear.length,
  };
}

export const brandsOf = (items: VegaItem[]): string[] =>
  [...new Set(items.map((i) => i.brand))].sort((a, b) => a.localeCompare(b));

export const needsVerification = (it: VegaItem): boolean =>
  it.confidence !== 'high' || it.reviewFlags.length > 0 || it.quality.length > 0;

export function fmtNum(n: number, lang: string): string {
  return n.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { maximumFractionDigits: 2 });
}
export function fmtRange(r: VegaRange | null, lang: string): string | null {
  if (!r) return null;
  return r.min === r.max ? fmtNum(r.min, lang) : `${fmtNum(r.min, lang)}–${fmtNum(r.max, lang)}`;
}
export function fmtDiff(d: number, lang: string): string {
  const s = fmtNum(Math.abs(d), lang);
  return d === 0 ? '0' : `${d > 0 ? '+' : '−'}${s}`;
}
