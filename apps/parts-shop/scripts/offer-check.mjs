// The JSON-LD offer check of check-dist.mjs, pure so it can be tested (offer-check.test.ts).
// Its problems name no price: this public repo's CI logs must never show catalog data.

/** Every schema.org Offer in a parsed JSON-LD value. */
export const offersIn = (v, out = []) => {
  if (Array.isArray(v)) for (const x of v) offersIn(x, out);
  else if (v && typeof v === 'object') {
    if (v['@type'] === 'Offer') out.push(v);
    for (const x of Object.values(v)) offersIn(x, out);
  }
  return out;
};

/** "15.816 TL" / "1.850 USD" (tr-TR) or "1,850 USD" (en-GB) → number and currency. */
export const shownPrice = (text, en) => {
  const m = /^\s*([\d.,]+)\s*(TL|USD)\b/.exec(text);
  if (!m) return null;
  const n = Number(en ? m[1].replace(/,/g, '') : m[1].replace(/\./g, '').replace(',', '.'));
  return { n, cur: m[2] === 'TL' ? 'TRY' : 'USD' };
};

/**
 * One page's offers against the price it leads with (`shown`: the `data-offer` texts). Turkish
 * pages of a build with a rate: TRY, VAT included; otherwise USD net. → { currency } or
 * { problem }.
 */
export function checkOffer(offers, shown, en, hasFx) {
  const want = !en && hasFx ? 'TRY' : 'USD';
  if (offers.length > 1 || shown.length !== 1)
    return { problem: `${offers.length} offers, ${shown.length} shown offer prices` };
  const o = offers[0];
  const v = shownPrice(shown[0], en);
  if (o.priceCurrency !== want || o.priceSpecification?.priceCurrency !== want)
    return { problem: `offer not in ${want}` };
  if (o.priceSpecification?.valueAddedTaxIncluded !== (want === 'TRY'))
    return { problem: `offer valueAddedTaxIncluded should be ${want === 'TRY'}` };
  if (
    !v ||
    v.cur !== want ||
    Math.abs(v.n - Number(o.price)) > 0.001 ||
    o.price !== o.priceSpecification?.price
  )
    return { problem: 'JSON-LD offer differs from the price the page shows' };
  return { currency: want };
}
