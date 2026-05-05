import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeUp, inViewOnce } from '@kervan/motion';
import { cn } from '../lib/cn.js';

interface Props {
  eyebrow: string;
  title: string;
  aside?: string;
  controls?: ReactNode;
  className?: string;
}

/** Editorial section header. 12-col grid, 7+5 split (title + aside).
 *  First sentence of `title` (split on '.') is rendered italic for editorial
 *  rhythm — keep titles short and self-punctuated. */
export function SectionHeading({ eyebrow, title, aside, controls, className }: Props) {
  const [firstSentence, ...rest] = title.split('.');
  const remainder = rest.join('.').trim();

  return (
    <div
      className={cn(
        'max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-12 gap-8 items-end mb-16 md:mb-20',
        className,
      )}
    >
      <motion.div
        className="col-span-12 lg:col-span-7 flex flex-col gap-5"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        <div className="font-sans text-eyebrow uppercase tracking-[0.2em] text-ink-soft font-medium">
          {eyebrow}
        </div>
        <h2 className="font-serif text-h2 text-ink whitespace-pre-line leading-[1.1] tracking-[-0.015em]">
          <span className="italic">{firstSentence}.</span>
          {remainder && <span className="block">{remainder}</span>}
        </h2>
      </motion.div>
      {(aside || controls) && (
        <motion.div
          className="col-span-12 lg:col-span-5 flex flex-col gap-4"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          transition={{ delay: 0.1 }}
        >
          {aside && (
            <p className="font-serif italic text-lg text-ink-mid leading-relaxed max-w-[40ch]">
              {aside}
            </p>
          )}
          {controls}
        </motion.div>
      )}
    </div>
  );
}
