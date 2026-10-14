import { lazy, Suspense, useEffect, useRef, useState, type ComponentType } from 'react';
import { motion } from 'framer-motion';
import { useClientIdle, useReducedMotion } from '@kervan/motion';
import type { DictBlock } from '../types';

type SceneProps = { section: HTMLElement; onReady?: () => void; onFail?: () => void };

/** Chunk failed to load (offline, stale deploy): report it so the poster shows. */
function SceneUnavailable({ onFail }: SceneProps) {
  useEffect(() => onFail?.(), [onFail]);
  return null;
}

// three.js is a large chunk: it loads only after the first paint has gone idle.
const CoolingScene = lazy<ComponentType<SceneProps>>(() =>
  import('./CoolingScene').catch(() => ({ default: SceneUnavailable })),
);

/** Poster (cherry-red frame of the same scene), `${POSTER}-640.webp` / `-1080.webp`, 3:2. */
const POSTER = '/photos/isil-islem/sogutma-uc-01';
/** One `sizes` for the static and the live poster, so both pick the same file
 *  (the prerendered <img> starts the download before the app has rendered). */
const POSTER_SIZES = '(min-width: 1024px) 70vw, 100vw';
/** Same flag IntroOverlay sets: the scroll cue waits for the curtain on a first visit. */
const INTRO_KEY = 'kv_v2_intro_seen';

interface Props {
  t: DictBlock;
}

/**
 * The page opening (`#sogutma`, first under the header): "Isınıp soğuyan parça",
 * a breaker tip that cools from furnace-hot to black steel as the visitor scrolls
 * through a tall section (sticky stage); the Hero follows.
 *
 * Static mode (prerender + hydrate) and reduced motion: a normal-height block
 * with the poster image; nothing here touches WebGL. Animated visitors get the
 * sticky stage with the poster painted at once; the three.js scene loads after
 * the first paint has gone idle and fades in over it. No WebGL or a model load
 * error → the poster stays.
 */
export default function Cooling({ t }: Props) {
  const reduced = useReducedMotion(); // true in static mode
  const c = t.cooling;

  if (reduced) {
    return (
      <section
        id="sogutma"
        aria-labelledby="sogutma-title"
        className="kv-night bg-bg relative pt-[calc(6rem+var(--kv-strip-h))] pb-16 md:pt-[calc(8rem+var(--kv-strip-h))] md:pb-24 overflow-hidden"
      >
        <div className="relative w-full max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-12 items-center">
          <Copy c={c} />
          <Poster c={c} />
        </div>
      </section>
    );
  }
  return <CoolingLive c={c} />;
}

type CoolingCopy = DictBlock['cooling'];

function Copy({ c, step }: { c: CoolingCopy; step?: number }) {
  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-[36rem]">
      {/* What we do and where: the first words a phone visitor reads. */}
      <p className="m-0 -mb-1 md:-mb-3 font-sans text-xs md:text-sm font-medium tracking-[0.16em] uppercase text-brand">
        {c.kicker}
      </p>
      <h2
        id="sogutma-title"
        className="font-serif italic text-[clamp(30px,8.5vw,44px)] md:text-h2 text-ink leading-[1.1] tracking-[-0.015em]"
      >
        {c.title}
      </h2>
      <p className="font-sans text-[15px] md:text-lg text-ink-mid leading-relaxed max-w-[44ch]">
        {c.body}
      </p>
      <ol className="list-none m-0 p-0 flex flex-col gap-2 border-l border-hair">
        {c.steps.map((s, i) => {
          const on = step === i;
          return (
            <li
              key={s}
              className={`pl-4 -ml-px border-l font-sans text-sm transition-colors duration-[400ms] ${
                on ? 'border-brand text-ink' : 'border-transparent text-ink-mid'
              }`}
            >
              {s}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Poster({ c, fill = false }: { c: CoolingCopy; fill?: boolean }) {
  return (
    <img
      src={`${POSTER}-1080.webp`}
      srcSet={`${POSTER}-640.webp 640w, ${POSTER}-1080.webp 1080w`}
      sizes={POSTER_SIZES}
      width={1080}
      height={720}
      alt={fill ? '' : c.posterAlt}
      // First thing on the page: the LCP image.
      loading="eager"
      fetchPriority="high"
      decoding="async"
      // Fill: `lighten` drops the poster's near-black backdrop into the stage's own background.
      className={
        fill ? 'absolute inset-0 w-full h-full object-contain mix-blend-lighten' : 'w-full h-auto'
      }
    />
  );
}

function CoolingLive({ c }: { c: CoolingCopy }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [section, setSection] = useState<HTMLElement | null>(null);
  // three.js waits until the poster and the page have painted and the main thread is idle.
  const idle = useClientIdle(2000);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState(0);
  const [atTop, setAtTop] = useState(true);
  const [cueDelay] = useState(() => {
    try {
      return sessionStorage.getItem(INTRO_KEY) === '1' ? 0.8 : 2.8;
    } catch {
      return 2.8;
    }
  });

  useEffect(() => setSection(sectionRef.current), []);

  // Highlight the stage the piece is in (same progress as the scene); the cue
  // fades once scrolling has begun.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      // At least half a screen of scrolling for the whole cooling: the phone section is only
      // 115vh, so the piece keeps cooling while the stage scrolls away (keep in sync: Cooling / CoolingScene).
      const span = Math.max(r.height - window.innerHeight, window.innerHeight * 0.5);
      const p = span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0;
      setStep(p < 0.3 ? 0 : p < 0.75 ? 1 : 2);
      setAtTop(p < 0.04);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="sogutma"
      aria-labelledby="sogutma-title"
      // Short on phones (about one extra screen of scrolling) so nobody is held long before the hero.
      className="kv-night bg-bg relative h-[115vh] md:h-[180vh]"
    >
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 62% 62%, rgba(232,67,27,0.06), transparent 60%)',
          }}
        />
        <div role="img" aria-label={c.sceneLabel} className="absolute inset-0">
          {/* Poster first (no wait for three.js); the scene fades in over it, framed alike. */}
          <div
            className="absolute inset-x-0 bottom-[6%] top-[46%] md:top-[30%] lg:inset-y-[16%] lg:left-[30%] lg:right-[-2%] transition-opacity duration-[600ms]"
            style={{ opacity: ready && !failed ? 0 : 1 }}
          >
            <Poster c={c} fill />
          </div>
          {!failed && (
            <div
              className="absolute inset-0 transition-opacity duration-[600ms]"
              style={{ opacity: ready ? 1 : 0 }}
            >
              {idle && section && (
                <Suspense fallback={null}>
                  <CoolingScene
                    section={section}
                    onReady={() => setReady(true)}
                    onFail={() => setFailed(true)}
                  />
                </Suspense>
              )}
            </div>
          )}
        </div>
        <div className="relative w-full max-w-[1280px] mx-auto px-6 md:px-8 pt-[calc(5.5rem+var(--kv-strip-h))] md:pt-[calc(7rem+var(--kv-strip-h))] pointer-events-none">
          <div className="pointer-events-auto">
            <Copy c={c} step={step} />
          </div>
        </div>
        <motion.div
          aria-hidden="true"
          className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: cueDelay, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="flex flex-col items-center gap-2 font-sans text-[11px] tracking-[0.32em] uppercase text-ink-mid transition-opacity duration-[400ms]"
            style={{ opacity: atTop ? 0.85 : 0 }}
          >
            <span>{c.scroll}</span>
            <motion.span
              style={{ display: 'inline-block' }}
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              ↓
            </motion.span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
