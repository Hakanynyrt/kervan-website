/* Build-time entry (vite build --ssr → dist-ssr/, used by scripts/prerender.mjs).
   Renders each page in STATIC motion mode: final visual state, no intro, no
   hidden in-view styles. It never fetches /api/tech/* and never reads any
   secret; the owner-only section renders nothing without a client session. */
import { renderToString } from 'react-dom/server';
import { MotionConfig } from 'framer-motion';
import { StaticMotionProvider } from '@kervan/motion';
import App from './App';
import NotFound from './components/NotFound';
import type { Lang } from './types';

export { buildHeadTags, injectHead, buildSitemapXml } from '@kervan/seo';
export { JS_ANIM_INLINE_SCRIPT, JS_ANIM_ROOT_CSS, PRERENDERED_ATTR } from '@kervan/motion';
export { homeHead, notFoundHead, pageUrl, ALTERNATES } from './lib/seo';
export { pathForLang } from './lib/use-lang';

/** Must stay identical to the hydrate tree in main.tsx. */
export function renderPage(lang: Lang): string {
  return renderToString(
    <StaticMotionProvider>
      <MotionConfig reducedMotion="user">
        <App lang={lang} />
      </MotionConfig>
    </StaticMotionProvider>,
  );
}

/** dist/404.html body (static, no client script). */
export function renderNotFound(): string {
  return renderToString(<NotFound />);
}
