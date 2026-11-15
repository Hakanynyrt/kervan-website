import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/globals.css';
import './app.css';
import { DICT } from '../lib/dict';
import { setNavigator } from '../lib/nav';
import { readPageProps } from '../lib/page-props';
import { SITE_ORIGIN } from '../lib/page-source';
import { CART_PATH } from '../lib/routes';
import AppShell from './AppShell';
import { createLoader, idbCache, safeCache } from './data';
import { langRef } from './lang-ref';
import { openExternal } from './native';
import { Router } from './router';
import { firstLang, store } from './store';
import { LANG_WAIT_MS, withTimeout } from './timeout';

/**
 * The iPhone app's entry (app.html, vite.app.config.ts): the shop's pages in the app's own shell,
 * their data read from the live site. Never imports the site's Layout, consent banner, ads tag or
 * page head.
 */
async function boot() {
  // The phone's storage answers at once; if it does not (a plugin that never replies), the app
  // starts in the phone's language rather than stay blank (2026-11-15: the first iPhone build
  // opened white).
  langRef.current = await withTimeout(
    store.lang(navigator.language),
    LANG_WAIT_MS,
    firstLang(navigator.language),
  ).catch(() => firstLang(navigator.language));
  const loader = createLoader({
    origin: SITE_ORIGIN,
    cache: safeCache(idbCache()),
    fetch: (url) => fetch(url, { credentials: 'omit', headers: { Accept: 'text/html' } }),
    parse: (html) => new DOMParser().parseFromString(html, 'text/html'),
    readProps: (doc) => readPageProps(doc as Document),
    // The palet's lines are on the phone: offline it opens even if /palet was never read.
    offlinePage: (path, lang, fx) =>
      path === CART_PATH
        ? {
            props: { lang, path, model: { kind: 'cart', demo: false, hasPopular: false }, fx },
            title: DICT[lang].cart.title,
            at: Date.now(),
          }
        : null,
  });
  const router = new Router({
    lang: () => langRef.current,
    siteOrigin: SITE_ORIGIN,
    openExternal,
  });
  router.start();
  // The shop's one programmatic page change (BreakerSearch's "Ara") opens inside the app.
  setNavigator(router.navigate);
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppShell router={router} loader={loader} initialLang={langRef.current} />
    </StrictMode>,
  );
}

void boot();
