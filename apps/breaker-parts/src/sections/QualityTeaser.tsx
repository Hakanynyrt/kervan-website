import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fadeUp, inViewOnce } from '@kervan/motion';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

export default function QualityTeaser({ t }: Props) {
  return (
    <section className="py-20 md:py-32">
      <motion.div
        className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-12 gap-8 md:gap-16 items-start"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
          <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium">
            {t.qualityTeaser.eyebrow}
          </span>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <h2 className="font-serif italic text-h2 text-ink leading-[1.1] tracking-[-0.015em] max-w-[28ch]">
            {t.qualityTeaser.title}
          </h2>
          <p className="font-serif text-xl md:text-2xl text-ink-mid italic leading-relaxed max-w-[52ch]">
            {t.qualityTeaser.body}
          </p>
          <Link
            to="/uretim-kalite"
            className="font-sans text-sm tracking-[0.16em] uppercase text-brand hover:text-brand-hi transition-colors mt-2 inline-block"
          >
            {t.qualityTeaser.link}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
