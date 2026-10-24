import { useEffect, useRef, useState } from 'react';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { LIST_PATH, partPath, type PartKey } from '../lib/routes';
import type { Lang } from '../types';
import { FOCUS } from './Layout';

/** Home opening, in the strip under the make/model finder: our parts of one breaker (rendered
 *  from our drawings, no make or model named). The breaker first stands in its housing (kabin),
 *  seen from the side; the top cover comes off and the breaker comes out through the top (the
 *  housing slides away past the tool), the cylinder (not ours) fades out, and the breaker opens
 *  into its parts, laid out side by side along its axis; then the parts are numbered like a parts
 *  catalogue. Every part (on the picture and in the numbered list) is a plain link to its page.
 *
 *  The opening plays once per session for JS visitors without reduced motion, Save-Data or a slow
 *  (2g / 3g) connection, and not on an ad click's landing (gclid / gbraid / wbraid): the inline script
 *  in index.html marks <html data-kv-open> before paint (the first frame shows instead of the
 *  final picture), this component plays the frames on a canvas once the picture is in view and
 *  removes the mark. The prerendered markup is the final, opened state. */
type Group = 'tips' | PartKey;

const BASE = '/photos/parca/acilis';
/** Final (opened) picture, `-{sm,lg}.webp`; the frames are `<BASE>-kabin-06-NN` (top cover off,
 *  housing sliding away, KABIN of them) and `<BASE>-kare-06-NN` (our parts opening, FRAMES of
 *  them). All are transparent (part, contact shadow, faint floor reflection): the stage behind
 *  them is drawn by the page per theme (globals.css `--kv-stage`). */
const FINAL = `${BASE}-acik-05`;
const KABIN = 36;
const FRAMES = 48;
/** Two sizes (the frames count against Pages' file limit): the full 2864 px render (`-lg`) and,
 *  for screens up to SMALL_MQ, a 1280 px copy (`-md`, 2026-10-22: phones fetched ~3 MB of 2864 px
 *  frames; the 1280 px set is ~1.6 MB). */
const src = (kind: 'kabin' | 'kare', i: number, size: 'md' | 'lg' = 'lg') =>
  `${BASE}-${kind}-06-${String(i).padStart(2, '0')}-${size}.webp`;
const SMALL_MQ = '(max-width: 900px)';
/** Width of the `-md` frames. */
const FRAME_MD_PX = 1280;
/** Timeline (ms): pause on the housed breaker, housing slide, cylinder fade, opening. */
const HOLD = 500;
const SLIDE = 1200;
const FADE = 350;
const OPEN = 900;
const OPEN_KEY = 'kv_open_played';
/** Width of the opening frames in their own pixels (`-lg`). */
const FRAME_PX = 2864;
/** Picture size in render pixels (the boxes and callouts below are in the same pixels). */
const W = 2864;
const H = 620;
type Box = [number, number, number, number];
/** Left to right along the breaker: group, boxes (pointer targets), callout (number position) and
 *  the point its leader line ends on. */
const SPOTS: { g: Group; boxes: Box[]; at: [number, number]; to: [number, number] }[] = [
  { g: 'akumulator', boxes: [[44, 168, 548, 392]], at: [296, 96], to: [296, 176] },
  {
    g: 'saplama',
    boxes: [
      [516, 72, 1228, 240],
      [524, 368, 1228, 560],
    ],
    at: [1290, 90],
    to: [1222, 120],
  },
  { g: 'piston', boxes: [[716, 262, 1228, 376]], at: [960, 440], to: [960, 370] },
  {
    g: 'burc',
    boxes: [
      [1220, 248, 1372, 392],
      [1828, 264, 1996, 432],
    ],
    at: [1912, 190],
    to: [1912, 266],
  },
  { g: 'alt-govde', boxes: [[1380, 232, 1792, 432]], at: [1300, 470], to: [1392, 420] },
  { g: 'kama', boxes: [[1630, 64, 1732, 250]], at: [1560, 56], to: [1630, 96] },
  {
    g: 'asinma-plakasi',
    boxes: [
      [1389, 130, 1504, 162],
      [1389, 484, 1504, 522],
      [1606, 500, 1786, 536],
      [2004, 232, 2092, 480],
    ],
    at: [2048, 570],
    to: [2048, 482],
  },
  { g: 'tips', boxes: [[2100, 288, 2828, 448]], at: [2470, 226], to: [2470, 300] },
];
/** Groups not in the picture, listed after the numbered ones. */
const EXTRA: Group[] = ['tamir-takimi'];
const GROUPS: Group[] = [...SPOTS.map((s) => s.g), ...EXTRA];

const PAD = 12;
const pct = (v: number, s: number) => `${((v / s) * 100).toFixed(3)}%`;
const boxStyle = ([x0, y0, x1, y1]: Box) => ({
  left: pct(x0 - PAD, W),
  top: pct(y0 - PAD, H),
  width: pct(x1 - x0 + 2 * PAD, W),
  height: pct(y1 - y0 + 2 * PAD, H),
});
const groupPath = (g: Group) => (g === 'tips' ? LIST_PATH : partPath(g));

/** Plays the frames on the canvas, then clears the opening mark. Safe to call when unmarked. */
function useOpening(canvas: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute('data-kv-open')) return;
    (window as unknown as { __kvOpen?: boolean }).__kvOpen = true;
    // The page shows at once; only the picture plays, at its own size and in its own place.
    const pic = canvas.current?.parentElement;
    /** Long side of the picture on screen (upright on phones), in device pixels. */
    const shown = pic
      ? Math.max(pic.offsetWidth, pic.offsetHeight) * Math.max(1, window.devicePixelRatio || 1)
      : 0;
    const small = window.matchMedia(SMALL_MQ).matches;
    const size = small ? 'md' : 'lg';
    const framePx = small ? FRAME_MD_PX : FRAME_PX;
    let cancelled = false;
    let raf = 0;
    const finish = () => {
      cancelled = true;
      root.removeAttribute('data-kv-open');
      try {
        sessionStorage.setItem(OPEN_KEY, '1');
      } catch {
        /* storage blocked: it plays again next time */
      }
    };
    // All frames in playing order, fetched in that order a few at a time; the opening starts once
    // the first START are decoded and the rest keep coming while it plays. Each frame is decoded
    // at the size it is shown (not its full 2864 px), AHEAD of the one on screen, and released
    // once passed: all of them decoded at once would take more memory than a phone gives a page.
    const urls = [
      ...Array.from({ length: KABIN }, (_, i) => src('kabin', i, size)),
      ...Array.from({ length: FRAMES }, (_, i) => src('kare', i, size)),
    ];
    const START = 10;
    const AHEAD = 12;
    const blobs: (Promise<Blob> | undefined)[] = [];
    let next = 0;
    let busy = 0;
    const pump = () => {
      while (!cancelled && busy < 4 && next < urls.length) {
        const i = next++;
        busy++;
        blobs[i] = fetch(urls[i]).then((r) => (r.ok ? r.blob() : Promise.reject(new Error())));
        blobs[i]!.then(
          () => {
            busy--;
            pump();
          },
          () => finish(),
        );
      }
    };
    const dw = Math.min(framePx, Math.ceil(shown) || framePx);
    const dh = Math.round((dw * H) / W);
    // Resizing while decoding costs more than it saves when the size shown is close to the
    // frame's own (desktop): then the frames decode as they are.
    const decode = (b: Blob) =>
      dw > framePx * 0.75
        ? createImageBitmap(b)
        : createImageBitmap(b, { resizeWidth: dw, resizeHeight: dh, resizeQuality: 'high' }).catch(
            () => createImageBitmap(b),
          );
    const bitmaps: (ImageBitmap | null | undefined)[] = [];
    const want = (i: number) => {
      for (let j = i; j < Math.min(urls.length, i + AHEAD); j++) {
        const b = blobs[j];
        if (bitmaps[j] !== undefined || !b) continue;
        bitmaps[j] = null;
        b.then(decode).then(
          (bm) => {
            if (cancelled) bm.close();
            else bitmaps[j] = bm;
          },
          () => undefined,
        );
      }
      for (let j = 0; j < i - 1; j++) {
        bitmaps[j]?.close();
        if (bitmaps[j]) bitmaps[j] = null;
      }
    };
    // A slow connection should not hold the page on the housed breaker: without a start in time
    // the final picture shows at once (counted from when the picture comes into view).
    let giveUp = 0;
    const waitStart = () => {
      if (cancelled) return;
      want(0);
      if (bitmaps.slice(0, START).every(Boolean)) play();
      else raf = requestAnimationFrame(waitStart);
    };
    const play = () => {
      window.clearTimeout(giveUp);
      const c = canvas.current;
      const ctx = c?.getContext('2d');
      const first = bitmaps[0];
      if (!c || !ctx || !first) return finish();
      c.width = first.width;
      c.height = first.height;
      ctx.drawImage(first, 0, 0);
      // The timeline's own clock: it stops while the frame due is not decoded yet (the picture
      // holds rather than jumps), and it never moves more than one frame per screen update, so a
      // slow screen plays every frame a little slower instead of skipping them.
      let clock = 0;
      let last = 0;
      let held = 0;
      let shownAt = 0;
      const at = (p: number, n: number) => Math.min(n - 1, Math.max(0, Math.floor(p * n)));
      /** Frames to draw at time t (ms), with their opacity; the cylinder fades out over FADE. */
      const frames = (t: number): [number, number][] => {
        t -= HOLD;
        if (t < SLIDE) return [[at(t / SLIDE, KABIN), 1]];
        if ((t -= SLIDE) < FADE) {
          return [
            [KABIN, 1],
            [KABIN - 1, 1 - t / FADE],
          ];
        }
        if ((t -= FADE) < OPEN) return [[KABIN + at(t / OPEN, FRAMES), 1]];
        return [[urls.length - 1, 1]];
      };
      const END = HOLD + SLIDE + FADE + OPEN;
      /** Start time (ms) of frame i; the cylinder fade starts on frame KABIN. */
      const startOf = (i: number) =>
        i < KABIN
          ? HOLD + (i * SLIDE) / KABIN
          : i === KABIN
            ? HOLD + SLIDE
            : HOLD + SLIDE + FADE + ((i - KABIN) * OPEN) / FRAMES;
      const main = (fs: [number, number][]) => Math.max(...fs.map(([i]) => i));
      const step = (now: number) => {
        if (cancelled) return;
        const dt = last ? Math.min(40, now - last) : 0;
        last = now;
        let t = Math.min(END, clock + dt);
        if (main(frames(t)) > shownAt + 1) t = startOf(shownAt + 1);
        const fs = frames(t);
        want(Math.min(...fs.map(([i]) => i)));
        if (fs.every(([i]) => bitmaps[i])) {
          clock = t;
          held = 0;
          shownAt = main(fs);
          ctx.clearRect(0, 0, c.width, c.height);
          for (const [i, a] of fs) {
            ctx.globalAlpha = a;
            ctx.drawImage(bitmaps[i]!, 0, 0, c.width, c.height);
          }
          ctx.globalAlpha = 1;
          if (t >= END) return finish();
        } else if ((held += dt) > 3000) return finish();
        raf = requestAnimationFrame(step);
      };
      root.setAttribute('data-kv-open', 'play');
      raf = requestAnimationFrame(step);
    };
    const start = () => {
      if (cancelled) return;
      pump();
      giveUp = window.setTimeout(() => finish(), 1500);
      raf = requestAnimationFrame(waitStart);
    };
    // The strip sits under the finder: the opening starts once half of it is on screen (a phone
    // scrolls down to it), so it is not played unseen.
    let io: IntersectionObserver | null = null;
    if (pic && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io?.disconnect();
            start();
          }
        },
        { threshold: 0.5 },
      );
      io.observe(pic);
    } else start();
    return () => {
      cancelled = true;
      io?.disconnect();
      bitmaps.forEach((bm) => bm?.close());
      cancelAnimationFrame(raf);
      window.clearTimeout(giveUp);
    };
  }, [canvas]);
}

export default function ExplodedPicker({ lang, t }: { lang: Lang; t: Dict }) {
  const p = t.home.pick;
  const name = (g: Group) => (g === 'tips' ? p.tips : t.parts.items[g].name);
  const [hover, setHover] = useState<Group | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useOpening(canvas);
  const lit = (g: Group) => g === hover;

  // The picture (the stage), then the numbered part list as a row of links; only the callouts on
  // the picture wait for the breaker to come apart.
  return (
    <div className="kv-pick">
      <figure className="kv-open m-0 min-w-0 overflow-hidden">
        <div className="kv-open-turn">
          <div className="kv-open-pic relative">
            <picture>
              <source media="(max-width: 1023px)" srcSet={`${FINAL}-sm.webp`} />
              <img
                src={`${FINAL}-lg.webp`}
                width={W}
                height={H}
                alt={p.alt}
                decoding="async"
                className="kv-open-final block h-auto w-full"
              />
            </picture>
            {/* The breaker in its housing, shown only while the opening is pending (lazy: never fetched
              otherwise), and the canvas the frames play on. */}
            <picture>
              <source media={SMALL_MQ} srcSet={src('kabin', 0, 'md')} />
              <img
                src={src('kabin', 0)}
                width={W}
                height={H}
                alt=""
                loading="lazy"
                decoding="async"
                className="kv-open-first absolute inset-0 h-full w-full"
              />
            </picture>
            <canvas
              ref={canvas}
              aria-hidden="true"
              className="kv-open-canvas absolute inset-0 h-full w-full"
            />

            <div className="kv-open-spots">
              <svg
                aria-hidden="true"
                viewBox={`0 0 ${W} ${H}`}
                overflow="visible"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                {SPOTS.map(({ g, at, to }, i) => (
                  <g
                    key={g}
                    className={lit(g) ? 'text-brand-hi' : 'text-ink-mid'}
                    stroke="currentColor"
                    fill="currentColor"
                  >
                    <line x1={at[0]} y1={at[1]} x2={to[0]} y2={to[1]} strokeWidth={4} />
                    <circle cx={to[0]} cy={to[1]} r={9} stroke="none" />
                    <circle
                      cx={at[0]}
                      cy={at[1]}
                      r={40}
                      strokeWidth={5}
                      className={`kv-num ${lit(g) ? 'fill-brand-hi' : 'fill-bg'}`}
                    />
                    <text
                      x={at[0]}
                      y={at[1]}
                      dy="0.36em"
                      textAnchor="middle"
                      stroke="none"
                      fontSize={46}
                      fontWeight={600}
                      className={`font-sans ${lit(g) ? 'fill-on-brand' : 'fill-ink'}`}
                    >
                      {i + 1}
                    </text>
                  </g>
                ))}
              </svg>
              {SPOTS.map(({ g, boxes }, i) => (
                <div key={g} onMouseEnter={() => setHover(g)} onMouseLeave={() => setHover(null)}>
                  {boxes.map((b, j) => (
                    <a
                      key={j}
                      href={localePath(groupPath(g), lang)}
                      // One tab stop per part: the extra boxes are pointer targets only.
                      tabIndex={j === 0 ? undefined : -1}
                      aria-hidden={j === 0 ? undefined : true}
                      aria-label={j === 0 ? `${i + 1}. ${name(g)}` : undefined}
                      onFocus={() => setHover(g)}
                      onBlur={() => setHover(null)}
                      style={boxStyle(b)}
                      className={`absolute rounded-sm border-2 ${lit(g) ? 'border-brand-hi' : 'border-transparent'} focus-visible:outline-none`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <figcaption className="mt-2 font-sans text-xs text-ink-soft">{p.caption}</figcaption>
      </figure>

      <nav aria-label={p.listLabel}>
        <ol className="m-0 flex list-none flex-wrap gap-x-1 gap-y-0 p-0 font-sans text-sm">
          {GROUPS.map((g, i) => (
            <li key={g}>
              <a
                href={localePath(groupPath(g), lang)}
                onMouseEnter={() => setHover(g)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(g)}
                onBlur={() => setHover(null)}
                className={`flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-sm px-2 sm:min-h-9 ${lit(g) ? 'text-brand-hi' : 'text-ink'} hover:underline ${FOCUS}`}
              >
                {i < SPOTS.length && (
                  <span className="tabular-nums text-xs font-semibold text-ink-mid">{i + 1}</span>
                )}
                {name(g)}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
