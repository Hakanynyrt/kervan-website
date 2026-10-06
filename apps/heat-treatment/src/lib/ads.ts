import { BOT_UA_PATTERN } from '@kervan/motion';

/**
 * Google Ads conversion tracking, loaded ONLY after the visitor accepts the
 * cookie banner (KVKK: explicit consent; the data goes to Google in the USA).
 * Until then nothing is requested from Google and no cookie is set.
 *
 * IDs come from the Google Ads account (Goals → Conversions); they are public
 * by design (they appear in every page that uses the tag).
 */
const AW_ID = 'AW-16701476208';
const SEND_TO = {
  form: 'AW-16701476208/eZMUCLiL7ZIdEPCa8Zs-',
  phone: 'AW-16701476208/xu_3CLuL7ZIdEPCa8Zs-',
  whatsapp: 'AW-16701476208/lP4HCL6L7ZIdEPCa8Zs-',
} as const;
export type Conversion = keyof typeof SEND_TO;

export type ConsentChoice = 'granted' | 'denied';
/** Bump the suffix if the banner's wording/purpose changes, to ask again. */
const CONSENT_KEY = 'kv_ads_consent_v1';
/** Footer "cookie settings" → reopen the banner. */
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
  window.gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });
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
  window.gtag('event', 'conversion', { send_to: SEND_TO[kind], value: 1.0, currency: 'TRY' });
}
