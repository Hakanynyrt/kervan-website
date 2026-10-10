import { breakerKeys, type PartPrice, type PartTypeCode, type PublicCatalog } from '@kervan/tips';
import { kindPartType } from './part-prices';
import { PART_RENDERS, type PartRender } from './photos';
import type { PartKey } from './routes';

/**
 * Parts the owner prices and sells that we have not modelled for that breaker (owner: "listede
 * fiyatı olanları da siteye ekle, örnek görsel kullan"): shown on their group page when the
 * visitor searches that breaker, with a representative picture of the same part from the
 * nearest-sized breaker we did model, labelled as such. No page of their own (Pages' file limit).
 */
export interface ListedPart {
  /** Breaker as the owner names it ("MTB 215"). */
  breaker: string;
  type: PartTypeCode;
  cents: number;
  /** Hero base of the representative picture (`-xs.webp` / `-lg.webp`). */
  sample: string;
}

/** Which group page shows a listed part of a type (types we can show a picture for). */
const TYPE_GROUP: Partial<Record<PartTypeCode, PartKey>> = {
  ALT_GOVDE: 'alt-govde',
  KAFA_BURCU: 'burc',
  MERKEZLEME: 'burc',
  DAYAMA: 'burc',
  MERKEZLEME_DAYAMA: 'burc',
  BURC_TAKIMI: 'burc',
  KAMA: 'kama',
  KAMA_PIMI: 'kama',
  BOY_SAPLAMA: 'saplama',
  YAN_SAPLAMA: 'saplama',
  PISTON: 'piston',
  TAMIR_TAKIMI: 'tamir-takimi',
};

/** Render's part type within its group (front heads without a kind are ALT_GOVDE). */
const typeOfRender = (part: PartKey, r: PartRender): PartTypeCode | null =>
  r.kind ? kindPartType(r.kind) : part === 'alt-govde' ? 'ALT_GOVDE' : null;

export function listedParts(c: PublicCatalog): Partial<Record<PartKey, ListedPart[]>> {
  const rows = (c.partPrices ?? []).filter(
    (r): r is PartPrice & { type: PartTypeCode; cents: number } =>
      !r.item && !!r.type && r.cents !== null && !r.variant,
  );
  if (!rows.length) return {};
  // Tip working diameter per breaker key: how big a breaker is.
  const size = new Map<string, number>();
  for (const f of c.families)
    for (const b of f.fits)
      for (const k of breakerKeys(`${b.brand} ${b.model}`)) size.set(k, f.attrs.diameterMm);
  const sizeOf = (keys: string[]) => keys.map((k) => size.get(k)).find((d) => d !== undefined);
  const out: Partial<Record<PartKey, ListedPart[]>> = {};
  for (const r of rows) {
    const part = TYPE_GROUP[r.type];
    if (!part) continue;
    const keys = breakerKeys(`${r.brand} ${r.model}`);
    if (!keys.length) continue;
    const same = PART_RENDERS[part].filter((x) => typeOfRender(part, x) === r.type && x.hero);
    // Modelled for this breaker already (priced or not): not listed again.
    if (same.some((x) => breakerKeys(x.model).some((k) => keys.includes(k)))) continue;
    const plain = same.filter((x) => !x.variant);
    if (!plain.length) continue;
    const d = sizeOf(keys);
    const pick =
      d === undefined
        ? plain[0]
        : (plain
            .map((x) => ({ x, d: sizeOf(breakerKeys(x.model)) }))
            .filter((y) => y.d !== undefined)
            .sort((a, b) => Math.abs(Math.log(a.d! / d)) - Math.abs(Math.log(b.d! / d)))[0]?.x ??
          plain[0]);
    (out[part] ??= []).push({
      breaker: `${r.brand} ${r.model}`,
      type: r.type,
      cents: r.cents,
      sample: pick.hero!,
    });
  }
  for (const list of Object.values(out))
    list.sort((a, b) => a.breaker.localeCompare(b.breaker, 'tr') || a.type.localeCompare(b.type));
  return out;
}
