/**
 * Edits the page's query string in place (`history.replaceState`): other parameters and the
 * `#hash` are kept, so a filtered search can be shared as a link. Browser only.
 */
export function replaceSearch(edit: (p: URLSearchParams) => void): void {
  const p = new URLSearchParams(window.location.search);
  edit(p);
  const s = p.toString();
  const url = `${window.location.pathname}${s ? `?${s}` : ''}${window.location.hash}`;
  if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`)
    history.replaceState(history.state, '', url);
}
