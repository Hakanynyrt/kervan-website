import { StrictMode, useLayoutEffect } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { isAnimatedClient, PRERENDERED_ATTR, StaticMotionProvider } from '@kervan/motion';
import './styles/globals.css';
import App from './App';
import { langFromPath, pathForLang } from './lib/use-lang';

const el = document.getElementById('root')!;
const lang = langFromPath(window.location.pathname);

/** Removes `data-prerendered` once the animated render has committed
 *  (CSS hides the static markup under html.js-anim until then). */
function RevealRoot() {
  useLayoutEffect(() => {
    el.removeAttribute(PRERENDERED_ATTR);
  }, []);
  return null;
}

if (isAnimatedClient() || !el.hasChildNodes()) {
  // Animated visitors (and the dev server, which has no prerendered markup):
  // a fresh render replaces the static HTML, exactly like before prerendering.
  const start = () =>
    createRoot(el).render(
      <StrictMode>
        <MotionConfig reducedMotion="user">
          <App lang={lang} />
          <RevealRoot />
        </MotionConfig>
      </StrictMode>,
    );
  // The prerendered page is never hidden here (the intro curtain is CSS, see prerender.mjs), so
  // let the browser paint it before the full render runs (2026-10-28, Lighthouse: the render held
  // back the first paint on phones).
  if (el.hasChildNodes()) requestAnimationFrame(() => setTimeout(start, 0));
  else start();
} else {
  // Bots, headless browsers and reduced-motion visitors: keep the
  // prerendered static page and hydrate it (same tree as entry-server.tsx).
  hydrateRoot(
    el,
    <StrictMode>
      <StaticMotionProvider>
        <MotionConfig reducedMotion="user">
          <App lang={lang} />
        </MotionConfig>
      </StaticMotionProvider>
    </StrictMode>,
  );
}

// Legacy ?lang=en links on the Turkish URL → the English page (browser only).
if (lang === 'tr' && new URLSearchParams(window.location.search).get('lang') === 'en') {
  window.location.replace(pathForLang('en') + window.location.hash);
}
