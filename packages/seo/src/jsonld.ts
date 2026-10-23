import {
  KERVAN_HEAT_URL,
  KERVAN_BREAKER_URL,
  ORG_REGISTERED_NAME,
  ORG_TRADING_NAME,
  ORG_PHONE,
  ORG_PUBLIC_EMAIL,
  ORG_STREET,
  ORG_LOCALITY,
  ORG_REGION,
  ORG_COUNTRY,
  ORG_SAME_AS,
} from './constants.ts';

/* ═══════════════════════════════════════════════════════════════════════
   schema.org JSON-LD builders.
   Each function returns a plain object ready to be JSON.stringify'd into
   a <script type="application/ld+json"> tag.
═══════════════════════════════════════════════════════════════════════ */

interface BuildOrgOpts {
  /** The site whose homepage this Organization will sit on. */
  primaryUrl: string;
  /** "Kervan Heat" or "Kervan Breaker" — the alternate name shown to
   *  search engines on this specific site. Optional — falls back to
   *  the legal name. */
  alternateName?: string;
  /** Override the standard image URL (logo). */
  logoUrl?: string;
  /** Override the street line: a site that shows its own written address (the shop's legal
   *  pages) gives the same text here, so the page and its JSON-LD agree. */
  street?: string;
}

export function organization({ primaryUrl, alternateName, logoUrl, street }: BuildOrgOpts) {
  // `primaryUrl` may be the canonical home URL with its slash; compare and build paths without it.
  const base = primaryUrl.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORG_REGISTERED_NAME,
    legalName: ORG_REGISTERED_NAME,
    alternateName: alternateName ?? ORG_TRADING_NAME,
    url: primaryUrl,
    logo: logoUrl ?? `${base}/logo-krv-v2-256.png`,
    sameAs: ORG_SAME_AS.filter((u) => u.replace(/\/$/, '') !== base),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: ORG_PHONE,
      email: ORG_PUBLIC_EMAIL,
      contactType: 'sales',
      areaServed: 'TR',
      availableLanguage: ['tr', 'en'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: street ?? ORG_STREET,
      addressLocality: ORG_LOCALITY,
      addressRegion: ORG_REGION,
      addressCountry: ORG_COUNTRY,
    },
  } as const;
}

interface BuildWebsiteOpts {
  url: string;
  /** The site name Google shows over results: the same name the titles and the page use. */
  name: string;
  /** Other names the site is known by (e.g. the domain), most likely first. */
  alternateName?: string[];
  description: string;
  inLanguage?: string;
}

export function website({
  url,
  name,
  alternateName,
  description,
  inLanguage = 'tr',
}: BuildWebsiteOpts) {
  // `url` may be the canonical home URL with its slash ("https://example.com/"); the ids stay
  // "https://example.com/#website" either way.
  const base = url.replace(/\/$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    url,
    name,
    ...(alternateName && alternateName.length ? { alternateName } : {}),
    description,
    inLanguage,
    publisher: { '@id': `${base}/#organization` },
  } as const;
}

interface BuildReturnPolicyOpts {
  /** Stable id, e.g. "https://example.com/yasal/iade#policy" (the returns page + #policy). */
  id: string;
  /** ISO 3166-1 alpha-2 country the policy applies to. */
  country: string;
  /** Days from delivery within which an item can be returned. */
  days: number;
  /** Return shipping exactly as the returns page states it; omit when it depends on the buyer
   *  (e.g. free for consumers, by agreement for businesses). */
  fees?: 'FreeReturn' | 'ReturnFeesCustomerResponsibility';
  /** How the item is sent back; omit when it depends on the buyer. */
  method?: 'ReturnByMail' | 'ReturnInStore';
  /** Refund kind; omit when it depends on the buyer. */
  refund?: 'FullRefund' | 'ExchangeRefund' | 'StoreCreditRefund';
  /** Where the policy is written out (the returns page). */
  url?: string;
}

/** A schema.org MerchantReturnPolicy with a finite window; method, fees and refund only when given. */
export function merchantReturnPolicy({
  id,
  country,
  days,
  fees,
  method,
  refund,
  url,
}: BuildReturnPolicyOpts) {
  return {
    '@type': 'MerchantReturnPolicy',
    '@id': id,
    ...(url ? { url } : {}),
    applicableCountry: country,
    returnPolicyCountry: country,
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: days,
    ...(method ? { returnMethod: `https://schema.org/${method}` } : {}),
    ...(fees ? { returnFees: `https://schema.org/${fees}` } : {}),
    ...(refund ? { refundType: `https://schema.org/${refund}` } : {}),
  } as const;
}

interface BuildServiceOpts {
  /** URL where this Service is described (typically the homepage). */
  url: string;
  name: string;
  description: string;
  /** Optional: list of sub-services for `hasOfferCatalog`. */
  catalog?: Array<{ name: string; description?: string }>;
}

/** Heat treatment / contract service schema. */
export function service({ url, name, description, catalog }: BuildServiceOpts) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: name,
    name,
    description,
    url,
    provider: { '@id': `${KERVAN_HEAT_URL}/#organization` },
    areaServed: { '@type': 'Country', name: 'Türkiye' },
    ...(catalog && catalog.length > 0
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name,
            itemListElement: catalog.map((c) => ({
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: c.name,
                ...(c.description ? { description: c.description } : {}),
              },
            })),
          },
        }
      : {}),
  } as const;
}

interface BuildProductOpts {
  url: string;
  name: string;
  description: string;
  image?: string;
  /** Brand fits or compatible brands (rendered as `additionalProperty`
   *  rather than `brand` since these are external manufacturers we
   *  produce parts for, not Kervan-branded products). */
  brandFits?: string[];
  /** Material / alloy spec, e.g. "42CrMo · 42CrMoA". */
  material?: string;
  /** SKU / part number if available. */
  sku?: string;
}

export function product({
  url,
  name,
  description,
  image,
  brandFits,
  material,
  sku,
}: BuildProductOpts) {
  // A WebPage, not a Product: Google's product snippets need a price (offers) or real
  // reviews/ratings, and parts are sold on request with no public price, so a Product here
  // only ever shows up as an invalid item in Search Console.
  const keywords = [name, material, ...(brandFits ?? []), sku].filter(Boolean).join(', ');
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
    ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: image } } : {}),
    about: { '@type': 'Thing', name },
    keywords,
    publisher: { '@id': `${KERVAN_BREAKER_URL}/#organization` },
  } as const;
}

interface BuildShopProductOpts {
  /** Absolute URL of the product page (its canonical). */
  url: string;
  name: string;
  description?: string;
  /** Absolute image URL (the page's hero / og:image). */
  image?: string;
  /** Brand of the product itself (the maker), e.g. "Kervan Makina". */
  brand: string;
  category?: string;
  /** Public product code; only one the site already shows. */
  sku?: string;
  /** Other names the page shows for the same product (e.g. other spellings of the model). */
  alternateName?: string[];
  /** The price exactly as the page shows it; omit when the page only takes quotes. */
  offer?: {
    /** Decimal string, e.g. "125.00". */
    price: string;
    priceCurrency: string;
    /** The shown price excludes VAT. */
    valueAddedTaxIncluded?: boolean;
    /** The seller, written out (its full Organization node sits on the home page only, and
     *  Google does not follow an `@id` to another page). */
    seller?: { id: string; name: string; url: string };
    /** The return policy, written out in full (Google does not follow an `@id` to another page). */
    returnPolicy?: ReturnType<typeof merchantReturnPolicy>;
  };
}

/** A schema.org Product with a real Offer: only for a page that shows that price. Never adds
 *  ratings or reviews. */
export function shopProduct({
  url,
  name,
  description,
  image,
  brand,
  category,
  sku,
  alternateName,
  offer,
}: BuildShopProductOpts) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    ...(alternateName && alternateName.length ? { alternateName } : {}),
    ...(description ? { description } : {}),
    url,
    ...(image ? { image } : {}),
    brand: { '@type': 'Brand', name: brand },
    ...(category ? { category } : {}),
    ...(sku ? { sku } : {}),
    ...(offer
      ? {
          offers: {
            '@type': 'Offer',
            url,
            price: offer.price,
            priceCurrency: offer.priceCurrency,
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
            ...(offer.seller
              ? {
                  seller: {
                    '@type': 'Organization',
                    '@id': offer.seller.id,
                    name: offer.seller.name,
                    url: offer.seller.url,
                  },
                }
              : {}),
            ...(offer.returnPolicy ? { hasMerchantReturnPolicy: offer.returnPolicy } : {}),
            ...(offer.valueAddedTaxIncluded === undefined
              ? {}
              : {
                  priceSpecification: {
                    '@type': 'UnitPriceSpecification',
                    price: offer.price,
                    priceCurrency: offer.priceCurrency,
                    valueAddedTaxIncluded: offer.valueAddedTaxIncluded,
                  },
                }),
          },
        }
      : {}),
  } as const;
}

/** A product page without a shown price, as a WebPage (a Product needs offers or real reviews,
 *  else Search Console lists it as an invalid item). */
export function productWebPage({
  url,
  name,
  description,
  image,
  brand,
  category,
  sku,
  alternateName,
  publisherId,
}: Omit<BuildShopProductOpts, 'offer'> & { publisherId?: string }) {
  const keywords = [name, ...(alternateName ?? []), category, brand, sku]
    .filter(Boolean)
    .join(', ');
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    ...(alternateName && alternateName.length ? { alternateName } : {}),
    ...(description ? { description } : {}),
    url,
    ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: image } } : {}),
    about: { '@type': 'Thing', name },
    keywords,
    ...(publisherId ? { publisher: { '@id': publisherId } } : {}),
  } as const;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbList(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  } as const;
}

interface ItemListEntry {
  name: string;
  url: string;
  description?: string;
  image?: string;
}

interface BuildItemListOpts {
  name: string;
  items: ItemListEntry[];
}

export function itemList({ name, items }: BuildItemListOpts) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: it.url,
      ...(it.image ? { image: it.image } : {}),
      ...(it.description ? { description: it.description } : {}),
      name: it.name,
    })),
  } as const;
}

export type {
  BreadcrumbItem,
  BuildOrgOpts,
  BuildWebsiteOpts,
  BuildReturnPolicyOpts,
  BuildServiceOpts,
  BuildProductOpts,
  BuildShopProductOpts,
  BuildItemListOpts,
};
