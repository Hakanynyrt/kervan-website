import { useEffect, useMemo, useRef, useState } from 'react';
import type { DictBlock, Lang, VegaCatalog, VegaItem, VegaTip } from '../../types';
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

interface Props {
  t: DictBlock;
  lang: Lang;
  status: CatalogStatus;
  catalog: VegaCatalog | null;
  retry: () => void;
}

const PAGE = 40;
const MAX_COMPARE = 3;
const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';
const inputCls = `w-full min-h-11 bg-bg-soft border border-ink-soft rounded-md px-3 font-sans text-ink placeholder:text-ink-mid ${focusRing}`;
const labelCls = 'font-sans text-xs tracking-[0.12em] uppercase text-ink-mid';
const btnCls = `min-h-11 px-4 rounded-full border border-hair-strong font-sans text-sm text-ink hover:border-ink-mid transition-colors ${focusRing}`;

const MEASURE_FIELDS: { key: MeasureKey; label: keyof DictBlock['catalogUi'] }[] = [
  { key: 'dia', label: 'measureDia' },
  { key: 'keyThk', label: 'measureKeyThk' },
  { key: 'backToSlot', label: 'measureBackToSlot' },
  { key: 'slotLen', label: 'measureSlotLen' },
  { key: 'rearDia', label: 'measureRearDia' },
  { key: 'length', label: 'measureLength' },
];

const fill = (tpl: string, vars: Record<string, string | number>): string =>
  Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), tpl);

export default function CatalogTab({ t, lang, status, catalog, retry }: Props) {
  const c = t.catalogUi;
  const [text, setText] = useState('');
  const [brand, setBrand] = useState('');
  const [tip, setTip] = useState<VegaTip | ''>('');
  const [hideLow, setHideLow] = useState(false);
  const [raw, setRaw] = useState<Record<MeasureKey, string>>({
    dia: '',
    keyThk: '',
    backToSlot: '',
    slotLen: '',
    rearDia: '',
    length: '',
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
  const results = useMemo(
    () => (items ? searchCatalog(items, { text, brand, tip, hideLow, measure, tol }) : null),
    [items, text, brand, tip, hideLow, measure, tol],
  );

  useEffect(() => setLimit(PAGE), [text, brand, tip, hideLow, measure, tol]);

  if (status === 'idle' || status === 'loading') {
    return (
      <p className="font-sans text-ink-mid" role="status">
        {c.loading}
      </p>
    );
  }
  if (status !== 'ready' || !catalog || !items || !results) {
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
    setRaw({ dia: '', keyThk: '', backToSlot: '', slotLen: '', rearDia: '', length: '' });
    setKeyCount('');
  };

  const renderHits = (hits: Hit[], max: number) =>
    hits
      .slice(0, max)
      .map((h) => (
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
        />
      ));

  const groupDefs: { g: Group; title: string; hint?: string }[] = [
    { g: 'match', title: c.groupMatch },
    { g: 'maybe', title: c.groupMaybe, hint: c.groupMaybeHint },
    { g: 'wear', title: c.groupWear, hint: c.groupWearHint },
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
      </div>

      {/* Measure form */}
      <fieldset className="border border-hair rounded-[14px] p-5 md:p-6 m-0 min-w-0">
        <legend className="px-2 font-serif text-xl text-ink">{c.measureTitle}</legend>
        <p className="font-sans text-sm text-ink-mid mt-0 mb-5 max-w-[70ch]">{c.measureHint}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MEASURE_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-2">
              <label htmlFor={`vc-m-${key}`} className={labelCls}>
                {c[label] as string}
              </label>
              <input
                id={`vc-m-${key}`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={raw[key]}
                onChange={(e) => setRaw({ ...raw, [key]: e.target.value })}
                aria-invalid={raw[key].trim() !== '' && parseNum(raw[key]) === undefined}
                aria-describedby={
                  raw[key].trim() !== '' && parseNum(raw[key]) === undefined
                    ? `vc-m-${key}-e`
                    : undefined
                }
                className={inputCls}
              />
              {raw[key].trim() !== '' && parseNum(raw[key]) === undefined && (
                <span id={`vc-m-${key}-e`} className="font-sans text-xs text-err">
                  {c.invalidNumber}
                </span>
              )}
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <label htmlFor="vc-m-kc" className={labelCls}>
              {c.measureKeyCount}
            </label>
            <select
              id="vc-m-kc"
              value={keyCount}
              onChange={(e) => setKeyCount(e.target.value as '' | '1' | '2')}
              className={inputCls}
            >
              <option value="">{c.keyAny}</option>
              <option value="1">{c.keySingle}</option>
              <option value="2">{c.keyDouble}</option>
            </select>
          </div>
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
        <div className="mt-5">
          <button type="button" onClick={clearMeasure} className={btnCls}>
            {c.clear}
          </button>
        </div>
      </fieldset>

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
        {sel.length >= MAX_COMPARE && <> · {fill(c.compareMax, { n: MAX_COMPARE })}</>}
      </p>

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

      {((results.measuring &&
        results.groups.match.length + results.groups.maybe.length + results.groups.wear.length >
          limit) ||
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
}: {
  hit: Hit;
  t: DictBlock;
  lang: Lang;
  open: boolean;
  onOpen: () => void;
  selected: boolean;
  canSelect: boolean;
  onSelect: () => void;
}) {
  const c = t.catalogUi;
  const it = hit.item;
  const diffEntries = Object.entries(hit.diffs) as [MeasureKey, number][];
  const panelId = `vc-d-${it.id}`;
  return (
    <li className="bg-bg-soft border border-hair rounded-[14px] p-5 flex flex-col gap-3 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-serif text-xl text-ink m-0 break-words">{it.model}</h3>
          <p className="font-sans text-xs tracking-[0.12em] uppercase text-ink-mid m-0 mt-1">
            {it.brand}
          </p>
        </div>
        {needsVerification(it) && <WarnBadge label={c.warnBadge} />}
      </div>
      <p className="font-sans text-ink m-0">{summary(it, lang, t)}</p>
      {diffEntries.length > 0 && (
        <p className="font-sans text-sm text-ink-mid m-0">
          {diffEntries.map(([k, d]) => `${c.diffLabels[k]} ${fmtDiff(d, lang)}`).join(' · ')} mm
        </p>
      )}
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
          <Detail item={it} t={t} lang={lang} />
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

function Detail({ item: it, t, lang }: { item: VegaItem; t: DictBlock; lang: Lang }) {
  const c = t.catalogUi;
  const problems = [
    ...it.quality.map((q) => c.qualityLabels[q] ?? q),
    ...it.reviewFlags.map((f) => c.flagLabels[f] ?? f),
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
