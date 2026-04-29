import { motion } from 'framer-motion';
import { fadeUp, inViewOnce } from '../lib/motion';

interface Props {
  eyebrow: string;
  title: string;
  aside?: string;
  controls?: React.ReactNode;
}

/** Reusable editorial section header. 12-col grid, 7+5 split (title + aside). */
export default function SectionHead({ eyebrow, title, aside, controls }: Props) {
  return (
    <div className="max-w-[1280px] mx-auto px-8 grid grid-cols-12 gap-8 items-end mb-16 md:mb-20">
      <motion.div
        className="col-span-12 lg:col-span-7 flex flex-col gap-5"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        <div className="font-eyebrow">{eyebrow}</div>
        <h2 className="font-h2 text-ink whitespace-pre-line">
          <span className="italic">{title.split('.')[0]}.</span>
          {title.includes('\n') && (
            <span className="block">{title.split('\n').slice(1).join('\n')}</span>
          )}
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
          {aside && <p className="font-serif italic text-lg text-ink-mid leading-relaxed max-w-[40ch]">{aside}</p>}
          {controls}
        </motion.div>
      )}
    </div>
  );
}
