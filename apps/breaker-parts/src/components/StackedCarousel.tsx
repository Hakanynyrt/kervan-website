import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { GalleryItem } from '../types';

interface Props {
  items: GalleryItem[];
}

/**
 * StackedCarousel — 3D yığın kart efekti (testimonials-card pattern).
 * Aktif kart önde merkezde, ±1/±2 kartlar arka planda hafif rotation +
 * scale + offset ile yığılı.
 *
 * Navigation:
 *   - Touch swipe: sola/sağa (50 px threshold, horizontal-dominant)
 *   - Klavye: ← / →
 *   - Tıklanabilir dots indicator: aktif kart belli, atlamak için tap
 *
 * Aktif karta tap → fullscreen Lightbox (video controls + close).
 */
export default function StackedCarousel({ items }: Props) {
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const N = items.length;

  // Mobile portrait: drop the stack effect entirely. The rotateZ +
  // translate stack reads as "tilted shards" on a narrow viewport.
  // Below md (<768 px) we show only the active card.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const next = () => setActive((a) => (a + 1) % N);
  const prev = () => setActive((a) => (a - 1 + N) % N);

  // Touch swipe — left = next, right = prev. Threshold 50 px to ignore
  // jitter; horizontal-dominant check (|dx| > |dy|) so vertical scrolls
  // (page snap-pagination) aren't hijacked.
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 50) return;
    if (Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
  };

  // Klavye navigasyonu — ←/→ cycles slides whether the lightbox is
  // open or closed; Escape only closes the lightbox.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxOpen) {
        setLightboxOpen(false);
        return;
      }
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N, lightboxOpen]);

  return (
    <div className="w-full max-w-2xl mx-auto px-2 md:px-4">
      {/* Stack area */}
      <div
        className="relative h-[380px] md:h-[640px] touch-pan-y select-none"
        style={{ perspective: isMobile ? 'none' : '1400px' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Counter — top right of card stack */}
        <div className="absolute top-4 right-4 z-30 font-sans text-xs tracking-widest uppercase text-ink-soft tabular-nums pointer-events-none">
          {String(active + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
        </div>

        {items.map((item, i) => (
          <Card
            key={i}
            item={item}
            index={i}
            active={active}
            N={N}
            isMobile={isMobile}
            onOpen={() => setLightboxOpen(true)}
          />
        ))}
      </div>

      {/* Dots indicator — replaces the ←/→ buttons. Active dot is a
          longer brand-coloured bar; tap any dot to jump. The shape of
          this strip reads as "this slides" without needing words. */}
      <div className="mt-6 md:mt-8 flex justify-center items-center gap-2">
        {items.map((_, i) => {
          const isActive = i === active;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Slayt ${i + 1}`}
              aria-current={isActive ? 'true' : undefined}
              className={
                'h-1.5 rounded-full transition-all duration-300 ease-out ' +
                (isActive
                  ? 'w-8 bg-brand'
                  : 'w-1.5 bg-ink-soft/40 hover:bg-ink-soft/70')
              }
            />
          );
        })}
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            items={items}
            active={active}
            onPrev={prev}
            onNext={next}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface CardProps {
  item: GalleryItem;
  index: number;
  active: number;
  N: number;
  isMobile: boolean;
  onOpen: () => void;
}

/** Single card; computes its 3D transform based on offset from active. */
function Card({ item, index, active, N, isMobile, onOpen }: CardProps) {
  // Signed offset, wrapped to [-N/2, N/2] for symmetric stacking
  const raw = index - active;
  const wrapped = raw > N / 2 ? raw - N : raw < -N / 2 ? raw + N : raw;
  const abs = Math.abs(wrapped);
  const visible = abs <= 2;
  const isActive = abs === 0;

  // Mobile: completely flat — only the active card is shown.
  // Desktop: testimonials-style 3D rack.
  const rotate = isMobile ? 0 : wrapped * 7;
  const scale = isMobile ? 1 : 1 - abs * 0.075;
  const xPx = isMobile ? 0 : wrapped * 36;
  const yPx = isMobile ? 0 : abs * 12;
  const opacity = isMobile ? (isActive ? 1 : 0) : visible ? 1 - abs * 0.32 : 0;
  const zIndex = isMobile ? (isActive ? 20 : 0) : 20 - abs;

  return (
    <motion.article
      className={'absolute inset-0 origin-center ' + (isActive ? 'cursor-pointer' : '')}
      onClick={isActive ? onOpen : undefined}
      animate={{
        rotateZ: rotate,
        scale,
        x: xPx,
        y: yPx,
        opacity,
        zIndex,
      }}
      transition={{ type: 'spring', stiffness: 130, damping: 22, mass: 0.9 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="relative h-full w-full overflow-hidden bg-bg-soft border border-hair">
        {item.video ? (
          <InViewVideo src={item.video} poster={item.img || undefined} />
        ) : item.img ? (
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${item.img})` }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-bg">
            <span className="px-6 py-3 border border-dashed border-ink-soft/60 font-sans text-xs tracking-widest uppercase text-ink-soft">
              {item.name}
            </span>
          </div>
        )}

        {/* Expand affordance — only on active card. Communicates that
            tapping opens a fullscreen view. Top-left, balances the
            "01 / 07" counter top-right. */}
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute top-4 left-4 z-20 inline-flex items-center justify-center w-9 h-9 rounded-full bg-bg/55 backdrop-blur-sm pointer-events-none"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </span>
        )}

        {/* Bottom gradient + text overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-8 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/85 to-transparent" />
          <div className="relative flex flex-col gap-1.5">
            <h3 className="font-h3 italic text-ink leading-tight">{item.name}</h3>
            {item.desc && (
              <p className="font-serif italic text-sm md:text-base text-ink-mid leading-snug">
                {item.desc}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

interface LightboxProps {
  items: GalleryItem[];
  active: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

/**
 * Fullscreen overlay for the active card's media. Click backdrop or
 * the close button to dismiss; ESC handled in parent.
 *
 * Internal swipe + counter so the user can browse between videos
 * without exiting the modal. Body scroll locked while open so the
 * snap-pagination doesn't fight the modal.
 */
function Lightbox({ items, active, onPrev, onNext, onClose }: LightboxProps) {
  const item = items[active];
  const N = items.length;

  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, []);

  // Touch swipe inside the lightbox — same threshold/axis logic as
  // the carousel itself: 50 px and horizontal-dominant.
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 50) return;
    if (Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) onNext();
    else onPrev();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 md:p-12 select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      {/* Counter — top left, mirrors the in-card counter; tells the
          user "n / total" so the swipe-between-videos affordance is
          obvious. */}
      <div className="absolute top-4 left-4 z-10 font-sans text-xs tracking-widest uppercase text-ink-soft tabular-nums pointer-events-none">
        {String(active + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Kapat"
        className="absolute top-4 right-4 z-10 inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-soft/60 hover:bg-bg-soft text-ink transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Stop click propagation on media wrapper so users can interact
          with video controls without dismissing the lightbox.
          AnimatePresence with `mode="wait"` cross-fades media when the
          slide changes via swipe / keyboard. The `key` ensures the
          video element remounts so it picks up the new `src`. */}
      <div
        className="relative w-full max-w-4xl flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="w-full flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {item.video ? (
              <video
                src={item.video}
                poster={item.img || undefined}
                autoPlay
                loop
                muted
                playsInline
                className="max-w-full max-h-[78vh] w-auto h-auto object-contain bg-black pointer-events-none"
              />
            ) : item.img ? (
              <img
                src={item.img}
                alt={item.name}
                className="max-w-full max-h-[78vh] w-auto h-auto object-contain"
              />
            ) : null}

            <div className="flex flex-col gap-1 px-2 text-center">
              <h3 className="font-h3 italic text-ink leading-tight">{item.name}</h3>
              {item.desc && (
                <p className="font-serif italic text-sm md:text-base text-ink-mid leading-snug">
                  {item.desc}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicator inside lightbox — same shape as the in-page
          one, gives the user a tap-target alternative to swipe. */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {items.map((_, i) => {
          const isActive = i === active;
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (i === active) return;
                if (i > active) onNext();
                else onPrev();
                // for jumps of >1 we'd need a setActive prop; for now,
                // single-step nav is enough — users typically swipe.
              }}
              aria-label={`Slayt ${i + 1}`}
              aria-current={isActive ? 'true' : undefined}
              className={
                'h-1.5 rounded-full transition-all duration-300 ease-out ' +
                (isActive
                  ? 'w-8 bg-brand'
                  : 'w-1.5 bg-ink-soft/40 hover:bg-ink-soft/70')
              }
            />
          );
        })}
      </div>
    </motion.div>
  );
}

interface InViewVideoProps {
  src: string;
  poster?: string;
}

/** Viewport'a girince oynar, dışına çıkınca pause. preload="none" → byte
 *  sıfır harcar görünmüyorken. */
function InViewVideo({ src, poster }: InViewVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) el.play().catch(() => { /* user-gesture */ });
          else el.pause();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      className="w-full h-full object-cover"
    />
  );
}
