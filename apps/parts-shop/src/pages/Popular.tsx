import { Container } from '@kervan/ui';
import FamilyCardView from '../components/FamilyCardView';
import { FOCUS } from '../components/Layout';
import { SearchForm } from '../components/ModelSearch';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { partItemPath, type PageModel, type PopularPart } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'popular' }>;

export default function Popular({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const p = t.popular;
  return (
    <Container className="py-12">
      <h1 className="m-0 font-sans text-3xl font-bold text-ink">{p.title}</h1>
      <p className="m-0 mt-3 font-sans text-ink-mid">{p.lead}</p>
      <div className="mt-6 max-w-2xl">
        <SearchForm lang={lang} t={t} />
      </div>
      <ul className="m-0 mt-10 grid list-none grid-cols-2 gap-3 p-0 sm:gap-4 lg:grid-cols-4">
        {model.items.map((it) =>
          it.kind === 'tip' ? (
            <li key={`tip-${it.card.slug}`}>
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
      className={`group flex h-full flex-col overflow-hidden rounded-sm border border-hair bg-bg hover:border-hair-strong ${FOCUS}`}
    >
      <div className="aspect-[3/2] border-b border-hair bg-stage">
        {x.hero && (
          <img
            src={`${x.hero}-xs.webp`}
            srcSet={`${x.hero}-xs.webp 320w, ${x.hero}-lg.webp 1600w`}
            sizes="(min-width: 1024px) 25vw, 50vw"
            width={320}
            height={180}
            alt=""
            loading="lazy"
            decoding="async"
            className="block h-full w-full object-contain"
          />
        )}
      </div>
      <span className="flex flex-col px-3 py-2 font-sans">
        <span className="text-sm font-semibold text-ink group-hover:text-brand-hi">{x.model}</span>
        <span className="text-xs text-ink-mid">
          {x.kind ? t.parts.renderKindShort[x.kind] : t.parts.items[k].name}
        </span>
      </span>
    </a>
  );
}
