import { breakerKeys, type PartPrice, type PartTypeCode } from '@kervan/tips';
import { renderAnchor } from './part-links';
import { PART_RENDERS, type PartRender } from './photos';
import type { PartKey } from './routes';

type Kind = NonNullable<PartRender['kind']>;

/**
 * Which of the owner's part types a render is. Every kind must be listed (a new kind does not
 * compile until it is mapped); null = never priced by a type row (an item row still can).
 */
const KIND_TYPE = {
  toolBushing: 'KAFA_BURCU',
  upperBushing: 'MERKEZLEME',
  thrustRing: 'DAYAMA',
  thrustUpperBushing: 'MERKEZLEME_DAYAMA',
  spacerBushing: 'DAYAMA_ARA_BURCU',
  oneBushing: 'TEK_BURC',
  toolUpperBushing: 'KAFA_MERKEZLEME',
  rockDrillThrustRing: 'DAYAMA',
  rockDrillHead: null,
  bushingSet: 'BURC_TAKIMI',
  toolBushingPin: 'BURC_PIMI',
  toolBushingPinRetainer: null,
  toolUpperPin: 'BURC_PIMI',
  upperBushingPin: 'MERKEZLEME_PIMI',
  keyUpperPin: null,
  toolBushingPinPlug: 'BURC_PIM_TAPASI',
  upperBushingPinPlug: 'BURC_PIM_TAPASI',
  retainerKey: 'KAMA',
  retainerPin: 'KAMA_PIMI',
  lowerRetainerPin: 'KAMA_PIMI',
  retainerLockPin: 'KILIT_PIMI',
  keyPinPlug: 'KAMA_PIM_TAPASI',
  keyPinRetainer: null,
  keyPinHolder: null,
  keyPinRubber: null,
  keyPinWasher: null,
  springPin: null,
  tieRod: 'BOY_SAPLAMA',
  tieRodSet: 'SAPLAMA_TAKIMI',
  tieRodNut: 'SAPLAMA_SOMUNU',
  tieRodUpperNut: 'SAPLAMA_SOMUNU',
  tieRodLowerNut: 'SAPLAMA_SOMUNU',
  tieRodWasher: 'SAPLAMA_PULU',
  tieRodBush: null,
  sideBolt: 'YAN_SAPLAMA',
  sideBoltWasher: null,
  bodyDowel: 'GOVDE_PIMI',
  piston: 'PISTON',
  repairKit: 'TAMIR_TAKIMI',
  wearPlate: 'ASINMA_PLAKASI',
  topWearPlate: 'ASINMA_PLAKASI',
  sideWearPlate: 'ASINMA_PLAKASI',
  frontWearPlate: 'ASINMA_PLAKASI',
  allRoundWearPlate: 'ASINMA_PLAKASI',
  wearPlateSet: 'ASINMA_SETI',
  topBuffer: 'TAKOZ',
  sideBuffer: 'TAKOZ',
  bottomBuffer: 'TAKOZ',
  bufferGuide: null,
  topBufferPlate: 'TAKOZ_PLAKASI',
  bottomBufferPlate: 'TAKOZ_PLAKASI',
  accumulatorUpper: 'AKU_UST',
  accumulatorLower: 'AKU_ALT',
  accumulatorBolt: 'AKU_SAPLAMA',
  accumulatorDowel: null,
} as const satisfies Record<Kind, PartTypeCode | null>;

/** The owner's part type of a render kind (null: never priced by a type row). */
export const kindPartType = (k: Kind): PartTypeCode | null => KIND_TYPE[k];

/** A render (or a front head's burçlu state, `#b`) that can carry a price. */
interface Candidate {
  /** `<part>/<anchor>` or `<part>/<anchor>#b`. */
  page: string;
  part: PartKey;
  type: PartTypeCode | null;
  variant: string;
  keys: string[];
}

function candidates(): Candidate[] {
  const out: Candidate[] = [];
  for (const part of Object.keys(PART_RENDERS) as PartKey[])
    for (const r of PART_RENDERS[part]) {
      const page = `${part}/${renderAnchor(r)}`;
      const keys = breakerKeys(r.model);
      const variant = r.variant ?? '';
      if (r.kind) {
        out.push({ page, part, type: KIND_TYPE[r.kind], variant, keys });
      } else if (part === 'alt-govde') {
        // Owner: his front-head price is the burçlu head's. The plain head stays quote-only
        // unless an item row names it.
        out.push({ page, part, type: null, variant, keys });
        if (r.fitted) out.push({ page: `${page}#b`, part, type: 'ALT_GOVDE', variant, keys });
      } else {
        out.push({ page, part, type: null, variant, keys });
      }
    }
  return out;
}

/**
 * Prices per page from the owner's rows, at build time. An item row naming the page wins
 * (a null price there means quote-only). Otherwise the type rows of the same breaker, part type
 * and exactly the same variant (an old type never takes the standard price: owner). Ambiguity
 * gives no price, never a guess: a row that fits two renders of one group (two drawings of the same part) prices
 * neither, and rows that disagree on one render price none.
 */
export function resolvePartPrices(rows: readonly PartPrice[]): Map<string, number> {
  const out = new Map<string, number>();
  if (!rows.length) return out;
  const items = new Map(rows.filter((r) => r.item).map((r) => [r.item!, r.cents]));
  const typed = rows
    .filter((r) => !r.item && r.type)
    .map((r) => ({ r, keys: new Set(breakerKeys(`${r.brand} ${r.model}`)) }));
  const cands = candidates();
  const covers = (row: (typeof typed)[number], c: Candidate) =>
    c.type !== null &&
    row.r.type === c.type &&
    (row.r.variant ?? '') === c.variant &&
    c.keys.some((k) => row.keys.has(k));
  // How many renders of each group a row covers: more than one in a group is ambiguous.
  const reach = new Map<string, Set<string>>();
  const reachKey = (i: number, part: PartKey) => `${i}|${part}`;
  for (const c of cands)
    typed.forEach((row, i) => {
      if (!covers(row, c)) return;
      const k = reachKey(i, c.part);
      reach.set(k, (reach.get(k) ?? new Set()).add(c.page.replace(/#b$/, '')));
    });
  for (const c of cands) {
    if (items.has(c.page)) {
      const v = items.get(c.page);
      if (v != null) out.set(c.page, v);
      continue;
    }
    const hits = typed.filter((row) => covers(row, c));
    if (
      !hits.length ||
      hits.some((row) => (reach.get(reachKey(typed.indexOf(row), c.part))?.size ?? 0) > 1)
    )
      continue;
    const cents = new Set(hits.map((h) => h.r.cents));
    const [only] = cents;
    if (cents.size === 1 && only != null) out.set(c.page, only);
  }
  return out;
}

/** Prices of one group's renders, keyed by anchor (`anchor#b` for a burçlu head). */
export function groupPrices(all: Map<string, number>, part: PartKey): Record<string, number> {
  const out: Record<string, number> = {};
  const prefix = `${part}/`;
  for (const [page, cents] of all)
    if (page.startsWith(prefix)) out[page.slice(prefix.length)] = cents;
  return out;
}
