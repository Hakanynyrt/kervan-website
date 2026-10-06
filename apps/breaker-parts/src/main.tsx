import { StrictMode, useLayoutEffect } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter } from 'react-router-dom';
import { StaticMotionProvider, isAnimatedClient, PRERENDERED_ATTR } from '@kervan/motion';
import './styles/globals.css';
import App from './App';

const rootEl = document.getElementById('root')!;

/** Removes `data-prerendered` right after the first animated render has
 *  replaced the static markup (CSS hides it under html.js-anim until then). */
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
// server (empty root) get a fresh render: intro, opening hold, 3D scene and
// entrance animations exactly as before. Everyone else (bots, no-animation
// preference) hydrates the prerendered static page as it is.
if (isAnimatedClient() || !rootEl.hasAttribute(PRERENDERED_ATTR)) {
  createRoot(rootEl).render(tree(false));
} else {
  hydrateRoot(rootEl, tree(true));
}
