// Types of offer-check.mjs (plain JS so check-dist.mjs runs without a build step).
export interface LdOffer {
  '@type'?: string;
  price?: string;
  priceCurrency?: string;
  priceSpecification?: { price?: string; priceCurrency?: string; valueAddedTaxIncluded?: boolean };
}
export function offersIn(v: unknown, out?: LdOffer[]): LdOffer[];
export function shownPrice(text: string, en: boolean): { n: number; cur: 'TRY' | 'USD' } | null;
export function checkOffer(
  offers: LdOffer[],
  shown: string[],
  en: boolean,
  hasFx: boolean,
): { currency: 'TRY' | 'USD'; problem?: undefined } | { problem: string; currency?: undefined };
