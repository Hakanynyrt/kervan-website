import { lazy, Suspense, useEffect, useRef, useState, type ComponentType } from 'react';
import { useReducedMotion } from '@kervan/motion';
import type { DictBlock } from '../types';

type SceneProps = { section: HTMLElement; onReady?: () => void; onFail?: () => void };

/** Chunk failed to load (offline, stale deploy): report it so the poster shows. */
function SceneUnavailable({ onFail }: SceneProps) {
  useEffect(() => onFail?.(), [onFail]);
  return null;
}

// three.js is a large chunk: load it only when the section comes near the viewport.
const CoolingScene = lazy<ComponentType<SceneProps>>(() =>
  import('./CoolingScene').catch(() => ({ default: SceneUnavailable })),
);

/** Poster (cherry-red frame of the same scene), `${POSTER}-640.webp` / `-1080.webp`, 3:2. */
const POSTER = '/photos/isil-islem/sogutma-uc-01';

interface Props {
  t: DictBlock;
}

/**
 * "Isınıp soğuyan parça" — a breaker tip that cools from furnace-hot to black
 * steel as the visitor scrolls through a tall section (sticky stage).
 *
 * Static mode (prerender + hydrate) and reduced motion: a normal-height section
 * with the poster image; nothing here touches WebGL. Animated visitors get the
 * sticky stage; the three.js scene mounts once the section is near the viewport.
 * No WebGL or a model load error → the poster in the stage.
 */
export default function Cooling({ t }: Props) {
  const reduced = useReducedMotion(); // true in static mode
  const c = t.cooling;

  if (reduced) {
    return (
      <section
        id="sogutma"
        aria-labelledby="sogutma-title"
        className="kv-night bg-bg relative py-20 md:py-32 overflow-hidden"
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
    <div className="flex flex-col gap-6 max-w-[36rem]">
      <h2
        id="sogutma-title"
        className="font-serif italic text-h2 text-ink leading-[1.1] tracking-[-0.015em]"
      >
        {c.title}
      </h2>
      <p className="font-sans text-base md:text-lg text-ink-mid leading-relaxed max-w-[44ch]">
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
      sizes="(min-width: 1024px) 58vw, 100vw"
      width={1080}
      height={720}
      alt={fill ? '' : c.posterAlt}
      loading="lazy"
      decoding="async"
      className={
        fill
          ? 'absolute inset-0 w-full h-full object-contain object-[50%_70%] lg:object-[70%_60%]'
          : 'w-full h-auto'
      }
    />
  );
}

function CoolingLive({ c }: { c: CoolingCopy }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [section, setSection] = useState<HTMLElement | null>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState(0);

  // Mount the scene once the section is within a viewport of the screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    setSection(el);
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '100% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Highlight the stage the piece is in (same progress as the scene).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0;
      setStep(p < 0.3 ? 0 : p < 0.75 ? 1 : 2);
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
      className="kv-night bg-bg relative h-[220vh]"
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
          {failed ? (
            <Poster c={c} fill />
          ) : (
            <div
              className="absolute inset-0 transition-opacity duration-[600ms]"
              style={{ opacity: ready ? 1 : 0 }}
            >
              {near && section && (
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
        <div className="relative w-full max-w-[1280px] mx-auto px-6 md:px-8 pt-[calc(5.5rem+var(--kv-strip-h))] md:pt-32 pointer-events-none">
          <div className="pointer-events-auto">
            <Copy c={c} step={step} />
          </div>
        </div>
      </div>
    </section>
  );
}
