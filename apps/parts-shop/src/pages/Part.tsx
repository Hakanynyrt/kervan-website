import { lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { slugify } from '@kervan/tips';
import { Container } from '@kervan/ui';
import { useReducedMotion } from '@kervan/motion';
import { ORG_EMAIL } from '@kervan/seo';
import {
  Breadcrumb,
  HeroImg,
  ImgNote,
  OemLine,
  PageTitle,
  Photo,
  QtyStepper,
  StickyQuote,
  Terms,
} from '../components/Bits';
import { FOCUS, whatsappHref } from '../components/Layout';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { renderAnchor } from '../lib/part-links';
import { PART_PHOTOS, PART_RENDERS, type PartRender } from '../lib/photos';
import { PARTS_PATH, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'part' }>;

const PartViewer = lazy(() => import('../components/PartViewer'));

const seriesId = (series: string) => `series-${slugify(series)}`;

/** What a render's caption and quote need from the page. */
interface Ctx {
  name: string;
  qty: number;
  tipLinks: Record<string, string>;
  lang: Lang;
  t: Dict;
}

/** One spare-part group: our stock photos and a quote by breaker model. */
export default function Part({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const p = t.parts.items[model.part];
  const [breaker, setBreaker] = useState('');
  // The model last filled in by picking a card: a later pick replaces it, typed text never.
  const picked = useRef('');
  const [qty, setQty] = useState(1);
  const text = t.parts.text(p.name, breaker.trim(), qty);
  const photos = PART_PHOTOS[model.part];
  const renders = PART_RENDERS[model.part];
  const solo = renders.filter((r) => !r.series);
  const series = new Map<string, PartRender[]>();
  for (const r of renders) if (r.series) series.set(r.series, [...(series.get(r.series) ?? []), r]);
  const pics = photos.length + renders.length > 0;
  const ctx: Ctx = { name: p.name, qty, tipLinks: model.tipLinks ?? {}, lang, t };
  const onPick = (m: string) => {
    if (breaker.trim() === '' || breaker === picked.current) {
      picked.current = m;
      setBreaker(m);
    }
  };
  return (
    <Container className="pb-28 pt-8 lg:pb-12 lg:pt-12">
      <Breadcrumb trail={[[t.parts.title, PARTS_PATH]]} current={p.name} lang={lang} t={t} />
      <PageTitle>{p.name}</PageTitle>
      <OemLine t={t} />
      <p className="m-0 mt-3 max-w-3xl font-sans text-ink-mid">{p.body}</p>
      {series.size > 1 && (
        <nav aria-label={t.parts.series.jump} className="mt-5 font-sans text-sm">
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {[...series.keys()].map((s) => (
              <li key={s}>
                <a
                  href={`#${seriesId(s)}`}
                  className={`inline-flex min-h-11 items-center rounded-sm border border-hair bg-bg px-3 text-ink hover:border-hair-strong ${FOCUS}`}
                >
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div
        className={`mt-8 grid gap-8 lg:gap-10 ${pics ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : 'max-w-md'}`}
      >
        {pics && (
          <div className="flex min-w-0 flex-col gap-6">
            {solo.map((r) => (
              <RenderFigure key={r.hero ?? r.model} r={r} ctx={ctx} id={renderAnchor(r)} />
            ))}
            {[...series].map(([name, list], k) => (
              <SeriesPicker
                key={name}
                series={name}
                list={list}
                ctx={ctx}
                onPick={onPick}
                lazy={solo.length > 0 || k > 0}
              />
            ))}
            {renders.length > 0 && <ImgNote t={t} kind="render" />}
            {photos.length > 0 && (
              <div>
                <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
                  {photos.map((base, i) => (
                    <li key={base}>
                      <Photo
                        base={base}
                        alt={`${t.parts.photosAlt(p.name)} (${i + 1})`}
                        lazy={i > 0}
                      />
                    </li>
                  ))}
                </ul>
                <ImgNote t={t} kind="photo" className="mt-2" />
              </div>
            )}
          </div>
        )}
        <aside className={pics ? 'lg:col-start-2' : undefined}>
          <div className="lg:sticky lg:top-6">
            <div className="rounded-md border border-hair-strong bg-bg p-5 font-sans text-sm">
              <p className="m-0 text-lg font-bold text-ink">{t.parts.quoteTitle}</p>
              <p className="m-0 mt-2 text-ink-mid">{t.parts.quoteBody}</p>
              <label htmlFor="breaker" className="mt-4 block font-semibold text-ink">
                {t.parts.modelLabel}
              </label>
              <input
                id="breaker"
                type="text"
                value={breaker}
                onChange={(e) => setBreaker(e.target.value)}
                placeholder={t.parts.modelPlaceholder}
                autoComplete="off"
                className={`mt-2 w-full rounded-sm border border-ink-soft bg-bg px-3 py-2.5 text-base text-ink placeholder:text-ink-soft ${FOCUS}`}
              />
              <label htmlFor="qty" className="mb-2 mt-4 block font-semibold text-ink">
                {t.family.qty}
              </label>
              <QtyStepper id="qty" value={qty} onChange={setQty} label={t.family.qty} t={t} />
              <div className="mt-4 flex flex-col gap-3">
                <a
                  href={whatsappHref(text)}
                  className={`rounded-sm bg-whatsapp px-5 py-3 text-center font-medium text-white ${FOCUS}`}
                >
                  {t.family.whatsapp}
                </a>
                <a
                  href={`mailto:${ORG_EMAIL}?subject=${encodeURIComponent(breaker.trim() ? `${p.name} – ${breaker.trim()}` : p.name)}&body=${encodeURIComponent(text)}`}
                  className={`rounded-sm border border-ink-soft px-5 py-3 text-center text-ink hover:bg-bg-warm ${FOCUS}`}
                >
                  {t.family.email}
                </a>
              </div>
            </div>
            <div className="mt-6">
              <Terms t={t} />
            </div>
          </div>
        </aside>
      </div>
      <StickyQuote text={text} t={t} />
    </Container>
  );
}

/** The breaker model a render fits, with its variant (e.g. old type) when it has one. */
const renderModel = (r: PartRender, t: Dict) =>
  r.variant ? `${r.model} (${t.parts.renderVariant[r.variant]})` : r.model;

/**
 * One modelled part: showcase picture (with "3B incele" when it has a 3D model), views,
 * caption, then a quote for exactly this model and its breaker's tip page when the shop has one.
 */
function RenderFigure({
  r,
  ctx,
  id,
  lazy = false,
}: {
  r: PartRender;
  ctx: Ctx;
  id?: string;
  /** Further down the page: every picture may load lazily. */
  lazy?: boolean;
}) {
  const { t } = ctx;
  const [open3d, setOpen3d] = useState(false);
  const model = renderModel(r, t);
  const caption = r.kind
    ? `${model} ${t.parts.renderKind[r.kind]}`
    : t.parts.renderCaption(model, ctx.name);
  const tip = ctx.tipLinks[renderAnchor(r)];
  return (
    <figure id={id} className="m-0 scroll-mt-4">
      {r.hero && (
        <div className="mb-4">
          {open3d && r.model3d ? (
            <Suspense fallback={<div className="aspect-video w-full rounded-md bg-stage" />}>
              <PartViewer src={r.model3d} label={caption} t={t} />
            </Suspense>
          ) : (
            <div className="relative">
              <HeroImg base={r.hero} alt={caption} lazy={lazy} />
              {r.model3d && (
                <button
                  type="button"
                  onClick={() => setOpen3d(true)}
                  className={`absolute bottom-3 right-3 cursor-pointer rounded-sm bg-brand px-4 py-2.5 font-sans text-sm font-medium text-white hover:bg-brand-hi ${FOCUS}`}
                >
                  {t.parts.viewer.open}
                </button>
              )}
            </div>
          )}
          {open3d && (
            <button
              type="button"
              onClick={() => setOpen3d(false)}
              className={`mt-2 cursor-pointer font-sans text-sm text-ink-mid underline hover:text-ink ${FOCUS}`}
            >
              {t.parts.viewer.close}
            </button>
          )}
        </div>
      )}
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
        {r.views.map((v, i) => (
          <li key={v.base} className={i === 0 && !r.hero ? 'sm:col-span-2' : undefined}>
            <Photo
              base={v.base}
              alt={`${caption}, ${t.parts.renderView[v.view]}`}
              lazy={lazy || i > 0}
              single
            />
          </li>
        ))}
      </ul>
      <figcaption className="mt-2 font-sans">
        <span className="block text-base font-semibold text-ink">{caption}</span>
        <span className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <a
            href={whatsappHref(
              t.parts.text(r.kind ? t.parts.renderKind[r.kind] : ctx.name, model, ctx.qty),
            )}
            className={`inline-flex min-h-11 items-center font-medium text-brand-hi underline decoration-hair-strong underline-offset-4 hover:decoration-brand ${FOCUS}`}
          >
            {t.parts.quoteThis}
          </a>
          {tip && (
            <a
              href={localePath(tip, ctx.lang)}
              className={`inline-flex min-h-11 items-center font-medium text-brand-hi underline decoration-hair-strong underline-offset-4 hover:decoration-brand ${FOCUS}`}
            >
              {t.parts.tipLink} →
            </a>
          )}
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Models of one breaker series: a sideways strip of showcase thumbnails picks the one shown.
 * One tab stop for the strip (arrow keys, Home and End move the choice); each card has an id,
 * so `#mtb-65` in the URL opens that model and picking one writes its hash.
 */
function SeriesPicker({
  series,
  list,
  ctx,
  onPick,
  lazy,
}: {
  series: string;
  list: PartRender[];
  ctx: Ctx;
  onPick: (model: string) => void;
  /** Not the first gallery on the page. */
  lazy: boolean;
}) {
  const { t } = ctx;
  const [i, setI] = useState(0);
  const strip = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();
  const show = (k: number, smooth: boolean) =>
    strip.current?.children[k]?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: smooth && !reduced ? 'smooth' : 'auto',
    });
  const pick = (n: number, focus = false) => {
    const k = (n + list.length) % list.length;
    setI(k);
    onPick(renderModel(list[k], t));
    show(k, true);
    try {
      history.replaceState(null, '', `#${renderAnchor(list[k])}`);
    } catch {
      /* sandboxed: the hash is a convenience */
    }
    if (focus) strip.current?.querySelectorAll('button')[k]?.focus({ preventScroll: true });
  };
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const k = hash ? list.findIndex((r) => renderAnchor(r) === hash) : -1;
    if (k < 0) return;
    setI(k);
    onPick(renderModel(list[k], t));
    show(k, false);
    // Only on load: picking later writes the hash itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const to =
      e.key === 'ArrowRight'
        ? i + 1
        : e.key === 'ArrowLeft'
          ? i - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? list.length - 1
              : null;
    if (to === null) return;
    e.preventDefault();
    pick(to, true);
  };
  const id = seriesId(series);
  const arrow = `cursor-pointer rounded-sm border border-ink-soft bg-bg px-3 py-1.5 text-ink hover:bg-bg-warm ${FOCUS}`;
  return (
    <section aria-labelledby={id} className="mt-4 scroll-mt-4 border-t border-hair pt-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id={id} className="m-0 font-sans text-xl font-bold text-ink">
            {t.parts.series.title(series)}
          </h2>
          <p className="m-0 mt-1 font-sans text-sm text-ink-mid">{t.parts.series.hint}</p>
        </div>
        <div className="flex shrink-0 gap-2 font-sans text-sm">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => pick(i - 1)}
            aria-label={t.parts.series.prev}
            className={arrow}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => pick(i + 1)}
            aria-label={t.parts.series.next}
            className={arrow}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
      <ul
        ref={strip}
        onKeyDown={onKey}
        className="m-0 mt-3 flex list-none snap-x snap-mandatory gap-3 overflow-x-auto p-1 pb-3"
      >
        {list.map((r, k) => (
          <li
            key={r.hero ?? r.model}
            id={renderAnchor(r)}
            className="w-36 shrink-0 scroll-mt-24 snap-start sm:w-40"
          >
            <button
              type="button"
              onClick={() => pick(k)}
              aria-pressed={k === i}
              tabIndex={k === i ? 0 : -1}
              className={`block w-full cursor-pointer rounded-md border-2 bg-bg p-0 text-left ${k === i ? 'border-brand' : 'border-hair hover:border-ink-soft'} ${FOCUS}`}
            >
              {r.hero && (
                <img
                  src={`${r.hero}-xs.webp`}
                  width={320}
                  height={180}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full rounded-t-[4px] bg-stage"
                />
              )}
              <span className="block px-2 py-1.5 font-sans text-sm font-semibold text-ink">
                {renderModel(r, t)}
                {r.kind && (
                  <span className="block font-normal text-ink-mid">
                    {t.parts.renderKindShort[r.kind]}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <RenderFigure key={list[i].hero ?? list[i].model} r={list[i]} ctx={ctx} lazy={lazy} />
      </div>
    </section>
  );
}
