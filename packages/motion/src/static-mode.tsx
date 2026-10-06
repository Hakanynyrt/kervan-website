import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';
import { revealOnScroll } from './variants.js';

/* ═══════════════════════════════════════════════════════════════════════
   Static motion mode (progressive enhancement for prerendered pages).

   The build prerenders every page in STATIC mode: final visual state, no
   entrance/in-view hiding, no intro overlay, no 3D. In the browser an
   inline <head> script (JS_ANIM_INLINE_SCRIPT) adds `js-anim` to <html>
   only for humans with JS who have not asked for reduced motion; those
   visitors get a fresh createRoot render (today's animated site). Every
   other visitor (bots, headless, reduced motion) gets hydrateRoot inside
   <StaticMotionProvider>, which must match the server markup exactly.

   Everything here is SSR-safe: no window/document access at module or
   render time.
═══════════════════════════════════════════════════════════════════════ */

const StaticMotionContext = createContext(false);

interface StaticMotionProviderProps {
  /** Static mode on/off. Defaults to true (wrap the server render and the
   *  hydrate path in it; the animated createRoot path simply omits it). */
  value?: boolean;
  children?: ReactNode;
}

/** Turns static mode on for the subtree: `useStaticMotion()` and the
 *  `useReducedMotion()` exported by this package both return true. */
export function StaticMotionProvider({ value = true, children }: StaticMotionProviderProps) {
  return <StaticMotionContext.Provider value={value}>{children}</StaticMotionContext.Provider>;
}

/** True while rendering in static mode (prerender + hydrate path). */
export function useStaticMotion(): boolean {
  return useContext(StaticMotionContext);
}

/** Drop-in replacement for framer-motion's `useReducedMotion`: returns
 *  true in static mode, otherwise the visitor's `prefers-reduced-motion`
 *  (same `boolean | null` contract as framer-motion). Always import it
 *  from `@kervan/motion`, never from `framer-motion`. */
export function useReducedMotion(): boolean | null {
  const isStatic = useContext(StaticMotionContext);
  const reduced = useFramerReducedMotion();
  return isStatic ? true : reduced;
}

/** False on the server and on the first client render (so hydration
 *  matches), true once the browser has painted and gone idle. Use it to
 *  mount heavy client-only things (3D scene, globe) after hydration:
 *  `const ready = useClientIdle(); … {ready && !isStatic && <Scene />}`. */
export function useClientIdle(timeoutMs = 1500): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (!cancelled) setReady(true);
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(done, { timeout: timeoutMs });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }
    const id = window.setTimeout(done, 1);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [timeoutMs]);
  return ready;
}

/** Class the inline head script puts on <html> for animated visitors. */
export const JS_ANIM_CLASS = 'js-anim';

/** Attribute on the prerendered `#root`; the client removes it right after
 *  its first render (see JS_ANIM_ROOT_CSS). */
export const PRERENDERED_ATTR = 'data-prerendered';

/** Bot / headless user agents that must always get the static page. */
// Broad on purpose: a false positive only means a human gets the static page.
// "google" covers Google-InspectionTool (Search Console live test), Storebot-Google,
// GoogleOther, AdsBot-Google, Mediapartners-Google, etc.; normal browser UAs never
// contain it.
export const BOT_UA_PATTERN =
  'bot|crawl|spider|slurp|google|bing|yandex|baidu|duckduck|facebookexternalhit|lighthouse|pagespeed|headless|inspectiontool|preview|ia_archiver';

/** Inline script for <head> (before any stylesheet/module script). Adds
 *  `js-anim` to <html> only when JS runs, prefers-reduced-motion is not
 *  `reduce`, `navigator.webdriver` is not set and the UA is not a bot. */
export const JS_ANIM_INLINE_SCRIPT =
  '(function(){try{var n=navigator;if(n.webdriver)return;' +
  `if(/${BOT_UA_PATTERN}/i.test(n.userAgent||''))return;` +
  "if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;" +
  `document.documentElement.classList.add('${JS_ANIM_CLASS}')}catch(e){}})();`;

/** Inline CSS for <head>: hides the prerendered (static) markup from
 *  animated visitors until the client's first createRoot render replaces
 *  it, so they never see a flash of the static layout. */
// If the bundle never loads or throws before its first render, the static page is shown
// again after 4 s instead of staying hidden.
export const JS_ANIM_ROOT_CSS = `html.${JS_ANIM_CLASS} #root[${PRERENDERED_ATTR}]{visibility:hidden;animation:kv-unhide 0s linear 4s forwards}@keyframes kv-unhide{to{visibility:visible}}`;

/** Browser-only: true when the head script chose the animated mode.
 *  Call it in main.tsx (never during render). */
export function isAnimatedClient(): boolean {
  return (
    typeof document !== 'undefined' && document.documentElement.classList.contains(JS_ANIM_CLASS)
  );
}

/** `revealOnScroll(delay)` that renders the final state (initial={false})
 *  in static mode or under reduced motion. */
export function useRevealOnScroll(delay = 0) {
  const final = useReducedMotion();
  return revealOnScroll(delay, !!final);
}
