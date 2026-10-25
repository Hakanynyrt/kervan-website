import { BOT_UA_PATTERN } from '@kervan/motion';
import { readStoredConsent, storeConsent, type ConsentChoice, type Conversion } from './ad-events';
import { createAdTags, type AdIds, type AdTags, type Fbq } from './ad-tags';

/**
 * Ad conversion measurement: the Google Ads tag, the OpenAI (ChatGPT) Ads pixel and the Meta
 * (Facebook, Instagram) Pixel, all loaded ONLY after the visitor accepts the cookie banner
 * (KVKK: explicit consent; the data goes to Google, OpenAI and Meta abroad). Until then nothing
 * is requested from any of them and no cookie is set. The tags themselves are in `ad-tags.ts`,
 * the pure mappings in `ad-events.ts` (both unit-tested). The Google part follows the same design
 * as heat-treatment's `src/lib/ads.ts`; the pixels are shop-only.
 *
 * Same Google Ads account as kervanheat.com (owner: one account), with the shop's own
 * conversion actions (owner, 2026-10-22): "kiriciparca - Sipariş talebi" (primary) for order
 * and quote requests, and the shop's WhatsApp and phone-click actions.
 * The IDs are public by design (they appear in every page that uses the tag).
 */
const AW_ID = 'AW-16701476208';
const SEND_TO = {
  form: 'AW-16701476208/rQaaCIP5_aUdEPCa8Zs-',
  phone: 'AW-16701476208/8CXFCIn5_aUdEPCa8Zs-',
  whatsapp: 'AW-16701476208/OXtKCIb5_aUdEPCa8Zs-',
} as const satisfies Record<Conversion, string>;

/** OpenAI Ads Manager → Conversions → kiriciparca.com (public by design, like the AW ids). */
const OAI_PIXEL_ID = '5YVim7txH512swvibTBM67';
const OAI_SDK = 'https://bzrcdn.openai.com/sdk/oaiq.min.js';

/**
 * Meta Events Manager → Data sources → kiriciparca.com (public by design, like the AW ids; never
 * an access token). Empty: the Meta Pixel is off and nothing Meta-related loads. Automatic
 * advanced matching and automatic events must stay off in Events Manager (the cart has name and
 * phone fields; the KVKK text promises Meta none of them); checked 2026-10-25.
 */
const META_PIXEL_ID = '1752709229141667';
const META_SDK = 'https://connect.facebook.net/en_US/fbevents.js';

const IDS: AdIds = {
  aw: AW_ID,
  sendTo: SEND_TO,
  oaiPixel: OAI_PIXEL_ID,
  oaiSdk: OAI_SDK,
  metaPixel: META_PIXEL_ID,
  metaSdk: META_SDK,
};

export {
  conversionForHref,
  conversionsForLink,
  type ConsentChoice,
  type Conversion,
} from './ad-events';

/**
 * Spread onto a link that sends an order request or a quote (palet, product pages): a click
 * on it counts as one `form` conversion only, even when it is a WhatsApp link, so one order
 * is never counted twice.
 */
export const ORDER_CONVERSION = { 'data-kv-conversion': 'form' } as const;

/** Footer "cookie preferences" → reopen the banner. */
export const CONSENT_OPEN_EVENT = 'kv:consent-open';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    oaiq?: ((...args: unknown[]) => void) & { q?: unknown[] };
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** The stored choice (`kv_ads_consent_v3`, with the v2 "denied" carry-over: `ad-events.ts`). */
export function readConsent(): ConsentChoice | null {
  try {
    return readStoredConsent(localStorage);
  } catch {
    return null;
  }
}

export function writeConsent(choice: ConsentChoice): void {
  try {
    storeConsent(localStorage, choice);
  } catch {
    /* private mode: the choice lasts for this page view only */
  }
}

/** Crawlers, headless browsers and webdriver get no banner and no tag. */
export function isAutomatedClient(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.webdriver === true || new RegExp(BOT_UA_PATTERN, 'i').test(navigator.userAgent);
}

let tags: AdTags | null = null;
/** The one instance, made on first use in the browser (never in the prerender). */
function adTags(): AdTags | null {
  if (typeof document === 'undefined') return null;
  tags ??= createAdTags(
    {
      win: window,
      addScript(src) {
        const s = document.createElement('script');
        s.async = true;
        s.src = src;
        document.head.appendChild(s);
      },
      setCookie(cookie) {
        document.cookie = cookie;
      },
      hostname: location.hostname,
    },
    IDS,
  );
  return tags;
}

/** Injects the tags once. Call only after consent (a stored "granted" on mount). */
export function loadAdsTag(): void {
  adTags()?.load();
}

/** "Kabul et": loads the tags, or lets them resume after a withdrawal on the same page. */
export function grantAdsConsent(): void {
  adTags()?.grant();
}

/**
 * A withdrawn consent: loaded tags stop storing and sending ad data at once (Google consent
 * update `denied`, OpenAI `consent false`, Meta `consent revoke` with `_fbp` / `_fbc` deleted);
 * from the next page load they are not loaded at all.
 */
export function revokeAdsConsent(): void {
  adTags()?.revoke();
}

/** No-op unless the tags were loaded and consent still stands on this page. */
export function trackConversion(kind: Conversion): void {
  adTags()?.track(kind);
}
