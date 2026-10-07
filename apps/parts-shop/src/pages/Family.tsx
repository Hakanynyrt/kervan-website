import TipProduct from '../components/TipProduct';
import type { Dict } from '../lib/dict';
import { fmtNum } from '../lib/format';
import type { PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'family' }>;

/** A tip family by its permanent Kervan code (also the page for tips with no listed breaker). */
export default function Family({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const f = model.family;
  return (
    <TipProduct
      title={t.family.kicker(fmtNum(f.attrs.diameterMm, lang))}
      crumb={f.code}
      quoteName={f.code}
      families={[f]}
      lang={lang}
      t={t}
    />
  );
}
