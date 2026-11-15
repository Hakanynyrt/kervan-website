import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CACHE_CAP,
  SESSION_TTL_MS,
  cacheKey,
  createLoader,
  headingOf,
  memoryCache,
  pageUrl,
  parsePage,
  safeCache,
  titleOf,
  type DocLike,
  type PageCache,
  type PageState,
} from './data.ts';

const SITE = 'https://kiriciparca.com';

/** A page's HTML as the prerender writes it (title, then the props script). */
const html = (props: unknown, title = 'Palet | Kervan Makina') =>
  `<!doctype html><html><head><title>${title}</title></head><body><div id="root"></div>` +
  `<script type="application/json" id="kv-page">${JSON.stringify(props).replace(/\//g, '\\/')}</script></body></html>`;

/** A stand-in for DOMParser: the title and the props script's text. */
const parse = (h: string): DocLike => {
  const title = /<title>([^<]*)<\/title>/.exec(h)?.[1] ?? '';
  const props = /<script[^>]*id="kv-page"[^>]*>([\s\S]*?)<\/script>/.exec(h)?.[1] ?? null;
  return {
    title,
    getElementById: (id) => (id === 'kv-page' && props !== null ? { textContent: props } : null),
  };
};
/** The site's readPageProps, on the stand-in document. */
const readProps = (doc: DocLike): unknown => {
  const t = doc.getElementById('kv-page')?.textContent;
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
};

const cart = {
  lang: 'tr',
  path: '/palet',
  model: { kind: 'cart', demo: false, hasPopular: true },
  fx: null,
};

type Res = { ok: boolean; status: number; text(): Promise<string> };
const res = (status: number, body: string): Res => ({
  ok: status < 400,
  status,
  text: async () => body,
});

function setup(answer: (url: string) => Promise<Res>, cache: PageCache = memoryCache()) {
  const asked: string[] = [];
  let t = 1_000;
  const loader = createLoader({
    origin: SITE,
    cache,
    fetch: (url) => {
      asked.push(url);
      return answer(url);
    },
    parse,
    readProps,
    now: () => ++t,
  });
  const run = async (path: string, lang: 'tr' | 'en' = 'tr') => {
    const states: PageState[] = [];
    await loader.load(path, lang, (s) => states.push(s));
    return states;
  };
  return { loader, asked, run, cache };
}

test('pageUrl, cacheKey, titleOf', () => {
  assert.equal(pageUrl(SITE, '/palet', 'tr'), 'https://kiriciparca.com/palet');
  assert.equal(pageUrl(SITE, '/palet', 'en'), 'https://kiriciparca.com/en/palet');
  assert.equal(pageUrl(SITE, '/', 'en'), 'https://kiriciparca.com/en/');
  assert.equal(cacheKey('en', '/palet'), 'en:/palet');
  assert.equal(titleOf('Daemo D-75 kırıcı ucu Ø75 | Kervan Makina'), 'Daemo D-75 kırıcı ucu Ø75');
  assert.equal(titleOf('A | B | Kervan Makina'), 'A | B');
  assert.equal(titleOf('Palet'), 'Palet');
  assert.equal(titleOf(null), '');
});

test('parsePage: props and title of a page; no props, bad props and unknown kinds', () => {
  const ok = parsePage(parse(html(cart)), readProps);
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.props.model.kind, 'cart');
    assert.equal(ok.props.path, '/palet');
    assert.equal(ok.title, 'Palet');
  }
  assert.deepEqual(parsePage(parse('<html><title>x</title></html>'), readProps), {
    ok: false,
    reason: 'invalid',
  });
  const broken = '<script type="application/json" id="kv-page">{"lang":</script>';
  assert.deepEqual(parsePage(parse(broken), readProps), { ok: false, reason: 'invalid' });
  const newer = { ...cart, model: { kind: 'video', demo: false } };
  assert.deepEqual(parsePage(parse(html(newer)), readProps), { ok: false, reason: 'unknownKind' });
});

test('load: first visit reads the site, the page is fresh and saved', async () => {
  const { run, asked, cache } = setup(async () => res(200, html(cart)));
  const states = await run('/palet');
  assert.deepEqual(
    states.map((s) => s.status),
    ['loading', 'ready'],
  );
  const last = states[1];
  assert.ok(last.status === 'ready' && last.fresh);
  assert.deepEqual(asked, ['https://kiriciparca.com/palet']);
  assert.ok(await cache.get('tr:/palet'));
});

test('load: a page read in this session is not read again', async () => {
  const { run, asked } = setup(async () => res(200, html(cart)));
  await run('/palet');
  const again = await run('/palet');
  assert.equal(asked.length, 1);
  assert.equal(again.length, 1);
  assert.ok(again[0].status === 'ready' && again[0].fresh);
});

test("load: a saved copy shows at once, dated, then the site's", async () => {
  const cache = memoryCache();
  await cache.put('tr:/palet', { props: cart as never, title: 'Palet', at: 5 });
  const { run } = setup(async () => res(200, html(cart)), cache);
  const states = await run('/palet');
  assert.equal(states.length, 2);
  assert.ok(states[0].status === 'ready' && !states[0].fresh && states[0].page.at === 5);
  assert.ok(states[1].status === 'ready' && states[1].fresh && states[1].page.at > 5);
});

test('load: offline with a saved copy keeps it dated; without one, the offline screen', async () => {
  const cache = memoryCache();
  await cache.put('tr:/palet', { props: cart as never, title: 'Palet', at: 5 });
  const off = async (): Promise<Res> => {
    throw new TypeError('Failed to fetch');
  };
  const withCopy = await setup(off, cache).run('/palet');
  assert.equal(withCopy.length, 1);
  assert.ok(withCopy[0].status === 'ready' && !withCopy[0].fresh);
  const without = await setup(off).run('/palet');
  assert.deepEqual(
    without.map((s) => s.status),
    ['loading', 'offline'],
  );
});

test('load: a server error or a page without props is "failed"; a newer kind is "update"', async () => {
  assert.equal((await setup(async () => res(503, 'down')).run('/palet')).at(-1)?.status, 'failed');
  assert.equal(
    (await setup(async () => res(200, '<html>challenge</html>')).run('/palet')).at(-1)?.status,
    'failed',
  );
  const newer = { ...cart, model: { kind: 'video', demo: false } };
  assert.equal(
    (await setup(async () => res(200, html(newer))).run('/palet')).at(-1)?.status,
    'update',
  );
});

test("load: the site's 404 page is a page (notFound)", async () => {
  const nf = { lang: 'tr', path: '/yok', model: { kind: 'notFound' }, fx: null };
  const last = (
    await setup(async () => res(404, html(nf, 'Sayfa bulunamadı | Kervan Makina'))).run('/yok')
  ).at(-1);
  assert.ok(last?.status === 'ready' && last.page.props.model.kind === 'notFound');
});

test('load: languages are kept apart', async () => {
  const { run, asked } = setup(async (u) =>
    res(200, html({ ...cart, lang: u.includes('/en/') ? 'en' : 'tr' })),
  );
  await run('/palet', 'tr');
  const en = await run('/palet', 'en');
  assert.deepEqual(asked, ['https://kiriciparca.com/palet', 'https://kiriciparca.com/en/palet']);
  assert.ok(en.at(-1)?.status === 'ready' && en.at(-1)?.status === 'ready');
});

test('load: nothing more is reported once the user has moved on (the page is still saved)', async () => {
  let current = true;
  const { loader, cache } = setup(async () => {
    current = false;
    return res(200, html(cart));
  });
  const states: PageState[] = [];
  await loader.load(
    '/palet',
    'tr',
    (s) => states.push(s),
    () => current,
  );
  assert.deepEqual(
    states.map((s) => s.status),
    ['loading'],
  );
  assert.ok(await cache.get('tr:/palet'));
});

test('memoryCache keeps at most the cap, dropping the oldest read', async () => {
  assert.equal(CACHE_CAP, 300);
  const c = memoryCache(3);
  for (let i = 1; i <= 5; i++) await c.put(`k${i}`, { props: cart as never, title: '', at: i });
  assert.equal(c.size(), 3);
  assert.equal(await c.get('k1'), null);
  assert.equal(await c.get('k2'), null);
  assert.ok(await c.get('k5'));
});

test('safeCache: a store that throws reads as empty and falls back', async () => {
  const bad: PageCache = {
    get: async () => {
      throw new Error('blocked');
    },
    put: async () => {
      throw new Error('blocked');
    },
    newest: async () => {
      throw new Error('blocked');
    },
  };
  const c = safeCache(bad);
  assert.equal(await c.get('x'), null);
  await c.put('x', { props: cart as never, title: '', at: 1 });
  assert.ok(await c.get('x'));
});

test("headingOf: the page's own h1 (main first), else the <title>", () => {
  const doc = (title: string, h: Record<string, string>): DocLike => ({
    title,
    getElementById: () => null,
    querySelector: (sel) => (sel in h ? { textContent: h[sel] } : null),
  });
  const seo = 'Kırıcı ucu: marka ve modele göre | Kervan Makina';
  assert.equal(headingOf(doc(seo, { 'main h1': '  Tüm kırıcı\n  uçları ' })), 'Tüm kırıcı uçları');
  assert.equal(headingOf(doc(seo, { h1: 'Rehber' })), 'Rehber');
  assert.equal(headingOf(doc(seo, { 'main h1': '  ' })), 'Kırıcı ucu: marka ve modele göre');
  assert.equal(headingOf(doc(seo, {})), 'Kırıcı ucu: marka ve modele göre');
  // parsePage takes the heading as the page's title.
  const withH1 = html(cart, seo).replace('<div id="root"></div>', '<main><h1>Palet</h1></main>');
  const parsed = parsePage(
    {
      ...parse(withH1),
      querySelector: (sel) =>
        sel === 'main h1' ? { textContent: /<h1>([^<]*)<\/h1>/.exec(withH1)?.[1] ?? '' } : null,
    },
    readProps,
  );
  assert.ok(parsed.ok && parsed.title === 'Palet');
});

test('load: a page read this session is read again once SESSION_TTL_MS has passed', async () => {
  let t = 1_000;
  const asked: string[] = [];
  const loader = createLoader({
    origin: SITE,
    cache: memoryCache(),
    fetch: async (url) => {
      asked.push(url);
      return res(200, html(cart));
    },
    parse,
    readProps,
    now: () => t,
  });
  const run = async () => {
    const states: PageState[] = [];
    await loader.load('/palet', 'tr', (s) => states.push(s));
    return states;
  };
  await run();
  t += SESSION_TTL_MS - 1;
  const soon = await run();
  assert.equal(asked.length, 1);
  assert.ok(soon.length === 1 && soon[0].status === 'ready' && soon[0].fresh);
  t += 2;
  const later = await run();
  assert.equal(asked.length, 2);
  // The session's copy shows dated while the site is asked, then today's.
  assert.deepEqual(
    later.map((s) => s.status === 'ready' && s.fresh),
    [false, true],
  );
  assert.ok(later[0].status === 'ready' && later[0].page.at === 1_000);
  assert.ok(later[1].status === 'ready' && later[1].page.at === t);
  // forgetSession: read again at once.
  loader.forgetSession();
  await run();
  assert.equal(asked.length, 3);
});

test('safeCache: a store that never answers is given up after waitMs (memory from then on)', async () => {
  let calls = 0;
  const hang: PageCache = {
    get: () => {
      calls++;
      return new Promise(() => undefined);
    },
    put: () => new Promise(() => undefined),
    newest: () => new Promise(() => undefined),
  };
  const c = safeCache(hang, memoryCache(), 20);
  const t0 = Date.now();
  assert.equal(await c.get('x'), null);
  assert.ok(Date.now() - t0 < 1_000);
  await c.put('x', { props: cart as never, title: '', at: 1 });
  assert.ok(await c.get('x'));
  assert.equal(calls, 1);
  // The loader with such a store still reads the site.
  const { run } = setup(async () => res(200, html(cart)), safeCache(hang, memoryCache(), 20));
  assert.deepEqual(
    (await run('/palet')).map((s) => s.status),
    ['loading', 'ready'],
  );
});

test('memoryCache.newest: the page read last', async () => {
  const c = memoryCache();
  assert.equal(await c.newest(), null);
  await c.put('a', { props: cart as never, title: 'a', at: 5 });
  await c.put('b', { props: cart as never, title: 'b', at: 9 });
  await c.put('c', { props: cart as never, title: 'c', at: 7 });
  assert.equal((await c.newest())?.title, 'b');
});

test('load: offline with no saved copy, a page the phone can build (the palet) is shown', async () => {
  const cache = memoryCache();
  const fx = { usdTry: 40, date: '2026-11-14' };
  await cache.put('tr:/kirici-ucu', {
    props: { ...cart, path: '/kirici-ucu', fx } as never,
    title: 'x',
    at: 9,
  });
  const built: unknown[] = [];
  const loader = createLoader({
    origin: SITE,
    cache,
    fetch: async () => {
      throw new TypeError('Failed to fetch');
    },
    parse,
    readProps,
    offlinePage: (path, lang, f) => {
      built.push(f);
      return path === '/palet'
        ? { props: { lang, path, model: cart.model, fx: f } as never, title: 'Palet', at: 1 }
        : null;
    },
  });
  const states: PageState[] = [];
  await loader.load('/palet', 'tr', (s) => states.push(s));
  assert.deepEqual(
    states.map((s) => s.status),
    ['loading', 'ready'],
  );
  const last = states[1];
  assert.ok(last.status === 'ready' && !last.fresh && last.page.props.model.kind === 'cart');
  assert.deepEqual(built, [fx]);
  // Not saved as a copy of the site's page.
  assert.equal(await cache.get('tr:/palet'), null);
  // Another page: the offline screen.
  const other: PageState[] = [];
  await loader.load('/marka/daemo', 'tr', (s) => other.push(s));
  assert.equal(other.at(-1)?.status, 'offline');
});
