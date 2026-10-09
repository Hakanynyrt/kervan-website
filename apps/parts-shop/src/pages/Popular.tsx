import { Container } from '@kervan/ui';
import FamilyCardView from '../components/FamilyCardView';
import { FOCUS } from '../components/Layout';
import { SearchForm } from '../components/ModelSearch';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { PART_KEYS, partItemPath, partPath, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'popular' }>;

export default function Popular({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const p = t.popular;
  // One block per part group (PART_KEYS order), best-seller order inside.
  const groups = PART_KEYS.map((k) => ({
    k,
    items: model.parts.filter((x) => x.part === k),
  })).filter((g) => g.items.length > 0);
  return (
    <Container className="py-12">
      <h1 className="m-0 font-sans text-3xl font-bold text-ink">{p.title}</h1>
      <p className="m-0 mt-3 font-sans text-ink-mid">{p.lead}</p>
      <div className="mt-6 max-w-2xl">
        <SearchForm lang={lang} t={t} />
      </div>

      <section aria-labelledby="pop-tips" className="mt-10">
        <h2 id="pop-tips" className="m-0 font-sans text-xl font-bold text-ink">
          {p.tips}
        </h2>
        <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-3 p-0 sm:gap-4 lg:grid-cols-4">
          {model.cards.map((c) => (
            <li key={c.slug}>
              <FamilyCardView c={c} lang={lang} t={t} />
            </li>
          ))}
        </ul>
      </section>

      {groups.length > 0 && (
        <section aria-labelledby="pop-parts" className="mt-14 border-t border-hair pt-10">
          <h2 id="pop-parts" className="m-0 font-sans text-xl font-bold text-ink">
            {p.parts}
          </h2>
          <p className="m-0 mt-2 max-w-3xl font-sans text-sm text-ink-mid">{p.partsLead}</p>
          {groups.map(({ k, items }) => (
            <div key={k} className="mt-8">
              <h3 className="m-0 font-sans text-base font-bold text-ink">
                <a href={localePath(partPath(k), lang)} className={`hover:text-brand-hi ${FOCUS}`}>
                  {t.parts.items[k].name} →
                </a>
              </h3>
              <ul className="m-0 mt-3 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-5">
                {items.map((x) => (
                  <li key={x.anchor}>
                    <a
                      href={localePath(partItemPath(k, x.anchor), lang)}
                      className={`group flex h-full flex-col overflow-hidden rounded-sm border border-hair bg-bg hover:border-hair-strong ${FOCUS}`}
                    >
                      <div className="aspect-video border-b border-hair bg-stage">
                        {x.hero && (
                          <img
                            src={`${x.hero}-xs.webp`}
                            srcSet={`${x.hero}-xs.webp 320w, ${x.hero}-lg.webp 1600w`}
                            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                            width={320}
                            height={180}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="block h-full w-full"
                          />
                        )}
                      </div>
                      <span className="flex flex-col px-3 py-2 font-sans">
                        <span className="text-sm font-semibold text-ink group-hover:text-brand-hi">
                          {x.model}
                        </span>
                        <span className="text-xs text-ink-mid">
                          {x.kind ? t.parts.renderKindShort[x.kind] : t.parts.items[k].name}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </Container>
  );
}
