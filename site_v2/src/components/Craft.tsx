import { motion } from 'framer-motion';
import type { DictBlock } from '../types';
import { fadeUp, inViewOnce } from '../lib/motion';
import ScrollReveal from './ui/ScrollReveal';

interface Props {
  t: DictBlock;
}

/**
 * Craft — atelier manifesto. Foto kaldırıldı (chisel artık BG'de). Tek
 * sütun centered editorial copy bloğu, geniş whitespace, italic Fraunces.
 */
export default function Craft({ t }: Props) {
  return (
    <section id="craft" className="py-32 md:py-48 border-y border-hair">
      <motion.div
        className="max-w-[820px] mx-auto px-8 flex flex-col gap-10 items-start"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        <div className="font-eyebrow">{t.craft.eyebrow}</div>
        <h2 className="font-h2 italic text-ink">{t.craft.title}</h2>
        <ScrollReveal className="text-ink-mid max-w-[44ch]">
          {t.craft.body}
        </ScrollReveal>
      </motion.div>
    </section>
  );
}
