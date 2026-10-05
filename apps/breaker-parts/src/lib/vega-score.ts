import type { VegaItem } from '../types';
import { geomKey } from './vega-index';
import type { FieldKey, Measure, MeasureKey } from './vega-search';

/** Wear-aware soft scoring for "find by measurement". Runs next to the hard
 *  ±tolerance groups: it ranks inside them, names the most likely tip (even
 *  when nothing is inside the tolerance) and suggests the next measurement.
 *  Pure functions, no I/O. The wear directions and sigmas are assumptions
 *  checked only in simulation; calibrate against real worn tips. */

/** [sigma below catalog value, sigma above]. A worn tip is thinner (dia, key),
 *  its slot is longer (pin wear) and its rear end shorter (peened). */
const SIG: Record<Exclude<MeasureKey, 'length'>, [number, number]> = {
  dia: [1.8, 1.1],
  keyThk: [1.3, 1.2],
  slotLen: [1.8, 4],
  backToSlot: [3.5, 1.8],
  rearDia: [1.3, 1.3],
};
/** plain measurement error (no wear) — used for the green/amber/red chips */
const NOISE: Record<Exclude<MeasureKey, 'length'>, number> = {
  dia: 1.1,
  keyThk: 1.2,
  slotLen: 1.8,
  backToSlot: 1.8,
  rearDia: 1.3,
};
const CAP = 12; // per-field cap: one catalog error must not sink a row
const UNKNOWN = 1; // neutral cost when the catalog has no value
const KEY_COUNT_MISS = 8;
const SHAKY = 0.3; // mild prior against medium-confidence / flagged rows
const WORN_MIN = 0.55; // a tip shorter than 55 % of new is implausible

export type ChipState = 'ok' | 'wear' | 'off' | 'unknown';
export interface FieldScore {
  key: FieldKey;
  cost: number;
  state: ChipState;
  /** measured minus catalog (0 when a range contains it) */
  diff: number | null;
}
export interface Scored {
  item: VegaItem;
  cost: number;
  /** probability among the scored pool (sums to 1) */
  p: number;
  fields: FieldScore[];
}

const cost1 = (meas: number, cat: number, [sn, sp]: [number, number]): number => {
  const r = meas - cat;
  return Math.min(CAP, 0.5 * (r / (r < 0 ? sn : sp)) ** 2);
};
const wearDirection: Record<Exclude<MeasureKey, 'length'>, -1 | 1 | 0> = {
  dia: -1,
  keyThk: -1,
  slotLen: 1,
  backToSlot: -1,
  rearDia: 0,
};

function numField(
  key: Exclude<MeasureKey, 'length'>,
  meas: number,
  cat: number | null,
): FieldScore {
  if (cat == null) return { key, cost: UNKNOWN, state: 'unknown', diff: null };
  const diff = meas - cat;
  const cost = cost1(meas, cat, SIG[key]);
  let state: ChipState = 'off';
  if (Math.abs(diff) <= NOISE[key]) state = 'ok';
  else if (cost < CAP && Math.sign(diff) === wearDirection[key]) state = 'wear';
  return { key, cost, state, diff };
}

function lengthField(meas: number, it: VegaItem): FieldScore {
  if (!it.lengthMm) return { key: 'length', cost: UNKNOWN, state: 'unknown', diff: null };
  const { min, max } = it.lengthMm;
  if (meas > max) {
    const over = meas - max;
    return {
      key: 'length',
      cost: Math.min(CAP, 0.5 * (over / 8) ** 2),
      state: over <= 3 ? 'ok' : 'off',
      diff: over,
    };
  }
  if (meas < min * WORN_MIN) {
    return {
      key: 'length',
      cost: Math.min(CAP, 0.5 * ((min * WORN_MIN - meas) / 15) ** 2),
      state: 'off',
      diff: meas - min,
    };
  }
  // anywhere between 55 % and 100 % of new: no information, plausible wear
  return {
    key: 'length',
    cost: 0,
    state: meas >= min ? 'ok' : 'wear',
    diff: meas < min ? meas - min : 0,
  };
}

export function scoreItem(it: VegaItem, m: Measure): { cost: number; fields: FieldScore[] } {
  const fields: FieldScore[] = [];
  if (m.dia !== undefined) {
    const cands = [it.diameterMm, it.collarDiameterMm].filter((v): v is number => v != null);
    const best = cands
      .map((v) => numField('dia', m.dia as number, v))
      .sort((a, b) => a.cost - b.cost)[0];
    fields.push(best ?? { key: 'dia', cost: UNKNOWN, state: 'unknown', diff: null });
  }
  if (m.keyThk !== undefined) fields.push(numField('keyThk', m.keyThk, it.key.thicknessMm));
  if (m.backToSlot !== undefined)
    fields.push(numField('backToSlot', m.backToSlot, it.key.backEndToSlotMm));
  if (m.slotLen !== undefined) fields.push(numField('slotLen', m.slotLen, it.key.slotLengthMm));
  if (m.rearDia !== undefined)
    fields.push(numField('rearDia', m.rearDia, it.rearShoulderDiameterMm));
  if (m.length !== undefined) fields.push(lengthField(m.length, it));
  if (m.keyCount !== undefined) {
    if (it.key.count == null)
      fields.push({ key: 'keyCount', cost: UNKNOWN, state: 'unknown', diff: null });
    else if (it.key.count !== m.keyCount)
      fields.push({ key: 'keyCount', cost: KEY_COUNT_MISS, state: 'off', diff: null });
    else fields.push({ key: 'keyCount', cost: 0, state: 'ok', diff: 0 });
  }
  let cost = fields.reduce((a, f) => a + f.cost, 0);
  if (it.confidence !== 'high' || it.quality.length) cost += SHAKY;
  return { cost, fields };
}

/** Score and rank a pool; p is a softmax over the pool. */
export function rankByScore(pool: VegaItem[], m: Measure): Scored[] {
  const s = pool.map((item) => ({ item, ...scoreItem(item, m), p: 0 }));
  s.sort((a, b) => a.cost - b.cost);
  if (!s.length) return s;
  const c0 = s[0].cost;
  let z = 0;
  for (const x of s) {
    x.p = Math.exp(-(x.cost - c0));
    z += x.p;
  }
  for (const x of s) x.p /= z;
  return s;
}

export interface Likely {
  /** rows of the most likely geometry, best first */
  items: VegaItem[];
  p: number;
  /** runner-up geometry */
  runner: { items: VegaItem[]; p: number } | null;
}

/** Fold the ranking into geometry groups and return the top one. */
export function mostLikely(ranked: Scored[]): Likely | null {
  if (!ranked.length) return null;
  const groups = new Map<string, { items: VegaItem[]; p: number }>();
  for (const s of ranked) {
    const k = geomKey(s.item);
    const g = groups.get(k);
    if (g) {
      g.items.push(s.item);
      g.p += s.p;
    } else groups.set(k, { items: [s.item], p: s.p });
  }
  const [top, runner] = [...groups.values()].sort((a, b) => b.p - a.p);
  return { items: top.items, p: top.p, runner: runner ?? null };
}

/** Only a diameter plus at least one key dimension makes the % meaningful. */
export const likelyIsMeaningful = (m: Measure): boolean =>
  m.dia !== undefined &&
  (m.keyThk !== undefined || m.slotLen !== undefined || m.backToSlot !== undefined);

const NEXT_CANDIDATES: FieldKey[] = ['keyCount', 'backToSlot', 'slotLen', 'keyThk', 'rearDia'];
const catValue = (it: VegaItem, f: FieldKey): number | null =>
  f === 'keyCount'
    ? it.key.count
    : f === 'keyThk'
      ? it.key.thicknessMm
      : f === 'slotLen'
        ? it.key.slotLengthMm
        : f === 'backToSlot'
          ? it.key.backEndToSlotMm
          : f === 'rearDia'
            ? it.rearShoulderDiameterMm
            : null;

function groupEntropy(s: Scored[]): number {
  const m = new Map<string, number>();
  for (const x of s) {
    const k = geomKey(x.item);
    m.set(k, (m.get(k) ?? 0) + x.p);
  }
  let h = 0;
  for (const p of m.values()) if (p > 1e-9) h -= p * Math.log2(p);
  return h;
}

export interface NextMeasure {
  key: FieldKey;
  /** effective number of candidate geometries now and expected after measuring */
  before: number;
  after: number;
}

/** Which unmeasured field would best split the remaining candidates
 *  (expected drop in geometry entropy over the top-K rows). */
export function nextBestMeasure(m: Measure, ranked: Scored[], k = 25): NextMeasure | null {
  const cands = ranked.slice(0, k).map((x) => ({ ...x }));
  const tot = cands.reduce((a, x) => a + x.p, 0);
  if (!cands.length || tot <= 0) return null;
  for (const x of cands) x.p /= tot;
  const h0 = groupEntropy(cands);
  if (h0 < 0.3) return null; // already (almost) decided
  let best: NextMeasure | null = null;
  let bestGain = 0.15; // ignore fields that barely help
  for (const f of NEXT_CANDIDATES) {
    if (f === 'keyCount' ? m.keyCount !== undefined : m[f as MeasureKey] !== undefined) continue;
    let eh = 0;
    for (const h of cands) {
      const v = catValue(h.item, f);
      if (v == null) {
        eh += h.p * h0;
        continue;
      }
      const m2: Measure = f === 'keyCount' ? { ...m, keyCount: v as 1 | 2 } : { ...m, [f]: v };
      eh +=
        h.p *
        groupEntropy(
          rankByScore(
            cands.map((x) => x.item),
            m2,
          ),
        );
    }
    const gain = h0 - eh;
    if (gain > bestGain) {
      bestGain = gain;
      best = { key: f, before: 2 ** h0, after: 2 ** eh };
    }
  }
  return best;
}
