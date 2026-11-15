// End-to-end check of the iPhone app's web build (docs/agent/app.md) at iPhone size, in Chromium:
//
//   node --experimental-strip-types --no-warnings --test e2e/app.spec.ts   (from apps/parts-shop)
//
// - dist/ (the shop's own build, DEMO catalogue) is served as a local stand-in for the site at
//   VITE_SITE_ORIGIN (default http://127.0.0.1:4173): CORS *, clean URLs (/x → x.html or
//   x/index.html), the site's 404 page.
// - dist-app/ is served on APP_E2E_PORT (default 4174) with an SPA fallback to index.html. When
//   dist-app was not built for that origin, scripts/build-app.mjs builds it first.
// - E2E_SHOTS=<dir> also writes the owner's screenshots (393×852 at 2×) there.
//
// Uses the `playwright` library with node's test runner (no @playwright/test). Prints no prices.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type BrowserContext, type Page, type Route } from 'playwright';

const APP_DIR = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SITE_DIR = join(APP_DIR, 'dist');
const WWW_DIR = join(APP_DIR, 'dist-app');
const SITE = new URL(process.env.VITE_SITE_ORIGIN || 'http://127.0.0.1:4173').origin;
const APP_PORT = Number(process.env.APP_E2E_PORT || 4174);
const APP = `http://127.0.0.1:${APP_PORT}`;
const SHOTS = process.env.E2E_SHOTS || '';

/** The part item the palet and offline cases use (a DEMO page; priced in a local DEMO build). */
const ITEM = '/yedek-parca/burc/mtb-65-toolbushing';
/** A breaker page of the DEMO catalogue and the search text that finds it. */
const MODEL = '/kirici/daemo/d-75';
const MODEL_QUERY = 'd-75';
const OTHER_MODEL = '/kirici/daemo/d-100';
/** A DEMO breaker whose tip comes in several types (for `?tip=`). */
const TIP_MODEL = '/kirici/daemo/d-135';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.vtt': 'text/vtt',
  '.glb': 'model/gltf-binary',
};

const isFile = (p: string): boolean => {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
};

/** A path inside `dir` (no way out of it), or null. */
function inside(dir: string, urlPath: string): string | null {
  let p: string;
  try {
    p = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const f = normalize(join(dir, p));
  return f === dir || f.startsWith(dir + '/') ? f : null;
}

/** The stand-in site: Pages-style clean URLs, CORS for the app's fetches, the 404 page. */
function siteServer(): Server {
  return createServer((req, res) => {
    const path = new URL(req.url ?? '/', 'http://x').pathname;
    res.setHeader('Access-Control-Allow-Origin', '*');
    const base = inside(SITE_DIR, path);
    const found = base
      ? [base, `${base.replace(/\/$/, '')}.html`, join(base, 'index.html')].find(isFile)
      : undefined;
    if (found) {
      res.setHeader('Content-Type', TYPES[extname(found)] ?? 'application/octet-stream');
      res.end(readFileSync(found));
      return;
    }
    res.statusCode = 404;
    res.setHeader('Content-Type', TYPES['.html']);
    res.end(readFileSync(join(SITE_DIR, '404.html')));
  });
}

/** The app: its files, every other path → index.html (the app routes on real paths). Hashed
 *  assets are immutable, as on the device, so a page opened online keeps working offline. */
function appServer(): Server {
  return createServer((req, res) => {
    const path = new URL(req.url ?? '/', 'http://x').pathname;
    const f = inside(WWW_DIR, path);
    const file = f && isFile(f) ? f : join(WWW_DIR, 'index.html');
    if (path.startsWith('/assets/') || path.startsWith('/fonts/'))
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
    res.end(readFileSync(file));
  });
}

const listen = (s: Server, port: number) =>
  new Promise<void>((ok, fail) => {
    s.once('error', fail);
    s.listen(port, '127.0.0.1', () => ok());
  });

/** dist-app built for this origin (its CSP names it), else build it with scripts/build-app.mjs. */
function ensureAppBuild() {
  const index = join(WWW_DIR, 'index.html');
  if (isFile(index) && readFileSync(index, 'utf8').includes(SITE)) return;
  execFileSync(process.execPath, [join(APP_DIR, 'scripts', 'build-app.mjs')], {
    cwd: APP_DIR,
    stdio: 'inherit',
    env: { ...process.env, VITE_SITE_ORIGIN: SITE },
  });
}

/** A served page's embedded props (`#kv-page`), read from dist/. */
function propsOf(path: string): { model: Record<string, unknown> & { kind: string } } {
  const html = readFileSync(join(SITE_DIR, `${path}.html`), 'utf8');
  const m = html.match(/<script[^>]*id="kv-page"[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(m, `no props in ${path}`);
  return JSON.parse(m[1]);
}

/** Rewrites a page's props in a response (the stand-in for a site the app has not seen yet). */
async function editProps(route: Route, edit: (props: { model: Record<string, unknown> }) => void) {
  let res;
  try {
    res = await route.fetch();
  } catch {
    await route.abort('internetdisconnected');
    return;
  }
  const html = await res.text();
  const body = html.replace(
    /(<script[^>]*id="kv-page"[^>]*>)([\s\S]*?)(<\/script>)/,
    (_all, open: string, json: string, close: string) => {
      const props = JSON.parse(json);
      edit(props);
      return `${open}${JSON.stringify(props).replace(/</g, '\\u003c')}${close}`;
    },
  );
  await route.fulfill({ response: res, body });
}

let site: Server;
let www: Server;
let browser: Browser;
let ctx: BrowserContext;
let page: Page;
/** Console errors and page errors, by the case that was running. */
const errors: { phase: string; text: string }[] = [];
let phase = 'start';
/** URLs the app asked the stand-in site for. */
const siteRequests: string[] = [];

const watch = (p: Page) => {
  p.on('pageerror', (e) => errors.push({ phase, text: `pageerror: ${e.message}` }));
  p.on('console', (m) => {
    if (m.type() === 'error') errors.push({ phase, text: m.text() });
  });
  p.on('request', (r) => {
    if (r.url().startsWith(SITE + '/')) siteRequests.push(r.url());
  });
};

const shot = async (p: Page, name: string) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await p.waitForTimeout(400); // pictures and the font settle
  await p.screenshot({ path: join(SHOTS, `${name}.png`) });
};

/** Moves within the app as a tap on a link does (the router, no reload). */
const tab = (p: Page, href: string) => p.locator(`nav.kv-tabbar a[href="${href}"]`).click();

const pageH1 = (p: Page) => p.locator('main h1').first();

/** No horizontal scroll at 320 px. */
async function fitsAt320(p: Page): Promise<void> {
  const size = p.viewportSize()!;
  await p.setViewportSize({ width: 320, height: size.height });
  await p.waitForTimeout(300);
  const { sw, cw } = await p.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  await p.setViewportSize(size);
  assert.ok(sw <= cw, `page is ${sw}px wide at ${cw}px (${p.url()})`);
}

/** The tab bar and the page's order bar at `width`: the bar is one row (labels on one line) and
 *  the order bar sits on it, not under it. */
async function barsFit(p: Page, width: number): Promise<void> {
  const size = p.viewportSize()!;
  await p.setViewportSize({ width, height: 568 });
  await p.waitForTimeout(300);
  const m = await p.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;visibility:hidden;height:var(--kv-tab)';
    document.body.append(probe);
    const tabH = probe.getBoundingClientRect().height;
    probe.remove();
    const bar = document.querySelector('.kv-tabbar')!.getBoundingClientRect();
    const sticky = document.querySelector('.kv-main [data-sticky-bar]')?.getBoundingClientRect();
    const lines = [...document.querySelectorAll('.kv-tabbar a > span:last-child')].map((s) => {
      const r = document.createRange();
      r.selectNodeContents(s);
      return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size;
    });
    return { tabH, barH: bar.height, barTop: bar.top, stickyBottom: sticky?.bottom ?? null, lines };
  });
  await p.setViewportSize(size);
  assert.ok(m.barH <= m.tabH + 0.5, `tab bar ${m.barH}px > --kv-tab ${m.tabH}px at ${width}px`);
  assert.deepEqual(m.lines, [1, 1, 1, 1, 1], `tab labels wrap at ${width}px`);
  if (m.stickyBottom !== null)
    assert.ok(m.stickyBottom <= m.barTop + 0.5, `order bar under the tab bar at ${width}px`);
}

/** The number of h1 elements in the document. */
const h1Count = (p: Page) => p.evaluate(() => document.querySelectorAll('h1').length);

/** Opens a site link in the app through the Tara screen's link field. */
async function openByLink(p: Page, url: string) {
  await tab(p, '/app/tara');
  await p.locator('main input[type=url]').fill(url);
  await p.locator('main button[type=submit]').click();
}

describe('iPhone app (web build) against the DEMO site', { timeout: 300_000 }, () => {
  before(async () => {
    assert.ok(isFile(join(SITE_DIR, 'index.html')), 'build the shop first (dist/)');
    ensureAppBuild();
    site = siteServer();
    www = appServer();
    await listen(site, Number(new URL(SITE).port || 80));
    await listen(www, APP_PORT);
    browser = await chromium.launch();
    ctx = await browser.newContext({
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      locale: 'tr-TR',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    });
    page = await ctx.newPage();
    watch(page);
  });

  after(async () => {
    await browser?.close();
    await new Promise((ok) => (site ? site.close(ok) : ok(null)));
    await new Promise((ok) => (www ? www.close(ok) : ok(null)));
  });

  it('Start renders with the tab bar and no console errors', async () => {
    phase = 'start';
    await page.goto(APP + '/');
    await page.getByRole('heading', { name: 'Kırıcı modeli ara' }).waitFor();
    const nav = page.getByRole('navigation', { name: 'Uygulama bölümleri' });
    for (const label of ['Ana ekran', 'Rehber', 'Tara', 'Makinelerim', 'Palet'])
      assert.equal(await nav.getByText(label, { exact: true }).count(), 1, label);
    assert.equal(
      await page.locator('nav.kv-tabbar a[href="/"]').getAttribute('aria-current'),
      'page',
    );
    await page.waitForTimeout(500);
    assert.deepEqual(errors, []);
    await shot(page, 'start');
    await fitsAt320(page);
  });

  it('a model found by the search opens its page from the fetched props', async () => {
    phase = 'model';
    const name = String(propsOf(MODEL).model.name);
    await page.locator('main input[type=search]').fill(MODEL_QUERY);
    await page.locator(`main a[href="${MODEL}"]`).click();
    await pageH1(page).waitFor();
    assert.equal(new URL(page.url()).pathname, MODEL);
    assert.ok(siteRequests.includes(SITE + MODEL), 'the page was read from the site');
    assert.ok((await pageH1(page).textContent())!.includes(name.split(' ').pop()!));
    // The top bar carries the model's name (from the props) and the save button.
    assert.equal(await page.locator('header p').first().textContent(), name);
    await page.getByRole('button', { name: 'Makinelerime ekle' }).waitFor();
    await shot(page, 'model');
    await fitsAt320(page);
    // At 320 px (with the back button) the save button is its icon only: the name fits.
    await page.setViewportSize({ width: 320, height: 852 });
    await page.waitForTimeout(300);
    const fit = await page.evaluate(() => {
      const t = document.querySelector('.kv-topbar p')!;
      return { sw: t.scrollWidth, cw: t.clientWidth };
    });
    await page.getByRole('button', { name: 'Makinelerime ekle' }).waitFor();
    await page.setViewportSize({ width: 393, height: 852 });
    assert.ok(fit.sw <= fit.cw, `model name cut in the top bar (${fit.sw} > ${fit.cw})`);
    assert.equal(await page.getByRole('button', { name: 'Geri' }).count(), 1);
  });

  it('"Makinelerime ekle" saves it; Makinelerim lists it and opens only that page', async () => {
    phase = 'machines';
    const name = String(propsOf(MODEL).model.name);
    await page.getByRole('button', { name: 'Makinelerime ekle' }).click();
    await page.getByRole('button', { name: 'Makinelerimde', pressed: true }).waitFor();
    await tab(page, '/app/makinelerim');
    const rows = page.locator('main section').first().locator('li a');
    await rows.first().waitFor();
    assert.equal(await rows.count(), 1);
    assert.equal(await rows.first().getAttribute('href'), MODEL);
    assert.equal((await rows.first().textContent())!.trim(), name);
    // A second machine from the same search: each row keeps its own page.
    await page.locator('main input[type=search]').fill('d-100');
    await page
      .getByRole('button', { name: `${propsOf(OTHER_MODEL).model.name}: makinelerime ekle` })
      .click();
    await page.waitForFunction(
      () => (document.querySelector('main section')?.querySelectorAll('li a').length ?? 0) >= 2,
    );
    assert.deepEqual(
      await rows.evaluateAll((as) => as.map((a) => a.getAttribute('href')).sort()),
      [OTHER_MODEL, MODEL].sort(),
    );
    await page.locator('main input[type=search]').fill('');
    await page.locator('main input[type=search]').blur();
    await shot(page, 'machines');
    await rows.filter({ hasText: name }).click();
    await pageH1(page).waitFor();
    assert.equal(new URL(page.url()).pathname, MODEL);
    assert.equal(await page.locator('header p').first().textContent(), name);
    // Removing one leaves the other.
    await tab(page, '/app/makinelerim');
    await page
      .getByRole('button', { name: `${propsOf(OTHER_MODEL).model.name}: makinelerimden çıkar` })
      .click();
    await page.waitForFunction(
      () => (document.querySelector('main section')?.querySelectorAll('li a').length ?? 0) === 1,
    );
  });

  it('a tip page keeps ?uc= and ?tip= (the shop reads them) and its #anchor', async () => {
    phase = 'query';
    const fams = propsOf(TIP_MODEL).model.families as { skus: { tipType: string }[] }[];
    const types = [...new Set(fams[0].skus.map((s) => s.tipType))];
    assert.ok(types.length > 1, `${TIP_MODEL} has several tip types`);
    const tip = types[types.length - 1];
    await openByLink(page, `${SITE}${TIP_MODEL}?uc=1&tip=${tip}#parcalar`);
    await pageH1(page).waitFor();
    await page.waitForTimeout(400);
    const u = new URL(page.url());
    assert.equal(u.pathname, TIP_MODEL);
    assert.equal(u.searchParams.get('uc'), '1');
    assert.equal(u.searchParams.get('tip'), tip);
    assert.equal(u.hash, '#parcalar');
    // ?tip= preselects that type in the type picker (TipProduct reads window.location.search);
    // without it the first type is picked.
    const checked = (p: Page) =>
      p
        .locator('main input[type=radio][name=type]')
        .evaluateAll((rs) => rs.findIndex((r) => (r as HTMLInputElement).checked));
    const withTip = await checked(page);
    const plain = await ctx.newPage();
    await plain.goto(`${APP}${TIP_MODEL}`);
    await pageH1(plain).waitFor();
    await plain.waitForTimeout(300);
    const without = await checked(plain);
    await plain.close();
    assert.equal(without, 0);
    assert.ok(withTip > 0, 'the ?tip= type is selected');
  });

  it('an item added to the Palet shows on the Palet tab with the price of its fetched page', async () => {
    phase = 'palet';
    // The DEMO build is priced only with SHOP_DEMO_PART_PRICES=1 (local, never in CI): without
    // it the test gives the page the DEMO price it would have, in the response the app reads.
    if (propsOf(ITEM).model.price === null)
      await ctx.route(SITE + ITEM, (r) => editProps(r, (p) => (p.model.price = 6100)));
    await openByLink(page, SITE + ITEM);
    await pageH1(page).waitFor();
    const offer = page.locator('main [data-offer]:visible').first();
    await offer.waitFor();
    const price = (await offer.evaluate((e) => e.firstChild?.textContent ?? '')).trim();
    assert.match(price, /\d/);
    await page.locator('main button:visible', { hasText: 'Palete yükle' }).first().click();
    await page.locator('nav.kv-tabbar a[aria-label="Palet, 1 ürün"]').waitFor();
    for (const w of [320, 375]) await barsFit(page, w);
    const n0 = siteRequests.length;
    await tab(page, '/palet');
    await page.getByText(price, { exact: false }).first().waitFor();
    assert.equal(await page.locator('main').getByText('Fiyat sorulacak').count(), 0);
    // /palet read the line's page again from the site.
    assert.ok(siteRequests.slice(n0).includes(SITE + ITEM), 'the line was read again');
    await shot(page, 'palet');
    await fitsAt320(page);
  });

  it('the browser back button returns to the previous screen', async () => {
    phase = 'back';
    await page.goBack();
    await page.waitForURL((u) => u.pathname === ITEM);
    await pageH1(page).waitFor();
    await page.goBack();
    await page.waitForURL((u) => u.pathname === '/app/tara');
    await page.locator('main input[type=url]').waitFor();
    await page.goForward();
    await page.waitForURL((u) => u.pathname === ITEM);
  });

  it('offline: a visited page shows its saved copy with the dated line; an unvisited one, Offline', async () => {
    phase = 'offline';
    // A new session (the saved copies are in IndexedDB; this session's reads are not).
    const p2 = await ctx.newPage();
    watch(p2);
    await p2.goto(APP + '/app/tara');
    await p2.locator('main input[type=url]').waitFor();
    await ctx.unroute(SITE + ITEM);
    await ctx.setOffline(true);
    try {
      await openByLink(p2, SITE + ITEM);
      await pageH1(p2).waitFor();
      const dated = p2.getByText(
        /^Fiyatlar \d{1,2} \S+ \d{4} tarihlidir; bağlantı olunca güncellenir\.$/,
      );
      await dated.waitFor();
      // Pictures that cannot load leave an empty frame (no broken-picture mark).
      await p2.waitForTimeout(500);
      const unmarked = await p2.evaluate(
        () =>
          [...document.querySelectorAll('main img')].filter(
            (i) =>
              (i as HTMLImageElement).complete &&
              (i as HTMLImageElement).naturalWidth === 0 &&
              (i as HTMLImageElement).currentSrc !== '' &&
              !(i as HTMLElement).hasAttribute('data-broken'),
          ).length,
      );
      assert.equal(unmarked, 0, 'a failed picture is not marked');
      await shot(p2, 'offline-dated');
      // The saved Palet: its lines keep the price of the day they were added, and say so.
      await tab(p2, '/palet');
      await p2
        .getByText('Fiyatlar ürünün eklendiği günün fiyatıdır; bağlantı olunca güncellenir.')
        .waitFor();
      await p2.getByText('Fiyat güncellenemedi; sipariş onayında bildirilir.').first().waitFor();
      await shot(p2, 'offline-palet');
      // A saved model page opens from Makinelerim too.
      await tab(p2, '/app/makinelerim');
      await p2.locator(`main a[href="${MODEL}"]`).click();
      await pageH1(p2).waitFor();
      // A page never opened.
      await openByLink(p2, `${SITE}/marka/daemo`);
      await p2.getByRole('heading', { name: 'Bağlantı yok' }).waitFor();
      await p2.getByText('Bu sayfa telefonda kayıtlı değil.').waitFor();
      await shot(p2, 'offline');
    } finally {
      await ctx.setOffline(false);
    }
    await p2.close();
  });

  it('the Scan screen refuses a link that is not Kervan', async () => {
    phase = 'scan';
    for (const bad of ['https://example.com/palet', 'http://kiriciparca.com.example.net/']) {
      await openByLink(page, bad);
      await page.getByRole('alert').filter({ hasText: 'Bu bir Kervan bağlantısı değil' }).waitFor();
      assert.equal(new URL(page.url()).pathname, '/app/tara');
    }
    await page.getByText('Kod tarama iPhone uygulamasıyla gelecek.').waitFor();
  });

  it('a page of a kind the app does not know shows the update screen', async () => {
    phase = 'update';
    const legal = '/yasal/kvkk';
    await ctx.route(SITE + legal, (r) => editProps(r, (p) => (p.model.kind = 'video')));
    await openByLink(page, SITE + legal);
    await page.getByRole('heading', { name: 'Bu sayfa için uygulamayı güncelleyin' }).waitFor();
    await page.getByRole('button', { name: 'Sitede aç' }).waitFor();
    await shot(page, 'update');
    await ctx.unroute(SITE + legal);
  });

  it('the app screens have one h1 each: the top bar title', async () => {
    phase = 'h1';
    for (const [href, name] of [
      ['/', 'Kervan Kırıcı Parça'],
      ['/app/makinelerim', 'Makinelerim'],
      ['/app/tara', 'Tara'],
    ]) {
      await tab(page, href);
      await page.locator('.kv-topbar h1', { hasText: name }).waitFor();
      assert.equal(await h1Count(page), 1, href);
    }
  });

  it('an in-page anchor is an entry of the app: Back returns where the jump started', async () => {
    phase = 'anchor';
    const legal = '/yasal/kvkk';
    await openByLink(page, SITE + legal);
    await pageH1(page).waitFor();
    await page.waitForTimeout(300);
    const toc = page.locator('main a[href^="#"]');
    assert.ok((await toc.count()) > 3, 'the legal page has its contents links');
    await toc.nth(3).click();
    await page.waitForTimeout(500);
    const jump = await page.evaluate(() => ({
      y: scrollY,
      hash: location.hash,
      idx: (history.state as { kvIdx?: unknown } | null)?.kvIdx,
    }));
    assert.ok(jump.hash.length > 1 && jump.y > 0, 'the jump scrolled');
    assert.equal(typeof jump.idx, 'number', 'the jump has the app index');
    // Another page, scrolled, then Back: the anchor entry at its own position.
    await tab(page, '/palet');
    await pageH1(page).waitFor();
    await page.evaluate(() => scrollTo(0, 400));
    await page.waitForTimeout(300);
    await page.goBack();
    await page.waitForURL((u) => u.pathname === legal && u.hash === jump.hash);
    await pageH1(page).waitFor();
    await page.waitForTimeout(600);
    const y = await page.evaluate(() => scrollY);
    assert.ok(Math.abs(y - jump.y) <= 2, `back to the anchor at ${y}, was ${jump.y}`);
    // Back again: the same page where it was before the jump (the top).
    await page.goBack();
    await page.waitForURL((u) => u.pathname === legal && u.hash === '');
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => scrollY), 0);
  });

  it('TR/EN: the switch on Start changes the labels and reads /en/ pages', async () => {
    phase = 'lang';
    await tab(page, '/');
    await page.getByRole('button', { name: 'English' }).click();
    await page.getByRole('heading', { name: 'Search breaker models' }).waitFor();
    const nav = page.getByRole('navigation', { name: 'App sections' });
    for (const label of ['Home', 'Guides', 'Scan', 'My machines', 'Palet'])
      assert.equal(await nav.getByText(label, { exact: true }).count(), 1, label);
    await shot(page, 'start-en');
    // Back after the switch: the page before Start, at its English address.
    await page.goBack();
    await page.waitForURL((u) => u.pathname === '/en/yasal/kvkk');
    await pageH1(page).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
    await page.goForward();
    await page.waitForURL((u) => u.pathname === '/en/');
    await page.getByRole('heading', { name: 'Search breaker models' }).waitFor();
    // EN at 320 px: the section cards break between words only (one column below 360 px).
    await page.setViewportSize({ width: 320, height: 852 });
    await page.waitForTimeout(300);
    const broken = await page.evaluate(
      () =>
        [...document.querySelectorAll('#kv-start-sections ~ ul a > span')].filter((s) => {
          const r = document.createRange();
          r.selectNodeContents(s);
          const words = (s.textContent ?? '').split(' ').length;
          return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size > words;
        }).length,
    );
    await page.setViewportSize({ width: 393, height: 852 });
    assert.equal(broken, 0, 'a section label breaks inside a word');
    const n0 = siteRequests.length;
    await page.locator('main a[href="/en/yedek-parca"]').click();
    await pageH1(page).waitFor();
    assert.equal(new URL(page.url()).pathname, '/en/yedek-parca');
    assert.ok(siteRequests.slice(n0).includes(`${SITE}/en/yedek-parca`));
    // The saved machine opens in English as well.
    await tab(page, '/app/makinelerim');
    await page.locator(`main a[href="/en${MODEL}"]`).click();
    await page.waitForURL((u) => u.pathname === `/en${MODEL}`);
    await page.getByRole('button', { name: 'In my machines', pressed: true }).waitFor();
    // The English tab bar and order bar at 320 and 375 px.
    await page.locator(`main a[href^="/en/"]`).first().waitFor();
    await openByLink(page, SITE + ITEM);
    await page.waitForURL((u) => u.pathname === `/en${ITEM}`);
    await pageH1(page).waitFor();
    for (const w of [320, 375]) await barsFit(page, w);
    // Back to Turkish for any later run in this profile.
    await tab(page, '/en/');
    await page.getByRole('button', { name: 'Türkçe' }).click();
    await page.getByRole('heading', { name: 'Kırıcı modeli ara' }).waitFor();
  });

  it('offline Palet never opened: built on the phone; online again, typed text survives the fresh copy', async () => {
    phase = 'offline-palet';
    // A new phone (no saved pages, nothing on the palet).
    const c2 = await browser.newContext({
      viewport: { width: 393, height: 852 },
      isMobile: true,
      hasTouch: true,
      locale: 'tr-TR',
    });
    try {
      if (propsOf(ITEM).model.price === null)
        await c2.route(SITE + ITEM, (r) => editProps(r, (p) => (p.model.price = 6100)));
      const p3 = await c2.newPage();
      watch(p3);
      await p3.goto(APP + ITEM);
      await p3.locator('main button:visible', { hasText: 'Palete yükle' }).first().click();
      await p3.locator('nav.kv-tabbar a[aria-label="Palet, 1 ürün"]').waitFor();
      await c2.setOffline(true);
      try {
        await tab(p3, '/palet');
        await pageH1(p3).waitFor();
        assert.equal(await p3.getByRole('heading', { name: 'Bağlantı yok' }).count(), 0);
        await p3
          .getByText('Fiyatlar ürünün eklendiği günün fiyatıdır; bağlantı olunca güncellenir.')
          .waitFor();
        await p3.getByText('Fiyat güncellenemedi; sipariş onayında bildirilir.').first().waitFor();
        await shot(p3, 'offline-palet-new');
      } finally {
        await c2.setOffline(false);
      }
      // Online: /palet is read once (saved), then a new session with a slow site.
      await p3.goto(APP + '/palet');
      await pageH1(p3).waitFor();
      await p3.waitForTimeout(800);
      await p3.close();
      const p4 = await c2.newPage();
      watch(p4);
      let answered = false;
      await p4.route(SITE + '/palet', async (r) => {
        await new Promise((ok) => setTimeout(ok, 2500));
        await r.continue();
        answered = true;
      });
      await p4.goto(APP + '/palet');
      const name = p4.locator('main input[autocomplete="name"]').first();
      await name.waitFor({ timeout: 2000 });
      await name.fill('Ali Veli');
      await name.evaluate((e) => (e.dataset.kvProbe = '1'));
      while (!answered) await p4.waitForTimeout(100);
      await p4.waitForTimeout(800);
      assert.equal(await name.inputValue(), 'Ali Veli');
      assert.equal(
        await p4.locator('main input[data-kv-probe]').count(),
        1,
        'the form was rebuilt',
      );
      await p4.close();
    } finally {
      await c2.close();
    }
  });

  it('no page errors, and console errors only from the offline cases', () => {
    const unexpected = errors.filter(
      (e) =>
        !(
          (e.phase === 'offline' || e.phase === 'offline-palet') &&
          /ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e.text)
        ),
    );
    assert.deepEqual(unexpected, []);
    process.stdout.write(`# console errors while offline (expected): ${errors.length}\n`);
  });
});
