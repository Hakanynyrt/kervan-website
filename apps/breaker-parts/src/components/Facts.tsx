import type { DictBlock, Lang } from '../types';
import { EXPORTS } from '../lib/exports';
import { shopUrl } from '../lib/shop';
import { WRAP } from '../lib/ui';
import { ArrowRight, ClockIcon } from './icons';

interface Props {
  t: DictBlock;
  lang: Lang;
}

/**
 * The framed fact table right under the hero (kervanheat.com's capacity table, same frame):
 * 2004 / Kartepe / 40+ from `hero.stats`, the export count from `EXPORTS.length` (never typed in),
 * and a foot row with the quote note and the shop link.
 */
export default function Facts({ t, lang }: Props) {
  const f = t.facts;
  const cells = [...t.hero.stats.slice(0, 3), { n: `${EXPORTS.length}+`, l: f.exportsNote }];
  return (
    <section aria-labelledby="facts-title">
      <div className={`${WRAP} pt-3.5 pb-[18px] min-[721px]:pt-7 min-[721px]:pb-12`}>
        <div className="kv-spec">
          <div className="kv-spec-head">
            <h2 id="facts-title">{t.meta.siteName}</h2>
            <p>{f.sub}</p>
          </div>
          <dl>
            {cells.map((c, i) => (
              <div key={f.labels[i]}>
                <dt>{f.labels[i]}</dt>
                <dd>
                  <span className="kv-spec-v">{c.n}</span>
                  <span className="kv-spec-n">{c.l}</span>
                </dd>
              </div>
            ))}
          </dl>
          <div className="kv-spec-foot">
            <span className="kv-spec-foot-note">
              <ClockIcon />
              {f.quoteNote}
            </span>
            {/* The sister shop: same tab, no rel. */}
            <a href={shopUrl('/', lang)} hrefLang={lang}>
              {t.shop.listCta} <small>kiriciparca.com</small>
              <ArrowRight />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
