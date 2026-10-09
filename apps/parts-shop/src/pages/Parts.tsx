import { Container } from '@kervan/ui';
import { Breadcrumb, PageTitle } from '../components/Bits';
import { PartGroups } from '../components/PartGroups';
import type { Dict } from '../lib/dict';
import { fmtNum } from '../lib/format';
import { PART_RENDERS, PLANT_PHOTOS, renderStats } from '../lib/photos';
import { PART_KEYS, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'parts' }>;

/** Every product group: tips and the other breaker parts we make, then our plant. */
export default function Parts({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  // Renders across every part group (tip counts are on the tips card).
  const all = renderStats(PART_KEYS.flatMap((k) => PART_RENDERS[k]));
  const figures: [number, string][] = [
    [all.parts, t.parts.stats.parts],
    [all.models, t.parts.stats.models],
    [all.makes, t.parts.stats.makes],
  ];
  return (
    <>
      <section className="border-b border-hair bg-bg-soft">
        <Container className="py-10">
          <Breadcrumb trail={[]} current={t.parts.title} lang={lang} t={t} />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <PageTitle>{t.parts.title}</PageTitle>
              <p className="m-0 mt-3 max-w-3xl font-sans text-ink-mid">{t.parts.lead}</p>
            </div>
            <div>
              <dl className="m-0 grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-hair bg-hair">
                {figures.map(([n, label]) => (
                  <div key={label} className="flex flex-col-reverse bg-bg px-3 py-4 sm:px-5">
                    <dt className="font-sans text-sm text-ink-mid">{label}</dt>
                    <dd className="m-0 font-sans text-2xl font-bold tabular-nums text-ink">
                      {fmtNum(n, lang)}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="m-0 mt-3 max-w-3xl font-sans text-xs text-ink-soft">
                {t.parts.fitNote}
              </p>
            </div>
          </div>
        </Container>
      </section>
      <Container className="py-12">
        <h2 id="groups" className="m-0 mb-6 font-sans text-2xl font-bold text-ink">
          {t.parts.groupsTitle}
        </h2>
        <PartGroups tips={model.tips} demo={model.demo} lang={lang} t={t} />

        <section aria-labelledby="plant" className="mt-14 border-t border-hair pt-12">
          <h2 id="plant" className="m-0 font-sans text-2xl font-bold text-ink">
            {t.parts.plant.title}
          </h2>
          <p className="m-0 mt-2 max-w-3xl font-sans text-ink-mid">{t.parts.plant.lead}</p>
          <ul className="m-0 mt-6 grid list-none grid-cols-2 gap-4 p-0 lg:grid-cols-4">
            {PLANT_PHOTOS.map((p, i) => (
              <li key={p}>
                <figure className="m-0">
                  <img
                    src={`${p}-sm.webp`}
                    srcSet={`${p}-sm.webp 480w, ${p}-lg.webp 960w`}
                    sizes="(min-width: 1024px) 290px, 50vw"
                    width={480}
                    height={600}
                    alt={t.parts.plant.items[i].alt}
                    loading="lazy"
                    decoding="async"
                    className="block aspect-[4/5] h-auto w-full rounded-sm border border-hair bg-bg-warm object-cover"
                  />
                  <figcaption className="mt-2 font-sans text-sm text-ink-mid">
                    {t.parts.plant.items[i].caption}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-4 font-sans text-xs text-ink-soft">{t.parts.plant.note}</p>
        </section>
      </Container>
    </>
  );
}
