/**
 * Chip rows of the home's breaker finder (design E): a make's model chips fill two rows, the rest
 * behind "Tüm … modelleri". The chips are laid out once to measure them; these work out which of
 * them fit, so the page renders only those (no clipped, focusable links).
 */

/** Rows a wrapping row of items of these widths takes in `width`, `gap` apart (flex-wrap). */
export function rowsOf(widths: readonly number[], width: number, gap: number): number {
  let rows = 0;
  let x = 0;
  for (const w of widths) {
    if (rows === 0 || x + gap + w > width + 0.5) {
      rows++;
      x = w;
    } else x += gap + w;
  }
  return rows;
}

/**
 * The chips shown (indices, in order): the longest run from the start that fills at most `rows`
 * rows, with the picked chip (`pick`, -1 for none) added at its place when it is further on.
 */
export function fitChips(
  widths: readonly number[],
  pick: number,
  width: number,
  gap: number,
  rows = 2,
): number[] {
  const set = (k: number) => {
    const idx = Array.from({ length: Math.min(k, widths.length) }, (_, i) => i);
    if (pick >= k && pick < widths.length) idx.push(pick);
    return idx;
  };
  let best = set(pick >= 0 ? 0 : 1);
  for (let k = 1; k <= widths.length; k++) {
    const idx = set(k);
    if (
      rowsOf(
        idx.map((i) => widths[i]),
        width,
        gap,
      ) > rows
    )
      break;
    best = idx;
  }
  return best;
}
