import { breakerKeys } from '@kervan/tips';
import { GROOVED_TOOLS } from './photos';

export type GroovedTool = (typeof GROOVED_TOOLS)[number];

/**
 * The tools with dust grooves we model for a breaker ("Brand Model"), matched with
 * `breakerKeys`. The list rows' "Toz kanallı" badge and the product page's section both use
 * this, so a badge never points at a page without the section.
 */
export function groovedFor(name: string): GroovedTool[] {
  const keys = new Set(breakerKeys(name));
  return GROOVED_TOOLS.filter((g) => breakerKeys(g.breaker).some((k) => keys.has(k)));
}
