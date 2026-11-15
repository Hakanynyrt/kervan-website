import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createStore,
  firstLang,
  isMachinePath,
  MAX_MACHINES,
  memoryKV,
  parseLang,
  parseMachines,
  preferencesKV,
  STORE_KEYS,
} from './store.ts';

test("the store keys are versioned and the app's own", () => {
  assert.deepEqual(STORE_KEYS, { machines: 'kv_app_machines_v1', lang: 'kv_app_lang_v1' });
});

test('firstLang: Turkish phones get Turkish, every other language English', () => {
  for (const l of ['tr', 'tr-TR', 'TR-tr', 'tr_TR']) assert.equal(firstLang(l), 'tr', l);
  for (const l of ['en-US', 'de-DE', 'az-AZ', 'trk', '', null, undefined])
    assert.equal(firstLang(l), 'en', String(l));
  assert.equal(parseLang('en'), 'en');
  assert.equal(parseLang('de'), null);
});

test('isMachinePath: a breaker model page only', () => {
  assert.ok(isMachinePath('/kirici/daemo/d-75'));
  for (const p of [
    '/kirici/daemo',
    '/kirici/daemo/d-75/x',
    '/en/kirici/daemo/d-75',
    '/palet',
    '/kirici/Daemo/d-75',
    '/kirici/../palet/x',
  ])
    assert.ok(!isMachinePath(p), p);
});

test('parseMachines: damaged storage reads as no machines; bad rows and repeats dropped', () => {
  assert.deepEqual(parseMachines(null), []);
  assert.deepEqual(parseMachines('{'), []);
  assert.deepEqual(parseMachines('{"path":"/kirici/a/b"}'), []);
  assert.deepEqual(
    parseMachines(
      JSON.stringify([
        { path: '/kirici/a/b', name: ' A B ' },
        { path: '/kirici/a/b', name: 'again' },
        { path: '/palet', name: 'no' },
        { path: '/kirici/c/d', name: '' },
        { path: '/kirici/c/d' },
        null,
        { path: '/kirici/e/f', name: 'E F' },
      ]),
    ),
    [
      { path: '/kirici/a/b', name: 'A B' },
      { path: '/kirici/e/f', name: 'E F' },
    ],
  );
});

test('machines: add, no repeats, remove, change notices', async () => {
  const kv = memoryKV();
  const s = createStore(kv);
  const seen: number[] = [];
  const off = s.onMachines((l) => seen.push(l.length));
  assert.deepEqual(await s.machines(), []);
  await s.addMachine({ path: '/kirici/daemo/d-75', name: 'Daemo D-75' });
  await s.addMachine({ path: '/kirici/daemo/d-75', name: 'Daemo D-75' });
  await s.addMachine({ path: '/palet', name: 'not a machine' });
  await s.addMachine({ path: '/kirici/daemo/d-100', name: 'Daemo D-100' });
  assert.deepEqual(
    (await s.machines()).map((m) => m.path),
    ['/kirici/daemo/d-75', '/kirici/daemo/d-100'],
  );
  await s.removeMachine('/kirici/daemo/d-75');
  await s.removeMachine('/kirici/none/x');
  assert.deepEqual(await s.machines(), [{ path: '/kirici/daemo/d-100', name: 'Daemo D-100' }]);
  assert.deepEqual(seen, [1, 2, 1]);
  off();
  await s.addMachine({ path: '/kirici/a/b', name: 'A B' });
  assert.deepEqual(seen, [1, 2, 1]);
  // Stored as the list itself (paths and names only).
  assert.deepEqual(JSON.parse(kv.data.get(STORE_KEYS.machines)!), [
    { path: '/kirici/daemo/d-100', name: 'Daemo D-100' },
    { path: '/kirici/a/b', name: 'A B' },
  ]);
});

test(`machines: at most ${MAX_MACHINES}`, async () => {
  const s = createStore(memoryKV());
  for (let i = 0; i < MAX_MACHINES + 5; i++)
    await s.addMachine({ path: `/kirici/m/x-${i}`, name: `X ${i}` });
  assert.equal((await s.machines()).length, MAX_MACHINES);
});

test("lang: the first run takes the phone's and saves it; a choice is kept", async () => {
  const kv = memoryKV();
  const s = createStore(kv);
  assert.equal(await s.lang('de-DE'), 'en');
  assert.equal(kv.data.get(STORE_KEYS.lang), 'en');
  assert.equal(await s.lang('tr-TR'), 'en');
  await s.setLang('tr');
  assert.equal(await s.lang('en-US'), 'tr');
  assert.equal(await createStore(memoryKV({ [STORE_KEYS.lang]: 'xx' })).lang('tr'), 'tr');
});

test('preferencesKV: the plugin is loaded once, on first use, and failures read as empty', async () => {
  const data = new Map<string, string>();
  let loads = 0;
  const kv = preferencesKV(async () => {
    loads++;
    return {
      async get({ key }) {
        return { value: data.get(key) ?? null };
      },
      async set({ key, value }) {
        data.set(key, value);
      },
      async remove({ key }) {
        data.delete(key);
      },
    };
  });
  assert.equal(loads, 0);
  const s = createStore(kv);
  assert.equal(await s.lang('tr-TR'), 'tr');
  assert.equal(data.get(STORE_KEYS.lang), 'tr');
  await s.addMachine({ path: '/kirici/a/b', name: 'B' });
  assert.deepEqual(await s.machines(), [{ path: '/kirici/a/b', name: 'B' }]);
  await kv.remove(STORE_KEYS.lang);
  assert.equal(data.has(STORE_KEYS.lang), false);
  assert.equal(loads, 1);

  let tries = 0;
  const broken = preferencesKV(async () => {
    tries++;
    throw new Error('no plugin');
  });
  assert.equal(await broken.get('k'), null);
  await broken.set('k', 'v');
  await broken.remove('k');
  assert.equal(tries, 3, 'a failed load is tried again');
});
