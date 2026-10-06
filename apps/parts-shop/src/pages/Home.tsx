import { Container } from '@kervan/ui';
import FamilyCardView from '../components/FamilyCardView';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { LIST_PATH, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'home' }>;

export default function Home({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  return (
    <>
      <Container className="py-16 md:py-24">
        <p className="m-0 font-sans text-xs uppercase tracking-[0.2em] text-brand-hi">
          {t.home.eyebrow}
        </p>
        <h1 className="m-0 mt-4 font-serif text-5xl italic leading-tight text-ink md:text-6xl">
          {t.home.title}
        </h1>
        <p className="m-0 mt-6 max-w-2xl font-sans text-lg text-ink-mid">{t.home.lead}</p>
        <a
          href={localePath(LIST_PATH, lang)}
          className="mt-8 inline-block rounded-pill bg-brand px-6 py-3 font-sans text-sm font-medium text-bg hover:bg-brand-hi focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
        >
          {t.home.cta} · {t.home.count(model.total)}
        </a>
      </Container>
      <section aria-labelledby="featured">
        <Container className="pb-8">
          <h2 id="featured" className="m-0 mb-6 font-serif text-3xl text-ink">
            {model.featuredArePopular ? t.home.popular : t.home.featured}
          </h2>
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {model.featured.map((c) => (
              <li key={c.code}>
                <FamilyCardView c={c} lang={lang} t={t} />
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
