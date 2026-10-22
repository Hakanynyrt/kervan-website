import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import type { FxRate } from '@kervan/tips';
import { Container } from '@kervan/ui';
import { useReducedMotion } from '@kervan/motion';
import { OrderSteps, PlantPhotos } from '../components/Bits';
import ExplodedPicker from '../components/ExplodedPicker';
import { PartGroups } from '../components/PartGroups';
import { FOCUS, whatsappHref } from '../components/Layout';
import { CardPrice } from '../components/ModelSearch';
import { priceNote } from '../components/PartOrder';
import { cardHref, cardKey, cardName } from '../lib/card';
import type { Dict } from '../lib/dict';
import { exactHit, findModels, finderName, makesByModels, type FinderHit } from '../lib/finder';
import { fmtNum } from '../lib/format';
import { localePath } from '../lib/locale-path';
import { renderModel } from '../lib/part-caption';
import { findRender, partsForBreaker } from '../lib/part-links';
import { GROUP_COVERS } from '../lib/photos';
import { photoImg } from '../lib/photo-url';
import { fmtDate } from '../lib/price';
import {
  brandPath,
  breakerPath,
  LIST_PATH,
  partItemPath,
  PARTS_PATH,
  POPULAR_PATH,
  type MadeItem,
  type PageModel,
} from '../lib/routes';
import { ORDER_EMAIL } from '../lib/site';
import { tipImg } from '../lib/tip-img';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'home' }>;

/** Make chips shown before "Tüm markalar"; model chips shown before "Tüm … modelleri". */
const MAKES_SHOWN = 16;
const MODELS_SHOWN = 40;
/** Best-selling breakers listed in the empty panel. */
const PANEL_POPULAR = 6;

/** One heading pattern for every home section: h2, optional lead, optional link on the right. */
function SectionHead({
  id,
  title,
  lead,
  link,
}: {
  id: string;
  title: string;
  lead?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 id={id} className="m-0 font-sans text-2xl font-bold text-ink md:text-[1.75rem]">
          {title}
        </h2>
        {lead && <p className="m-0 mt-2 max-w-2xl font-sans text-ink-mid">{lead}</p>}
      </div>
      {link && (
        <a
          href={link.href}
          className={`font-sans text-sm font-medium text-brand-hi hover:underline ${FOCUS}`}
        >
          {link.label} →
        </a>
      )}
    </div>
  );
}

/** Plain clicks are handled on the page; modified clicks (new tab) keep the link. */
const plain = (e: MouseEvent) =>
  !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);

const chip = (on: boolean, strong = false) =>
  `inline-flex items-center rounded-sm border px-2.5 py-1.5 font-sans text-sm ${
    on
      ? strong
        ? 'border-ink bg-ink text-bg'
        : 'border-brand bg-brand text-on-brand'
      : 'border-hair bg-bg text-ink hover:border-hair-strong'
  } ${FOCUS}`;

/** A row of the finder panel: thumbnail, name and detail, the link label on the right. */
function PanelRow({
  href,
  img,
  stage,
  badge,
  title,
  sub,
  action,
  onClick,
}: {
  href: string;
  img: string | null;
  stage: 'tip' | 'part';
  badge?: string;
  title: string;
  sub?: string;
  action: string;
  onClick?: (e: MouseEvent) => void;
}) {
  return (
    <li className="border-b border-hair last:border-b-0">
      <a
        href={href}
        onClick={onClick}
        className={`group flex items-center gap-3 px-4 py-2.5 font-sans ${FOCUS}`}
      >
        <span
          className={`relative block aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-sm border border-hair ${stage === 'tip' ? 'bg-stage' : 'bg-pstage'}`}
        >
          {img && (
            <img
              src={img}
              width={stage === 'tip' ? 800 : 320}
              height={stage === 'tip' ? 533 : 180}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-contain"
            />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-semibold text-ink group-hover:text-brand-hi">{title}</span>
          {sub && <span className="text-xs text-ink-mid tabular-nums">{sub}</span>}
          {badge && <span className="text-xs text-ink-soft">{badge}</span>}
        </span>
        <span className="shrink-0 text-sm font-medium text-brand-hi group-hover:underline">
          {action} →
        </span>
      </a>
    </li>
  );
}

/**
 * "Önce arama": the make/model finder, the panel with the chosen model's parts beside it (under
 * it on phones), and the opening strip under the finder. The prerender (and a visitor without
 * JS) gets the empty state: the box (it sends `?q=` to the tip list), the make chips linking to
 * the make pages, and the best-selling breakers in the panel linking to their pages. With JS a
 * make chip lists its models, a model (picked or typed) fills the panel from `partsForBreaker`.
 * `?q=` on the home opens a typed model, as the old home search box did.
 */
function Finder({
  model,
  lang,
  t,
  strip,
}: {
  model: Model;
  lang: Lang;
  t: Dict;
  strip: React.ReactNode;
}) {
  const h = t.home;
  const f = h.finder;
  const reduce = useReducedMotion();
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState<string | null>(null);
  const [sel, setSel] = useState<FinderHit | null>(null);
  const [allMakes, setAllMakes] = useState(false);
  const [allModels, setAllModels] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const makes = useMemo(() => makesByModels(model.finder), [model.finder]);
  const query = q.trim();
  const found = useMemo(() => (query ? findModels(model.finder, query) : null), [model, query]);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('q');
    if (!v) return;
    setQ(v);
    const r = findModels(model.finder, v);
    setSel(exactHit(r.hits, r.guess ?? v));
    // Only on load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Phones: the panel sits under the chips; bring it up when a model is picked. */
  const show = () =>
    requestAnimationFrame(() => {
      const el = panel.current;
      if (el && el.getBoundingClientRect().top > window.innerHeight * 0.6)
        el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    });
  const pick = (hit: FinderHit) => {
    setSel(hit);
    setBrand(hit.brand);
    show();
  };
  const hitFor = (brandName: string, slug: string): FinderHit | null => {
    const m = model.finder.find((x) => x.brand === brandName)?.models.find((x) => x.slug === slug);
    return m ? { brand: brandName, model: m, name: finderName(brandName, m) } : null;
  };
  const onType = (v: string) => {
    setQ(v);
    const r = v.trim() ? findModels(model.finder, v) : null;
    const exact = r ? exactHit(r.hits, r.guess ?? v) : null;
    if (exact) setSel(exact);
    else if (sel && r && !r.hits.some((x) => x.model.slug === sel.model.slug)) setSel(null);
  };
  const submit = (e: FormEvent) => {
    // Nothing found: the tip list's search takes over (its suggestions and "model not listed").
    if (!found?.hits.length) return;
    e.preventDefault();
    pick(exactHit(found.hits, found.guess ?? query) ?? found.hits[0]);
  };

  const shownMakes = allMakes ? makes : makes.slice(0, MAKES_SHOWN);
  const make = brand ? model.finder.find((x) => x.brand === brand) : undefined;
  const makeModels = make ? (allModels ? make.models : make.models.slice(0, MODELS_SHOWN)) : [];
  const hits = found ? found.hits.slice(0, MODELS_SHOWN) : [];
  const parts = sel ? partsForBreaker(sel.name) : [];
  const many = (sel?.model.tips.length ?? 0) > 1;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-x-10 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        <h1 className="m-0 font-sans text-base font-semibold text-ink-mid">{h.title}</h1>
        <form
          action={localePath(LIST_PATH, lang)}
          method="get"
          role="search"
          onSubmit={submit}
          className="mt-2"
        >
          <h2 className="m-0 font-sans text-2xl font-bold leading-tight text-ink md:text-[2rem]">
            <label htmlFor="finder-q">{f.title}</label>
          </h2>
          <div className="mt-4 flex gap-2">
            <input
              id="finder-q"
              name="q"
              type="search"
              value={q}
              onChange={(e) => onType(e.target.value)}
              placeholder={t.search.placeholder}
              autoComplete="off"
              className={`min-w-0 flex-1 rounded-sm border border-ink-soft bg-bg px-4 py-3 font-sans text-base text-ink placeholder:text-ink-soft ${FOCUS}`}
            />
            <button
              type="submit"
              className={`rounded-sm bg-brand px-6 py-3 font-sans text-sm font-semibold text-on-brand hover:bg-brand-hi ${FOCUS}`}
            >
              {t.search.button}
            </button>
          </div>
        </form>
        <p className="m-0 mt-3 max-w-3xl font-sans text-sm text-ink-mid">{h.lead}</p>

        {found ? (
          <div className="mt-5 font-sans">
            <p className="m-0 text-sm font-semibold text-ink" aria-live="polite">
              {found.hits.length
                ? found.guess
                  ? t.search.didYouMean(found.guess)
                  : `${f.found}: ${t.search.count(found.hits.length)}`
                : t.search.none(query)}
            </p>
            {hits.length > 0 && (
              <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
                {hits.map((x) => (
                  <li key={x.model.slug}>
                    <a
                      href={localePath(breakerPath(x.model.slug), lang)}
                      onClick={(e) => {
                        if (!plain(e)) return;
                        e.preventDefault();
                        pick(x);
                      }}
                      aria-current={sel?.model.slug === x.model.slug ? 'true' : undefined}
                      className={chip(sel?.model.slug === x.model.slug)}
                    >
                      {x.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {found.hits.length > hits.length && (
              <a
                href={`${localePath(LIST_PATH, lang)}?q=${encodeURIComponent(query)}`}
                className={`mt-3 inline-block text-sm font-medium text-brand-hi hover:underline ${FOCUS}`}
              >
                {t.search.count(found.hits.length)} →
              </a>
            )}
          </div>
        ) : null}

        <nav aria-labelledby="finder-makes" className="mt-5 font-sans">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 id="finder-makes" className="m-0 text-sm font-semibold text-ink">
              {f.makes}
            </h3>
            {!allMakes && makes.length > MAKES_SHOWN && (
              <a
                href={localePath(LIST_PATH, lang)}
                onClick={(e) => {
                  if (!plain(e)) return;
                  e.preventDefault();
                  setAllMakes(true);
                }}
                className={`text-sm font-medium text-brand-hi hover:underline ${FOCUS}`}
              >
                {f.allMakes(makes.length)} →
              </a>
            )}
          </div>
          <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
            {shownMakes.map((x) => (
              <li key={x.brand}>
                <a
                  href={localePath(brandPath(x.brand), lang)}
                  onClick={(e) => {
                    if (!plain(e)) return;
                    e.preventDefault();
                    setBrand(x.brand);
                    setAllModels(false);
                    setQ('');
                  }}
                  aria-current={brand === x.brand ? 'true' : undefined}
                  className={chip(brand === x.brand, true)}
                >
                  {x.brand}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {make && !found && (
          <section aria-labelledby="finder-models" className="mt-5 font-sans">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <h3 id="finder-models" className="m-0 text-sm font-semibold text-ink">
                {f.models(make.brand)}
              </h3>
              <a
                href={localePath(brandPath(make.brand), lang)}
                onClick={(e) => {
                  if (allModels || make.models.length <= MODELS_SHOWN || !plain(e)) return;
                  e.preventDefault();
                  setAllModels(true);
                }}
                className={`text-sm font-medium text-brand-hi hover:underline ${FOCUS}`}
              >
                {f.allModels(make.brand, make.models.length)} →
              </a>
            </div>
            <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
              {makeModels.map((m) => (
                <li key={m.slug}>
                  <a
                    href={localePath(breakerPath(m.slug), lang)}
                    onClick={(e) => {
                      if (!plain(e)) return;
                      e.preventDefault();
                      pick({ brand: make.brand, model: m, name: finderName(make.brand, m) });
                    }}
                    aria-current={sel?.model.slug === m.slug ? 'true' : undefined}
                    className={chip(sel?.model.slug === m.slug)}
                  >
                    {m.model}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="m-0 mt-4 max-w-3xl font-sans text-xs text-ink-soft">{f.note}</p>
      </div>

      <aside
        ref={panel}
        aria-labelledby="finder-panel"
        className="scroll-mt-4 self-start overflow-hidden rounded-md border border-hair bg-bg font-sans lg:col-start-2 lg:row-span-2 lg:row-start-1"
      >
        <p className="sr-only" aria-live="polite">
          {sel ? `${sel.name}: ${f.forModel}` : ''}
        </p>
        {sel ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-hair px-4 py-3">
              <div>
                <h2 id="finder-panel" className="m-0 text-lg font-bold text-ink">
                  {sel.name}
                </h2>
                <p className="m-0 text-sm text-ink-mid">{f.forModel}</p>
              </div>
              <a
                href={localePath(breakerPath(sel.model.slug), lang)}
                className={`text-sm font-medium text-brand-hi hover:underline ${FOCUS}`}
              >
                {f.breakerPage} →
              </a>
            </div>
            <ul className="m-0 list-none p-0">
              {sel.model.tips.map((x, i) => (
                <PanelRow
                  key={`tip-${i}`}
                  href={`${localePath(breakerPath(sel.model.slug), lang)}${x.n ? `?uc=${x.n}` : ''}`}
                  img={x.img ? tipImg(x.img) : null}
                  stage="tip"
                  badge={x.sample ? t.list.sampleBadge : undefined}
                  title={many ? `${t.parts.tips.name} · ${f.tipN(i + 1)}` : t.parts.tips.name}
                  sub={
                    x.d === null
                      ? undefined
                      : f.tipSize(fmtNum(x.d, lang), x.len ? fmtNum(x.len, lang) : null)
                  }
                  action={t.card.view}
                />
              ))}
              {parts.map((l) => {
                const r = findRender(l.part, l.anchor);
                const hero = r?.hero ?? GROUP_COVERS[l.part]?.base;
                return (
                  <PanelRow
                    key={`${l.part}-${l.anchor}`}
                    href={localePath(partItemPath(l.part, l.anchor), lang)}
                    img={
                      hero
                        ? photoImg(hero, r?.hero || GROUP_COVERS[l.part]?.xs ? 'xs' : 'lg')
                        : null
                    }
                    stage="part"
                    title={t.parts.items[l.part].name}
                    sub={r?.kind ? t.parts.renderKindShort[r.kind] : undefined}
                    action={t.parts.view}
                  />
                );
              })}
            </ul>
            {parts.length === 0 && (
              <p className="m-0 border-t border-hair px-4 py-3 text-sm text-ink-mid">{f.noParts}</p>
            )}
          </>
        ) : (
          <>
            <div className="border-b border-hair px-4 py-3">
              <h2 id="finder-panel" className="m-0 text-lg font-bold text-ink">
                {f.startTitle}
              </h2>
              <p className="m-0 mt-1 text-sm text-ink-mid">{f.startBody}</p>
            </div>
            {model.featuredArePopular && model.featured.length > 0 && (
              <>
                <h3 className="m-0 px-4 pt-3 text-sm font-semibold text-ink">{f.popular}</h3>
                <ul className="m-0 list-none p-0">
                  {model.featured.slice(0, PANEL_POPULAR).map((c) => (
                    <PanelRow
                      key={cardKey(c)}
                      href={cardHref(c, lang)}
                      onClick={(e) => {
                        const hit = hitFor(c.brand, c.slug);
                        if (!hit || !plain(e)) return;
                        e.preventDefault();
                        pick(hit);
                      }}
                      img={(c.image ?? c.sample) ? tipImg((c.image ?? c.sample)!) : null}
                      badge={!c.image && c.sample ? t.list.sampleBadge : undefined}
                      stage="tip"
                      title={cardName(c, lang)}
                      sub={
                        c.diameterMm === null
                          ? undefined
                          : f.tipSize(fmtNum(c.diameterMm, lang), null)
                      }
                      action={t.card.view}
                    />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair bg-bg-soft px-4 py-3">
          <p className="m-0 text-sm text-ink">{t.missing.title}</p>
          <a
            href={whatsappHref(sel ? t.missing.textFor(sel.name) : t.missing.text)}
            className={`rounded-sm bg-whatsapp px-4 py-2 text-sm font-medium text-white ${FOCUS}`}
          >
            {t.missing.button}
          </a>
        </div>
      </aside>

      <div className="min-w-0 lg:col-start-1 lg:row-start-2">{strip}</div>
    </div>
  );
}

const upFirst = (s: string, lang: Lang) =>
  s.charAt(0).toLocaleUpperCase(lang === 'tr' ? 'tr' : 'en') + s.slice(1);

/** A priced tip or part of "Ürettiklerimizden": picture, what and for which breaker, price. */
function MadeCard({ x, fx, lang, t }: { x: MadeItem; fx: FxRate | null; lang: Lang; t: Dict }) {
  if (x.kind === 'tip') {
    const c = x.card;
    return (
      <a
        href={cardHref(c, lang)}
        className={`group flex h-full flex-col overflow-hidden rounded-md border border-hair bg-bg hover:border-hair-strong ${FOCUS}`}
      >
        {c.image && (
          <img
            src={tipImg(c.image)}
            alt=""
            width={480}
            height={320}
            loading="lazy"
            decoding="async"
            className="block aspect-[3/2] h-auto w-full border-b border-hair bg-stage object-contain"
          />
        )}
        <span className="flex flex-1 flex-col gap-0.5 p-3 font-sans">
          <span className="text-xs text-ink-mid">{t.parts.tips.name}</span>
          <span className="text-sm font-semibold text-ink group-hover:text-brand-hi sm:text-base">
            {cardName(c, lang)}
          </span>
          <CardPrice price={c.price} fx={fx} lang={lang} t={t} />
          <span className="pt-1 text-sm font-medium text-brand-hi group-hover:underline">
            {t.card.view} →
          </span>
        </span>
      </a>
    );
  }
  const r = findRender(x.part, x.anchor);
  const name = t.parts.items[x.part].name;
  const label = r?.kind
    ? t.parts.renderKindShort[r.kind]
    : x.fitted
      ? upFirst(t.parts.fitted.name(name, true), lang)
      : name;
  const note = priceNote(r?.kind, t);
  return (
    <a
      href={localePath(partItemPath(x.part, x.anchor), lang)}
      className={`group flex h-full flex-col overflow-hidden rounded-md border border-hair bg-bg hover:border-hair-strong ${FOCUS}`}
    >
      {r?.hero && (
        <img
          src={photoImg(r.hero, 'xs')}
          alt=""
          width={320}
          height={180}
          loading="lazy"
          decoding="async"
          className="block aspect-[3/2] h-auto w-full border-b border-hair bg-pstage object-contain"
        />
      )}
      <span className="flex flex-1 flex-col gap-0.5 p-3 font-sans">
        <span className="text-xs text-ink-mid">{label}</span>
        <span className="text-sm font-semibold text-ink group-hover:text-brand-hi sm:text-base">
          {r ? renderModel(r, t) : name}
        </span>
        <CardPrice price={[x.cents, x.cents]} fx={fx} lang={lang} t={t} />
        {note && <span className="text-xs text-ink-mid">{note}</span>}
        <span className="pt-1 text-sm font-medium text-brand-hi group-hover:underline">
          {t.parts.view} →
        </span>
      </span>
    </a>
  );
}

export default function Home({
  model,
  fx,
  lang,
  t,
}: {
  model: Model;
  fx: FxRate | null;
  lang: Lang;
  t: Dict;
}) {
  const h = t.home;
  return (
    <>
      <section className="border-b border-hair bg-bg-soft">
        <Container className="py-6 md:py-8">
          {/* Owner's "Önce arama" layout: the finder and its panel first, the opening as a strip
              under the finder, then the thin trust row. */}
          <Finder model={model} lang={lang} t={t} strip={<ExplodedPicker lang={lang} t={t} />} />
          <ul className="m-0 mt-6 grid list-none grid-cols-2 gap-x-4 gap-y-2 border-y border-hair p-0 py-3 font-sans text-[13px] text-ink-mid lg:grid-cols-4 lg:gap-x-0 lg:py-2.5">
            {h.trust.map((x) => (
              <li
                key={x.title}
                className="flex items-center gap-2 border-hair lg:border-l lg:pl-4 lg:first:border-l-0 lg:first:pl-0"
              >
                <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0 text-brand">
                  <path
                    d="M3 8.5l3 3 7-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-medium text-ink">{x.title}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {model.made.length > 0 && (
        <section aria-labelledby="made" className="bg-bg">
          <Container className="py-14 md:py-16">
            <SectionHead
              id="made"
              title={h.made.title}
              lead={h.made.lead}
              link={
                model.featuredArePopular
                  ? { href: localePath(POPULAR_PATH, lang), label: h.morePopular }
                  : undefined
              }
            />
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:gap-4 lg:grid-cols-4">
              {model.made.map((x) => (
                <li key={x.kind === 'tip' ? `tip-${cardKey(x.card)}` : `${x.part}-${x.anchor}`}>
                  <MadeCard x={x} fx={fx} lang={lang} t={t} />
                </li>
              ))}
            </ul>
            <p className="m-0 mt-4 font-sans text-xs text-ink-soft">
              {fx && t.price.fxNote(fmtDate(fx.date, lang))} {t.price.note} {t.renderNote}
            </p>
          </Container>
        </section>
      )}

      <section aria-labelledby="groups" className="border-y border-hair bg-bg-soft">
        <Container className="py-14 md:py-16">
          <SectionHead
            id="groups"
            title={h.groups}
            link={{ href: localePath(PARTS_PATH, lang), label: h.allGroups }}
          />
          <PartGroups tips={model.tips} lang={lang} t={t} list />
        </Container>
      </section>

      <section id="siparis-adimlari" aria-labelledby="order" className="scroll-mt-6 bg-bg">
        <Container className="py-14 md:py-16">
          <SectionHead id="order" title={t.cart.steps.title} />
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
            <div>
              <OrderSteps lang={lang} t={t} className="sm:grid-cols-3" />
            </div>
            <div className="rounded-md border border-hair bg-bg-soft p-5 font-sans text-sm">
              <p className="m-0 text-ink">{h.order.body}</p>
              <div className="mt-4 flex flex-col gap-2.5">
                <a
                  href={whatsappHref(t.nav.quoteText)}
                  className={`rounded-sm bg-whatsapp px-5 py-3 text-center font-medium text-white ${FOCUS}`}
                >
                  {h.order.whatsapp}
                </a>
                <a
                  href={`mailto:${ORDER_EMAIL}`}
                  className={`rounded-sm border border-ink-soft bg-bg px-5 py-3 text-center text-ink hover:bg-bg-warm ${FOCUS}`}
                >
                  {h.order.mail} · {ORDER_EMAIL}
                </a>
              </div>
              <dl className="m-0 mt-4">
                {t.terms.rows.map(([k, v]) => (
                  <div key={k} className="flex gap-4 border-t border-hair py-2">
                    <dt className="w-16 shrink-0 text-ink-mid">{k}</dt>
                    <dd className="m-0 text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </section>

      <div className="border-t border-hair bg-bg-soft">
        <Container className="py-14 md:py-16">
          <PlantPhotos t={t} />
        </Container>
      </div>
    </>
  );
}
