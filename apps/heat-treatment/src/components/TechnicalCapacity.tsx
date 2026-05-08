import { motion } from 'framer-motion';
import { SectionHeading } from '@kervan/ui';
import { fadeUp, inViewOnce, staggerContainer } from '@kervan/motion';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

export default function TechnicalCapacity({ t }: Props) {
  return (
    <section
      id="teknik-kapasite"
      className="min-h-dvh flex flex-col justify-center py-20 md:py-32 bg-bg-soft/40"
    >
      <SectionHeading
        eyebrow={t.capacity.eyebrow}
        title={t.capacity.title}
        aside={t.capacity.aside}
      />

      <motion.dl
        className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-hair m-0"
        variants={staggerContainer(0, 0.08)}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        {t.capacity.items.map((c, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className="bg-bg p-8 md:p-10 flex flex-col gap-3"
          >
            <dt className="font-sans text-xs tracking-[0.2em] uppercase text-ink-soft">
              {c.label}
            </dt>
            <dd className="font-serif text-4xl md:text-5xl text-ink leading-none m-0 mt-1">
              {c.value}
            </dd>
            {c.note && (
              <p className="font-sans text-sm text-ink-mid mt-2">{c.note}</p>
            )}
          </motion.div>
        ))}
      </motion.dl>
    </section>
  );
}
