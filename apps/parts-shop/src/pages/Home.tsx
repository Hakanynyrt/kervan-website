import { Container } from '@kervan/ui';
import { Photo } from '../components/Bits';
import FamilyCardView from '../components/FamilyCardView';
import { SearchForm } from '../components/ModelSearch';
import { PartGroups } from '../components/PartGroups';
import { FOCUS, FOCUS_INSET, whatsappHref } from '../components/Layout';
import type { Dict } from '../lib/dict';
import { fmtNum } from '../lib/format';
import { localePath } from '../lib/locale-path';
import { PART_RENDERS, renderStats, STOCK_TIP_PHOTOS } from '../lib/photos';
import {
  LIST_PATH,
  PART_KEYS,
  PARTS_PATH,
  POPULAR_PATH,
  partPath,
  type PageModel,
  type PartKey,
} from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'home' }>;

/** Hero composite: the front head with the 3D model (Rammer E68), then three part thumbnails. */
const LEAD =
  PART_RENDERS['alt-govde'].find((r) => r.model3d && r.hero) ??
  PART_RENDERS['alt-govde'].find((r) => r.hero)!;
const THUMB_KEYS: PartKey[] = ['burc', 'piston', 'kama'];
const THUMBS = THUMB_KEYS.map((k) => ({ k, hero: PART_RENDERS[k].find((r) => r.hero)?.hero }));
/** Breaker models, not renders (old-type / round-nut variants count once), as on the group cards. */
const HEAD_MODELS = renderStats(PART_RENDERS['alt-govde']).models;
const PART_MODELS = renderStats(PART_KEYS.flatMap((k) => PART_RENDERS[k])).models;
const MAKES_SHOWN = 12;

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

export default function Home({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const h = t.home;
  const leadCaption = t.parts.renderCaption(LEAD.model, t.parts.items['alt-govde'].name);
  // Every number is computed: catalogue counts (left out for the DEMO catalogue) and renders.
  const stats: [number, string][] = [
    ...(model.demo
      ? []
      : ([
          [model.total, h.stats.models],
          [model.brands.length, h.stats.makes],
        ] as [number, string][])),
    [HEAD_MODELS, h.stats.heads],
    [PART_MODELS, h.stats.parts(PART_KEYS.length)],
  ];
  const makes = [...model.brands]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr'))
    .slice(0, MAKES_SHOWN)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  const withImages = model.featured.length > 0 && model.featured.every((c) => c.image !== null);
  const tipsLink = {
    href: localePath(model.featuredArePopular ? POPULAR_PATH : LIST_PATH, lang),
    label: model.featuredArePopular ? h.morePopular : h.cta,
  };

  return (
    <>
      <section className="border-b border-hair bg-bg-soft">
        <Container className="py-12 md:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
            <div>
              <h1 className="m-0 font-sans text-4xl font-bold leading-tight text-ink md:text-5xl">
                {h.title}
              </h1>
              <p className="m-0 mt-5 max-w-xl font-sans text-lg text-ink-mid">{h.lead}</p>
              <div className="mt-8 max-w-xl">
                <SearchForm lang={lang} t={t} />
              </div>
              <div className="mt-8 flex flex-wrap gap-3 font-sans text-sm font-medium">
                <a
                  href={localePath(LIST_PATH, lang)}
                  className={`rounded-sm bg-brand px-6 py-3 text-white hover:bg-brand-hi ${FOCUS}`}
                >
                  {h.cta} · {h.count(model.total)}
                </a>
                <a
                  href={whatsappHref(t.nav.quoteText)}
                  className={`rounded-sm border border-ink-soft bg-bg px-6 py-3 text-ink hover:bg-bg-warm ${FOCUS}`}
                >
                  {h.ctaQuote}
                </a>
              </div>
            </div>
            <figure className="m-0">
              <div className="overflow-hidden rounded-md border border-hair bg-stage">
                <a
                  href={localePath(partPath('alt-govde'), lang)}
                  className={`block ${FOCUS_INSET}`}
                >
                  <img
                    src={`${LEAD.hero}-lg.webp`}
                    width={1600}
                    height={900}
                    alt={leadCaption}
                    fetchPriority="high"
                    decoding="async"
                    className="block aspect-video h-auto w-full"
                  />
                </a>
                <nav aria-label={h.heroMore}>
                  <ul className="m-0 grid list-none grid-cols-3 divide-x divide-ink-mid/40 border-t border-ink-mid/40 p-0">
                    {THUMBS.map(({ k, hero }) => (
                      <li key={k}>
                        <a
                          href={localePath(partPath(k), lang)}
                          className={`block p-2 hover:bg-ink ${FOCUS_INSET}`}
                        >
                          {hero && (
                            <img
                              src={`${hero}-xs.webp`}
                              width={320}
                              height={180}
                              alt=""
                              decoding="async"
                              className="block aspect-video h-auto w-full"
                            />
                          )}
                          <span className="block px-1 pt-1.5 font-sans text-xs font-medium text-white">
                            {t.parts.items[k].name}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
              <figcaption className="mt-2 font-sans text-xs text-ink-soft">
                {h.heroCaption(leadCaption)}
              </figcaption>
            </figure>
          </div>
        </Container>
      </section>

      <section aria-label={h.stats.label} className="border-b border-hair bg-bg">
        <Container>
          <dl
            className={`m-0 grid grid-cols-2 border-b border-hair ${stats.length === 4 ? 'lg:grid-cols-4' : ''}`}
          >
            {stats.map(([n, label], i) => (
              <div
                key={label}
                className={`flex flex-col-reverse justify-end border-hair py-6 pr-4 font-sans ${i % 2 ? 'border-l pl-4 lg:pl-6' : ''} ${i === 2 ? 'lg:border-l lg:pl-6' : ''} ${stats.length === 4 && i < 2 ? 'border-b lg:border-b-0' : ''}`}
              >
                <dt className="text-sm text-ink-mid">{label}</dt>
                <dd className="m-0 mt-1 text-3xl font-bold tabular-nums text-ink">
                  {fmtNum(n, lang)}
                </dd>
              </div>
            ))}
          </dl>
          <ul className="m-0 grid list-none grid-cols-1 gap-px p-0 sm:grid-cols-2 lg:grid-cols-4">
            {h.trust.map((x) => (
              <li key={x.title} className="py-4 font-sans sm:py-6 sm:pr-6">
                <p className="m-0 text-base font-semibold text-ink">{x.title}</p>
                <p className="m-0 mt-1 text-sm text-ink-mid">{x.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {makes.length > 0 && (
        <section aria-labelledby="makes" className="border-b border-hair bg-bg-soft">
          <Container className="py-10">
            <SectionHead
              id="makes"
              title={h.makes.title}
              lead={h.makes.lead}
              link={{
                href: localePath(LIST_PATH, lang),
                label: h.makes.all(model.brands.length),
              }}
            />
            <ul className="m-0 grid list-none grid-cols-2 gap-px overflow-hidden rounded-md border border-hair bg-hair p-0 sm:grid-cols-3 lg:grid-cols-6">
              {makes.map((b) => (
                <li key={b.path}>
                  <a
                    href={localePath(b.path, lang)}
                    className={`group flex h-20 flex-col items-center justify-center gap-1 bg-bg px-3 text-center font-sans hover:bg-bg-warm ${FOCUS_INSET}`}
                  >
                    <span className="text-sm font-bold uppercase tracking-[0.12em] text-ink-mid group-hover:text-ink">
                      {b.name}
                    </span>
                    {!model.demo && (
                      <span className="text-xs text-ink-soft">{h.makes.count(b.count)}</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
            <p className="m-0 mt-4 max-w-3xl font-sans text-xs text-ink-soft">{h.makes.note}</p>
          </Container>
        </section>
      )}

      <section aria-labelledby="featured" className="bg-bg">
        <Container className="py-14 md:py-16">
          <SectionHead
            id="featured"
            title={model.featuredArePopular ? h.popular : h.featured}
            link={tipsLink}
          />
          {withImages ? (
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:gap-4 lg:grid-cols-4">
              {model.featured.map((c) => (
                <li key={c.slug}>
                  <FamilyCardView c={c} lang={lang} t={t} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-10">
              <figure className="m-0">
                <Photo base={STOCK_TIP_PHOTOS[0]} alt={t.parts.photosAlt(t.parts.tips.name)} />
                <figcaption className="mt-2 font-sans text-xs text-ink-soft">
                  {t.family.stockTitle}
                </figcaption>
              </figure>
              <div>
                <ul className="m-0 grid list-none grid-cols-1 border-t border-hair p-0 sm:grid-cols-2 sm:gap-x-8">
                  {model.featured.map((c) => (
                    <li key={c.slug} className="border-b border-hair">
                      <a
                        href={localePath(c.path, lang)}
                        className={`group flex items-center justify-between gap-4 px-1 py-3.5 font-sans ${FOCUS}`}
                      >
                        <span className="text-base font-semibold text-ink group-hover:text-brand-hi">
                          {c.name}
                        </span>
                        <span aria-hidden="true" className="text-sm font-medium text-brand-hi">
                          {t.card.view} →
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  href={localePath(LIST_PATH, lang)}
                  className={`mt-4 inline-block font-sans text-sm font-medium text-brand-hi hover:underline ${FOCUS}`}
                >
                  {h.cta} · {h.count(model.total)} →
                </a>
              </div>
            </div>
          )}
        </Container>
      </section>

      <section aria-labelledby="groups" className="border-y border-hair bg-bg-soft">
        <Container className="py-14 md:py-16">
          <SectionHead
            id="groups"
            title={h.groups}
            link={{ href: localePath(PARTS_PATH, lang), label: h.allGroups }}
          />
          <PartGroups tips={model.tips} demo={model.demo} lang={lang} t={t} />
        </Container>
      </section>

      <section aria-labelledby="sectors" className="bg-bg">
        <Container className="py-14 md:py-16">
          <SectionHead id="sectors" title={h.sectors.title} lead={h.sectors.lead} />
          <ul className="m-0 mt-8 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {h.sectors.items.map((x) => (
              <li key={x.name} className="rounded-md border border-hair bg-bg p-5 font-sans">
                <p className="m-0 text-lg font-semibold text-ink">{x.name}</p>
                <p className="m-0 mt-1 text-sm text-ink-mid">{x.body}</p>
                <p className="m-0 mt-4 text-xs font-medium text-ink-soft">{h.sectors.typesLabel}</p>
                <p className="m-0 mt-1 text-sm font-medium text-ink">
                  {x.types.map((k) => t.tip[k]).join(' · ')}
                </p>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-6 font-sans text-xs text-ink-soft">{h.sectors.note}</p>
        </Container>
      </section>
    </>
  );
}
