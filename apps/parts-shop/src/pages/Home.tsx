import { Container } from '@kervan/ui';
import { Photo } from '../components/Bits';
import FamilyCardView from '../components/FamilyCardView';
import ExplodedPicker from '../components/ExplodedPicker';
import { PartGroups } from '../components/PartGroups';
import { FOCUS, whatsappHref } from '../components/Layout';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { STOCK_TIP_PHOTOS } from '../lib/photos';
import { LIST_PATH, PARTS_PATH, POPULAR_PATH, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'home' }>;

/** Breaker models, not renders (old-type / round-nut variants count once), as on the group cards. */

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
  const withImages = model.featured.length > 0 && model.featured.every((c) => c.image !== null);
  const tipsLink = {
    href: localePath(model.featuredArePopular ? POPULAR_PATH : LIST_PATH, lang),
    label: model.featuredArePopular ? h.morePopular : h.cta,
  };

  return (
    <>
      <section className="border-b border-hair bg-bg-soft">
        <Container className="py-10 md:py-14">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-x-10 lg:gap-y-8">
            <div className="max-w-3xl">
              <h1 className="m-0 font-sans text-4xl font-bold leading-tight text-ink md:text-5xl">
                {h.title}
              </h1>
              <p className="m-0 mt-4 font-sans text-lg text-ink-mid">{h.lead}</p>
            </div>
            <div className="order-last flex flex-wrap gap-3 font-sans text-sm font-medium lg:order-none">
              <a
                href={localePath(PARTS_PATH, lang)}
                className={`rounded-sm border border-ink-soft bg-bg px-5 py-3 text-ink hover:bg-bg-warm ${FOCUS}`}
              >
                {h.allGroups}
              </a>
              <a
                href={whatsappHref(t.nav.quoteText)}
                className={`rounded-sm border border-ink-soft bg-bg px-5 py-3 text-ink hover:bg-bg-warm ${FOCUS}`}
              >
                {h.ctaQuote}
              </a>
            </div>
            <div className="lg:col-span-2">
              <ExplodedPicker lang={lang} t={t} />
            </div>
          </div>
        </Container>
      </section>

      <div className="border-b border-hair bg-bg">
        <Container>
          <ul className="m-0 grid list-none grid-cols-1 gap-px p-0 sm:grid-cols-2 lg:grid-cols-4">
            {h.trust.map((x) => (
              <li key={x.title} className="py-4 font-sans sm:py-6 sm:pr-6">
                <p className="m-0 text-base font-semibold text-ink">{x.title}</p>
                <p className="m-0 mt-1 text-sm text-ink-mid">{x.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </div>

      <section aria-labelledby="groups" className="bg-bg">
        <Container className="py-14 md:py-16">
          <SectionHead
            id="groups"
            title={h.groups}
            link={{ href: localePath(PARTS_PATH, lang), label: h.allGroups }}
          />
          <PartGroups tips={model.tips} lang={lang} t={t} />
        </Container>
      </section>

      <section aria-labelledby="featured" className="border-y border-hair bg-bg-soft">
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
