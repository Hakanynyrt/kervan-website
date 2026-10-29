import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  type FitsFamily,
  type FitsIndex,
  fold,
  groupByMake,
  matches,
  rewriteQuery,
} from '@kervan/tips';
import type { DictBlock } from '../../types';
import type { CatalogStatus } from '../../lib/use-vega-catalog';
import { FITS_HASH } from './fits-hash';

interface Props {
  t: DictBlock;
  status: CatalogStatus;
  fits: FitsIndex | null;
  retry: () => void;
}

type View = { mode: 'breaker'; slug: string | null } | { mode: 'tip'; d: number | null };

function parseHash(h: string): View {
  const rest = h.startsWith(FITS_HASH) ? h.slice(FITS_HASH.length) : '';
  const m = /^\/(k|d)\/(.+)$/.exec(rest);
  if (!m) return rest === '/d' ? { mode: 'tip', d: null } : { mode: 'breaker', slug: null };
  const v = decodeURIComponent(m[2]);
  if (m[1] === 'k') return { mode: 'breaker', slug: v };
  const n = Number(v);
  return { mode: 'tip', d: Number.isFinite(n) && n > 0 ? n : null };
}

function toHash(v: View): string {
  if (v.mode === 'breaker')
    return v.slug ? `${FITS_HASH}/k/${encodeURIComponent(v.slug)}` : FITS_HASH;
  return v.d === null ? `${FITS_HASH}/d` : `${FITS_HASH}/d/${v.d}`;
}

const MAX_RESULTS = 30;
/** Models shown per make before "show all". */
const MAKE_CAP = 18;
const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';
const inputCls = `w-full min-h-11 bg-bg-soft border border-ink-soft rounded-md px-3 font-sans text-ink placeholder:text-ink-mid ${focusRing}`;
const labelCls = 'font-sans text-sm font-medium text-ink-mid';
const chipCls = `min-h-10 px-3 rounded-md border font-sans text-sm transition-colors ${focusRing}`;

const fill = (tpl: string, vars: Record<string, string | number>): string =>
  Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), tpl);
const mm = (v: number): string => String(Math.round(v * 10) / 10);

export default function FitsTab({ t, status, fits, retry }: Props) {
  const c = t.fitsUi;
  if (status !== 'ready' || !fits) {
    const msg =
      status === 'unauthorized'
        ? c.errorUnauthorized
        : status === 'not_configured'
          ? c.errorNotConfigured
          : status === 'empty'
            ? c.errorEmpty
            : status === 'error'
              ? c.errorGeneric
              : c.loading;
    const failed = status === 'error' || status === 'empty' || status === 'not_configured';
    return (
      <div className="flex flex-col gap-4">
        <Head t={t} />
        <p role="status" className="font-sans text-ink-mid m-0">
          {msg}
        </p>
        {failed && (
          <button
            type="button"
            onClick={retry}
            className={`self-start ${chipCls} border-hair-strong text-ink`}
          >
            {c.retry}
          </button>
        )}
      </div>
    );
  }
  return <Ready t={t} fits={fits} />;
}

function Head({ t, fits }: { t: DictBlock; fits?: FitsIndex }) {
  const c = t.fitsUi;
  const makes = useMemo(() => (fits ? new Set(fits.breakers.map((b) => b.brand)).size : 0), [fits]);
  return (
    <header className="flex flex-col gap-2 mb-2">
      <h1 className="font-sans text-2xl md:text-3xl font-semibold text-ink m-0">{c.title}</h1>
      <p className="font-sans text-ink-mid m-0 max-w-[70ch]">{c.sub}</p>
      {fits && (
        <p className="font-sans text-sm text-ink-soft m-0">
          {fill(c.stats, {
            breakers: fits.breakers.length,
            families: fits.families.length,
            makes,
          })}
        </p>
      )}
      <p className="font-sans text-xs text-ink-soft m-0">{c.privacy}</p>
    </header>
  );
}

function Ready({ t, fits }: { t: DictBlock; fits: FitsIndex }) {
  const c = t.fitsUi;
  const [view, setView] = useState<View>(() =>
    typeof window === 'undefined'
      ? { mode: 'breaker', slug: null }
      : parseHash(window.location.hash),
  );
  const resultRef = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef(false);

  useEffect(() => {
    const on = () => setView(parseHash(window.location.hash));
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    resultRef.current?.focus();
    resultRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [view]);

  /** Each pick is a history entry, so the phone's back button walks back through them. */
  const go = (next: View, focus = true) => {
    focusNext.current = focus;
    setView(next);
    const h = toHash(next);
    if (window.location.hash !== h) window.history.pushState(null, '', h);
  };
  const bySlug = useMemo(() => new Map(fits.breakers.map((b, i) => [b.slug, i])), [fits]);
  const pickBreaker = (i: number) => go({ mode: 'breaker', slug: fits.breakers[i].slug });

  return (
    <div className="flex flex-col gap-6">
      <Head t={t} fits={fits} />
      <div role="radiogroup" aria-label={c.modesLabel} className="flex flex-wrap gap-2">
        {(['breaker', 'tip'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={view.mode === m}
            onClick={() =>
              view.mode !== m &&
              go(
                m === 'breaker' ? { mode: 'breaker', slug: null } : { mode: 'tip', d: null },
                false,
              )
            }
            className={`${chipCls} ${
              view.mode === m
                ? 'bg-brand text-on-brand rounded-[2px] font-semibold border-brand'
                : 'border-hair-strong text-ink hover:border-ink-mid'
            }`}
          >
            {m === 'breaker' ? c.modeBreaker : c.modeTip}
          </button>
        ))}
      </div>
      {view.mode === 'breaker' ? (
        <BreakerView
          t={t}
          fits={fits}
          selected={view.slug !== null ? (bySlug.get(view.slug) ?? null) : null}
          onPick={pickBreaker}
          onClear={() => go({ mode: 'breaker', slug: null }, false)}
          resultRef={resultRef}
        />
      ) : (
        <TipView
          t={t}
          fits={fits}
          d={view.d}
          onDiameter={(d) => go({ mode: 'tip', d })}
          onPick={pickBreaker}
          resultRef={resultRef}
        />
      )}
    </div>
  );
}

function BreakerView({
  t,
  fits,
  selected,
  onPick,
  onClear,
  resultRef,
}: {
  t: DictBlock;
  fits: FitsIndex;
  selected: number | null;
  onPick: (i: number) => void;
  onClear: () => void;
  resultRef: React.RefObject<HTMLHeadingElement>;
}) {
  const c = t.fitsUi;
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const makes = useMemo(() => [...new Set(fits.breakers.map((b) => b.brand))], [fits]);
  const names = useMemo(() => fits.breakers.map((b) => b.search), [fits]);

  const found = useMemo(() => {
    const query = dq.trim();
    if (!query) return null;
    const run = (s: string) => {
      const f = fold(s);
      const hits: number[] = [];
      fits.breakers.forEach((b, i) => {
        if (matches(s, b.search)) hits.push(i);
      });
      // Names that start with the query first ("MB 1" before "HB 1000 MB").
      return hits.sort(
        (a, b) =>
          Number(fold(fits.breakers[b].name).startsWith(f)) -
            Number(fold(fits.breakers[a].name).startsWith(f)) ||
          Number(fold(fits.breakers[b].model).startsWith(f)) -
            Number(fold(fits.breakers[a].model).startsWith(f)),
      );
    };
    const direct = run(query);
    if (direct.length) return { hits: direct, rewritten: null as string | null };
    const r = rewriteQuery(query, names, makes);
    return r ? { hits: run(r), rewritten: r } : { hits: [], rewritten: null };
  }, [dq, fits, names, makes]);

  const b = selected !== null ? fits.breakers[selected] : null;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 max-w-[640px]">
        <label htmlFor="fits-q" className={labelCls}>
          {c.searchLabel}
        </label>
        <div className="flex gap-2">
          <input
            id="fits-q"
            type="search"
            inputMode="search"
            autoComplete="off"
            spellCheck={false}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && found?.hits.length) {
                e.preventDefault();
                onPick(found.hits[0]);
                setQ('');
              }
            }}
            placeholder={c.searchPlaceholder}
            aria-controls="fits-results"
            className={inputCls}
          />
        </div>
      </div>

      {found && (
        <div id="fits-results" className="flex flex-col gap-2">
          <p role="status" className="font-sans text-sm text-ink-mid m-0">
            {found.hits.length === 0
              ? c.noResults
              : found.rewritten
                ? fill(c.rewritten, { q: dq.trim(), r: found.rewritten })
                : null}
          </p>
          {found.hits.length > 0 && (
            <ul aria-label={c.resultsLabel} className="list-none m-0 p-0 flex flex-wrap gap-2">
              {found.hits.slice(0, MAX_RESULTS).map((i) => {
                const x = fits.breakers[i];
                return (
                  <li key={x.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        onPick(i);
                        setQ('');
                      }}
                      className={`${chipCls} border-hair-strong text-ink hover:border-brand text-left`}
                    >
                      <span className="text-ink-mid">{x.brand}</span> {x.model}
                      <span className="text-ink-soft">
                        {' '}
                        · {[...new Set(x.families.map((f) => `Ø${fits.families[f].d}`))].join(', ')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {found.hits.length > MAX_RESULTS && (
            <p className="font-sans text-sm text-ink-soft m-0">
              {fill(c.more, { n: found.hits.length - MAX_RESULTS })}
            </p>
          )}
        </div>
      )}

      {b ? (
        <section aria-labelledby="fits-sel" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2
              id="fits-sel"
              ref={resultRef}
              tabIndex={-1}
              className="font-sans text-xl md:text-2xl font-semibold text-ink m-0 scroll-mt-32 outline-none"
            >
              {b.families.length > 1
                ? fill(c.tipsMany, { name: b.name, n: b.families.length })
                : fill(c.tipsOne, { name: b.name })}
            </h2>
            <button
              type="button"
              onClick={onClear}
              className={`font-sans text-sm text-ink-mid hover:text-ink underline underline-offset-4 ${focusRing}`}
            >
              {c.clear}
            </button>
          </div>
          {b.families.map((fi) => (
            <FamilyCard
              key={fits.families[fi].code}
              t={t}
              fits={fits}
              fam={fits.families[fi]}
              current={selected}
              onPick={onPick}
            />
          ))}
        </section>
      ) : (
        !found && <p className="font-sans text-ink-mid m-0">{c.pickHint}</p>
      )}
    </div>
  );
}

function TipView({
  t,
  fits,
  d,
  onDiameter,
  onPick,
  resultRef,
}: {
  t: DictBlock;
  fits: FitsIndex;
  d: number | null;
  onDiameter: (d: number) => void;
  onPick: (i: number) => void;
  resultRef: React.RefObject<HTMLHeadingElement>;
}) {
  const c = t.fitsUi;
  const [f, setF] = useState('');
  const df = useDeferredValue(f);
  const sizes = useMemo(() => {
    const by = new Map<number, Set<number>>();
    for (const x of fits.families) {
      const s = by.get(x.d) ?? new Set<number>();
      for (const i of x.breakers) s.add(i);
      by.set(x.d, s);
    }
    return [...by].map(([dd, s]) => ({ d: dd, n: s.size })).sort((a, b) => a.d - b.d);
  }, [fits]);

  // A typed code ("KU135-21", "135-2") lists matching families; a bare number narrows the sizes.
  const typed = fold(df);
  const byCode = /[a-z]/.test(typed) || /-/.test(df);
  const shownSizes = !typed || byCode ? sizes : sizes.filter((s) => String(s.d).startsWith(typed));
  const families: FitsFamily[] = byCode
    ? fits.families.filter((x) => fold(x.code).includes(typed))
    : d !== null
      ? fits.families.filter((x) => x.d === d)
      : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 max-w-[420px]">
        <label htmlFor="fits-tip" className={labelCls}>
          {c.tipFilterLabel}
        </label>
        <input
          id="fits-tip"
          type="search"
          autoComplete="off"
          spellCheck={false}
          value={f}
          onChange={(e) => setF(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !byCode && shownSizes.length === 1) {
              e.preventDefault();
              onDiameter(shownSizes[0].d);
            }
          }}
          placeholder={c.tipFilterPlaceholder}
          className={inputCls}
        />
      </div>
      {!byCode && (
        <div className="flex flex-col gap-2">
          <span className={labelCls} id="fits-sizes">
            {c.diameterLabel}
          </span>
          <ul aria-labelledby="fits-sizes" className="list-none m-0 p-0 flex flex-wrap gap-2">
            {shownSizes.map((s) => (
              <li key={s.d}>
                <button
                  type="button"
                  aria-pressed={d === s.d}
                  onClick={() => onDiameter(s.d)}
                  className={`${chipCls} ${
                    d === s.d
                      ? 'bg-brand text-on-brand rounded-[2px] font-semibold border-brand'
                      : 'border-hair-strong text-ink hover:border-ink-mid'
                  }`}
                >
                  Ø{s.d}
                  <span className={d === s.d ? '' : 'text-ink-soft'}>
                    {' '}
                    · {fill(c.breakersCount, { n: s.n })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {byCode || d !== null ? (
        <section aria-labelledby="fits-size" className="flex flex-col gap-4">
          <h2
            id="fits-size"
            ref={resultRef}
            tabIndex={-1}
            className="font-sans text-xl md:text-2xl font-semibold text-ink m-0 scroll-mt-32 outline-none"
          >
            {byCode ? df.trim().toLocaleUpperCase('tr') : fill(c.sizeLabel, { d: d! })}
          </h2>
          {families.length === 0 && <p className="font-sans text-ink-mid m-0">{c.noFamilies}</p>}
          {families.map((x) => (
            <FamilyCard key={x.code} t={t} fits={fits} fam={x} current={null} onPick={onPick} />
          ))}
        </section>
      ) : (
        <p className="font-sans text-ink-mid m-0">{c.pickDiameter}</p>
      )}
    </div>
  );
}

function FamilyCard({
  t,
  fits,
  fam,
  current,
  onPick,
}: {
  t: DictBlock;
  fits: FitsIndex;
  fam: FitsFamily;
  /** The breaker this card is shown for (left out of the list), or null for all. */
  current: number | null;
  onPick: (i: number) => void;
}) {
  const c = t.fitsUi;
  const [open, setOpen] = useState<Set<string>>(new Set());
  const others = fam.breakers.filter((i) => i !== current);
  const groups = groupByMake(fits, others);
  // The selected breaker's own make first.
  const own = current !== null ? fits.breakers[current]?.brand : null;
  if (own) groups.sort((a, b) => Number(b.brand === own) - Number(a.brand === own));
  const specs = [
    fam.collarMm !== null ? fill(c.collar, { v: mm(fam.collarMm) }) : null,
    fam.keyCount !== null ? fill(c.keys, { n: fam.keyCount }) : null,
    fam.keyMm !== null ? fill(c.keyThk, { v: mm(fam.keyMm) }) : null,
    fam.slotMm !== null ? fill(c.slot, { v: mm(fam.slotMm) }) : null,
    fam.rearStep === true ? c.rearStep : fam.rearStep === false ? c.rearPlain : null,
  ].filter(Boolean);
  return (
    <article className="border border-hair-strong rounded-md bg-bg-soft p-4 md:p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-sans text-lg font-semibold text-ink m-0">
          {fill(c.sizeLabel, { d: mm(fam.d) })}{' '}
          <span className="text-ink-mid font-normal">· {fam.code}</span>
        </h3>
        {specs.length > 0 && (
          <p className="font-sans text-sm text-ink-mid m-0">{specs.join(' · ')}</p>
        )}
        <p className="font-sans text-sm text-ink-soft m-0">
          {fam.types.map((x) => c.tipTypes[x]).join(', ')}
        </p>
      </div>
      <p className="font-sans text-sm font-medium text-ink m-0">
        {others.length === 0
          ? c.noOthers
          : current !== null
            ? fill(c.sameTip, { n: others.length, m: groups.length })
            : fill(c.familyCount, { n: others.length, m: groups.length })}
      </p>
      {groups.length > 0 && (
        <div className="flex flex-col gap-3">
          {groups.map((g) => {
            const all = open.has(g.brand) || g.ids.length <= MAKE_CAP;
            const shown = all ? g.ids : g.ids.slice(0, MAKE_CAP);
            return (
              <div key={g.brand} className="flex flex-col gap-2">
                <h4 className="font-sans text-sm font-medium text-ink-mid m-0">
                  {g.brand} <span className="text-ink-soft">({g.ids.length})</span>
                </h4>
                <ul className="list-none m-0 p-0 flex flex-wrap gap-2">
                  {shown.map((i) => {
                    const x = fits.breakers[i];
                    return (
                      <li key={x.slug}>
                        <button
                          type="button"
                          onClick={() => onPick(i)}
                          aria-label={fill(c.openBreaker, { name: x.name })}
                          className={`${chipCls} border-hair text-ink hover:border-brand bg-bg`}
                        >
                          {x.model}
                        </button>
                      </li>
                    );
                  })}
                  {!all && (
                    <li>
                      <button
                        type="button"
                        onClick={() => setOpen((s) => new Set(s).add(g.brand))}
                        className={`${chipCls} border-hair-strong text-ink-mid hover:text-ink`}
                      >
                        {fill(c.showAll, { n: g.ids.length })}
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
