import { slugify } from './slug.ts';
import type { Breaker } from './types.ts';

/**
 * Canonical spelling of every breaker maker the catalogue mentions, and the other spellings
 * (catalogue brand column, typos, old names) that mean the same maker. Display only: the
 * catalogue data is left as it is.
 */
export const BREAKER_BRANDS: Record<string, readonly string[]> = {
  Arden: [],
  Arrowhead: [],
  'Atlas Copco': ['Atlas Copca', 'Atlas'],
  Berco: [],
  Bobcat: [],
  BTI: [],
  Caterpillar: ['Caterpiller', 'CAT'],
  'Chicago Pneumatic': ['Chicago'],
  Çukurova: ['Cukurova'],
  'D&A': [],
  Daemo: ['Demo / Daemo', 'II Demo / Daemo', 'V Demo / Daemo', 'Demo'],
  Dehaco: [],
  DNB: [],
  Drago: [],
  Euroram: ['Europam'],
  Furukawa: [],
  Gehl: ['Gerl'],
  Hanwoo: ['Magnum / Hanwoo', 'Magnum'],
  Idromeccanica: [],
  İnan: ['İnanGA', 'Inan'],
  Indeco: [],
  Italdem: ['taldem'],
  JAB: [],
  JCB: [],
  Kent: [],
  Komac: [],
  Komatsu: [],
  Korota: [],
  Krupp: [],
  Kubota: [],
  // "Kanglim" is a common misspelling of Kwanglim (the catalogue uses both).
  Kwanglim: ['Kanglim'],
  Lifton: [],
  Mega: [],
  Montabert: ['IR Montabert', 'IR Montabert Montabert'],
  MSB: [],
  MTB: [],
  Neuson: [],
  NPK: [],
  'O&K': [],
  OCM: [],
  Okada: [],
  OMD: [],
  Omal: ['mal'],
  'Pel-Job': [],
  Promove: [],
  Rammer: [],
  Rotair: [],
  Saga: [],
  Sandvik: [],
  SMC: [],
  Socomec: [],
  Soosan: [],
  Stanley: [],
  Star: [],
  Tabe: [],
  Takeuchi: [],
  Teledyne: [],
  Toku: [],
  Topa: [],
  Toyo: [],
  Tramac: [],
  Volvo: [],
  Wimmer: [],
};

/** Series prefixes the owner drops from the model name ("MTB MT 170" → "MTB 170"). */
const MODEL_PREFIX: Record<string, RegExp> = { MTB: /^MT\s*(?=\d)/i };

/** Catalogue brand-column values that are not a maker: the maker is in the model text. */
const NOT_A_BRAND = new Set(['', 'OTHER BREAKER MODELS', 'DIGER', 'DİĞER']);

/** Splits "A, B" and "A / B" lists, never inside brackets. */
function splitList(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    const slash = ch === '/' && text[i - 1] === ' ' && text[i + 1] === ' ';
    if (depth === 0 && (ch === ',' || slash)) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

/** A list item that can stand as its own model ("2560", "AB 350"), not a stray "2". */
const standsAlone = (m: string): boolean => /\p{L}/u.test(m) || /\d{3}/.test(m);

const clean = (s: string): string =>
  s
    .replace(/\s+/g, ' ')
    .replace(/^[\s/,]+|[\s/,]+$/g, '')
    .trim();

/** Every spelling, upper-cased, longest first, with its canonical maker. */
const SPELLINGS: [string, string][] = Object.entries(BREAKER_BRANDS)
  .flatMap(([canon, alts]) => [canon, ...alts].map((s): [string, string] => [s, canon]))
  .map(([s, c]): [string, string] => [s.toUpperCase(), c])
  .sort((a, b) => b[0].length - a[0].length);

/** The known maker at the start of `text` (whole words), and the rest. */
function leadingBrand(text: string): { brand: string; rest: string } | null {
  const up = text.toUpperCase();
  for (const [s, canon] of SPELLINGS) {
    if (up === s) return { brand: canon, rest: '' };
    if (up.startsWith(`${s} `) || up.startsWith(`${s}/`))
      return { brand: canon, rest: clean(text.slice(s.length)) };
  }
  return null;
}

/** A model text is usable when it has a letter or digit and no unbalanced bracket. */
const usable = (m: string): boolean =>
  /[\p{L}\d]/u.test(m) &&
  (m.match(/\(/g) ?? []).length === (m.match(/\)/g) ?? []).length &&
  !/^[)\]]/.test(m);

/**
 * The breakers one catalogue entry names, spelled for display: the maker resolved from the
 * brand column or the start of the model text, its canonical spelling, and lists such as
 * "15V, D&A 150" or "AB 280 / Arden AB 350" split into separate models. Fragments the
 * catalogue's line breaks left behind (no maker, unbalanced brackets) give nothing.
 */
export function displayBreakers(rawBrand: string, rawModel: string): Breaker[] {
  const colBrand = clean(rawBrand);
  let text = clean(rawModel);
  let brand: string | null = null;
  // Column brand + model text, e.g. "DEMO" + "/ Daemo DMB 50" or "IR MONTABERT" + "Montabert SC 12".
  const joined = leadingBrand(clean(`${colBrand} ${text}`));
  const colUp = colBrand.toUpperCase();
  if (!NOT_A_BRAND.has(colUp)) {
    const col = leadingBrand(colBrand);
    if (joined && col && joined.brand === col.brand) {
      brand = joined.brand;
      text = joined.rest;
      // The model text may repeat the maker ("Montabert SC 12" under "IR MONTABERT").
      const again = leadingBrand(text);
      if (again && again.brand === brand) text = again.rest;
    } else if (col) {
      brand = col.brand;
    } else {
      brand = colBrand;
    }
  } else {
    const lead = leadingBrand(text);
    if (!lead) return [];
    brand = lead.brand;
    text = lead.rest;
  }
  const models: string[] = [];
  splitList(text).forEach((part, i) => {
    let m = clean(part);
    const again = leadingBrand(m);
    if (again && again.brand === brand) m = again.rest;
    if (i > 0 && models.length && !standsAlone(m)) models[models.length - 1] += ` / ${m}`;
    else if (m) models.push(m);
  });
  return models
    .filter(usable)
    .map((m) => (MODEL_PREFIX[brand] ? m.replace(MODEL_PREFIX[brand], '') : m))
    .filter(Boolean)
    .map((m) => ({ brand, model: m, slug: `${slugify(brand)}/${slugify(m)}` }));
}

/**
 * Grouping key of a breaker: the same make and the same model apart from spaces, dashes and
 * case, so "Furukawa F 2" and "Furukawa F2" (two spellings in the catalogue) are one page.
 * Other punctuation and every letter and digit still count: different models never merge.
 */
export const breakerGroupKey = (b: Pick<Breaker, 'brand' | 'model'>): string =>
  `${slugify(b.brand)}/${b.model.toLocaleUpperCase('tr').replace(/[\s-]+/g, '')}`;

/**
 * The spelling shown for a model written several ways: the one with the most spaces
 * ("F 2" over "F2", like the shop's other model names), then the first in A–Z order.
 */
export function preferredSpelling(models: readonly string[]): string {
  const spaces = (m: string) => (m.match(/\s/g) ?? []).length;
  return [...models].sort((a, b) => spaces(b) - spaces(a) || a.localeCompare(b, 'en'))[0];
}
