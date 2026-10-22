import { fold, matches, rewriteQuery, searchName } from '@kervan/tips';

/**
 * The home page's make/model finder ("Önce arama"): every breaker of the catalogue by make, with
 * just what the result panel needs (its tip sizes and pictures). The parts we model for a picked
 * breaker come from `partsForBreaker` (part-links.ts) in the browser, so they are not repeated
 * here. Built at build time (routes.ts) and embedded in the home page's props.
 */

/** One tip size of a breaker: working diameter and length (mm), `?uc=` number, picture. */
export interface FinderTip {
  d: number | null;
  len?: number | null;
  /** 1-based tip size (`?uc=`) of a breaker that takes more than one. */
  n?: number;
  /** Tip render key (tip-img.ts); `sample` = another breaker's tip, shown labelled. */
  img?: string;
  sample?: true;
}

export interface FinderModel {
  model: string;
  /** Breaker page slug (`/kirici/<slug>`). */
  slug: string;
  tips: FinderTip[];
}

export interface FinderMake {
  brand: string;
  models: FinderModel[];
}

export interface FinderHit {
  brand: string;
  model: FinderModel;
  /** "Brand Model". */
  name: string;
}

export const finderName = (brand: string, m: FinderModel): string => `${brand} ${m.model}`.trim();

const hitsOf = (makes: readonly FinderMake[]): FinderHit[] =>
  makes.flatMap((x) =>
    x.models.map((model) => ({ brand: x.brand, model, name: finderName(x.brand, model) })),
  );

/**
 * The models a typed query finds, matched like the tip search (make spellings, "F 2" = "F2").
 * Nothing found: the query with a misspelt make fixed and unknown words dropped (`guess`).
 */
export function findModels(
  makes: readonly FinderMake[],
  query: string,
): { hits: FinderHit[]; guess: string | null } {
  const q = query.trim();
  if (!fold(q)) return { hits: [], guess: null };
  const all = hitsOf(makes);
  const hits = all.filter((h) => matches(q, searchName(h.name)));
  if (hits.length) return { hits, guess: null };
  const guess = rewriteQuery(
    q,
    all.map((h) => h.name),
    makes.map((x) => x.brand),
  );
  return {
    hits: guess ? all.filter((h) => matches(guess, searchName(h.name))) : [],
    guess,
  };
}

/** The one model a query names: the only hit, or the hit whose name or model is the query. */
export function exactHit(hits: readonly FinderHit[], query: string): FinderHit | null {
  if (hits.length === 1) return hits[0];
  const q = fold(query);
  if (!q) return null;
  return (
    hits.find((h) => fold(h.name) === q) ?? hits.find((h) => fold(h.model.model) === q) ?? null
  );
}

/** Makes for the chips: most models first, then A–Z (no ranking of our own). */
export const makesByModels = <T extends { brand: string; models: readonly unknown[] }>(
  makes: readonly T[],
): T[] =>
  [...makes].sort(
    (a, b) => b.models.length - a.models.length || a.brand.localeCompare(b.brand, 'tr'),
  );
