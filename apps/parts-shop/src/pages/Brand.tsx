import { WRAP } from '../components/Layout';
import type { FxRate } from '@kervan/tips';
import { Breadcrumb, PageTitle } from '../components/Bits';
import { BrandChips, ModelTable } from '../components/ModelSearch';
import { modelCount } from '../lib/card';
import type { Dict } from '../lib/dict';
import { LIST_PATH, PARTS_PATH, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'brand' }>;

/** Every model of one breaker make. */
export default function Brand({
  model,
  fx,
  lang,
  t,
}: {
  model: Model;
  fx: FxRate | null;
  lang: Lang;
  t: Dict;
}) {
  return (
    <div className={`${WRAP} pt-8 pb-12 lg:pt-12`}>
      <Breadcrumb
        trail={[
          [t.parts.title, PARTS_PATH],
          [t.parts.tips.name, LIST_PATH],
        ]}
        current={model.brand}
        lang={lang}
        t={t}
      />
      <PageTitle>{t.brand.title(model.brand)}</PageTitle>
      {/* Models, not cards: a breaker with two tip sizes has two cards (as the list's count). */}
      <p className="m-0 mt-3 font-sans text-ink-mid">{t.brand.lead(modelCount(model.rows))}</p>
      <div className="mt-6 hidden sm:block">
        <BrandChips brands={model.brands} current={model.brand} only="wide" lang={lang} t={t} />
      </div>
      <div className="mt-6 sm:mt-8">
        <ModelTable
          rows={model.rows}
          fx={fx}
          lang={lang}
          t={t}
          all
          cards
          crawlAll
          quiet
          hint={model.rows.length ? t.brand.filterHint(model.rows[0].name) : undefined}
        />
      </div>
      <div className="mt-8 sm:hidden">
        <BrandChips brands={model.brands} current={model.brand} only="phone" lang={lang} t={t} />
      </div>
    </div>
  );
}
