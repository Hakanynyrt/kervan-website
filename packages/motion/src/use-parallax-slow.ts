import { useScroll, useTransform, type MotionValue } from 'framer-motion';
import type { RefObject } from 'react';

/** Slow parallax helper — returns a MotionValue<string> for `y` translation
 *  driven by the target's scroll progress. Subtle range (-40px → 40px)
 *  keeps it tasteful, not loud. */
export function useParallaxSlow(
  ref: RefObject<HTMLElement | null>,
  range: [number, number] = [-40, 40],
): MotionValue<string> {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  return useTransform(scrollYProgress, [0, 1], [`${range[0]}px`, `${range[1]}px`]);
}
