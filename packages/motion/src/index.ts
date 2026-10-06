export {
  editorialEase,
  softEase,
  durations,
  staggerContainer,
  lineReveal,
  fadeUp,
  slowFade,
  kenBurns,
  cardHover,
  hoverLift,
  inViewOnce,
  revealOnScroll,
} from './variants.js';

export { useParallaxSlow } from './use-parallax-slow.js';
export { ScrollReveal } from './scroll-reveal.js';

// Static (prerender) mode + the static-aware reduced-motion hook. Import
// useReducedMotion from here, never from framer-motion: it returns true in
// static mode so every reduced-motion short-circuit renders the final state.
export {
  StaticMotionProvider,
  useStaticMotion,
  useReducedMotion,
  useRevealOnScroll,
  useClientIdle,
  isAnimatedClient,
  JS_ANIM_CLASS,
  PRERENDERED_ATTR,
  BOT_UA_PATTERN,
  JS_ANIM_INLINE_SCRIPT,
  JS_ANIM_ROOT_CSS,
} from './static-mode.js';
