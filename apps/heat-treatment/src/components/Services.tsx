import { motion } from 'framer-motion';
import { fadeUp, inViewOnce, staggerContainer, useReducedMotion } from '@kervan/motion';
import type { DictBlock, Lang } from '../types';
import { H2, SECTION, SEC_HEAD, SEC_LEAD, WRAP } from '../lib/ui';

interface Props {
  t: DictBlock;
  lang: Lang;
}

/**
 * The processes we offer (a list, owner Oct 2026), the hardness-report quality line, then two
 * cards: contract / special jobs and our own parts. Two cards in a two-column grid, so no
 * empty cell is left on desktop.
 */
export default function Services({ t, lang }: Props) {
  // Static (prerendered) mode and reduced motion render the final state.
  const reduce = useReducedMotion();
  const s = t.services;
  return (
    <section id="hizmetler" aria-labelledby="hizmetler-title" className={`${SECTION} bg-bg-soft`}>
      <div className={WRAP}>
        <div className={SEC_HEAD}>
          <h2 id="hizmetler-title" className={H2}>
            {s.title}
          </h2>
          <p className={SEC_LEAD}>{s.aside}</p>
        </div>

        <motion.ul
          aria-label={s.processesLabel}
          className="list-none m-0 p-0 border-t border-hair-strong"
          variants={staggerContainer(0, 0.06)}
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={inViewOnce}
        >
          {s.processes.map((p) => (
            <motion.li
              key={p.name}
              variants={fadeUp}
              className="grid grid-cols-1 gap-1.5 py-[18px] min-[721px]:grid-cols-[340px_1fr] min-[721px]:gap-8 min-[721px]:py-[22px] border-b border-hair"
            >
              <h3 className="m-0 font-sans text-[19px] min-[721px]:text-[21px] font-bold leading-[1.2] tracking-[-0.015em] text-ink">
                {p.name}
              </h3>
              <p className="m-0 font-sans text-base text-ink-mid max-w-[640px]">{p.body}</p>
            </motion.li>
          ))}
          <motion.li
            variants={fadeUp}
            className="grid grid-cols-1 gap-1.5 py-[18px] min-[721px]:grid-cols-[340px_1fr] min-[721px]:gap-8 min-[721px]:py-[22px] border-b border-hair"
          >
            <h3 className="m-0 flex items-center gap-2.5 font-sans text-[17px] font-bold leading-[1.2] text-ink">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                className="flex-none"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              {s.quality.name}
            </h3>
            <p className="m-0 font-sans text-base text-ink-mid max-w-[640px]">{s.quality.body}</p>
          </motion.li>
        </motion.ul>

        <motion.div
          className="mt-10 min-[721px]:mt-14 grid grid-cols-1 gap-4 min-[721px]:grid-cols-2 min-[721px]:gap-6"
          variants={staggerContainer(0, 0.1)}
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={inViewOnce}
        >
          {s.items.map((item) => (
            <motion.article
              key={item.index}
              variants={fadeUp}
              className="bg-panel border border-hair rounded-[4px] px-5 py-6 min-[721px]:p-9"
            >
              <span className="font-sans text-sm font-semibold text-ink-mid tabular-nums">
                {item.index}
              </span>
              <h3 className="m-0 mt-2 font-sans text-[22px] min-[721px]:text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-ink">
                {item.name}
              </h3>
              <p className="m-0 mt-3.5 font-sans text-base text-ink-mid">{item.body}</p>

              <ul className="list-none m-0 p-0 mt-[22px] border-t border-hair">
                {item.bullets.map((b, i) =>
                  typeof b === 'string' ? (
                    <li
                      key={i}
                      className="py-2.5 border-b border-hair font-sans text-[15px] text-ink"
                    >
                      {b}
                    </li>
                  ) : (
                    <li key={i} className="border-b border-hair">
                      {/* Sister site: same tab, no rel. */}
                      <a
                        href={b.href}
                        hrefLang={lang}
                        className="flex items-center justify-between gap-3 min-h-12 font-sans text-[15px] font-semibold text-brand hover:underline underline-offset-2"
                      >
                        <span className="font-normal text-ink">{b.label}</span>
                        <span>
                          {b.site} <span aria-hidden="true">{t.marks.external}</span>
                        </span>
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
