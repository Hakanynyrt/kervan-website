import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { GalleryItem } from '../types';

interface Props {
  items: GalleryItem[];
}

/**
 * StackedCarousel — 3D yığın kart efekti (testimonials-card pattern).
 * Aktif kart önde merkezde, ±1/±2 kartlar arka planda hafif rotation +
 * scale + offset ile yığılı. Prev/next nav. Counter top-right.
 *
 * Cards: video varsa <video> (in-view autoplay), yoksa img background.
 * Mood C: bg-bg-soft, hairline border, italic Fraunces overlay text.
 */
export default function StackedCarousel({ items }: Props) {
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const N = items.length;

  // Mobile portrait: drop the stack effect entirely. The rotateZ +
  // translate stack reads as "tilted shards" on a narrow viewport,
  // especially with the angled chisel rendering through it. Below
  // md (<768 px) we show only the active card, navigation via the
  // prev/next buttons.
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
  // (page snap-pagination) aren't hijacked. `touchAction: pan-y` on the
  // stack area lets the browser keep handling vertical pan while we
  // claim horizontal gestures.
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

  // Klavye navigasyonu — accessibility
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N]);

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
          <Card key={i} item={item} index={i} active={active} N={N} isMobile={isMobile} />
        ))}
      </div>

      {/* Nav buttons */}
      <div className="flex justify-center items-center gap-3 mt-8">
        <button
          type="button"
          onClick={prev}
          aria-label="Önceki"
          className="w-12 h-12 border border-hair text-ink-mid hover:bg-bg-soft hover:border-ink-mid hover:text-ink transition-all flex items-center justify-center font-serif text-xl"
        >
          ←
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Sonraki"
          className="w-12 h-12 border border-hair text-ink-mid hover:bg-bg-soft hover:border-ink-mid hover:text-ink transition-all flex items-center justify-center font-serif text-xl"
        >
          →
        </button>
      </div>
    </div>
  );
}

interface CardProps {
  item: GalleryItem;
  index: number;
  active: number;
  N: number;
  isMobile: boolean;
}

/** Single card; computes its 3D transform based on offset from active. */
function Card({ item, index, active, N, isMobile }: CardProps) {
  // Signed offset, wrapped to [-N/2, N/2] for symmetric stacking
  const raw = index - active;
  const wrapped = raw > N / 2 ? raw - N : raw < -N / 2 ? raw + N : raw;
  const abs = Math.abs(wrapped);
  const visible = abs <= 2;

  // Mobile: completely flat — only the active card is shown, no rotation,
  // no scale, no offset. Non-active cards fade to opacity 0 and step out
  // of the z-stack so they can't intercept clicks.
  // Desktop: keep the testimonials-style 3D rack.
  const rotate = isMobile ? 0 : wrapped * 7;
  const scale = isMobile ? 1 : 1 - abs * 0.075;
  const xPx = isMobile ? 0 : wrapped * 36;
  const yPx = isMobile ? 0 : abs * 12;
  const opacity = isMobile ? (abs === 0 ? 1 : 0) : visible ? 1 - abs * 0.32 : 0;
  const zIndex = isMobile ? (abs === 0 ? 20 : 0) : 20 - abs;

  return (
    <motion.article
      className="absolute inset-0 origin-center"
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
