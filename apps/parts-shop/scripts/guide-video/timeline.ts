/**
 * Timing of a guide video (spec G): segment lengths, the timeline JSON the Blender scene reads,
 * the PNG frame checks, the WebVTT captions and the ffmpeg arguments. Pure functions,
 * unit-tested (guide-video.test.ts). Every length is a whole number of frames, so picture, voice
 * and captions change on the same frame.
 */
export const FPS = 30;
/** Silence after each spoken line. */
export const GAP_S = 0.8;
/** Shortest step: a 600 ms move plus 2.5 s to look. */
export const MIN_STEP_S = 0.6 + 2.5;
/** Intro card without a voice, and the closing card (always silent). */
export const INTRO_SILENT_S = 2.5;
export const OUTRO_S = 2.5;
/** Without a voice: 600 ms + 60 ms a character, at least 3.5 s. */
export const silentStepS = (text: string): number => Math.max(0.6 + 0.06 * text.length, 3.5);

/** Up to a whole frame (a hair under the boundary stays on it). */
export const toFrames = (s: number): number => Math.ceil(s * FPS - 1e-6);
const frames = (s: number): number => toFrames(s) / FPS;

/**
 * Segment lengths in seconds: [intro, step 0, …]. `audio` = each spoken line's length (intro
 * first), or null without a voice; `lines` = the spoken lines (for the silent rule).
 */
export function segmentDurations(
  lines: readonly string[],
  audio: readonly number[] | null,
): number[] {
  if (audio && audio.length !== lines.length) throw new Error('one audio length per line');
  return lines.map((line, i) => {
    if (i === 0) return frames(audio ? audio[0] + GAP_S : INTRO_SILENT_S);
    return frames(audio ? Math.max(audio[i] + GAP_S, MIN_STEP_S) : silentStepS(line));
  });
}

export interface Span {
  start: number;
  dur: number;
}
export interface Timeline {
  /** [intro, step 0, …] */
  segments: Span[];
  outro: Span;
  total: number;
}

export function timeline(durs: readonly number[]): Timeline {
  let at = 0;
  const segments = durs.map((dur) => {
    const s = { start: at, dur };
    at += dur;
    return s;
  });
  const outro = { start: at, dur: OUTRO_S };
  return { segments, outro, total: at + OUTRO_S };
}

/** The timeline the Blender scene places its events by (--timeline-out), in seconds. */
export interface TimelineJson {
  fps: number;
  total: number;
  intro: { start: number; end: number };
  steps: { start: number; end: number }[];
  outro: { start: number; end: number };
}

const r6 = (x: number) => Math.round(x * 1e6) / 1e6;
const span = (s: Span) => ({ start: r6(s.start), end: r6(s.start + s.dur) });

export function timelineJson(tl: Timeline): TimelineJson {
  return {
    fps: FPS,
    total: r6(tl.total),
    intro: span(tl.segments[0]),
    steps: tl.segments.slice(1).map(span),
    outro: span(tl.outro),
  };
}

/** Frames the Blender render must deliver: f_00001.png … f_<n>.png. */
export const frameCount = (tl: Timeline): number => Math.round(tl.total * FPS);
export const frameName = (i: number): string => `f_${String(i).padStart(5, '0')}.png`;
export const FRAME_PATTERN = 'f_%05d.png';

/**
 * The PNGs of a frame folder: exactly f_00001.png … f_<expected>.png, no gap, none extra (a
 * render made for another timeline is refused, not stretched).
 */
export function checkFrames(names: readonly string[], expected: number): void {
  const nums = names
    .filter((n) => /^f_\d{5}\.png$/i.test(n))
    .map((n) => Number(n.slice(2, 7)))
    .sort((a, b) => a - b);
  if (nums.length !== expected)
    throw new Error(`kare sayısı ${nums.length}, zaman çizelgesi ${expected} kare ister`);
  nums.forEach((n, i) => {
    if (n !== i + 1) throw new Error(`kare eksik: ${frameName(i + 1)}`);
  });
}

/** The poster: frame N (1-based) if given, else the frame in the middle of the first step. */
export function posterFrame(tl: Timeline, n?: number): number {
  const count = frameCount(tl);
  if (n !== undefined) {
    if (!Number.isInteger(n) || n < 1 || n > count)
      throw new Error(`--poster-frame 1…${count} arası olmalı`);
    return n;
  }
  const first = tl.segments[1] ?? tl.segments[0];
  return Math.min(count, Math.floor((first.start + first.dur / 2) * FPS) + 1);
}

/** WebVTT time: hh:mm:ss.mmm */
export function vttTime(sec: number): string {
  const ms = Math.round(sec * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3_600_000))}:${p(Math.floor(ms / 60_000) % 60)}:${p(Math.floor(ms / 1000) % 60)}.${p(ms % 1000, 3)}`;
}

const vttText = (s: string) =>
  s.replace(/-->/g, '→').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Captions: one cue per segment (intro = title, then each step's sentence), same times in TR and EN. */
export function vtt(lines: readonly string[], tl: Timeline, tts: string): string {
  if (lines.length !== tl.segments.length) throw new Error('one line per segment');
  // Only the kind of voice ships, never a provider's voice name.
  if (tts !== 'synthetic' && tts !== 'none') throw new Error('bad tts tag');
  const cues = lines.map((line, i) => {
    const { start, dur } = tl.segments[i];
    return `${i + 1}\n${vttTime(start)} --> ${vttTime(start + dur)}\n${vttText(line)}`;
  });
  return `WEBVTT\n\nNOTE tts=${tts}\n\n${cues.join('\n\n')}\n`;
}

/** ISO 8601 duration for JSON-LD, whole seconds: 72.4 → PT1M12S. */
export function isoDuration(sec: number): string {
  const s = Math.max(1, Math.round(sec));
  const m = Math.floor(s / 60);
  return `PT${m ? `${m}M` : ''}${s % 60}S`;
}

/**
 * The voice track: each wav padded with silence to its segment (the last also over the closing
 * card), joined. Inputs 0..n-1 are the wavs.
 */
export function audioFilter(durs: readonly number[]): string {
  const n = durs.length;
  const parts = durs.map((d, i) => {
    const whole = i === n - 1 ? d + OUTRO_S : d;
    return `[${i}:a]aresample=24000,aformat=sample_fmts=s16:channel_layouts=mono,apad=whole_dur=${whole.toFixed(6)},atrim=duration=${whole.toFixed(6)}[a${i}]`;
  });
  const ins = durs.map((_, i) => `[a${i}]`).join('');
  // One loudness for every video (owner, 2026-11-04: voices came out at -26…-16 LUFS): -16 LUFS,
  // the usual level for web and YouTube speech, then back to the track's own rate.
  return `${parts.join(';')};${ins}concat=n=${n}:v=0:a=1[c];[c]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=24000[out]`;
}

const frameInput = (framesDir: string) => [
  '-framerate',
  String(FPS),
  '-start_number',
  '1',
  '-i',
  `${framesDir.replace(/\\/g, '/')}/${FRAME_PATTERN}`,
];

/** platform.md encoding settings: 1280×720 H.264 High, CRF 24 ≤ 1.2 Mb/s, 30 fps, AAC 96k mono. */
export function encodeArgs(o: {
  framesDir: string;
  audio: string | null;
  tts: string;
  out: string;
}): string[] {
  return [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    ...frameInput(o.framesDir),
    ...(o.audio ? ['-i', o.audio] : []),
    '-vf',
    'scale=-2:720:flags=lanczos,format=yuv420p',
    '-r',
    String(FPS),
    '-c:v',
    'libx264',
    '-profile:v',
    'high',
    '-preset',
    'slow',
    '-crf',
    '24',
    '-maxrate',
    '1200k',
    '-bufsize',
    '2400k',
    ...(o.audio ? ['-c:a', 'aac', '-b:a', '96k', '-ac', '1', '-shortest'] : ['-an']),
    '-movflags',
    '+faststart',
    '-metadata',
    `comment=tts=${o.tts}`,
    o.out,
  ];
}

/** The YouTube copy (--master, outside the repo): 1920×1080 H.264 High, CRF 18, AAC 192k. */
export function masterArgs(o: {
  framesDir: string;
  audio: string | null;
  tts: string;
  out: string;
}): string[] {
  return [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    ...frameInput(o.framesDir),
    ...(o.audio ? ['-i', o.audio] : []),
    '-vf',
    'scale=-2:1080:flags=lanczos,format=yuv420p',
    '-r',
    String(FPS),
    '-c:v',
    'libx264',
    '-profile:v',
    'high',
    '-preset',
    'slow',
    '-crf',
    '18',
    ...(o.audio ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : ['-an']),
    '-movflags',
    '+faststart',
    '-metadata',
    `comment=tts=${o.tts}`,
    o.out,
  ];
}

/** Largest mp4 the script accepts (spec G: 8 MB). */
export const MP4_BUDGET = 8 * 1024 * 1024;
