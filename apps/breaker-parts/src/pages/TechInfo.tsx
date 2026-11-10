import { Suspense, lazy, useEffect, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { durations, editorialEase, useReducedMotion } from '@kervan/motion';
import type { DictBlock, Lang, TechContent } from '../types';
import type { TechAuth } from '../lib/use-tech-auth';
import { useVegaCatalog } from '../lib/use-vega-catalog';
import { DrawingsContext, useVegaDrawings } from '../lib/use-vega-drawings';
import { useTechFits } from '../lib/use-tech-fits';
import { useTechQuote } from '../lib/use-tech-quote';
import { FITS_HASH } from './tech/fits-hash';

// Its own chunk (search code, make spellings): downloaded only when the tab is opened.
const CatalogTab = lazy(() => import('./tech/CatalogTab'));
const FitsTab = lazy(() => import('./tech/FitsTab'));
const QuickTab = lazy(() => import('./tech/QuickTab'));
const QUICK_HASH = '#ara';

type Tab = 'quick' | 'general' | 'catalog' | 'fits';
/** Tab order: the one-box answer first, then the lookups, the static text last. */
const ORDER: Tab[] = ['quick', 'fits', 'catalog', 'general'];
const GENERAL_HASH = '#genel';
/** No hash opens "Hızlı Cevap": one box for whatever the caller names. */
const tabFromHash = (): Tab => {
  if (typeof window === 'undefined') return 'quick';
  const h = window.location.hash;
  if (h === '#katalog') return 'catalog';
  if (h === GENERAL_HASH) return 'general';
  if (h === FITS_HASH || h.startsWith(`${FITS_HASH}/`)) return 'fits';
  return 'quick';
};

interface Props {
  t: DictBlock;
  lang: Lang;
  tech: TechAuth;
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';

/** Owner-only page. This route is only a shell: the content arrives from
 *  /api/tech/content after the server confirmed a session, and the page is
 *  kept out of search engines (noindex, set by RouteHead / the prerender).
 *  The prerendered shell only ever shows the loading line: the server
 *  render never has a session. */
export default function TechInfo({ t, lang, tech }: Props) {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const selectTab = (next: Tab) => {
    setTab(next);
    window.history.replaceState(
      null,
      '',
      next === 'catalog'
        ? '#katalog'
        : next === 'fits'
          ? FITS_HASH
          : next === 'quick'
            ? QUICK_HASH
            : GENERAL_HASH,
    );
  };
  // An expired session keeps the page and its data; the password is asked for inline.
  const signedIn = tech.state === 'authed' || tech.state === 'expired';
  // Both lists are fetched when their tab is first opened and kept until sign-out.
  const catalog = useVegaCatalog(
    signedIn,
    tech.state === 'authed' && tab === 'catalog',
    tech.expire,
  );
  // The quick answer reads the same lists as the shared-tips tab.
  const lookup = tab === 'fits' || tab === 'quick';
  const fits = useTechFits(signedIn, tech.state === 'authed' && lookup, tech.expire);
  // Shop prices, stock and lead time for the quote lines (owner only, memory only).
  const quote = useTechQuote(signedIn, tech.state === 'authed' && lookup, tech.expire);

  if (signedIn) {
    const c = tech.content ? (tech.content[lang] ?? tech.content.tr ?? null) : null;
    return (
      <Content
        c={c}
        t={t}
        lang={lang}
        tech={tech}
        tab={tab}
        selectTab={selectTab}
        catalog={catalog}
        fits={fits}
        quote={quote}
      />
    );
  }

  return (
    <section className="pt-10 pb-16 md:pt-16 md:pb-24">
      {tech.state === 'unknown' ? (
        <p className="max-w-[1280px] mx-auto px-6 md:px-8 font-sans text-ink-mid">
          {t.techUi.loading}
        </p>
      ) : (
        <LoginForm t={t} tech={tech} />
      )}
    </section>
  );
}

function Tabs({ t, tab, onSelect }: { t: DictBlock; tab: Tab; onSelect: (x: Tab) => void }) {
  const order = ORDER;
  const label = (x: Tab) =>
    x === 'general'
      ? t.catalogUi.tabGeneral
      : x === 'catalog'
        ? t.catalogUi.tabCatalog
        : x === 'quick'
          ? t.quickUi.tab
          : t.fitsUi.tab;
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next =
      order[(order.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : order.length - 1)) % order.length];
    onSelect(next);
    document.getElementById(`tech-tab-${next}`)?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={t.catalogUi.tabsLabel}
      className="flex gap-2 overflow-x-auto min-w-0"
      onKeyDown={onKey}
    >
      {order.map((x) => (
        <button
          key={x}
          id={`tech-tab-${x}`}
          type="button"
          role="tab"
          aria-selected={tab === x}
          aria-controls={tab === x ? `tech-panel-${x}` : undefined}
          tabIndex={tab === x ? 0 : -1}
          onClick={() => onSelect(x)}
          className={`min-h-10 px-3 md:px-5 whitespace-nowrap rounded-[2px] border font-sans text-sm transition-colors ${focusRing} ${
            tab === x
              ? 'bg-brand text-on-brand rounded-[2px] font-semibold border-brand'
              : 'border-hair-strong text-ink hover:border-ink-mid'
          }`}
        >
          {label(x)}
        </button>
      ))}
    </div>
  );
}

function Content({
  c,
  t,
  lang,
  tech,
  tab,
  selectTab,
  catalog,
  fits,
  quote,
}: {
  c: TechContent | null;
  t: DictBlock;
  lang: Lang;
  tech: TechAuth;
  tab: Tab;
  selectTab: (x: Tab) => void;
  catalog: ReturnType<typeof useVegaCatalog>;
  fits: ReturnType<typeof useTechFits>;
  quote: ReturnType<typeof useTechQuote>;
}) {
  // Drawings are fetched when the first detail panel opens; the state lives here so it
  // survives tab switches and is dropped with this component on sign-out.
  const drawings = useVegaDrawings(tech.expire);
  const reduce = useReducedMotion();
  const [catalogText, setCatalogText] = useState('');
  // Signed in again after an expiry: reload what the expired session could not.
  const wasExpired = useRef(false);
  useEffect(() => {
    if (tech.state === 'expired') wasExpired.current = true;
    else if (tech.state === 'authed' && wasExpired.current) {
      wasExpired.current = false;
      if (catalog.status === 'unauthorized') catalog.retry();
      if (fits.status === 'unauthorized') fits.retry();
      if (quote.status === 'unauthorized') quote.retry();
    }
  }, [tech.state, catalog, fits, quote]);
  return (
    <section className="pt-4 pb-16 md:pt-6 md:pb-24">
      {/* Sticky under the site header: the tabs and sign-out stay in reach on a long list. */}
      <div className="sticky top-[60px] md:top-[68px] z-30 bg-bg border-b border-hair mb-6 md:mb-8">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-2 flex items-center justify-between gap-2">
          <Tabs t={t} tab={tab} onSelect={selectTab} />
          <button
            type="button"
            onClick={() => void tech.logout()}
            className={`shrink-0 min-h-10 px-1 font-sans text-xs md:text-sm text-ink-mid hover:text-ink underline underline-offset-4 whitespace-nowrap ${focusRing}`}
          >
            {t.techUi.logout}
          </button>
        </div>
      </div>
      {tech.state === 'expired' && (
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 mb-6">
          <div className="border border-brand rounded-md bg-bg-soft p-4 md:p-6 flex flex-col gap-3 max-w-[520px]">
            <p role="alert" className="font-sans text-ink m-0">
              {t.techUi.expired}
            </p>
            <LoginForm t={t} tech={tech} compact />
          </div>
        </div>
      )}
      {tab === 'catalog' && (
        <motion.div
          id="tech-panel-catalog"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby="tech-tab-catalog"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: durations.sm, ease: editorialEase }}
          className="max-w-[1280px] mx-auto px-6 md:px-8"
        >
          <DrawingsContext.Provider value={drawings}>
            <Suspense fallback={<p className="font-sans text-ink-mid m-0">{t.fitsUi.loading}</p>}>
              <CatalogTab
                // A jump from "Hızlı Cevap" starts the catalogue on that search.
                key={catalogText}
                initialText={catalogText}
                t={t}
                lang={lang}
                status={catalog.status}
                catalog={catalog.catalog}
                popular={catalog.popular}
                guide={catalog.guide}
                retry={catalog.retry}
              />
            </Suspense>
          </DrawingsContext.Provider>
        </motion.div>
      )}
      {tab === 'quick' && (
        <div
          id="tech-panel-quick"
          role="tabpanel"
          tabIndex={-1}
          aria-labelledby="tech-tab-quick"
          className="max-w-[1280px] mx-auto px-4 md:px-8"
        >
          <Suspense fallback={<p className="font-sans text-ink-mid m-0">{t.fitsUi.loading}</p>}>
            <QuickTab
              t={t}
              lang={lang}
              status={fits.status}
              fits={fits.fits}
              parts={fits.parts}
              quote={quote.quote}
              retry={fits.retry}
              onCatalog={(text) => {
                setCatalogText(text);
                selectTab('catalog');
                window.scrollTo({ top: 0 });
              }}
            />
          </Suspense>
        </div>
      )}
      {tab === 'fits' && (
        <div
          id="tech-panel-fits"
          role="tabpanel"
          tabIndex={-1}
          aria-labelledby="tech-tab-fits"
          className="max-w-[1280px] mx-auto px-4 md:px-8"
        >
          <Suspense fallback={<p className="font-sans text-ink-mid m-0">{t.fitsUi.loading}</p>}>
            <FitsTab
              t={t}
              status={fits.status}
              fits={fits.fits}
              parts={fits.parts}
              quote={quote.quote}
              lang={lang}
              retry={fits.retry}
            />
          </Suspense>
        </div>
      )}
      {tab === 'general' && (
        <div
          id="tech-panel-general"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby="tech-tab-general"
          className="max-w-[1280px] mx-auto px-4 md:px-8"
        >
          {c ? (
            <motion.div
              className="flex flex-col gap-6"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: durations.sm, ease: editorialEase }}
            >
              <header className="flex flex-col gap-2">
                <h1 className="font-sans text-2xl md:text-3xl font-semibold text-ink m-0">
                  {c.title}
                </h1>
                {c.aside && <p className="font-sans text-ink-mid m-0 max-w-[70ch]">{c.aside}</p>}
              </header>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {c.groups.map((g) => (
                  <section
                    key={g.title}
                    className="border border-hair-strong rounded-md bg-bg-soft p-4 md:p-6"
                  >
                    <h2 className="font-sans text-sm font-semibold text-brand m-0 mb-3">
                      {g.title}
                    </h2>
                    <dl className="m-0 flex flex-col">
                      {g.rows.map((r) => (
                        <div
                          key={r.k}
                          className="flex justify-between gap-4 py-2 border-t border-hair first:border-t-0"
                        >
                          <dt className="font-sans text-sm text-ink-mid">{r.k}</dt>
                          <dd className="font-sans text-sm font-semibold text-ink m-0 text-right">
                            {r.v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>
            </motion.div>
          ) : (
            <p role="status" className="font-sans text-ink-mid m-0">
              {t.techUi.contentError}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function LoginForm({
  t,
  tech,
  compact = false,
}: {
  t: DictBlock;
  tech: TechAuth;
  /** Inline re-login after an expiry: no page heading. */
  compact?: boolean;
}) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError(null);
    const r = await tech.login(password, remember);
    setBusy(false);
    // Kept after a wrong attempt so a one-letter typo can be fixed; cleared once signed in.
    if (r === 'ok') setPassword('');
    else if (r === 'wrong') setError(t.techUi.wrong);
    else if (r === 'not_configured') setError(t.techUi.notConfigured);
    else setError(t.techUi.error);
  };

  const id = compact ? 'tech-pw-again' : 'tech-pw';
  return (
    <form
      onSubmit={onSubmit}
      className={
        compact ? 'flex flex-col gap-3' : 'max-w-[420px] mx-auto px-6 md:px-8 flex flex-col gap-4'
      }
    >
      {!compact && (
        <h1 className="font-sans font-bold text-[34px] text-ink tracking-[-0.03em] m-0">
          {t.techUi.loginTitle}
        </h1>
      )}
      <label htmlFor={id} className="font-sans text-sm font-medium text-ink-soft">
        {t.techUi.passwordLabel}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          // The page exists only to sign in here; focus saves a tap on the phone.
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`flex-1 min-w-0 bg-bg-soft border border-hair-2 px-4 py-3 font-sans text-ink ${focusRing}`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-pressed={show}
          className={`min-h-11 px-3 border border-hair-strong font-sans text-sm text-ink-mid hover:text-ink ${focusRing}`}
        >
          {show ? t.techUi.hidePassword : t.techUi.showPassword}
        </button>
      </div>
      <label className="flex items-center gap-3 min-h-11 cursor-pointer">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="w-5 h-5 accent-brand"
        />
        <span className="font-sans text-sm text-ink-mid">{t.techUi.remember}</span>
      </label>
      <button
        type="submit"
        disabled={busy || !password}
        className={`bg-brand text-on-brand rounded-[2px] font-semibold px-5 py-3 font-sans text-sm hover:bg-brand-hi transition-colors disabled:opacity-60 ${focusRing}`}
      >
        {busy ? t.techUi.sending : t.techUi.submit}
      </button>
      {error && (
        <p role="alert" className="font-sans text-sm text-err m-0">
          {error}
        </p>
      )}
    </form>
  );
}
