import type { DictBlock, ExportRegion, Lang } from '../types';
import { EXPORTS, ORIGIN } from '../lib/exports';
import { shopUrl } from '../lib/shop';
import { H2, SECTION, WRAP } from '../lib/ui';

interface Props {
  t: DictBlock;
  lang: Lang;
}

const REGIONS: ExportRegion[] = ['europe', 'mena', 'asia', 'americas'];

/** İhracat (`#exports`): the count and the destination countries by region, both from
 *  lib/exports.ts, so the page never drifts from the list. */
export default function Exports({ t, lang }: Props) {
  const e = t.exports;
  const country = (p: (typeof EXPORTS)[number]) => (lang === 'tr' ? p.countryTr : p.country);
  return (
    <section id="exports" aria-labelledby="exports-title" className={`${SECTION} bg-bg-soft`}>
      <div className={`${WRAP} kv-exp`}>
        <div>
          <h2 id="exports-title" className={H2}>
            {e.title.replace('{count}', String(EXPORTS.length))}
          </h2>
          <p className="m-0 mt-3.5 text-base min-[721px]:text-[17px] text-ink-mid max-w-[440px]">
            {e.aside}
          </p>
          {/* The sister shop's international orders page: same tab, no rel. */}
          <p className="m-0 mt-3 text-base">
            <a
              href={shopUrl('/ihracat', lang)}
              hrefLang={lang}
              className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4"
            >
              {e.terms} →
            </a>
          </p>
        </div>
        <div className="kv-regions">
          {REGIONS.map((r) => {
            const list = [...new Set(EXPORTS.filter((p) => p.region === r).map(country))];
            return list.length ? (
              <div key={r}>
                <h3>{e.regions[r]}</h3>
                <p>{list.join(' · ')}</p>
              </div>
            ) : null;
          })}
          <div className="kv-regions-home">
            <p>
              {ORIGIN.cityTr} · {country(ORIGIN)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
