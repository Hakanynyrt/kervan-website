import { useEffect, useLayoutEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

/**
 * 100vh spacer that holds the first viewport empty so Scene's chisel +
 * starfield owns the opening composition. A faint "scroll ↓" hint
 * fades in after the intro perdesi closes (~2.6s) so the affordance
 * isn't visible during the cinematic moment but appears just before
 * the user would otherwise wonder if there's anything to do.
 *
 * Scroll-snap: any down-direction gesture (wheel, touch, Space/PageDown
 * /ArrowDown/End) while still inside the opening triggers a one-shot
 * scroll to the hero. Reduced-motion preference uses an instant jump.
 */
export default function OpeningHold({ t }: Props) {
  const reduced = useReducedMotion();
  const [passed, setPassed] = useState(false);

  // Opening sahne fonu siyah olsun — chisel + starfield "uzayda" hissi
  // versin. Hold geçildiğinde unmount olur ve body bg'ı tema rengine
  // (--color-bg) düşer. Class toggle, inline-style'a göre daha
  // dayanıklı: closure captured `prev` problemleri yok.
  useLayoutEffect(() => {
    if (passed) return;
    document.documentElement.classList.add('opening-active');
    return () => document.documentElement.classList.remove('opening-active');
  }, [passed]);

  // Watch scroll position and flip `passed` once the user crosses the
  // opening band. The flag is one-way; the listener cleans up on unmount,
  // which happens immediately after the flag flips.
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
  // so the user stays at the *same visual element* they were on.
  useLayoutEffect(() => {
    if (!passed) return;
    const adjusted = Math.max(0, window.scrollY - window.innerHeight);
    window.scrollTo(0, adjusted);
  }, [passed]);

  // Snap-to-hero gesture trap. Only relevant before unmount.
  useEffect(() => {
    if (passed) return;
    const isInOpening = () => window.scrollY < window.innerHeight - 4;
    const snapToHero = () => {
      window.scrollTo({
        top: window.innerHeight,
        behavior: 'instant' as ScrollBehavior,
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
      className="relative h-dvh w-full pointer-events-none"
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
