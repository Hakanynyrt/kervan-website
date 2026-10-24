/* Other spellings of a breaker model, for its page ("Diğer yazılışlar"), meta description and
   Product.alternateName. Catalogue data only: the spellings the catalogue merged into the page,
   plus the no-space form people and other shops write ("HB20G"). */

/** "HB 20G" → "HB20G", "KHB 20G II" → "KHB20G II"; null when the model has no such space. */
export function joinedSpelling(model: string): string | null {
  const j = model.replace(/^([A-Za-z]+)[\s-]+(?=\d)/, '$1');
  return j === model ? null : j;
}

/** Case, spaces, dashes and slashes ignored: "S 26N", "S26 N" and "s-26n" are one spelling. */
const key = (x: string): string => x.toLocaleLowerCase('tr').replace(/[\s\-/]+/g, '');

/** Catalogue typing slips a formal page should not repeat: "(61 , 62)", "90/ P", "( 61". */
const STRAY = /\s[,;/)]|[(/]\s|\s{2,}/;

/**
 * "MS 200" of MSB → "200", so the page also reads "MSB 200": when the model's series letters
 * only repeat the start of the make's name, people search the make with the bare number.
 */
export function brandNumberSpelling(brand: string, model: string): string | null {
  const m = /^([A-Za-z]+)[\s-]*(\d.*)$/.exec(model);
  if (!m) return null;
  const b = brand.toUpperCase();
  const s = m[1].toUpperCase();
  return s.length >= 2 && b.length > s.length && b.startsWith(s) ? m[2] : null;
}

/**
 * The model's other spellings, each once, never the model itself: the no-space form first (the
 * one people type), then the make-plus-number form ("MSB 200") when the series letters repeat
 * the make, then merged catalogue spellings that differ from the model by more than case,
 * spacing, dashes or slashes. Spellings with stray punctuation are left out.
 */
export function modelAliases(model: string, spellings: string[], brand?: string): string[] {
  const seen = new Set([key(model)]);
  const out: string[] = [];
  const joined = joinedSpelling(model);
  if (joined && !STRAY.test(joined)) out.push(joined);
  const bare = brand ? brandNumberSpelling(brand, model) : null;
  if (bare && !STRAY.test(bare) && !seen.has(key(bare))) {
    seen.add(key(bare));
    out.push(bare);
  }
  for (const x of spellings) {
    const k = key(x);
    if (seen.has(k) || STRAY.test(x)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}
