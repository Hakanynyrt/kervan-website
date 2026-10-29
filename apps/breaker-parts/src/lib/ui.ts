/* Shared class strings for the 2026-10-28 look (same as kervanheat.com's src/lib/ui.ts, so both
   sites stay one family): Inter only, 2 px buttons, 4 px frames, ember only on actions and links.
   Colours come from the tokens in styles/globals.css. */

/** Page column: 1240 px, 32 px gutters (16 px on phones ≤ 720 px). */
export const WRAP = 'w-full max-w-[1240px] mx-auto px-4 min-[721px]:px-8';

/** Vertical rhythm of a regular section. */
export const SECTION = 'py-16 min-[721px]:py-24';

/** Section heading (h2). */
export const H2 =
  'm-0 font-sans font-bold text-ink text-[30px] min-[721px]:text-[40px] leading-[1.1] tracking-[-0.03em] text-balance';

/** Button frame without colours (a block that sets its own). */
export const BTN =
  'inline-flex items-center justify-center gap-2.5 min-h-12 px-[22px] rounded-[2px] border font-sans text-base font-semibold leading-none transition-colors';
/** Solid ember button (the one action of a block). */
export const BTN_PRIMARY = `${BTN} border-transparent bg-brand text-on-brand hover:bg-brand-hi disabled:bg-bg-soft disabled:text-ink-mid disabled:cursor-not-allowed`;
/** Outline button (secondary actions: phone, WhatsApp, file picker). */
export const BTN_LINE = `${BTN} border-field-line text-ink bg-transparent hover:border-ink`;

/** Section head: the h2 on the left, a short lead on the right (stacked on phones). */
export const SEC_HEAD =
  'grid grid-cols-1 min-[721px]:grid-cols-2 gap-3 min-[721px]:gap-8 items-end mb-8 min-[721px]:mb-12';
export const SEC_LEAD =
  'm-0 font-sans text-base min-[721px]:text-[17px] text-ink-mid max-w-[460px] min-[721px]:justify-self-end';

/** Form label and bordered field (field-line ≥ 3:1 in both themes), as on kervanheat.com. */
export const LABEL = 'font-sans text-sm font-semibold text-ink';
export const FIELD =
  'w-full min-h-12 px-3.5 py-3 rounded-[2px] border border-field-line bg-field font-sans text-base text-ink placeholder:text-ink-soft hover:border-ink transition-colors';
