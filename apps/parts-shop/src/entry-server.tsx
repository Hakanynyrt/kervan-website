import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { buildHeadTags } from '@kervan/seo';
import type { PublicCatalog } from '@kervan/tips';
import App from './App';
import { pageHead } from './lib/page-head';
import { LANGS, localePath } from './lib/locale-path';
import type { PageProps } from './lib/page-props';
import { breakerPath, buildPages, groupBreakers } from './lib/routes';
import type { Lang } from './types';

/* Build-time only (scripts/prerender.mjs bundles this to dist-ssr/ and deletes it). */

export { injectHead, jsonForScript } from '@kervan/seo';
export { PROPS_ID } from './lib/page-props';

export interface PrerenderPage {
  file: string;
  lang: Lang;
  headTags: string;
  appHtml: string;
  props: PageProps;
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
        headTags: buildHeadTags(pageHead(props)),
        appHtml: render(props),
        props,
      });
    }
    const nf: PageProps = { lang, path: '/', model: { kind: 'notFound' }, fx: null };
    out.push({
      file: lang === 'tr' ? '404.html' : 'en/404.html',
      lang,
      headTags: buildHeadTags(pageHead(nf)),
      appHtml: render(nf),
      props: nf,
    });
  }
  return out;
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
