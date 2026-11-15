/**
 * What the iPhone build (M2) does natively, with web stand-ins: opening a URL outside the app
 * (the site, other hosts; SFSafariViewController via @capacitor/browser in M2) and the share
 * sheet. The screens call only these, so the native build swaps this file's bodies, not them.
 */

/** Opens a URL outside the app (web build: a new browser tab). */
export function openExternal(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** The system share sheet for a link (web build: Web Share where the browser has it); false
 *  when nothing could be shared. */
export async function share(data: { title?: string; url: string }): Promise<boolean> {
  if (typeof navigator.share !== 'function') return false;
  try {
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
}
