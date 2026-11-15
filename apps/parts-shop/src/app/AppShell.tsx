import { useCallback, useEffect, useRef, useState } from 'react';
import { AstryxProvider } from '@kervan/ui';
import { FinderPickProvider } from '../components/BreakerSearch';
import { readCart } from '../lib/cart';
import { localePath } from '../lib/locale-path';
import { SITE_ORIGIN } from '../lib/page-source';
import PageView from '../PageView';
import type { Lang } from '../types';
import { type PageState, type Loader } from './data';
import { APP_DICT, fmtDate, type AppDict } from './dict';
import { ErrorBoundary } from './ErrorBoundary';
import { Icon } from './icons';
import { openExternal } from './native';
import { pageShowsPrices } from './prices';
import { pageKey, scrollToHash, type Route, type RouteChange, type Router } from './router';
import Machines from './screens/Machines';
import Offline from './screens/Offline';
import Scan from './screens/Scan';
import Start from './screens/Start';
import UpdateNeeded from './screens/UpdateNeeded';
import { store } from './store';
import { TabBar } from './TabBar';
import { FOCUS } from './ui';
import { useMachines } from './use-machines';
import { langRef } from './lang-ref';

/** The page state of one address (a state for another address is never shown). */
interface Shown {
  key: string;
  state: PageState;
}

/** The current page's data: the saved copy, then the site's (data.ts); `retry` reads it again. */
function usePage(
  route: Route,
  lang: Lang,
  loader: Loader,
): { state: PageState; retry: () => void } {
  const key = route.kind === 'page' ? `${lang}:${route.path}` : '';
  const [shown, setShown] = useState<Shown>({ key: '', state: { status: 'loading' } });
  const [tries, setTries] = useState(0);
  const path = route.kind === 'page' ? route.path : null;
  useEffect(() => {
    if (path === null) return;
    let live = true;
    void loader.load(
      path,
      lang,
      (state) => live && setShown({ key, state }),
      () => live,
    );
    return () => {
      live = false;
    };
  }, [key, path, lang, loader, tries]);
  // Back online: every page is read again (a dated copy becomes today's). Back in the app after
  // a while away: the page is asked for again, and read again once it is older than
  // SESSION_TTL_MS (data.ts).
  useEffect(() => {
    const online = () => {
      loader.forgetSession();
      setTries((n) => n + 1);
    };
    const visible = () => {
      if (document.visibilityState === 'visible') setTries((n) => n + 1);
    };
    window.addEventListener('online', online);
    document.addEventListener('visibilitychange', visible);
    return () => {
      window.removeEventListener('online', online);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [loader]);
  const retry = useCallback(() => setTries((n) => n + 1), []);
  return { state: shown.key === key ? shown.state : { status: 'loading' }, retry };
}

/** The top bar: back, the screen's name, and on a model page "Makinelerime ekle". The name is
 *  the h1 of the app's own screens; shop pages bring their own h1, so there it is a plain line. */
function TopBar({
  d,
  title,
  asHeading,
  canBack,
  onBack,
  machine,
}: {
  d: AppDict;
  title: string;
  asHeading: boolean;
  canBack: boolean;
  onBack: () => void;
  machine: { path: string; name: string } | null;
}) {
  const machines = useMachines();
  const saved = !!machine && !!machines?.some((m) => m.path === machine.path);
  const Title = asHeading ? 'h1' : 'p';
  const saveText = saved ? d.top.inMachines : d.top.addMachine;
  return (
    <header className="kv-topbar fixed inset-x-0 top-0 z-30 border-b border-hair bg-bg font-sans">
      <div className="mx-auto flex h-[var(--kv-top)] max-w-[720px] items-center gap-1 px-1">
        {canBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label={d.top.back}
            className={`inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-ink hover:text-brand-hi ${FOCUS}`}
          >
            <Icon name="back" />
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <Title className="m-0 min-w-0 flex-1 truncate text-base font-semibold text-ink">
          {title}
        </Title>
        {machine && machines && (
          // Narrow phones: the icon only, so the model's name keeps its room.
          <button
            type="button"
            aria-pressed={saved}
            aria-label={saveText}
            onClick={() =>
              void (saved ? store.removeMachine(machine.path) : store.addMachine(machine))
            }
            className={`inline-flex size-11 shrink-0 items-center justify-center gap-1.5 rounded-sm px-0 text-sm font-semibold min-[400px]:w-auto min-[400px]:px-2.5 ${saved ? 'text-ink-mid' : 'text-brand-hi'} hover:text-ink ${FOCUS}`}
          >
            <Icon name={saved ? 'check' : 'plus'} className="size-5" />
            <span className="hidden min-[400px]:inline">{saveText}</span>
          </button>
        )}
      </div>
    </header>
  );
}

/** A shop page in the app: its data's state, the dated price line, the page or a fallback. */
function PageRoute({
  route,
  lang,
  d,
  state,
  retry,
}: {
  route: Extract<Route, { kind: 'page' }>;
  lang: Lang;
  d: AppDict;
  state: PageState;
  retry: () => void;
}) {
  const live = `${SITE_ORIGIN}${route.url}`;
  const openSite = () => openExternal(live);
  if (state.status === 'loading')
    return (
      <p role="status" className="m-0 px-4 py-10 text-center font-sans text-sm text-ink-mid">
        {d.loading}
      </p>
    );
  if (state.status === 'offline') return <Offline d={d} onRetry={retry} />;
  if (state.status === 'failed')
    return <Offline d={d} failed onRetry={retry} onOpenSite={openSite} />;
  if (state.status === 'update') return <UpdateNeeded d={d} onOpenSite={openSite} />;
  const { page, fresh } = state;
  // The palet's prices are its lines' (stored when each was added), not the saved page's.
  const isCart = page.props.model.kind === 'cart';
  const dated =
    !fresh &&
    (isCart ? readCart().some((x) => x.cents !== null) : pageShowsPrices(page.props.model));
  return (
    <>
      {dated && (
        <p className="m-0 border-b border-hair bg-bg-soft px-4 py-2 font-sans text-[13px] text-ink-mid">
          {isCart ? d.priceDateCart : d.priceDate(fmtDate(page.at, lang))}
        </p>
      )}
      {/* Keyed by the address only: the fresh copy re-renders the page in place (what was typed
          stays); a page that failed on the saved copy gets another try with it (resetKey). */}
      <ErrorBoundary
        key={pageKey(route.url)}
        resetKey={page.at}
        fallback={<UpdateNeeded d={d} onOpenSite={openSite} />}
      >
        <PageView
          lang={page.props.lang}
          path={page.props.path}
          model={page.props.model}
          fx={page.props.fx}
        />
      </ErrorBoundary>
    </>
  );
}

export default function AppShell({
  router,
  loader,
  initialLang,
}: {
  router: Router;
  loader: Loader;
  initialLang: Lang;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [route, setRoute] = useState<Route>(router.route);
  const [depth, setDepth] = useState(router.depth);
  // How the shown route was reached; the first page counts as a replace (no focus move).
  const how = useRef<RouteChange | null>('replace');
  const main = useRef<HTMLElement>(null);
  const scrolls = useRef(new Map<number, number>());
  const d = APP_DICT[lang];

  useEffect(
    () =>
      router.subscribe((r, h) => {
        how.current = h;
        setRoute(r);
        setDepth(router.depth);
      }),
    [router],
  );

  // Remember each entry's scroll position, for back/forward; not while a new route is shown (the
  // short loading view clamps the scroll, which is not where the reader was).
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (how.current === null) scrolls.current.set(router.depth, window.scrollY);
      });
    };
    window.addEventListener('scroll', on, { passive: true });
    router.scrollOf = (i) => scrolls.current.get(i);
    return () => {
      window.removeEventListener('scroll', on);
      router.scrollOf = null;
    };
  }, [router]);

  const { state, retry } = usePage(route, lang, loader);

  // A page the site moved (a redirect): the address becomes its own.
  useEffect(() => {
    if (route.kind !== 'page' || state.status !== 'ready') return;
    const p = state.page.props;
    if (p.model.kind === 'notFound' || p.path === route.path) return;
    const u = new URL(route.url, 'http://app.invalid');
    router.replaceUrl(`${localePath(p.path, lang)}${u.search}${u.hash}`);
  }, [route, state, lang, router]);

  // A picture that cannot load (offline, not yet seen): its frame stays empty, without the
  // browser's broken-picture mark and alt text.
  useEffect(() => {
    const el = main.current;
    if (!el) return;
    const onError = (e: Event) => {
      if (e.target instanceof HTMLImageElement) e.target.dataset.broken = '';
    };
    const onLoad = (e: Event) => {
      if (e.target instanceof HTMLImageElement) delete e.target.dataset.broken;
    };
    el.addEventListener('error', onError, true);
    el.addEventListener('load', onLoad, true);
    return () => {
      el.removeEventListener('error', onError, true);
      el.removeEventListener('load', onLoad, true);
    };
  }, []);

  // A new screen or page: to the top (or its anchor, or back where it was), focus to the content.
  const ready = route.kind === 'screen' || state.status !== 'loading';
  useEffect(() => {
    const h = how.current;
    if (!h || !ready) return;
    how.current = null;
    if (h === 'pop') window.scrollTo(0, scrolls.current.get(router.depth) ?? 0);
    else if (location.hash) scrollToHash();
    else window.scrollTo(0, 0);
    if (h !== 'replace') main.current?.focus({ preventScroll: true });
  }, [route, ready, router]);

  const title =
    route.kind === 'screen'
      ? route.screen === 'start'
        ? d.appName
        : route.screen === 'machines'
          ? d.machines.title
          : d.scan.title
      : state.status === 'ready'
        ? state.page.props.model.kind === 'breaker'
          ? state.page.props.model.name
          : state.page.title
        : '';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = title && title !== d.appName ? `${title} · ${d.appName}` : d.appName;
  }, [lang, title, d]);

  const machine =
    route.kind === 'page' &&
    state.status === 'ready' &&
    state.page.props.model.kind === 'breaker' &&
    state.page.props.path.startsWith('/kirici/')
      ? { path: state.page.props.path, name: state.page.props.model.name }
      : null;

  const changeLang = (l: Lang) => {
    setLang(l);
    void store.setLang(l);
    langRef.current = l;
    router.reload();
  };

  return (
    <AstryxProvider lang={lang}>
      <FinderPickProvider>
        <div className="kv-app min-h-dvh bg-bg text-ink">
          <TopBar
            d={d}
            title={title}
            asHeading={route.kind === 'screen'}
            canBack={depth > 0}
            onBack={() => router.back()}
            machine={machine}
          />
          <main ref={main} id="icerik" tabIndex={-1} className="kv-main outline-none">
            {route.kind === 'screen' && route.screen === 'start' && (
              <Start lang={lang} d={d} onLang={changeLang} />
            )}
            {route.kind === 'screen' && route.screen === 'machines' && (
              <Machines lang={lang} d={d} />
            )}
            {route.kind === 'screen' && route.screen === 'scan' && (
              <Scan d={d} open={(url) => router.navigate(url)} />
            )}
            {route.kind === 'page' && (
              <PageRoute route={route} lang={lang} d={d} state={state} retry={retry} />
            )}
          </main>
          <TabBar lang={lang} d={d} route={route} />
        </div>
      </FinderPickProvider>
    </AstryxProvider>
  );
}
