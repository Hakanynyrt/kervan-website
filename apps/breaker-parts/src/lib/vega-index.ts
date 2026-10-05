import type { VegaItem } from '../types';

/** Search index for the private tip catalog: typo-tolerant name search,
 *  identical-geometry groups and "one breaker, different sizes" conflicts.
 *  Built in memory after sign-in; nothing is stored or sent anywhere. */

const TR_MAP: Record<string, string> = { ı: 'i', ğ: 'g', ü: 'u', ş: 's', ö: 'o', ç: 'c', İ: 'i' };
const fold = (s: string): string => s.replace(/[ıİğüşöç]/g, (c) => TR_MAP[c] ?? c).toLowerCase();
export const compact = (s: string): string => fold(s).replace(/[^a-z0-9]+/g, '');

/** Brand spellings that refer to the same maker (applied to names and queries). */
const ALIAS: Record<string, string> = {
  caterpiller: 'caterpillar',
  cat: 'caterpillar',
  kanglim: 'kwanglim',
  europam: 'euroram',
  epiroc: 'atlas',
  daemo: 'demo',
  ii: '2',
  iii: '3',
  iv: '4',
};

const isNum = (t: string): boolean => /^\d+$/.test(t);
const sound = (t: string): string =>
  isNum(t)
    ? t
    : t
        .replace(/c/g, 'k')
        .replace(/w/g, 'v')
        .replace(/(.)\1+/g, '$1');

/** "Furukawa HB20G-II" -> ["furukawa","hb","20","g","2"] */
export function tokenize(s: string, phonetic = false): string[] {
  const out = fold(s)
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((t) => ALIAS[t] ?? t);
  return phonetic ? out.map(sound) : out;
}

/** Damerau–Levenshtein distance with early exit above `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}

interface Name {
  kind: 'model' | 'fits';
  raw: string;
  compact: string;
  toks: string[];
  /** toks plus adjacent pairs joined ("atlas"+"copco" -> "atlascopco") */
  all: string[];
  ptoks: string[];
  pall: string[];
}

const withJoins = (toks: string[]): string[] => {
  const out = [...toks];
  for (let i = 0; i + 1 < toks.length; i++) out.push(toks[i] + toks[i + 1]);
  return out;
};

function makeName(kind: Name['kind'], raw: string, extra: string[] = []): Name {
  const toks = [...new Set([...tokenize(raw), ...extra])];
  const ptoks = toks.map(sound);
  return {
    kind,
    raw,
    compact: compact(raw),
    toks,
    all: withJoins(toks),
    ptoks,
    pall: withJoins(ptoks),
  };
}

/** Geometry that decides whether two tips are the same part (all present in every row). */
export const geomKey = (it: VegaItem): string =>
  [
    it.diameterMm,
    it.collarDiameterMm ?? '',
    it.key.count ?? '',
    it.key.thicknessMm ?? '',
    it.key.slotLengthMm ?? '',
    it.key.backEndToSlotMm ?? '',
  ].join('|');

export interface CatalogIndex {
  rows: { it: VegaItem; names: Name[]; pns: string[] }[];
  /** same geometry -> rows (only groups of 2+) */
  byGeom: Map<string, VegaItem[]>;
  /** compact breaker name -> distinct geometries it points to */
  nameGeoms: Map<string, Set<string>>;
  /** part number -> rows with DIFFERENT geometry that also list it (catalog error) */
  partNoClash: Map<string, VegaItem[]>;
}

export function buildIndex(items: VegaItem[]): CatalogIndex {
  const rows = items.map((it) => ({
    it,
    names: [
      makeName('model', it.model, tokenize(it.brand)),
      ...it.fitsBreakers.map((f) => makeName('fits', f)),
    ],
    pns: it.partNos.map(compact),
  }));
  const groups = new Map<string, VegaItem[]>();
  for (const it of items) {
    const k = geomKey(it);
    const g = groups.get(k);
    if (g) g.push(it);
    else groups.set(k, [it]);
  }
  const byGeom = new Map([...groups].filter(([, g]) => g.length > 1));
  const nameGeoms = new Map<string, Set<string>>();
  for (const it of items) {
    for (const n of [it.model, ...it.fitsBreakers]) {
      const k = compact(n);
      const s = nameGeoms.get(k) ?? new Set<string>();
      s.add(geomKey(it));
      nameGeoms.set(k, s);
    }
  }
  const byPn = new Map<string, VegaItem[]>();
  for (const it of items) {
    for (const pn of it.partNos) {
      const l = byPn.get(pn) ?? [];
      l.push(it);
      byPn.set(pn, l);
    }
  }
  const partNoClash = new Map<string, VegaItem[]>();
  for (const [pn, l] of byPn) {
    if (new Set(l.map(geomKey)).size > 1) partNoClash.set(pn, l);
  }
  return { rows, byGeom, nameGeoms, partNoClash };
}

export const equivalentsOf = (idx: CatalogIndex, it: VegaItem): VegaItem[] =>
  (idx.byGeom.get(geomKey(it)) ?? []).filter((x) => x !== it);

/** Other rows (different sizes) that share one of this row's part numbers. */
export const partNoClashesOf = (idx: CatalogIndex, it: VegaItem): VegaItem[] => {
  const out: VegaItem[] = [];
  for (const pn of it.partNos) {
    for (const x of idx.partNoClash.get(pn) ?? []) if (x !== it && !out.includes(x)) out.push(x);
  }
  return out;
};
/** VEGA part numbers are "VT" + 7 digits; anything else is a catalog typo. */
export const partNoLooksBroken = (pn: string): boolean => !/^VT\d{7}$/.test(pn);

/** How many different tip geometries the catalog lists for this breaker name. */
export const geometriesFor = (idx: CatalogIndex, name: string): number =>
  idx.nameGeoms.get(compact(name))?.size ?? 0;

export interface TextHit {
  cost: number;
  /** cross-reference name that matched, when it was not the row's own model */
  via?: string;
  /** breaker name that matched (model or cross-reference) */
  matched: string;
}

/** cost of matching one query token against a name, Infinity when it does not match */
function tokenCost(
  q: string,
  cands: string[],
  last: boolean,
  dist: (q: string, t: string, max: number) => number,
): number {
  let best = Infinity;
  for (const t of cands) {
    if (t === q) return 0;
    if (isNum(q)) {
      // numbers must be exact; only the token being typed may be a prefix
      if (last && isNum(t) && t.startsWith(q)) best = Math.min(best, 1.5);
      continue;
    }
    if (isNum(t)) continue;
    if (q.length >= 2 && t.startsWith(q)) best = Math.min(best, 0.5);
    const max = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;
    if (max) {
      const e = dist(q, t, max);
      if (e <= max) best = Math.min(best, e);
    }
  }
  return best;
}

function run(idx: CatalogIndex, query: string, phonetic: boolean): Map<VegaItem, TextHit> {
  const qc = compact(query);
  const qt = tokenize(query, phonetic);
  const out = new Map<VegaItem, TextHit>();
  if (!qc) return out;
  const qNums = new Set(qt.filter(isNum));
  const memo = new Map<string, number>();
  const dist = (a: string, b: string, max: number) => {
    const k = `${a}\u0000${b}`;
    let v = memo.get(k);
    if (v === undefined) {
      v = editDistance(a, b, max);
      memo.set(k, v);
    }
    return v;
  };
  // part numbers: "vt0103041", "103041", "vt 01-03041"
  const pnQuery = /\d{4,}/.test(qc) ? qc : null;
  for (const row of idx.rows) {
    let best: TextHit | null = null;
    if (
      pnQuery &&
      row.pns.some(
        (p) => p.includes(pnQuery) || p.slice(4).startsWith(pnQuery.replace(/^vt\d\d/, '')),
      )
    ) {
      best = { cost: 0, matched: row.it.model };
    }
    for (const n of row.names) {
      let cost = 0;
      if (qt.length) {
        const cands = phonetic ? n.pall : n.all;
        for (let i = 0; i < qt.length && cost !== Infinity; i++) {
          cost += tokenCost(qt[i], cands, i === qt.length - 1, dist);
        }
      } else cost = Infinity;
      // keep the old squashed-substring behaviour as a fallback so nothing is lost
      if (cost === Infinity && qc.length >= 2 && n.compact.includes(qc)) cost = 2;
      if (cost === Infinity) continue;
      if (n.compact === qc) cost -= 10;
      cost += 0.2 * n.toks.filter((t) => isNum(t) && !qNums.has(t)).length;
      if (n.kind === 'fits') cost += 1;
      if (!best || cost < best.cost) {
        best = { cost, matched: n.raw, via: n.kind === 'fits' ? n.raw : undefined };
      }
    }
    if (best) out.set(row.it, best);
  }
  return out;
}

/** Typo-tolerant search. Falls back to a sound-alike pass ("atlas kopko") only
 *  when the normal pass finds nothing. */
export function textSearch(
  idx: CatalogIndex,
  query: string,
): { hits: Map<VegaItem, TextHit>; phonetic: boolean } {
  const hits = run(idx, query, false);
  if (hits.size || !compact(query)) return { hits, phonetic: false };
  return { hits: run(idx, query, true), phonetic: true };
}
