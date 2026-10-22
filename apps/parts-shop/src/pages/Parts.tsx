import { Container } from '@kervan/ui';
import { Breadcrumb, PageTitle, PlantPhotos } from '../components/Bits';
import { PartGroups } from '../components/PartGroups';
import type { Dict } from '../lib/dict';
import type { PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'parts' }>;

/** Every product group: tips and the other breaker parts we make, then our plant. */
export default function Parts({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  return (
    <>
      <section className="border-b border-hair bg-bg-soft">
        <Container className="py-10">
          <Breadcrumb trail={[]} current={t.parts.title} lang={lang} t={t} />
          <PageTitle>{t.parts.title}</PageTitle>
          <p className="m-0 mt-3 max-w-3xl font-sans text-ink-mid">{t.parts.lead}</p>
          <p className="m-0 mt-3 max-w-3xl font-sans text-xs text-ink-soft">{t.parts.fitNote}</p>
        </Container>
      </section>
      <Container className="py-12">
        <h2 id="groups" className="m-0 mb-6 font-sans text-2xl font-bold text-ink">
          {t.parts.groupsTitle}
        </h2>
        <PartGroups tips={model.tips} lang={lang} t={t} />

        <PlantPhotos t={t} className="mt-14 border-t border-hair pt-12" />
      </Container>
    </>
  );
}
