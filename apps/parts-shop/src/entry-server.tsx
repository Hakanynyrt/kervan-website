import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { buildHeadTags } from '@kervan/seo';
import type { PublicCatalog } from '@kervan/tips';
import App from './App';
import { pageHead } from './lib/page-head';
import { LANGS, localePath } from './lib/locale-path';
import type { PageProps } from './lib/page-props';
import { buildPages } from './lib/routes';
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
      const props: PageProps = { lang, path: p.path, model: p.model };
      out.push({
        file: fileFor(localePath(p.path, lang)),
        lang,
        headTags: buildHeadTags(pageHead(props)),
        appHtml: render(props),
        props,
      });
    }
    const nf: PageProps = { lang, path: '/', model: { kind: 'notFound' } };
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
