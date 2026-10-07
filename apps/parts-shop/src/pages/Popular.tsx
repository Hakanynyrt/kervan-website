import { Container } from '@kervan/ui';
import FamilyCardView from '../components/FamilyCardView';
import type { Dict } from '../lib/dict';
import type { PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'popular' }>;

export default function Popular({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  return (
    <Container className="py-12">
      <h1 className="m-0 font-sans text-3xl font-bold text-ink">{t.popular.title}</h1>
      <p className="m-0 mt-3 font-sans text-ink-mid">{t.popular.lead}</p>
      <ul className="m-0 mt-8 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {model.cards.map((c) => (
          <li key={c.code}>
            <FamilyCardView c={c} lang={lang} t={t} />
          </li>
        ))}
      </ul>
    </Container>
  );
}
