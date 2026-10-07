import { Container } from '@kervan/ui';
import FamilyCardView from '../components/FamilyCardView';
import { SearchForm } from '../components/ModelSearch';
import { PartGroups } from '../components/PartGroups';
import { FOCUS, whatsappHref } from '../components/Layout';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { LIST_PATH, POPULAR_PATH, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'home' }>;

export default function Home({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const h = t.home;
  return (
    <>
      <section className="border-b border-hair bg-bg-soft">
        <Container className="py-14 md:py-20">
          <h1 className="m-0 max-w-3xl font-sans text-4xl font-bold leading-tight text-ink md:text-5xl">
            {h.title}
          </h1>
          <p className="m-0 mt-5 max-w-2xl font-sans text-lg text-ink-mid">{h.lead}</p>
          <div className="mt-8 max-w-2xl">
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
        </Container>
      </section>

      <div className="border-b border-hair">
        <Container>
          <ul className="m-0 grid list-none grid-cols-1 gap-px p-0 sm:grid-cols-2 lg:grid-cols-4">
            {h.trust.map((x) => (
              <li key={x.title} className="py-6 font-sans sm:pr-6">
                <p className="m-0 text-base font-semibold text-ink">{x.title}</p>
                <p className="m-0 mt-1 text-sm text-ink-mid">{x.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </div>

      <section aria-labelledby="featured">
        <Container className="py-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 id="featured" className="m-0 font-sans text-2xl font-bold text-ink">
              {model.featuredArePopular ? h.popular : h.featured}
            </h2>
            <a
              href={localePath(model.featuredArePopular ? POPULAR_PATH : LIST_PATH, lang)}
              className={`font-sans text-sm font-medium text-brand-hi hover:underline ${FOCUS}`}
            >
              {model.featuredArePopular ? h.morePopular : h.cta} →
            </a>
          </div>
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {model.featured.map((c) => (
              <li key={c.slug}>
                <FamilyCardView c={c} lang={lang} t={t} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="groups" className="border-t border-hair">
        <Container className="py-14">
          <h2 id="groups" className="m-0 mb-6 font-sans text-2xl font-bold text-ink">
            {h.groups}
          </h2>
          <PartGroups lang={lang} t={t} />
        </Container>
      </section>

      <section aria-labelledby="sectors" className="border-t border-hair bg-bg-soft">
        <Container className="py-14">
          <h2 id="sectors" className="m-0 font-sans text-2xl font-bold text-ink">
            {h.sectors.title}
          </h2>
          <p className="m-0 mt-2 max-w-2xl font-sans text-ink-mid">{h.sectors.lead}</p>
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
