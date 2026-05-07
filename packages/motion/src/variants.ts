import type { Variants } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════
   @kervan/motion — Mood C motion library.
   Editorial pacing — slow, gentle, ease-out emphasis.
   All consumers MUST honor `useReducedMotion` and short-circuit to a
   static state when the user prefers reduced motion.
═══════════════════════════════════════════════════════════════════════ */

export const editorialEase = [0.22, 1, 0.36, 1] as const;
export const softEase = [0.4, 0, 0.2, 1] as const;

export const durations = {
  micro: 0.15,
  sm: 0.25,
  md: 0.4,
  lg: 0.6,
  xl: 1.2,
} as const;

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
    transition: { duration: durations.lg, ease: editorialEase },
  },
};

/** Slow editorial fade — for hero sub, big paragraph blocks. */
export const slowFade: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: durations.xl, ease: editorialEase },
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

/** Card hover lift (-6px) — apply via whileHover. */
export const cardHover = {
  rest: { y: 0, transition: { duration: durations.md, ease: editorialEase } },
  hover: { y: -6, transition: { duration: durations.md, ease: editorialEase } },
} as const;

/** Smaller hover lift (-2px) — buttons, badges, inline pills. */
export const hoverLift = {
  rest: { y: 0, transition: { duration: durations.sm, ease: editorialEase } },
  hover: { y: -2, transition: { duration: durations.sm, ease: editorialEase } },
} as const;

/** whileInView default — tuned for editorial pacing, fires once. */
export const inViewOnce = {
  once: true,
  margin: '0px 0px -12% 0px',
  amount: 0.2 as const,
};

/** Helper: spread onto a `motion.*` element to get a "fade-up on scroll" pattern.
 *  Optional delay (seconds) applied to the show transition. */
export function revealOnScroll(delay = 0) {
  return {
    initial: 'hidden',
    whileInView: 'show',
    viewport: inViewOnce,
    variants: fadeUp,
    transition: { delay },
  } as const;
}
