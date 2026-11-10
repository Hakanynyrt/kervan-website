import { Button } from '@astryxdesign/core/Button';
import { PageTitle } from '../components/Bits';
import { OUTLINE_BUTTON, WHATSAPP_BUTTON, whatsappHref, WRAP } from '../components/Layout';
import { SearchForm } from '../components/ModelSearch';
import { PartGroups } from '../components/PartGroups';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { PARTS_PATH } from '../lib/routes';
import type { Lang } from '../types';

/** 404: the status, a search, the product groups and a way to ask (all static). */
export default function NotFound({ lang, t }: { lang: Lang; t: Dict }) {
  return (
    <div className={`${WRAP} py-16 md:py-20`}>
      <PageTitle>{t.notFound.title}</PageTitle>
      <p className="m-0 mt-3 max-w-xl font-sans text-ink-mid">{t.notFound.body}</p>
      <div className="mt-8 max-w-xl">
        <SearchForm lang={lang} t={t} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3 font-sans text-sm">
        <Button
          href={localePath('/', lang)}
          label={t.notFound.home}
          variant="primary"
          size="lg"
          className="px-5"
        />
        <Button
          href={localePath(PARTS_PATH, lang)}
          label={t.parts.title}
          variant="secondary"
          size="lg"
          className={`px-5 ${OUTLINE_BUTTON}`}
        />
        <Button
          href={whatsappHref(t.nav.quoteText)}
          label={t.notFound.ask}
          size="lg"
          className={`px-5 ${WHATSAPP_BUTTON}`}
        />
      </div>
      <h2 className="m-0 mt-14 font-sans text-xl font-bold text-ink">{t.parts.title}</h2>
      <div className="mt-4">
        <PartGroups lang={lang} t={t} compact />
      </div>
    </div>
  );
}
