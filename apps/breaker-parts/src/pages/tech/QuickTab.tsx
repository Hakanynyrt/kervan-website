import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { FitsIndex } from '@kervan/tips';
import type { DictBlock, Lang } from '../../types';
import type { CatalogStatus } from '../../lib/use-vega-catalog';
import type { Quote } from '../../lib/quote';
import { type SamePartsGroup, searchParts } from '../../lib/same-parts';
import { classifyQuery } from '../../lib/quick-query';
import { RECENT_KEY, STAR_KEY, pushRecent, readList, writeList } from '../../lib/tech-recent';
import { FamilyCard, PartHitList, SameParts } from './FitsTab';

/** Hash of this tab: "#ara", "#ara/q/<query>", "#ara/k/<breaker slug>". */
export const QUICK_HASH = '#ara';

type State = { q: string; slug: string | null };

function parseHash(h: string): State {
  const rest = h.startsWith(QUICK_HASH) ? h.slice(QUICK_HASH.length) : '';
  const m = /^\/(q|k)\/(.+)$/.exec(rest);
  if (!m) return { q: '', slug: null };
  let v = m[2];
  try {
    v = decodeURIComponent(v);
  } catch {
    /* hand-typed hash */
  }
  return m[1] === 'k' ? { q: '', slug: v } : { q: v, slug: null };
}

const toHash = (s: State): string =>
  s.slug
    ? `${QUICK_HASH}/k/${encodeURIComponent(s.slug)}`
    : s.q
      ? `${QUICK_HASH}/q/${encodeURIComponent(s.q)}`
      : QUICK_HASH;

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';
const inputCls = `w-full min-h-12 bg-bg-soft border border-ink-soft rounded-md px-3 font-sans text-lg text-ink placeholder:text-ink-mid ${focusRing}`;
const labelCls = 'font-sans text-sm font-medium text-ink-mid';
const chipCls = `min-h-10 px-3 rounded-md border font-sans text-sm transition-colors ${focusRing}`;
const fill = (tpl: string, vars: Record<string, string | number>): string =>
  Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), tpl);
const MAX_HITS = 24;
const MAX_FAMILIES = 6;

interface Props {
  t: DictBlock;
  lang: Lang;
  status: CatalogStatus;
  fits: FitsIndex | null;
  parts: SamePartsGroup[];
  quote: Quote | null;
  retry: () => void;
  /** Opens the tip catalogue with this text in its search box. */
  onCatalog: (text: string) => void;
}

/**
 * "Hızlı Cevap": one box for a phone call. A breaker, a Kervan tip code, a working diameter or a
 * part word; the answer card brings the tip families (with the owner's quote lines and the
 * customer message), the same-parts list and a jump to the tip catalogue together.
 */
export default function QuickTab({ t, lang, status, fits, parts, quote, retry, onCatalog }: Props) {
  const c = t.quickUi;
  if (status !== 'ready' || !fits) {
    const failed = status === 'error' || status === 'empty' || status === 'not_configured';
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="font-sans text-ink-mid m-0">
          {failed ? t.fitsUi.errorGeneric : t.fitsUi.loading}
        </p>
        {failed && (
          <button
            type="button"
            onClick={retry}
            className={`self-start ${chipCls} border-hair-strong text-ink`}
          >
            {t.fitsUi.retry}
          </button>
        )}
      </div>
    );
  }
  return (
    <Ready t={t} lang={lang} fits={fits} parts={parts} quote={quote} onCatalog={onCatalog} c={c} />
  );
}

function Ready({
  t,
  c,
  lang,
  fits,
  parts,
  quote,
  onCatalog,
}: {
  t: DictBlock;
  c: DictBlock['quickUi'];
  lang: Lang;
  fits: FitsIndex;
  parts: SamePartsGroup[];
  quote: Quote | null;
  onCatalog: (text: string) => void;
}) {
  const [state, setState] = useState<State>(() =>
    typeof window === 'undefined' ? { q: '', slug: null } : parseHash(window.location.hash),
  );
  const [text, setText] = useState(state.q);
  const inputRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const on = () => {
      const s = parseHash(window.location.hash);
      setState(s);
      if (!s.slug) setText(s.q);
    };
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);

  const bySlug = useMemo(() => new Map(fits.breakers.map((b, i) => [b.slug, i])), [fits]);
  const dq = useDeferredValue(text);
  const query = useMemo(() => classifyQuery(dq, fits), [dq, fits]);
  const partHits = useMemo(() => searchParts(dq, parts, lang), [dq, parts, lang]);

  // The breaker the answer card is for: a picked chip, or an exact / single hit while typing.
  const picked = state.slug !== null ? (bySlug.get(state.slug) ?? null) : null;
  const sel = picked ?? (query.kind === 'breaker' ? query.exact : null);
  const b = sel !== null ? fits.breakers[sel] : null;

  useEffect(() => {
    if (!b) return;
    const next = pushRecent(readList(RECENT_KEY), b.slug);
    writeList(RECENT_KEY, next);
  }, [b]);

  const type = (v: string) => {
    setText(v);
    const s = { q: v, slug: null };
    setState(s);
    // Typing replaces the history entry; a pick pushes one, so "back" returns to the list.
    window.history.replaceState(null, '', toHash(s));
  };
  const pick = (i: number) => {
    const s = { q: text, slug: fits.breakers[i].slug };
    setState(s);
    window.history.pushState(null, '', toHash(s));
    requestAnimationFrame(() => {
      answerRef.current?.focus();
      answerRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  };
  const clear = () => {
    type('');
    inputRef.current?.focus();
  };

  const shortList = (slugs: string[], label: string) => {
    const ids = slugs.map((s) => bySlug.get(s)).filter((i): i is number => i !== undefined);
    if (!ids.length) return null;
    return (
      <div className="flex flex-col gap-2">
        <h2 className={`${labelCls} m-0`}>{label}</h2>
        <ul className="list-none m-0 p-0 flex flex-wrap gap-2">
          {ids.map((i) => (
            <li key={fits.breakers[i].slug}>
              <button
                type="button"
                onClick={() => pick(i)}
                className={`${chipCls} border-hair-strong text-ink hover:border-brand`}
              >
                {fits.breakers[i].name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const families =
    query.kind === 'code' || query.kind === 'size' ? query.families.slice(0, MAX_FAMILIES) : [];
  const hits = query.kind === 'breaker' && !b ? query.hits : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 max-w-[720px]">
        <label htmlFor="quick-q" className="font-sans text-xl md:text-2xl font-semibold text-ink">
          {c.title}
        </label>
        <p className="hidden md:block font-sans text-sm text-ink-mid m-0">{c.sub}</p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id="quick-q"
            type="search"
            inputMode="search"
            autoFocus={state.slug === null}
            autoComplete="off"
            spellCheck={false}
            value={text}
            onChange={(e) => type(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.kind === 'breaker' && query.hits.length && !b) {
                e.preventDefault();
                pick(query.hits[0]);
              }
            }}
            placeholder={c.placeholder}
            className={inputCls}
          />
          {(text || b) && (
            <button
              type="button"
              onClick={clear}
              className={`${chipCls} min-h-12 border-hair-strong text-ink-mid hover:text-ink`}
            >
              {c.clear}
            </button>
          )}
        </div>
      </div>

      {query.kind === 'empty' && !b && (
        <>
          {shortList(readList(STAR_KEY), t.fitsUi.starredList)}
          {shortList(readList(RECENT_KEY), t.fitsUi.recentList)}
          <p className="font-sans text-ink-mid m-0">{c.hint}</p>
        </>
      )}

      {query.kind === 'breaker' && query.rewritten && (
        <p role="status" className="font-sans text-sm text-ink-mid m-0">
          {fill(t.fitsUi.rewritten, { q: dq.trim(), r: query.rewritten })}
        </p>
      )}

      {hits.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className={`${labelCls} m-0`}>{fill(c.breakersFound, { n: hits.length })}</h2>
          <ul className="list-none m-0 p-0 flex flex-wrap gap-2">
            {hits.slice(0, MAX_HITS).map((i) => {
              const x = fits.breakers[i];
              return (
                <li key={x.slug}>
                  <button
                    type="button"
                    onClick={() => pick(i)}
                    className={`${chipCls} border-hair-strong text-ink hover:border-brand text-left`}
                  >
                    <span className="text-ink-mid">{x.brand}</span> {x.model}
                  </button>
                </li>
              );
            })}
          </ul>
          {hits.length > MAX_HITS && (
            <p className="font-sans text-sm text-ink-soft m-0">
              {fill(t.fitsUi.more, { n: hits.length - MAX_HITS })}
            </p>
          )}
        </div>
      )}

      {b && sel !== null && (
        <section aria-labelledby="quick-answer" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2
              id="quick-answer"
              ref={answerRef}
              tabIndex={-1}
              className="font-sans text-xl md:text-2xl font-semibold text-ink m-0 scroll-mt-32 outline-none"
            >
              {b.name}
            </h2>
            <button
              type="button"
              onClick={() => onCatalog(b.name)}
              className={`font-sans text-sm text-ink underline underline-offset-4 hover:text-brand ${focusRing}`}
            >
              {c.inCatalog}
            </button>
          </div>
          <SameParts t={t} fits={fits} parts={parts} lang={lang} name={b.name} onPick={pick} />
          {b.families.map((fi) => (
            <FamilyCard
              key={fits.families[fi].code}
              t={t}
              fits={fits}
              fam={fits.families[fi]}
              current={sel}
              onPick={pick}
              lang={lang}
              quote={quote}
            />
          ))}
        </section>
      )}

      {families.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-sans text-xl font-semibold text-ink m-0">
            {query.kind === 'size'
              ? fill(c.sizeTitle, { d: query.d })
              : fill(c.codeTitle, { q: dq.trim().toLocaleUpperCase('tr') })}
          </h2>
          {families.map((fi) => (
            <FamilyCard
              key={fits.families[fi].code}
              t={t}
              fits={fits}
              fam={fits.families[fi]}
              current={null}
              onPick={pick}
            />
          ))}
          {(query.kind === 'code' || query.kind === 'size') &&
            query.families.length > MAX_FAMILIES && (
              <p className="font-sans text-sm text-ink-soft m-0">
                {fill(t.fitsUi.more, { n: query.families.length - MAX_FAMILIES })}
              </p>
            )}
        </section>
      )}

      {query.kind !== 'empty' && partHits.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-sans text-xl font-semibold text-ink m-0">{c.partsTitle}</h2>
          <PartHitList t={t} fits={fits} hits={partHits} onPick={pick} />
        </section>
      )}

      {query.kind !== 'empty' &&
        !b &&
        hits.length === 0 &&
        families.length === 0 &&
        partHits.length === 0 && (
          <div className="flex flex-col gap-2">
            <p role="status" className="font-sans text-ink m-0">
              {c.noResults}
            </p>
            <button
              type="button"
              onClick={() => onCatalog(dq.trim())}
              className={`self-start font-sans text-sm text-ink underline underline-offset-4 hover:text-brand ${focusRing}`}
            >
              {fill(c.searchCatalog, { q: dq.trim() })}
            </button>
          </div>
        )}
    </div>
  );
}
