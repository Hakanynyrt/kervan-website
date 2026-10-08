import { Container } from '@kervan/ui';
import { MissingModel } from '../components/Bits';
import { BrandChips, ModelTable } from '../components/ModelSearch';
import type { Dict } from '../lib/dict';
import type { PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'list' }>;

export default function TipList({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  return (
    <Container className="py-12">
      <h1 className="m-0 font-sans text-3xl font-bold text-ink">{t.list.title}</h1>
      <p className="m-0 mt-3 font-sans text-ink-mid">{t.list.lead}</p>
      <div className="mt-6 hidden sm:block">
        <BrandChips brands={model.brands} only="wide" lang={lang} t={t} />
      </div>
      <div className="mt-6 sm:mt-8">
        <ModelTable rows={model.rows} lang={lang} t={t} />
      </div>
      <div className="mt-8 sm:hidden">
        <BrandChips brands={model.brands} only="phone" lang={lang} t={t} />
      </div>
      <MissingModel t={t} />
    </Container>
  );
}
