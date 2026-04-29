import { motion } from 'framer-motion';
import type { DictBlock } from '../types';
import { fadeUp, kenBurns, inViewOnce } from '../lib/motion';
import ScrollReveal from './ui/ScrollReveal';

interface Props {
  t: DictBlock;
}

export default function Craft({ t }: Props) {
  return (
    <section id="craft" className="py-24 md:py-32 bg-bg-warm/50">
      <div className="max-w-[1280px] mx-auto px-8 grid grid-cols-12 gap-8 md:gap-12 items-center">
        {/* Copy block — 5 col */}
        <motion.div
          className="col-span-12 lg:col-span-5 flex flex-col gap-8"
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
          <div className="font-sans text-xs tracking-widest uppercase text-ink-soft mt-4">
            Hakan Yünyurt · Kurucu
          </div>
        </motion.div>

        {/* Photo — 7 col asymmetric */}
        <motion.div
          className="col-span-12 lg:col-span-7 lg:col-start-6 aspect-[4/5] lg:aspect-[5/6] overflow-hidden"
          initial="hidden"
          whileInView={['show', 'idle']}
          viewport={inViewOnce}
          variants={kenBurns}
        >
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: 'url(/photos/workshop-overview.jpeg)' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
