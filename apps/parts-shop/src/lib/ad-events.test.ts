import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONSENT_KEY,
  META_EVENT,
  OAI_EVENT,
  OLD_CONSENT_KEY,
  conversionForHref,
  conversionsForLink,
  cookieDomains,
  eventId,
  expiredCookies,
  metaBootCalls,
  migrateConsent,
  readStoredConsent,
  storeConsent,
  type Conversion,
} from './ad-events.ts';

const link = (attrs: Record<string, string>) => ({ getAttribute: (n: string) => attrs[n] ?? null });
const KINDS: Conversion[] = ['form', 'phone', 'whatsapp'];

test('conversionForHref: tel → phone, WhatsApp → whatsapp, anything else → null', () => {
  assert.equal(conversionForHref('tel:+900000000000'), 'phone');
  assert.equal(conversionForHref('https://wa.me/900000000000?text=x'), 'whatsapp');
  assert.equal(conversionForHref('https://api.whatsapp.com/send?phone=1'), 'whatsapp');
  assert.equal(conversionForHref('mailto:satis@kiriciparca.com'), null);
  assert.equal(conversionForHref('/palet'), null);
});

test('conversionsForLink: an order counts only `form`, a held-back link nothing', () => {
  const wa = 'https://wa.me/900000000000';
  assert.deepEqual(conversionsForLink(link({ href: wa, 'data-kv-conversion': 'form' })), ['form']);
  assert.deepEqual(conversionsForLink(link({ href: 'mailto:x@y', 'data-kv-conversion': 'form' })), [
    'form',
  ]);
  assert.deepEqual(
    conversionsForLink(link({ href: wa, 'data-kv-conversion': 'form', 'aria-disabled': 'true' })),
    [],
  );
  assert.deepEqual(conversionsForLink(link({ href: wa })), ['whatsapp']);
  assert.deepEqual(conversionsForLink(link({ href: 'tel:+90' })), ['phone']);
  assert.deepEqual(conversionsForLink(link({ href: '/yedek-parca' })), []);
  assert.deepEqual(conversionsForLink(link({})), []);
});

test('META_EVENT: order → Lead, phone / WhatsApp → Contact with its method', () => {
  assert.deepEqual(META_EVENT.form, ['Lead', {}]);
  assert.deepEqual(META_EVENT.phone, ['Contact', { contact_method: 'phone' }]);
  assert.deepEqual(META_EVENT.whatsapp, ['Contact', { contact_method: 'whatsapp' }]);
});

test('no event carries a value, order contents or personal data', () => {
  // The KVKK text promises Meta (and OpenAI) no order content, name or contact details.
  const banned =
    /^(value|currency|content_ids|contents|content_name|num_items|em|ph|fn|ln|ct|zp|db|ge|external_id|email|phone_number|name)$/;
  for (const k of KINDS) {
    for (const key of Object.keys(META_EVENT[k][1])) assert.doesNotMatch(key, banned, `meta ${k}`);
    const [, data, options] = OAI_EVENT[k];
    for (const key of [...Object.keys(data), ...Object.keys(options)])
      assert.doesNotMatch(key, banned, `openai ${k}`);
  }
  assert.equal(OAI_EVENT.form[0], 'lead_created');
});

test('metaBootCalls: consent first, autoConfig off before init, init without user data, one PageView', () => {
  const calls = metaBootCalls('123');
  assert.deepEqual(calls[0], ['consent', 'grant']);
  const set = calls.findIndex((c) => c[0] === 'set');
  const init = calls.findIndex((c) => c[0] === 'init');
  assert.deepEqual(calls[set], ['set', 'autoConfig', false, '123']);
  assert.ok(set < init, 'autoConfig must be set before init');
  // A third element would be an advanced-matching object (hashed name / phone): never.
  assert.deepEqual(calls[init], ['init', '123']);
  assert.deepEqual(calls.at(-1), ['track', 'PageView']);
  assert.equal(calls.filter((c) => c[0] === 'track').length, 1);
});

test('cookieDomains / expiredCookies: host-only plus every parent domain', () => {
  assert.deepEqual(cookieDomains('kiriciparca.com'), ['', '.kiriciparca.com']);
  assert.ok(cookieDomains('www.kiriciparca.com').includes('.kiriciparca.com'));
  assert.ok(
    cookieDomains('wip-x.kervan-parts-shop.pages.dev').includes('.kervan-parts-shop.pages.dev'),
  );
  assert.deepEqual(cookieDomains('localhost'), ['']);
  assert.deepEqual(cookieDomains('127.0.0.1'), ['']);
  assert.deepEqual(cookieDomains(''), ['']);
  assert.deepEqual(expiredCookies(['_fbp', '_fbc'], 'kiriciparca.com'), [
    '_fbp=; Max-Age=0; path=/',
    '_fbp=; Max-Age=0; path=/; domain=.kiriciparca.com',
    '_fbc=; Max-Age=0; path=/',
    '_fbc=; Max-Age=0; path=/; domain=.kiriciparca.com',
  ]);
});

test('migrateConsent: v3 wins, a v2 "denied" is kept, a v2 "granted" is asked again', () => {
  assert.equal(migrateConsent('granted', 'denied'), 'granted');
  assert.equal(migrateConsent('denied', 'granted'), 'denied');
  assert.equal(migrateConsent(null, 'denied'), 'denied');
  assert.equal(migrateConsent(null, 'granted'), null);
  assert.equal(migrateConsent(null, null), null);
  assert.equal(migrateConsent('junk', 'junk'), null);
});

test('readStoredConsent / storeConsent: v3 key written, v2 key dropped', () => {
  const m = new Map<string, string>();
  const store = {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
  assert.equal(CONSENT_KEY, 'kv_ads_consent_v3');
  m.set(OLD_CONSENT_KEY, 'granted');
  assert.equal(readStoredConsent(store), null);
  m.set(OLD_CONSENT_KEY, 'denied');
  assert.equal(readStoredConsent(store), 'denied');
  storeConsent(store, 'granted');
  assert.equal(m.get(CONSENT_KEY), 'granted');
  assert.equal(m.has(OLD_CONSENT_KEY), false);
  assert.equal(readStoredConsent(store), 'granted');
});

test('eventId: non-empty and new on every call', () => {
  const a = eventId();
  const b = eventId();
  assert.ok(a.length > 8);
  assert.notEqual(a, b);
});
