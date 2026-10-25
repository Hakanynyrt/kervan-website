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
import type { Lang } from '../types';
import { FOCUS, FOCUS_INSET, whatsappHref } from './Layout';

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

/** Index of the longest example that fits the box, measured in its placeholder font (the last one
 *  when none does). */
function fitPlaceholder(
  el: HTMLInputElement,
  ctx: CanvasRenderingContext2D,
  examples: readonly string[],
): number {
  const box = getComputedStyle(el);
  let font = box;
  try {
    font = getComputedStyle(el, '::placeholder');
  } catch {
    /* no placeholder style: the box's own font, a little larger, errs on the short side */
  }
  ctx.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
  const room = el.clientWidth - parseFloat(box.paddingLeft) - parseFloat(box.paddingRight) - 2;
  const i = examples.findIndex((s) => ctx.measureText(s).width <= room);
  return i < 0 ? examples.length - 1 : i;
}

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
  /** The example in the box: the longest of the three that fits (`fitPlaceholder`). */
  const [ph, setPh] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const data: Index | null = finder ?? index;
  const query = q.trim();
  const found = useMemo(() => (data && query ? findModels(data, query) : null), [data, query]);
  const listId = `${id}-models`;

  /** The full finder entry of a hit (home), for the panel. */
  const full = (h: FinderHit<ModelRef>): FinderHit | null => {
    const m = finder?.find((x) => x.brand === h.brand)?.models.find((x) => x.slug === h.model.slug);
    return m ? { brand: h.brand, model: m, name: h.name } : null;
  };

  const examples = [t.search.placeholder, t.search.placeholderMid, t.search.placeholderShort];
  useEffect(() => {
    // The prerender has the long example; the box shows the longest one that fits its width, in
    // the placeholder's own font (measured again when the box or the font changes).
    const el = input.current;
    const ctx = document.createElement('canvas').getContext('2d');
    if (!el || !ctx) return;
    const fit = () => setPh(fitPlaceholder(el, ctx, examples));
    fit();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
    ro?.observe(el);
    document.fonts?.addEventListener('loadingdone', fit);
    return () => {
      ro?.disconnect();
      document.fonts?.removeEventListener('loadingdone', fit);
    };
    // The examples change with the language only (a new page).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

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
  // The search text of every model is worked out once the box is in use, not on the first key.
  useEffect(() => {
    if (open && data) prepareSearch(data);
  }, [open, data]);
  // Typing only lists models: a model whose name is still being typed ("Furukawa F 2" on the way
  // to "F22") must not open (owner, 2026-10-22: never a wrong breaker).
  const onType = (v: string) => {
    setQ(v);
    setOpen(true);
    load();
  };
  const pick = (h: FinderHit<ModelRef>) => {
    setQ(h.name);
    setOpen(false);
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
    if (e.key === 'Escape') {
      // Focus first: the input's focus handler opens the list.
      input.current?.focus();
      setOpen(false);
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const links = [...(list.current?.querySelectorAll('a') ?? [])];
    if (!links.length) return;
    e.preventDefault();
    const i = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = e.key === 'ArrowDown' ? Math.min(i + 1, links.length - 1) : i - 1;
    if (next < 0) input.current?.focus();
    else links[next].focus();
  };
  // Closes when the focus moves on to something else (Tab) or a press lands outside the form; a
  // tap on a row must not close the list before its click (Safari does not focus links).
  const onBlur = (e: FocusEvent) => {
    const to = e.relatedTarget as Node | null;
    if (to && !e.currentTarget.contains(to)) setOpen(false);
  };
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!form.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  const hits = found ? found.hits.slice(0, ROWS) : [];
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
      <label htmlFor={id} className="sr-only">
        {t.home.finder.title}
      </label>
      <span className="relative flex min-w-0 flex-1 items-center">
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute left-3.5 hidden size-[18px] text-ink-soft md:block"
        >
          <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={input}
          id={id}
          name="q"
          type="search"
          value={q}
          onChange={(e) => onType(e.target.value)}
          onFocus={() => {
            load();
            setOpen(true);
          }}
          placeholder={examples[ph]}
          autoComplete="off"
          aria-controls={open && found ? listId : undefined}
          className={`h-[46px] w-full min-w-0 rounded-l-sm border border-r-0 border-ink-soft bg-bg pl-3 pr-2.5 text-base text-ink placeholder:text-sm placeholder:text-ink-soft max-[374px]:placeholder:text-[12.5px] md:pl-[42px] lg:placeholder:text-[13.5px] xl:placeholder:text-[15px] ${FOCUS}`}
        />
      </span>
      <button
        type="submit"
        className={`h-[46px] shrink-0 rounded-r-sm bg-brand px-4 text-[15px] font-semibold text-on-brand hover:bg-brand-hi md:px-6 lg:px-4 min-[73.75rem]:px-6 ${FOCUS}`}
      >
        {t.search.button}
      </button>
      <p className="sr-only" aria-live="polite">
        {open && found ? status : ''}
      </p>
      {open && found && (
        <div
          id={listId}
          ref={list}
          className="absolute inset-x-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-sm border border-hair-strong bg-bg shadow-[0_6px_18px_rgb(0_0_0/0.12)]"
        >
          <p className="m-0 px-3.5 pb-1.5 pt-2.5 text-[13px] font-semibold text-ink-mid">
            {status}
          </p>
          {hits.length > 0 && (
            <ul className="m-0 list-none p-0">
              {hits.map((h) => (
                <li key={h.model.slug} className="border-t border-hair">
                  <a
                    href={localePath(breakerPath(h.model.slug), lang)}
                    className={`flex min-h-[46px] items-center justify-between gap-3 px-3.5 text-[15px] text-ink hover:bg-bg-soft focus:bg-bg-soft ${FOCUS_INSET}`}
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
            <a
              href={whatsappHref(t.missing.textFor(query))}
              className={`inline-flex min-h-[34px] items-center rounded-sm bg-whatsapp px-3 font-medium text-white ${FOCUS}`}
            >
              {t.missing.button}
            </a>
          </div>
        </div>
      )}
    </form>
  );
}
