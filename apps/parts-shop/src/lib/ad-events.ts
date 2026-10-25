/**
 * The pure parts of the shop's ad measurement (`ads.ts`): which click counts as which
 * conversion, the event each ad platform gets for it, the Meta Pixel's boot calls and the stored
 * cookie choice. No imports, so `node --test` loads it directly (`ad-events.test.ts`).
 */
export type Conversion = 'form' | 'phone' | 'whatsapp';
export type ConsentChoice = 'granted' | 'denied';

/** `tel:` links → phone; wa.me / WhatsApp links → whatsapp; anything else → null. */
export function conversionForHref(href: string): Conversion | null {
  if (/^tel:/i.test(href)) return 'phone';
  if (/wa\.me|whatsapp/i.test(href)) return 'whatsapp';
  return null;
}

/** The conversions one click on this link counts: an order link only `form`, else by href. */
export function conversionsForLink(a: Pick<Element, 'getAttribute'>): Conversion[] {
  // A send link held back by the page (e.g. the English cart's required country is empty).
  if (a.getAttribute('aria-disabled') === 'true') return [];
  if (a.getAttribute('data-kv-conversion') === 'form') return ['form'];
  const byHref = conversionForHref(a.getAttribute('href') ?? '');
  return byHref ? [byHref] : [];
}

/** One id per click, sent to OpenAI (`event_id`) and Meta (`eventID`) so either can drop a duplicate. */
export function eventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * The OpenAI event each conversion sends (developers.openai.com/ads/supported-events): an order
 * or quote request is the standard `lead_created` ("a lead form submission or a contact
 * request"); phone and WhatsApp clicks have no standard event, so they are custom events.
 */
export const OAI_EVENT: Record<
  Conversion,
  [string, Record<string, string>, Record<string, string>]
> = {
  form: ['lead_created', { type: 'customer_action' }, {}],
  phone: ['custom', { type: 'custom' }, { custom_event_name: 'phone_click' }],
  whatsapp: ['custom', { type: 'custom' }, { custom_event_name: 'whatsapp_click' }],
};

/**
 * The Meta standard event each conversion sends: an order or quote request is a `Lead`; a phone
 * or WhatsApp click is a `Contact`, told apart by `contact_method` (Events Manager can split them
 * with a custom conversion, no code). No value and no contents: the KVKK text says Meta gets no
 * order content, name or contact details (locked by `ad-events.test.ts`).
 */
export const META_EVENT: Record<Conversion, readonly [string, Readonly<Record<string, string>>]> = {
  form: ['Lead', {}],
  phone: ['Contact', { contact_method: 'phone' }],
  whatsapp: ['Contact', { contact_method: 'whatsapp' }],
};

/**
 * The calls the Meta loader queues, in this order. `init` takes NO user-data argument: no
 * advanced matching (the cart has name and phone fields); `autoConfig` off: no automatic
 * button-click or page-metadata events. One `PageView` per page load: the shop is multi-page.
 */
export const metaBootCalls = (pixelId: string): unknown[][] => [
  ['consent', 'grant'],
  ['set', 'autoConfig', false, pixelId],
  ['init', pixelId],
  ['track', 'PageView'],
];

/** Meta's first-party cookies, deleted when consent is withdrawn. */
export const META_COOKIES = ['_fbp', '_fbc'] as const;

/**
 * The `domain` attributes a script on this host may have set a cookie with: none (host-only),
 * then every parent with two labels or more (fbevents.js uses the top one, ".kiriciparca.com").
 * A public suffix such as ".pages.dev" is refused by the browser, which is harmless.
 */
export function cookieDomains(hostname: string): string[] {
  const out = [''];
  if (!hostname || hostname.includes(':') || /^[\d.]+$/.test(hostname)) return out;
  const labels = hostname.split('.');
  for (let i = 0; i <= labels.length - 2; i++) out.push(`.${labels.slice(i).join('.')}`);
  return out;
}

/** `document.cookie` assignments that delete these cookies on every domain of this host. */
export function expiredCookies(names: readonly string[], hostname: string): string[] {
  return names.flatMap((n) =>
    cookieDomains(hostname).map((d) => `${n}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`),
  );
}

/** Bump the suffix when the banner's purpose or recipients change, to ask again (per origin). */
export const CONSENT_KEY = 'kv_ads_consent_v3'; // v3: the Meta Pixel joined the banner's purpose
/** The previous key (v2: the OpenAI pixel joined), read once for the carry-over below. */
export const OLD_CONSENT_KEY = 'kv_ads_consent_v2';

/**
 * v2 → v3: a stored v3 choice wins; a v2 "denied" is kept (a visitor who said no is not asked
 * again, and the footer still offers "Kabul et"); a v2 "granted" is asked again, because the
 * purpose and the recipients widened.
 */
export function migrateConsent(v3: string | null, v2: string | null): ConsentChoice | null {
  if (v3 === 'granted' || v3 === 'denied') return v3;
  return v2 === 'denied' ? 'denied' : null;
}

type ConsentStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function readStoredConsent(store: ConsentStore): ConsentChoice | null {
  return migrateConsent(store.getItem(CONSENT_KEY), store.getItem(OLD_CONSENT_KEY));
}

/** Writes the v3 choice and drops the v2 key. */
export function storeConsent(store: ConsentStore, choice: ConsentChoice): void {
  store.setItem(CONSENT_KEY, choice);
  store.removeItem(OLD_CONSENT_KEY);
}
