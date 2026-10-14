import { motion } from 'framer-motion';
import { SectionHeading } from '@kervan/ui';
import { fadeUp, inViewOnce, staggerContainer, useReducedMotion } from '@kervan/motion';
import type { DictBlock, Lang } from '../types';

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
    <section id="hizmetler" className="min-h-dvh flex flex-col justify-center py-20 md:py-32">
      <SectionHeading
        eyebrow={s.eyebrow}
        title={s.title}
        aside={s.aside}
        className="w-full kv-heading"
      />

      <div className="max-w-[1280px] w-full mx-auto px-6 md:px-8 flex flex-col gap-12 md:gap-16">
        <motion.ul
          aria-label={s.processesLabel}
          className="list-none m-0 p-0 border-t border-hair"
          variants={staggerContainer(0, 0.06)}
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={inViewOnce}
        >
          {s.processes.map((p) => (
            <motion.li
              key={p.name}
              variants={fadeUp}
              className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-2 py-5 md:py-6 border-b border-hair"
            >
              <h3 className="md:col-span-5 font-serif italic text-2xl md:text-3xl text-ink leading-tight">
                {p.name}
              </h3>
              <p className="md:col-span-7 font-sans text-base text-ink-mid leading-relaxed md:pt-1 max-w-[60ch]">
                {p.body}
              </p>
            </motion.li>
          ))}
          <motion.li
            variants={fadeUp}
            className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-2 py-5 md:py-6 border-b border-hair"
          >
            <p className="md:col-span-5 m-0 flex items-start gap-3 font-sans text-base font-medium text-ink">
              <span aria-hidden="true" className="mt-2.5 w-1.5 h-1.5 bg-brand flex-shrink-0" />
              {s.quality.name}
            </p>
            <p className="md:col-span-7 font-sans text-base text-ink-mid leading-relaxed m-0 max-w-[60ch]">
              {s.quality.body}
            </p>
          </motion.li>
        </motion.ul>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-px bg-hair border border-hair"
          variants={staggerContainer(0, 0.1)}
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={inViewOnce}
        >
          {s.items.map((item) => (
            <motion.article
              key={item.index}
              variants={fadeUp}
              className="bg-bg p-6 md:p-10 flex flex-col gap-6"
            >
              <div className="flex items-baseline gap-4">
                <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand">
                  {item.index}
                </span>
                <h3 className="font-serif italic text-3xl md:text-4xl text-ink leading-tight">
                  {item.name}
                </h3>
              </div>

              <p className="font-sans text-base text-ink-mid leading-relaxed">{item.body}</p>

              <ul className="flex flex-col gap-2 mt-auto pt-6 border-t border-hair">
                {item.bullets.map((b, i) => (
                  <li key={i} className="font-sans text-sm text-ink-mid flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2 w-1 h-1 bg-brand rounded-full flex-shrink-0"
                    />
                    {typeof b === 'string' ? (
                      <span>{b}</span>
                    ) : (
                      // Sister site: same tab, no rel, underlined so it is not told apart by colour only.
                      <span>
                        {b.label}:{' '}
                        <a
                          href={b.href}
                          hrefLang={lang}
                          className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                        >
                          {/* Styled on the span: the global `a` rule is unlayered and outranks utilities. */}
                          <span className="text-ink underline underline-offset-2 group-hover:text-brand-hi transition-colors">
                            {b.site}
                          </span>
                        </a>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
