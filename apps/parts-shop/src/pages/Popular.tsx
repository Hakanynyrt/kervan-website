import { Container } from '@kervan/ui';
import { Breadcrumb, PageTitle } from '../components/Bits';
import FamilyCardView from '../components/FamilyCardView';
import { FOCUS } from '../components/Layout';
import { SearchForm } from '../components/ModelSearch';
import { cardKey } from '../lib/card';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { partItemPath, type PageModel, type PopularPart } from '../lib/routes';
import type { Lang } from '../types';
import { cardSet, photoImg } from '../lib/photo-url';

type Model = Extract<PageModel, { kind: 'popular' }>;

export default function Popular({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const p = t.popular;
  return (
    <Container className="pb-12 pt-8 lg:pt-12">
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
              <FamilyCardView c={it.card} lang={lang} t={t} />
            </li>
          ) : (
            <li key={`part-${it.part.part}-${it.part.anchor}`}>
              <PartCard x={it.part} lang={lang} t={t} />
            </li>
          ),
        )}
      </ul>
      <p className="m-0 mt-6 max-w-3xl font-sans text-sm text-ink-mid">{p.partsLead}</p>
    </Container>
  );
}

/** A modelled part for a best-selling breaker: picture, breaker, part name. */
function PartCard({ x, lang, t }: { x: PopularPart; lang: Lang; t: Dict }) {
  const k = x.part;
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
                : t.parts.renderCaption(x.model, t.parts.items[k].name)
            }
            loading="lazy"
            decoding="async"
            className="block h-full w-full object-contain"
          />
        )}
      </div>
      <span className="flex flex-col px-3 py-2 font-sans">
        <span className="text-base font-semibold text-ink group-hover:text-brand-hi sm:text-lg">
          {x.model}
        </span>
        <span className="text-xs text-ink-mid">
          {x.kind ? t.parts.renderKindShort[x.kind] : t.parts.items[k].name}
        </span>
      </span>
    </a>
  );
}
