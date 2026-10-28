import { motion } from 'framer-motion';
import { fadeUp, inViewOnce, useReducedMotion } from '@kervan/motion';
import type { DictBlock } from '../types';
import { SECTION, WRAP } from '../lib/ui';

interface Props {
  t: DictBlock;
}

export default function About({ t }: Props) {
  // Static (prerendered) mode and reduced motion render the final state.
  const reduce = useReducedMotion();
  return (
    <section id="hakkimizda" aria-labelledby="hakkimizda-title" className={`${SECTION} bg-bg-soft`}>
      <motion.div
        className={`${WRAP} grid grid-cols-1 gap-5 min-[721px]:grid-cols-[5fr_7fr] min-[721px]:gap-14 items-start`}
        variants={fadeUp}
        initial={reduce ? false : 'hidden'}
        whileInView="show"
        viewport={inViewOnce}
      >
        <div>
          <h2
            id="hakkimizda-title"
            className="m-0 font-sans font-bold text-ink text-2xl min-[721px]:text-[30px] leading-[1.2] tracking-[-0.02em]"
          >
            {t.about.title}
          </h2>
          <p className="m-0 mt-3 font-sans text-[15px] text-ink-mid">{t.about.location}</p>
        </div>
        <p className="m-0 font-sans text-[17px] min-[721px]:text-xl leading-[1.55] text-ink max-w-[640px]">
          {t.about.body}
        </p>
      </motion.div>
    </section>
  );
}
