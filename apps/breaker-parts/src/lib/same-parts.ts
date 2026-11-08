import { breakerKeys, fold } from '@kervan/tips';

/**
 * Owner-only "Ortak parçalar": breakers whose parts (piston, cylinder, bushings…) are the same.
 * The list lives only in the private KV key `parts:v1` (served with /api/tech/fits to a signed-in
 * owner), never in the repo or the bundle: the public sites must not show which parts match.
 *
 * KV shape (schema 1):
 *   { "schema": 1, "groups": [ { "models": ["Daemo DMB S 500 V", "MTB 30"],
 *       "same": { "tr": [{ "name": "Piston", "size": "boy 500, Ø77" }], "en": [...] },
 *       "different": { "tr": ["Yan saplama"], "en": ["Side bolt"] },
 *       "note": { "tr": "…", "en": "…" } } ] }
 * A part is `{ name, size? }` or a plain name. `different` and `note` are optional; `en` falls
 * back to `tr`.
 */
export interface Part {
  name: string;
  size: string | null;
}
export interface Texts {
  tr: Part[];
  en: Part[];
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
  same: Part[];
  different: Part[];
  note: string | null;
}

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

const parts = (v: unknown): Part[] => {
  if (!Array.isArray(v)) return [];
  const out: Part[] = [];
  for (const x of v) {
    if (typeof x === 'string') {
      if (x.trim()) out.push({ name: x.trim(), size: null });
    } else if (x && typeof x === 'object') {
      const o = x as { name?: unknown; size?: unknown };
      const name = str(o.name);
      if (name) out.push({ name, size: str(o.size) || null });
    }
  }
  return out;
};

const texts = (v: unknown): Texts => {
  const o = (v && typeof v === 'object' ? v : {}) as { tr?: unknown; en?: unknown };
  const tr = parts(o.tr);
  const en = parts(o.en);
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

/** One row of a part search: a part shared by a group's breakers (or listed as different). */
export interface PartHit {
  models: string[];
  name: string;
  size: string | null;
  /** True when the part is listed under "different" for this group. */
  differs: boolean;
  note: string | null;
}

/**
 * Part search over the whole same-parts list ("piston", "burç 70", "MTB 30 kama"): every word of
 * the query must appear (folded) in the part's name, its size or the group's breaker names. Groups
 * whose breakers are not in the shop are found too. Same parts first, then the different ones.
 */
export function searchParts(
  q: string,
  groups: readonly SamePartsGroup[],
  lang: 'tr' | 'en',
): PartHit[] {
  const words = q
    .split(/[\s,;/]+/)
    .map(fold)
    .filter(Boolean);
  if (!words.length) return [];
  const out: PartHit[] = [];
  for (const g of groups) {
    const models = fold(g.models.join(' '));
    const rows: [Part, boolean][] = [
      ...g.same[lang].map((p): [Part, boolean] => [p, false]),
      ...g.different[lang].map((p): [Part, boolean] => [p, true]),
    ];
    for (const [p, differs] of rows) {
      const text = `${fold(p.name)} ${fold(p.size ?? '')} ${models}`;
      if (words.every((w) => text.includes(w)))
        out.push({
          models: g.models,
          name: p.name,
          size: p.size,
          differs,
          note: g.note ? g.note[lang] : null,
        });
    }
  }
  return out.sort((a, b) => Number(a.differs) - Number(b.differs));
}
