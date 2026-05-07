import { motion } from 'framer-motion';
import { fadeUp, inViewOnce } from '@kervan/motion';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

export default function About({ t }: Props) {
  return (
    <section
      id="hakkimizda"
      className="min-h-[60dvh] flex flex-col justify-center py-20 md:py-32"
    >
      <motion.div
        className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-12 gap-8 md:gap-16 items-start"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
          <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand">
            {t.about.eyebrow}
          </span>
          <h2 className="font-serif italic text-3xl md:text-4xl text-ink leading-tight">
            {t.about.title}
          </h2>
          <span className="font-sans text-sm text-ink-soft mt-2">
            {t.about.location}
          </span>
        </div>

        <p className="col-span-12 lg:col-span-8 font-serif text-xl md:text-2xl text-ink-mid leading-relaxed italic max-w-[60ch]">
          {t.about.body}
        </p>
      </motion.div>
    </section>
  );
}
