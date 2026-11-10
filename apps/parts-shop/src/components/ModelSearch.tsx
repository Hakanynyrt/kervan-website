import { useEffect, useRef, useState, type RefObject } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import type { FxRate } from '@kervan/tips';
import {
  applyTipFilter,
  CARRIER_BANDS,
  EMPTY_FILTER,
  facetsOf,
  isFilterActive,
  matches,
  parseTipFilter,
  rewriteQuery,
  searchName,
  tipFilterToSearch,
  type CarrierBand,
  type TipFacets,
  type TipFilter,
  type TipType,
} from '@kervan/tips';
import type { Dict } from '../lib/dict';
import { fmtNum } from '../lib/format';
import { localePath } from '../lib/locale-path';
import { LIST_PATH, type BrandLink, type BreakerCard } from '../lib/routes';
import type { Lang } from '../types';
import { fmtTry, fmtTryCents, fmtUsd, grossTryCents, leadsGross } from '../lib/price';
import { cardHref, cardKey, cardName, cardPic } from '../lib/card';
import { replaceSearch } from '../lib/url-state';
import { useFitPlaceholder, useKeepTyped } from '../lib/use-field';
import { chipClass, MissingModel } from './Bits';
import { FIELD_RING, FIELD_TEXT, FOCUS, OUTLINE_BUTTON } from './Layout';

/** Search box that sends the visitor to the full list with `?q=` (home page, brand pages). */
export function SearchForm({ lang, t, value = '' }: { lang: Lang; t: Dict; value?: string }) {
  const [q, setQ] = useState(value);
  const box = useRef<HTMLInputElement>(null);
  useKeepTyped(box, setQ);
  const placeholder = useFitPlaceholder(box, searchExamples(t));
  return (
    <form
      action={localePath(LIST_PATH, lang)}
      method="get"
      role="search"
      className="flex gap-2 font-sans"
    >
      <TextInput
        ref={box}
        id="q"
        htmlName="q"
        type="search"
        label={t.search.label}
        isLabelHidden
        size="lg"
        value={q}
        onChange={(v) => setQ(v)}
        placeholder={placeholder}
        autoComplete="off"
        containerClassName="min-w-0 flex-1"
        controlClassName={`px-4 ${FIELD_TEXT}`}
      />
      <Button
        type="submit"
        label={t.search.button}
        variant="primary"
        size="lg"
        className="shrink-0 px-5"
      />
    </form>
  );
}

/** The three search examples, longest first (`useFitPlaceholder`). */
export const searchExamples = (t: Dict): readonly string[] => [
  t.search.placeholder,
  t.search.placeholderMid,
  t.search.placeholderShort,
];

export function BrandChips({
  brands,
  current,
  only,
  lang,
  t,
}: {
  brands: BrandLink[];
  current?: string;
  /** Phones: folded under the results; wide: the full grid above them (the page hides the other). */
  only: 'phone' | 'wide';
  lang: Lang;
  t: Dict;
}) {
  const list = (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      <li>
        <a
          href={localePath(LIST_PATH, lang)}
          aria-current={current ? undefined : 'page'}
          className={chipClass(!current)}
        >
          {t.search.all}
        </a>
      </li>
      {brands.map((b) => (
        <li key={b.path}>
          <a
            href={localePath(b.path, lang)}
            aria-current={b.name === current ? 'page' : undefined}
            className={chipClass(b.name === current)}
          >
            {b.name}
          </a>
        </li>
      ))}
    </ul>
  );
  return (
    <nav aria-label={t.search.brands} className="font-sans text-sm">
      {only === 'phone' ? (
        <details>
          <summary
            className={`inline-flex min-h-11 cursor-pointer items-center rounded-sm border border-ink-soft bg-bg px-4 font-medium text-ink ${FOCUS}`}
          >
            {t.search.changeMake(brands.length)}
          </summary>
          <div className="mt-3">{list}</div>
        </details>
      ) : (
        list
      )}
    </nav>
  );
}

/**
 * The breaker search: `all` lists every model while the box is empty (brand pages, and the tip
 * page since the owner's 2026-10-21 "Kırıcı ucu sayfasında da tüm modeller listelensin"), as
 * picture cards a page at a time with `cards`. The box filters as you type and picks
 * up `?q=` from the home page's search. A typed search's results can be narrowed by tip
 * type, diameter band (with the rough carrier weight) and dust grooves; the filters only
 * appear for results and only offer values the results have. The query and the filters are
 * read from the URL after hydration (`?q=&tip=&cap=&kanal=1`) and written back with
 * `replaceState`, so a filtered search can be shared; the prerender is the empty state.
 */
/** Model cards shown at a time; "Daha fazla göster" adds as many again. */
const PAGE = 24;

export function ModelTable({
  rows,
  fx = null,
  lang,
  t,
  all = false,
  cards = false,
  crawlAll = false,
  quiet = false,
  hint,
}: {
  rows: BreakerCard[];
  /** CBRT rate for the cards' TL price (owner: "tl fiyatı da gözüksün"). */
  fx?: FxRate | null;
  lang: Lang;
  t: Dict;
  /** A brand page lists every model of its make while the box is empty (owner: all models show). */
  all?: boolean;
  /** Picture cards instead of the table (brand pages, owner: "modelleri fotoğrafları ile birlikte"). */
  cards?: boolean;
  /** Every card is in the HTML, those past the current page `hidden` (brand pages): each model
   *  page then has a plain link a crawler follows. Without it only the page's cards are rendered. */
  crawlAll?: boolean;
  /** Brand pages say the count in their lead: no count here until the box or a filter narrows it. */
  quiet?: boolean;
  /** The box's example (brand pages: a model of that make), instead of the header box's. */
  hint?: string;
}) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<TipFilter>(EMPTY_FILTER);
  // Writing the URL waits for the load-time read, so the first render cannot wipe a shared link.
  const [ready, setReady] = useState(false);
  const box = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const v = sp.get('q');
    if (v) setQ(v);
    setFilter(parseTipFilter(sp));
    setReady(true);
  }, []);
  useKeepTyped(box, setQ);
  const placeholder = useFitPlaceholder(box, hint ? [hint] : searchExamples(t));
  const query = q.trim();
  useEffect(() => {
    if (!ready) return;
    replaceSearch((sp) => {
      if (query) sp.set('q', query);
      else sp.delete('q');
      const merged = new URLSearchParams(tipFilterToSearch(filter, sp));
      for (const k of [...sp.keys()]) sp.delete(k);
      for (const [k, v] of merged) sp.append(k, v);
    });
  }, [ready, query, filter]);
  const shown = query ? rows.filter((r) => matches(query, searchName(r.name))) : all ? rows : [];
  // Cards show a page at a time; a new search or filter starts again from the first page.
  const [page, setPage] = useState(PAGE);
  useEffect(() => setPage(PAGE), [query, filter]);
  // "Daha fazla göster" goes away on the last page and the new cards land above it: the focus moves
  // to the first new card (WCAG 2.4.3, as the home's "Tüm markalar").
  const cardList = useRef<HTMLUListElement>(null);
  const focusFrom = useRef<number | null>(null);
  useEffect(() => {
    const from = focusFrom.current;
    if (from === null) return;
    focusFrom.current = null;
    const open = [...(cardList.current?.children ?? [])].filter(
      (li) => !(li as HTMLElement).hidden,
    );
    open[from]?.querySelector('a')?.focus({ preventScroll: false });
  }, [page]);
  // Nothing found: try the query with a misspelt make fixed and unknown words dropped (on the
  // unfiltered rows, so a filter can never hide the suggestion).
  const guess =
    query && !shown.length
      ? rewriteQuery(
          query,
          rows.map((r) => r.name),
          [...new Set(rows.map((r) => r.brand))],
        )
      : null;
  const near = guess ? rows.filter((r) => matches(guess, searchName(r.name))) : [];
  const found = shown.length ? shown : near;
  const facets = facetsOf(found);
  const active = isFilterActive(filter);
  // Rows come sorted best-sellers first, then by diameter; the filter keeps that order.
  const visible = applyTipFilter(found, filter);
  const band = filter.cap ? CARRIER_BANDS.find((b) => b.key === filter.cap) : undefined;
  const summary = [
    filter.tip ? t.tip[filter.tip] : '',
    band ? t.search.filter.bandShort(band.from, band.below, band.tons) : '',
    filter.grooved ? t.search.filter.grooved : '',
  ]
    .filter(Boolean)
    .join(', ');
  const clear = () => setFilter(EMPTY_FILTER);
  const bar =
    found.length > 0 ? (
      <FilterBar facets={facets} filter={filter} onChange={setFilter} t={t} />
    ) : null;
  const table =
    visible.length > 0 ? (
      cards ? (
        <>
          <Cards
            rows={crawlAll ? visible : visible.slice(0, page)}
            limit={page}
            listRef={cardList}
            tip={filter.tip}
            fx={fx}
            lang={lang}
            t={t}
          />
          {visible.length > page && (
            <Button
              label={t.list.more(visible.length - page)}
              variant="secondary"
              onClick={() => {
                focusFrom.current = page;
                setPage((n) => n + PAGE);
              }}
              className={`mt-4 px-4 font-sans ${OUTLINE_BUTTON}`}
            />
          )}
        </>
      ) : (
        <Table rows={visible} tip={filter.tip} lang={lang} t={t} />
      )
    ) : active && found.length > 0 ? (
      <div className="mt-4 rounded-md border border-hair bg-bg-soft p-4 font-sans text-sm">
        <p className="m-0 text-ink">{t.search.filter.none(found.length)}</p>
        <Button
          label={t.search.filter.clear}
          variant="secondary"
          onClick={clear}
          className={`mt-3 ${OUTLINE_BUTTON}`}
        />
      </div>
    ) : null;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <TextInput
          ref={box}
          id="filter"
          type="search"
          label={t.search.label}
          isLabelHidden
          size="lg"
          value={q}
          onChange={(v) => setQ(v)}
          placeholder={placeholder}
          autoComplete="off"
          containerClassName="min-w-0 flex-[1_1_22rem] font-sans sm:max-w-md"
          controlClassName={`px-4 ${FIELD_TEXT}`}
        />
        <p className="m-0 font-sans text-sm text-ink-mid empty:absolute" aria-live="polite">
          {quiet && !query && !active
            ? ''
            : !query && !all
              ? t.search.hint
              : shown.length
                ? active
                  ? t.search.countFiltered(visible.length, shown.length)
                  : t.search.count(shown.length)
                : t.search.none(query)}
        </p>
      </div>
      {shown.length > 0 && (
        <>
          {bar}
          {table}
        </>
      )}
      {query && !shown.length && guess && near.length > 0 && (
        <div className="mt-4">
          <p className="m-0 font-sans text-base font-semibold text-ink">
            {t.search.didYouMean(guess)}
          </p>
          {bar}
          {table}
        </div>
      )}
      {/* the pages' one "model not listed" box: with the typed model (and the filters) when the
          search found nothing or was narrowed */}
      <MissingModel
        t={t}
        query={query && (!shown.length || active) ? query : ''}
        filters={query && active ? summary : ''}
        className={query && !visible.length ? 'mt-6' : 'mt-12'}
      />
    </div>
  );
}

/** The selector's "every band" value (no band has this key). */
const ANY_BAND = 'all';

/** The narrowing chips over a search's results: only rows that would offer a choice show. */
function FilterBar({
  facets,
  filter,
  onChange,
  t,
}: {
  facets: TipFacets;
  filter: TipFilter;
  onChange: (f: TipFilter) => void;
  t: Dict;
}) {
  const tf = t.search.filter;
  // A choice in the URL that these results do not offer still shows, so it can be undone.
  const types =
    filter.tip && !facets.types.includes(filter.tip) ? [...facets.types, filter.tip] : facets.types;
  const bands =
    filter.cap && !facets.bands.some((b) => b.key === filter.cap)
      ? CARRIER_BANDS.filter((b) => b.key === filter.cap || facets.bands.includes(b))
      : facets.bands;
  const showTypes = types.length > 0;
  const showBands = bands.length > 1 || (bands.length === 1 && filter.cap !== null);
  const showGrooved = facets.grooved || filter.grooved;
  if (!showTypes && !showBands && !showGrooved) return null;
  const set = (p: Partial<TipFilter>) => onChange({ ...filter, ...p });
  const label = (b: CarrierBand) => tf.band(b.from, b.below, b.tons);
  return (
    <section aria-label={tf.label} className="mt-4 flex flex-col gap-3 font-sans text-sm">
      <h2 className="sr-only">{tf.label}</h2>
      {showTypes && (
        <div role="group" aria-labelledby="tf-type">
          <p id="tf-type" className="m-0 mb-2 font-semibold text-ink">
            {tf.type}
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {[null, ...types].map((x) => (
              <li key={x ?? 'all'}>
                <button
                  type="button"
                  aria-pressed={filter.tip === x}
                  onClick={() => set({ tip: x })}
                  className={chipClass(filter.tip === x)}
                >
                  {x ? t.tip[x] : tf.all}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {showBands && (
        <>
          <div role="group" aria-labelledby="tf-cap" className="hidden sm:block">
            <p id="tf-cap" className="m-0 mb-2 font-semibold text-ink">
              {tf.carrier}
            </p>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {[null, ...bands].map((b) => (
                <li key={b?.key ?? 'all'}>
                  <button
                    type="button"
                    aria-pressed={filter.cap === (b?.key ?? null)}
                    onClick={() => set({ cap: b?.key ?? null })}
                    className={`${chipClass(filter.cap === (b?.key ?? null))} tabular-nums`}
                  >
                    {b ? tf.bandChip(b.from, b.below, b.tons) : tf.all}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {/* Phones: the bands as one selector (up to ten long labels), a bottom sheet on touch. */}
          <div className="sm:hidden">
            <Selector
              label={tf.carrier}
              presentation="adaptive"
              size="lg"
              width="100%"
              containerClassName="[&_label]:font-semibold"
              controlClassName={FIELD_RING}
              value={filter.cap ?? ANY_BAND}
              onChange={(v) => set({ cap: CARRIER_BANDS.find((b) => b.key === v)?.key ?? null })}
              options={[
                { value: ANY_BAND, label: tf.all },
                ...bands.map((b) => ({ value: b.key as string, label: label(b) })),
              ]}
            />
          </div>
        </>
      )}
      {showGrooved && (
        <div>
          <button
            type="button"
            aria-pressed={filter.grooved}
            onClick={() => set({ grooved: !filter.grooved })}
            className={chipClass(filter.grooved)}
          >
            {tf.grooved}
          </button>
        </div>
      )}
    </section>
  );
}

/** Brand page: one card per model: its own tip picture, or (no picture of its own) the working diameter set large in
 *  the picture's place with its tip types, never a borrowed picture (owner), then name and diameter. */
function Cards({
  rows,
  limit,
  listRef,
  tip,
  fx,
  lang,
  t,
}: {
  rows: BreakerCard[];
  /** Cards past this many are rendered `hidden` (still linked in the HTML). */
  limit: number;
  listRef: RefObject<HTMLUListElement | null>;
  tip: TipType | null;
  fx: FxRate | null;
  lang: Lang;
  t: Dict;
}) {
  const href = (r: BreakerCard) => cardHref(r, lang, tip);
  const dia = (r: BreakerCard) =>
    r.diameterMm === null ? '—' : `Ø${fmtNum(r.diameterMm, lang)} mm`;
  return (
    <ul
      ref={listRef}
      className="m-0 mt-4 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
    >
      {rows.map((r, i) => {
        const pic = cardPic(r);
        return (
          <li key={cardKey(r)} hidden={i >= limit}>
            <a
              href={href(r)}
              className={`group flex h-full flex-col overflow-hidden rounded-md border border-hair bg-bg transition-colors hover:border-hair-strong ${FOCUS}`}
            >
              {pic ? (
                <span className="relative block">
                  <img
                    src={pic.src}
                    alt={
                      pic.photo
                        ? t.family.realPhotoAlt(r.name, 1)
                        : t.list.cardAlt(r.name, pic.sample)
                    }
                    width={480}
                    height={pic.photo ? 360 : 320}
                    loading="lazy"
                    decoding="async"
                    className={`block aspect-[3/2] h-auto w-full border-b border-hair bg-stage ${pic.photo ? 'object-cover' : 'object-contain'}`}
                  />
                  {pic.sample && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-bg/90 px-1.5 py-0.5 font-sans text-xs text-ink-mid">
                      {t.list.sampleBadge}
                    </span>
                  )}
                </span>
              ) : (
                <span className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-1 border-b border-hair bg-bg-soft px-2 text-center font-sans">
                  <span className="text-2xl font-bold tabular-nums text-ink sm:text-3xl">
                    {dia(r)}
                  </span>
                  {r.types.length > 0 && (
                    <span className="text-xs text-ink-mid sm:text-sm">
                      {r.types.map((x) => t.tip[x]).join(', ')}
                    </span>
                  )}
                </span>
              )}
              <span className="flex flex-1 flex-col gap-1 p-3 font-sans">
                <span className="text-sm font-semibold text-ink group-hover:text-brand-hi sm:text-base">
                  {cardName(r, lang, t)}
                </span>
                {/* without a picture the diameter is already set large above: only the badge here */}
                {(pic || r.grooved) && (
                  <span className="text-sm text-ink-mid tabular-nums">
                    {pic ? dia(r) : ''}
                    {r.grooved && `${pic ? ' · ' : ''}${t.list.groovedBadge}`}
                  </span>
                )}
                <CardPrice price={r.price} fx={fx} lang={lang} t={t} />
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A card's price (brand pages, the home's "Ürettiklerimizden"), or its span. Turkish pages with a
 * rate: the tax-inclusive TL price "(vergiler dahil)" first, the net USD price "+ vergiler" under
 * it (owner, G2, 2026-11-01). English: the net USD price "export price", the TL amount under it.
 * "Fiyat için sorun" without a price.
 */
export function CardPrice({
  price,
  fx,
  lang,
  t,
}: {
  price: [number, number] | null;
  fx: FxRate | null;
  lang: Lang;
  t: Dict;
}) {
  const usd = price
    ? price[0] === price[1]
      ? fmtUsd(price[0], lang)
      : `${fmtNum(price[0] / 100, lang)}–${fmtUsd(price[1], lang)}`
    : '';
  if (price && leadsGross(lang, fx)) {
    const lo = grossTryCents(price[0], fx) ?? 0;
    const hi = grossTryCents(price[1], fx) ?? 0;
    return (
      <span className="mt-auto pt-1 text-sm text-ink tabular-nums">
        <span className="font-semibold">
          {lo === hi ? fmtTryCents(lo, lang) : `${fmtNum(lo / 100, lang)}–${fmtTryCents(hi, lang)}`}
        </span>{' '}
        <span className="text-xs text-ink-soft">{t.price.incl}</span>
        <span className="block text-ink-mid">
          {usd} <span className="text-xs text-ink-soft">{t.list.priceNote}</span>
        </span>
      </span>
    );
  }
  return (
    <span className="mt-auto pt-1 text-sm text-ink tabular-nums">
      {price ? (
        <>
          <span className="font-semibold">{usd}</span>{' '}
          <span className="text-xs text-ink-soft">{t.list.priceNote}</span>
          {fx && (
            <span className="block text-ink-mid">
              {price[0] === price[1]
                ? fmtTry(price[0], fx, lang)
                : `${fmtNum(Math.round((price[0] / 100) * fx.usdTry), lang)}–${fmtTry(price[1], fx, lang)}`}
            </span>
          )}
        </>
      ) : (
        <span className="text-ink-mid">{t.list.priceAsk}</span>
      )}
    </span>
  );
}

function Table({
  rows,
  tip,
  lang,
  t,
}: {
  rows: BreakerCard[];
  /** Tip type picked in the filters: the product page opens on it (`?tip=`). */
  tip: TipType | null;
  lang: Lang;
  t: Dict;
}) {
  const href = (r: BreakerCard) => cardHref(r, lang, tip);
  return (
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
          {rows.map((r) => (
            <tr key={cardKey(r)} className="border-t border-hair">
              <th scope="row" className="px-4 py-0.5 text-left font-medium">
                {/* min-h-11: a 44 px tap target, the row keeps its height */}
                <a
                  href={href(r)}
                  className={`inline-flex min-h-11 items-center text-brand-hi underline decoration-hair-strong underline-offset-4 hover:decoration-brand ${FOCUS}`}
                >
                  {cardName(r, lang, t)}
                </a>
                {r.grooved && (
                  // Under the name on phones (the types column is hidden there), beside it wider.
                  <a
                    href={`${localePath(r.path, lang)}#toz-kanalli`}
                    aria-label={t.list.groovedBadgeLabel(r.name)}
                    className={`mb-2 flex w-fit items-center rounded-sm border border-hair-strong bg-bg-soft px-2 py-1 text-xs font-medium text-ink hover:border-ink-soft sm:mb-0 sm:ml-3 sm:inline-flex ${FOCUS}`}
                  >
                    {t.list.groovedBadge}
                  </a>
                )}
              </th>
              <td className="px-4 py-3 text-ink">
                {r.diameterMm === null ? '—' : `Ø${fmtNum(r.diameterMm, lang)} mm`}
              </td>
              <td className="hidden px-4 py-3 text-ink sm:table-cell">
                {r.types.map((x) => t.tip[x]).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
