export const spacing = {
  s4: '4px',
  s8: '8px',
  s12: '12px',
  s16: '16px',
  s24: '24px',
  s32: '32px',
  s48: '48px',
  s64: '64px',
  s96: '96px',
} as const;

export type SpacingToken = keyof typeof spacing;
