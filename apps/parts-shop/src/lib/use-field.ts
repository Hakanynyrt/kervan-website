import { useEffect, useState, type RefObject } from 'react';

/** Width Chromium and Safari set aside for the clear button of `type="search"`. */
const SEARCH_CLEAR = 20;

/** Index of the longest example that fits the box, measured in its placeholder font (the last one
 *  when none does). */
function fitPlaceholder(
  el: HTMLInputElement,
  ctx: CanvasRenderingContext2D,
  examples: readonly string[],
): number {
  const box = getComputedStyle(el);
  let font = box;
  try {
    font = getComputedStyle(el, '::placeholder');
  } catch {
    /* no placeholder style: the box's own font, a little larger, errs on the short side */
  }
  ctx.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
  // A search box keeps room for the browser's clear button even while it is empty.
  const clear = el.type === 'search' ? SEARCH_CLEAR : 0;
  const room =
    el.clientWidth - parseFloat(box.paddingLeft) - parseFloat(box.paddingRight) - 2 - clear;
  const i = examples.findIndex((s) => ctx.measureText(s).width <= room);
  return i < 0 ? examples.length - 1 : i;
}

/**
 * The example to show in a search box: the longest of `examples` that fits. The prerender and the
 * first client render have the first (longest) one; the effect then measures it in the
 * placeholder's own font, again when the box or the font changes.
 */
export function useFitPlaceholder(
  input: RefObject<HTMLInputElement | null>,
  examples: readonly string[],
): string {
  const [i, setI] = useState(0);
  const key = examples.join('\n');
  useEffect(() => {
    const el = input.current;
    const ctx = document.createElement('canvas').getContext('2d');
    if (!el || !ctx) return;
    const fit = () => setI(fitPlaceholder(el, ctx, examples));
    fit();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
    ro?.observe(el);
    document.fonts?.addEventListener('loadingdone', fit);
    return () => {
      ro?.disconnect();
      document.fonts?.removeEventListener('loadingdone', fit);
    };
    // `key` stands for the examples, a new array on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, key]);
  return examples[i] ?? examples[0];
}

/**
 * Astryx fields are controlled, so what a visitor typed into the prerendered box before hydration
 * is copied into state once on mount. Call it after any effect that reads the URL: typing wins.
 */
export function useKeepTyped(
  input: RefObject<HTMLInputElement | null>,
  keep: (typed: string) => void,
): void {
  useEffect(() => {
    const typed = input.current?.value;
    if (typed) keep(typed);
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
