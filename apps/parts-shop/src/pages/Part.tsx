import { lazy, Suspense, useRef, useState } from 'react';
import { Container } from '@kervan/ui';
import { useReducedMotion } from '@kervan/motion';
import { ORG_EMAIL } from '@kervan/seo';
import {
  Breadcrumb,
  Chips,
  HeroImg,
  ImgNote,
  OemLine,
  PageTitle,
  Photo,
  QTY,
  StickyQuote,
  Terms,
  type Qty,
} from '../components/Bits';
import { FOCUS, whatsappHref } from '../components/Layout';
import type { Dict } from '../lib/dict';
import { PART_PHOTOS, PART_RENDERS, type PartRender } from '../lib/photos';
import { PARTS_PATH, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'part' }>;

const PartViewer = lazy(() => import('../components/PartViewer'));

/** One spare-part group: our stock photos and a quote by breaker model. */
export default function Part({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const p = t.parts.items[model.part];
  const [breaker, setBreaker] = useState('');
  const [qty, setQty] = useState<Qty>('1');
  const text = t.parts.text(p.name, breaker.trim(), qty);
  const photos = PART_PHOTOS[model.part];
  const renders = PART_RENDERS[model.part];
  const solo = renders.filter((r) => !r.series);
  const series = new Map<string, PartRender[]>();
  for (const r of renders) if (r.series) series.set(r.series, [...(series.get(r.series) ?? []), r]);
  const pics = photos.length + renders.length > 0;
  return (
    <Container className="pb-28 pt-8 lg:pb-12 lg:pt-12">
      <Breadcrumb trail={[[t.parts.title, PARTS_PATH]]} current={p.name} lang={lang} t={t} />
      <PageTitle>{p.name}</PageTitle>
      <OemLine t={t} />
      <p className="m-0 mt-3 max-w-3xl font-sans text-ink-mid">{p.body}</p>

      <div
        className={`mt-8 grid gap-8 lg:gap-10 ${pics ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : 'max-w-md'}`}
      >
        {pics && (
          <div className="flex min-w-0 flex-col gap-6">
            {solo.map((r) => (
              <RenderFigure key={r.hero ?? r.model} r={r} name={p.name} t={t} />
            ))}
            {[...series].map(([name, list]) => (
              <SeriesPicker key={name} series={name} list={list} part={p.name} t={t} />
            ))}
            {photos.length > 0 && (
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
            )}
            <ImgNote t={t} />
          </div>
        )}
        <aside className={pics ? 'lg:col-start-2' : undefined}>
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
            <div className="mt-4">
              <Chips
                legend={t.family.qty}
                name="qty"
                options={QTY.map((x) => ({ value: x, label: x }))}
                value={qty}
                onChange={setQty}
              />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={whatsappHref(text)}
                className={`rounded-sm bg-whatsapp px-5 py-3 text-center font-medium text-white ${FOCUS}`}
              >
                {t.family.whatsapp}
              </a>
              <a
                href={`mailto:${ORG_EMAIL}?subject=${encodeURIComponent(p.name)}&body=${encodeURIComponent(text)}`}
                className={`rounded-sm border border-ink-soft px-5 py-3 text-center text-ink hover:bg-bg-warm ${FOCUS}`}
              >
                {t.family.email}
              </a>
            </div>
          </div>
          <div className="mt-6">
            <Terms t={t} />
          </div>
        </aside>
      </div>
      <StickyQuote text={text} t={t} />
    </Container>
  );
}

/** One modelled part: showcase picture (with "3B incele" when it has a 3D model), views, caption. */
function RenderFigure({ r, name, t }: { r: PartRender; name: string; t: Dict }) {
  const [open3d, setOpen3d] = useState(false);
  const caption = r.kind
    ? `${r.model} ${t.parts.renderKind[r.kind]}`
    : t.parts.renderCaption(r.model, name);
  return (
    <figure className="m-0">
      {r.hero && (
        <div className="mb-4">
          {open3d && r.model3d ? (
            <Suspense fallback={<div className="aspect-video w-full rounded-md bg-stage" />}>
              <PartViewer src={r.model3d} label={caption} t={t} />
            </Suspense>
          ) : (
            <div className="relative">
              <HeroImg base={r.hero} alt={caption} />
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
            <Photo base={v.base} alt={`${caption}, ${t.parts.renderView[v.view]}`} lazy={i > 0} />
          </li>
        ))}
      </ul>
      <figcaption className="mt-2 font-sans text-base font-semibold text-ink">{caption}</figcaption>
    </figure>
  );
}

/** Models of one breaker series: a sideways strip of showcase thumbnails picks the one shown. */
function SeriesPicker({
  series,
  list,
  part,
  t,
}: {
  series: string;
  list: PartRender[];
  part: string;
  t: Dict;
}) {
  const [i, setI] = useState(0);
  const strip = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();
  const pick = (n: number) => {
    const k = (n + list.length) % list.length;
    setI(k);
    strip.current?.children[k]?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: reduced ? 'auto' : 'smooth',
    });
  };
  const id = `series-${series.toLowerCase()}`;
  const arrow = `cursor-pointer rounded-sm border border-ink-soft bg-bg px-3 py-1.5 text-ink hover:bg-bg-warm ${FOCUS}`;
  return (
    <section aria-labelledby={id} className="mt-4 border-t border-hair pt-6">
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
            onClick={() => pick(i - 1)}
            aria-label={t.parts.series.prev}
            className={arrow}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
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
        className="m-0 mt-3 flex list-none snap-x snap-mandatory gap-3 overflow-x-auto p-0 pb-3"
      >
        {list.map((r, k) => (
          <li key={r.model} className="w-36 shrink-0 snap-start sm:w-40">
            <button
              type="button"
              onClick={() => pick(k)}
              aria-pressed={k === i}
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
                {r.model}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <RenderFigure key={list[i].model} r={list[i]} name={part} t={t} />
      </div>
    </section>
  );
}
