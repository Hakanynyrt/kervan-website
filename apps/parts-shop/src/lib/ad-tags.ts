import {
  META_COOKIES,
  META_EVENT,
  OAI_EVENT,
  eventId,
  expiredCookies,
  metaBootCalls,
  type Conversion,
} from './ad-events.ts';

/**
 * The three ad tags behind the cookie banner (Google Ads, OpenAI, Meta), written against a small
 * environment instead of `window` / `document` so `ad-tags.test.ts` can run them with fakes;
 * `ads.ts` makes the one real instance in the browser. Nothing here runs before the visitor
 * clicks "Kabul et" (or comes back with a stored "granted").
 */
type Call = (...args: unknown[]) => void;

/** Meta's `fbq`, as its base code builds it. */
export type Fbq = Call & {
  callMethod?: Call;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
  disablePushState?: boolean;
};

export interface AdWindow {
  dataLayer?: unknown[];
  gtag?: Call;
  oaiq?: Call & { q?: unknown[] };
  fbq?: Fbq;
  _fbq?: Fbq;
}

export interface AdEnv {
  win: AdWindow;
  /** Appends `<script async src>` to `<head>`. */
  addScript(src: string): void;
  /** One `document.cookie = …` assignment. */
  setCookie(cookie: string): void;
  hostname: string;
}

export interface AdIds {
  /** Google Ads tag (`AW-…`). */
  aw: string;
  sendTo: Readonly<Record<Conversion, string>>;
  oaiPixel: string;
  oaiSdk: string;
  /** Empty: the Meta Pixel is off, and nothing Meta-related is queued or requested. */
  metaPixel: string;
  metaSdk: string;
}

export interface AdTags {
  /** Loads the tags once (consent given). */
  load(): void;
  /** "Kabul et": loads the tags, or, after a withdrawal on the same page, lets them resume. */
  grant(): void;
  /** A withdrawal: loaded tags stop storing and sending ad data at once. */
  revoke(): void;
  /** One conversion to every loaded tag; nothing unless consent stands on this page. */
  track(kind: Conversion): void;
}

const GRANTED = { ad_storage: 'granted', ad_user_data: 'granted', analytics_storage: 'granted' };
const DENIED = { ad_storage: 'denied', ad_user_data: 'denied', analytics_storage: 'denied' };

export function createAdTags(env: AdEnv, ids: AdIds): AdTags {
  const { win } = env;
  let loaded = false;
  // Consent as it stands on this page; a withdrawal after loading turns it off again.
  let granted = false;

  const loadGtag = () => {
    win.dataLayer = win.dataLayer || [];
    win.gtag = function gtag() {
      // gtag.js expects the `arguments` object itself, not an array.
      // eslint-disable-next-line prefer-rest-params
      win.dataLayer!.push(arguments);
    };
    // Consent mode: everything denied by default, then granted for measurement only.
    // ad_personalization stays denied (no remarketing).
    win.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
    win.gtag('consent', 'update', GRANTED);
    win.gtag('js', new Date());
    win.gtag('config', ids.aw);
    env.addScript(`https://www.googletagmanager.com/gtag/js?id=${ids.aw}`);
  };

  /** OpenAI's base snippet (developers.openai.com/ads/measurement-pixel). */
  const loadOpenAi = () => {
    if (win.oaiq) return;
    const q = function oaiq() {
      // eslint-disable-next-line prefer-rest-params
      q.q.push(arguments);
    } as Call & { q: unknown[] };
    q.q = [];
    win.oaiq = q;
    // An earlier withdrawal is stored by the pixel itself: this visit's consent overrides it.
    q('consent', true);
    q('init', { pixelId: ids.oaiPixel });
    env.addScript(ids.oaiSdk);
  };

  /**
   * Meta's base code, without its `<noscript>` image (that would fire without consent). The
   * stub queues the `arguments` objects until fbevents.js takes over.
   */
  const loadMeta = () => {
    if (!ids.metaPixel || win.fbq) return;
    const n = function fbq() {
      // A method call, so `this` is `n`, as in Meta's code.
      // eslint-disable-next-line prefer-rest-params
      if (n.callMethod) n.callMethod(...arguments);
      // eslint-disable-next-line prefer-rest-params
      else n.queue.push(arguments);
    } as Fbq;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    // Our replaceState calls (search filters, #render anchors) are not new pages.
    n.disablePushState = true;
    win.fbq = n;
    if (!win._fbq) win._fbq = n;
    for (const c of metaBootCalls(ids.metaPixel)) n(...c);
    env.addScript(ids.metaSdk);
  };

  const load = () => {
    if (loaded) return;
    loaded = true;
    granted = true;
    loadGtag();
    loadOpenAi();
    loadMeta();
  };

  return {
    load,
    grant() {
      // Before, a second "Kabul et" after "Reddet" on the same page did nothing: the tags were
      // loaded already, so no grant reached them until the next page load.
      if (!loaded) return load();
      granted = true;
      win.gtag?.('consent', 'update', GRANTED);
      win.oaiq?.('consent', true);
      win.fbq?.('consent', 'grant');
    },
    revoke() {
      granted = false;
      if (!loaded) return;
      win.gtag?.('consent', 'update', DENIED);
      // The OpenAI pixel sends nothing while consent is false and drops __oppref / __obref.
      win.oaiq?.('consent', false);
      if (win.fbq) {
        win.fbq('consent', 'revoke');
        for (const c of expiredCookies(META_COOKIES, env.hostname)) env.setCookie(c);
      }
    },
    track(kind) {
      if (!granted || !win.gtag) return;
      // A tel: / wa.me link may leave the page at once: send with the beacon transport, which
      // the browser delivers even after the page is gone.
      win.gtag('event', 'conversion', {
        send_to: ids.sendTo[kind],
        value: 1.0,
        currency: 'TRY',
        transport_type: 'beacon',
      });
      // The same click, one event per pixel with one shared id (dedup, and a later Conversions
      // API can reuse it). OpenAI's SDK sends with sendBeacon / fetch keepalive.
      const id = eventId();
      if (win.oaiq) {
        const [name, data, options] = OAI_EVENT[kind];
        win.oaiq('measure', name, data, { ...options, event_id: id });
      }
      if (win.fbq) {
        const [name, params] = META_EVENT[kind];
        win.fbq('track', name, { ...params }, { eventID: id });
      }
    },
  };
}
