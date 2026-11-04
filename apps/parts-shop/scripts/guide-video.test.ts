// Guide video pipeline (scripts/guide-video.ts, spec G): the narration is the article's own text
// (no digits, units, makes or hype), the captions follow the picture frame by frame, the Azure
// key never leaks, and work files stay out of the repo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { BREAKER_BRANDS } from '@kervan/tips';
import { GUIDE_STEPS } from '../src/lib/guide-steps/index.ts';
import {
  assertAudioDir,
  assertOutsideRepo,
  findSegment,
  parseArgs,
  REPO_DIR,
} from './guide-video.ts';
import { articleTitle, narration, readGuidesTs, VLANGS } from './guide-video/narration.ts';
import {
  audioFilter,
  checkFrames,
  encodeArgs,
  FPS,
  frameCount,
  frameName,
  isoDuration,
  masterArgs,
  OUTRO_S,
  posterFrame,
  segmentDurations,
  timeline,
  timelineJson,
  vtt,
  vttTime,
} from './guide-video/timeline.ts';
import { azureTts, escapeXml, ssml } from './guide-video/tts.ts';

const KEYS = Object.keys(GUIDE_STEPS) as (keyof typeof GUIDE_STEPS)[];
const GUIDES_TS = readGuidesTs();

const UNIT = /(?<!\p{L})(mm|cm|bar|psi|kg|ton|nm|lt|dk|sn|min|sec|rpm)(?!\p{L})|°|%/iu;
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
  assert.ok(!HYPE.test(s), `${where}: hype in "${s}"`);
  for (const re of BRANDS) assert.ok(!re.test(s), `${where}: make ${re} in "${s}"`);
};

test('narration: the article title, then the sentence of every narrated step, in TR and EN', () => {
  for (const key of KEYS) {
    const n = narration(key, GUIDES_TS);
    const d = GUIDE_STEPS[key];
    for (const lang of VLANGS) {
      assert.equal(n.lines[lang].length, d.steps.length + 1);
      assert.equal(n.lines[lang][0], n.title[lang]);
      // The title is quoted verbatim from guides.ts.
      assert.ok(
        GUIDES_TS.includes(n.title[lang].replace(/'/g, "\\'")) || GUIDES_TS.includes(n.title[lang]),
      );
      d.steps.forEach((s, i) => assert.equal(n.lines[lang][i + 1], s.s[lang]));
    }
  }
  assert.equal(
    articleTitle(GUIDES_TS, 'kirici-yaglamasi-nasil-yapilir', 'tr'),
    'Hidrolik kırıcı yağlaması nasıl yapılır?',
  );
  assert.equal(
    articleTitle(GUIDES_TS, 'kirici-yaglamasi-nasil-yapilir', 'en'),
    'How to grease a hydraulic breaker',
  );
});

test('narration: no digit, unit, make or hype word in any spoken line or caption', () => {
  for (const key of KEYS) {
    const n = narration(key, GUIDES_TS);
    for (const lang of VLANGS) n.lines[lang].forEach((l, i) => clean(`${key} ${lang} #${i}`, l));
  }
});

test('segment lengths: voice + 0.8 s (step ≥ 3.1 s), silent rule, whole frames', () => {
  const lines = ['Başlık', 'A. ' + 'x'.repeat(100), 'B. kısa'];
  const voiced = segmentDurations(lines, [1.25, 4, 1]);
  assert.deepEqual(
    voiced.map((d) => Math.round(d * FPS)),
    [62, 144, 93], // 2.05 s → 62 frames; 4.8 s; max(1.8, 3.1) = 3.1 s
  );
  const silent = segmentDurations(lines, null);
  assert.equal(silent[0], 2.5);
  assert.equal(Math.round(silent[1] * FPS), Math.ceil((0.6 + 0.06 * lines[1].length) * FPS));
  assert.equal(silent[2], 3.5);
  for (const d of [...voiced, ...silent]) assert.ok(Math.abs(d * FPS - Math.round(d * FPS)) < 1e-9);
  assert.throws(() => segmentDurations(lines, [1, 2]));
});

test('VTT: back-to-back cues on the segment bounds, one per line, same times in TR and EN', () => {
  const n = narration('kirici-yaglamasi-nasil-yapilir', GUIDES_TS);
  const tl = timeline(segmentDurations(n.lines.tr, null));
  const files = VLANGS.map((lang) => vtt(n.lines[lang], tl, 'none'));
  const times = files.map((f) => [...f.matchAll(/^(\S+) --> (\S+)$/gm)].map((m) => [m[1], m[2]]));
  assert.deepEqual(times[0], times[1]);
  for (const f of files) {
    assert.ok(f.startsWith('WEBVTT\n\nNOTE tts=none\n\n'));
    const cues = f.split('\n\n').slice(2);
    assert.equal(cues.length, n.steps + 1);
    // Cue texts (time lines and numbers aside) carry no digits or makes.
    for (const c of cues) clean('vtt', c.split('\n').slice(2).join(' '));
  }
  const t = times[0];
  assert.equal(t[0][0], '00:00:00.000');
  for (let i = 1; i < t.length; i++) assert.equal(t[i][0], t[i - 1][1]);
  assert.equal(t[t.length - 1][1], vttTime(tl.total - OUTRO_S));
  assert.equal(vttTime(3723.4567), '01:02:03.457');
  assert.equal(vttTime(59.9996), '00:01:00.000');
  assert.match(vtt(['a <b> & c --> d'], timeline([1]), 'synthetic'), /a &lt;b&gt; &amp; c → d/);
  // A provider's voice name never reaches a shipped file.
  assert.throws(() => vtt(['a'], timeline([1]), 'azure:tr-TR-EmelNeural'));
  assert.throws(() => vtt(['a', 'b'], timeline([1]), 'none'));
});

test('timeline JSON: fps 30, intro, steps and outro back to back, in seconds', () => {
  const tl = timeline([2.5, 3.5, 4]);
  const j = timelineJson(tl);
  assert.deepEqual(j, {
    fps: 30,
    total: 12.5,
    intro: { start: 0, end: 2.5 },
    steps: [
      { start: 2.5, end: 6 },
      { start: 6, end: 10 },
    ],
    outro: { start: 10, end: 12.5 },
  });
  assert.deepEqual(JSON.parse(JSON.stringify(j)), j);
  // A voiced guide: every bound on a whole frame, the outro ends the video.
  const n = narration('kirici-yaglamasi-nasil-yapilir', GUIDES_TS);
  const v = timelineJson(
    timeline(
      segmentDurations(
        n.lines.tr,
        n.lines.tr.map(() => 1.234),
      ),
    ),
  );
  assert.equal(v.steps.length, n.steps);
  for (const b of [v.intro, ...v.steps, v.outro])
    for (const t of [b.start, b.end]) assert.ok(Math.abs(t * FPS - Math.round(t * FPS)) < 1e-4);
  assert.equal(v.outro.end, v.total);
  assert.equal(v.steps[0].start, v.intro.end);
});

test('frames: f_00001.png … one per timeline frame, no gap; poster in the first step', () => {
  const tl = timeline([2.5, 3.5, 4]);
  assert.equal(frameCount(tl), 375);
  assert.equal(frameName(1), 'f_00001.png');
  assert.equal(frameName(375), 'f_00375.png');
  const all = Array.from({ length: 375 }, (_, i) => frameName(i + 1));
  assert.doesNotThrow(() => checkFrames([...all, 'notes.txt'], 375));
  assert.throws(() => checkFrames(all.slice(0, 374), 375), /kare sayısı 374/);
  assert.throws(() => checkFrames([...all, frameName(376)], 375), /kare sayısı 376/);
  assert.throws(() => checkFrames([...all.slice(1), frameName(376)], 375), /kare eksik: f_00001/);
  // Middle of the first step (2.5 … 6 s → 4.25 s → frame 128), or the frame asked for.
  assert.equal(posterFrame(tl), 128);
  assert.equal(posterFrame(tl, 1), 1);
  assert.equal(posterFrame(tl, 375), 375);
  assert.throws(() => posterFrame(tl, 376), /--poster-frame/);
  assert.throws(() => posterFrame(tl, 0), /--poster-frame/);
});

test('ffmpeg: platform.md settings, never autoplay-like flags, voice padded over the outro', () => {
  const a = encodeArgs({
    framesDir: 'C:\\x\\frames',
    audio: 'n.wav',
    tts: 'synthetic',
    out: 'o.mp4',
  });
  const s = a.join(' ');
  assert.ok(s.includes('comment=tts=synthetic'));
  assert.ok(s.includes('-framerate 30 -start_number 1 -i C:/x/frames/f_%05d.png -i n.wav'));
  assert.ok(s.includes('scale=-2:720'));
  for (const x of [
    'libx264',
    '-profile:v high',
    '-crf 24',
    '-maxrate 1200k',
    '+faststart',
    '-b:a 96k',
    '-ac 1',
  ])
    assert.ok(s.includes(x), x);
  assert.ok(encodeArgs({ framesDir: 'f', audio: null, tts: 'none', out: 'o' }).includes('-an'));
  for (const x of ['autoplay', 'loop']) assert.ok(!s.includes(x));
  // The YouTube copy: 1080p, CRF 18, no bitrate cap.
  const m = masterArgs({ framesDir: 'f', audio: 'n.wav', tts: 'synthetic', out: 'm.mp4' }).join(
    ' ',
  );
  for (const x of ['scale=-2:1080', '-crf 18', 'libx264', '-profile:v high', '+faststart'])
    assert.ok(m.includes(x), x);
  assert.ok(!m.includes('-maxrate'));
  assert.ok(m.includes('comment=tts=synthetic'));
  const f = audioFilter([2, 3]);
  assert.match(f, /\[0:a\].*apad=whole_dur=2\.000000/);
  assert.match(f, /\[1:a\].*apad=whole_dur=5\.500000/);
  assert.match(
    f,
    /concat=n=2:v=0:a=1\[c\];\[c\]loudnorm=I=-16:TP=-1\.5:LRA=11,aresample=24000\[out\]$/,
  );
  assert.equal(isoDuration(72.4), 'PT1M12S');
  assert.equal(isoDuration(9), 'PT9S');
  assert.match(isoDuration(59.6), /^PT(\d+M)?\d+S$/);
});

test('Azure TTS: SSML escaped, key only in the header, errors give the HTTP status only', async () => {
  assert.equal(escapeXml(`a&b<c>"d'`), 'a&amp;b&lt;c&gt;&quot;d&apos;');
  assert.match(
    ssml('A & B', 'tr-TR-EmelNeural'),
    /xml:lang="tr-TR".*name="tr-TR-EmelNeural">A &amp; B</,
  );
  assert.throws(() => ssml('x', 'tr-TR-Emel"/><x'));
  const KEY = 'secret-key-value';
  const env = { AZURE_SPEECH_KEY: KEY, AZURE_SPEECH_REGION: 'westeurope' };
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kv-tts-')), 'a.wav');
  await assert.rejects(azureTts('x', out, { env: {} }), /AZURE_SPEECH_KEY/);
  await assert.rejects(
    azureTts('x', out, { env: { ...env, AZURE_SPEECH_REGION: 'x.evil/' } }),
    /REGION/,
  );
  let seen: { url: string; headers: Record<string, string>; body: string } | null = null;
  const err = await azureTts('x', out, {
    env,
    fetchImpl: async (url, init) => {
      seen = { url, headers: init.headers, body: init.body };
      return { ok: false, status: 401, arrayBuffer: async () => new ArrayBuffer(0) };
    },
  }).catch((e: Error) => e);
  assert.ok(err instanceof Error);
  assert.equal(err.message, 'Azure TTS: HTTP 401');
  assert.ok(!String(err.stack).includes(KEY));
  assert.equal(seen!.url, 'https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1');
  assert.equal(seen!.headers['Ocp-Apim-Subscription-Key'], KEY);
  assert.ok(!seen!.body.includes(KEY));
  const netErr = await azureTts('x', out, {
    env,
    fetchImpl: async () => {
      throw new Error(`boom ${KEY}`);
    },
  }).catch((e: Error) => e);
  assert.ok(netErr instanceof Error && !netErr.message.includes(KEY));
  const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(40)]);
  await azureTts('x', out, {
    env,
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.length),
    }),
  });
  assert.equal(fs.readFileSync(out).subarray(0, 4).toString(), 'RIFF');
});

test('arguments: work files outside the repo, SAPI never published, keys checked', () => {
  assert.throws(() => assertOutsideRepo(path.join(REPO_DIR, 'apps', 'x')), /depo içinde/);
  assert.throws(() => assertOutsideRepo(REPO_DIR), /depo içinde/);
  assert.doesNotThrow(() => assertOutsideRepo(path.join(os.tmpdir(), 'kervan-rehber-video')));
  const k = 'kirici-yaglamasi-nasil-yapilir';
  assert.equal(parseArgs(['--key', k, '--tts', 'none', '--frames-dir', 'f']).n, '01');
  assert.throws(() => parseArgs(['--key', k, '--tts', 'sapi', '--publish']), /SAPI/);
  assert.throws(() => parseArgs(['--key', 'yok', '--tts', 'none']), /anahtar/);
  assert.throws(
    () => parseArgs(['--key', k, '--tts', 'none', '--frames-dir', 'f', '--n', '1']),
    /iki haneli/,
  );
  assert.throws(() => parseArgs(['--key', k, '--tts', 'espeak']), /--tts/);
  assert.throws(() => parseArgs(['--key', k, '--tts', 'files']), /--audio-dir/);
  assert.equal(
    parseArgs(['--key', k, '--tts', 'files', '--audio-dir', 'x', '--frames-dir', 'f', '--publish'])
      .audioDir,
    'x',
  );
});

test('arguments: --timeline-out alone, a video needs --frames-dir, --poster-frame and --master', () => {
  const k = 'kirici-yaglamasi-nasil-yapilir';
  const base = ['--key', k, '--tts', 'none'];
  assert.equal(parseArgs([...base, '--timeline-out', 't.json']).timelineOut, 't.json');
  assert.equal(parseArgs([...base, '--audio-only']).framesDir, undefined);
  assert.throws(() => parseArgs(base), /--frames-dir gerekli/);
  for (const extra of [['--frames-dir', 'f'], ['--publish'], ['--master', 'm.mp4']])
    assert.throws(
      () => parseArgs([...base, '--timeline-out', 't.json', ...extra]),
      /tek başına/,
      extra.join(' '),
    );
  const v = parseArgs([...base, '--frames-dir', 'f', '--poster-frame', '42', '--master', 'yt.mp4']);
  assert.equal(v.framesDir, 'f');
  assert.equal(v.posterFrame, 42);
  assert.equal(v.master, 'yt.mp4');
  for (const bad of ['0', '-1', '1.5', 'x'])
    assert.throws(() => parseArgs([...base, '--frames-dir', 'f', '--poster-frame', bad]));
  assert.throws(() => parseArgs([...base, '--audio-only', '--poster-frame', '3']), /yalnız/);
  assert.throws(() => parseArgs([...base, '--frames-dir', 'f', '--master', 'yt.mov']), /\.mp4/);
  assert.throws(() => parseArgs([...base, '--frames-dir']), /değer ister/);
  // The Blender folders stay out of the repo, like every work file.
  assert.throws(() => assertOutsideRepo(path.join(REPO_DIR, 'frames')), /depo içinde/);
});

test('--tts files: voice folder outside the repo, never the work audio folder, one file per segment', () => {
  const work = path.join(os.tmpdir(), 'kervan-rehber-video', 'k', 'audio');
  assert.throws(() => assertAudioDir(path.join(REPO_DIR, 'apps', 'ses'), work), /depo içinde/);
  assert.throws(() => assertAudioDir(work, work), /audio klasörü/);
  assert.throws(() => assertAudioDir(path.join(work, '..', 'audio'), work), /audio klasörü/);
  if (process.platform === 'win32')
    assert.throws(() => assertAudioDir(work.toUpperCase(), work), /audio klasörü/);
  assert.doesNotThrow(() => assertAudioDir(path.join(os.tmpdir(), 'kv-ses'), work));

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kv-seg-'));
  try {
    assert.throws(() => findSegment(dir, 0), /seg-00\.wav\/\.mp3 yok/);
    fs.writeFileSync(path.join(dir, 'seg-00.mp3'), '');
    assert.equal(findSegment(dir, 0), path.join(dir, 'seg-00.mp3'));
    fs.writeFileSync(path.join(dir, 'seg-01.wav'), '');
    assert.equal(findSegment(dir, 1), path.join(dir, 'seg-01.wav'));
    fs.writeFileSync(path.join(dir, 'seg-00.wav'), '');
    assert.throws(() => findSegment(dir, 0), /hem \.wav hem \.mp3/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
