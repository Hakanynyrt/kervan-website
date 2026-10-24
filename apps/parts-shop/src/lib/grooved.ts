import { breakerKeys } from '@kervan/tips';
import { SPECIAL_TOOLS } from './photos';

export type SpecialTool = (typeof SPECIAL_TOOLS)[number];

/**
 * The special tools we model for a breaker ("Brand Model"), matched with `breakerKeys`: tools
 * with dust grooves and relieved tools. The product page's section shows all of them.
 */
export function specialToolsFor(name: string): SpecialTool[] {
  const keys = new Set(breakerKeys(name));
  return SPECIAL_TOOLS.filter((g) => breakerKeys(g.breaker).some((k) => keys.has(k)));
}

/**
 * Only the tools with dust grooves of a breaker. The list rows' "Toz kanallı" badge and filter
 * use this, so a badge never points at a page without such a tool.
 */
export function groovedFor(name: string): SpecialTool[] {
  return specialToolsFor(name).filter((g) => g.kind === 'grooved');
}
