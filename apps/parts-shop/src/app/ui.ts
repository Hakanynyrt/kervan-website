/**
 * Class strings of the app's own chrome and screens, in the shop's look (globals.css tokens,
 * Inter, rounded-sm, hairlines; no gradients, glows, pills or kickers). Every tap target is at
 * least 44 px.
 */

export const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';
export const FOCUS_INSET =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:-outline-offset-2';

/** The screens' column (the shop's phone gutter). */
export const SCREEN = 'mx-auto w-full max-w-[720px] px-4 py-5 font-sans text-ink';

export const H1 = 'm-0 text-2xl font-bold leading-tight text-ink';
/** Section label: a plain heading, not a kicker. */
export const H2 = 'm-0 text-base font-semibold text-ink';

export const BUTTON_PRIMARY = `inline-flex min-h-11 items-center justify-center rounded-sm bg-brand px-4 text-sm font-semibold text-on-brand hover:bg-brand-hi disabled:opacity-60 ${FOCUS}`;
export const BUTTON_SECONDARY = `inline-flex min-h-11 items-center justify-center rounded-sm border border-ink-soft bg-bg px-4 text-sm font-medium text-ink hover:border-ink disabled:opacity-60 ${FOCUS}`;

export const FIELD = `block min-h-11 w-full rounded-sm border border-hair-strong bg-bg px-3 text-base text-ink placeholder:text-ink-soft ${FOCUS}`;

/** A row of a list (a link or a button), full width, hairline under it. */
export const ROW = `flex min-h-11 w-full items-center justify-between gap-3 border-b border-hair py-2 text-left text-base text-ink hover:text-brand-hi ${FOCUS_INSET}`;
