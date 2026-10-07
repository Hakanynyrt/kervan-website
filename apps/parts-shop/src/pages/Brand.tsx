import { Container } from '@kervan/ui';
import { Breadcrumb, MissingModel, PageTitle } from '../components/Bits';
import { BrandChips, ModelTable } from '../components/ModelSearch';
import type { Dict } from '../lib/dict';
import { LIST_PATH, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'brand' }>;

/** Every model of one breaker make. */
export default function Brand({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  return (
    <Container className="py-12">
      <Breadcrumb trail={[[t.nav.tips, LIST_PATH]]} current={model.brand} lang={lang} t={t} />
      <PageTitle>{t.brand.title(model.brand)}</PageTitle>
      <p className="m-0 mt-3 font-sans text-ink-mid">{t.brand.lead(model.rows.length)}</p>
      <div className="mt-6">
        <BrandChips brands={model.brands} current={model.brand} lang={lang} t={t} />
      </div>
      <div className="mt-8">
        <ModelTable rows={model.rows} lang={lang} t={t} />
      </div>
      <MissingModel t={t} />
    </Container>
  );
}
