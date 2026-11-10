/* Shared class strings for the 2026-10-28 look: Inter only, 2 px buttons, 4 px frames,
   ember only on actions and links. Colours come from the tokens in styles/globals.css. */

/** Page column: 1240 px, 32 px gutters (16 px on phones ≤ 720 px). */
export const WRAP = 'w-full max-w-[1240px] mx-auto px-4 min-[721px]:px-8';

/** Vertical rhythm of a regular section. */
export const SECTION = 'py-16 min-[721px]:py-24';

/** Section heading (h2). */
export const H2 =
  'm-0 font-sans font-bold text-ink text-[30px] min-[721px]:text-[40px] leading-[1.1] tracking-[-0.03em] text-balance';

/** Astryx Button variant="primary": the site's darker ember on hover, not Astryx's tint. */
export const SOLID_HOVER = 'hover:bg-brand-hi hover:bg-none';
/** Astryx Button variant="ghost" as an outline button. */
export const LINE = 'border border-field-line hover:border-ink hover:bg-none';

const ACTION_SIZE = 'h-12 px-[22px] text-base font-semibold';
/** A main Astryx Button: variant="primary" (the one action of a block). */
export const ACTION = `${ACTION_SIZE} ${SOLID_HOVER}`;
/** The same on variant="ghost" (secondary actions: phone, WhatsApp). */
export const ACTION_LINE = `${ACTION_SIZE} ${LINE}`;

/** On a form: Astryx fields take this site's field colours (≥ 3:1 border, field background). */
export const FIELD_SCOPE =
  '[--color-border-emphasized:var(--color-field-line)] [--color-background-surface:var(--color-field)]';
/** containerClassName of an Astryx field: its label as on the rest of the site. */
export const FIELD_LABEL = '[&_label]:text-sm [&_label]:font-semibold [&_label]:text-ink';
/** controlClassName of an Astryx field: 16 px text and the site's focus ring. */
export const FIELD_CONTROL =
  'px-3.5 [&_input]:text-base [&_textarea]:text-base focus-within:outline focus-within:outline-2 focus-within:outline-brand focus-within:outline-offset-2';

/** The one two-column axis of the page (5:7): every section's heading and rows share it. */
export const SPLIT = 'min-[721px]:grid-cols-[5fr_7fr] min-[721px]:gap-14';

/** Section head: the h2 on the left, a short lead from the second column (stacked on phones). */
export const SEC_HEAD = `grid grid-cols-1 gap-3 ${SPLIT} items-start mb-8 min-[721px]:mb-12`;
export const SEC_LEAD =
  'm-0 font-sans text-base min-[721px]:text-[17px] text-ink-mid max-w-[620px]';
