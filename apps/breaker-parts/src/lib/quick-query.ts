import { type FitsIndex, fold, matches, rewriteQuery } from '@kervan/tips';

/**
 * "Hızlı Cevap": what one typed query asks for. A Kervan tip code ("KU70-03", "ku 135") lists
 * those tip families; a bare number ("70") the families of that working diameter; anything else
 * is a breaker search (spacing, case, misspelt makes and other names forgiven, like the shop).
 */
export type QuickQuery =
  | { kind: 'empty' }
  | { kind: 'code'; families: number[] }
  | { kind: 'size'; d: number; families: number[] }
  | { kind: 'breaker'; hits: number[]; rewritten: string | null; exact: number | null };

export function classifyQuery(q: string, fits: FitsIndex): QuickQuery {
  const text = q.trim();
  if (!text) return { kind: 'empty' };
  const f = fold(text);
  if (/^ku\d/.test(f)) {
    const families = fits.families.flatMap((x, i) => (fold(x.code).startsWith(f) ? [i] : []));
    return { kind: 'code', families };
  }
  if (/^\d+([.,]\d+)?$/.test(text)) {
    const d = Number(text.replace(',', '.'));
    const families = fits.families.flatMap((x, i) => (Math.abs(x.d - d) < 0.05 ? [i] : []));
    if (families.length) return { kind: 'size', d, families };
  }
  const run = (s: string): number[] => {
    const fs = fold(s);
    const hits: number[] = [];
    fits.breakers.forEach((b, i) => {
      if (matches(s, b.search)) hits.push(i);
    });
    // Names that start with the query first ("MB 1" before "HB 1000 MB").
    return hits.sort(
      (a, b) =>
        Number(fold(fits.breakers[b].name).startsWith(fs)) -
          Number(fold(fits.breakers[a].name).startsWith(fs)) ||
        Number(fold(fits.breakers[b].model).startsWith(fs)) -
          Number(fold(fits.breakers[a].model).startsWith(fs)),
    );
  };
  let hits = run(text);
  let rewritten: string | null = null;
  if (!hits.length) {
    const names = fits.breakers.map((b) => b.search);
    const makes = [...new Set(fits.breakers.map((b) => b.brand))];
    rewritten = rewriteQuery(text, names, makes);
    if (rewritten) hits = run(rewritten);
  }
  // One hit, or a query that is exactly a breaker's name or model: answer it at once.
  const exactIdx = hits.find(
    (i) => fold(fits.breakers[i].name) === f || fold(fits.breakers[i].model) === f,
  );
  const exact = hits.length === 1 ? hits[0] : (exactIdx ?? null);
  return { kind: 'breaker', hits, rewritten, exact };
}
