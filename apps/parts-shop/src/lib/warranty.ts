import type { PartKey } from './routes';

/**
 * Warranty from delivery, by product group (owner, 2026-10-24): front heads (burçlu sets included)
 * and pistons 6 months, bushings sold on their own 3 months, every other product (tips included)
 * 2 months. The legal texts in `legal.ts` state all three.
 */
const GROUP_MONTHS: Partial<Record<PartKey, number>> = { 'alt-govde': 6, piston: 6, burc: 3 };
export const WARRANTY_MONTHS = 2;

/** Months of warranty for a part group; no group (a tip page) is the standard period. */
export const warrantyMonths = (part?: PartKey | null): number =>
  (part && GROUP_MONTHS[part]) || WARRANTY_MONTHS;
