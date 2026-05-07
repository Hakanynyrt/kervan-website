import { motion } from 'framer-motion';
import { fadeUp, inViewOnce, ScrollReveal } from '@kervan/motion';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

/**
 * Craft — atelier manifesto, heat-treatment voice.
 * Centered editorial copy block, italic Fraunces, generous whitespace.
 */
export default function Craft({ t }: Props) {
  return (
    <section
      id="imalathanemiz"
      className="min-h-dvh flex flex-col justify-center py-20 md:py-32 border-y border-hair"
    >
      <motion.div
        className="max-w-[820px] mx-auto px-6 md:px-8 flex flex-col gap-10 items-start"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium">
          {t.craft.eyebrow}
        </span>
        <h2 className="font-serif italic text-h2 text-ink leading-[1.1] tracking-[-0.015em]">
          {t.craft.title}
        </h2>
        <ScrollReveal className="font-serif italic text-xl md:text-2xl text-ink-mid leading-relaxed max-w-[44ch]">
          {t.craft.body}
        </ScrollReveal>
      </motion.div>
    </section>
  );
}
