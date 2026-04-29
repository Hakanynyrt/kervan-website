import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { DictBlock } from '../types';
import { staggerContainer, fadeUp, inViewOnce } from '../lib/motion';
import SectionHead from './SectionHead';

interface Props {
  t: DictBlock;
}

/**
 * WorkshopShowcase — atelier'in içinden 5 kart: 3 video + 2 foto.
 * Mobilde scroll-snap horizontal, lg+ desktop'ta 5-col grid.
 * Aspect 9:16 (iPhone vertical source).
 *
 * Videolar autoplay DEĞİL — IntersectionObserver ile sadece viewport'ta
 * göründüğünde oynar, dışına çıkınca pause olur. Sayfa açılışında hiçbir
 * video oynamaz; kullanıcı bölüme scroll edince başlar.
 */
export default function WorkshopShowcase({ t }: Props) {
  return (
    <section id="atolye" className="py-24 md:py-32">
      <SectionHead
        eyebrow={t.atolye.eyebrow}
        title={t.atolye.title}
        aside={t.atolye.aside}
      />

      <motion.div
        className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        variants={staggerContainer(0, 0.08)}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        {t.atolye.items.map((it, i) => (
          <motion.article key={i} variants={fadeUp} className="flex flex-col gap-5">
            <div className="relative overflow-hidden aspect-[9/16] bg-bg-soft">
              {it.video ? (
                <InViewVideo src={it.video} poster={it.img || undefined} />
              ) : it.img ? (
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${it.img})` }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="px-6 py-3 border border-dashed border-ink-soft/60 font-sans text-xs tracking-widest uppercase text-ink-soft">
                    {it.name}
                  </span>
                </div>
              )}
              <span className="absolute top-3 left-3 font-sans text-xs tracking-widest text-ink/95 z-10">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-h3 italic text-ink">{it.name}</h3>
              {it.desc && (
                <p className="font-serif italic text-sm md:text-base text-ink-mid leading-relaxed">
                  {it.desc}
                </p>
              )}
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}

interface InViewVideoProps {
  src: string;
  poster?: string;
}

/**
 * Video element ki sadece viewport içindeyken oynar. Page entrance'ta
 * (off-viewport) hiçbir şey çalmaz — kullanıcı scroll edince başlar,
 * scroll'la çıkınca pause olur.
 *
 * preload="none" — başlangıçta hiç byte indirmez. play() çağrıldığında
 * indirmeye başlar (instant on viewport entry, gecikme görünmez).
 */
function InViewVideo({ src, poster }: InViewVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) return; // reduced-motion: poster only, hiç oynama

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.play().catch(() => { /* user-gesture gerekirse poster kalır */ });
          } else {
            el.pause();
          }
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
