import { fold, matches, rewriteQuery, searchName } from '@kervan/tips';

/**
 * The home page's make/model finder ("Önce arama"): every breaker of the catalogue by make, with
 * just what the result panel needs (its tip sizes and pictures). The parts we model for a picked
 * breaker come from `partsForBreaker` (part-links.ts) in the browser, so they are not repeated
 * here. Built at build time (routes.ts) and embedded in the home page's props.
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

/**
 * The one model a query names exactly: the hit whose full name ("Furukawa HB 20G") or model
 * ("HB 20G") is the query, folded, and no other hit is named so. Never a partial or corrected
 * match (owner, 2026-10-22: "Hyundai HDB 20" opened Mega 20): the panel opens by itself only
 * for this; anything else stays a list of chips to pick from.
 */
export function exactHit(hits: readonly FinderHit[], query: string): FinderHit | null {
  const q = fold(query);
  if (!q) return null;
  // The name, or the other name of the same model (`searchName`: "MTB 215 / MTB 210 II").
  const names = (h: FinderHit) => [h.name, ...searchName(h.name).slice(h.name.length).split(' / ')];
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
