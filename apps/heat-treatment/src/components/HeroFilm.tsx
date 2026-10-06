import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useReducedMotion } from '@kervan/motion';
import type { DictBlock } from '../types';

/** Cut from public/videos/atolye/furnace-01.mp4. Immutable cache: a re-encode needs a new name (-02). */
const DIR = '/videos/isil-islem/firin-hatti-loop-01';
/** Tailwind lg: the card is 9:16 with the portrait files; below it 16:9 with the -wide files. */
const LG = '(min-width: 64rem)';
/** Both posters are frame 189 (6.30–6.33 s, the furnace with the flame); playback starts on that frame
 *  so the poster comes alive without a jump. `loop` then wraps 9.2 s → 0 (the loop is seamless). */
const START_AT = 6.32;
/** Per-session choice: 'paused' = this visitor paused the film (no bytes until Play). */
const PREF = 'kv_hero_film';

type Conn = { saveData?: boolean; effectiveType?: string };
type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

function autoplayAllowed(): boolean {
  const c = (navigator as Navigator & { connection?: Conn }).connection;
  if (c?.saveData || (c?.effectiveType && c.effectiveType !== '4g')) return false; // unknown (Safari) = allowed
  return !window.matchMedia('(prefers-reduced-data: reduce)').matches;
}
const pickSrc = () => `${DIR}${window.matchMedia(LG).matches ? '' : '-wide'}.mp4`;
const readPaused = () => {
  try {
    return sessionStorage.getItem(PREF) === 'paused';
  } catch {
    return false;
  }
};
const writePaused = (p: boolean) => {
  try {
    sessionStorage.setItem(PREF, p ? 'paused' : 'playing');
  } catch {
    /* ignore */
  }
};
/** play(); a refusal (iOS Low Power Mode, autoplay off) → `onBlocked`. An AbortError only means a
 *  pause()/new src beat the pending play (scrolled away, tab hidden), not that the visitor paused. */
const play = (v: HTMLVideoElement, onBlocked: () => void) => {
  v.play().catch((e: unknown) => {
    if ((e as { name?: string } | null)?.name !== 'AbortError') onBlocked();
  });
};

interface Props {
  t: DictBlock;
  /** seconds; Hero passes t0 + HERO_SEQ_END */
  startAt: number;
}

export default function HeroFilm({ t, startAt }: Props) {
  const reduced = useReducedMotion(); // true in static mode → poster only, no effects run
  const [motionOff, setMotionOff] = useState(false); // live opt-out: framer's hook is a mount-time snapshot
  const off = reduced || motionOff;
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [offer, setOffer] = useState(false); // click-to-play (data saver / slow link / paused earlier)
  const [ready, setReady] = useState(false); // first seek to START_AT done
  const [paused, setPaused] = useState(false);
  const [live, setLive] = useState(false); // first 'playing' → fade in over the poster

  // 0. prefers-reduced-motion switched on mid-visit → back to the poster, no button.
  useEffect(() => {
    if (reduced) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => {
      if (!mq.matches) return;
      videoRef.current?.pause();
      setMotionOff(true);
      setSrc(null);
      setOffer(false);
      setReady(false);
      setLive(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [reduced]);

  // 1. Arm after the hero sequence (+ intro curtain), then idle, then when the card is ≥25 % on screen.
  useEffect(() => {
    if (off) return;
    const w = window as IdleWindow;
    let idle = 0;
    let io: IntersectionObserver | undefined;
    const arm = () => {
      if (!autoplayAllowed() || readPaused()) {
        setPaused(true);
        setOffer(true);
        return;
      }
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            io?.disconnect();
            setSrc(pickSrc());
          }
        },
        { threshold: 0.25 },
      );
      if (frameRef.current) io.observe(frameRef.current);
    };
    const timer = window.setTimeout(() => {
      idle = w.requestIdleCallback
        ? w.requestIdleCallback(arm, { timeout: 1500 })
        : window.setTimeout(arm, 1);
    }, startAt * 1000);
    return () => {
      window.clearTimeout(timer);
      if (w.cancelIdleCallback) w.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      io?.disconnect();
    };
  }, [off, startAt]);

  // 2. Muted (React sets only the property; iOS wants the attribute) and seek to the poster frame.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute('muted', '');
    const seek = () => {
      v.currentTime = START_AT;
    };
    const done = () => setReady(true);
    v.addEventListener('seeked', done, { once: true });
    if (v.readyState >= 1) seek();
    else v.addEventListener('loadedmetadata', seek, { once: true });
    return () => {
      v.removeEventListener('seeked', done);
      v.removeEventListener('loadedmetadata', seek);
    };
  }, [src]);

  // 3. Play only when ready, on screen, tab visible and not paused.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src || !ready) return;
    let onScreen = true;
    const sync = () => {
      if (paused || !onScreen || document.hidden) v.pause();
      else play(v, () => setPaused(true)); // iOS Low Power Mode etc. → poster + Play button
    };
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      sync();
    });
    io.observe(v);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [src, ready, paused]);

  const playing = src !== null && !paused;
  // 404, network drop or no H.264 decoder: back to the plain poster, no button over a still image.
  const fail = () => {
    setSrc(null);
    setOffer(false);
    setReady(false);
    setLive(false);
  };
  const toggle = () => {
    const v = videoRef.current;
    if (!src) {
      writePaused(false);
      // Mount the <video> now so play() runs inside this click (Safari only allows it there).
      flushSync(() => {
        setOffer(false);
        setPaused(false);
        setSrc(pickSrc());
      });
      if (videoRef.current) play(videoRef.current, () => setPaused(true));
      return;
    }
    if (paused) {
      writePaused(false);
      setPaused(false);
      if (v) play(v, () => setPaused(true)); // inside the gesture
    } else {
      writePaused(true);
      setPaused(true);
      v?.pause();
    }
  };

  return (
    <figure className="m-0 lg:col-start-3 lg:row-start-1 flex flex-col gap-3">
      {/* No opacity/clip entrance on the card or poster: it paints with the first render (LCP). */}
      <div
        ref={frameRef}
        className="relative overflow-hidden rounded-md border border-hair bg-bg-soft aspect-video lg:aspect-[9/16]"
      >
        <picture>
          <source media={LG} srcSet={`${DIR}-poster.webp`} />
          <img
            src={`${DIR}-wide-poster.webp`}
            width={1280}
            height={720}
            alt={t.hero.film.alt}
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        </picture>
        {!off && src && (
          <video
            ref={videoRef}
            src={src}
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            disablePictureInPicture
            disableRemotePlayback
            onPlaying={() => setLive(true)}
            onError={fail}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-600 ease-editorial ${live ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        {!off && (src !== null || offer) && (
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? t.hero.film.pause : t.hero.film.play}
            className="absolute bottom-3 left-3 grid size-11 place-items-center rounded-full border border-hair-strong bg-bg/75 text-ink backdrop-blur-sm transition-colors hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 focus-visible:shadow-[0_0_0_6px_var(--color-bg)]"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              {playing ? (
                <path fill="currentColor" d="M4 3h3v10H4zm5 0h3v10H9z" />
              ) : (
                <path fill="currentColor" d="M5 3l8 5-8 5z" />
              )}
            </svg>
          </button>
        )}
      </div>
      <figcaption className="font-sans text-xs tracking-[0.1em] uppercase text-ink-soft">
        {t.hero.film.caption}
      </figcaption>
    </figure>
  );
}
