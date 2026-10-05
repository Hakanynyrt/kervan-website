import type { VegaItem, VegaRange, VegaTip } from '../types';
import { type CatalogIndex, compact, geomKey, textSearch } from './vega-index';
import { scoreItem } from './vega-score';
import { type Popularity, popularPrior } from './vega-popular';

/** Pure search/matching helpers for the private tip catalog. No I/O, no storage. */

export const TOLERANCES = [1, 2, 5] as const;
export const DEFAULT_TOL = 5;
export const TIP_TYPES: VegaTip[] = ['chisel', 'moil', 'blunt', 'pyramid'];

export type MeasureKey = 'dia' | 'keyThk' | 'backToSlot' | 'slotLen' | 'rearDia' | 'length';
export type Measure = Partial<Record<MeasureKey, number>> & { keyCount?: 1 | 2 };
export type FieldKey = MeasureKey | 'keyCount';
export type Group = 'match' | 'maybe';

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
  /** text search: lower is better */
  textCost?: number;
  /** cross-reference name that made this row match */
  via?: string;
  /** breaker name the text query matched (model or cross-reference) */
  matched?: string;
  /** measurement mode: other rows with identical geometry folded into this card */
  twins?: VegaItem[];
}
export interface Results {
  measuring: boolean;
  /** the text search only matched through the sound-alike fallback */
  phonetic: boolean;
  /** rows that passed the text/brand/tip filters (before tolerance) */
  pool: VegaItem[];
  groups: Record<Group, Hit[]>;
  list: Hit[];
  total: number;
}

/** "52,5" | "52.5" -> 52.5; empty/invalid/negative -> undefined */
export function parseNum(raw: string): number | undefined {
  const s = raw
    .trim()
    .replace(/\s*mm$/i, '')
    .replace(',', '.');
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
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
  return null;
}

export function searchCatalog(
  items: VegaItem[],
  q: Query & { popularOnly?: boolean },
  idx: CatalogIndex,
  pop?: Popularity,
): Results {
  const text = q.text.trim();
  const ts = text ? textSearch(idx, text) : null;
  // owner aliases (breaker name -> catalog model) count as an exact cross-reference hit
  const aliasHit = text && pop ? pop.aliasTo.get(compact(text)) : undefined;
  if (ts && aliasHit && !ts.hits.has(aliasHit)) {
    ts.hits.set(aliasHit, { cost: -9, matched: text, via: text });
  }
  const prior = (it: VegaItem) => (pop ? popularPrior(pop, it) : 0);
  const pool = items.filter(
    (it) =>
      (!q.brand || it.brand === q.brand) &&
      (!q.tip || it.tipTypes.includes(q.tip)) &&
      (!q.hideLow || it.confidence === 'high') &&
      (!q.popularOnly || !pop || pop.tier.has(it) || pop.twin.has(it)) &&
      (!ts || ts.hits.has(it)),
  );
  const withText = (h: Hit): Hit => {
    const th = ts?.hits.get(h.item);
    return th ? { ...h, textCost: th.cost, via: th.via, matched: th.matched } : h;
  };
  const byName = (a: Hit, b: Hit) =>
    a.item.brand.localeCompare(b.item.brand) ||
    a.item.model.localeCompare(b.item.model, 'en', { numeric: true });
  const measuring = hasMeasure(q.measure);
  const phonetic = ts?.phonetic ?? false;
  const groups: Record<Group, Hit[]> = { match: [], maybe: [] };
  if (!measuring) {
    const list = pool
      .map((item): Hit => withText({ item, group: null, score: 0, diffs: {}, unknown: [] }))
      .sort(
        (a, b) =>
          (a.textCost ?? 0) + prior(a.item) / 6 - ((b.textCost ?? 0) + prior(b.item) / 6) ||
          byName(a, b),
      );
    return { measuring, phonetic, pool, groups, list, total: list.length };
  }
  for (const it of pool) {
    const h = evaluate(it, q.measure, q.tol);
    if (h && h.group) groups[h.group].push(withText(h));
  }
  // Inside a group the wear-aware score decides the order (a worn tip is
  // thinner, its slot longer): a 1 mm thinner diameter beats a 1 mm thicker one.
  const soft = new Map<VegaItem, number>();
  for (const g of Object.keys(groups) as Group[]) {
    for (const h of groups[g]) soft.set(h.item, scoreItem(h.item, q.measure).cost + prior(h.item));
    groups[g].sort(
      (a, b) =>
        (soft.get(a.item) ?? 0) - (soft.get(b.item) ?? 0) ||
        a.score - b.score ||
        a.item.model.localeCompare(b.item.model, 'en', { numeric: true }),
    );
    // Identical geometry = the same part: show one card with the others listed on it.
    const seen = new Map<string, Hit>();
    groups[g] = groups[g].filter((h) => {
      const k = geomKey(h.item);
      const first = seen.get(k);
      if (first) {
        (first.twins ??= []).push(h.item);
        return false;
      }
      seen.set(k, h);
      return true;
    });
  }
  return {
    measuring,
    phonetic,
    pool,
    groups,
    list: [],
    total: groups.match.length + groups.maybe.length,
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
