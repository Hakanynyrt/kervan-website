/**
 * Is the page on its day (light) theme right now? Mirrors the selectors in globals.css: a
 * theme picked by hand (`<html data-theme>`) wins over the edge's sun mark (`data-sun`); no
 * mark means the dark (night) look. For three.js scenes that pick their colours in code.
 */
export function isDayTheme(): boolean {
  const h = document.documentElement;
  const t = h.getAttribute('data-theme');
  if (t === 'light' || t === 'dark') return t === 'light';
  return h.getAttribute('data-sun') === 'day';
}

/** Calls `cb(isDay)` whenever the theme changes (the header select); returns the unsubscribe. */
export function onThemeChange(cb: (day: boolean) => void): () => void {
  if (typeof MutationObserver === 'undefined') return () => {};
  let last = isDayTheme();
  const mo = new MutationObserver(() => {
    const day = isDayTheme();
    if (day !== last) cb((last = day));
  });
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-sun'],
  });
  return () => mo.disconnect();
}
