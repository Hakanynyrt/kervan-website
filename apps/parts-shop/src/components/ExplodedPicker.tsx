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
/** Final (opened) picture; the frames are `<BASE>-kabin-01-NN` (top cover off, housing sliding
 *  away, KABIN of them) and `<BASE>-kare-01-NN` (our parts opening, FRAMES of them), `-{sm,lg}.webp`. */
const FINAL = `${BASE}-acik-01`;
const KABIN = 36;
const FRAMES = 48;
/** One size only (1600 px) for every screen: the frames count against Pages' file limit. */
const src = (kind: 'kabin' | 'kare', i: number) =>
  `${BASE}-${kind}-01-${String(i).padStart(2, '0')}-lg.webp`;
/** Timeline (ms): pause on the housed breaker, housing slide, cylinder fade, opening. */
const HOLD = 500;
const SLIDE = 1200;
const FADE = 350;
const OPEN = 900;
const OPEN_KEY = 'kv_open_played';

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
    let cancelled = false;
    let raf = 0;
    const finish = () => {
      root.removeAttribute('data-kv-open');
      try {
        sessionStorage.setItem(OPEN_KEY, '1');
      } catch {
        /* storage blocked: it plays again next time */
      }
    };
    const load = (kind: 'kabin' | 'kare', n: number) =>
      Array.from({ length: n }, (_, i) => {
        const im = new Image();
        im.src = src(kind, i);
        return im;
      });
    const kabin = load('kabin', KABIN);
    const kare = load('kare', FRAMES);
    const imgs = [...kabin, ...kare];
    // A slow connection should not hold the page on the assembled picture.
    const giveUp = window.setTimeout(() => {
      cancelled = true;
      finish();
    }, 5000);
    Promise.all(imgs.map((im) => im.decode()))
      .then(() => {
        window.clearTimeout(giveUp);
        if (cancelled) return;
        const c = canvas.current;
        const ctx = c?.getContext('2d');
        if (!c || !ctx) return finish();
        c.width = imgs[0].naturalWidth;
        c.height = imgs[0].naturalHeight;
        ctx.drawImage(imgs[0], 0, 0);
        root.setAttribute('data-kv-open', 'play');
        let start = 0;
        const at = (p: number, n: number) => Math.min(n - 1, Math.max(0, Math.floor(p * n)));
        const step = (now: number) => {
          if (cancelled) return;
          if (!start) start = now;
          let t = now - start - HOLD;
          if (t < SLIDE) {
            ctx.drawImage(kabin[at(t / SLIDE, KABIN)], 0, 0);
          } else if ((t -= SLIDE) < FADE) {
            ctx.globalAlpha = 1;
            ctx.drawImage(kabin[KABIN - 1], 0, 0);
            ctx.globalAlpha = t / FADE;
            ctx.drawImage(kare[0], 0, 0);
            ctx.globalAlpha = 1;
          } else if ((t -= FADE) < OPEN) {
            ctx.drawImage(kare[at(t / OPEN, FRAMES)], 0, 0);
          } else {
            ctx.drawImage(kare[FRAMES - 1], 0, 0);
            return finish();
          }
          raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      })
      .catch(() => {
        window.clearTimeout(giveUp);
        finish();
      });
    return () => {
      cancelled = true;
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

  // lg+: the part list stands on the left of the picture, opening slowly once the breaker has
  // come apart (CSS `.kv-pick`); phones keep picture, list, search one under the other.
  return (
    <div className="kv-pick">
      <figure className="kv-open m-0 min-w-0 overflow-hidden rounded-md border border-hair bg-stage lg:col-start-2 lg:row-start-1">
        <div className="relative">
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
                  className={lit(g) ? 'text-brand-hi' : 'text-white/75'}
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
                    className={lit(g) ? 'fill-brand-hi' : 'fill-stage'}
                  />
                  <text
                    x={at[0]}
                    y={at[1]}
                    dy="0.36em"
                    textAnchor="middle"
                    stroke="none"
                    fontSize={34}
                    fontWeight={600}
                    className={`font-sans ${lit(g) ? 'fill-stage' : 'fill-white'}`}
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
        <figcaption className="border-t border-white/15 px-4 py-2 font-sans text-xs text-white/70">
          {p.caption}
        </figcaption>
      </figure>

      <nav
        aria-label={p.listLabel}
        className="kv-pick-side lg:col-start-1 lg:row-span-2 lg:row-start-1"
      >
        <ol className="m-0 grid list-none grid-cols-2 gap-2 p-0 font-sans text-sm sm:flex sm:flex-wrap lg:grid lg:grid-cols-1 lg:gap-1.5">
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
        className="min-w-0 rounded-md border border-hair bg-bg p-4 md:p-5 lg:col-start-2 lg:row-start-2"
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
