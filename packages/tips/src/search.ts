import { BREAKER_BRANDS } from './breaker-display.ts';

/**
 * Model search shared by the shop's filter boxes and its build-time cross-links: names are
 * compared folded (Turkish-safe lower case, ç/ş/ğ/ö/ü/ı/İ to plain letters, letters and digits
 * only), so "INDECO HP 500", "indeco hp500" and "İndeco HP-500" are the same text.
 */
export function fold(s: string): string {
  return s
    .replace(/İ/g, 'i')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\d]+/gu, '');
}

/** The folded words of a query ("Ramer E 68" → ["ramer", "e", "68"]). */
const words = (q: string): string[] =>
  q
    .split(/[\s,;/]+/)
    .map(fold)
    .filter(Boolean);

/** Every word of the query appears in the name (spaces, dashes and case ignored). */
export function matches(q: string, name: string): boolean {
  const n = fold(name);
  const w = words(q);
  return w.length > 0 && w.every((x) => n.includes(x));
}

/**
 * Other names people use for a make (old names, the new owner's brand), on top of the
 * spellings in BREAKER_BRANDS. Folded key → canonical make.
 */
const EXTRA_MAKES: Record<string, string> = {
  // Atlas Copco's breakers are sold as Epiroc since 2018.
  epiroc: 'Atlas Copco',
};

/** Folded make spelling → canonical make, for every make and alias we know. */
const MAKE_SPELLINGS: Map<string, string> = new Map([
  ...Object.entries(BREAKER_BRANDS).flatMap(([canon, alts]) =>
    [canon, ...alts].map((s): [string, string] => [fold(s), canon]),
  ),
  ...Object.entries(EXTRA_MAKES),
]);

/** Edit distance (insert, delete, substitute, swap of neighbours), stopping above `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        v = Math.min(v, d[i - 2][j - 2] + 1);
      d[i][j] = v;
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

/** Typos allowed for a word of this length: none under 4 letters, 1 up to 6, then 2. */
const allowed = (w: string): number => (w.length < 4 ? 0 : w.length < 7 ? 1 : 2);

/**
 * The make a misspelt or other-named word stands for ("ramer" → Rammer, "epiroc" → Atlas
 * Copco), among `makes` (the makes that actually have models). Null when none is close.
 */
export function guessMake(word: string, makes: readonly string[]): string | null {
  const w = fold(word);
  if (!w || /\d/.test(w)) return null;
  const have = new Set(makes);
  const known = MAKE_SPELLINGS.get(w);
  if (known && have.has(known)) return known;
  let best: string | null = null;
  let bestD = allowed(w) + 1;
  for (const [spelling, canon] of MAKE_SPELLINGS) {
    if (!have.has(canon)) continue;
    const d = editDistance(w, spelling, allowed(w));
    if (d < bestD) {
      bestD = d;
      best = canon;
    }
  }
  return best;
}

/**
 * When a query matches nothing: the query rewritten to something that does. Misspelt or
 * other-named makes are replaced by the make ("ramer e68" → "Rammer e68"); if that still
 * matches nothing, words without a digit are dropped, those found in no name first, then one
 * at a time from the end (never a make) ("krupp hm 960 cs" → "Krupp hm 960"), as long as a word with a digit
 * (the model number) is left when the query had one. Null when nothing matches or the query
 * already matches as it is.
 */
export function rewriteQuery(
  q: string,
  names: readonly string[],
  makes: readonly string[],
): string | null {
  const ws = q.split(/[\s,;/]+/).filter((x) => fold(x));
  if (!ws.length) return null;
  const folded = names.map(fold);
  const seen = (w: string) => folded.some((n) => n.includes(fold(w)));
  const hits = (list: string[]) =>
    list.length > 0 && folded.some((n) => list.every((w) => n.includes(fold(w))));
  const digits = ws.some((w) => /\d/.test(w));
  const ok = (list: string[]) => (!digits || list.some((w) => /\d/.test(w))) && hits(list);
  const done = (list: string[]) => {
    const next = list.join(' ');
    return fold(next) === fold(q) ? null : next;
  };
  // 1. Makes: a known other spelling or a close typo becomes the make.
  const fixed = ws.flatMap((w) => {
    if (seen(w) && !MAKE_SPELLINGS.has(fold(w))) return [w];
    const make = guessMake(w, makes);
    return make ? [make] : seen(w) ? [w] : [];
  });
  // (Words found in no name at all are already left out.)
  if (ok(fixed)) return done(fixed);
  // 2. Drop one word without a digit at a time, from the end.
  for (let k = fixed.length - 1; k >= 0; k--) {
    if (/\d/.test(fixed[k]) || MAKE_SPELLINGS.has(fold(fixed[k]))) continue;
    const less = fixed.filter((_, i) => i !== k);
    if (ok(less)) return done(less);
  }
  return null;
}

/** Every make spelling, longest first, for finding the make at the start of a name. */
const LEADING: [string, string][] = Object.entries(BREAKER_BRANDS)
  .flatMap(([canon, alts]) => [canon, ...alts].map((s): [string, string] => [s, canon]))
  .sort((a, b) => b[0].length - a[0].length);

/**
 * Folded keys of the breakers a caption names, for matching parts to tip pages:
 * "Rammer E68" and "Rammer E 68" give the same key; "Krupp HM 560 / 580" names HM 560 and
 * HM 580; "MTB 250/255" names 250 and 255; bracketed notes ("MB 1000 (Krupp HM 680)") are
 * left out. Empty when the name does not start with a known make.
 */
export function breakerKeys(name: string): string[] {
  const text = name
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const up = text.toLocaleUpperCase('tr');
  const lead = LEADING.find(
    ([s]) => up.startsWith(`${s.toLocaleUpperCase('tr')} `) || up === s.toLocaleUpperCase('tr'),
  );
  if (!lead) return [];
  const make = lead[1];
  const parts = text
    .slice(lead[0].length)
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return [];
  // "HM 560" → prefix "HM " for a bare "580" that follows.
  const prefix = parts[0].replace(/\d[\p{L}\d\s-]*$/u, '');
  return [
    ...new Set(parts.map((p, i) => fold(`${make} ${i > 0 && /^\d/.test(p) ? prefix + p : p}`))),
  ];
}
