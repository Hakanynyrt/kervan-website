import assert from 'node:assert/strict';
import test from 'node:test';
import {
  APP_PATHS,
  formTarget,
  inAppTarget,
  isPagePath,
  kervanLink,
  pageKey,
  parseRoute,
  splitLang,
} from './router.ts';

const SITE = 'https://kiriciparca.com';
const APP = 'capacitor://localhost/kirici-ucu';

test('splitLang: /en prefix is English, the rest Turkish', () => {
  assert.deepEqual(splitLang('/en/kirici-ucu'), { lang: 'en', path: '/kirici-ucu' });
  assert.deepEqual(splitLang('/en/'), { lang: 'en', path: '/' });
  assert.deepEqual(splitLang('/en'), { lang: 'en', path: '/' });
  assert.deepEqual(splitLang('/palet'), { lang: null, path: '/palet' });
  assert.deepEqual(splitLang('/english'), { lang: null, path: '/english' });
});

test('isPagePath: pages yes, files and the site machinery no', () => {
  for (const p of ['/', '/kirici/daemo/d-75', '/palet', '/rehber/kirici-ucu-ne-zaman-degisir'])
    assert.ok(isPagePath(p), p);
  assert.ok(isPagePath('/kirici-ucu.html'));
  for (const p of [
    '/kirici-modelleri.json',
    '/api/tech/login',
    '/photos/parca/x-01.webp',
    '/videos/rehber/a.mp4',
    '/models/a.glb',
    '/og/x.png',
    '/fonts/inter-latin-v20.woff2',
    '/logo-krv-v2.svg',
  ])
    assert.ok(!isPagePath(p), p);
});

test('inAppTarget: relative links and links on the app or the shop open in the app', () => {
  assert.equal(inAppTarget('/palet', APP, SITE), '/palet');
  assert.equal(
    inAppTarget('kirici/daemo/d-75', 'capacitor://localhost/', SITE),
    '/kirici/daemo/d-75',
  );
  assert.equal(
    inAppTarget('/kirici-ucu?q=hb%2020#sonuclar', APP, SITE),
    '/kirici-ucu?q=hb%2020#sonuclar',
  );
  assert.equal(inAppTarget('https://kiriciparca.com/palet?p=abc', APP, SITE), '/palet?p=abc');
  assert.equal(inAppTarget('https://www.kiriciparca.com/en/palet', APP, SITE), '/en/palet');
  assert.equal(
    inAppTarget('https://magaza.kiriciparca.com/yedek-parca', APP, SITE),
    '/yedek-parca',
  );
  assert.equal(inAppTarget('/kirici-ucu.html', APP, SITE), '/kirici-ucu');
  assert.equal(inAppTarget('/index.html', APP, SITE), '/');
});

test('inAppTarget: other hosts, mail, phone, WhatsApp and files leave the app', () => {
  for (const href of [
    'https://wa.me/905000000000?text=x',
    'mailto:info@example.com',
    'tel:+902620000000',
    'https://kervanbreaker.com/',
    'https://kiriciparca.com.evil.example/palet',
    'http://kiriciparca.com/palet',
    'https://img.kiriciparca.com/tips/x.webp',
    '/kirici-modelleri.json',
    '/api/tech/login',
    'javascript:alert(1)',
  ])
    assert.equal(inAppTarget(href, APP, SITE), null, href);
});

test('inAppTarget: a local stand-in site over http is the site', () => {
  const local = 'http://127.0.0.1:4173';
  assert.equal(inAppTarget(`${local}/palet`, APP, local), '/palet');
  assert.equal(inAppTarget('http://127.0.0.1:9999/palet', APP, local), null);
});

test('kervanLink: only https links on the site open; anything else is refused', () => {
  assert.equal(
    kervanLink(' https://kiriciparca.com/kirici/daemo/d-75?uc=2 ', SITE),
    '/kirici/daemo/d-75?uc=2',
  );
  assert.equal(kervanLink('https://www.kiriciparca.com/palet?p=x', SITE), '/palet?p=x');
  for (const s of [
    '',
    'kiriciparca.com/palet',
    'http://kiriciparca.com/palet',
    'https://kervanbreaker.com/',
    'https://evil.example/?u=https://kiriciparca.com/',
    'https://user:pw@kiriciparca.com/palet',
    'https://kiriciparca.com/kirici-modelleri.json',
    'https://kiriciparca.com/a b',
    'tel:+902620000000',
  ])
    assert.equal(kervanLink(s, SITE), null, s);
});

test('parseRoute: screens, pages and the app language', () => {
  assert.deepEqual(parseRoute('/', 'tr'), { kind: 'screen', screen: 'start', url: '/' });
  assert.deepEqual(parseRoute('/en/', 'en'), { kind: 'screen', screen: 'start', url: '/en/' });
  assert.deepEqual(parseRoute('/', 'en'), { kind: 'screen', screen: 'start', url: '/en/' });
  assert.deepEqual(parseRoute(APP_PATHS.machines, 'en'), {
    kind: 'screen',
    screen: 'machines',
    url: APP_PATHS.machines,
  });
  assert.deepEqual(parseRoute(`${APP_PATHS.scan}/`, 'tr'), {
    kind: 'screen',
    screen: 'scan',
    url: APP_PATHS.scan,
  });
  assert.deepEqual(parseRoute('/kirici/daemo/d-75?uc=2#parcalar', 'tr'), {
    kind: 'page',
    path: '/kirici/daemo/d-75',
    url: '/kirici/daemo/d-75?uc=2#parcalar',
  });
  // A link in the other language opens in the app's.
  assert.deepEqual(parseRoute('/en/palet?p=x', 'tr'), {
    kind: 'page',
    path: '/palet',
    url: '/palet?p=x',
  });
  assert.deepEqual(parseRoute('/rehber/', 'en'), {
    kind: 'page',
    path: '/rehber',
    url: '/en/rehber',
  });
});

test('pageKey and formTarget', () => {
  assert.equal(pageKey('/kirici-ucu?q=a#sonuclar'), '/kirici-ucu?q=a');
  assert.equal(
    formTarget('/kirici-ucu#sonuclar', [['q', 'hb 20g']]),
    '/kirici-ucu?q=hb+20g#sonuclar',
  );
  assert.equal(formTarget('/en/kirici-ucu?old=1', [['q', 'x']]), '/en/kirici-ucu?q=x');
  assert.equal(formTarget('/kirici-ucu', []), '/kirici-ucu');
});
