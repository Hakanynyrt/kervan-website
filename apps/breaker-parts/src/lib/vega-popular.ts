import type { VegaItem, VegaPopular } from '../types';
import { compact, geomKey } from './vega-index';

export type Tier = 1 | 2;
export interface Popularity {
  /** tagged rows (by model name in popular:v1) */
  tier: Map<VegaItem, Tier>;
  /** untagged rows with the same geometry as a tier-1 row (same part to make) */
  twin: Set<VegaItem>;
  /** compact alias name -> row it points to (breakers not in the catalog) */
  aliasTo: Map<string, VegaItem>;
}

/** Match the owner's popular:v1 list against the catalog. Names are compared
 *  without case, spaces or punctuation. Unknown names are ignored. */
export function buildPopularity(items: VegaItem[], pop: VegaPopular | null): Popularity {
  const tier = new Map<VegaItem, Tier>();
  const twin = new Set<VegaItem>();
  const aliasTo = new Map<string, VegaItem>();
  if (!pop) return { tier, twin, aliasTo };
  const byModel = new Map(items.map((it) => [compact(it.model), it]));
  for (const [name, t] of Object.entries(pop.models ?? {})) {
    const it = byModel.get(compact(name));
    if (it && (t === 1 || t === 2)) tier.set(it, Math.min(t, tier.get(it) ?? 2) as Tier);
  }
  for (const [alias, model] of Object.entries(pop.aliases ?? {})) {
    const it = byModel.get(compact(model));
    if (it) aliasTo.set(compact(alias), it);
  }
  const hot = new Set([...tier].filter(([, t]) => t === 1).map(([it]) => geomKey(it)));
  for (const it of items) if (!tier.has(it) && hot.has(geomKey(it))) twin.add(it);
  return { tier, twin, aliasTo };
}

/** Prior in nats for the measurement score: a tier-1 tip wins ties, never a
 *  clear size difference (≈ 1 mm of diameter inside the green band). */
export const popularPrior = (p: Popularity, it: VegaItem): number => {
  const t = p.tier.get(it) ?? (p.twin.has(it) ? 2 : undefined);
  return t === 1 ? -0.6 : t === 2 ? -0.3 : 0;
};
