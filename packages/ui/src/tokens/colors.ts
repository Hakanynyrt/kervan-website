export const colors = {
  bg: '#0A0A0B',
  bgSoft: '#141416',
  bgWarm: '#1C1C20',

  ink: '#E8E2D6',
  inkMid: '#B8AFA0',
  // inkSoft is decorative/eyebrow-only — body text fails AA at this contrast.
  inkSoft: '#7A7066',

  brand: '#E8431B',
  brandHi: '#FF5C32',
  brandLo: '#C53614',
  brandSoft: 'rgba(232, 67, 27, 0.12)',

  hair: '#262629',
  hairStrong: '#36363B',

  ok: '#3FB173',
  err: '#FF7B6E',
} as const;

export type ColorToken = keyof typeof colors;
