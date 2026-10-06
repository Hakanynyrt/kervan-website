import { useEffect, useLayoutEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@kervan/motion';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

/**
 * 100vh spacer that holds the first viewport empty so Scene's chisel +
 * starfield owns the opening composition. A faint "scroll ↓" hint
 * fades in after the intro perdesi closes (~2.6s on a first visit, almost at
 * once when the intro was already seen this session).
 *
 * Scrolling is never fought: touch and the arrow/End keys scroll natively. A mouse
 * wheel flick or Space/PageDown inside the opening glides to the hero (smooth, or an
 * instant jump under reduced motion) so one gesture is enough.
 *
 * Once the user is past the opening it unmounts for good; that happens only after
 * scrolling has settled, so a touch fling is never cut short.
 */
export default function OpeningHold({ t }: Props) {
  const reduced = useReducedMotion();
  const [passed, setPassed] = useState(false);
  // Intro already seen this session -> the hint need not wait for the curtain.
  const [hintDelay] = useState(() => {
    try {
      return sessionStorage.getItem('kv_v2_intro_seen') === '1' ? 0.6 : 3;
    } catch {
      return 3;
    }
  });

  // Opening sahne fonu siyah olsun — chisel + starfield "uzayda" hissi
  // versin. Hold geçildiğinde unmount olur ve body bg'ı tema rengine
  // (--color-bg) düşer. Class toggle, inline-style'a göre daha
  // dayanıklı: closure captured `prev` problemleri yok.
  useLayoutEffect(() => {
    if (passed) return;
    document.documentElement.classList.add('opening-active');
    return () => document.documentElement.classList.remove('opening-active');
  }, [passed]);

  // Watch scroll position and flip `passed` once the user has crossed the opening
  // band AND scrolling has settled. The flag is one-way; the listener cleans up on
  // unmount, which happens right after the flag flips.
  useEffect(() => {
    if (passed) return;
    let settle: number | undefined;
    const onScroll = () => {
      window.clearTimeout(settle);
      if (window.scrollY >= window.innerHeight - 1) {
        settle = window.setTimeout(() => {
          // Cancel any glide still in flight: it would otherwise carry on to its old
          // absolute target after the layout below shifts up.
          window.scrollTo({ top: window.scrollY, behavior: 'instant' as ScrollBehavior });
          setPassed(true);
        }, 140);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(settle);
    };
  }, [passed]);

  // After unmount, the layout reflows: every section below shifts up
  // by `innerHeight`. Subtract that from the current scroll position
  // so the user stays at the *same visual element* they were on.
  useLayoutEffect(() => {
    if (!passed) return;
    const adjusted = Math.max(0, window.scrollY - window.innerHeight);
    window.scrollTo({ top: adjusted, behavior: 'instant' as ScrollBehavior });
  }, [passed]);

  // One wheel flick or Space/PageDown inside the opening glides to the hero. Touch and
  // the other keys are left to the browser, so scrolling is never blocked.
  useEffect(() => {
    if (passed) return;
    const isInOpening = () => window.scrollY < window.innerHeight - 4;
    let snapping = false;
    let alive = true; // false once the opening is gone: a late timer must not push the page again
    const snapToHero = () => {
      if (snapping) return;
      snapping = true;
      window.scrollTo({
        top: window.innerHeight,
        behavior: (reduced ? 'instant' : 'smooth') as ScrollBehavior,
      });
      // Safety net: if the glide never ran or was cancelled (slow device, a browser that
      // ignores smooth scrolling), finish the move instead of leaving the user stuck.
      window.setTimeout(
        () => {
          snapping = false;
          if (alive && isInOpening()) {
            window.scrollTo({ top: window.innerHeight, behavior: 'instant' as ScrollBehavior });
          }
        },
        reduced ? 0 : 1200,
      );
    };

    const onWheel = (e: WheelEvent) => {
      if (!isInOpening() || e.deltaY <= 0) return;
      e.preventDefault(); // also swallows the rest of the flick while the glide runs
      snapToHero();
    };

    const onKey = (e: KeyboardEvent) => {
      if (!isInOpening() || (e.key !== ' ' && e.key !== 'PageDown')) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName))) return;
      e.preventDefault();
      snapToHero();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      alive = false;
      window.removeEventListener('wheel', onWheel);
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
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 font-sans text-[11px] tracking-[0.32em] uppercase text-ink-mid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        transition={{ delay: hintDelay, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
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
