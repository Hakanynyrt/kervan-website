import { Container } from '@kervan/ui';
import { Breadcrumb, PageTitle } from '../components/Bits';
import { PartGroups } from '../components/PartGroups';
import type { Dict } from '../lib/dict';
import type { Lang } from '../types';

/** Every product group: tips and the other breaker parts we make. */
export default function Parts({ lang, t }: { lang: Lang; t: Dict }) {
  return (
    <Container className="py-12">
      <Breadcrumb trail={[]} current={t.parts.title} lang={lang} t={t} />
      <PageTitle>{t.parts.title}</PageTitle>
      <p className="m-0 mt-3 max-w-3xl font-sans text-ink-mid">{t.parts.lead}</p>
      <div className="mt-8">
        <PartGroups lang={lang} t={t} />
      </div>
    </Container>
  );
}
