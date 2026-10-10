import { fold } from './search.ts';

/**
 * Spare-part prices (the owner's rows, never in git): one price per breaker × part type, as he
 * sells them ("MTB 215 · ÖN BURÇ"), or for one exact item page. The shop matches them to its part
 * renders at build time (apps/parts-shop/src/lib/part-prices.ts). Pure, unit-tested.
 */

/** Part types and the names the owner uses for them (folded on compare). */
export const PART_TYPES = {
  ALT_GOVDE: ['alt gövde', 'şapkasız gövde'],
  KAFA_BURCU: ['kafa burcu', 'ön burç', 'alt burç', 'boğaz burcu'],
  MERKEZLEME: ['merkezleme', 'merkezleme burcu', 'üst burç'],
  DAYAMA: ['dayama', 'dayama burcu'],
  MERKEZLEME_DAYAMA: ['merkezleme dayama', 'dayama merkezleme', 'merkezleme dayama burcu'],
  KAFA_MERKEZLEME: ['kafa merkezleme', 'kafa merkezleme burcu'],
  TEK_BURC: ['tek parça burç', 'kafa merkezleme dayama'],
  DAYAMA_ARA_BURCU: ['dayama ara burcu', 'ara burç'],
  BURC_TAKIMI: ['burç takımı'],
  BURC_PIMI: ['burç pimi', 'ön burç pimi', 'kafa burcu pimi'],
  MERKEZLEME_PIMI: ['merkezleme pimi', 'merkezleme dayama pimi'],
  BURC_PIM_TAPASI: ['burç pim tapası', 'pim tapası'],
  BOY_SAPLAMA: ['boy saplama', 'boy saplaması'],
  SAPLAMA_TAKIMI: ['saplama takımı'],
  SAPLAMA_SOMUNU: ['saplama somunu', 'boy saplama somunu'],
  SAPLAMA_PULU: ['saplama pulu'],
  YAN_SAPLAMA: ['yan saplama', 'yan civata'],
  KAMA: ['kama'],
  KAMA_PIMI: ['kama pimi'],
  KILIT_PIMI: ['kilit pimi'],
  KAMA_PIM_TAPASI: ['kama pim tapası'],
  PISTON: ['piston'],
  TAMIR_TAKIMI: ['tamir takımı', 'keçe takımı', 'seal kit'],
  ASINMA_PLAKASI: ['aşınma plakası', 'pleyt', 'playt'],
  ASINMA_SETI: ['aşınma seti', 'pleyt takımı', 'playt takımı'],
  TAKOZ: ['takoz', 'vibrasyon takozu'],
  TAKOZ_PLAKASI: ['takoz plakası'],
  AKU_UST: ['akümülatör üstü', 'akümülatör kapağı'],
  AKU_ALT: ['akümülatör altı'],
  AKU_SAPLAMA: ['akümülatör saplaması'],
  GOVDE_PIMI: ['gövde pimi'],
} as const satisfies Record<string, readonly string[]>;

export type PartTypeCode = keyof typeof PART_TYPES;

const BY_NAME = new Map<string, PartTypeCode>();
for (const [code, names] of Object.entries(PART_TYPES) as [PartTypeCode, readonly string[]][]) {
  BY_NAME.set(fold(code), code);
  for (const n of names) BY_NAME.set(fold(n), code);
}

/** "ÖN BURÇ" / "kafa burcu" / "KAFA_BURCU" → KAFA_BURCU; unknown → null. */
export const partTypeOf = (s: string): PartTypeCode | null => BY_NAME.get(fold(s)) ?? null;

/** Item pages that can carry a price row: `<part group>/<render anchor>`, `#b` = burçlu head. */
export const PART_ITEM =
  /^(alt-govde|burc|kama|saplama|piston|akumulator|asinma-plakasi|tamir-takimi)\/[a-z0-9-]{1,120}(#b)?$/;
const VARIANT = /^[A-Za-z0-9]{1,20}$/;

/** One row of the owner's sheet (`PriceSheet.parts`). */
export type PartSheetRow =
  | { brand: string; model: string; type: string; variant?: string | null; cents: number | null }
  | { item: string; cents: number | null };

/** A validated row, as stored in D1 and published to the build (no other fields). */
export interface PartPrice {
  brand: string | null;
  model: string | null;
  type: PartTypeCode | null;
  variant: string | null;
  item: string | null;
  /** Net USD cents; null = deliberately quote-only. */
  cents: number | null;
}

const centsOf = (v: unknown): number | null | undefined =>
  v === null
    ? null
    : typeof v === 'number' && Number.isInteger(v) && v > 0 && v < 100_000_000
      ? v
      : undefined;
const text = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() && v.trim().length <= max
    ? v.trim().replace(/\s+/g, ' ')
    : null;

/** Validates the sheet's part rows. Throws naming the row number only (never its content). */
export function normalisePartRows(rows: unknown): PartPrice[] {
  if (!Array.isArray(rows) || rows.length > 5000) throw new Error('bad parts list');
  const out: PartPrice[] = [];
  const seen = new Set<string>();
  rows.forEach((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const cents = centsOf(r.cents);
    if (cents === undefined) throw new Error(`bad part row ${i + 1}: price`);
    let row: PartPrice;
    if (r.item !== undefined) {
      const item = typeof r.item === 'string' ? r.item.trim() : '';
      if (!PART_ITEM.test(item)) throw new Error(`bad part row ${i + 1}: item`);
      row = { brand: null, model: null, type: null, variant: null, item, cents };
    } else {
      const brand = text(r.brand, 40);
      const model = text(r.model, 60);
      const type = typeof r.type === 'string' ? partTypeOf(r.type) : null;
      const variant = r.variant == null || r.variant === '' ? null : String(r.variant).trim();
      if (!brand || !model) throw new Error(`bad part row ${i + 1}: breaker`);
      if (!type) throw new Error(`bad part row ${i + 1}: part type`);
      if (variant !== null && !VARIANT.test(variant))
        throw new Error(`bad part row ${i + 1}: variant`);
      row = { brand, model, type, variant, item: null, cents };
    }
    const key = row.item ?? fold(`${row.brand} ${row.model}|${row.type}|${row.variant ?? ''}`);
    if (seen.has(key)) throw new Error(`bad part row ${i + 1}: duplicate`);
    seen.add(key);
    out.push(row);
  });
  return out;
}
