import type { PartKey } from './routes';

/**
 * Warranty from delivery, by product group (owner, 2026-10-24: "alt gövdeler için garanti süresi
 * 6 aydır. pistonlar için de 6 aydır."): front heads (burçlu sets included) and pistons 6 months,
 * every other product (tips included) 2 months. The legal texts in `legal.ts` state both.
 */
export const LONG_WARRANTY_PARTS: readonly PartKey[] = ['alt-govde', 'piston'];
export const LONG_WARRANTY_MONTHS = 6;
export const WARRANTY_MONTHS = 2;

/** Months of warranty for a part group; no group (a tip page) is the standard period. */
export const warrantyMonths = (part?: PartKey | null): number =>
  part && LONG_WARRANTY_PARTS.includes(part) ? LONG_WARRANTY_MONTHS : WARRANTY_MONTHS;
