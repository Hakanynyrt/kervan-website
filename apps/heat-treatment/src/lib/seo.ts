import {
  KERVAN_BREAKER_URL,
  KERVAN_HEAT_URL,
  ORG_COUNTRY,
  ORG_EMAIL,
  ORG_INSTAGRAM,
  ORG_LEGAL_NAME,
  ORG_LOCALITY,
  ORG_PHONE,
  ORG_REGION,
  ORG_STREET,
  type HeadAlternates,
  type HeadInput,
} from '@kervan/seo';
import { DICT } from './dict';
import { pathForLang } from './use-lang';
import type { Lang } from '../types';

/* Build-time only (used by src/entry-server.tsx → scripts/prerender.mjs):
   the <head> of each prerendered page. Text comes from the dict. */

const SITE = KERVAN_HEAT_URL;
const ORG_ID = `${SITE}/#organization`;
const SITE_NAME = 'Kervan Heat';

/** Absolute URL of the home page in a language. */
export function pageUrl(lang: Lang): string {
  return SITE + pathForLang(lang);
}

/** Reciprocal hreflang alternates (x-default = Turkish). */
export const ALTERNATES: HeadAlternates = {
  tr: pageUrl('tr'),
  en: pageUrl('en'),
  xDefault: pageUrl('tr'),
};

function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: ORG_LEGAL_NAME,
    legalName: ORG_LEGAL_NAME,
    alternateName: SITE_NAME,
    url: SITE,
    logo: `${SITE}/logo-krv-128.png`,
    sameAs: [KERVAN_BREAKER_URL, ORG_INSTAGRAM],
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
  };
}

/** Head tags for the home page in one language. */
export function homeHead(lang: Lang): HeadInput {
  const m = DICT[lang].meta;
  const url = pageUrl(lang);
  return {
    lang,
    title: m.title,
    description: m.description,
    canonical: url,
    alternates: ALTERNATES,
    ogImage: `${SITE}/og.png`,
    siteName: SITE_NAME,
    jsonLd: [
      organization(),
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        url,
        name: SITE_NAME,
        description: m.siteDescription,
        inLanguage: lang,
        publisher: { '@id': ORG_ID },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        serviceType: m.service.type,
        name: m.service.name,
        description: m.service.description,
        url,
        inLanguage: lang,
        provider: { '@id': ORG_ID },
        areaServed: { '@type': 'Country', name: 'Türkiye' },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: m.service.catalogName,
          itemListElement: m.service.offers.map((o) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name: o.name, description: o.description },
          })),
        },
      },
    ],
  };
}

/** Head tags for dist/404.html: noindex, no canonical/alternates. */
export function notFoundHead(): HeadInput {
  const t = DICT.tr;
  return {
    lang: 'tr',
    title: `${t.notFound.title.replace(/\.$/, '')} — ${SITE_NAME}`,
    description: t.meta.description,
    robots: 'noindex',
    siteName: SITE_NAME,
  };
}
