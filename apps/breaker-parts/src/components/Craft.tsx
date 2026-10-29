import { KERVAN_HEAT_URL } from '@kervan/seo';
import type { DictBlock, Lang } from '../types';
import { H2, SECTION, WRAP } from '../lib/ui';

interface Props {
  t: DictBlock;
  lang: Lang;
}

const PHOTOS = [
  '/photos/atolye/torna-holu-01-w1280.webp',
  '/photos/atolye/cnc-machining-w1280.webp',
];

/** İmalathanemiz (`#craft`): two workshop photos, the body and the material / process table,
 *  with the link to the heat-treatment line on kervanheat.com. */
export default function Craft({ t, lang }: Props) {
  const c = t.craft;
  const pp = t.productionPage;
  const photos = PHOTOS.map((img) => t.atolye.items.find((i) => i.img === img)).filter(
    (i) => i !== undefined,
  );
  return (
    <section id="craft" aria-labelledby="craft-title" className={`${SECTION} bg-bg-soft`}>
      <div className={`${WRAP} kv-craft`}>
        <div className="kv-craft-ph">
          {photos.map((p) => (
            <img
              key={p.img}
              src={p.img}
              alt={`${p.name}: ${p.desc}`}
              width={1280}
              height={960}
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
        <div>
          <h2 id="craft-title" className={H2}>
            {c.title}
          </h2>
          <p className="m-0 mt-[18px] text-[17px] min-[721px]:text-lg leading-[1.6]">{c.body}</p>
          <dl className="kv-mat">
            <div>
              <dt>{pp.materialsHeading}</dt>
              <dd>
                <b className="font-semibold">{pp.materials.slice(0, 2).join(' · ')}</b>
                {pp.materials.slice(2).map((m) => ` · ${m}`)}
              </dd>
            </div>
            <div>
              <dt>{pp.heatHeading}</dt>
              <dd>{c.heat}</dd>
            </div>
            <div>
              <dt>{pp.metallurgyHeading}</dt>
              <dd>{c.metallurgy}</dd>
            </div>
          </dl>
          {/* The sister site: same tab, no rel. */}
          <a
            href={lang === 'en' ? `${KERVAN_HEAT_URL}/en/` : `${KERVAN_HEAT_URL}/`}
            hrefLang={lang}
            className="inline-flex items-center min-h-11 mt-3.5 font-semibold text-brand hover:underline underline-offset-2"
          >
            {pp.heatLink}
          </a>
        </div>
      </div>
    </section>
  );
}
