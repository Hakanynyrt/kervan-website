import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  durations,
  editorialEase,
  staggerContainer,
  lineReveal,
  fadeUp,
  useReducedMotion,
} from '@kervan/motion';
import type { DictBlock } from '../types';
import HeroFilm from './HeroFilm';

interface Props {
  t: DictBlock;
}

/** Same flag IntroOverlay sets; read once on mount, before the overlay writes it. */
const INTRO_KEY = 'kv_v2_intro_seen';
/** The curtain opens and its brand text fades by ~2 s. */
const INTRO_WAIT = 2;
/** Last stat starts at t0 + 1 + 3 × 0.12 and runs 0.6 s → ends t0 + 1.96. Keep in sync with the dl stagger. */
const HERO_SEQ_END = 2;
const introPending = (): boolean => {
  try {
    return sessionStorage.getItem(INTRO_KEY) !== '1';
  } catch {
    return false;
  }
};

export default function Hero({ t }: Props) {
  const reduced = useReducedMotion();
  // First visit: the hero waits for the intro curtain. Later visits start right away.
  const [t0] = useState(() => (!reduced && introPending() ? INTRO_WAIT : 0));
  // Explicit initial/animate objects (not variants) so the delay below really applies.
  const rise = (delay: number, y: number, duration: number) => ({
    initial: reduced ? (false as const) : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration, ease: editorialEase, delay: t0 + delay },
  });

  const words1 = t.hero.title1.split(/\s+/).filter(Boolean);
  const words2 = t.hero.title2.split(/\s+/).filter(Boolean);

  return (
    <section className="relative min-h-dvh flex flex-col justify-center pt-[calc(8rem+var(--kv-strip-h))] pb-16 md:pt-[calc(10rem+var(--kv-strip-h))] md:pb-24 overflow-hidden">
      {/* Subtle radial gradient — forge ember warmth without an asset */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 75% 30%, rgba(232,67,27,0.08), transparent 55%)',
        }}
      />

      <div className="relative w-full max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-1 gap-y-8 md:gap-y-12 lg:grid-cols-[calc((100%_-_33rem)*7/12_+_18rem)_9rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-0 lg:items-start">
        {/* Copy — left */}
        <div className="flex flex-col gap-8 lg:col-start-1 lg:row-start-1 lg:row-span-2">
          <motion.div
            className="font-sans text-eyebrow uppercase tracking-[0.2em] text-brand font-medium"
            {...rise(0.1, 8, durations.lg)}
          >
            {t.hero.eyebrow}
          </motion.div>

          <motion.h1
            className="font-serif italic text-[clamp(26px,8vw,56px)] sm:text-display text-ink leading-[0.95] tracking-[-0.025em]"
            variants={staggerContainer(t0 + 0.2, reduced ? 0 : 0.1)}
            initial={reduced ? 'show' : 'hidden'}
            animate="show"
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
                        // room for descenders (p, ş, ç, g) that the mask would clip
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
                    {wi < line.length - 1 && ' '}
                  </span>
                ))}
              </span>
            ))}
          </motion.h1>

          <motion.p
            className="font-serif text-xl md:text-2xl text-ink-mid italic max-w-[52ch] leading-snug"
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
              href="#hizmetler"
              className="border border-ink text-ink px-7 py-3 font-sans text-sm tracking-wide hover:bg-ink hover:text-bg transition-colors"
            >
              {t.hero.ctaSecondary} →
            </a>
          </motion.div>
        </div>

        {/* Film — far right column at lg; below lg it comes before the stats so phones see it on the first screen. */}
        <HeroFilm t={t} startAt={t0 + HERO_SEQ_END} />

        {/* Stats — middle column at lg (capacity numbers, not marketing claims) */}
        <motion.dl
          className="grid grid-cols-2 gap-8 m-0 lg:col-start-2 lg:row-start-1 lg:self-stretch lg:flex lg:flex-col lg:justify-between lg:gap-6"
          variants={staggerContainer(t0 + 1, 0.12)}
          initial={reduced ? 'show' : 'hidden'}
          animate="show"
        >
          {t.hero.stats.map((s, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="flex flex-col-reverse gap-2 border-t border-hair pt-5"
            >
              <dt className="font-sans text-xs tracking-widest uppercase text-ink-soft">{s.l}</dt>
              <dd className="font-serif text-4xl md:text-5xl lg:text-4xl text-ink leading-none m-0">
                {s.n}
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
