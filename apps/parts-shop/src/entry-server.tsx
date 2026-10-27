import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import {
  buildHeadTags,
  buildSitemapIndexXml,
  buildSitemapXml,
  type SitemapEntry,
} from '@kervan/seo';
import type { PublicCatalog } from '@kervan/tips';
import App from './App';
import { openingPreload } from './components/ExplodedPicker';
import { hasAlternates, isIndexable, pageHead, SITE } from './lib/page-head';
import { LANGS, localePath } from './lib/locale-path';
import { modelIndex } from './lib/finder';
import type { PageProps } from './lib/page-props';
import { findRender } from './lib/part-links';
import { breakerPath, buildPages, groupBreakers, PARTS_PATH } from './lib/routes';
import type { Lang } from './types';

/* Build-time only (scripts/prerender.mjs bundles this to dist-ssr/ and deletes it). */

export { injectHead, jsonForScript } from '@kervan/seo';
export { PROPS_ID } from './lib/page-props';
export { MODEL_INDEX_PATH } from './lib/finder';

export interface PrerenderPage {
  file: string;
  lang: Lang;
  headTags: string;
  appHtml: string;
  props: PageProps;
  /** Listed in the sitemap (everything but the cart, the /urun/ code pages, 404 and, while
   *  HOLD_EN_PART_ITEMS is on, the English part item pages). */
  indexable: boolean;
}

/** "/" → index.html, "/en/" → en/index.html, "/urun/ku135-07" → urun/ku135-07.html. */
const fileFor = (url: string): string =>
  url === '/' ? 'index.html' : url === '/en/' ? 'en/index.html' : `${url.slice(1)}.html`;

export function render(props: PageProps): string {
  return renderToString(
    <StrictMode>
      <App {...props} />
    </StrictMode>,
  );
}

export function prerender(catalog: PublicCatalog): PrerenderPage[] {
  const out: PrerenderPage[] = [];
  for (const lang of LANGS) {
    for (const p of buildPages(catalog)) {
      const props: PageProps = { lang, path: p.path, model: p.model, fx: catalog.fx ?? null };
      out.push({
        file: fileFor(localePath(p.path, lang)),
        lang,
        headTags:
          buildHeadTags(pageHead(props)) +
          (p.model.kind === 'home' ? `\n    ${openingPreload()}` : ''),
        appHtml: render(props),
        props,
        indexable: isIndexable(props),
      });
    }
    const nf: PageProps = { lang, path: '/', model: { kind: 'notFound' }, fx: null };
    out.push({
      file: lang === 'tr' ? '404.html' : 'en/404.html',
      lang,
      headTags: buildHeadTags(pageHead(nf)),
      appHtml: render(nf),
      props: nf,
      indexable: false,
    });
  }
  return out;
}

/** The header search's names-only model index (`MODEL_INDEX_PATH`), from the home's finder. */
export function modelIndexJson(pages: PrerenderPage[]): string {
  const home = pages.find((p) => p.props.model.kind === 'home')?.props.model;
  return JSON.stringify(home?.kind === 'home' ? modelIndex(home.finder) : []);
}

/**
 * 301 lines for dist/_redirects: breaker pages folded into another spelling of the same model
 * ("/kirici/furukawa/f2" → "/kirici/furukawa/f-2"), in both languages.
 */
export function redirectLines(catalog: PublicCatalog): string[] {
  const { breakers, redirects } = groupBreakers(catalog);
  const pages = new Set([...breakers.keys()].map(breakerPath));
  return redirects
    .filter(([from]) => !pages.has(from))
    .flatMap(([from, to]) =>
      LANGS.map((lang) => `${localePath(from, lang)} ${localePath(to, lang)} 301`),
    );
}

/** URLs per sitemap file; the protocol allows 50,000. */
const SITEMAP_MAX = 45000;

/** The sitemap index robots.txt names; `sitemap.xml` (the URL Search Console already has) is a copy. */
export const SITEMAP_INDEX = 'sitemap-index.xml';

/** Sitemap groups, so Search Console's page report can be filtered by page type and language. */
export type SitemapGroup = 'static' | 'kirici' | 'yedek-parca' | 'marka';
export const sitemapGroup = (path: string): SitemapGroup =>
  path.startsWith('/kirici/')
    ? 'kirici'
    : path.startsWith('/marka/')
      ? 'marka'
      : path.startsWith(`${PARTS_PATH}/`)
        ? 'yedek-parca'
        : 'static';

/**
 * The files a page's own content comes from, for its sitemap <lastmod> (prerender.mjs dates
 * each by its last git commit and takes the latest). Paths are relative to the app; a picture
 * is its base (`public/photos/parca/<stem>`), standing for all its sizes. Only inputs that are
 * this page's alone count: a part item's pictures and 3D model, a breaker's own tip photos, the
 * legal texts and the guides. Shared code, the dictionary and D1 rows do not (D1 rows carry the import time,
 * not a change time): a page with no input of its own gets no <lastmod> rather than a date that
 * changes with every commit or build.
 */
export function pageInputs(p: PrerenderPage): string[] {
  const m = p.props.model;
  const pic = (base: string | undefined) => (base ? [`public${base}`] : []);
  switch (m.kind) {
    case 'partItem': {
      const r = findRender(m.part, m.anchor);
      if (!r) return [];
      return [
        ...pic(r.hero),
        ...r.views.flatMap((v) => pic(v.base)),
        ...(r.fitted?.views ?? []).flatMap((v) => pic(v.base)),
        ...(r.model3d ? [`public${r.model3d}`] : []),
      ];
    }
    case 'breaker':
      return (m.photos ?? []).flatMap(pic);
    case 'legal':
      return ['src/lib/legal.ts'];
    case 'guide':
      return ['src/lib/guides.ts'];
    default:
      return [];
  }
}

/**
 * The sitemaps: one file per group and language (`sitemap-kirici-tr.xml`, …; past SITEMAP_MAX
 * URLs a group is split into `-2`, `-3`), every indexable page with its hreflang alternates (tr,
 * en, x-default = tr) and, where `lastmod` has a date for it, its <lastmod>; then the index
 * (SITEMAP_INDEX, and the same index as sitemap.xml), each child with its latest <lastmod>.
 * `lastmod` maps a page's file to its date (prerender.mjs, from pageInputs).
 */
export function sitemapFiles(
  pages: PrerenderPage[],
  lastmod: (p: PrerenderPage) => string | undefined = () => undefined,
): { file: string; xml: string }[] {
  const groups = new Map<string, SitemapEntry[]>();
  for (const p of pages) {
    if (!p.indexable) continue;
    const key = `${sitemapGroup(p.props.path)}-${p.lang}`;
    const date = lastmod(p);
    const list = groups.get(key) ?? [];
    list.push({
      loc: SITE + localePath(p.props.path, p.lang),
      ...(date ? { lastmod: date } : {}),
      // No hreflang where the other language is held out of the index (HOLD_EN_PART_ITEMS).
      ...(hasAlternates(p.props)
        ? {
            alternates: {
              tr: SITE + localePath(p.props.path, 'tr'),
              en: SITE + localePath(p.props.path, 'en'),
            },
          }
        : {}),
    });
    groups.set(key, list);
  }
  const files: { file: string; xml: string; lastmod?: string }[] = [];
  const order: SitemapGroup[] = ['static', 'kirici', 'marka', 'yedek-parca'];
  for (const g of order)
    for (const lang of LANGS) {
      const entries = groups.get(`${g}-${lang}`) ?? [];
      for (let i = 0; i < entries.length; i += SITEMAP_MAX) {
        const part = entries.slice(i, i + SITEMAP_MAX);
        const dates = part.flatMap((e) => (e.lastmod ? [e.lastmod] : [])).sort();
        files.push({
          file: `sitemap-${g}-${lang}${i ? `-${i / SITEMAP_MAX + 1}` : ''}.xml`,
          xml: buildSitemapXml(part),
          ...(dates.length ? { lastmod: dates[dates.length - 1] } : {}),
        });
      }
    }
  const index = buildSitemapIndexXml(
    files.map((f) => ({ loc: `${SITE}/${f.file}`, ...(f.lastmod ? { lastmod: f.lastmod } : {}) })),
  );
  return [
    { file: SITEMAP_INDEX, xml: index },
    { file: 'sitemap.xml', xml: index },
    ...files.map(({ file, xml }) => ({ file, xml })),
  ];
}
