import { motion } from 'framer-motion';
import type { DictBlock } from '../types';
import { staggerContainer, fadeUp, inViewOnce } from '../lib/motion';
import SectionHead from './SectionHead';

interface Props {
  t: DictBlock;
}

/**
 * WorkshopShowcase — 3 vertical video cards, atelier'in içinden.
 * Mobilde stack, lg+ desktop'ta 3-column grid. Aspect 9:16 (iPhone source).
 * Her video autoplay muted loop playsinline; poster image ilk paint için.
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
        className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        variants={staggerContainer(0, 0.12)}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        {t.atolye.items.map((it, i) => (
          <motion.article key={i} variants={fadeUp} className="flex flex-col gap-5">
            <div className="relative overflow-hidden aspect-[9/16] bg-bg-soft">
              {it.video ? (
                <video
                  src={it.video}
                  poster={it.img || undefined}
                  muted
                  autoPlay
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
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
              <span className="absolute top-4 left-4 font-sans text-xs tracking-widest text-ink/95 z-10">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-h3 italic text-ink">{it.name}</h3>
              {it.desc && (
                <p className="font-serif italic text-base text-ink-mid leading-relaxed max-w-[36ch]">
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
