import { motion } from 'framer-motion';
import { SectionHeading } from '@kervan/ui';
import { fadeUp, inViewOnce, staggerContainer } from '@kervan/motion';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

export default function Services({ t }: Props) {
  return (
    <section
      id="hizmetler"
      className="min-h-dvh flex flex-col justify-center py-20 md:py-32"
    >
      <SectionHeading
        eyebrow={t.services.eyebrow}
        title={t.services.title}
        aside={t.services.aside}
      />

      <motion.div
        className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-px bg-hair"
        variants={staggerContainer(0, 0.12)}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        {t.services.items.map((s) => (
          <motion.article
            key={s.index}
            variants={fadeUp}
            className="bg-bg p-8 md:p-10 flex flex-col gap-6"
          >
            <div className="flex items-baseline gap-4">
              <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand">
                {s.index}
              </span>
              <h3 className="font-serif italic text-3xl md:text-4xl text-ink leading-tight">
                {s.name}
              </h3>
            </div>

            <p className="font-sans text-base text-ink-mid leading-relaxed">
              {s.body}
            </p>

            <ul className="flex flex-col gap-2 mt-auto pt-6 border-t border-hair">
              {s.bullets.map((b, i) => (
                <li
                  key={i}
                  className="font-sans text-sm text-ink-mid flex items-start gap-3"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 w-1 h-1 bg-brand rounded-full flex-shrink-0"
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
