import { motion, useReducedMotion } from 'framer-motion';
import type { DictBlock } from '../types';
import { staggerContainer, lineReveal, fadeUp } from '../lib/motion';

interface Props {
  t: DictBlock;
}

export default function Hero({ t }: Props) {
  const reduced = useReducedMotion();

  // Whitespace-split her satır için kelime listesi.
  const words1 = t.hero.title1.split(/\s+/).filter(Boolean);
  const words2 = t.hero.title2.split(/\s+/).filter(Boolean);

  return (
    <section className="relative min-h-dvh snap-start snap-always flex flex-col justify-center pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-8 grid grid-cols-12 gap-8 md:gap-12 items-center">
        {/* Copy — sol yarı */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-8">
          <motion.div
            className="font-eyebrow"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.hero.eyebrow}
          </motion.div>

          <motion.h1
            className="font-display text-ink"
            variants={staggerContainer(0.2, reduced ? 0 : 0.12)}
            initial="hidden"
            animate="show"
            aria-label={`${t.hero.title1} ${t.hero.title2}`}
          >
            {[words1, words2].map((line, li) => (
              <span key={li} className="block">
                {line.map((w, wi) => (
                  <span
                    key={`${li}-${wi}`}
                    style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'baseline' }}
                  >
                    <motion.span
                      variants={lineReveal}
                      style={{ display: 'inline-block', willChange: 'transform' }}
                    >
                      {w}
                    </motion.span>
                    {wi < line.length - 1 && ' '}
                  </span>
                ))}
              </span>
            ))}
          </motion.h1>

          <motion.p
            className="font-serif text-xl md:text-2xl text-ink-mid italic max-w-[44ch] leading-snug"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.hero.sub}
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4 mt-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.5 }}
          >
            <a
              href="#contact"
              className="bg-brand text-bg px-7 py-3 font-sans text-sm tracking-wide hover:bg-brand-dim transition-colors"
            >
              {t.hero.cta}
            </a>
            <a
              href="#products"
              className="border border-ink text-ink px-7 py-3 font-sans text-sm tracking-wide hover:bg-ink hover:text-bg transition-colors"
            >
              {t.hero.ctaSecondary} →
            </a>
          </motion.div>
        </div>

        {/* Stats — sağ yarı, chisel arka planda görünüyor */}
        <motion.div
          className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-8"
          variants={staggerContainer(1.6, 0.12)}
          initial="hidden"
          animate="show"
        >
          {t.hero.stats.map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="flex flex-col gap-2 border-t border-hair pt-5">
              <div className="font-serif text-5xl md:text-6xl text-ink leading-none">{s.n}</div>
              <div className="font-sans text-xs tracking-widest uppercase text-ink-soft">{s.l}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
