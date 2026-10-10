import { Container } from '@kervan/ui';
import { Breadcrumb, MissingModel, PageTitle } from '../components/Bits';
import { ModelTable } from '../components/ModelSearch';
import type { Dict } from '../lib/dict';
import { PARTS_PATH, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'list' }>;

export default function TipList({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  return (
    <Container className="pb-12 pt-8 lg:pt-12">
      <Breadcrumb
        trail={[[t.parts.title, PARTS_PATH]]}
        current={t.parts.tips.name}
        lang={lang}
        t={t}
      />
      <PageTitle>{t.list.title}</PageTitle>
      <p className="m-0 mt-3 font-sans text-ink-mid">{t.list.lead}</p>
      <div className="mt-6">
        <ModelTable rows={model.rows} lang={lang} t={t} />
      </div>
      <MissingModel t={t} />
    </Container>
  );
}
