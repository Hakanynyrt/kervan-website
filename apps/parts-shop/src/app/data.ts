import { localePath } from '../lib/locale-path.ts';
import type { PageProps } from '../lib/page-props';
import type { Lang } from '../types';
import { checkProps } from './contract.ts';

/**
 * A shop page's data in the app: the live page's HTML from the site (`SITE_ORIGIN` +
 * `localePath(path, lang)`), its embedded props (`<script id="kv-page">`, read with the site's
 * own `readPageProps`), kept on the phone in IndexedDB (at most `CACHE_CAP` pages, with the
 * date they were read). Stale-while-revalidate: a saved page shows at once and is read again;
 * one not read again in this session carries its date (the dated price line).
 */

/** The most pages kept on the phone (oldest read dropped first). */
export const CACHE_CAP = 300;

/** How long a page read in this session counts as today's before it is read again (as the
 *  palet's own re-read, `refreshIsFresh` in lib/cart.ts). */
export const SESSION_TTL_MS = 10 * 60_000;

/** How long the phone's store may take to answer before it is treated as broken (memory only). */
export const CACHE_WAIT_MS = 1_500;

/** A saved page: its props, title and when it was read from the site (ms). */
export interface CachedPage {
  props: PageProps;
  title: string;
  at: number;
}

export type PageState =
  | { status: 'loading' }
  /** `fresh`: read from the site in this session (its prices are today's). */
  | { status: 'ready'; page: CachedPage; fresh: boolean }
  /** No connection and no saved copy. */
  | { status: 'offline' }
  /** The site answered with something that is not a shop page (no props, server error). */
  | { status: 'failed' }
  /** A page kind this app does not know (a newer site): the update screen. */
  | { status: 'update' };

/** The key a page is saved under: language and neutral path. */
export const cacheKey = (lang: Lang, path: string): string => `${lang}:${path}`;

/** Where a page's HTML is read from. */
export const pageUrl = (origin: string, path: string, lang: Lang): string =>
  `${origin}${localePath(path, lang)}`;

/** The page's own name from its `<title>` ("Palet | Kervan Makina" → "Palet"). */
export const titleOf = (title: string | null | undefined): string => {
  const s = (title ?? '').trim();
  const cut = s.lastIndexOf(' | ');
  return (cut > 0 ? s.slice(0, cut) : s).trim();
};

/** The bits of a parsed document this module reads (a DOM `Document` in the browser). */
export interface DocLike {
  title: string;
  getElementById(id: string): { textContent: string | null } | null;
  querySelector?(selector: string): { textContent: string | null } | null;
}

/** The page's own heading (`main h1`), as the page shows it under the top bar; else `<title>`. */
export function headingOf(doc: DocLike): string {
  const h = doc.querySelector?.('main h1') ?? doc.querySelector?.('h1') ?? null;
  return h?.textContent?.replace(/\s+/g, ' ').trim() || titleOf(doc.title);
}

export type Parsed =
  | { ok: true; props: PageProps; title: string }
  | { ok: false; reason: 'invalid' | 'unknownKind' };

/** A page's HTML as the app's page data (`readProps`: the site's `readPageProps`). */
export function parsePage(doc: DocLike, readProps: (doc: DocLike) => unknown): Parsed {
  const check = checkProps(readProps(doc));
  if (!check.ok) return { ok: false, reason: check.reason };
  return { ok: true, props: check.props, title: headingOf(doc) };
}

/** Saved pages (IndexedDB in the app; a Map in tests or where IndexedDB is blocked). */
export interface PageCache {
  get(key: string): Promise<CachedPage | null>;
  put(key: string, page: CachedPage): Promise<void>;
  /** The page read most recently (its exchange rate serves a page built on the phone). */
  newest(): Promise<CachedPage | null>;
}

/** An in-memory cache with the same cap rule (oldest `at` dropped first). */
export function memoryCache(cap = CACHE_CAP): PageCache & { size(): number } {
  const m = new Map<string, CachedPage>();
  return {
    size: () => m.size,
    async get(key) {
      return m.get(key) ?? null;
    },
    async put(key, page) {
      m.set(key, page);
      if (m.size <= cap) return;
      const old = [...m].sort((a, b) => a[1].at - b[1].at).slice(0, m.size - cap);
      for (const [k] of old) m.delete(k);
    },
    async newest() {
      let best: CachedPage | null = null;
      for (const p of m.values()) if (!best || p.at > best.at) best = p;
      return best;
    },
  };
}

const DB = 'kv-app';
const STORE = 'pages';

const req = <T>(r: IDBRequest<T>): Promise<T> =>
  new Promise((res, rej) => {
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });

/** The IndexedDB cache (db `kv-app`, store `pages`, keyed by `cacheKey`, index on `at`). */
export function idbCache(cap = CACHE_CAP): PageCache {
  let db: Promise<IDBDatabase> | null = null;
  const open = () =>
    (db ??= new Promise<IDBDatabase>((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => {
        const s = r.result.createObjectStore(STORE, { keyPath: 'key' });
        s.createIndex('at', 'at');
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
  return {
    async get(key) {
      const d = await open();
      const row = (await req(d.transaction(STORE).objectStore(STORE).get(key))) as
        | (CachedPage & { key: string })
        | undefined;
      return row ? { props: row.props, title: row.title, at: row.at } : null;
    },
    async put(key, page) {
      const d = await open();
      const s = d.transaction(STORE, 'readwrite').objectStore(STORE);
      await req(s.put({ key, ...page }));
      const n = await req(s.count());
      if (n <= cap) return;
      let drop = n - cap;
      await new Promise<void>((res, rej) => {
        const c = s.index('at').openCursor();
        c.onsuccess = () => {
          const cur = c.result;
          if (!cur || drop <= 0) return res();
          cur.delete();
          drop--;
          cur.continue();
        };
        c.onerror = () => rej(c.error);
      });
    },
    async newest() {
      const d = await open();
      const idx = d.transaction(STORE).objectStore(STORE).index('at');
      const cur = await req(idx.openCursor(null, 'prev'));
      const row = cur?.value as (CachedPage & { key: string }) | undefined;
      return row ? { props: row.props, title: row.title, at: row.at } : null;
    },
  };
}

/** `p`, or `late` once `ms` have passed without an answer. */
const within = <T>(p: Promise<T>, ms: number, late: () => T): Promise<T> =>
  new Promise<T>((res, rej) => {
    const timer = setTimeout(() => res(late()), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        res(v);
      },
      (e: unknown) => {
        clearTimeout(timer);
        rej(e);
      },
    );
  });

/**
 * A cache that never fails or hangs: a store that throws, or does not answer a read within
 * `waitMs` (an IndexedDB open that never completes), is treated as broken for the rest of the
 * session: reads and writes go to `fallback` (memory).
 */
export function safeCache(
  inner: PageCache,
  fallback: PageCache = memoryCache(),
  waitMs = CACHE_WAIT_MS,
): PageCache {
  let broken = false;
  const TIMEOUT = Symbol('timeout');
  async function read<T>(get: (c: PageCache) => Promise<T>): Promise<T> {
    if (!broken)
      try {
        const v = await within<T | typeof TIMEOUT>(get(inner), waitMs, () => TIMEOUT);
        if (v !== TIMEOUT) return v;
        broken = true;
      } catch {
        broken = true;
      }
    return get(fallback);
  }
  return {
    get: (key) => read((c) => c.get(key)),
    newest: () => read((c) => c.newest()),
    async put(key, page) {
      if (!broken)
        try {
          return await inner.put(key, page);
        } catch {
          broken = true;
        }
      return fallback.put(key, page);
    },
  };
}

export interface LoaderDeps {
  origin: string;
  cache: PageCache;
  fetch: (url: string) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;
  /** HTML text → document (DOMParser in the browser). */
  parse: (html: string) => DocLike;
  readProps: (doc: DocLike) => unknown;
  /**
   * A page the app can build on the phone when the site cannot be reached and no copy is saved
   * (the palet, whose lines are on the phone), with `fx` from the newest saved page; else null.
   */
  offlinePage?: (path: string, lang: Lang, fx: PageProps['fx']) => CachedPage | null;
  now?: () => number;
}

/** Statuses whose body is still a shop page (the site's 404 page has its own props). */
const PAGE_STATUS = new Set([200, 404, 410]);

/**
 * The page loader: `load` reports the saved copy at once (if any) and then the site's, through
 * `onState`; pages read in this session are kept in memory and are not read again for
 * `SESSION_TTL_MS` (after that they show as a saved copy while the site is asked again).
 */
export function createLoader(deps: LoaderDeps) {
  const now = deps.now ?? Date.now;
  const session = new Map<string, CachedPage>();

  /** Reads the page from the site: the page, 'update', 'failed' or 'offline'. */
  async function fetchPage(
    path: string,
    lang: Lang,
  ): Promise<CachedPage | 'update' | 'failed' | 'offline'> {
    let res;
    try {
      res = await deps.fetch(pageUrl(deps.origin, path, lang));
    } catch {
      return 'offline';
    }
    if (!PAGE_STATUS.has(res.status)) return 'failed';
    let html: string;
    try {
      html = await res.text();
    } catch {
      return 'offline';
    }
    const parsed = parsePage(deps.parse(html), deps.readProps);
    if (!parsed.ok) return parsed.reason === 'unknownKind' ? 'update' : 'failed';
    return { props: parsed.props, title: parsed.title, at: now() };
  }

  /**
   * Loads a page; `onState` is called with each state in turn (saved copy, then the site's).
   * Returns once the site was asked. `isCurrent` false: the user has moved on, nothing is reported.
   */
  async function load(
    path: string,
    lang: Lang,
    onState: (s: PageState) => void,
    isCurrent: () => boolean = () => true,
  ): Promise<void> {
    const key = cacheKey(lang, path);
    const mem = session.get(key);
    if (mem && now() - mem.at < SESSION_TTL_MS) {
      onState({ status: 'ready', page: mem, fresh: true });
      return;
    }
    const saved = mem ?? (await deps.cache.get(key).catch(() => null));
    if (!isCurrent()) return;
    onState(saved ? { status: 'ready', page: saved, fresh: false } : { status: 'loading' });
    const got = await fetchPage(path, lang);
    if (!isCurrent()) {
      if (typeof got === 'object') remember(key, got);
      return;
    }
    if (typeof got === 'object') {
      remember(key, got);
      onState({ status: 'ready', page: got, fresh: true });
    } else if (got === 'update') onState({ status: 'update' });
    else if (!saved) {
      const built = got === 'offline' ? await buildOffline(path, lang) : null;
      if (!isCurrent()) return;
      onState(built ? { status: 'ready', page: built, fresh: false } : { status: got });
    }
    // A saved copy with no connection or a server error: it stays, dated.
  }

  /** The page built on the phone (deps.offlinePage), with the newest saved exchange rate. */
  async function buildOffline(path: string, lang: Lang): Promise<CachedPage | null> {
    if (!deps.offlinePage) return null;
    const newest = await deps.cache.newest().catch(() => null);
    return deps.offlinePage(path, lang, newest?.props.fx ?? null);
  }

  function remember(key: string, page: CachedPage) {
    session.set(key, page);
    void deps.cache.put(key, page).catch(() => undefined);
  }

  /** Forgets this session's reads (all pages are read again, e.g. back online). */
  const forgetSession = () => session.clear();

  return { load, fetchPage, forgetSession };
}

export type Loader = ReturnType<typeof createLoader>;
