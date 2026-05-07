export const typography = {
  fonts: {
    serif: '"Fraunces", "Times New Roman", Georgia, serif',
    sans: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  scale: {
    display: 'clamp(56px, 9vw, 128px)',
    h1: 'clamp(48px, 7vw, 96px)',
    h2: 'clamp(36px, 5vw, 64px)',
    h3: 'clamp(24px, 3vw, 36px)',
    eyebrow: '12px',
    body: '17px',
    bodySm: '14px',
  },
  tracking: {
    display: '-0.025em',
    h1: '-0.02em',
    h2: '-0.015em',
    h3: '-0.01em',
    eyebrow: '0.2em',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },
  leading: {
    display: 0.95,
    h1: 1.05,
    h2: 1.1,
    h3: 1.2,
    body: 1.6,
  },
} as const;
