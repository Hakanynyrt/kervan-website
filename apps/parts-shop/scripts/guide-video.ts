/**
 * A guide's narrated video (owner, 2026-11-02; spec G): 3B pictures rendered in Blender outside
 * the repo (C:\kervan\araclar\rehber-3b) as a 30 fps PNG sequence, a synthetic Turkish
 * voice-over, TR + EN WebVTT captions, H.264 per platform.md.
 *
 *   node --experimental-strip-types --no-warnings scripts/guide-video.ts  *     --key <guide key> --tts azure|sapi|files|none [--voice tr-TR-EmelNeural] [--sapi-voice Tolga]
 *     [--audio-dir <dir with seg-00.* … one file per narration line>]
 *     [--timeline-out <file.json>] [--frames-dir <dir of f_00001.png …>] [--poster-frame N]
 *     [--master <file.mp4>] [--n 01] [--out <dir outside the repo>] [--audio-only] [--print]
 *     [--publish]
 *
 * Two runs: first --timeline-out (voice → timing JSON for the Blender scene; then stops), then
 * after the render --frames-dir (same voice → mp4, poster, captions).
 * --print         prints the narration (TR spoken, EN captions) and stops.
 * --audio-only    voice + captions only, e.g. to listen to a trial voice.
 * --timeline-out  writes {fps, total, intro:{start,end}, steps:[{start,end}], outro:{start,end}}
 *                 (seconds) after the voice and stops; outside the repo.
 * --frames-dir    the Blender render: exactly f_00001.png … one per frame of the timeline (any
 *                 size, e.g. 1920×1080; scaled to 720p); outside the repo.
 * --poster-frame  the poster's frame number (1-based); default the middle of the first step.
 * --master        also a 1920×1080 CRF 18 copy for YouTube, at this path outside the repo.
 * --tts files     uses ready-made voice files (e.g. made in a TTS web app from --print's lines):
 *                 seg-00 is the intro, seg-01… the steps; wav or mp3; outside the repo.
 * --publish       (azure, files or none) copies the four files to public/videos/rehber/<key>-NN.*,
 *                 refuses to overwrite, and prints the GUIDE_VIDEOS entry and the _headers lines
 *                 to add by hand.
 * Work files go to <tmp>/kervan-rehber-video/<key>/ (never into the repo). Azure needs
 * AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in the environment; they are never printed.
 * The words come from the article only (scripts/guide-video/narration.ts).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { APP_DIR, isGuideKey, narration, narrationText, VLANGS } from './guide-video/narration.ts';
import {
  audioFilter,
  checkFrames,
  encodeArgs,
  frameCount,
  frameName,
  isoDuration,
  masterArgs,
  MP4_BUDGET,
  posterFrame,
  segmentDurations,
  timeline,
  timelineJson,
  vtt,
} from './guide-video/timeline.ts';
import { azureTts, DEFAULT_AZURE_VOICE, sapiTts } from './guide-video/tts.ts';

export const REPO_DIR = path.resolve(APP_DIR, '..', '..');

/** Work files must stay out of the repo (public repo; videos enter it only by --publish). */
export function assertOutsideRepo(dir: string, repo: string = REPO_DIR): void {
  const norm = (p: string) => {
    const r = path.resolve(p);
    return process.platform === 'win32' ? r.toLowerCase() : r;
  };
  const rel = path.relative(norm(repo), norm(dir));
  if (!rel || (!rel.startsWith('..') && !path.isAbsolute(rel)))
    throw new Error(`Çıktı klasörü depo içinde olamaz: ${dir}`);
}

type Tts = 'azure' | 'sapi' | 'files' | 'none';
interface Args {
  key: string;
  tts: Tts;
  voice: string;
  sapiVoice?: string;
  audioDir?: string;
  n: string;
  out?: string;
  timelineOut?: string;
  framesDir?: string;
  posterFrame?: number;
  master?: string;
  audioOnly: boolean;
  print: boolean;
  publish: boolean;
}

export function parseArgs(argv: readonly string[]): Args {
  const a: Partial<Args> = { voice: DEFAULT_AZURE_VOICE, n: '01' };
  const flags = { audioOnly: false, print: false, publish: false };
  for (let i = 0; i < argv.length; i++) {
    const f = argv[i];
    const val = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(`${f} bir değer ister`);
      return v;
    };
    if (f === '--key') a.key = val();
    else if (f === '--tts') a.tts = val() as Tts;
    else if (f === '--voice') a.voice = val();
    else if (f === '--sapi-voice') a.sapiVoice = val();
    else if (f === '--audio-dir') a.audioDir = val();
    else if (f === '--n') a.n = val();
    else if (f === '--out') a.out = val();
    else if (f === '--timeline-out') a.timelineOut = val();
    else if (f === '--frames-dir') a.framesDir = val();
    else if (f === '--master') a.master = val();
    else if (f === '--poster-frame') {
      const v = val();
      if (!/^[1-9]\d*$/.test(v)) throw new Error('--poster-frame pozitif bir tam sayı ister');
      a.posterFrame = Number(v);
    } else if (f === '--audio-only') flags.audioOnly = true;
    else if (f === '--print') flags.print = true;
    else if (f === '--publish') flags.publish = true;
    else throw new Error(`Bilinmeyen seçenek: ${f}`);
  }
  if (!a.key || !isGuideKey(a.key)) throw new Error(`--key bir rehber anahtarı olmalı: ${a.key}`);
  if (!flags.print && !['azure', 'sapi', 'files', 'none'].includes(a.tts ?? ''))
    throw new Error('--tts azure|sapi|files|none gerekli');
  if (a.tts === 'files' && !a.audioDir) throw new Error('--tts files, --audio-dir ister');
  if (!/^\d{2}$/.test(a.n!)) throw new Error('--n iki haneli olmalı (01, 02…)');
  if (flags.publish && a.tts === 'sapi')
    throw new Error('SAPI sesi yalnız denemedir; --publish ile kullanılamaz');
  if (flags.publish && flags.audioOnly) throw new Error('--publish tam video ister');
  const video = !flags.print && !flags.audioOnly && !a.timelineOut;
  if (a.timelineOut && (a.framesDir || flags.publish || a.master || flags.audioOnly))
    throw new Error('--timeline-out tek başına çalışır (önce zaman çizelgesi, sonra kareler)');
  if (video && !a.framesDir)
    throw new Error('--frames-dir gerekli (Blender kareleri), ya da --timeline-out / --audio-only');
  if (!video && (a.posterFrame !== undefined || a.master))
    throw new Error('--poster-frame ve --master yalnız --frames-dir ile');
  if (a.master && !/\.mp4$/i.test(a.master)) throw new Error('--master bir .mp4 dosya yolu ister');
  return { ...(a as Args), tts: a.tts ?? 'none', ...flags };
}

/** `seg-NN.wav` or `seg-NN.mp3` in the ready-made voice folder (--tts files); both at once is
 *  an error (which one is meant is not guessed). */
export function findSegment(dir: string, i: number): string {
  const stem = `seg-${String(i).padStart(2, '0')}`;
  const found = ['.wav', '.mp3']
    .map((ext) => path.join(dir, stem + ext))
    .filter((f) => fs.existsSync(f));
  if (found.length > 1) throw new Error(`${stem} hem .wav hem .mp3 olarak var: ${dir}`);
  if (!found.length) throw new Error(`${stem}.wav/.mp3 yok: ${dir}`);
  return found[0];
}

const samePath = (a: string, b: string) => {
  const norm = (p: string) => {
    const r = path.resolve(p);
    return process.platform === 'win32' ? r.toLowerCase() : r;
  };
  return norm(a) === norm(b);
};

/** --tts files: the voice folder stays out of the repo and is not the folder the converted
 *  wavs are written to (ffmpeg would read and write the same file). */
export function assertAudioDir(audioDir: string, workAudio: string, repo: string = REPO_DIR): void {
  assertOutsideRepo(audioDir, repo);
  if (samePath(audioDir, workAudio))
    throw new Error(`--audio-dir çalışma klasörünün audio klasörü olamaz: ${audioDir}`);
}

const ffprobeDuration = (file: string): number =>
  Number(
    execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file],
      { encoding: 'utf8' },
    ).trim(),
  );
const ffmpeg = (args: string[], cwd?: string) =>
  execFileSync('ffmpeg', args, { cwd, stdio: ['ignore', 'ignore', 'inherit'] });

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const key = args.key as Parameters<typeof narration>[0];
  const nar = narration(key);
  if (args.print) {
    process.stdout.write(narrationText(nar));
    return;
  }
  const base = `${key}-${args.n}`;
  const out = path.resolve(args.out ?? path.join(os.tmpdir(), 'kervan-rehber-video', key));
  assertOutsideRepo(out);
  const audioDir = path.join(out, 'audio');
  if (args.tts === 'files') assertAudioDir(args.audioDir!, audioDir);
  // The timing file, the Blender frames and the YouTube copy stay out of the repo too.
  for (const p of [args.timelineOut, args.framesDir, args.master]) if (p) assertOutsideRepo(p);
  if (args.framesDir && !fs.existsSync(args.framesDir))
    throw new Error(`--frames-dir yok: ${args.framesDir}`);
  fs.mkdirSync(audioDir, { recursive: true });
  fs.writeFileSync(path.join(out, `${base}.anlatim.txt`), narrationText(nar), 'utf8');

  // 1. Voice: one wav per line (intro, steps), Turkish.
  let tts = 'none';
  let wavs: string[] | null = null;
  if (args.tts !== 'none') {
    wavs = [];
    for (const [i, line] of nar.lines.tr.entries()) {
      const wav = path.join(audioDir, `seg-${String(i).padStart(2, '0')}.wav`);
      if (args.tts === 'azure') {
        await azureTts(line, wav, { voice: args.voice });
        tts = `azure:${args.voice}`;
      } else if (args.tts === 'files') {
        const src = findSegment(args.audioDir!, i);
        ffmpeg([
          '-y',
          '-hide_banner',
          '-loglevel',
          'error',
          '-i',
          src,
          '-ac',
          '1',
          '-ar',
          '48000',
          wav,
        ]);
        tts = 'files';
      } else tts = `sapi:${sapiTts(line, wav, args.sapiVoice)}`;
      wavs.push(wav);
    }
  }

  // What ships says only that the voice is synthetic (VTT NOTE, mp4 comment, guide-videos.ts):
  // the provider's voice name stays in the working folder outside the repo.
  const voiceTag = tts === 'none' ? 'none' : 'synthetic';
  fs.writeFileSync(path.join(out, `${base}.ses.txt`), `${tts}\n`, 'utf8');

  // 2. Timing, captions, voice track.
  const durs = segmentDurations(nar.lines.tr, wavs ? wavs.map(ffprobeDuration) : null);
  const tl = timeline(durs);
  for (const lang of VLANGS)
    fs.writeFileSync(
      path.join(out, `${base}.${lang}.vtt`),
      vtt(nar.lines[lang], tl, voiceTag),
      'utf8',
    );
  let audio: string | null = null;
  if (wavs) {
    audio = path.join(out, 'narration.wav');
    ffmpeg([
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      ...wavs.flatMap((w) => ['-i', w]),
      '-filter_complex',
      audioFilter(durs),
      '-map',
      '[out]',
      audio,
    ]);
  }
  // The timing the Blender scene reads (also kept next to the video).
  const tlJson = `${JSON.stringify(timelineJson(tl), null, 2)}
`;
  fs.writeFileSync(path.join(out, `${base}.timeline.json`), tlJson, 'utf8');
  if (args.timelineOut) {
    fs.mkdirSync(path.dirname(path.resolve(args.timelineOut)), { recursive: true });
    fs.writeFileSync(args.timelineOut, tlJson, 'utf8');
    console.log(
      `zaman çizelgesi: ${tl.total.toFixed(2)} s, ${frameCount(tl)} kare, ses ${tts} → ${args.timelineOut}`,
    );
    return;
  }
  if (args.audioOnly) {
    console.log(`ses: ${tts}, süre ${tl.total.toFixed(1)} s → ${out}`);
    return;
  }

  // 3. Pictures (the Blender PNG frames) and encoding.
  const framesDir = path.resolve(args.framesDir!);
  checkFrames(fs.readdirSync(framesDir), frameCount(tl));
  const mp4 = path.join(out, `${base}.mp4`);
  ffmpeg(encodeArgs({ framesDir, audio, tts: voiceTag, out: mp4 }));
  const jpg = path.join(out, `${base}.jpg`);
  ffmpeg([
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    path.join(framesDir, frameName(posterFrame(tl, args.posterFrame))),
    '-vf',
    'scale=-2:720:flags=lanczos',
    '-q:v',
    '3',
    jpg,
  ]);
  if (args.master) {
    fs.mkdirSync(path.dirname(path.resolve(args.master)), { recursive: true });
    ffmpeg(masterArgs({ framesDir, audio, tts: voiceTag, out: path.resolve(args.master) }));
    console.log(`YouTube kopyası (1080p) → ${args.master}`);
  }
  const size = fs.statSync(mp4).size;
  const dur = ffprobeDuration(mp4);
  console.log(
    `video: ${dur.toFixed(1)} s, mp4 ${(size / 1048576).toFixed(2)} MB, jpg ${(fs.statSync(jpg).size / 1024).toFixed(0)} KB, ses ${tts} → ${out}`,
  );
  if (size > MP4_BUDGET) throw new Error('mp4 8 MB bütçesini aşıyor');

  // 4. Publish: the four files into the repo, never over an existing name.
  if (args.publish) {
    const pub = path.join(APP_DIR, 'public', 'videos', 'rehber');
    fs.mkdirSync(pub, { recursive: true });
    const names = [`${base}.mp4`, `${base}.jpg`, `${base}.tr.vtt`, `${base}.en.vtt`];
    for (const f of names)
      if (fs.existsSync(path.join(pub, f)))
        throw new Error(`${f} zaten var: değişen video yeni bir --n alır`);
    for (const f of names) fs.copyFileSync(path.join(out, f), path.join(pub, f));
    const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
    console.log(`\nsrc/lib/guide-videos.ts GUIDE_VIDEOS içine ekleyin:
  '${key}': {
    base: '${base}',
    w: 1280,
    h: 720,
    durationIso: '${isoDuration(dur)}',
    uploadDate: '${day}',
    voice: '${voiceTag}',
  },

public/_headers içine ekleyin:
/videos/rehber/${base}.tr.vtt
  Content-Type: text/vtt; charset=utf-8
/videos/rehber/${base}.en.vtt
  Content-Type: text/vtt; charset=utf-8`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename ?? '')) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : 'hata');
    process.exit(1);
  });
}
