import { motion } from 'framer-motion';
import type { DictBlock } from '../types';
import { fadeUp, inViewOnce } from '../lib/motion';

interface Props {
  t: DictBlock;
}

/**
 * BrandMarquee — uyumlu kırıcı markaları sonsuz kayan şerit.
 * Italic Fraunces marka isimleri, her biri 3D-perspective tilt'li kart.
 * İki kopya alt alta kayar — biri sola, biri sağa (counter-rotation).
 */
export default function BrandMarquee({ t }: Props) {
  const items = [...t.brands.items, ...t.brands.items]; // duplicate for seamless loop

  return (
    <section
      className="py-24 md:py-32 border-y border-hair overflow-hidden"
      style={{ perspective: '1200px' }}
    >
      <motion.div
        className="max-w-[1280px] mx-auto px-6 md:px-8 mb-12 md:mb-16 flex flex-col gap-4"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        <div className="font-eyebrow">{t.brands.eyebrow}</div>
        <h2 className="font-h3 italic text-ink max-w-[40ch]">{t.brands.title}</h2>
      </motion.div>

      {/* Top row — kayar sola */}
      <div className="overflow-hidden whitespace-nowrap py-4">
        <motion.div
          className="inline-flex gap-6"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 60, ease: 'linear', repeat: Infinity }}
          style={{ transform: 'rotateX(8deg)' }}
        >
          {items.map((b, i) => (
            <span
              key={`a-${i}`}
              className="inline-flex items-center px-8 py-4 border border-hair bg-bg-soft/40 font-serif italic text-2xl md:text-3xl text-ink whitespace-nowrap"
              style={{ transform: 'translateZ(20px)' }}
            >
              {b}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Bottom row — kayar sağa, ters yönde */}
      <div className="overflow-hidden whitespace-nowrap py-4 mt-2">
        <motion.div
          className="inline-flex gap-6"
          animate={{ x: ['-50%', '0%'] }}
          transition={{ duration: 75, ease: 'linear', repeat: Infinity }}
          style={{ transform: 'rotateX(-8deg)' }}
        >
          {items.map((b, i) => (
            <span
              key={`b-${i}`}
              className="inline-flex items-center px-8 py-4 border border-hair bg-bg-soft/40 font-serif italic text-2xl md:text-3xl text-ink-mid whitespace-nowrap"
              style={{ transform: 'translateZ(10px)' }}
            >
              {b}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
