import type { Variants } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════
   Mood C motion library — editorial pacing.
   Slow, gentle, with ease-out emphasis.
═══════════════════════════════════════════════════════════════════════ */

const editorialEase = [0.22, 1, 0.36, 1] as const;

/** Container that staggers its motion children. */
export const staggerContainer = (delay = 0, gap = 0.12): Variants => ({
  hidden: {},
  show: {
    transition: {
      delayChildren: delay,
      staggerChildren: gap,
    },
  },
});

/** Word/line that rises into view with a clip mask above. */
export const lineReveal: Variants = {
  hidden: { y: '100%' },
  show: {
    y: 0,
    transition: { duration: 0.7, ease: editorialEase },
  },
};

/** Generic fade + slight rise. Use for body copy, asides, single elements. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: editorialEase },
  },
};

/** Slow editorial fade — for hero sub, big paragraph blocks. */
export const slowFade: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 1.2, ease: editorialEase },
  },
};

/** Ken Burns slow drift — apply to image wrapper, scale + position over time. */
export const kenBurns: Variants = {
  hidden: { scale: 1.08, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: { duration: 1.4, ease: editorialEase },
  },
  idle: {
    scale: [1, 1.04, 1],
    transition: {
      duration: 16,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'mirror',
    },
  },
};

/** Card hover lift — apply via whileHover. */
export const cardHover = {
  rest: { y: 0, transition: { duration: 0.4, ease: editorialEase } },
  hover: { y: -6, transition: { duration: 0.4, ease: editorialEase } },
};

/** whileInView default — rootMargin & threshold tuned for editorial pacing. */
export const inViewOnce = {
  once: true,
  margin: '0px 0px -12% 0px',
  amount: 0.2 as const,
};
