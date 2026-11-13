import { breakerKeys, fold, queryWords, rewriteQuery, searchName } from '@kervan/tips';

/**
 * The make/model search of the header (every page) and the home page's finder: every breaker of
 * the catalogue by make. The home embeds it with just what its result panel needs (tip sizes and
 * pictures; the parts we model for a picked breaker come from `partsForBreaker` in part-links.ts
 * in the browser); the other pages fetch the names only (`modelIndex`, `MODEL_INDEX_PATH`) once
 * the header box is used. Built at build time (routes.ts).
 */

/** One tip size of a breaker: working diameter (mm; never the length), `?uc=` number, picture. */
export interface FinderTip {
  d: number | null;
  /** Ordinal among the breaker's sizes of the same diameter (`sizeOrdinals`), else null. */
  ord?: number | null;
  /** 1-based tip size (`?uc=`) of a breaker that takes more than one. */
  n?: number;
  /** Tip render key (tip-img.ts); `sample` = another breaker's tip, shown labelled. */
  img?: string;
  sample?: true;
  /** The owner's real photo of the model's tips (`BREAKER_PHOTOS` base), shown instead of `img`. */
  photo?: string;
}

/** A breaker model as the search knows it: its name and its page. */
export interface ModelRef {
  model: string;
  /** Breaker page slug (`/kirici/<slug>`). */
  slug: string;
}

export interface FinderModel extends ModelRef {
  tips: FinderTip[];
}

/** A make with its models: `FinderMake` on the home, names only (`ModelRef`) in the index. */
export interface MakeModels<M extends ModelRef = FinderModel> {
  brand: string;
  models: M[];
}

export type FinderMake = MakeModels<FinderModel>;

export interface FinderHit<M extends ModelRef = FinderModel> {
  brand: string;
  model: M;
  /** "Brand Model". */
  name: string;
}

/** Where the header search of the pages other than the home fetches `modelIndex` from. */
export const MODEL_INDEX_PATH = '/kirici-modelleri.json';

/** The names-only index of the header search (the home's finder without its tip data). */
export const modelIndex = (makes: readonly FinderMake[]): MakeModels<ModelRef>[] =>
  makes.map((x) => ({
    brand: x.brand,
    models: x.models.map(({ model, slug }) => ({ model, slug })),
  }));

export const finderName = (brand: string, m: ModelRef): string => `${brand} ${m.model}`.trim();

/** A name with its bracketed second names written as a list: "HM 301 (300)" → "HM 301 / 300",
 *  "HM 60 (61 , 62)" → "HM 60 / 61 / 62" (`breakerKeys` splits a list, and leaves brackets out). */
const listed = (name: string): string =>
  name.replace(/\(([^)]*)\)/g, (_, inner: string) => ` / ${inner.replace(/,/g, ' / ')} / `);

/**
 * What a hit is called, folded, each with and without its make: the name as written ("Furukawa
 * HB 20G", "HB 20G"), every model a list or bracket name carries ("Indeco MES 121/150": MES 121
 * and MES 150; "Krupp HM 301 (300)": HM 301 and HM 300; only entries with a number, so a variant
 * letter is no name), and the same for the model's other name (`named`: its `searchName`, "MTB
 * 215 / MTB 210 II").
 */
const nameKeys = (brand: string, name: string, named = searchName(name)): string[] => {
  const make = fold(brand);
  const names = [name, ...named.slice(name.length).split(' / ').filter(Boolean)];
  // Only a list or bracket name carries more than itself (48 of 1,220 names, 2026-11-13).
  const keys = names.flatMap((n) => [
    fold(n),
    ...(/[/(]/.test(n) ? breakerKeys(listed(n)).filter((k) => /\d/.test(k)) : []),
  ]);
  return [
    ...new Set(
      keys.flatMap((k) => [k, k.startsWith(make) ? k.slice(make.length) : k]).filter(Boolean),
    ),
  ];
};

/**
 * How well a hit's names fit the typed text as a whole (case, spaces and dashes ignored): 0 the
 * text is one of its names, 1 a name starts with it, 2 a name holds it in one piece, 3 only its
 * words are found. "HB 20" lists Furukawa HB 20G before Kent KHB 20, and both before Atlas Copco
 * HB 2200 (review, 2026-11-13: HB 20G came 8th, in catalogue order); "MES 150" lists Indeco MES
 * 121/150 before MES 1500.
 */
const rankOf = (keys: readonly string[], q: string): number =>
  keys.includes(q)
    ? 0
    : keys.some((k) => k.startsWith(q))
      ? 1
      : keys.some((k) => k.includes(q))
        ? 2
        : 3;

/** Every model of a make list as a hit, with the folded text the search matches (`searchName`:
 *  the name and the model's other name). Worked out once per list: the search runs on every
 *  keystroke, and doing this for all ~1200 names each time took most of a second on a phone. */
interface Searchable<M extends ModelRef> {
  all: FinderHit<M>[];
  names: string[];
  text: string[];
  /** Per hit: what it is called (`nameKeys`, for `rankOf`). */
  keys: string[][];
}
const searchable = new WeakMap<readonly MakeModels<ModelRef>[], Searchable<ModelRef>>();
function searchableOf<M extends ModelRef>(makes: readonly MakeModels<M>[]): Searchable<M> {
  let s = searchable.get(makes) as Searchable<M> | undefined;
  if (!s) {
    const all = makes.flatMap((x) =>
      x.models.map((model) => ({ brand: x.brand, model, name: finderName(x.brand, model) })),
    );
    const named = all.map((h) => searchName(h.name));
    s = {
      all,
      names: all.map((h) => h.name),
      text: named.map(fold),
      keys: all.map((h, i) => nameKeys(h.brand, h.name, named[i])),
    };
    searchable.set(makes, s as Searchable<ModelRef>);
  }
  return s;
}

/** Builds the search text of a make list ahead of the first keystroke (the box got focus). */
export const prepareSearch = (makes: readonly MakeModels<ModelRef>[]): void => {
  searchableOf(makes);
};

/** The hits whose search text holds every word of `q` (`matches` of the tip search), the closest
 *  names first (`rankOf`); hits that fit alike keep the list's order. */
const matching = <M extends ModelRef>(
  { all, text, keys }: Searchable<M>,
  q: string,
): FinderHit<M>[] => {
  const w = queryWords(q);
  if (!w.length) return [];
  const whole = fold(q);
  return all
    .flatMap((hit, i) =>
      w.every((x) => text[i].includes(x)) ? [{ hit, rank: rankOf(keys[i], whole) }] : [],
    )
    .sort((a, b) => a.rank - b.rank)
    .map((x) => x.hit);
};

/**
 * The models a typed query finds, matched like the tip search (make spellings, "F 2" = "F2"):
 * the model the text names first, then the names that start with it, then the rest.
 * Nothing found: the query with a misspelt make fixed and unknown words dropped (`guess`).
 */
export function findModels<M extends ModelRef>(
  makes: readonly MakeModels<M>[],
  query: string,
): { hits: FinderHit<M>[]; guess: string | null } {
  const q = query.trim();
  if (!fold(q)) return { hits: [], guess: null };
  const s = searchableOf(makes);
  const hits = matching(s, q);
  if (hits.length) return { hits, guess: null };
  const guess = rewriteQuery(
    q,
    s.names,
    makes.map((x) => x.brand),
  );
  return { hits: guess ? matching(s, guess) : [], guess };
}

/** `nameKeys` of the rows `byNameFit` has seen, by name: it runs on every keystroke. */
const ROW_KEYS = new Map<string, string[]>();

/**
 * Rows ("Brand Model" in `name`) with the names that fit the typed text best first, as
 * `findModels` lists its hits (`rankOf`); rows that fit alike keep their order. The tip list's
 * results after "Ara" (review, 2026-11-13: the header box listed Soosan SB 50 second for "sb 50",
 * the results page showed it as the 11th card).
 */
export function byNameFit<T extends { brand: string; name: string }>(
  rows: readonly T[],
  query: string,
): T[] {
  const q = fold(query);
  if (!q) return [...rows];
  const rank = (r: T): number => {
    let keys = ROW_KEYS.get(r.name);
    if (!keys) ROW_KEYS.set(r.name, (keys = nameKeys(r.brand, r.name)));
    return rankOf(keys, q);
  };
  return rows
    .map((row) => ({ row, rank: rank(row) }))
    .sort((a, b) => a.rank - b.rank)
    .map((x) => x.row);
}

/**
 * The one model a query names exactly: the hit whose full name ("Furukawa HB 20G") or model
 * ("HB 20G") is the query, folded, and no other hit is named so. Never a partial or corrected
 * match (owner, 2026-10-22: "Hyundai HDB 20" opened Mega 20): the panel opens by itself only
 * for this; anything else stays a list of chips to pick from.
 */
export function exactHit<M extends ModelRef>(
  hits: readonly FinderHit<M>[],
  query: string,
): FinderHit<M> | null {
  const q = fold(query);
  if (!q) return null;
  // The name, or the other name of the same model (`searchName`: "MTB 215 / MTB 210 II").
  const names = (h: FinderHit<M>) => [
    h.name,
    ...searchName(h.name).slice(h.name.length).split(' / '),
  ];
  const byName = hits.filter((h) => names(h).some((n) => fold(n) === q));
  if (byName.length) return byName.length === 1 ? byName[0] : null;
  const byModel = hits.filter((h) => fold(h.model.model) === q);
  return byModel.length === 1 ? byModel[0] : null;
}

/** Makes for the chips: most models first, then A–Z (no ranking of our own). */
export const makesByModels = <T extends { brand: string; models: readonly unknown[] }>(
  makes: readonly T[],
): T[] =>
  [...makes].sort(
    (a, b) => b.models.length - a.models.length || a.brand.localeCompare(b.brand, 'tr'),
  );
