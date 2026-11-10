import { Button } from '@astryxdesign/core/Button';
import type { DictBlock, Lang } from '../types';
import { shopUrl } from '../lib/shop';
import { H2, SECTION, SEC_HEAD, SEC_LEAD, WRAP } from '../lib/ui';

interface Props {
  t: DictBlock;
  lang: Lang;
}

/** Compatible makes (`#brands`): the names in a ruled grid and a button to the shop. */
export default function Makes({ t, lang }: Props) {
  const b = t.brands;
  return (
    <section id="brands" aria-labelledby="brands-title" className={`${SECTION} bg-bg-soft`}>
      <div className={WRAP}>
        <div className={SEC_HEAD}>
          <h2 id="brands-title" className={H2}>
            {b.title}
          </h2>
          <p className={SEC_LEAD}>{b.sub}</p>
        </div>
        <ul className="kv-makes">
          {b.items.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        <div className="mt-5">
          {/* The sister shop: same tab, no rel. */}
          <Button
            href={shopUrl('/', lang)}
            label={t.shop.brandsCta}
            size="lg"
            className="kv-btn kv-btn-line max-[720px]:w-full"
            {...{ hrefLang: lang }}
          />
        </div>
      </div>
    </section>
  );
}
