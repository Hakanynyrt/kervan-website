import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { fadeUp, inViewOnce, staggerContainer } from '@kervan/motion';
import type { DictBlock, Lang, TechContent } from '../types';
import type { TechAuth } from '../lib/use-tech-auth';
import { useVegaCatalog } from '../lib/use-vega-catalog';
import CatalogTab from './tech/CatalogTab';

type Tab = 'general' | 'catalog';
const tabFromHash = (): Tab => (window.location.hash === '#katalog' ? 'catalog' : 'general');

interface Props {
  t: DictBlock;
  lang: Lang;
  tech: TechAuth;
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';

/** Owner-only page. This route is only a shell: the content arrives from
 *  /api/tech/content after the server confirmed a session, and the page is
 *  kept out of search engines. */
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
      next === 'catalog' ? '#katalog' : window.location.pathname,
    );
  };
  // The catalog is fetched only after sign-in and only when its tab is opened.
  const catalog = useVegaCatalog(tech.state === 'authed' && tab === 'catalog', tech.logout);

  useEffect(() => {
    const m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex, nofollow';
    document.head.appendChild(m);
    const prev = document.title;
    document.title = `${t.techUi.eyebrow} — Kervan Breaker`;
    return () => {
      m.remove();
      document.title = prev;
    };
  }, [t.techUi.eyebrow]);

  if (tech.state === 'authed' && tech.content) {
    const c = tech.content[lang] ?? tech.content.tr;
    if (c)
      return (
        <Content
          c={c}
          t={t}
          lang={lang}
          tech={tech}
          tab={tab}
          selectTab={selectTab}
          catalog={catalog}
        />
      );
  }

  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24">
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
  const order: Tab[] = ['general', 'catalog'];
  const label = (x: Tab) => (x === 'general' ? t.catalogUi.tabGeneral : t.catalogUi.tabCatalog);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next =
      order[(order.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : order.length - 1)) % order.length];
    onSelect(next);
    document.getElementById(`tech-tab-${next}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={t.catalogUi.tabsLabel} className="flex gap-2" onKeyDown={onKey}>
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
          className={`min-h-11 px-5 rounded-full border font-sans text-sm transition-colors ${focusRing} ${
            tab === x
              ? 'bg-brand text-bg border-brand'
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
}: {
  c: TechContent;
  t: DictBlock;
  lang: Lang;
  tech: TechAuth;
  tab: Tab;
  selectTab: (x: Tab) => void;
  catalog: ReturnType<typeof useVegaCatalog>;
}) {
  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="max-w-[1280px] mx-auto px-6 md:px-8 mb-10">
        <Tabs t={t} tab={tab} onSelect={selectTab} />
      </div>
      {tab === 'catalog' && (
        <div
          id="tech-panel-catalog"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby="tech-tab-catalog"
          className="max-w-[1280px] mx-auto px-6 md:px-8"
        >
          <CatalogTab
            t={t}
            lang={lang}
            status={catalog.status}
            catalog={catalog.catalog}
            retry={catalog.retry}
          />
        </div>
      )}
      {tab === 'general' && (
        <div
          id="tech-panel-general"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby="tech-tab-general"
        >
          <motion.div
            className="max-w-[1280px] mx-auto px-6 md:px-8 mb-16 md:mb-20 grid grid-cols-12 gap-8 items-end"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
              <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium">
                {c.eyebrow}
              </span>
              <h1 className="font-serif italic text-h1 text-ink leading-[1.05] tracking-[-0.02em]">
                {c.title}
              </h1>
            </div>
            <p className="col-span-12 lg:col-span-5 font-serif italic text-lg text-ink-mid leading-relaxed max-w-[44ch]">
              {c.aside}
            </p>
          </motion.div>

          <motion.div
            className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-px bg-hair"
            variants={staggerContainer(0, 0.08)}
            initial="hidden"
            whileInView="show"
            viewport={inViewOnce}
          >
            {c.groups.map((g) => (
              <motion.div key={g.title} variants={fadeUp} className="bg-bg p-8 md:p-10">
                <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium m-0 mb-6">
                  {g.title}
                </h2>
                <dl className="m-0 flex flex-col gap-5">
                  {g.rows.map((r) => (
                    <div key={r.k} className="flex flex-col gap-1">
                      <dt className="font-sans text-xs tracking-[0.16em] uppercase text-ink-soft">
                        {r.k}
                      </dt>
                      <dd className="font-serif text-2xl text-ink m-0">{r.v}</dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto px-6 md:px-8 mt-8">
        <button
          type="button"
          onClick={() => void tech.logout()}
          className={`font-sans text-sm text-ink-mid hover:text-ink underline underline-offset-4 ${focusRing}`}
        >
          {t.techUi.logout}
        </button>
      </div>
    </section>
  );
}

function LoginForm({ t, tech }: { t: DictBlock; tech: TechAuth }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError(null);
    const r = await tech.login(password);
    setBusy(false);
    setPassword('');
    if (r === 'wrong') setError(t.techUi.wrong);
    else if (r === 'not_configured') setError(t.techUi.notConfigured);
    else if (r === 'error') setError(t.techUi.error);
  };

  return (
    <form onSubmit={onSubmit} className="max-w-[420px] mx-auto px-6 md:px-8 flex flex-col gap-4">
      <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium">
        {t.techUi.eyebrow}
      </span>
      <h1 className="font-serif italic text-4xl text-ink m-0">{t.techUi.loginTitle}</h1>
      <label
        htmlFor="tech-pw"
        className="font-sans text-xs tracking-[0.16em] uppercase text-ink-soft"
      >
        {t.techUi.passwordLabel}
      </label>
      <input
        id="tech-pw"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`bg-bg-soft border border-hair-2 px-4 py-3 font-sans text-ink ${focusRing}`}
      />
      <button
        type="submit"
        disabled={busy || !password}
        className={`bg-brand text-bg px-5 py-3 font-sans text-sm hover:bg-brand-hi transition-colors disabled:opacity-60 ${focusRing}`}
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
