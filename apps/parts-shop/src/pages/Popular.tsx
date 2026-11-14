import type { FxRate } from '@kervan/tips';
import { Breadcrumb, PageTitle } from '../components/Bits';
import FamilyCardView from '../components/FamilyCardView';
import { FOCUS, WRAP } from '../components/Layout';
import { CardPrice, SearchForm } from '../components/ModelSearch';
import { priceNote } from '../components/PartOrder';
import { cardKey } from '../lib/card';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { upFirst } from '../lib/part-caption';
import { fmtDate } from '../lib/price';
import { partItemPath, type PageModel, type PopularPart } from '../lib/routes';
import type { Lang } from '../types';
import { cardSet, photoImg } from '../lib/photo-url';

type Model = Extract<PageModel, { kind: 'popular' }>;

export default function Popular({
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
  const p = t.popular;
  return (
    <div className={`${WRAP} pb-12 pt-8 lg:pt-12`}>
      <Breadcrumb trail={[]} current={p.title} lang={lang} t={t} />
      <PageTitle>{p.title}</PageTitle>
      <p className="m-0 mt-3 font-sans text-ink-mid">{p.lead}</p>
      <div className="mt-6 max-w-2xl">
        <SearchForm lang={lang} t={t} />
      </div>
      <ul className="m-0 mt-10 grid list-none grid-cols-2 gap-3 p-0 sm:gap-4 lg:grid-cols-4">
        {model.items.map((it) =>
          it.kind === 'tip' ? (
            <li key={`tip-${cardKey(it.card)}`}>
              <FamilyCardView c={it.card} fx={fx} lang={lang} t={t} />
            </li>
          ) : (
            <li key={`part-${it.part.part}-${it.part.anchor}`}>
              <PartCard x={it.part} fx={fx} lang={lang} t={t} />
            </li>
          ),
        )}
      </ul>
      <p className="m-0 mt-6 max-w-3xl font-sans text-sm text-ink-mid">
        {fx && t.price.fxNote(fmtDate(fx.date, lang))} {t.price.note} {p.partsLead}
      </p>
    </div>
  );
}

/**
 * A modelled part for a best-selling breaker: picture, breaker, part name and its price as the
 * home's priced part cards show it (a burçlu head's price names it burçlu), "Fiyat için sorun" without.
 */
function PartCard({ x, fx, lang, t }: { x: PopularPart; fx: FxRate | null; lang: Lang; t: Dict }) {
  const k = x.part;
  const name = t.parts.items[k].name;
  const label = x.kind
    ? t.parts.renderKindShort[x.kind]
    : x.fitted
      ? upFirst(t.parts.fitted.name(name, true), lang)
      : name;
  const note = x.cents !== null ? priceNote(x.kind ?? undefined, t) : null;
  return (
    <a
      href={localePath(partItemPath(k, x.anchor), lang)}
      className={`group flex h-full flex-col overflow-hidden rounded-md border border-hair bg-bg hover:border-hair-strong ${FOCUS}`}
    >
      <div className="aspect-[3/2] border-b border-hair bg-pstage">
        {x.hero && (
          <img
            src={photoImg(x.hero, 'xs')}
            srcSet={cardSet(x.hero)}
            sizes="(min-width: 1024px) 25vw, 50vw"
            width={320}
            height={180}
            alt={
              x.kind
                ? `${x.model} ${t.parts.renderKind[x.kind]}`
                : t.parts.renderCaption(x.model, name)
            }
            loading="lazy"
            decoding="async"
            className="block h-full w-full object-contain"
          />
        )}
      </div>
      <span className="flex flex-1 flex-col px-3 py-2 font-sans">
        <span className="text-base font-semibold text-ink group-hover:text-brand-hi sm:text-lg">
          {x.model}
        </span>
        <span className="text-xs text-ink-mid">{label}</span>
        <span className="mt-auto flex flex-col gap-x-2 sm:flex-row sm:items-end sm:justify-between">
          <span className="flex flex-col">
            <CardPrice
              price={x.cents === null ? null : [x.cents, x.cents]}
              fx={fx}
              lang={lang}
              t={t}
            />
            {note && <span className="text-xs text-ink-mid">{note}</span>}
          </span>
          <span className="pt-1 text-sm font-medium text-brand-hi group-hover:underline">
            {t.parts.view} →
          </span>
        </span>
      </span>
    </a>
  );
}
