import { motion, useReducedMotion } from 'framer-motion';
import type { DictBlock } from '../types';
import {
  durations,
  editorialEase,
  fadeUp,
  inViewOnce,
  lineReveal,
  staggerContainer,
} from '../lib/motion';

interface Props {
  t: DictBlock;
}

export default function Hero({ t }: Props) {
  const reduced = useReducedMotion();
  // The opening hold keeps the first viewport empty, so the hero is below the fold at load.
  // It plays when it scrolls into view (once) instead of finishing unseen on mount.
  const view = { whileInView: 'show', viewport: inViewOnce } as const;
  const hidden = reduced ? 'show' : 'hidden';
  // Explicit initial/whileInView objects (not variants) so the delay below really applies.
  const rise = (delay: number, y: number, duration: number) => ({
    initial: reduced ? (false as const) : { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: inViewOnce,
    transition: { duration, ease: editorialEase, delay },
  });

  // Whitespace-split her satır için kelime listesi.
  const words1 = t.hero.title1.split(/\s+/).filter(Boolean);
  const words2 = t.hero.title2.split(/\s+/).filter(Boolean);

  return (
    <section
      data-scene-pose="hero"
      className="relative min-h-dvh flex flex-col justify-center pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden"
    >
      <div className="max-w-[1280px] mx-auto px-8 grid grid-cols-12 gap-x-0 gap-y-8 md:gap-12 items-center">
        {/* Copy — sol yarı */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-8">
          <motion.div className="font-eyebrow" {...rise(0.1, 8, durations.lg)}>
            {t.hero.eyebrow}
          </motion.div>

          <motion.h1
            className="font-display text-ink"
            style={{ letterSpacing: '-0.005em' }}
            variants={staggerContainer(0.2, reduced ? 0 : 0.12)}
            initial={hidden}
            {...view}
            aria-label={`${t.hero.title1} ${t.hero.title2}`}
          >
            {[words1, words2].map((line, li) => (
              <span key={li} className="block">
                {line.map((w, wi) => (
                  <span key={`${li}-${wi}`}>
                    <span
                      style={{
                        display: 'inline-block',
                        overflow: 'hidden',
                        verticalAlign: 'baseline',
                        // room for descenders that the mask would clip
                        paddingBottom: '0.14em',
                        marginBottom: '-0.14em',
                      }}
                    >
                      <motion.span
                        variants={lineReveal}
                        style={{ display: 'inline-block', willChange: 'transform' }}
                      >
                        {w}
                      </motion.span>
                    </span>
                    {wi < line.length - 1 && ' '}
                  </span>
                ))}
              </span>
            ))}
          </motion.h1>

          <motion.p
            className="font-serif text-xl md:text-2xl text-ink-mid italic max-w-[44ch] leading-snug"
            {...rise(0.7, 18, durations.lg)}
          >
            {t.hero.sub}
          </motion.p>

          <motion.div className="flex flex-wrap gap-4 mt-2" {...rise(0.85, 12, durations.md)}>
            <a
              href="#contact"
              className="bg-brand text-bg px-7 py-3 font-sans text-sm tracking-wide hover:bg-brand-hi transition-colors"
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
          variants={staggerContainer(1, 0.12)}
          initial={hidden}
          {...view}
        >
          {t.hero.stats.map((s, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="flex flex-col gap-2 border-t border-hair pt-5"
            >
              <div className="font-serif text-5xl md:text-6xl text-ink leading-none">{s.n}</div>
              <div className="font-sans text-xs tracking-widest uppercase text-ink-soft">{s.l}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
