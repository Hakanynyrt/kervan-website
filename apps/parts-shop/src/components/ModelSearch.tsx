import { useEffect, useState } from 'react';
import type { Dict } from '../lib/dict';
import { fmtNum } from '../lib/format';
import { localePath } from '../lib/locale-path';
import { LIST_PATH, type BrandLink, type BreakerCard } from '../lib/routes';
import type { Lang } from '../types';
import { FOCUS } from './Layout';

/** "HB-20 G" and "hb20g" match: lower case, letters and digits only. */
const squash = (s: string): string => s.toLocaleLowerCase('tr').replace(/[^\p{L}\d]+/gu, '');

/** Every word of the query must appear in "brand model" (spaces and dashes ignored). */
export function matches(q: string, name: string): boolean {
  const n = squash(name);
  return q
    .split(/\s+/)
    .map(squash)
    .filter(Boolean)
    .every((w) => n.includes(w));
}

/** Search box that sends the visitor to the full list with `?q=` (home page, brand pages). */
export function SearchForm({ lang, t, value = '' }: { lang: Lang; t: Dict; value?: string }) {
  return (
    <form action={localePath(LIST_PATH, lang)} method="get" role="search" className="flex gap-2">
      <label className="sr-only" htmlFor="q">
        {t.search.label}
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={value}
        placeholder={t.search.placeholder}
        autoComplete="off"
        className={`min-w-0 flex-1 rounded-sm border border-ink-soft bg-bg px-4 py-3 font-sans text-base text-ink placeholder:text-ink-soft ${FOCUS}`}
      />
      <button
        type="submit"
        className={`rounded-sm bg-brand px-5 py-3 font-sans text-sm font-medium text-white hover:bg-brand-hi ${FOCUS}`}
      >
        {t.search.button}
      </button>
    </form>
  );
}

export function BrandChips({
  brands,
  current,
  lang,
  t,
}: {
  brands: BrandLink[];
  current?: string;
  lang: Lang;
  t: Dict;
}) {
  return (
    <nav aria-label={t.search.brands} className="font-sans text-sm">
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        <li>
          <a
            href={localePath(LIST_PATH, lang)}
            aria-current={current ? undefined : 'page'}
            className={`inline-block rounded-sm border px-3 py-1.5 ${current ? 'border-hair bg-bg text-ink hover:border-hair-strong' : 'border-brand bg-brand text-white'} ${FOCUS}`}
          >
            {t.search.all}
          </a>
        </li>
        {brands.map((b) => (
          <li key={b.path}>
            <a
              href={localePath(b.path, lang)}
              aria-current={b.name === current ? 'page' : undefined}
              className={`inline-block rounded-sm border px-3 py-1.5 ${b.name === current ? 'border-brand bg-brand text-white' : 'border-hair bg-bg text-ink hover:border-hair-strong'} ${FOCUS}`}
            >
              {b.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * The breaker table with a live filter. Prerendered unfiltered; after hydration the box
 * filters as you type and picks up `?q=` from the home page's search.
 */
export function ModelTable({ rows, lang, t }: { rows: BreakerCard[]; lang: Lang; t: Dict }) {
  const [q, setQ] = useState('');
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('q');
    if (v) setQ(v);
  }, []);
  const shown = q.trim() ? rows.filter((r) => matches(q, r.name)) : rows;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="filter">
          {t.search.label}
        </label>
        <input
          id="filter"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search.placeholder}
          autoComplete="off"
          className={`min-w-0 flex-1 rounded-sm border border-ink-soft bg-bg px-4 py-3 font-sans text-base text-ink placeholder:text-ink-soft sm:max-w-md ${FOCUS}`}
        />
        <p className="m-0 font-sans text-sm text-ink-mid" aria-live="polite">
          {shown.length ? t.search.count(shown.length) : t.search.none(q.trim())}
        </p>
      </div>
      {shown.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-md border border-hair">
          <table className="w-full border-collapse font-sans text-sm tabular-nums">
            <thead className="bg-bg-soft text-left text-ink-mid">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  {t.list.model}
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  {t.list.diameter}
                </th>
                <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">
                  {t.list.types}
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.slug} className="border-t border-hair">
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    <a
                      href={localePath(r.path, lang)}
                      className={`text-brand-hi underline decoration-hair-strong underline-offset-4 hover:decoration-brand ${FOCUS}`}
                    >
                      {r.name}
                    </a>
                  </th>
                  <td className="px-4 py-3 text-ink">Ø{fmtNum(r.diameterMm, lang)} mm</td>
                  <td className="hidden px-4 py-3 text-ink sm:table-cell">
                    {r.types.map((x) => t.tip[x]).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
