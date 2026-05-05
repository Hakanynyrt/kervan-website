export const shadows = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.5)',
  sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
  md: '0 6px 24px rgba(0, 0, 0, 0.45)',
  lg: '0 16px 48px rgba(0, 0, 0, 0.5)',
  glowBrand: '0 0 24px rgba(232, 67, 27, 0.35)',
} as const;

export type ShadowToken = keyof typeof shadows;
