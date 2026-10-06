import { slugify } from './slug.ts';
import type { Breaker } from './types.ts';

const norm = (s: string): string => s.replace(/\s+/g, ' ').trim();

/** "Atlas Copco MB 1700" → { brand: "Atlas Copco", model: "MB 1700" } using the known
 *  brand names (longest match first, case-insensitive). Unknown brand → `fallbackBrand`. */
export function splitBreakerName(
  name: string,
  brands: readonly string[],
  fallbackBrand = '',
): { brand: string; model: string } {
  const n = norm(name);
  const up = n.toUpperCase();
  const sorted = brands
    .map(norm)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  for (const b of sorted) {
    const bu = b.toUpperCase();
    if (up === bu) return { brand: b, model: '' };
    if (up.startsWith(`${bu} `)) return { brand: b, model: n.slice(b.length + 1).trim() };
  }
  return { brand: norm(fallbackBrand), model: n };
}

export function breaker(brand: string, model: string): Breaker {
  return { brand, model, slug: `${slugify(brand) || 'diger'}/${slugify(model)}` };
}
