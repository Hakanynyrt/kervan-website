import { useEffect, useMemo, useRef, useState } from 'react';
import type { DictBlock, Lang, VegaCatalog, VegaItem, VegaPopular, VegaTip } from '../../types';
import type { CatalogStatus } from '../../lib/use-vega-catalog';
import {
  DEFAULT_TOL,
  TIP_TYPES,
  TOLERANCES,
  brandsOf,
  fmtDiff,
  fmtNum,
  fmtRange,
  needsVerification,
  parseNum,
  searchCatalog,
  type Group,
  type Hit,
  type Measure,
  type MeasureKey,
} from '../../lib/vega-search';
import {
  type CatalogIndex,
  buildIndex,
  equivalentsOf,
  geometriesFor,
  partNoClashesOf,
  partNoLooksBroken,
} from '../../lib/vega-index';
import {
  type ChipState,
  type FieldScore,
  type Scored,
  likelyIsMeaningful,
  mostLikely,
  nextBestMeasure,
  rankByScore,
} from '../../lib/vega-score';
import { type Popularity, buildPopularity, popularPrior } from '../../lib/vega-popular';

interface Props {
  t: DictBlock;
  lang: Lang;
  status: CatalogStatus;
  catalog: VegaCatalog | null;
  popular?: VegaPopular | null;
  retry: () => void;
}

const PAGE = 40;
const MAX_COMPARE = 3;
const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';
const inputCls = `w-full min-h-11 bg-bg-soft border border-ink-soft rounded-md px-3 font-sans text-ink placeholder:text-ink-mid ${focusRing}`;
const labelCls = 'font-sans text-xs tracking-[0.12em] uppercase text-ink-mid';
const btnCls = `min-h-11 px-4 rounded-full border border-hair-strong font-sans text-sm text-ink hover:border-ink-mid transition-colors ${focusRing}`;

/** Order follows how much each size narrows the candidates (key count and
 *  back-end→slot are the independent ones; key thickness tracks diameter).
 *  Length is not asked: a worn tip's length says nothing. */
const MEASURE_FIELDS: {
  key: Exclude<MeasureKey, 'length'>;
  label: keyof DictBlock['catalogUi'];
  optional?: boolean;
}[] = [
  { key: 'dia', label: 'measureDia' },
  { key: 'backToSlot', label: 'measureBackToSlot' },
  { key: 'slotLen', label: 'measureSlotLen' },
  { key: 'keyThk', label: 'measureKeyThk' },
  { key: 'rearDia', label: 'measureRearDia', optional: true },
];
const CHIP_CLS: Record<ChipState, string> = {
  ok: 'border-ok/70 text-ok',
  wear: 'border-brand/70 text-brand-hi',
  off: 'border-err/70 text-err',
  unknown: 'border-hair-strong text-ink-soft',
};

const fill = (tpl: string, vars: Record<string, string | number>): string =>
  Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), tpl);

export default function CatalogTab({ t, lang, status, catalog, popular, retry }: Props) {
  const c = t.catalogUi;
  const [text, setText] = useState('');
  const [brand, setBrand] = useState('');
  const [tip, setTip] = useState<VegaTip | ''>('');
  const [hideLow, setHideLow] = useState(false);
  const [popularOnly, setPopularOnly] = useState(false);
  const [raw, setRaw] = useState<Record<Exclude<MeasureKey, 'length'>, string>>({
    dia: '',
    keyThk: '',
    backToSlot: '',
    slotLen: '',
    rearDia: '',
  });
  const [keyCount, setKeyCount] = useState<'' | '1' | '2'>('');
  const [tol, setTol] = useState<number>(DEFAULT_TOL);
  const [limit, setLimit] = useState(PAGE);
  const [sel, setSel] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  const measure = useMemo<Measure>(() => {
    const m: Measure = {};
    for (const { key } of MEASURE_FIELDS) {
      const n = parseNum(raw[key]);
      if (n !== undefined) m[key] = n;
    }
    if (keyCount) m.keyCount = keyCount === '1' ? 1 : 2;
    return m;
  }, [raw, keyCount]);

  const items = catalog?.items;
  const brands = useMemo(() => (items ? brandsOf(items) : []), [items]);
  const idx = useMemo(() => (items ? buildIndex(items) : null), [items]);
  const pop = useMemo(
    () => (items ? buildPopularity(items, popular ?? null) : null),
    [items, popular],
  );
  const results = useMemo(
    () =>
      items && idx
        ? searchCatalog(
            items,
            { text, brand, tip, hideLow, measure, tol, popularOnly },
            idx,
            pop ?? undefined,
          )
        : null,
    [items, idx, pop, text, brand, tip, hideLow, popularOnly, measure, tol],
  );

  const scored = useMemo<Scored[]>(
    () =>
      results?.measuring
        ? rankByScore(results.pool, measure, (it) => (pop ? popularPrior(pop, it) : 0))
        : [],
    [results, measure, pop],
  );
  const fieldsFor = useMemo(() => new Map(scored.map((x) => [x.item, x.fields])), [scored]);
  const likely = useMemo(
    () => (scored.length && likelyIsMeaningful(measure) ? mostLikely(scored) : null),
    [scored, measure],
  );
  const next = useMemo(
    () => (scored.length ? nextBestMeasure(measure, scored) : null),
    [scored, measure],
  );
  const [likelyOpen, setLikelyOpen] = useState(false);

  useEffect(() => setLimit(PAGE), [text, brand, tip, hideLow, popularOnly, measure, tol]);

  if (status === 'idle' || status === 'loading') {
    return (
      <p className="font-sans text-ink-mid" role="status">
        {c.loading}
      </p>
    );
  }
  if (status !== 'ready' || !catalog || !items || !results || !idx || !pop) {
    const msg =
      status === 'unauthorized'
        ? c.errorUnauthorized
        : status === 'not_configured'
          ? c.errorNotConfigured
          : status === 'empty'
            ? c.errorEmpty
            : c.errorGeneric;
    return (
      <div role="alert" className="flex flex-col items-start gap-4">
        <p className="font-sans text-ink">{msg}</p>
        {status !== 'unauthorized' && (
          <button type="button" onClick={retry} className={btnCls}>
            {c.retry}
          </button>
        )}
      </div>
    );
  }

  const byId = new Map(items.map((i) => [i.id, i]));
  const compared = sel.map((id) => byId.get(id)).filter((i): i is VegaItem => !!i);
  const toggleSel = (id: string) =>
    setSel((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length < MAX_COMPARE ? [...s, id] : s,
    );
  const clearMeasure = () => {
    setRaw({ dia: '', keyThk: '', backToSlot: '', slotLen: '', rearDia: '' });
    setKeyCount('');
  };

  const renderHits = (hits: Hit[], max: number) =>
    hits.slice(0, max).map((h) => (
      <ItemCard
        key={h.item.id}
        hit={h}
        t={t}
        lang={lang}
        open={openId === h.item.id}
        onOpen={() => setOpenId(openId === h.item.id ? null : h.item.id)}
        selected={sel.includes(h.item.id)}
        canSelect={sel.length < MAX_COMPARE}
        onSelect={() => toggleSel(h.item.id)}
        idx={idx}
        fields={fieldsFor.get(h.item)}
        pop={pop}
        onMeasure={() => {
          setText('');
          document.getElementById('vc-m-dia')?.focus();
        }}
      />
    ));

  const groupDefs: { g: Group; title: string; hint?: string }[] = [
    { g: 'match', title: c.groupMatch },
    { g: 'maybe', title: c.groupMaybe, hint: c.groupMaybeHint },
  ];
  let budget = limit;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif italic text-3xl text-ink m-0">{c.title}</h1>
        <p className="font-sans text-ink-mid mt-2 mb-0 max-w-[60ch]">{c.sub}</p>
      </div>

      {/* Text search + filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6 flex flex-col gap-2">
          <label htmlFor="vc-q" className={labelCls}>
            {c.searchLabel}
          </label>
          <input
            id="vc-q"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={c.searchPlaceholder}
            autoComplete="off"
            className={inputCls}
          />
        </div>
        <div className="md:col-span-3 flex flex-col gap-2">
          <label htmlFor="vc-brand" className={labelCls}>
            {c.brandLabel}
          </label>
          <select
            id="vc-brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={inputCls}
          >
            <option value="">{c.brandAll}</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3 flex flex-col gap-2">
          <span className={labelCls} id="vc-tip-l">
            {c.tipLabel}
          </span>
          <div role="group" aria-labelledby="vc-tip-l" className="flex flex-wrap gap-2">
            {TIP_TYPES.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={tip === k}
                onClick={() => setTip(tip === k ? '' : k)}
                className={`${btnCls} px-3 ${tip === k ? 'bg-brand text-bg border-brand hover:border-brand' : ''}`}
              >
                {c.tipLabels[k]}
              </button>
            ))}
          </div>
        </div>
        <label className="md:col-span-12 flex items-center gap-3 min-h-11 cursor-pointer">
          <input
            type="checkbox"
            checked={hideLow}
            onChange={(e) => setHideLow(e.target.checked)}
            className="w-5 h-5 accent-brand"
          />
          <span className="font-sans text-sm text-ink-mid">{c.hideLow}</span>
        </label>
        {pop.tier.size > 0 && (
          <label className="md:col-span-12 flex items-center gap-3 min-h-11 cursor-pointer -mt-2">
            <input
              type="checkbox"
              checked={popularOnly}
              onChange={(e) => setPopularOnly(e.target.checked)}
              className="w-5 h-5 accent-brand"
            />
            <span className="font-sans text-sm text-ink-mid">
              {c.popularOnly}{' '}
              <span className="text-ink-soft">({fill(c.popularStatus, { n: pop.tier.size })})</span>
            </span>
          </label>
        )}
      </div>

      {/* Measure form */}
      <fieldset className="border border-hair rounded-[14px] p-5 md:p-6 m-0 min-w-0">
        <legend className="px-2 font-serif text-xl text-ink">{c.measureTitle}</legend>
        <p className="font-sans text-sm text-ink-mid mt-0 mb-5 max-w-[70ch]">{c.measureHint}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MEASURE_FIELDS.map(({ key, label, optional }) => {
            const invalid = raw[key].trim() !== '' && parseNum(raw[key]) === undefined;
            const hot = next?.key === key;
            const field = (
              <div key={key} className="flex flex-col gap-2">
                <label htmlFor={`vc-m-${key}`} className={labelCls}>
                  {c[label] as string}
                  {optional && (
                    <span className="normal-case tracking-normal"> {c.measureOptional}</span>
                  )}
                </label>
                <input
                  id={`vc-m-${key}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={raw[key]}
                  onChange={(e) => setRaw({ ...raw, [key]: e.target.value })}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? `vc-m-${key}-e` : hot ? 'vc-next' : undefined}
                  className={`${inputCls} ${hot ? 'border-brand ring-2 ring-brand/40' : ''}`}
                />
                {invalid && (
                  <span id={`vc-m-${key}-e`} className="font-sans text-xs text-err">
                    {c.invalidNumber}
                  </span>
                )}
              </div>
            );
            if (key !== 'dia') return field;
            const kcHot = next?.key === 'keyCount';
            return [
              field,
              <div key="kc" className="flex flex-col gap-2">
                <label htmlFor="vc-m-kc" className={labelCls}>
                  {c.measureKeyCount}
                </label>
                <select
                  id="vc-m-kc"
                  value={keyCount}
                  onChange={(e) => setKeyCount(e.target.value as '' | '1' | '2')}
                  aria-describedby={kcHot ? 'vc-next' : undefined}
                  className={`${inputCls} ${kcHot ? 'border-brand ring-2 ring-brand/40' : ''}`}
                >
                  <option value="">{c.keyAny}</option>
                  <option value="1">{c.keySingle}</option>
                  <option value="2">{c.keyDouble}</option>
                </select>
              </div>,
            ];
          })}
          <div className="flex flex-col gap-2">
            <label htmlFor="vc-m-tol" className={labelCls}>
              {c.tolLabel}
            </label>
            <select
              id="vc-m-tol"
              value={tol}
              onChange={(e) => setTol(Number(e.target.value))}
              className={inputCls}
            >
              {TOLERANCES.map((n) => (
                <option key={n} value={n}>
                  ±{n} mm
                </option>
              ))}
            </select>
          </div>
        </div>
        {next && (
          <p id="vc-next" role="status" className="font-sans text-sm text-ink mt-5 mb-0">
            <span className="text-brand-hi font-medium">
              {fill(c.nextMeasure, { field: c.fieldNames[next.key] })}
            </span>{' '}
            <span className="text-ink-mid">
              {fill(c.nextMeasureHint, {
                a: Math.round(next.before),
                b: Math.max(1, Math.round(next.after)),
              })}
            </span>
          </p>
        )}
        <div className="mt-5">
          <button type="button" onClick={clearMeasure} className={btnCls}>
            {c.clear}
          </button>
        </div>
      </fieldset>

      {results.measuring && likely && (
        <LikelyCard
          likely={likely}
          t={t}
          lang={lang}
          idx={idx}
          tol={tol}
          insideTol={Object.values(results.groups)
            .flat()
            .some(
              (h) =>
                likely.items.includes(h.item) || !!h.twins?.some((x) => likely.items.includes(x)),
            )}
          fields={fieldsFor.get(likely.items[0]) ?? []}
          pop={pop}
          open={likelyOpen}
          onOpen={() => setLikelyOpen((o) => !o)}
        />
      )}

      {compared.length > 0 && (
        <CompareTable
          items={compared}
          t={t}
          lang={lang}
          onRemove={(id) => {
            setSel((s) => s.filter((x) => x !== id));
            if (sel.length <= 1) statusRef.current?.focus();
          }}
          onClose={() => {
            setSel([]);
            statusRef.current?.focus();
          }}
        />
      )}

      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="font-sans text-sm text-ink-mid m-0"
      >
        {fill(c.resultsCount, { n: fmtNum(results.total, lang) })}
        {results.phonetic && <> · {c.phoneticHint}</>}
        {sel.length >= MAX_COMPARE && <> · {fill(c.compareMax, { n: MAX_COMPARE })}</>}
      </p>
      {results.measuring && (results.total > 0 || likely) && (
        <p className="font-sans text-xs text-ink-mid m-0 -mt-4">
          {c.chipLegend}
          {pop.tier.size > 0 && <> · {c.popularNote}</>}
        </p>
      )}

      {results.measuring ? (
        results.total === 0 ? (
          <div className="font-sans text-ink">
            <p className="m-0 font-medium">{c.emptyResults}</p>
            <p className="mt-1 text-ink-mid">{fill(c.emptyHint, { t: tol })}</p>
          </div>
        ) : (
          groupDefs.map(({ g, title, hint }) => {
            const hits = results.groups[g];
            if (!hits.length) return null;
            const shown = Math.max(0, Math.min(hits.length, budget));
            budget -= shown;
            return (
              <section key={g} aria-label={title} className="flex flex-col gap-4">
                <div>
                  <h2 className="font-sans text-sm tracking-[0.12em] uppercase text-brand-hi m-0">
                    {title} ({hits.length})
                  </h2>
                  {hint && <p className="font-sans text-sm text-ink-mid mt-1 mb-0">{hint}</p>}
                </div>
                <ul className="list-none p-0 m-0 grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {renderHits(hits, shown)}
                </ul>
              </section>
            );
          })
        )
      ) : results.total === 0 ? (
        <p className="font-sans text-ink m-0">{c.emptyResults}</p>
      ) : (
        <ul className="list-none p-0 m-0 grid grid-cols-1 xl:grid-cols-2 gap-4">
          {renderHits(results.list, limit)}
        </ul>
      )}

      {((results.measuring && results.groups.match.length + results.groups.maybe.length > limit) ||
        (!results.measuring && results.list.length > limit)) && (
        <div>
          <button type="button" onClick={() => setLimit((n) => n + PAGE)} className={btnCls}>
            {c.more}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── single result ─────────────────────────────────────────────── */

function WarnBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/60 px-2.5 py-1 font-sans text-xs text-brand-hi">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3 2 21h20L12 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M12 10v5M12 18v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {label}
    </span>
  );
}

function summary(it: VegaItem, lang: Lang, t: DictBlock): string {
  const c = t.catalogUi;
  const parts: string[] = [];
  const dia =
    it.collarDiameterMm && it.collarDiameterMm !== it.diameterMm
      ? `${fmtNum(it.diameterMm ?? 0, lang)}/${fmtNum(it.collarDiameterMm, lang)}`
      : it.diameterMm != null
        ? fmtNum(it.diameterMm, lang)
        : null;
  if (dia) parts.push(`Ø ${dia}`);
  if (it.key.count) {
    const kc = it.key.count === 1 ? c.keySingle : c.keyDouble;
    parts.push(
      `${c.fKey} ${kc}${it.key.thicknessMm != null ? ` ${fmtNum(it.key.thicknessMm, lang)}` : ''}`,
    );
  }
  const len = fmtRange(it.lengthMm, lang);
  if (len) parts.push(`${c.fLength} ${len}`);
  const w = fmtRange(it.weightKg, lang);
  if (w) parts.push(`${w} kg`);
  return parts.join(' · ');
}

function ItemCard({
  hit,
  t,
  lang,
  open,
  onOpen,
  selected,
  canSelect,
  onSelect,
  idx,
  fields,
  pop,
  onMeasure,
}: {
  hit: Hit;
  t: DictBlock;
  lang: Lang;
  open: boolean;
  onOpen: () => void;
  selected: boolean;
  canSelect: boolean;
  onSelect: () => void;
  idx: CatalogIndex;
  fields?: FieldScore[];
  pop: Popularity;
  onMeasure: () => void;
}) {
  const c = t.catalogUi;
  const it = hit.item;
  const panelId = `vc-d-${it.id}`;
  // The breaker name the search matched points to tips with different sizes.
  const conflictN = hit.matched ? geometriesFor(idx, hit.matched) : 0;
  return (
    <li className="bg-bg-soft border border-hair rounded-[14px] p-5 flex flex-col gap-3 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-serif text-xl text-ink m-0 break-words">{it.model}</h3>
          <p className="font-sans text-xs tracking-[0.12em] uppercase text-ink-mid m-0 mt-1">
            {it.brand}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <PopularBadge it={it} pop={pop} t={t} />
          {needsVerification(it) && <WarnBadge label={c.warnBadge} />}
        </div>
      </div>
      <p className="font-sans text-ink m-0">{summary(it, lang, t)}</p>
      {hit.via && (
        <p className="font-sans text-sm text-ink-mid m-0">
          {fill(c.matchedVia, { name: hit.via })}
        </p>
      )}
      {conflictN > 1 && (
        <div
          role="note"
          className="flex flex-wrap items-center gap-3 rounded-md border border-brand/60 px-3 py-2"
        >
          <p className="font-sans text-sm text-brand-hi m-0">
            {fill(c.conflictWarn, { name: hit.matched ?? '', n: conflictN })}
          </p>
          <button type="button" onClick={onMeasure} className={`${btnCls} min-h-9 px-3 text-xs`}>
            {c.conflictMeasure}
          </button>
        </div>
      )}
      {hit.twins && hit.twins.length > 0 && (
        <div>
          <p className="font-sans text-sm text-ink m-0">
            {fill(c.twinsLabel, { n: hit.twins.length })}:{' '}
            {hit.twins.map((x) => x.model).join(' · ')}
          </p>
          <p className="font-sans text-xs text-ink-mid m-0 mt-1">{c.twinsHint}</p>
        </div>
      )}
      {fields && fields.length > 0 && <Chips fields={fields} t={t} lang={lang} />}
      <div className="flex flex-wrap gap-2 mt-1">
        <button
          type="button"
          onClick={onOpen}
          aria-expanded={open}
          aria-controls={panelId}
          className={btnCls}
        >
          {open ? c.hideDetails : c.details}
        </button>
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          disabled={!selected && !canSelect}
          className={`${btnCls} disabled:opacity-50 disabled:cursor-not-allowed ${selected ? 'bg-brand text-bg border-brand hover:border-brand' : ''}`}
        >
          {c.compare}
        </button>
      </div>
      {open && (
        <div id={panelId}>
          <Detail item={it} t={t} lang={lang} idx={idx} />
        </div>
      )}
    </li>
  );
}

function CopyButton({ value, t }: { value: string; t: DictBlock }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(false), 1500);
    return () => clearTimeout(id);
  }, [done]);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          ?.writeText(value)
          .then(() => setDone(true))
          .catch(() => undefined);
      }}
      aria-label={t.catalogUi.copyLabel}
      className={`ml-2 min-h-8 px-3 rounded-full border border-hair-strong font-sans text-xs text-ink-mid hover:text-ink ${focusRing}`}
    >
      {done ? t.catalogUi.copied : t.catalogUi.copy}
      <span role="status" aria-live="polite" className="sr-only">
        {done ? t.catalogUi.copied : ''}
      </span>
    </button>
  );
}

function rows(
  it: VegaItem,
  t: DictBlock,
  lang: Lang,
  withCollar: boolean,
): { k: string; v: string }[] {
  const c = t.catalogUi;
  const miss = c.missing;
  const n = (v: number | null) => (v == null ? miss : fmtNum(v, lang));
  const out: { k: string; v: string }[] = [{ k: c.fDia, v: n(it.diameterMm) }];
  if (withCollar) out.push({ k: c.fCollar, v: n(it.collarDiameterMm) });
  out.push(
    { k: c.fKey, v: it.key.count ? (it.key.count === 1 ? c.keySingle : c.keyDouble) : miss },
    { k: c.fKeyThk, v: n(it.key.thicknessMm) },
    { k: c.fBackToSlot, v: n(it.key.backEndToSlotMm) },
    { k: c.fSlotLen, v: n(it.key.slotLengthMm) },
    { k: c.fRearDia, v: n(it.rearShoulderDiameterMm) },
    { k: c.fLength, v: fmtRange(it.lengthMm, lang) ?? miss },
    { k: c.fWeight, v: fmtRange(it.weightKg, lang) ? `${fmtRange(it.weightKg, lang)} kg` : miss },
  );
  return out;
}

function Detail({
  item: it,
  t,
  lang,
  idx,
}: {
  item: VegaItem;
  t: DictBlock;
  lang: Lang;
  idx: CatalogIndex;
}) {
  const c = t.catalogUi;
  const eq = equivalentsOf(idx, it);
  const clash = partNoClashesOf(idx, it);
  const problems = [
    ...it.quality.map((q) => c.qualityLabels[q] ?? q),
    ...it.reviewFlags.map((f) => c.flagLabels[f] ?? f),
    ...(clash.length
      ? [fill(c.partNoClash, { models: clash.map((x) => x.model).join(', ') })]
      : []),
    ...(it.partNos.some(partNoLooksBroken) ? [c.partNoBroken] : []),
  ];
  const byType = (
    m: Partial<Record<VegaTip, { min: number; max: number }>> | null,
    unit: string,
  ) =>
    m
      ? (Object.keys(m) as VegaTip[])
          .map((k) => `${c.tipLabels[k]} ${fmtRange(m[k] ?? null, lang)}${unit}`)
          .join(' · ')
      : null;
  const lenBy = byType(it.lengthByType, '');
  const wBy = byType(it.weightByType, ' kg');
  return (
    <div className="border-t border-hair pt-4 flex flex-col gap-4">
      {problems.length > 0 && (
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {problems.map((p) => (
            <li key={p} className="font-sans text-sm text-brand-hi">
              {p}
            </li>
          ))}
        </ul>
      )}
      <dl className="m-0 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {rows(it, t, lang, it.collarDiameterMm != null).map((r) => (
          <div key={r.k}>
            <dt className={labelCls}>{r.k}</dt>
            <dd className="m-0 font-sans text-ink">{r.v}</dd>
          </div>
        ))}
        {(lenBy || wBy) && (
          <div className="sm:col-span-2">
            <dt className={labelCls}>{c.byType}</dt>
            <dd className="m-0 font-sans text-sm text-ink-mid">
              {[lenBy && `${c.fLength}: ${lenBy}`, wBy && `${c.fWeight}: ${wBy}`]
                .filter(Boolean)
                .join(' — ')}
            </dd>
          </div>
        )}
        <div className="sm:col-span-2">
          <dt className={labelCls}>{c.fTips}</dt>
          <dd className="m-0 font-sans text-ink">
            {it.tipTypes.map((k) => c.tipLabels[k]).join(', ') || c.missing}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className={labelCls}>{c.fPartNos}</dt>
          <dd className="m-0 font-sans text-ink">
            {it.partNos.length ? it.partNos.join(', ') : c.missing}
            {it.partNos.length > 0 && <CopyButton value={it.partNos.join(', ')} t={t} />}
          </dd>
        </div>
        {it.fitsBreakers.length > 0 && (
          <div className="sm:col-span-2">
            <dt className={labelCls}>{c.fFits}</dt>
            <dd className="m-0 font-sans text-ink">{it.fitsBreakers.join(', ')}</dd>
          </div>
        )}
        {it.extra && (
          <div className="sm:col-span-2">
            <dt className={labelCls}>{c.fOther}</dt>
            <dd className="m-0 font-sans text-ink">{it.extra}</dd>
          </div>
        )}
        {it.notes.length > 0 && (
          <div className="sm:col-span-2">
            <dt className={labelCls}>{c.fNotes}</dt>
            <dd className="m-0 font-sans text-ink">{it.notes.join(' · ')}</dd>
          </div>
        )}
        {eq.length > 0 && (
          <div className="sm:col-span-2">
            <dt className={labelCls}>{c.equivalents}</dt>
            <dd className="m-0 font-sans text-ink">
              {eq
                .map(
                  (x) =>
                    `${x.model}${fmtRange(x.lengthMm, lang) ? ` (${c.fLength} ${fmtRange(x.lengthMm, lang)})` : ''}`,
                )
                .join(' · ')}
              <span className="block text-xs text-ink-mid mt-1">{c.equivalentsHint}</span>
            </dd>
          </div>
        )}
        {it.source.catalogPage != null && (
          <div className="sm:col-span-2">
            <dt className={labelCls}>{c.fSource}</dt>
            <dd className="m-0 font-sans text-ink-mid">
              {fill(c.sourceFmt, { c: it.source.catalogPage, p: it.source.pdfPage ?? '—' })}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function PopularBadge({ it, pop, t }: { it: VegaItem; pop: Popularity; t: DictBlock }) {
  const c = t.catalogUi;
  const tier = pop.tier.get(it);
  if (!tier && !pop.twin.has(it)) return null;
  const label = tier === 1 ? c.popularBadge : tier === 2 ? c.popularBadge2 : c.popularTwin;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-sans text-xs ${
        tier === 1 ? 'border-ok/70 text-ok' : 'border-hair-strong text-ink-mid'
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="m12 2 2.9 6.2 6.8.7-5.1 4.6 1.5 6.7L12 16.8 5.9 20.2l1.5-6.7L2.3 8.9l6.8-.7L12 2Z" />
      </svg>
      {label}
    </span>
  );
}

function Chips({ fields, t, lang }: { fields: FieldScore[]; t: DictBlock; lang: Lang }) {
  const c = t.catalogUi;
  return (
    <ul className="list-none p-0 m-0 flex flex-wrap gap-1.5">
      {fields.map((f) => (
        <li
          key={f.key}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-sans text-xs ${CHIP_CLS[f.state]}`}
        >
          <span>{f.key === 'keyCount' ? c.fKey : c.diffLabels[f.key]}</span>
          <span className="font-medium">
            {f.state === 'unknown'
              ? c.chipUnknown
              : f.key === 'keyCount'
                ? f.state === 'ok'
                  ? '✓'
                  : '✕'
                : `${fmtDiff(f.diff ?? 0, lang)} mm`}
          </span>
        </li>
      ))}
    </ul>
  );
}

function LikelyCard({
  likely,
  t,
  lang,
  idx,
  tol,
  insideTol,
  fields,
  pop,
  open,
  onOpen,
}: {
  likely: NonNullable<ReturnType<typeof mostLikely>>;
  t: DictBlock;
  lang: Lang;
  idx: CatalogIndex;
  tol: number;
  insideTol: boolean;
  fields: FieldScore[];
  pop: Popularity;
  open: boolean;
  onOpen: () => void;
}) {
  const c = t.catalogUi;
  const it = likely.items[0];
  const others = likely.items.slice(1);
  const pct = Math.round(likely.p * 100);
  const lens = likely.items.map((x) => x.lengthMm).filter((r): r is NonNullable<typeof r> => !!r);
  const lenRange = lens.length
    ? fmtRange(
        { min: Math.min(...lens.map((r) => r.min)), max: Math.max(...lens.map((r) => r.max)) },
        lang,
      )
    : null;
  return (
    <section
      aria-label={c.likelyTitle}
      className="border border-brand rounded-[14px] p-5 md:p-6 flex flex-col gap-3 bg-brand-soft"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-brand-hi m-0">
          {c.likelyTitle}
        </h2>
        <span className="font-serif text-2xl text-ink">{fill(c.likelyPct, { p: pct })}</span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-serif text-2xl text-ink m-0 break-words">{it.model}</h3>
          <p className="font-sans text-xs tracking-[0.12em] uppercase text-ink-mid m-0 mt-1">
            {it.brand}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <PopularBadge it={likely.items.find((x) => pop.tier.has(x)) ?? it} pop={pop} t={t} />
          {likely.items.some(needsVerification) && <WarnBadge label={c.warnBadge} />}
        </div>
      </div>
      <p className="font-sans text-ink m-0">
        {summary(it, lang, t)}
        {lenRange && lenRange !== fmtRange(it.lengthMm, lang) && ` (${c.fLength} ${lenRange})`}
      </p>
      {others.length > 0 && (
        <p className="font-sans text-sm text-ink m-0">
          {fill(c.likelyModels, { models: others.map((x) => x.model).join(' · ') })}
        </p>
      )}
      {it.partNos.length > 0 && (
        <p className="font-sans text-sm text-ink-mid m-0">
          {c.fPartNos}: {it.partNos.join(', ')}
          <CopyButton value={it.partNos.join(', ')} t={t} />
        </p>
      )}
      <Chips fields={fields} t={t} lang={lang} />
      {!insideTol && (
        <p className="font-sans text-sm text-brand-hi m-0">
          {fill(c.likelyOutsideTol, { t: tol })}
        </p>
      )}
      {pct < 80 && <p className="font-sans text-sm text-ink-mid m-0">{c.likelyMoreMeasure}</p>}
      {likely.runner && (
        <p className="font-sans text-sm text-ink-mid m-0">
          {fill(c.likelyRunner, {
            model: likely.runner.items[0].model,
            p: Math.round(likely.runner.p * 100),
          })}
        </p>
      )}
      <div>
        <button
          type="button"
          onClick={onOpen}
          aria-expanded={open}
          aria-controls="vc-likely-d"
          className={btnCls}
        >
          {open ? c.hideDetails : c.details}
        </button>
      </div>
      {open && (
        <div id="vc-likely-d">
          <Detail item={it} t={t} lang={lang} idx={idx} />
        </div>
      )}
    </section>
  );
}

/* ── compare ───────────────────────────────────────────────────── */

function CompareTable({
  items,
  t,
  lang,
  onRemove,
  onClose,
}: {
  items: VegaItem[];
  t: DictBlock;
  lang: Lang;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const c = t.catalogUi;
  const all = items.map((it) => rows(it, t, lang, true));
  return (
    <section aria-label={c.compareTitle} className="border border-hair-strong rounded-[14px] p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-serif text-xl text-ink m-0">{c.compareTitle}</h2>
        <button type="button" onClick={onClose} className={btnCls}>
          {c.compareClose}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse font-sans text-sm">
          <thead>
            <tr>
              <th scope="col" className="text-left p-2" />
              {items.map((it) => (
                <th key={it.id} scope="col" className="text-left p-2 align-top">
                  <span className="block font-serif text-base text-ink">{it.model}</span>
                  <span className="block text-xs text-ink-mid font-normal">{it.brand}</span>
                  {needsVerification(it) && (
                    <span className="block mt-1">
                      <WarnBadge label={c.warnBadge} />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(it.id)}
                    aria-label={`${c.compareRemove}: ${it.model}`}
                    className={`mt-2 min-h-8 px-3 rounded-full border border-hair-strong text-xs text-ink-mid hover:text-ink ${focusRing}`}
                  >
                    <span aria-hidden="true">✕ </span>
                    {c.compareRemove}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {all[0].map((row, i) => (
              <tr key={row.k} className="border-t border-hair">
                <th scope="row" className="text-left p-2 font-normal text-ink-mid">
                  {row.k}
                </th>
                {all.map((r, j) => (
                  <td key={items[j].id} className="p-2 text-ink">
                    {r[i]?.v ?? c.missing}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
