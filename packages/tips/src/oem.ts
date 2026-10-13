import { fold } from './search.ts';

/** Shortest folded OEM number the search looks for (shorter text is a model name, not a number). */
const MIN_OEM = 5;

/**
 * Does a search query name one of a part's genuine OEM numbers ("Muadil OEM no.", shop item
 * pages)? Spaces, dashes, dots and case are ignored, and the number may stand among other words
 * ("Krupp 099 3177"): any run of consecutive words, joined, must equal a whole number. Part of a
 * number never matches, so a model name ("HB20G") does not hit every number that starts with it.
 */
export function matchesOem(query: string, numbers: readonly string[]): boolean {
  if (!numbers.length) return false;
  const want = new Set(numbers.map(fold).filter((n) => n.length >= MIN_OEM));
  if (!want.size) return false;
  const words = query
    .split(/[\s,;/]+/)
    .map(fold)
    .filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    let run = '';
    for (let j = i; j < words.length; j++) {
      run += words[j];
      if (want.has(run)) return true;
    }
  }
  return false;
}
