import {
  KERVAN_HEAT_URL,
  KERVAN_BREAKER_URL,
  ORG_LEGAL_NAME,
  ORG_TRADING_NAME,
  ORG_PHONE,
  ORG_EMAIL,
  ORG_STREET,
  ORG_LOCALITY,
  ORG_REGION,
  ORG_COUNTRY,
  ORG_SAME_AS,
} from './constants.js';

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
}

export function organization({ primaryUrl, alternateName, logoUrl }: BuildOrgOpts) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORG_LEGAL_NAME,
    legalName: ORG_LEGAL_NAME,
    alternateName: alternateName ?? ORG_TRADING_NAME,
    url: primaryUrl,
    logo: logoUrl ?? `${primaryUrl}/logo-krv-128.png`,
    sameAs: ORG_SAME_AS.filter((u) => u !== primaryUrl),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: ORG_PHONE,
      email: ORG_EMAIL,
      contactType: 'sales',
      areaServed: 'TR',
      availableLanguage: ['tr', 'en'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: ORG_STREET,
      addressLocality: ORG_LOCALITY,
      addressRegion: ORG_REGION,
      addressCountry: ORG_COUNTRY,
    },
  } as const;
}

interface BuildWebsiteOpts {
  url: string;
  name: string;
  description: string;
  inLanguage?: string;
}

export function website({ url, name, description, inLanguage = 'tr' }: BuildWebsiteOpts) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url,
    name,
    description,
    inLanguage,
    publisher: { '@id': `${url}/#organization` },
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
  BuildServiceOpts,
  BuildProductOpts,
  BuildItemListOpts,
};
