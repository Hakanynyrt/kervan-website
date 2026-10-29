/* Small line icons (24 px grid, currentColor). Decorative: every one is aria-hidden. */

interface Props {
  size?: number;
  className?: string;
}

const svg = (size: number, className: string | undefined) => ({
  viewBox: '0 0 24 24',
  width: size,
  height: size,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  'aria-hidden': true as const,
  className: className ?? 'flex-none',
});

/** → */
export function ArrowRight({ size = 18, className }: Props) {
  return (
    <svg {...svg(size, className)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** ← */
export function ArrowLeft({ size = 18, className }: Props) {
  return (
    <svg {...svg(size, className)}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

/** ↗ (another site) */
export function ArrowOut({ size = 18, className }: Props) {
  return (
    <svg {...svg(size, className)}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

/** Speech bubble (WhatsApp). */
export function ChatIcon({ size = 18, className }: Props) {
  return (
    <svg {...svg(size, className)}>
      <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />
    </svg>
  );
}

/** Clock. */
export function ClockIcon({ size = 20, className }: Props) {
  return (
    <svg {...svg(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/** Play triangle (filled). */
export function PlayIcon({ size = 12, className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={className ?? 'flex-none'}
    >
      <path d="M7 4v16l13-8z" />
    </svg>
  );
}
