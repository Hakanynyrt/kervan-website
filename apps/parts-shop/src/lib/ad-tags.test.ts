import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metaBootCalls } from './ad-events.ts';
import { createAdTags, type AdIds, type AdWindow } from './ad-tags.ts';

// Made-up ids: the tags only ever see what is passed in, and nothing here touches a network.
const IDS: AdIds = {
  aw: 'AW-1',
  sendTo: { form: 'AW-1/form', phone: 'AW-1/phone', whatsapp: 'AW-1/wa' },
  oaiPixel: 'oai-1',
  oaiSdk: 'https://oai.test/sdk.js',
  metaPixel: '42',
  metaSdk: 'https://meta.test/fbevents.js',
};

/** A fake browser: the tag stubs' queues hold `arguments` objects, read back as arrays. */
function setup(ids: AdIds = IDS) {
  const win: AdWindow = {};
  const scripts: string[] = [];
  const cookies: string[] = [];
  const tags = createAdTags(
    {
      win,
      addScript: (src) => void scripts.push(src),
      setCookie: (c) => void cookies.push(c),
      hostname: 'kiriciparca.com',
    },
    ids,
  );
  const calls = (q: unknown[] | undefined) =>
    (q ?? []).map((a) => Array.from(a as ArrayLike<unknown>));
  return {
    tags,
    win,
    scripts,
    cookies,
    gtag: () => calls(win.dataLayer),
    oaiq: () => calls(win.oaiq?.q),
    fbq: () => calls(win.fbq?.queue),
  };
}

test('nothing is loaded, queued or requested before consent', () => {
  const s = setup();
  s.tags.track('form');
  s.tags.revoke();
  assert.deepEqual(s.scripts, []);
  assert.deepEqual(s.cookies, []);
  assert.deepEqual(Object.keys(s.win), []);
});

test('load: the three tags once, Meta in its boot order', () => {
  const s = setup();
  s.tags.load();
  s.tags.load();
  assert.deepEqual(s.scripts, [
    'https://www.googletagmanager.com/gtag/js?id=AW-1',
    IDS.oaiSdk,
    IDS.metaSdk,
  ]);
  const g = s.gtag();
  assert.deepEqual(g[0], [
    'consent',
    'default',
    {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    },
  ]);
  assert.deepEqual(g[1], [
    'consent',
    'update',
    { ad_storage: 'granted', ad_user_data: 'granted', analytics_storage: 'granted' },
  ]);
  assert.deepEqual(g.at(-1), ['config', 'AW-1']);
  assert.deepEqual(s.oaiq(), [
    ['consent', true],
    ['init', { pixelId: 'oai-1' }],
  ]);
  assert.deepEqual(s.fbq(), metaBootCalls('42'));
  assert.equal(s.win.fbq?.disablePushState, true);
  assert.equal(s.win._fbq, s.win.fbq);
});

test('an empty Meta pixel id loads nothing from Meta', () => {
  const s = setup({ ...IDS, metaPixel: '' });
  s.tags.load();
  s.tags.track('whatsapp');
  s.tags.revoke();
  s.tags.grant();
  assert.equal(s.win.fbq, undefined);
  assert.equal(s.win._fbq, undefined);
  assert.equal(s.scripts.length, 2);
  assert.ok(!s.scripts.some((u) => u.includes('meta')));
  assert.deepEqual(s.cookies, []);
});

test('track: one event per tag, Meta Lead / Contact with the OpenAI event_id', () => {
  const s = setup();
  s.tags.load();
  const before = { g: s.gtag().length, o: s.oaiq().length, f: s.fbq().length };
  s.tags.track('form');
  s.tags.track('phone');
  const g = s.gtag().slice(before.g);
  const o = s.oaiq().slice(before.o);
  const f = s.fbq().slice(before.f);
  assert.deepEqual(g[0], [
    'event',
    'conversion',
    { send_to: 'AW-1/form', value: 1.0, currency: 'TRY', transport_type: 'beacon' },
  ]);
  assert.equal(g.length, 2);
  assert.equal(o.length, 2);
  assert.equal(f.length, 2);
  assert.deepEqual(f[0].slice(0, 3), ['track', 'Lead', {}]);
  assert.deepEqual(f[1].slice(0, 3), ['track', 'Contact', { contact_method: 'phone' }]);
  for (const i of [0, 1]) {
    const oaiId = (o[i][3] as { event_id: string }).event_id;
    assert.ok(oaiId);
    assert.deepEqual(f[i][3], { eventID: oaiId });
  }
  assert.notEqual(
    (o[0][3] as { event_id: string }).event_id,
    (o[1][3] as { event_id: string }).event_id,
  );
});

test('revoke: all three switched off, Meta cookies deleted, clicks send nothing', () => {
  const s = setup();
  s.tags.load();
  s.tags.revoke();
  assert.deepEqual(s.gtag().at(-1), [
    'consent',
    'update',
    { ad_storage: 'denied', ad_user_data: 'denied', analytics_storage: 'denied' },
  ]);
  assert.deepEqual(s.oaiq().at(-1), ['consent', false]);
  assert.deepEqual(s.fbq().at(-1), ['consent', 'revoke']);
  for (const name of ['_fbp', '_fbc'])
    for (const domain of ['', '; domain=.kiriciparca.com'])
      assert.ok(s.cookies.includes(`${name}=; Max-Age=0; path=/${domain}`), `${name}${domain}`);
  const n = { g: s.gtag().length, o: s.oaiq().length, f: s.fbq().length };
  s.tags.track('whatsapp');
  assert.deepEqual({ g: s.gtag().length, o: s.oaiq().length, f: s.fbq().length }, n);
});

test('grant after revoke on the same page: the tags resume (re-accept fix)', () => {
  const s = setup();
  s.tags.load();
  s.tags.revoke();
  s.tags.grant();
  assert.deepEqual(s.gtag().at(-1), [
    'consent',
    'update',
    { ad_storage: 'granted', ad_user_data: 'granted', analytics_storage: 'granted' },
  ]);
  assert.deepEqual(s.oaiq().at(-1), ['consent', true]);
  assert.deepEqual(s.fbq().at(-1), ['consent', 'grant']);
  assert.equal(s.scripts.length, 3, 'no script is injected twice');
  s.tags.track('whatsapp');
  assert.deepEqual(s.fbq().at(-1)?.slice(0, 3), [
    'track',
    'Contact',
    { contact_method: 'whatsapp' },
  ]);
});

test('grant before anything loaded is a load', () => {
  const s = setup();
  s.tags.grant();
  assert.equal(s.scripts.length, 3);
  assert.deepEqual(s.fbq(), metaBootCalls('42'));
});

test('fbevents.js taking over: the stub forwards calls to callMethod', () => {
  const s = setup();
  s.tags.load();
  const seen: unknown[][] = [];
  s.win.fbq!.callMethod = (...a: unknown[]) => void seen.push(a);
  s.tags.track('form');
  assert.deepEqual(seen.at(-1)?.slice(0, 3), ['track', 'Lead', {}]);
});
