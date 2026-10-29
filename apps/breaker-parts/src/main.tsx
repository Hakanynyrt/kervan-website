import { StrictMode, useLayoutEffect } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter } from 'react-router-dom';
import { StaticMotionProvider, isAnimatedClient, PRERENDERED_ATTR } from '@kervan/motion';
import './styles/globals.css';
import App from './App';

const rootEl = document.getElementById('root')!;

/** Removes `data-prerendered` right after the first animated render has
 *  replaced the static markup. */
function RevealRoot() {
  useLayoutEffect(() => {
    rootEl.removeAttribute(PRERENDERED_ATTR);
  }, []);
  return null;
}

const tree = (staticMode: boolean) => (
  <StrictMode>
    <StaticMotionProvider value={staticMode}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <App />
          {!staticMode && <RevealRoot />}
        </BrowserRouter>
      </MotionConfig>
    </StaticMotionProvider>
  </StrictMode>
);

// Animated visitors (the inline <head> script set html.js-anim) and the dev
// server (empty root) get a fresh render with the entrance animations. The
// prerendered page is never hidden (2026-10-29, like kervanheat.com), so the
// browser paints it first and the fresh render runs right after. Everyone else
// (bots, no-animation preference) hydrates the prerendered static page as it is.
if (isAnimatedClient() || !rootEl.hasAttribute(PRERENDERED_ATTR)) {
  const start = () => createRoot(rootEl).render(tree(false));
  if (rootEl.hasAttribute(PRERENDERED_ATTR)) requestAnimationFrame(() => setTimeout(start, 0));
  else start();
} else {
  hydrateRoot(rootEl, tree(true));
}
