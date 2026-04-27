// motion-shim.js — Bridge motion@12 (ES module) into window globals so that
// components.jsx (Babel-transformed in the browser, no module system) can
// consume `motion.div`, `useReducedMotion`, `AnimatePresence` as window.* refs.
//
// Loaded by index.html via <script type="module"> AFTER React/ReactDOM UMDs
// and BEFORE the IIFE that fetches dict.jsx + components.jsx. The IIFE polls
// window.__motionReady before proceeding.
//
// If this fails (CDN down, network error, version drift), components.jsx has
// a Proxy fallback that returns string tags ("div", "span", ...) so React
// renders static HTML rather than throwing on `motion.span`.

try {
  const mod = await import('motion/react');
  window.motion = mod.motion;
  window.useReducedMotion = mod.useReducedMotion;
  window.AnimatePresence = mod.AnimatePresence;
  window.useScroll = mod.useScroll;
  window.useTransform = mod.useTransform;
  window.useInView = mod.useInView;
  window.__motionReady = true;
} catch (err) {
  console.error('[kervanheat] motion-shim failed to load motion/react:', err);
  // Leave window.motion undefined — components.jsx Proxy fallback takes over.
}
