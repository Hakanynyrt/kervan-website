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
 */
function OpeningHold({ t }: OpeningHoldProps) {
  const reduced = useReducedMotion();

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
