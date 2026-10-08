import type { FxRate } from '@kervan/tips';
import TipProduct from '../components/TipProduct';
import type { Dict } from '../lib/dict';
import { brandPath, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'breaker' }>;

/** The shop's product page: the tip for one breaker model. */
export default function Breaker({
  model,
  path,
  fx,
  lang,
  t,
}: {
  model: Model;
  path: string;
  fx: FxRate | null;
  lang: Lang;
  t: Dict;
}) {
  return (
    <TipProduct
      title={t.breaker.title(model.name)}
      crumb={model.model}
      trail={[[model.brand, brandPath(model.brand)]]}
      quoteName={model.name}
      families={model.families}
      extra={model.extra}
      parts={model.parts}
      path={path}
      fx={fx}
      lang={lang}
      t={t}
    />
  );
}
