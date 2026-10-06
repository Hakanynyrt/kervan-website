import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { MotionConfig } from 'framer-motion';
import { StaticRouter } from 'react-router-dom/server';
import { StaticMotionProvider } from '@kervan/motion';
import { buildHeadTags } from '@kervan/seo';
import App from './App';
import { pageHead, prerenderPaths, alternatesFor, INDEXABLE_PATHS } from './lib/page-meta';
import { LANGS, localePath } from './lib/locale-path';
import { PRODUCTS } from './data/products';

/* ═══════════════════════════════════════════════════════════════════════
   Build-time server entry, used only by scripts/prerender.mjs (bundled to
   dist-ssr/, which the script deletes). Renders each route in STATIC mode,
   the same tree main.tsx hydrates. It never calls /api/tech/* and never
   reads TECH_CONTENT: the tech page is rendered as its signed-out shell.
═══════════════════════════════════════════════════════════════════════ */

export { injectHead, buildSitemapXml } from '@kervan/seo';
export { JS_ANIM_INLINE_SCRIPT, JS_ANIM_ROOT_CSS, PRERENDERED_ATTR } from '@kervan/motion';

/** App markup for a URL, exactly what the static hydrate path renders. */
export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <StaticMotionProvider value>
        <MotionConfig reducedMotion="user">
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </MotionConfig>
      </StaticMotionProvider>
    </StrictMode>,
  );
}

/** Head tags (title, description, robots, canonical, hreflang, OG, JSON-LD). */
export function headTags(url: string): string {
  const { indexable: _indexable, ...head } = pageHead(url);
  return buildHeadTags(head);
}

export interface PrerenderPage {
  /** URL the page is rendered at. */
  url: string;
  /** Output file relative to dist/. */
  file: string;
  lang: 'tr' | 'en';
  indexable: boolean;
}

/** "/" → index.html, "/en/" → en/index.html, "/urunler/keski" →
 *  urunler/keski.html (Pages serves it at /urunler/keski, no trailing slash). */
function fileFor(url: string): string {
  if (url === '/') return 'index.html';
  if (url === '/en/') return 'en/index.html';
  return `${url.slice(1)}.html`;
}

/** Every page to write: the indexable pages and the tech shell in both
 *  languages, plus 404 pages (Pages serves the nearest 404.html with a 404
 *  status). The product-folder 404s keep the product "not found" copy. */
export function pages(): PrerenderPage[] {
  const list: PrerenderPage[] = prerenderPaths().map((url) => {
    const h = pageHead(url);
    return { url, file: fileFor(url), lang: h.lang, indexable: h.indexable };
  });
  for (const lang of LANGS) {
    for (const dir of ['/', '/urunler/']) {
      const url = localePath(`${dir}__404`, lang);
      list.push({ url, file: url.replace(/__404$/, '404.html').slice(1), lang, indexable: false });
    }
  }
  return list;
}

/** Sitemap entries for one language-neutral page (both languages). */
export interface SitemapPage {
  path: string;
  urls: { tr: string; en: string };
  alternates: ReturnType<typeof alternatesFor>;
  /** App-relative source paths that make up the page (for <lastmod>). */
  sources: string[];
}

const SHARED_SOURCES = [
  'src/App.tsx',
  'src/lib/dict.ts',
  'src/lib/page-meta.ts',
  'src/components/Nav.tsx',
  'src/components/Footer.tsx',
  'index.html',
];

function sourcesFor(path: string): string[] {
  if (path === '/') return [...SHARED_SOURCES, 'src/pages/Home.tsx', 'src/components', 'src/data'];
  if (path === '/urunler')
    return [...SHARED_SOURCES, 'src/pages/Products.tsx', 'src/sections', 'src/data/products.ts'];
  if (path.startsWith('/urunler/'))
    return [...SHARED_SOURCES, 'src/pages/ProductDetail.tsx', 'src/data'];
  const page: Record<string, string> = {
    '/uyumluluk': 'src/pages/Brands.tsx',
    '/uretim-kalite': 'src/pages/Production.tsx',
    '/hakkimizda': 'src/pages/About.tsx',
    '/iletisim': 'src/pages/Contact.tsx',
  };
  const extra = path === '/uyumluluk' ? ['src/data/brands.ts'] : [];
  return [...SHARED_SOURCES, page[path], ...extra].filter(Boolean);
}

export function sitemapPages(): SitemapPage[] {
  return INDEXABLE_PATHS.map((path) => {
    const alternates = alternatesFor(path);
    return {
      path,
      urls: { tr: alternates.tr, en: alternates.en },
      alternates,
      sources: sourcesFor(path),
    };
  });
}

/** For the build log / sanity checks. */
export const PRODUCT_SLUGS = PRODUCTS.map((p) => p.slug);
