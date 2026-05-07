export const radius = {
  sm: '6px',
  md: '14px',
  lg: '20px',
  pill: '999px',
} as const;

export type RadiusToken = keyof typeof radius;
