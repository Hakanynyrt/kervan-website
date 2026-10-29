import { motion } from 'framer-motion';
import { fadeUp, useReducedMotion } from '@kervan/motion';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

export default function About({ t }: Props) {
  const reduce = useReducedMotion();
  return (
    <>
      <section className="pt-10 pb-16 md:pt-16 md:pb-24">
        <motion.div
          className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-12 gap-x-0 gap-y-8 md:gap-16 items-start"
          variants={fadeUp}
          initial={reduce ? false : 'hidden'}
          animate="show"
        >
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
            <h1 className="font-sans font-bold text-[34px] md:text-[48px] text-ink leading-[1.08] tracking-[-0.03em] text-balance">
              {t.aboutPage.title}
            </h1>
            <span className="font-sans text-sm text-ink-soft mt-2">{t.aboutPage.location}</span>
            <span className="font-sans text-sm text-ink-soft">{t.aboutPage.company}</span>
          </div>

          <p className="col-span-12 lg:col-span-8 font-sans text-lg md:text-xl text-ink-mid leading-relaxed max-w-[60ch]">
            {t.aboutPage.body}
          </p>
        </motion.div>
      </section>
    </>
  );
}
