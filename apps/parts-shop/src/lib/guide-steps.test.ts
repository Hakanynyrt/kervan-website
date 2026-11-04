// The guides' narrated steps and videos (owner, 2026-11-02): every step is cut from the approved
// article text, carries no figure, unit, make or new adjective, and every video entry has its files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BREAKER_BRANDS } from '@kervan/tips';
import { GUIDE_STEPS } from './guide-steps/index.ts';
import { GUIDE_VIDEOS, PART_VIDEOS, videoFiles } from './guide-videos.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..', '..');
const GUIDES_TS = fs.readFileSync(path.join(HERE, 'guides.ts'), 'utf8').replace(/\r\n/g, '\n');
// guides.ts cannot be imported here (extensionless relative imports): its keys and texts are
// read as text. TR half, then EN half; each split into one block per article key.
const KEYS = [...GUIDES_TS.matchAll(/^ {2}'([a-z-]+)',$/gm)].map((m) => m[1]);
const [TR_HALF, EN_HALF] = GUIDES_TS.split(/\n {2}en: \{\n/);
const articleBlock = (half: string, key: string): string => {
  const start = half.indexOf(`      '${key}': {`);
  assert.ok(start >= 0, `article ${key} in guides.ts`);
  const rest = half.slice(start + 1);
  const next = rest.search(/\n {6}'[a-z-]+': \{/);
  return next < 0 ? rest : rest.slice(0, next);
};

const LANGS = ['tr', 'en'] as const;
const words = (s: string, lang: 'tr' | 'en'): string[] =>
  s
    .toLocaleLowerCase(lang)
    .split(/[^\p{L}]+/u)
    .filter(Boolean);
const ALLOWED = new Set(
  've ya da de ile bu için ise the and or of to a an in on at as is are it its be by with also then'.split(
    ' ',
  ),
);
// Letter-aware edges: JS \b treats Turkish letters as non-word ("Aşınmış" would hold "nm").
const UNIT = /(?<!\p{L})(mm|cm|bar|psi|kg|ton|nm|lt|dk|sn|min|sec|rpm)(?!\p{L})|°|%/iu;
// Word roots ("zamanında" is not "anında").
const HYPE =
  /(?<!\p{L})(fırla|hızla|anında|kesinlikle|tamamen|patla|instant|rapid|explod|thrown|flies)/iu;
const BRANDS = Object.entries(BREAKER_BRANDS)
  .flatMap(([k, alts]) => [k, ...alts])
  .filter((b) => b.replace(/[^\p{L}]/gu, '').length >= 3)
  .map(
    (b) =>
      new RegExp(`(^|[^\\p{L}])${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'iu'),
  );
const clean = (where: string, s: string) => {
  assert.ok(!/\d/.test(s), `${where}: digit in "${s}"`);
  assert.ok(!UNIT.test(s), `${where}: unit in "${s}"`);
  assert.ok(!HYPE.test(s), `${where}: adjective/hype in "${s}"`);
  for (const re of BRANDS) assert.ok(!re.test(s), `${where}: make ${re} in "${s}"`);
};

test('every guide has 3 to 5 well-formed narrated steps', () => {
  assert.equal(KEYS.length, 8);
  assert.deepEqual(Object.keys(GUIDE_STEPS).sort(), [...KEYS].sort());
  for (const k of KEYS) {
    const d = GUIDE_STEPS[k as keyof typeof GUIDE_STEPS];
    assert.equal(d.key, k);
    assert.ok(d.steps.length >= 3 && d.steps.length <= 5, `${k}: step count`);
    assert.equal(new Set(d.steps.map((s) => s.id)).size, d.steps.length, `${k}: ids unique`);
    for (const s of d.steps) assert.match(s.id, /^[a-z]+(-[a-z]+)*$/, `${k}: id ${s.id}`);
  }
});

test('texts are filled, short, and free of figures, units, makes and hype', () => {
  for (const d of Object.values(GUIDE_STEPS))
    for (const lang of LANGS)
      for (const s of d.steps) {
        const w = `${d.key}/${s.id}/${lang}`;
        assert.ok(s.h[lang].length <= 40, `${w}: h longer than 40`);
        assert.ok(s.s[lang].length <= 200, `${w}: s longer than 200`);
        assert.ok(s.s[lang].endsWith('.'), `${w}: s ends with a full stop`);
        for (const [where, t] of [
          [`${w} h`, s.h[lang]],
          [`${w} s`, s.s[lang]],
        ]) {
          assert.ok(t.length > 0 && t === t.trim(), `${where}: empty or untrimmed`);
          clean(where, t);
        }
      }
});

test('every step quotes guides.ts and uses only the article’s words', () => {
  for (const d of Object.values(GUIDE_STEPS))
    for (const lang of LANGS) {
      const block = articleBlock(lang === 'tr' ? TR_HALF : EN_HALF, d.key);
      const vocab = words(block, lang);
      for (const s of d.steps) {
        const w = `${d.key}/${s.id}/${lang}`;
        assert.ok(block.includes(s.src[lang]), `${w}: src not verbatim in the article`);
        for (const x of [...words(s.h[lang], lang), ...words(s.s[lang], lang)]) {
          if (x.length < 3 || ALLOWED.has(x)) continue;
          const stem = x.slice(0, 4);
          assert.ok(
            vocab.some((v) => v.startsWith(stem)),
            `${w}: "${x}" is not in the article`,
          );
        }
      }
    }
});

test('every video entry ships its four files and stays honest', () => {
  const dir = path.join(APP, 'public', 'videos', 'rehber');
  const headers = fs.readFileSync(path.join(APP, 'public', '_headers'), 'utf8');
  const named = new Set<string>();
  for (const [key, v] of Object.entries(GUIDE_VIDEOS)) {
    if (!v) continue;
    const d = GUIDE_STEPS[key as keyof typeof GUIDE_STEPS];
    assert.ok(v.base.startsWith(`${key}-`), `${key}: base ${v.base}`);
    assert.ok(['synthetic', 'none'].includes(v.voice), `${key}: voice is only its kind`);
    assert.match(v.durationIso, /^PT(\d+M)?\d+S$/);
    assert.match(v.uploadDate, /^\d{4}-\d{2}-\d{2}$/);
    if (v.youtubeUrl)
      assert.match(v.youtubeUrl, /^https:\/\/(www\.youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}$/);
    for (const f of Object.values(videoFiles(v))) {
      const file = path.join(APP, 'public', f);
      assert.ok(fs.existsSync(file), `${key}: ${f} missing`);
      named.add(path.basename(f));
    }
    for (const lang of LANGS) {
      const f = videoFiles(v)[lang];
      assert.ok(
        new RegExp(`^${f.replace(/\./g, '\\.')}\\r?\\n\\s+Content-Type: text/vtt`, 'm').test(
          headers,
        ),
        `_headers: ${f} as text/vtt`,
      );
      const vtt = fs.readFileSync(path.join(APP, 'public', f), 'utf8');
      assert.ok(vtt.startsWith('WEBVTT'), `${f}: WEBVTT`);
      const cues = vtt.split(/\r?\n\r?\n/).filter((c) => c.includes('-->'));
      assert.equal(cues.length, d.steps.length + 1, `${f}: intro + one cue per step`);
      for (const c of cues) {
        const text = c
          .split(/\r?\n/)
          .filter((l) => !l.includes('-->') && !/^\d+$/.test(l)) // timing and cue-number lines
          .join(' ');
        clean(f, text);
      }
    }
  }
  if (fs.existsSync(dir))
    for (const f of fs.readdirSync(dir)) assert.ok(named.has(f), `videos/rehber/${f}: no entry`);
});

test('parts pages show only guide videos that exist', () => {
  const parts = [
    'alt-govde',
    'burc',
    'kama',
    'saplama',
    'piston',
    'akumulator',
    'asinma-plakasi',
    'tamir-takimi',
    'tips',
  ];
  for (const [part, keys] of Object.entries(PART_VIDEOS)) {
    assert.ok(parts.includes(part), `PART_VIDEOS: unknown page ${part}`);
    assert.ok(keys && keys.length > 0 && keys.length <= 2, `${part}: one or two videos`);
    for (const k of keys ?? []) {
      assert.ok(KEYS.includes(k), `${part}: ${k} is not a guide`);
      assert.ok(GUIDE_VIDEOS[k], `${part}: ${k} has no video`);
    }
  }
});
