import { localePath } from '../lib/locale-path.ts';
import type { Lang } from '../types';

/**
 * The app's router: the History API on the shop's real paths, no library. The shop's pages read
 * `window.location` (`?p=`, `?uc=`, `?tip=`, `?q=`, `?burc=`, `#anchor`) and edit it with
 * `history.replaceState`, so the address is the page's own URL, as on the site. A document-level
 * click listener (and submit, for the two GET search forms) turns links to the shop into
 * `navigate()`; wa.me, mailto:, tel: and other hosts are left to the browser (iOS in M2).
 */

/** The app's own screens (no page on the site). */
export type AppScreen = 'start' | 'machines' | 'scan';

/** Paths of the app's own screens: under `/app/`, which the site does not use. The start screen
 *  is the site's home path (`/`, `/en/`): the app's "Ana ekran". */
export const APP_PATHS = {
  machines: '/app/makinelerim',
  scan: '/app/tara',
} as const;

export type Route =
  | { kind: 'screen'; screen: AppScreen; url: string }
  /** A shop page: `path` neutral (Turkish), `url` the app's address (lang prefix, query, hash). */
  | { kind: 'page'; path: string; url: string };

/** Hosts of the shop that redirect to the canonical origin (www., magaza., shop.). */
const ALIASES = ['www.', 'magaza.', 'shop.'];

/** "/en/kirici-ucu" → en, "/kirici-ucu"; "/en" → en, "/". */
export function splitLang(pathname: string): { lang: Lang | null; path: string } {
  if (pathname === '/en' || pathname === '/en/') return { lang: 'en', path: '/' };
  if (pathname.startsWith('/en/')) return { lang: 'en', path: pathname.slice(3) };
  return { lang: null, path: pathname };
}

/**
 * A path the app opens as a page or screen: no file (an extension other than `.html`), nothing of
 * the site's own machinery (`/api`, media folders). Those open on the site instead.
 */
export function isPagePath(pathname: string): boolean {
  if (
    /^\/(api|assets|fonts|photos|videos|models|og|tips|cdn-cgi|\.well-known)(\/|$)/.test(pathname)
  )
    return false;
  const last = pathname.slice(pathname.lastIndexOf('/') + 1);
  return !/\.[a-z0-9]+$/i.test(last) || /\.html$/i.test(last);
}

/** The site's host and its redirecting aliases. */
const siteHosts = (siteOrigin: string): Set<string> => {
  const host = new URL(siteOrigin).host;
  return new Set([host, ...ALIASES.map((a) => a + host)]);
};

/**
 * The in-app address (`/path?query#hash`) of a link, or null when the link leaves the app:
 * relative links and links on the app's own origin or the shop's (canonical or alias host) are
 * the app's; other hosts, `mailto:`, `tel:`, `wa.me`, files and the site's machinery are not.
 */
export function inAppTarget(href: string, base: string, siteOrigin: string): string | null {
  let u: URL;
  try {
    u = new URL(href, base);
  } catch {
    return null;
  }
  const b = new URL(base);
  // The app's own origin (capacitor://localhost in the iPhone build): scheme and host, never a
  // host-less URL (tel:, mailto:, javascript:).
  const own = u.host !== '' && u.protocol === b.protocol && u.host === b.host;
  const site =
    (u.protocol === 'https:' || u.origin === siteOrigin) && siteHosts(siteOrigin).has(u.host);
  if (!own && !site) return null;
  if (!isPagePath(u.pathname)) return null;
  const path = u.pathname.replace(/\.html$/i, '').replace(/\/index$/, '/') || '/';
  return `${path}${u.search}${u.hash}`;
}

/**
 * A Kervan shop link pasted or scanned: only https links on the site (its own origin, or the
 * alias hosts), to one of its pages; returns the in-app address, else null.
 */
export function kervanLink(text: string, siteOrigin: string): string | null {
  const s = text.trim();
  if (!s || /\s/.test(s)) return null;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.username || u.password) return null;
  if (u.protocol !== 'https:' && u.origin !== siteOrigin) return null;
  if (!siteHosts(siteOrigin).has(u.host)) return null;
  return inAppTarget(u.href, siteOrigin, siteOrigin);
}

/**
 * The route of an in-app address in the app's language: a shop path in the other language is
 * opened in the app's (one language at a time, chosen on Start).
 */
export function parseRoute(url: string, lang: Lang): Route {
  const u = new URL(url, 'http://app.invalid');
  const { path } = splitLang(u.pathname);
  const rest = `${u.search}${u.hash}`;
  if (path === '/' || path === '')
    return { kind: 'screen', screen: 'start', url: `${localePath('/', lang)}${rest}` };
  const bare = path.replace(/\/+$/, '') || '/';
  if (bare === APP_PATHS.machines)
    return { kind: 'screen', screen: 'machines', url: `${bare}${rest}` };
  if (bare === APP_PATHS.scan) return { kind: 'screen', screen: 'scan', url: `${bare}${rest}` };
  return { kind: 'page', path: bare, url: `${localePath(bare, lang)}${rest}` };
}

/** The part of an address that picks the page (no hash): a change here opens another page. */
export const pageKey = (url: string): string => url.split('#')[0];

/** The address a GET form sends (`action` with the form's fields as the query; its hash kept). */
export function formTarget(action: string, fields: Iterable<[string, string]>): string {
  const [head, hash = ''] = action.split('#');
  const [path] = head.split('?');
  const q = new URLSearchParams([...fields]).toString();
  return `${path}${q ? `?${q}` : ''}${hash ? `#${hash}` : ''}`;
}

/** What the history entries of the app carry (kept when the shop's pages replace them). */
interface EntryState {
  kvIdx: number;
}

const idxOf = (state: unknown): number | null =>
  state && typeof state === 'object' && typeof (state as EntryState).kvIdx === 'number'
    ? (state as EntryState).kvIdx
    : null;

export interface RouterOptions {
  lang: () => Lang;
  siteOrigin: string;
  /** Links that leave the app (other hosts, files): the native layer opens them. */
  openExternal?: (url: string) => void;
}

/** How a route was reached: a new entry, back/forward, or the same entry rewritten. */
export type RouteChange = 'push' | 'pop' | 'replace';

/** The browser side of the router: history entries, link and form interception. */
export class Router {
  private idx = 0;
  private opts: RouterOptions;
  private off: (() => void)[] = [];
  private subs = new Set<(route: Route, how: RouteChange) => void>();
  route: Route;
  /** The scroll position last seen on an entry (AppShell keeps them), for Back/Forward between
   *  two anchors of one page. */
  scrollOf: ((idx: number) => number | undefined) | null = null;

  constructor(opts: RouterOptions) {
    this.opts = opts;
    const here = `${location.pathname}${location.search}${location.hash}`;
    this.route = parseRoute(here, opts.lang());
    this.idx = idxOf(history.state) ?? 0;
    history.replaceState({ kvIdx: this.idx }, '', this.route.url);
  }

  /** Called with the new route after every page change (not on a jump to an anchor). */
  subscribe(fn: (route: Route, how: RouteChange) => void): () => void {
    this.subs.add(fn);
    return () => {
      this.subs.delete(fn);
    };
  }

  private emit(route: Route, how: RouteChange): void {
    for (const fn of this.subs) fn(route, how);
  }

  /** Index of the current entry among the app's (0: the first page of this session). */
  get depth(): number {
    return this.idx;
  }

  /** Opens an in-app address (or any URL: one that leaves the app goes to `openExternal`). */
  navigate = (href: string, { replace = false }: { replace?: boolean } = {}): void => {
    const target = inAppTarget(href, location.href, this.opts.siteOrigin);
    if (target === null) {
      this.opts.openExternal?.(new URL(href, this.opts.siteOrigin).href);
      return;
    }
    const next = parseRoute(target, this.opts.lang());
    const cur = `${location.pathname}${location.search}${location.hash}`;
    if (next.url === cur && !replace) {
      // The same address again: to its anchor (as the browser does), else to the top.
      if (location.hash) scrollToHash({ focus: true });
      else window.scrollTo(0, 0);
      return;
    }
    // Same page, another anchor: a jump, no new page (an entry of its own, with the app's index,
    // so Back returns to where the jump started).
    const hashOnly = pageKey(next.url) === pageKey(cur);
    if (replace) history.replaceState({ kvIdx: this.idx }, '', next.url);
    else history.pushState({ kvIdx: ++this.idx }, '', next.url);
    this.route = next;
    if (hashOnly) scrollToHash({ focus: true });
    else this.emit(next, replace ? 'replace' : 'push');
  };

  /** The address of the current entry rewritten in place (a redirect, another language). */
  replaceUrl(url: string): void {
    history.replaceState({ kvIdx: this.idx }, '', url);
    this.route = parseRoute(url, this.opts.lang());
  }

  /** Re-reads the current address (after a language change). */
  reload(): void {
    const here = `${location.pathname}${location.search}${location.hash}`;
    this.route = parseRoute(here, this.opts.lang());
    history.replaceState({ kvIdx: this.idx }, '', this.route.url);
    this.emit(this.route, 'replace');
  }

  back(): void {
    if (this.idx > 0) history.back();
  }

  /** Starts listening: back/forward, link clicks, GET form submits. */
  start(): () => void {
    history.scrollRestoration = 'manual';
    // The shop's pages replace their entry with `null` state in places (Part.tsx's anchors):
    // keep the app's index on the entry whatever they pass.
    const replace = history.replaceState.bind(history);
    history.replaceState = (data: unknown, unused: string, url?: string | URL | null) =>
      replace(data ?? { kvIdx: this.idx }, unused, url);
    const onPop = (e: PopStateEvent) => {
      const before = this.route;
      const idx = idxOf(e.state);
      const here = `${location.pathname}${location.search}${location.hash}`;
      const next = parseRoute(here, this.opts.lang());
      if (idx === null) {
        // An entry the app did not make (a jump the browser made by itself): one past the
        // last, and stamped, so the scroll positions of other entries are not mixed up with it.
        this.idx += 1;
        replace({ kvIdx: this.idx }, '', next.url);
      } else {
        this.idx = idx;
        // An entry from before a language change: its address in the app's language now.
        if (next.url !== here) replace({ kvIdx: this.idx }, '', next.url);
      }
      if (pageKey(next.url) === pageKey(before.url)) {
        this.route = next;
        const y = this.scrollOf?.(this.idx);
        if (y === undefined) scrollToHash();
        else window.scrollTo(0, y);
        return;
      }
      this.route = next;
      this.emit(next, 'pop');
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (!(a instanceof HTMLAnchorElement) || a.hasAttribute('download')) return;
      // The page's own anchors (`#…`) too: navigate() makes the jump an entry of the app's.
      const target = inAppTarget(a.href, location.href, this.opts.siteOrigin);
      if (target === null) return; // leaves the app: the browser (iOS) opens it
      e.preventDefault();
      this.navigate(target);
    };
    const onSubmit = (e: SubmitEvent) => {
      if (e.defaultPrevented) return;
      const form = e.target;
      if (!(form instanceof HTMLFormElement) || form.method.toLowerCase() !== 'get') return;
      const target = inAppTarget(
        form.getAttribute('action') ?? '',
        location.href,
        this.opts.siteOrigin,
      );
      if (target === null) return;
      const fields: [string, string][] = [];
      for (const [k, v] of new FormData(form, e.submitter))
        if (typeof v === 'string') fields.push([k, v]);
      e.preventDefault();
      this.navigate(formTarget(target, fields));
    };
    window.addEventListener('popstate', onPop);
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    this.off.push(
      () => window.removeEventListener('popstate', onPop),
      () => document.removeEventListener('click', onClick),
      () => document.removeEventListener('submit', onSubmit),
      () => {
        history.replaceState = replace;
      },
    );
    return () => this.off.splice(0).forEach((f) => f());
  }
}

/**
 * Brings the current `#anchor` into view (a pushed address does not scroll by itself). `focus`:
 * the target also takes the focus, as a tap on an in-page link moves it in the browser (a target
 * that cannot take it gets `tabindex="-1"`, marked `data-kv-anchor`).
 */
export function scrollToHash({ focus = false }: { focus?: boolean } = {}): void {
  let id = '';
  try {
    id = decodeURIComponent(location.hash.slice(1));
  } catch {
    /* a malformed anchor: the top */
  }
  requestAnimationFrame(() => {
    const el = id ? document.getElementById(id) : null;
    if (!el) {
      window.scrollTo(0, 0);
      return;
    }
    el.scrollIntoView();
    if (!focus) return;
    if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '-1');
      el.dataset.kvAnchor = '';
    }
    el.focus({ preventScroll: true });
  });
}
