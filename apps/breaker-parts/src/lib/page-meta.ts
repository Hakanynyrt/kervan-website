import {
  KERVAN_BREAKER_URL,
  ORG_EMAIL,
  ORG_PHONE,
  breadcrumbList,
  itemList,
  organization,
  product as productSchema,
  service as serviceSchema,
  website,
  type HeadAlternates,
  type HeadInput,
} from '@kervan/seo';
import { DICT } from './dict';
import { localePath, stripLang, langFromPath, LANGS } from './locale-path';
import { PRODUCTS, PRODUCT_BY_SLUG } from '../data/products';
import { BRANDS } from '../data/brands';
import type { Lang } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   Per-page <head> data, shared by the build-time prerender
   (src/entry-server.tsx) and the client head sync (components/RouteHead).
   Titles and descriptions come from the dict / product data only.
   Never touches /api/tech/* or any owner-only content.
═══════════════════════════════════════════════════════════════════════ */

const SITE = KERVAN_BREAKER_URL;
const OG_IMAGE = `${SITE}/og.png`;

/** Absolute URL of a neutral path in a language. */
export const absUrl = (path: string, lang: Lang) => `${SITE}${localePath(path, lang)}`;

/** Reciprocal hreflang set (tr, en, x-default = tr) for a neutral path. */
export const alternatesFor = (path: string): HeadAlternates => ({
  tr: absUrl(path, 'tr'),
  en: absUrl(path, 'en'),
});

/** Indexable pages (neutral paths), in sitemap order. */
export const INDEXABLE_PATHS: string[] = [
  '/',
  '/urunler',
  ...PRODUCTS.map((p) => `/urunler/${p.slug}`),
  '/uyumluluk',
  '/uretim-kalite',
  '/hakkimizda',
  '/iletisim',
];

/** Owner-only shell: prerendered without any tech content, `noindex`,
 *  never in the sitemap. */
export const TECH_PATH = '/teknik-bilgiler';

export type PageHead = HeadInput & { indexable: boolean };

function webPage(url: string, name: string, description: string, lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url,
    name,
    description,
    inLanguage: lang,
  };
}

function notFoundHead(lang: Lang): PageHead {
  return {
    lang,
    title: DICT[lang].meta.notFoundTitle,
    description: DICT[lang].notFound.body,
    robots: 'noindex',
    indexable: false,
  };
}

/** Head data for a pathname ("/en/urunler/keski"). Unknown paths get the
 *  404 head (noindex, no canonical). */
export function pageHead(pathname: string): PageHead {
  const lang = langFromPath(pathname);
  const path = stripLang(pathname).replace(/(.)\/+$/, '$1');
  const t = DICT[lang];
  const m = t.meta;
  const url = absUrl(path, lang);
  const crumb = (items: { name: string; path: string }[]) =>
    breadcrumbList([
      { name: m.crumbHome, url: absUrl('/', lang) },
      ...items.map((i) => ({ name: i.name, url: absUrl(i.path, lang) })),
    ]);
  const common = {
    lang,
    canonical: url,
    alternates: alternatesFor(path),
    ogImage: OG_IMAGE,
    siteName: m.siteName,
    indexable: true,
  };
  const productItems = () =>
    PRODUCTS.map((p) => ({
      name: p[lang].name,
      url: absUrl(`/urunler/${p.slug}`, lang),
      description: p[lang].tagline,
      image: p.image ? `${SITE}${p.image}` : undefined,
    }));

  switch (path) {
    case '/':
      return {
        ...common,
        title: m.homeTitle,
        description: m.homeDesc,
        jsonLd: [
          {
            ...organization({ primaryUrl: SITE, alternateName: m.siteName }),
            '@id': `${SITE}#organization`,
          },
          website({ url: SITE, name: m.siteName, description: m.websiteDesc, inLanguage: lang }),
          webPage(url, m.homeTitle, m.homeDesc, lang),
          itemList({ name: m.homeListName, items: productItems() }),
        ],
      };
    case '/urunler':
      return {
        ...common,
        title: m.productsTitle,
        description: m.productsDesc,
        jsonLd: [
          webPage(url, m.productsTitle, m.productsDesc, lang),
          crumb([{ name: m.crumbProducts, path }]),
          itemList({ name: m.productsListName, items: productItems() }),
        ],
      };
    case '/uyumluluk':
      return {
        ...common,
        title: m.brandsTitle,
        description: m.brandsDesc,
        jsonLd: [
          webPage(url, m.brandsTitle, m.brandsDesc, lang),
          crumb([{ name: m.crumbBrands, path }]),
        ],
      };
    case '/uretim-kalite':
      return {
        ...common,
        title: m.productionTitle,
        description: m.productionDesc,
        jsonLd: [
          webPage(url, m.productionTitle, m.productionDesc, lang),
          crumb([{ name: m.crumbProduction, path }]),
          serviceSchema({
            url,
            name: m.productionServiceName,
            description: m.productionServiceDesc,
          }),
        ],
      };
    case '/hakkimizda':
      return {
        ...common,
        title: m.aboutTitle,
        description: m.aboutDesc,
        jsonLd: [
          webPage(url, m.aboutTitle, m.aboutDesc, lang),
          crumb([{ name: m.crumbAbout, path }]),
        ],
      };
    case '/iletisim': {
      const description = m.contactDesc.replace('{email}', ORG_EMAIL).replace('{phone}', ORG_PHONE);
      return {
        ...common,
        title: m.contactTitle,
        description,
        jsonLd: [
          webPage(url, m.contactTitle, description, lang),
          crumb([{ name: m.crumbContact, path }]),
        ],
      };
    }
    case TECH_PATH:
      return {
        lang,
        title: `${t.techUi.eyebrow} — ${m.siteName}`,
        robots: 'noindex, nofollow',
        indexable: false,
      };
  }

  const slug = /^\/urunler\/([^/]+)$/.exec(path)?.[1];
  const prod = slug ? PRODUCT_BY_SLUG[slug] : undefined;
  if (prod) {
    const loc = prod[lang];
    const image = prod.image ? `${SITE}${prod.image}` : undefined;
    const title = `${loc.name} — ${m.siteName}`;
    return {
      ...common,
      title,
      description: loc.tagline,
      ogImage: image ?? OG_IMAGE,
      ogType: 'product',
      jsonLd: [
        webPage(url, title, loc.tagline, lang),
        productSchema({
          url,
          name: loc.name,
          description: loc.body,
          image,
          material: '42CrMo · 42CrMoA',
          brandFits: BRANDS.map((b) => b.name),
          sku: prod.slug,
        }),
        crumb([
          { name: m.crumbProducts, path: '/urunler' },
          { name: loc.name, path },
        ]),
      ],
    };
  }
  return notFoundHead(lang);
}

/** Every prerendered page, per language: indexable pages + the tech shell. */
export function prerenderPaths(): string[] {
  return LANGS.flatMap((lang) => [...INDEXABLE_PATHS, TECH_PATH].map((p) => localePath(p, lang)));
}
