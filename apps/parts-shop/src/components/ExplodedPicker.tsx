import { useEffect, useRef, useState } from 'react';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { LIST_PATH, partPath, type PartKey } from '../lib/routes';
import type { Lang } from '../types';
import { FOCUS } from './Layout';

/** Home opening: our parts of one breaker (rendered from our drawings, no make or model named).
 *  The breaker first stands in its housing (kabin), seen from the side; the top cover comes off and
 *  the breaker comes out through the top (the housing slides away past the tool), the cylinder
 *  (not ours) fades out, and the breaker opens into its parts, laid out
 *  side by side along its axis; then the parts are numbered like a parts catalogue. Picking a part
 *  (on the picture or in the list) points the make/model search below at that part's page; without
 *  JS every part is a plain link to its page.
 *
 *  The opening plays once per session for JS visitors without reduced motion: the inline script
 *  in index.html marks <html data-kv-open> before paint (the first frame shows instead of the
 *  final picture), this component plays the frames on a canvas and removes the mark. The
 *  prerendered markup is the final, opened state. */
type Group = 'tips' | PartKey;

const BASE = '/photos/parca/acilis';
/** Final (opened) picture, `-{sm,lg}.webp`; the frames are `<BASE>-kabin-05-NN` (top cover off,
 *  housing sliding away, KABIN of them) and `<BASE>-kare-05-NN` (our parts opening, FRAMES of
 *  them). All are transparent (part, contact shadow, faint floor reflection): the stage behind
 *  them is drawn by the page per theme (globals.css `--kv-stage`). */
const FINAL = `${BASE}-acik-04`;
const KABIN = 36;
const FRAMES = 48;
/** One size only (the full 2864 px render) for every screen: the frames count against Pages'
 *  file limit. */
const src = (kind: 'kabin' | 'kare', i: number) =>
  `${BASE}-${kind}-05-${String(i).padStart(2, '0')}-lg.webp`;
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
  { g: 'akumulator', boxes: [[58, 186, 472, 374]], at: [200, 96], to: [200, 196] },
  {
    g: 'saplama',
    boxes: [
      [516, 90, 1144, 198],
      [528, 404, 1148, 540],
    ],
    at: [830, 42],
    to: [830, 116],
  },
  { g: 'piston', boxes: [[684, 272, 1114, 344]], at: [900, 236], to: [900, 280] },
  {
    g: 'burc',
    boxes: [
      [1164, 272, 1264, 366],
      [1750, 288, 1888, 402],
    ],
    at: [1819, 222],
    to: [1819, 292],
  },
  { g: 'alt-govde', boxes: [[1306, 230, 1696, 436]], at: [1250, 196], to: [1318, 244] },
  { g: 'kama', boxes: [[1534, 70, 1586, 238]], at: [1652, 56], to: [1586, 88] },
  {
    g: 'asinma-plakasi',
    boxes: [
      [1344, 496, 1700, 556],
      [1344, 116, 1706, 156],
      [1948, 254, 1984, 446],
    ],
    at: [1764, 572],
    to: [1700, 534],
  },
  { g: 'tips', boxes: [[2050, 316, 2806, 418]], at: [2430, 254], to: [2430, 330] },
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
    // Only the breaker shows while the opening plays, at its own size and in its own place (CSS
    // hides the rest of the page and fades it in around the picture when the mark goes).
    const pic = canvas.current?.parentElement;
    /** Long side of the picture on screen (upright on phones), in device pixels. */
    const shown = pic
      ? Math.max(pic.offsetWidth, pic.offsetHeight) * Math.max(1, window.devicePixelRatio || 1)
      : 0;
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
      ...Array.from({ length: KABIN }, (_, i) => src('kabin', i)),
      ...Array.from({ length: FRAMES }, (_, i) => src('kare', i)),
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
    pump();
    const dw = Math.min(FRAME_PX, Math.ceil(shown) || FRAME_PX);
    const dh = Math.round((dw * H) / W);
    // Resizing while decoding costs more than it saves when the size shown is close to the
    // frame's own (desktop): then the frames decode as they are.
    const decode = (b: Blob) =>
      dw > FRAME_PX * 0.75
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
    // the final picture shows at once.
    const giveUp = window.setTimeout(() => finish(), 1500);
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
    raf = requestAnimationFrame(waitStart);
    return () => {
      cancelled = true;
      bitmaps.forEach((bm) => bm?.close());
      cancelAnimationFrame(raf);
      window.clearTimeout(giveUp);
    };
  }, [canvas]);
}

export default function ExplodedPicker({ lang, t }: { lang: Lang; t: Dict }) {
  const p = t.home.pick;
  const name = (g: Group) => (g === 'tips' ? p.tips : t.parts.items[g].name);
  const [sel, setSel] = useState<Group>('tips');
  const [hover, setHover] = useState<Group | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useOpening(canvas);

  const pick = (g: Group) => (e: React.MouseEvent) => {
    // Plain clicks pick the part; modified clicks (new tab) keep the link.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setSel(g);
    input.current?.focus();
  };
  const lit = (g: Group) => g === sel || g === hover;

  // Picture (full width), the numbered part list as a wrapping row of chips, then the search;
  // the list and search fade in around the picture once the breaker has come apart.
  return (
    <div className="kv-pick">
      <figure className="kv-open m-0 min-w-0 overflow-hidden">
        {/* Phones turn the picture upright, tip down (CSS `.kv-open-turn`). */}
        <div className="kv-open-turn">
          <div className="kv-open-pic relative">
            <picture>
              <source media="(max-width: 1023px)" srcSet={`${FINAL}-sm.webp`} />
              <img
                src={`${FINAL}-lg.webp`}
                width={W}
                height={H}
                alt={p.alt}
                fetchPriority="high"
                decoding="async"
                className="kv-open-final block h-auto w-full"
              />
            </picture>
            {/* The breaker in its housing, shown only while the opening is pending (lazy: never fetched
              otherwise), and the canvas the frames play on. */}
            <img
              src={src('kabin', 0)}
              width={W}
              height={H}
              alt=""
              loading="lazy"
              decoding="async"
              className="kv-open-first absolute inset-0 h-full w-full"
            />
            <canvas
              ref={canvas}
              aria-hidden="true"
              className="kv-open-canvas absolute inset-0 h-full w-full"
            />

            <div className="kv-open-spots">
              <svg
                aria-hidden="true"
                viewBox={`0 0 ${W} ${H}`}
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                {SPOTS.map(({ g, at, to }, i) => (
                  <g
                    key={g}
                    className={lit(g) ? 'text-brand-hi' : 'text-ink-mid'}
                    stroke="currentColor"
                    fill="currentColor"
                  >
                    <line x1={at[0]} y1={at[1]} x2={to[0]} y2={to[1]} strokeWidth={3} />
                    <circle cx={to[0]} cy={to[1]} r={7} stroke="none" />
                    <circle
                      cx={at[0]}
                      cy={at[1]}
                      r={30}
                      strokeWidth={4}
                      className={`kv-num ${lit(g) ? 'fill-brand-hi' : 'fill-bg'}`}
                    />
                    <text
                      x={at[0]}
                      y={at[1]}
                      dy="0.36em"
                      textAnchor="middle"
                      stroke="none"
                      fontSize={34}
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
                      onClick={pick(g)}
                      // One tab stop per part: the extra boxes are pointer targets only.
                      tabIndex={j === 0 ? undefined : -1}
                      aria-hidden={j === 0 ? undefined : true}
                      aria-label={j === 0 ? `${i + 1}. ${name(g)}` : undefined}
                      aria-current={j === 0 && g === sel ? 'true' : undefined}
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

      <nav aria-label={p.listLabel} className="kv-pick-side">
        <ol className="m-0 flex list-none flex-wrap gap-2 p-0 font-sans text-sm">
          {GROUPS.map((g, i) => (
            <li key={g}>
              <a
                href={localePath(groupPath(g), lang)}
                onClick={pick(g)}
                onMouseEnter={() => setHover(g)}
                onMouseLeave={() => setHover(null)}
                aria-current={g === sel ? 'true' : undefined}
                className={`flex h-full items-center gap-2 rounded-sm border px-3 py-2 whitespace-nowrap sm:py-1.5 ${g === sel ? 'border-brand bg-brand text-on-brand' : 'border-hair bg-bg text-ink hover:border-hair-strong'} ${FOCUS}`}
              >
                {i < SPOTS.length && (
                  <span className="tabular-nums text-xs opacity-75">{i + 1}</span>
                )}
                {name(g)}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <form
        action={localePath(groupPath(sel), lang)}
        method="get"
        role="search"
        className="min-w-0 rounded-md border border-hair bg-bg p-4 md:p-5"
      >
        <label htmlFor="pick-q" className="block font-sans text-base font-semibold text-ink">
          {p.label(name(sel))}
        </label>
        <div className="mt-3 flex gap-2">
          <input
            ref={input}
            id="pick-q"
            name="q"
            type="search"
            placeholder={t.search.placeholder}
            autoComplete="off"
            className={`min-w-0 flex-1 rounded-sm border border-ink-soft bg-bg px-4 py-3 font-sans text-base text-ink placeholder:text-ink-soft ${FOCUS}`}
          />
          <button
            type="submit"
            className={`rounded-sm bg-brand px-5 py-3 font-sans text-sm font-medium text-on-brand hover:bg-brand-hi ${FOCUS}`}
          >
            {t.search.button}
          </button>
        </div>
        <p className="m-0 mt-3 font-sans text-sm">
          <a
            href={localePath(groupPath(sel), lang)}
            className={`font-medium text-brand-hi hover:underline ${FOCUS}`}
          >
            {p.open(name(sel))} →
          </a>
        </p>
      </form>
    </div>
  );
}
