import { Container } from '@kervan/ui';
import { PageTitle } from '../components/Bits';
import { FOCUS, whatsappHref } from '../components/Layout';
import { SearchForm } from '../components/ModelSearch';
import { PartGroups } from '../components/PartGroups';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { PARTS_PATH } from '../lib/routes';
import type { Lang } from '../types';

/** 404: the status, a search, the product groups and a way to ask (all static). */
export default function NotFound({ lang, t }: { lang: Lang; t: Dict }) {
  return (
    <Container className="py-16 md:py-20">
      <PageTitle>{t.notFound.title}</PageTitle>
      <p className="m-0 mt-3 max-w-xl font-sans text-ink-mid">{t.notFound.body}</p>
      <div className="mt-8 max-w-xl">
        <SearchForm lang={lang} t={t} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3 font-sans text-sm">
        <a
          href={localePath('/', lang)}
          className={`rounded-sm bg-brand px-5 py-3 font-medium text-white hover:bg-brand-hi ${FOCUS}`}
        >
          {t.notFound.home}
        </a>
        <a
          href={localePath(PARTS_PATH, lang)}
          className={`rounded-sm border border-hair-strong bg-bg px-5 py-3 font-medium text-ink hover:border-ink ${FOCUS}`}
        >
          {t.parts.title}
        </a>
        <a
          href={whatsappHref(t.nav.quoteText)}
          className={`rounded-sm bg-whatsapp px-5 py-3 font-medium text-white ${FOCUS}`}
        >
          {t.notFound.ask}
        </a>
      </div>
      <h2 className="m-0 mt-14 font-sans text-xl font-bold text-ink">{t.parts.title}</h2>
      <div className="mt-4">
        <PartGroups lang={lang} t={t} compact />
      </div>
    </Container>
  );
}
