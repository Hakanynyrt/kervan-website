export const motion = {
  ease: {
    editorial: [0.22, 1, 0.36, 1] as const,
    soft: [0.4, 0, 0.2, 1] as const,
  },
  duration: {
    micro: 0.15,
    sm: 0.25,
    md: 0.4,
    lg: 0.6,
  },
} as const;

export type EaseToken = keyof typeof motion.ease;
export type DurationToken = keyof typeof motion.duration;
