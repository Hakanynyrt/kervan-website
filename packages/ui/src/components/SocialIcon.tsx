/** Same keys as `OrgSocialKey` in `@kervan/seo` (kept local: `@kervan/ui` does not depend on it). */
export type SocialIconName = 'facebook' | 'instagram' | 'youtube' | 'linkedin' | 'x' | 'telegram';

/* Monochrome social glyphs (24×24, currentColor) for the footers' profile links.
   Purely decorative: the surrounding link carries the accessible name (aria-label from dict). */

const PATHS: Record<SocialIconName, JSX.Element> = {
  facebook: (
    <path
      fill="currentColor"
      d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9z"
    />
  ),
  instagram: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </g>
  ),
  youtube: (
    <g>
      <rect
        x="2.5"
        y="5.5"
        width="19"
        height="13"
        rx="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path fill="currentColor" d="M10 9.2v5.6l4.8-2.8z" />
    </g>
  ),
  linkedin: (
    <path
      fill="currentColor"
      d="M4.5 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3 9h3v11.5H3V9zm5.5 0h2.9v1.6h.1c.4-.8 1.4-1.8 3-1.8 3.1 0 3.7 2.1 3.7 4.8v6.9h-3v-6.1c0-1.5 0-3.3-2-3.3s-2.3 1.6-2.3 3.2v6.2h-3V9z"
    />
  ),
  x: (
    <path
      fill="currentColor"
      d="M17.2 3.5h3l-6.6 7.5 7.8 9.5h-6.1l-4.8-5.9-5.5 5.9h-3l7.1-7.9L1.6 3.5h6.2l4.3 5.4 5.1-5.4zm-1 15.3h1.7L7 5.1H5.2l11 13.7z"
    />
  ),
  telegram: (
    <path
      fill="currentColor"
      d="M21.5 4.2 2.9 11.4c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.8-1.4-1.1zM9.2 14.1l9.1-5.7c.4-.3.8-.1.5.2l-7.8 7-.3 3.2-1.5-4.7z"
    />
  ),
};

export function SocialIcon({ name, size = 20 }: { name: SocialIconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}
