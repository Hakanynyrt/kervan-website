import { useEffect, useId, useMemo, useState } from 'react';
import { clipQuery, findModels, type FinderHit, type ModelRef } from '../lib/finder';
import { localePath } from '../lib/locale-path';
import { breakerPath } from '../lib/routes';
import type { Lang } from '../types';
import type { AppDict } from './dict';
import { Icon } from './icons';
import { loadModelIndex, type ModelIndex } from './model-index';
import { FIELD, FOCUS, ROW, BUTTON_SECONDARY } from './ui';

/** Rows shown under the box before "n more". */
const ROWS = 12;

/**
 * The make/model search of Start and Makinelerim, over the site's names-only model index and
 * the shop's own matching (`findModels`: make spellings, a misspelt make fixed). On Start a row
 * opens the model's page (a link, so the router opens it); on Makinelerim it adds the model.
 */
export function ModelFinder({
  lang,
  d,
  label,
  onAdd,
  saved,
}: {
  lang: Lang;
  d: AppDict;
  /** The box's visible label. */
  label: string;
  /** Makinelerim: the rows add the model (with its page path and name) instead of opening it. */
  onAdd?: (hit: { path: string; name: string }) => void;
  /** Makinelerim: the paths already saved (their rows read "Eklendi"). */
  saved?: ReadonlySet<string>;
}) {
  const id = useId();
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<ModelIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadModelIndex().then(
      (v) => live && setIndex(v),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [tries]);
  const text = q.trim();
  const found = useMemo(() => (index && text ? findModels(index, text) : null), [index, text]);
  const hits: FinderHit<ModelRef>[] = found?.hits ?? [];
  const status = failed ? d.finder.failed : found && !hits.length ? d.finder.none : '';
  return (
    <div className="font-sans">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type="search"
        inputMode="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="search"
        value={q}
        placeholder={d.finder.placeholder}
        onChange={(e) => setQ(clipQuery(e.target.value))}
        aria-describedby={`${id}-status`}
        className={FIELD}
      />
      <p id={`${id}-status`} role="status" className="m-0 mt-2 text-sm text-ink-mid empty:hidden">
        {status}
      </p>
      {failed && (
        <button
          type="button"
          onClick={() => setTries((n) => n + 1)}
          className={`mt-2 ${BUTTON_SECONDARY}`}
        >
          {d.finder.retry}
        </button>
      )}
      {hits.length > 0 && (
        <ul className="m-0 mt-2 list-none border-t border-hair p-0">
          {hits.slice(0, ROWS).map((h) => {
            const path = breakerPath(h.model.slug);
            if (!onAdd)
              return (
                <li key={h.model.slug}>
                  <a href={localePath(path, lang)} className={ROW}>
                    <span className="min-w-0 break-words">{h.name}</span>
                    <Icon name="chevron" className="size-5 shrink-0 text-ink-soft" />
                  </a>
                </li>
              );
            const has = saved?.has(path) ?? false;
            return (
              <li
                key={h.model.slug}
                className="flex min-h-11 items-center justify-between gap-3 border-b border-hair py-1"
              >
                <span className="min-w-0 break-words text-base text-ink">{h.name}</span>
                <button
                  type="button"
                  disabled={has}
                  aria-label={has ? undefined : d.finder.addLabel(h.name)}
                  onClick={() => onAdd({ path, name: h.name })}
                  className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-sm px-3 text-sm font-semibold ${has ? 'text-ink-mid' : 'text-brand-hi hover:text-ink'} ${FOCUS}`}
                >
                  {has ? d.finder.added : d.finder.add}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {hits.length > ROWS && (
        <p className="m-0 mt-2 text-sm text-ink-mid">{d.finder.more(hits.length - ROWS)}</p>
      )}
    </div>
  );
}
