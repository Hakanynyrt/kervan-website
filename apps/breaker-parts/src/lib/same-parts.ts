import { breakerKeys, fold } from '@kervan/tips';

/**
 * Owner-only "Ortak parçalar": breakers whose parts (piston, cylinder, bushings…) are the same.
 * The list lives only in the private KV key `parts:v1` (served with /api/tech/fits to a signed-in
 * owner), never in the repo or the bundle: the public sites must not show which parts match.
 *
 * KV shape (schema 1):
 *   { "schema": 1, "groups": [ { "models": ["Daemo DMB S 500 V", "MTB 30"],
 *       "same": { "tr": ["Piston"], "en": ["Piston"] },
 *       "different": { "tr": ["Yan saplama"], "en": ["Side bolt"] },
 *       "note": { "tr": "…", "en": "…" } } ] }
 * `different` and `note` are optional; `en` falls back to `tr`.
 */
export interface Texts {
  tr: string[];
  en: string[];
}
export interface SamePartsGroup {
  models: string[];
  same: Texts;
  different: Texts;
  note: { tr: string; en: string } | null;
}
export interface SamePartsMatch {
  /** The other breakers of the group, as written in the list. */
  others: string[];
  same: string[];
  different: string[];
  note: string | null;
}

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];

const texts = (v: unknown): Texts => {
  const o = (v && typeof v === 'object' ? v : {}) as { tr?: unknown; en?: unknown };
  const tr = strings(o.tr);
  const en = strings(o.en);
  return { tr, en: en.length ? en : tr };
};

/** The list from KV, checked: malformed entries are dropped, never thrown on. */
export function parseSameParts(raw: unknown): SamePartsGroup[] {
  if (!raw || typeof raw !== 'object') return [];
  const groups = (raw as { groups?: unknown }).groups;
  if (!Array.isArray(groups)) return [];
  const out: SamePartsGroup[] = [];
  for (const g of groups) {
    if (!g || typeof g !== 'object') continue;
    const x = g as { models?: unknown; same?: unknown; different?: unknown; note?: unknown };
    const models = strings(x.models);
    const same = texts(x.same);
    if (models.length < 2 || same.tr.length === 0) continue;
    const n = (x.note && typeof x.note === 'object' ? x.note : {}) as {
      tr?: unknown;
      en?: unknown;
    };
    const ntr = typeof n.tr === 'string' ? n.tr.trim() : '';
    const nen = typeof n.en === 'string' ? n.en.trim() : '';
    out.push({
      models,
      same,
      different: texts(x.different),
      note: ntr ? { tr: ntr, en: nen || ntr } : null,
    });
  }
  return out;
}

/** Keys a name is matched by: the breaker keys ("Rammer E 68" = "Rammer E68"), else the folded name. */
export const nameKeys = (name: string): string[] => {
  const k = breakerKeys(name);
  return k.length ? k : [fold(name)];
};

const overlaps = (a: string[], b: string[]): boolean => a.some((x) => b.includes(x));

/** The groups a breaker belongs to, with the other breakers of each group. */
export function samePartsFor(
  name: string,
  groups: readonly SamePartsGroup[],
  lang: 'tr' | 'en',
): SamePartsMatch[] {
  const mine = nameKeys(name);
  const out: SamePartsMatch[] = [];
  for (const g of groups) {
    const own = g.models.filter((m) => overlaps(nameKeys(m), mine));
    if (!own.length) continue;
    const others = g.models.filter((m) => !own.includes(m));
    if (!others.length) continue;
    out.push({
      others,
      same: g.same[lang],
      different: g.different[lang],
      note: g.note ? g.note[lang] : null,
    });
  }
  return out;
}
