import { useContext, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import type { FxRate } from '@kervan/tips';
import { Container } from '@kervan/ui';
import { useReducedMotion } from '@kervan/motion';
import { OrderSteps, PlantPhotos } from '../components/Bits';
import { BreakerSearch, FinderPick } from '../components/BreakerSearch';
import ExplodedPicker from '../components/ExplodedPicker';
import { PartGroups } from '../components/PartGroups';
import { FOCUS, whatsappHref } from '../components/Layout';
import { CardPrice } from '../components/ModelSearch';
import { priceNote } from '../components/PartOrder';
import { cardHref, cardKey, cardName, cardPic } from '../lib/card';
import type { Dict } from '../lib/dict';
import { finderName, makesByModels, type FinderHit } from '../lib/finder';
import { fmtNum } from '../lib/format';
import { localePath } from '../lib/locale-path';
import { NUMBERED } from '../lib/opening';
import { renderModel, renderTitle } from '../lib/part-caption';
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
    <div className="mb-3.5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 md:mb-[18px]">
      <div>
        <h2
          id={id}
          className="m-0 font-sans text-[22px] font-bold leading-tight text-ink md:text-[26px]"
        >
          {title}
        </h2>
        {lead && <p className="m-0 mt-1.5 max-w-2xl font-sans text-ink-mid">{lead}</p>}
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
  `inline-flex min-h-11 items-center rounded-sm border px-2.5 font-sans text-sm sm:min-h-9 sm:px-[11px] ${
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
 * Under the opening: the h1 and the lead, the make chips (a make lists its models), the order box
 * and the trust points; beside them (under the chips on phones) the panel: the best-selling
 * breakers until a model is picked, then that model's tip and the parts we make for it. A model
 * is picked here (make, model and best-seller rows), in the header search or in the panel's own
 * box on small screens (`FinderPick`, shared through the layout). The prerender (and a visitor
 * without JS) gets the empty state: the make chips link to the make pages, the best-selling
 * breakers to their pages.
 */
function Finder({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const h = t.home;
  const f = h.finder;
  const reduce = useReducedMotion();
  const pick = useContext(FinderPick);
  const sel = pick?.sel ?? null;
  const [brand, setBrand] = useState<string | null>(null);
  const [allMakes, setAllMakes] = useState(false);
  const [allModels, setAllModels] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const makes = useMemo(() => makesByModels(model.finder), [model.finder]);

  // A model picked anywhere shows its make's models here.
  useEffect(() => {
    if (sel) setBrand(sel.brand);
  }, [sel]);
  // Bring the panel up when a pick asks for it (it sits under the chips on phones, and the header
  // search may be used anywhere on the page).
  const shown = pick?.shown ?? 0;
  useEffect(() => {
    if (!shown) return;
    requestAnimationFrame(() => {
      const top = panel.current?.getBoundingClientRect().top;
      if (top !== undefined && (top < 0 || top > window.innerHeight * 0.7))
        panel.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    });
  }, [shown, reduce]);

  const choose = (hit: FinderHit) => pick?.select(hit, true);
  const hitFor = (brandName: string, slug: string): FinderHit | null => {
    const m = model.finder.find((x) => x.brand === brandName)?.models.find((x) => x.slug === slug);
    return m ? { brand: brandName, model: m, name: finderName(brandName, m) } : null;
  };

  const shownMakes = allMakes ? makes : makes.slice(0, MAKES_SHOWN);
  const make = brand ? model.finder.find((x) => x.brand === brand) : undefined;
  const makeModels = make ? (allModels ? make.models : make.models.slice(0, MODELS_SHOWN)) : [];
  const parts = sel ? partsForBreaker(sel.name) : [];
  const many = (sel?.model.tips.length ?? 0) > 1;

  return (
    <section aria-labelledby="home-title" className="border-b border-hair bg-bg">
      <Container
        wide
        className="grid grid-cols-[minmax(0,1fr)] pb-7 pt-[18px] max-md:px-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-x-9 lg:pb-[30px] lg:pt-6 xl:grid-cols-[minmax(0,1fr)_27rem] xl:gap-x-12"
      >
        {/* Phones and tablets: one column, the panel after the makes; desktop: two. */}
        <div className="contents lg:block lg:min-w-0">
          <h1
            id="home-title"
            className="m-0 font-sans text-[21px] font-normal leading-tight text-ink max-lg:order-1 md:text-[26px]"
          >
            {h.title}
          </h1>
          <p className="m-0 mt-1.5 max-w-[860px] font-sans text-sm text-ink-mid max-lg:order-2 md:text-[15px]">
            {h.lead}
          </p>

          <nav
            aria-labelledby="finder-makes"
            className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-2 font-sans max-lg:order-3 md:mt-[18px] md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start md:gap-x-3.5"
          >
            <h2 id="finder-makes" className="m-0 text-[15px] font-semibold text-ink md:leading-9">
              {f.makes}
            </h2>
            {!allMakes && makes.length > MAKES_SHOWN && (
              <a
                href={localePath(LIST_PATH, lang)}
                onClick={(e) => {
                  if (!plain(e)) return;
                  e.preventDefault();
                  setAllMakes(true);
                }}
                className={`whitespace-nowrap text-sm font-medium text-brand-hi hover:underline md:col-start-3 md:row-start-1 md:leading-9 ${FOCUS}`}
              >
                {f.allMakes(makes.length)} →
              </a>
            )}
            <ul className="col-span-2 m-0 flex list-none flex-wrap gap-2 p-0 md:col-span-1 md:col-start-2 md:row-start-1">
              {shownMakes.map((x) => (
                <li key={x.brand}>
                  <a
                    href={localePath(brandPath(x.brand), lang)}
                    onClick={(e) => {
                      if (!plain(e)) return;
                      e.preventDefault();
                      setBrand(x.brand);
                      setAllModels(false);
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

          {make && (
            <section aria-labelledby="finder-models" className="mt-4 font-sans max-lg:order-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <h3 id="finder-models" className="m-0 text-[15px] font-semibold text-ink">
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
                        choose({ brand: make.brand, model: m, name: finderName(make.brand, m) });
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
          <p className="m-0 mt-3 max-w-3xl font-sans text-[12.5px] text-ink-soft max-lg:order-5">
            {f.note}
          </p>

          <aside
            aria-labelledby="order-box"
            className="mt-4 grid grid-cols-[minmax(0,1fr)] items-center gap-x-6 gap-y-2.5 rounded-md border border-hair bg-bg px-3.5 py-3.5 font-sans max-lg:order-7 md:mt-5 md:grid-cols-[minmax(0,1fr)_auto] md:px-4"
          >
            <div>
              <h2 id="order-box" className="m-0 text-base font-bold text-ink">
                {h.order.title}
              </h2>
              <p className="m-0 mt-0.5 text-sm text-ink-mid">
                {h.order.body}{' '}
                <a
                  href="#siparis-adimlari"
                  className={`font-medium text-brand-hi hover:underline ${FOCUS}`}
                >
                  {t.banner.how}
                </a>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:flex">
              <a
                href={whatsappHref(t.nav.quoteText)}
                className={`inline-flex min-h-[42px] items-center justify-center whitespace-nowrap rounded-sm bg-whatsapp px-2 text-sm font-medium text-white md:px-[18px] ${FOCUS}`}
              >
                {h.order.whatsapp}
              </a>
              <a
                href={`mailto:${ORDER_EMAIL}`}
                className={`inline-flex min-h-[42px] items-center justify-center whitespace-nowrap rounded-sm border border-ink-soft bg-bg px-2 text-sm text-ink hover:bg-bg-warm md:px-[18px] ${FOCUS}`}
              >
                {h.order.mail}
              </a>
            </div>
          </aside>

          <ul className="m-0 mt-[18px] grid list-none grid-cols-2 gap-x-4 gap-y-2.5 border-t border-hair p-0 pt-3.5 font-sans max-lg:order-8 md:mt-[22px] md:gap-x-8 md:gap-y-3.5 md:pt-[18px]">
            {h.trust.map((x) => (
              <li key={x.title} className="grid grid-cols-[18px_minmax(0,1fr)] gap-x-2.5 gap-y-0.5">
                <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-[3px] size-4 text-brand">
                  <path
                    d="M3 8.5l3 3 7-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[13.5px] font-semibold text-ink md:text-sm">{x.title}</span>
                <span className="col-start-2 hidden text-[13px] text-ink-mid md:block">
                  {x.body}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <aside
          ref={panel}
          aria-labelledby="finder-panel"
          className="mt-[18px] scroll-mt-4 rounded-md border border-hair bg-bg font-sans max-lg:order-6 lg:col-start-2 lg:row-start-1 lg:mt-0"
        >
          <p className="sr-only" aria-live="polite">
            {sel ? `${sel.name}: ${f.forModel}` : ''}
          </p>
          {sel ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-hair px-4 py-3">
                <div>
                  <h2 id="finder-panel" className="m-0 text-[17px] font-bold text-ink">
                    {sel.name}
                  </h2>
                  <p className="m-0 mt-0.5 text-[13.5px] text-ink-mid">{f.forModel}</p>
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
                    img={cardPic(x)?.src ?? null}
                    stage="tip"
                    badge={cardPic(x)?.sample ? t.list.sampleBadge : undefined}
                    title={many ? `${t.parts.tips.name} · ${f.tipN(i + 1)}` : t.parts.tips.name}
                    sub={x.d === null ? undefined : t.tipSize(fmtNum(x.d, lang), x.ord ?? null)}
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
                <p className="m-0 border-t border-hair px-4 py-3 text-sm text-ink-mid">
                  {f.noParts}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="border-b border-hair px-4 py-3">
                <h2 id="finder-panel" className="m-0 text-[17px] font-bold text-ink">
                  {f.startTitle}
                </h2>
                <p className="m-0 mt-1 text-[13.5px] text-ink-mid">{f.startBody}</p>
                {/* Small screens: the header box is far above, so the panel has its own. */}
                <BreakerSearch
                  lang={lang}
                  t={t}
                  id="kv-q-panel"
                  finder={model.finder}
                  landmark={false}
                  className="mt-3 lg:hidden"
                />
              </div>
              {model.featuredArePopular && model.featured.length > 0 && (
                <>
                  <h3 className="m-0 px-4 pb-0.5 pt-3 text-sm font-semibold text-ink">
                    {f.popular}
                  </h3>
                  <ul className="m-0 list-none p-0">
                    {model.featured.slice(0, PANEL_POPULAR).map((c) => (
                      <PanelRow
                        key={cardKey(c)}
                        href={cardHref(c, lang)}
                        onClick={(e) => {
                          const hit = hitFor(c.brand, c.slug);
                          if (!hit || !plain(e)) return;
                          e.preventDefault();
                          choose(hit);
                        }}
                        img={cardPic(c)?.src ?? null}
                        badge={cardPic(c)?.sample ? t.list.sampleBadge : undefined}
                        stage="tip"
                        title={cardName(c, lang, t)}
                        sub={
                          c.diameterMm === null
                            ? undefined
                            : t.tipSize(fmtNum(c.diameterMm, lang), null)
                        }
                        action={t.card.view}
                      />
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
          <div className="flex items-center justify-between gap-3 rounded-b-md border-t border-hair bg-bg-soft px-4 py-3 max-sm:flex-wrap">
            <p className="m-0 min-w-0 text-[13.5px] text-ink">{t.missing.title}</p>
            <a
              href={whatsappHref(sel ? t.missing.textFor(sel.name) : t.missing.text)}
              className={`inline-flex min-h-[38px] shrink-0 items-center rounded-sm bg-whatsapp px-4 text-sm font-medium text-white ${FOCUS}`}
            >
              {t.missing.button}
            </a>
          </div>
        </aside>
      </Container>
    </section>
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
            alt={t.list.cardAlt(c.name, false)}
            width={480}
            height={320}
            loading="lazy"
            decoding="async"
            className="block aspect-[3/2] h-auto w-full border-b border-hair bg-stage object-contain lg:aspect-[12/5]"
          />
        )}
        <span className="flex flex-1 flex-col gap-0.5 p-3 font-sans">
          <span className="text-xs text-ink-mid">{t.parts.tips.name}</span>
          <span className="text-sm font-semibold text-ink group-hover:text-brand-hi sm:text-base">
            {cardName(c, lang, t)}
          </span>
          <span className="mt-auto flex flex-col gap-x-2 sm:flex-row sm:items-end sm:justify-between">
            <CardPrice price={c.price} fx={fx} lang={lang} t={t} />
            <span className="pt-1 text-sm font-medium text-brand-hi group-hover:underline">
              {t.card.view} →
            </span>
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
          alt={renderTitle(r, x.fitted ? t.parts.fitted.name(name, true) : name, t)}
          width={320}
          height={180}
          loading="lazy"
          decoding="async"
          className="block aspect-[3/2] h-auto w-full border-b border-hair bg-pstage object-contain lg:aspect-[12/5]"
        />
      )}
      <span className="flex flex-1 flex-col gap-0.5 p-3 font-sans">
        <span className="text-xs text-ink-mid">{label}</span>
        <span className="text-sm font-semibold text-ink group-hover:text-brand-hi sm:text-base">
          {r ? renderModel(r, t) : name}
        </span>
        <span className="mt-auto flex flex-col gap-x-2 sm:flex-row sm:items-end sm:justify-between">
          <span className="flex flex-col">
            <CardPrice price={[x.cents, x.cents]} fx={fx} lang={lang} t={t} />
            {note && <span className="text-xs text-ink-mid">{note}</span>}
          </span>
          <span className="pt-1 text-sm font-medium text-brand-hi group-hover:underline">
            {t.parts.view} →
          </span>
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
      {/* Owner's choice (2026-10-25, "Birleşik"): the opening first, edge to edge, its parts
          named on it; then the h1, the makes and the breaker panel. */}
      <ExplodedPicker lang={lang} t={t} />
      <Finder model={model} lang={lang} t={t} />

      {/* Phones: the names beside the opening already link every group, so the priced parts
          come before the group cards. */}
      <div className="flex flex-col">
        <section aria-labelledby="groups" className="bg-bg max-md:border-t max-md:border-hair">
          <Container wide className="py-8 max-md:px-4 md:pt-7">
            <SectionHead
              id="groups"
              title={h.groups}
              link={{ href: localePath(PARTS_PATH, lang), label: h.allGroups }}
            />
            <PartGroups numbered={NUMBERED} tips={model.tips} lang={lang} t={t} />
            <p className="m-0 mt-2.5 font-sans text-[12.5px] text-ink-soft md:hidden">
              {h.pick.kitNotShown}
            </p>
          </Container>
        </section>

        {model.made.length > 0 && (
          <section aria-labelledby="made" className="bg-bg max-md:-order-1">
            <Container wide className="py-8 max-md:px-4">
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
              <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 sm:gap-4 min-[73.75rem]:grid-cols-4">
                {model.made.map((x) => (
                  <li key={x.kind === 'tip' ? `tip-${cardKey(x.card)}` : `${x.part}-${x.anchor}`}>
                    <MadeCard x={x} fx={fx} lang={lang} t={t} />
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-3.5 font-sans text-xs text-ink-soft">
                {fx && t.price.fxNote(fmtDate(fx.date, lang))} {t.price.note} {t.renderNote}
              </p>
            </Container>
          </section>
        )}
      </div>

      <div className="border-y border-hair bg-bg-soft">
        <Container wide className="py-8 max-md:px-4">
          <PlantPhotos t={t} hall />
        </Container>
      </div>

      <section id="siparis-adimlari" aria-labelledby="order" className="scroll-mt-6 bg-bg">
        <Container wide className="py-8 max-md:px-4">
          <SectionHead id="order" title={t.cart.steps.title} />
          <OrderSteps lang={lang} t={t} className="md:grid-cols-3" />
          <dl className="m-0 mt-[18px] grid grid-cols-[minmax(0,1fr)] gap-x-7 font-sans text-sm md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.6fr]">
            {[...t.terms.rows, [t.terms.warrantyLabel, t.terms.warrantyAll]].map(([k, v]) => (
              <div
                key={k}
                className="flex gap-3.5 border-t border-hair py-2 md:block md:pb-0 md:pt-2.5"
              >
                <dt className="w-16 shrink-0 text-ink-mid md:w-auto md:font-semibold md:text-ink">
                  {k}
                </dt>
                <dd className="m-0 text-ink md:mt-0.5 md:text-ink-mid">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-col gap-2.5 font-sans text-sm md:flex-row md:flex-wrap md:items-center md:gap-3">
            <a
              href={whatsappHref(t.nav.quoteText)}
              className={`inline-flex min-h-11 items-center justify-center rounded-sm bg-whatsapp px-5 font-medium text-white ${FOCUS}`}
            >
              {h.order.whatsapp}
            </a>
            <a
              href={`mailto:${ORDER_EMAIL}`}
              className={`inline-flex min-h-11 items-center justify-center rounded-sm border border-ink-soft bg-bg px-5 text-ink hover:bg-bg-warm ${FOCUS}`}
            >
              {h.order.mail} · {ORDER_EMAIL}
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
