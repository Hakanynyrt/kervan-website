import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLang } from './lib/use-lang';
import { DICT } from './lib/dict';
import type { DictBlock } from './types';
import IntroOverlay from './components/IntroOverlay';
import Scene from './components/Scene';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Products from './components/Products';
import WorkshopShowcase from './components/WorkshopShowcase';
import BrandMarquee from './components/BrandMarquee';
import Craft from './components/Craft';
import Industries from './components/Industries';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function App() {
  const [lang, setLang] = useLang();
  const t = DICT[lang];

  return (
    <>
      {/* 3D BG — vanilla Three.js, direct mount, lazy/Suspense yok */}
      <Scene />

      {/* Intro perdesi — z-100, content'in üstünde, ~2.4s sonra unmount */}
      <IntroOverlay />

      <div className="app-root">
        <Nav lang={lang} setLang={setLang} t={t} />
        {/* Cinematic opening hold — first viewport is just the chisel +
            starfield. Hero copy lives below, revealed on scroll. */}
        <OpeningHold t={t} />
        <Hero t={t} />
        <Products t={t} />
        <WorkshopShowcase t={t} />
        <BrandMarquee t={t} />
        <Craft t={t} />
        <Industries t={t} />
        <Contact t={t} />
        <Footer t={t} />
      </div>
    </>
  );
}

interface OpeningHoldProps {
  t: DictBlock;
}

/**
 * 100vh spacer that holds the first viewport empty so Scene's chisel +
 * starfield owns the opening composition. A faint "scroll ↓" hint
 * fades in after the intro perdesi closes (≈2.6s) so the affordance
 * isn't visible during the cinematic moment but appears just before
 * the user would otherwise wonder if there's anything to do.
 *
 * Scroll-snap: any down-direction gesture (wheel, touch, Space/PageDown
 * /ArrowDown/End) while still inside the opening triggers a one-shot
 * smooth scroll to the hero (`scrollY = innerHeight`). Reduced-motion
 * preference uses an instant jump instead of the smooth animation.
 */
function OpeningHold({ t }: OpeningHoldProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    // Capture-phase listeners so we beat React's bubble-phase handlers
    // and the browser's native scroll. `passive: false` is required on
    // wheel + touchmove because we need `preventDefault` to swallow the
    // initial gesture before it scrolls a few pixels organically.
    const isInOpening = () => window.scrollY < window.innerHeight - 4;
    const snapToHero = () => {
      window.scrollTo({
        top: window.innerHeight,
        behavior: reduced ? 'auto' : 'smooth',
      });
    };

    const onWheel = (e: WheelEvent) => {
      if (!isInOpening()) return;
      if (e.deltaY <= 0) return; // upward wheel — let it through
      e.preventDefault();
      snapToHero();
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isInOpening()) return;
      const dy = touchStartY - (e.touches[0]?.clientY ?? touchStartY);
      if (dy <= 6) return; // ignore tiny jitter and upward pulls
      e.preventDefault();
      snapToHero();
    };

    const downKeys = new Set([' ', 'PageDown', 'ArrowDown', 'End']);
    const onKey = (e: KeyboardEvent) => {
      if (!isInOpening()) return;
      if (!downKeys.has(e.key)) return;
      e.preventDefault();
      snapToHero();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [reduced]);

  return (
    <section
      aria-hidden="true"
      className="relative h-screen w-full pointer-events-none"
    >
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 font-sans text-[11px] tracking-[0.32em] uppercase text-ink-soft"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.65 }}
        transition={{ delay: 3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <span>{t.opening.scroll}</span>
        <motion.span
          aria-hidden="true"
          style={{ display: 'inline-block' }}
          animate={reduced ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          ↓
        </motion.span>
      </motion.div>
    </section>
  );
}
