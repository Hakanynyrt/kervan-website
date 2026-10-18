import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useClientIdle, useReducedMotion } from '@kervan/motion';
import type { DictBlock } from '../types';
import type { GearLayout } from '../lib/gear-scene';

/** Posters = the same gear at its hot frame, 1000×1000 with a transparent background
 *  (a changed picture gets a new file name). The CSS picks day or night with the page theme. */
const POSTER_DAY = '/photos/isil-islem/gear-poster-day-01.webp';
const POSTER_NIGHT = '/photos/isil-islem/gear-poster-night-01.webp';
/** The hot frame's progress: the scene warms up to it by itself, then scrolling takes over. */
const P_HOLD = 0.36;
/** Where each stage tab scrolls to (scene progress P). */
const TAB_P = [0, 0.47, 0.76, 1];

/** The steel's colour scale, in the order the gear passes through it:
 *  cold steel, ember, dark after the quench, temper colours, finished steel. [from, to, colour] */
const SCALE: [number, number, string][] = [
  [0.0, 0.12, '#76726d'],
  [0.12, 0.22, '#8f3a22'],
  [0.22, 0.3, '#b8361a'],
  [0.3, 0.37, '#e0561a'],
  [0.37, 0.47, '#8e3a22'],
  [0.47, 0.6, '#3b3531'],
  [0.6, 0.69, '#a8935f'],
  [0.69, 0.77, '#8d6538'],
  [0.77, 0.85, '#76598c'],
  [0.85, 0.94, '#4a6aa0'],
  [0.94, 1.0, '#8d9bb0'],
];

const stageOf = (P: number) => (P < 0.37 ? 0 : P < 0.6 ? 1 : P < 0.94 ? 2 : 3);

interface Props {
  t: DictBlock;
}

/**
 * "Parçanın ısıl işlem yolu" (`#surec`): a 3D gear that heats, is quenched, is tempered and gets its
 * report as the visitor scrolls through a tall pinned section. It follows the hero and its film.
 *
 * Static mode (prerender + hydrate), reduced motion, Save-Data and any 3D failure: a normal block with
 * the poster and the four stages listed. Animated visitors get the pinned stage with the poster painted
 * at once; three.js (a separate chunk) loads only after the page has gone idle and the section is near
 * the viewport, and fades in over the poster.
 */
export default function GearProcess({ t }: Props) {
  const reduced = useReducedMotion(); // true in static mode, so the server render is the poster block
  const [failed, setFailed] = useState(false);
  const [saveData] = useState(() => {
    if (typeof navigator === 'undefined') return false;
    return !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData;
  });
  const onFail = useCallback(() => setFailed(true), []);

  if (reduced || saveData || failed) return <GearStatic t={t} />;
  return <GearPinned t={t} onFail={onFail} />;
}

function Poster({ alt }: { alt: string }) {
  return (
    <>
      <img
        className="kv-gear-img kv-gear-img-day"
        src={POSTER_DAY}
        width={1000}
        height={1000}
        alt={alt}
        loading="lazy"
        decoding="async"
      />
      <img
        className="kv-gear-img kv-gear-img-night"
        src={POSTER_NIGHT}
        width={1000}
        height={1000}
        alt={alt}
        loading="lazy"
        decoding="async"
      />
    </>
  );
}

function ReportMark() {
  return (
    <svg viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="13" cy="13" r="9" />
      <circle cx="13" cy="13" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Report({ g, className = '' }: { g: DictBlock['gear']; className?: string }) {
  return (
    <div className={`kv-gear-card ${className}`}>
      <ReportMark />
      <div>
        <strong>{g.report.title}</strong>
        <span>{g.report.note}</span>
      </div>
    </div>
  );
}

const H2_CLASS =
  'm-0 font-sans font-bold text-ink text-[clamp(30px,3.9vw,56px)] leading-[1.08] tracking-[-0.025em] text-balance';
const CTA_CLASS =
  'bg-brand text-bg inline-flex items-center justify-center min-h-[52px] px-8 font-sans text-[17px] font-semibold hover:bg-brand-hi transition-colors self-start';

/** Static block: copy, the four stages as a list, the poster. No script, no WebGL. */
function GearStatic({ t }: Props) {
  const g = t.gear;
  return (
    <section
      id="surec"
      aria-labelledby="surec-title"
      className="bg-bg border-t border-hair py-16 lg:py-24"
    >
      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-12 items-center">
        <div className="flex flex-col gap-5 lg:gap-6">
          <h2 id="surec-title" className={H2_CLASS}>
            {g.title}
          </h2>
          <p className="m-0 font-sans text-[17px] lg:text-xl text-ink-mid leading-[1.5] max-w-[27em]">
            {g.sub}
          </p>
          <a href="#contact" className={CTA_CLASS}>
            {t.hero.cta}
          </a>
          <ol
            aria-label={g.stagesLabel}
            className="list-none m-0 p-0 flex flex-col gap-3 border-l border-hair"
          >
            {g.stages.map((s) => (
              <li key={s.name} className="pl-4 -ml-px border-l border-transparent">
                <strong className="block font-sans text-lg font-semibold text-ink">{s.name}</strong>
                <span className="block font-sans text-base text-ink-mid leading-snug">
                  {s.desc}
                </span>
              </li>
            ))}
          </ol>
          <Report g={g} className="self-start" />
        </div>
        <div className="relative mx-auto w-full max-w-[560px] aspect-square">
          <Poster alt={g.posterAlt} />
        </div>
      </div>
    </section>
  );
}

/** Pinned stage: sticky for 300 svh; scroll progress drives the scene and the stage bar. */
function GearPinned({ t, onFail }: Props & { onFail: () => void }) {
  const g = t.gear;
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<GearLayout>({ cx: 0.7, cy: 0.5, D: 600 });
  const sceneLive = useRef(false);
  const lastProg = useRef(-1);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [near, setNear] = useState(false);
  // three.js waits for an idle main thread AND for the section to be within a screen of the viewport.
  const idle = useClientIdle(900);

  // Stage bar and tab from the progress P (0..1 over the scene's own scale).
  const setRail = useCallback((P: number) => {
    const stage = stageRef.current;
    if (stage && Math.abs(P - lastProg.current) > 0.002) {
      lastProg.current = P;
      stage.style.setProperty('--prog', P.toFixed(3));
      railRef.current?.querySelectorAll('.kv-gear-scale i').forEach((el, k) => {
        el.classList.toggle('on', P >= SCALE[k][0] + 0.004);
      });
    }
    setStep(stageOf(P));
  }, []);

  const sectionProgress = useCallback(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return 0;
    const r = section.getBoundingClientRect();
    const span = r.height - stage.offsetHeight;
    return span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0;
  }, []);

  // Layout: the gear sits right of the copy (wide) or in the gap between copy and stage bar (stacked);
  // the poster and the canvas use the same numbers (CSS variables + getLayout).
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const rail = railRef.current;
    const cta = ctaRef.current;
    const card = cardRef.current;
    if (!stage || !rail || !cta || !card) return;
    const layout = () => {
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      if (!W || !H) return;
      const stacked = W < 1000 || W / H < 1.15;
      stage.toggleAttribute('data-stacked', stacked);
      const sr = stage.getBoundingClientRect();
      const railTop = rail.getBoundingClientRect().top - sr.top;
      let L: GearLayout;
      if (stacked) {
        const top = cta.getBoundingClientRect().bottom - sr.top + 4;
        const avail = Math.max(120, railTop - 6 - top);
        L = { cx: 0.5, cy: (top + avail * 0.5) / H, D: Math.min(W * 0.86, avail * 0.9) };
      } else {
        const top = 88;
        const avail = Math.max(240, railTop - 16 - top);
        L = { cx: 0.7, cy: (top + avail / 2) / H, D: Math.min(W * 0.42, avail * 0.86) };
      }
      layoutRef.current = L;
      // report card: on the button's row, to its right (never over the gear)
      const cr = cta.getBoundingClientRect();
      const cardH = card.offsetHeight || 56;
      stage.style.setProperty(
        '--card-top',
        `${cr.top - sr.top + (cta.offsetHeight - cardH) / 2}px`,
      );
      stage.style.setProperty('--card-left', `${cr.right - sr.left + (stacked ? 10 : 20)}px`);
      stage.style.setProperty('--gx', `${L.cx * 100}%`);
      stage.style.setProperty('--gy', `${L.cy * 100}%`);
      stage.style.setProperty('--gd', `${L.D}px`);
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(stage);
    document.fonts?.ready.then(layout);
    return () => ro.disconnect();
  }, []);

  // Before the scene is live (or if it never is), the tab follows the scroll position.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (sceneLive.current || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setRail(P_HOLD + (1 - P_HOLD) * sectionProgress());
      });
    };
    setRail(0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [setRail, sectionProgress]);

  // Near the viewport: one screen above and below.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '100% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // three.js: a dynamic import, so its chunk is fetched only here (never in the prerender).
  useEffect(() => {
    if (!near || !idle) return;
    const host = hostRef.current;
    const section = sectionRef.current;
    if (!host || !section) return;
    let dead = false;
    let scene: { dispose(): void } | null = null;
    import('../lib/gear-scene')
      .then((mod) =>
        mod.mount({
          container: host,
          section,
          getLayout: () => layoutRef.current,
          onP: (P) => {
            sceneLive.current = true;
            setRail(P);
          },
          onReady: () => setReady(true),
          onLost: () => setReady(false),
          onFail,
        }),
      )
      .then((s) => {
        if (dead) s?.dispose();
        else scene = s;
      })
      .catch(onFail); // chunk failed to load (offline, stale deploy): the poster block stays
    return () => {
      dead = true;
      sceneLive.current = false;
      scene?.dispose();
    };
  }, [near, idle, onFail, setRail]);

  const goTo = (k: number) => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const P = TAB_P[k];
    const p = P <= P_HOLD ? 0 : (P - P_HOLD) / (1 - P_HOLD);
    const span = section.offsetHeight - stage.offsetHeight;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + p * span, behavior: 'smooth' });
  };

  return (
    <section
      ref={sectionRef}
      id="surec"
      aria-labelledby="surec-title"
      // Tall enough for the four stages; the stage is `svh` so a phone's sliding toolbar does not resize it.
      className="bg-bg border-t border-hair relative h-[300svh]"
    >
      <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden">
        <div role="img" aria-label={g.sceneLabel} className="absolute inset-0 pointer-events-none">
          {/* Poster first (no wait for three.js); the canvas fades in over it. */}
          <div className="kv-gear-poster" style={{ opacity: ready ? 0 : 1 }}>
            <Poster alt="" />
          </div>
          <div
            ref={hostRef}
            className="absolute inset-0 transition-opacity duration-[700ms]"
            style={{ opacity: ready ? 1 : 0 }}
          />
        </div>

        <div className="kv-gear-copy relative z-[2] h-full flex flex-col justify-center pt-[5.5rem] pb-28 pointer-events-none">
          <div className="w-full max-w-[1280px] mx-auto px-6 md:px-8">
            <div className="flex flex-col gap-4 lg:gap-6 max-w-[min(40rem,50vw)] max-[999px]:max-w-none pointer-events-auto">
              <h2 id="surec-title" className={H2_CLASS}>
                {g.title}
              </h2>
              <p className="m-0 font-sans text-[17px] lg:text-xl text-ink-mid leading-[1.5] max-w-[27em]">
                {g.sub}
              </p>
              <a ref={ctaRef} href="#contact" className={CTA_CLASS}>
                {t.hero.cta}
              </a>
            </div>
          </div>
        </div>

        <div
          ref={cardRef}
          aria-hidden="true"
          className={`kv-gear-card-pinned${step === 3 ? ' show' : ''}`}
        >
          <Report g={g} />
        </div>

        <div ref={railRef} className="absolute z-[2] inset-x-0 bottom-3 md:bottom-5 text-ink-mid">
          <div className="w-full max-w-[1280px] mx-auto px-6 md:px-8">
            <div className="kv-gear-scale" aria-hidden="true">
              {SCALE.map(([a, b, c]) => (
                <i key={a} style={{ flex: b - a, ['--c' as string]: c }} />
              ))}
              <b className="kv-gear-tick" />
            </div>
            <ol aria-label={g.stagesLabel} className="kv-gear-tabs">
              {g.stages.map((s, k) => (
                <li key={s.name} aria-current={k === step ? 'step' : undefined}>
                  <button type="button" className="kv-gear-tab" onClick={() => goTo(k)}>
                    {s.name}
                  </button>
                </li>
              ))}
            </ol>
            <p className="kv-gear-now" aria-live="polite">
              {g.stages[step].desc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
