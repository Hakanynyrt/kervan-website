import { Container } from '@kervan/ui';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import type { Lang } from '../types';

export default function NotFound({ lang, t }: { lang: Lang; t: Dict }) {
  return (
    <Container className="py-24">
      <h1 className="m-0 font-sans text-3xl font-bold text-ink">{t.notFound.title}</h1>
      <p className="m-0 mt-4 font-sans text-ink-mid">{t.notFound.body}</p>
      <a
        href={localePath('/', lang)}
        className="mt-6 inline-block font-sans text-brand-hi underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
      >
        {t.notFound.home}
      </a>
    </Container>
  );
}
