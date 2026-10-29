import type { DictBlock } from '../types';
import { H2, SECTION, SEC_HEAD, SEC_LEAD, WRAP } from '../lib/ui';

interface Props {
  t: DictBlock;
}

/** Sektörler (`#industries`): four ruled cells. */
export default function Industries({ t }: Props) {
  const ind = t.industries;
  return (
    <section id="industries" aria-labelledby="industries-title" className={SECTION}>
      <div className={WRAP}>
        <div className={SEC_HEAD}>
          <h2 id="industries-title" className={H2}>
            {ind.title}
          </h2>
          <p className={SEC_LEAD}>{ind.aside}</p>
        </div>
        <ul className="kv-ind">
          {ind.items.map((it, i) => (
            <li key={it.name}>
              <span className="kv-ind-no">{String(i + 1).padStart(2, '0')}</span>
              <h3>{it.name}</h3>
              <p>{it.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
