import { BOT_UA_PATTERN } from '@kervan/motion';

/**
 * Google Ads conversion measurement, loaded ONLY after the visitor accepts the cookie banner
 * (KVKK: explicit consent; the data goes to Google abroad). Until then nothing is requested
 * from Google and no cookie is set. Same design as heat-treatment's `src/lib/ads.ts`.
 *
 * Same Google Ads account and, for now, the same conversion labels as kervanheat.com (owner:
 * one account); switch to shop-specific conversion actions here once the owner creates them.
 * The IDs are public by design (they appear in every page that uses the tag).
 */
const AW_ID = 'AW-16701476208';
const SEND_TO = {
  form: 'AW-16701476208/eZMUCLiL7ZIdEPCa8Zs-',
  phone: 'AW-16701476208/xu_3CLuL7ZIdEPCa8Zs-',
  whatsapp: 'AW-16701476208/lP4HCL6L7ZIdEPCa8Zs-',
} as const;
export type Conversion = keyof typeof SEND_TO;

/**
 * Spread onto a link that sends an order request or a quote (palet, product pages): a click
 * on it counts as one `form` conversion only, even when it is a WhatsApp link, so one order
 * is never counted twice in Google Ads.
 */
export const ORDER_CONVERSION = { 'data-kv-conversion': 'form' } as const;

export type ConsentChoice = 'granted' | 'denied';
/** Bump the suffix if the banner's wording/purpose changes, to ask again (per origin). */
const CONSENT_KEY = 'kv_ads_consent_v1';
/** Footer "cookie preferences" → reopen the banner. */
export const CONSENT_OPEN_EVENT = 'kv:consent-open';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function readConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* private mode: the choice lasts for this page view only */
  }
}

/** Crawlers, headless browsers and webdriver get no banner and no tag. */
export function isAutomatedClient(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.webdriver === true || new RegExp(BOT_UA_PATTERN, 'i').test(navigator.userAgent);
}

let loaded = false;

const GRANTED = { ad_storage: 'granted', ad_user_data: 'granted', analytics_storage: 'granted' };
const DENIED = { ad_storage: 'denied', ad_user_data: 'denied', analytics_storage: 'denied' };

/** A withdrawn consent: an already loaded tag stops storing and sending ad data at once. */
export function revokeAdsConsent(): void {
  if (loaded && window.gtag) window.gtag('consent', 'update', DENIED);
}

/** `tel:` links → phone; wa.me / WhatsApp links → whatsapp; anything else → null. */
export function conversionForHref(href: string): Conversion | null {
  if (/^tel:/i.test(href)) return 'phone';
  if (/wa\.me|whatsapp/i.test(href)) return 'whatsapp';
  return null;
}

/** The conversions one click on this link counts: an order link only `form`, else by href. */
export function conversionsForLink(a: Element): Conversion[] {
  if (a.getAttribute('data-kv-conversion') === 'form') return ['form'];
  const byHref = conversionForHref(a.getAttribute('href') ?? '');
  return byHref ? [byHref] : [];
}

/** Injects gtag.js once. Call only after consent. */
export function loadAdsTag(): void {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js expects the `arguments` object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  // Consent mode: everything denied by default, then granted for measurement only.
  // ad_personalization stays denied (no remarketing).
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });
  window.gtag('consent', 'update', GRANTED);
  window.gtag('js', new Date());
  window.gtag('config', AW_ID);
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${AW_ID}`;
  document.head.appendChild(s);
}

/** No-op unless the tag was loaded (i.e. the visitor consented). */
export function trackConversion(kind: Conversion): void {
  if (!loaded || !window.gtag) return;
  // A tel: / wa.me link may leave the page at once: send with the beacon transport, which
  // the browser delivers even after the page is gone.
  window.gtag('event', 'conversion', {
    send_to: SEND_TO[kind],
    value: 1.0,
    currency: 'TRY',
    transport_type: 'beacon',
  });
}
