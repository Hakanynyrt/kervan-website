import { SITE_ORIGIN } from '../lib/page-source.ts';

/**
 * What the iPhone build does natively, with web stand-ins: opening a URL outside the app and the
 * share sheet. The screens call only these. Inside the native shell (apps/parts-app, Capacitor)
 * the Capacitor plugins are loaded on first use, by dynamic import, so the web build and the e2e
 * never run them; outside it every function keeps its web behaviour.
 */

/** The global Capacitor's native layer injects into the page before its scripts run. */
interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
}

/** True inside the iPhone app's native shell; false in the web build, the e2e and node tests. */
export function isNativeApp(
  g: { Capacitor?: CapacitorGlobal } = globalThis as { Capacitor?: CapacitorGlobal },
): boolean {
  try {
    return g.Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

/** An https URL on the site the app reads from (its pages and files). */
export function isSiteUrl(url: string, origin: string = SITE_ORIGIN): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.origin === new URL(origin).origin;
  } catch {
    return false;
  }
}

/**
 * Opens a URL outside the app. Web build: a new browser tab. iPhone: the site's own pages ("Sitede
 * aç", site files) in Safari's in-app sheet (@capacitor/browser); anything else (wa.me, mailto:,
 * tel:, other hosts) is handed to iOS, which opens WhatsApp, Mail, Phone or Safari (Capacitor
 * sends a window.open of an outside URL to the system).
 */
export function openExternal(url: string): void {
  if (isNativeApp() && isSiteUrl(url)) {
    import('@capacitor/browser')
      .then(({ Browser }) => Browser.open({ url }))
      .catch(() => window.open(url, '_blank'));
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** The system share sheet for a link (web build: Web Share where the browser has it); false
 *  when nothing could be shared. iPhone: WKWebView's own Web Share (the share plugin is M4). */
export async function share(data: { title?: string; url: string }): Promise<boolean> {
  if (typeof navigator.share !== 'function') return false;
  try {
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
}
