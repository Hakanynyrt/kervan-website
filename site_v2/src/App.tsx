import { useEffect, useLayoutEffect, useState } from 'react';
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
import Exports from './components/Exports';
import Contact from './components/Contact';
import Footer from './components/Footer';
import WhatsAppFAB from './components/WhatsAppFAB';

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
        <Exports t={t} lang={lang} />
        <Contact t={t} />
        <Footer t={t} />
      </div>

      {/* Floating WhatsApp button — z-40, sits above app-root content
          and below the intro overlay. Single dedicated affordance for
          chat — replaces the inline rows in Contact + Footer. */}
      <WhatsAppFAB />
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
  const [passed, setPassed] = useState(false);

  // Opening sahne fonu siyah olsun — chisel + starfield "uzayda" hissi
  // versin. Hold geçildiğinde unmount olur ve body bg'ı tema lacivertine
  // (--color-bg) düşer. useLayoutEffect → ilk paint öncesinde ayarlanır,
  // navy → black flash olmaz.
  useLayoutEffect(() => {
    if (passed) return;
    const prev = document.body.style.background;
    document.body.style.background = '#000';
    return () => { document.body.style.background = prev; };
  }, [passed]);

  // Watch scroll position and flip `passed` once the user crosses the
  // opening band. The flag is one-way — there is no setter to undo it,
  // and the listener cleans up on unmount, which happens immediately
  // after the flag flips.
  useEffect(() => {
    if (passed) return;
    const onScroll = () => {
      if (window.scrollY >= window.innerHeight - 1) setPassed(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [passed]);

  // After unmount, the layout reflows: every section below shifts up
  // by `innerHeight`. Subtract that from the current scroll position
  // so the user stays at the *same visual element* they were on —
  // landing on hero if they crossed the boundary normally, but also
  // preserving deep scrolls (e.g. anchor links / scroll-to-footer)
  // that happen to also flip `passed` true. Runs before paint, no
  // visible jump.
  useLayoutEffect(() => {
    if (!passed) return;
    const adjusted = Math.max(0, window.scrollY - window.innerHeight);
    window.scrollTo(0, adjusted);
  }, [passed]);

  // Snap-to-hero gesture trap (wheel/touch/keys). Only relevant before
  // the unmount; once `passed` is true the early return below removes
  // the listeners and the section from the DOM.
  useEffect(() => {
    if (passed) return;
    const isInOpening = () => window.scrollY < window.innerHeight - 4;
    const snapToHero = () => {
      window.scrollTo({
        top: window.innerHeight,
        behavior: reduced ? 'auto' : 'smooth',
      });
    };

    const onWheel = (e: WheelEvent) => {
      if (!isInOpening()) return;
      if (e.deltaY <= 0) return;
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
      if (dy <= 6) return;
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
  }, [reduced, passed]);

  if (passed) return null;

  return (
    <section
      data-scene-pose="opening"
      aria-hidden="true"
      className="relative h-dvh w-full pointer-events-none snap-start snap-always"
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
