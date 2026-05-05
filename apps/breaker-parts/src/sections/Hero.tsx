import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { staggerContainer, lineReveal, fadeUp, kenBurns } from '@kervan/motion';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

export default function Hero({ t }: Props) {
  const reduced = useReducedMotion();

  const words1 = t.hero.title1.split(/\s+/).filter(Boolean);
  const words2 = t.hero.title2.split(/\s+/).filter(Boolean);

  return (
    <section className="relative min-h-dvh flex flex-col justify-center pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 80% 20%, rgba(232,67,27,0.10), transparent 55%)',
        }}
      />

      <div className="relative max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-12 gap-8 md:gap-12 items-center">
        {/* Copy — left */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-8">
          <motion.div
            className="font-sans text-eyebrow uppercase tracking-[0.2em] text-brand font-medium"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.hero.eyebrow}
          </motion.div>

          <motion.h1
            className="font-serif italic text-display text-ink leading-[0.95] tracking-[-0.025em]"
            variants={staggerContainer(0.2, reduced ? 0 : 0.1)}
            initial="hidden"
            animate="show"
            aria-label={`${t.hero.title1} ${t.hero.title2}`}
          >
            {[words1, words2].map((line, li) => (
              <span key={li} className="block">
                {line.map((w, wi) => (
                  <span key={`${li}-${wi}`}>
                    <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'baseline' }}>
                      <motion.span
                        variants={lineReveal}
                        style={{ display: 'inline-block', willChange: 'transform' }}
                      >
                        {w}
                      </motion.span>
                    </span>
                    {wi < line.length - 1 && ' '}
                  </span>
                ))}
              </span>
            ))}
          </motion.h1>

          <motion.p
            className="font-serif text-xl md:text-2xl text-ink-mid italic max-w-[52ch] leading-snug"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 1.0, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {t.hero.sub}
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4 mt-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <Link
              to="/iletisim"
              className="bg-brand text-bg px-7 py-3 font-sans text-sm tracking-wide hover:bg-brand-hi transition-colors"
            >
              {t.hero.cta}
            </Link>
            <Link
              to="/urunler"
              className="border border-ink text-ink px-7 py-3 font-sans text-sm tracking-wide hover:bg-ink hover:text-bg transition-colors"
            >
              {t.hero.ctaSecondary} →
            </Link>
          </motion.div>
        </div>

        {/* Product photo — right (hero hero shot) */}
        <motion.div
          className="col-span-12 lg:col-span-5 relative aspect-[3/4] overflow-hidden rounded-md border border-hair"
          initial="hidden"
          animate={['show', reduced ? 'show' : 'idle']}
          variants={kenBurns}
        >
          <img
            src="/photos/uclar/uclar-yard.jpeg"
            alt="Hidrolik kırıcı keski uçları — Kervan stok"
            width={1536}
            height={2048}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          {/* Subtle dark veil so the brand text on top stays legible if
              we later overlay a label. For now just a gentle vignette. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, transparent 60%, rgba(10,10,11,0.55) 100%)',
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}
