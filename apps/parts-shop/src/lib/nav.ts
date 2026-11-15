/**
 * The shop's one programmatic page change (BreakerSearch's "Ara" on an exact model). On the site
 * it loads the page (`location.assign`); the app sets its own router here at start-up
 * (`setNavigator`), so the page opens inside the app.
 */

/** Opens a URL as the browser would follow a link to it. */
export type Navigate = (url: string) => void;

let router: Navigate | null = null;

/** The app's router (null: the browser's own page load, as on the site). */
export function setNavigator(fn: Navigate | null): void {
  router = fn;
}

/** Opens `url`: through the app's router when one is set, else `window.location.assign`. */
export function go(url: string): void {
  if (router) router(url);
  else window.location.assign(url);
}
