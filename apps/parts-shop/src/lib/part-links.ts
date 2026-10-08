import { breakerKeys, fold, slugify } from '@kervan/tips';
import { PART_RENDERS, type PartRender } from './photos';
import type { PartKey } from './routes';

/**
 * Build-time links between the tip pages and the parts we model (PART_RENDERS), matched by
 * breaker name folded like the search ("Rammer E68" = "Rammer E 68"; "Krupp HM 560 / 580"
 * names both). Works for any entries in photos.ts; nothing is stored.
 */

/** Element id (and URL hash) of one modelled part on its page: "mtb-65", "krupp-hm-900-oldtype". */
export const renderAnchor = (r: PartRender): string =>
  slugify([r.model, r.variant, r.kind].filter(Boolean).join(' '));

/** A modelled part for one breaker: which page and which card. */
export interface PartLink {
  part: PartKey;
  anchor: string;
}

/** Folded breaker name → the parts we model for it (one card per part, the first one). */
function partIndex(): Map<string, PartLink[]> {
  const out = new Map<string, PartLink[]>();
  for (const [part, list] of Object.entries(PART_RENDERS) as [PartKey, readonly PartRender[]][])
    for (const r of list)
      for (const k of breakerKeys(r.model)) {
        const have = out.get(k) ?? [];
        if (!have.some((x) => x.part === part)) have.push({ part, anchor: renderAnchor(r) });
        out.set(k, have);
      }
  return out;
}

let cached: Map<string, PartLink[]> | null = null;

/** The parts we model for a breaker ("Brand Model"), in PART_KEYS order of photos.ts. */
export function partsForBreaker(name: string): PartLink[] {
  cached ??= partIndex();
  return cached.get(fold(name)) ?? [];
}

/**
 * For one part page: render anchor → the tip page of the same breaker, when the shop has one.
 * `tipPaths` maps folded breaker names to their tip page paths.
 */
export function tipLinksForPart(
  part: PartKey,
  tipPaths: Map<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of PART_RENDERS[part]) {
    const hit = breakerKeys(r.model)
      .map((k) => tipPaths.get(k))
      .find(Boolean);
    if (hit) out[renderAnchor(r)] = hit;
  }
  return out;
}
