import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import {
  EXTRA,
  nameRows,
  OPEN_H as H,
  OPEN_W as W,
  PHONE_L,
  PHONE_NAME_X,
  PHONE_X,
  SPOTS,
  upright,
  type OpeningGroup as Group,
} from '../lib/opening';
import { LIST_PATH, partPath } from '../lib/routes';
import type { Lang } from '../types';
import { FOCUS } from './Layout';

/** Home opening, right under the header, edge to edge: our parts of one breaker (rendered from
 *  our drawings, no make or model named). The breaker first stands in its housing (kabin), seen
 *  from the side; the top cover comes off and the breaker comes out through the top (the housing
 *  slides away past the tool), the cylinder (not ours) fades out, and the breaker opens into its
 *  parts, laid out side by side along its axis. Each part group is named on the picture with a
 *  leader line (above or below it on desktop; beside it on phones, where the same picture and
 *  frames stand upright, tip down), and every name and every part is a plain link to its group.
 *  Geometry in `lib/opening.ts`.
 *
 *  The opening plays once per session for JS visitors without reduced motion, Save-Data or a slow
 *  (2g / 3g) connection, and not on an ad click's landing (gclid / gbraid / wbraid): the inline script
 *  in index.html marks <html data-kv-open> before paint (the first frame shows instead of the
 *  final picture), this component plays the frames on a canvas once the picture is in view and
 *  removes the mark. The prerendered markup is the final, opened state. */

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
/** Desktop: a name's centre sits this far (render px) above or below the picture. */
const NAME_DY = 82;
/** Pointer targets reach a little past their part. */
const PAD = 12;
const pct = (v: number, s: number) => `${((v / s) * 100).toFixed(3)}%`;
const boxStyle = ([x0, y0, x1, y1]: [number, number, number, number]) => ({
  left: pct(x0 - PAD, W),
  top: pct(y0 - PAD, H),
  width: pct(x1 - x0 + 2 * PAD, W),
  height: pct(y1 - y0 + 2 * PAD, H),
});
const groupPath = (g: Group) => (g === 'tips' ? LIST_PATH : partPath(g));
/** Phones: each name's height beside the upright breaker. */
const ROWS = nameRows();

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
    // It starts once half of the picture is on screen (a page opened scrolled down, or a short
    // window), so it is not played unseen.
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
  const light = (g: Group) => ({
    onMouseEnter: () => setHover(g),
    onMouseLeave: () => setHover(null),
  });

  // The stage (studio / night, faded edges) holds the picture box: the picture layer (turned
  // upright on phones), the leader lines and the names. Only the lines and the pointer targets
  // wait for the breaker to come apart; the names are links from the first paint.
  return (
    <section
      aria-label={p.caption}
      className="kv-open"
      style={
        {
          '--kv-l': `${PHONE_L}px`,
          '--kv-x': `${PHONE_X}px`,
          '--kv-name': `${PHONE_NAME_X}px`,
        } as CSSProperties
      }
    >
      <div className="kv-open-stage">
        <div className="kv-open-pic">
          <div className="kv-open-img">
            <picture>
              <source
                srcSet={`${FINAL}-sm.webp 1000w, ${FINAL}-lg.webp 1600w`}
                sizes={`(max-width: 767px) ${PHONE_L}px, 100vw`}
              />
              <img
                src={`${FINAL}-lg.webp`}
                width={W}
                height={H}
                alt={p.alt}
                decoding="async"
                className="kv-open-final block h-full w-full"
              />
            </picture>
            {/* The breaker in its housing, shown only while the opening is pending (lazy: never
                fetched otherwise), and the canvas the frames play on. */}
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
              {SPOTS.map(({ g, boxes }) => (
                <div key={g} {...light(g)}>
                  {boxes.map((b, j) => (
                    // Pointer targets only: the names are the links for the keyboard.
                    <a
                      key={j}
                      href={localePath(groupPath(g), lang)}
                      tabIndex={-1}
                      aria-hidden="true"
                      style={boxStyle(b)}
                      className={`absolute rounded-sm border-2 ${lit(g) ? 'border-brand-hi' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="kv-open-spots" aria-hidden="true">
            {/* Desktop: from each name, above or below the picture, to its part. */}
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              overflow="visible"
              className="kv-open-lines"
            >
              {SPOTS.map(({ g, name: n, to }) => (
                <g key={g} className={lit(g) ? 'text-brand-hi' : 'text-ink-mid'}>
                  <line
                    x1={n.x}
                    y1={n.up ? -NAME_DY : H + NAME_DY}
                    x2={to[0]}
                    y2={to[1]}
                    stroke="currentColor"
                    strokeWidth={1.25}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={to[0]} cy={to[1]} r={6.5} fill="currentColor" />
                </g>
              ))}
            </svg>
            {/* Phones: from each part of the upright picture to its name beside it. */}
            <svg className="kv-open-leads">
              {SPOTS.map(({ g, side }, i) => {
                const [x, y] = upright(side);
                return (
                  <g key={g} className={lit(g) ? 'text-brand-hi' : 'text-ink-mid'}>
                    <polyline
                      points={`${x},${y} ${PHONE_NAME_X - 11},${ROWS[i]} ${PHONE_NAME_X - 4},${ROWS[i]}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.2}
                    />
                    <circle cx={x} cy={y} r={2.6} fill="currentColor" />
                  </g>
                );
              })}
            </svg>
          </div>

          <nav aria-label={p.listLabel} className="kv-open-names">
            <ol className="m-0 list-none p-0">
              {[...SPOTS.map((s) => s.g), ...EXTRA].map((g, i) => {
                const spot = SPOTS[i];
                return (
                  <li
                    key={g}
                    className={spot ? (spot.name.up ? 'kv-up' : 'kv-dn') : 'kv-extra'}
                    style={
                      {
                        '--x': spot ? pct(spot.name.x, W) : undefined,
                        '--y': `${ROWS[i]}px`,
                      } as CSSProperties
                    }
                  >
                    <a
                      href={localePath(groupPath(g), lang)}
                      {...light(g)}
                      onFocus={() => setHover(g)}
                      onBlur={() => setHover(null)}
                      className={`inline-flex min-h-10 items-center gap-2.5 whitespace-nowrap rounded-sm font-sans font-medium hover:text-brand-hi ${lit(g) ? 'text-brand-hi' : 'text-ink'} ${FOCUS}`}
                    >
                      {spot ? (
                        <span
                          className={`kv-num ${lit(g) ? 'border-brand bg-brand text-on-brand' : 'border-ink-mid bg-bg text-ink'}`}
                        >
                          {i + 1}
                        </span>
                      ) : (
                        <span aria-hidden="true" className="kv-dash" />
                      )}
                      {name(g)}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>
      <p className="kv-open-cap m-0 font-sans text-xs text-ink-soft">
        <span>
          {p.caption}
          <span className="kv-open-click"> {p.click}</span>
        </span>
        <span className="kv-open-kit">{p.kitNotShown}</span>
      </p>
    </section>
  );
}
