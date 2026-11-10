import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Button } from '@astryxdesign/core/Button';
import { useCombobox } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import type { Dict } from '../lib/dict';
import {
  exactHit,
  findModels,
  MODEL_INDEX_PATH,
  prepareSearch,
  type FinderHit,
  type FinderMake,
  type MakeModels,
  type ModelRef,
} from '../lib/finder';
import { localePath } from '../lib/locale-path';
import { breakerPath, LIST_PATH } from '../lib/routes';
import { useFitPlaceholder, useKeepTyped } from '../lib/use-field';
import type { Lang } from '../types';
import { FIELD_TEXT, FOCUS_INSET, WHATSAPP_BUTTON, whatsappHref } from './Layout';

/**
 * The make/model search box, in the header of every page (and in the home's breaker panel on
 * small screens). Typing lists the models it finds under the box, matched like the tip search
 * (`findModels`); each row goes to that model's page, which lists its tip and the parts we make
 * for it. "Ara" (Enter) opens the model the query names, or its only hit: on the home in the
 * "Kırıcınızı seçin" panel (`FinderPick`), as the make and model chips there do, elsewhere its
 * page. Typing alone never opens a model. The home has the finder data in its page props; the
 * other pages fetch the names only (`MODEL_INDEX_PATH`) the first time the box is used. Without JS
 * (or without a hit) the form sends `?q=` to the tip list, whose search suggests a spelling and
 * offers "model not listed".
 */

/** Model rows under the box before "n models →". */
const ROWS = 8;

/** Where a pick was made: the header box (far from the panel: the focus moves to the panel too),
 *  the panel's own box (the focus and the phone's keyboard stay in it), or the page's chips and
 *  rows. */
export type PickFrom = 'header' | 'box' | 'page';

/** Home: the breaker shown in the panel, set by the header search, the panel's own box and the
 *  chips. `shown.n` counts picks that should bring the panel into view, `shown.from` says where
 *  the last one came from; `shown.top`: where the panel's box was on screen (a pick from it). */
interface Pick {
  sel: FinderHit | null;
  select: (hit: FinderHit | null, from?: PickFrom, top?: number) => void;
  shown: { n: number; from: PickFrom; top?: number };
}
export const FinderPick = createContext<Pick | null>(null);

export function FinderPickProvider({ children }: { children: ReactNode }) {
  const [sel, setSel] = useState<FinderHit | null>(null);
  const [shown, setShown] = useState<Pick['shown']>({ n: 0, from: 'page' });
  const value = useMemo<Pick>(
    () => ({
      sel,
      shown,
      select: (hit, from, top) => {
        setSel(hit);
        if (hit && from) setShown((x) => ({ n: x.n + 1, from, top }));
      },
    }),
    [sel, shown],
  );
  return <FinderPick.Provider value={value}>{children}</FinderPick.Provider>;
}

type Index = readonly MakeModels<ModelRef>[];
let indexReq: Promise<Index> | null = null;
/** The names-only index, fetched once per page (a failure is retried on the next use). */
const loadIndex = (): Promise<Index> =>
  (indexReq ??= fetch(MODEL_INDEX_PATH)
    .then((r) => (r.ok ? (r.json() as Promise<Index>) : Promise.reject(new Error(`${r.status}`))))
    .catch((e: unknown) => {
      indexReq = null;
      throw e;
    }));

export function BreakerSearch({
  lang,
  t,
  id,
  finder,
  fromUrl = false,
  panel = false,
  className = '',
}: {
  lang: Lang;
  t: Dict;
  /** The input's id (one per box on the page). */
  id: string;
  /** Home: every make with its models and tips; picks fill the panel. */
  finder?: readonly FinderMake[];
  /** Home header: `?q=` naming one model exactly opens it on load. */
  fromUrl?: boolean;
  /** The home panel's own box (below 1024 px): a plain form (the header box is the page's
   *  search landmark), and the focus stays in it after a pick. */
  panel?: boolean;
  className?: string;
}) {
  const ctx = useContext(FinderPick);
  const home = finder && ctx ? ctx : null;
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<Index | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const data: Index | null = finder ?? index;
  const query = q.trim();
  const found = useMemo(() => (data && query ? findModels(data, query) : null), [data, query]);
  const listId = `${id}-models`;

  /** The full finder entry of a hit (home), for the panel. */
  const full = (h: FinderHit<ModelRef>): FinderHit | null => {
    const m = finder?.find((x) => x.brand === h.brand)?.models.find((x) => x.slug === h.model.slug);
    return m ? { brand: h.brand, model: m, name: h.name } : null;
  };

  const placeholder = useFitPlaceholder(input, [
    t.search.placeholder,
    t.search.placeholderMid,
    t.search.placeholderShort,
  ]);

  useEffect(() => {
    if (!fromUrl || !finder || !home) return;
    const v = new URLSearchParams(window.location.search).get('q');
    if (!v) return;
    setQ(v);
    const r = findModels(finder, v);
    // Only a query that names one model exactly opens it, never a corrected guess.
    home.select(r.guess ? null : exactHit(r.hits, v));
    // Only on load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = () => {
    if (!finder && !index) loadIndex().then(setIndex, () => undefined);
  };
  // The search text of every model is worked out once the box is in use, not on the first key,
  // and after the focus has painted (a long task in the tap's effects would delay it).
  useEffect(() => {
    if (!open || !data) return;
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => prepareSearch(data), { timeout: 300 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => prepareSearch(data), 0);
    return () => window.clearTimeout(id);
  }, [open, data]);
  const hits = useMemo(() => (found ? found.hits.slice(0, ROWS) : []), [found]);
  const options = useMemo(() => hits.map((h) => ({ value: h.model.slug })), [hits]);
  // Focus stays in the box: the arrows move a highlight over the rows (`aria-activedescendant`).
  // Enter with a highlight follows that row's link; without one it is the form's submit.
  const combo = useCombobox({
    selectableItems: options,
    isOpen: open && found !== null,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    onSelect: (slug) => {
      const i = options.findIndex((o) => o.value === slug);
      list.current?.querySelectorAll('a')[i]?.click();
    },
    listboxId: listId,
  });
  const close = () => {
    setOpen(false);
    combo.setHighlightedIndex(-1);
  };
  // Typing only lists models: a model whose name is still being typed ("Furukawa F 2" on the way
  // to "F22") must not open (owner, 2026-10-22: never a wrong breaker). So a new query also drops
  // the highlight: Enter is the submit again, which opens only an exact or single match.
  const onType = (v: string) => {
    setQ(v);
    setOpen(true);
    combo.setHighlightedIndex(-1);
    load();
  };
  useKeepTyped(input, onType);
  const pick = (h: FinderHit<ModelRef>) => {
    setQ(h.name);
    close();
    // The panel's box stays where it is on screen (the chips above it change), with the keyboard.
    if (panel) home?.select(full(h), 'box', input.current?.getBoundingClientRect().top);
    else home?.select(full(h), 'header');
  };
  const submit = (e: FormEvent) => {
    // Nothing found (or the index not here): the tip list's search takes over.
    if (!found?.hits.length) return;
    e.preventDefault();
    // "Ara" opens the model the query names, or the only one it finds; a corrected guess or
    // several hits stay listed to pick from (owner, 2026-10-22: never open a wrong breaker).
    const one = found.guess
      ? null
      : (exactHit(found.hits, query) ?? (found.hits.length === 1 ? found.hits[0] : null));
    if (!one) setOpen(true);
    else if (home) pick(one);
    else window.location.assign(localePath(breakerPath(one.model.slug), lang));
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    // Focus first: the input's focus handler opens the list.
    input.current?.focus();
    close();
  };
  // Closes when the focus moves on to something else (Tab) or a press lands outside the form; a
  // tap on a row must not close the list before its click (Safari does not focus links).
  const onBlur = (e: FocusEvent) => {
    const to = e.relatedTarget as Node | null;
    if (to && !e.currentTarget.contains(to)) close();
  };
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!form.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
    // `close` only sets state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /** A row is a real link and its own click navigates: the hook's press handler would click it
   *  again through `onSelect`. Only the row's identity is taken: the hook's hover highlight would
   *  let a resting mouse decide what Enter opens. */
  const rowProps = (i: number) => {
    const { id: rowId, role, 'aria-selected': selected } = combo.getOptionProps(i);
    return { id: rowId, role, 'aria-selected': selected };
  };
  const status = found
    ? found.hits.length
      ? found.guess
        ? t.search.didYouMean(found.guess)
        : `${t.home.finder.found}: ${t.search.count(found.hits.length)}`
      : t.search.none(query)
    : '';

  return (
    <form
      ref={form}
      action={localePath(LIST_PATH, lang)}
      method="get"
      role={panel ? undefined : 'search'}
      aria-label={panel ? undefined : t.search.label}
      onSubmit={submit}
      onKeyDown={onKey}
      onBlur={onBlur}
      className={`relative flex min-w-0 font-sans ${className}`}
    >
      <TextInput
        ref={input}
        id={id}
        htmlName="q"
        type="search"
        label={t.home.finder.title}
        isLabelHidden
        size="lg"
        value={q}
        onChange={(v) => onType(v)}
        onFocus={() => {
          load();
          setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        startIcon={
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="pointer-events-none hidden size-[18px] text-ink-soft md:block"
          >
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        }
        {...combo.getFieldProps()}
        containerClassName="min-w-0 flex-1"
        controlClassName={`rounded-r-none border-r-0 pl-3 pr-2.5 md:pl-3.5 [&_input]:placeholder:text-sm max-[374px]:[&_input]:placeholder:text-[12.5px] lg:[&_input]:placeholder:text-[13.5px] xl:[&_input]:placeholder:text-[15px] ${FIELD_TEXT}`}
      />
      <Button
        type="submit"
        label={t.search.button}
        variant="primary"
        size="lg"
        className="shrink-0 rounded-l-none px-4 text-[15px] font-semibold md:px-6 lg:px-4 min-[73.75rem]:px-6"
      />
      <p className="sr-only" aria-live="polite">
        {open && found ? status : ''}
      </p>
      {open && found && (
        <div className="absolute inset-x-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-sm border border-hair-strong bg-bg shadow-[0_6px_18px_rgb(0_0_0/0.12)]">
          <p className="m-0 px-3.5 pb-1.5 pt-2.5 text-[13px] font-semibold text-ink-mid">
            {status}
          </p>
          {hits.length > 0 && (
            <ul
              ref={list}
              {...combo.getListboxProps()}
              aria-label={t.home.finder.title}
              className="m-0 list-none p-0"
            >
              {hits.map((h, i) => (
                <li key={h.model.slug} role="presentation" className="border-t border-hair">
                  <a
                    {...rowProps(i)}
                    href={localePath(breakerPath(h.model.slug), lang)}
                    tabIndex={-1}
                    className="flex min-h-[46px] items-center justify-between gap-3 px-3.5 text-[15px] text-ink hover:bg-bg-soft aria-selected:bg-bg-soft aria-selected:outline aria-selected:outline-2 aria-selected:-outline-offset-2 aria-selected:outline-brand"
                  >
                    <span className="font-semibold">{h.name}</span>
                    <span className="whitespace-nowrap text-[13.5px] font-medium text-brand-hi">
                      {t.home.finder.breakerPage} →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {found.hits.length > hits.length && (
            <a
              href={`${localePath(LIST_PATH, lang)}?q=${encodeURIComponent(query)}`}
              className={`block border-t border-hair px-3.5 py-2.5 text-sm font-medium text-brand-hi hover:underline ${FOCUS_INSET}`}
            >
              {t.search.count(found.hits.length)} →
            </a>
          )}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-hair bg-bg-soft px-3.5 py-2.5 text-[13.5px] text-ink">
            <span>{t.missing.title}</span>
            <Button
              href={whatsappHref(t.missing.textFor(query))}
              label={t.missing.button}
              className={`px-3 text-[13.5px] ${WHATSAPP_BUTTON}`}
            />
          </div>
        </div>
      )}
    </form>
  );
}
