import { WRAP } from '../components/Layout';
import type { FxRate } from '@kervan/tips';
import { Breadcrumb, Guide, PageTitle } from '../components/Bits';
import { PartVideos } from '../components/GuideVideo';
import { BrandChips, ModelTable } from '../components/ModelSearch';
import type { Dict } from '../lib/dict';
import { PARTS_PATH, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'list' }>;

export default function TipList({
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
    <div className={`${WRAP} pb-12 pt-8 lg:pt-12`}>
      <Breadcrumb
        trail={[[t.parts.title, PARTS_PATH]]}
        current={t.parts.tips.name}
        lang={lang}
        t={t}
      />
      <PageTitle>{t.list.title}</PageTitle>
      <p className="m-0 mt-3 font-sans text-ink-mid">{t.list.lead}</p>
      {/* Owner: no model named here; the badge shows on a typed search's results. */}
      <p className="m-0 mt-2 font-sans text-sm text-ink-mid">{t.list.groovedHint}</p>
      {/* Owner (2026-10-16): the makes are listed here again; a make opens all its models. */}
      <div className="mt-6 hidden sm:block">
        <BrandChips brands={model.brands} only="wide" lang={lang} t={t} />
      </div>
      <div className="mt-6 sm:mt-8">
        {/* Owner (2026-10-21): every model listed before a search, as on the brand pages. */}
        <ModelTable rows={model.rows} fx={fx} lang={lang} t={t} all cards />
      </div>
      <div className="mt-8 sm:hidden">
        <BrandChips brands={model.brands} only="phone" lang={lang} t={t} />
      </div>
      <PartVideos part="tips" lang={lang} t={t} />
      <Guide
        id="tip-guide"
        intro={t.list.guide.intro}
        title={t.list.guide.title}
        body={t.list.guide.body}
      />
    </div>
  );
}
