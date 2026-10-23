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
 * The model's other spellings, each once, never the model itself: the no-space form first (the
 * one people type), then merged catalogue spellings that differ from the model by more than
 * case, spacing, dashes or slashes. Spellings with stray punctuation are left out.
 */
export function modelAliases(model: string, spellings: string[]): string[] {
  const seen = new Set([key(model)]);
  const out: string[] = [];
  const joined = joinedSpelling(model);
  if (joined && !STRAY.test(joined)) out.push(joined);
  for (const x of spellings) {
    const k = key(x);
    if (seen.has(k) || STRAY.test(x)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}
