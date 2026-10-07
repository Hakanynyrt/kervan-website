import TipProduct from '../components/TipProduct';
import type { Dict } from '../lib/dict';
import type { PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'breaker' }>;

/** The shop's product page: the tip for one breaker model. */
export default function Breaker({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  return (
    <TipProduct
      title={t.breaker.title(model.name)}
      crumb={model.name}
      quoteName={model.name}
      families={model.families}
      lang={lang}
      t={t}
    />
  );
}
