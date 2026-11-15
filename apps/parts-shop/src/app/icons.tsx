/** Line icons of the app's chrome (24 px grid, 1.75 stroke, currentColor; decorative). */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export type IconName =
  | 'home'
  | 'guides'
  | 'scan'
  | 'machines'
  | 'palet'
  | 'back'
  | 'chevron'
  | 'check'
  | 'plus';

export function Icon({ name, className = 'size-6' }: { name: IconName; className?: string }) {
  return (
    <svg {...base} className={className}>
      {name === 'home' && (
        <>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6 9v10h12V9" />
          <path d="M10 19v-5h4v5" />
        </>
      )}
      {name === 'guides' && (
        <>
          <path d="M5 4h9l5 5v11H5z" />
          <path d="M14 4v5h5" />
          <path d="M8 13h8M8 16.5h6" />
        </>
      )}
      {name === 'scan' && (
        <>
          <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
          <path d="M8 12h8" />
        </>
      )}
      {name === 'machines' && (
        <>
          <path d="M9 3h6v4H9z" />
          <path d="M8 7h8v9H8z" />
          <path d="M12 16v3" />
          <path d="M10 19h4l-2 2.5z" />
        </>
      )}
      {name === 'palet' && (
        <>
          <path d="M4 9h16v6H4z" />
          <path d="M4 18h16M7 15v3M12 15v3M17 15v3" />
          <path d="M8 9V6h8v3" />
        </>
      )}
      {name === 'back' && <path d="M15 5l-7 7 7 7" />}
      {name === 'chevron' && <path d="M9 5l7 7-7 7" />}
      {name === 'check' && <path d="M5 12.5l4.5 4.5L19 7.5" />}
      {name === 'plus' && <path d="M12 5v14M5 12h14" />}
    </svg>
  );
}
