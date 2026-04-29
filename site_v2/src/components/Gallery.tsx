import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { GalleryItem } from '../types';
import { staggerContainer, fadeUp, inViewOnce } from '../lib/motion';
import SectionHead from './SectionHead';

interface Props {
  idAttr: string;
  eyebrow: string;
  title: string;
  aside: string;
  items: GalleryItem[];
}

/** Editorial horizontal scroll gallery — Mood C atelier style.
 *  Cards are wide (70vw on desktop, 85vw on mobile) for cinematic pacing.
 *  Empty slots render named dashed-border placeholders.
 *  Video items autoplay loop muted; image items show static bg-image. */
export default function Gallery({ idAttr, eyebrow, title, aside, items }: Props) {
  const scroller = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const controls = (
    <div className="flex gap-2 mt-4">
      <button
        onClick={() => scroll(-1)}
        aria-label="Önceki"
        className="w-12 h-12 border border-hair text-ink-mid hover:bg-bg-soft hover:border-ink-mid transition-all flex items-center justify-center font-serif text-xl"
      >
        ←
      </button>
      <button
        onClick={() => scroll(1)}
        aria-label="Sonraki"
        className="w-12 h-12 border border-hair text-ink-mid hover:bg-bg-soft hover:border-ink-mid transition-all flex items-center justify-center font-serif text-xl"
      >
        →
      </button>
    </div>
  );

  return (
    <section id={idAttr} className="py-24 md:py-32 bg-bg-soft/40">
      <SectionHead eyebrow={eyebrow} title={title} aside={aside} controls={controls} />

      <motion.div
        ref={scroller}
        className="flex gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide"
        style={{ scrollPaddingLeft: 'max(2rem, calc((100vw - 1280px) / 2 + 2rem))' }}
        variants={staggerContainer(0, 0.08)}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        <div className="flex-shrink-0 w-8 md:w-[max(2rem,calc((100vw-1280px)/2+2rem))]" aria-hidden="true" />

        {items.map((it, i) => (
          <motion.article
            key={i}
            variants={fadeUp}
            className="flex-shrink-0 w-[85vw] md:w-[60vw] lg:w-[44vw] snap-start flex flex-col gap-5"
          >
            {/* Media */}
            <div className="relative overflow-hidden aspect-[4/5] bg-bg-warm">
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
                <div className="w-full h-full flex items-center justify-center bg-bg">
                  <span className="px-6 py-3 border border-dashed border-ink-soft/60 font-sans text-xs tracking-widest uppercase text-ink-soft">
                    {it.name}
                  </span>
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-col gap-1.5 px-1">
              <div className="font-sans text-xs tracking-widest uppercase text-ink-soft">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="font-h3 text-ink">{it.name}</h3>
              {it.desc && (
                <p className="font-serif italic text-base text-ink-mid leading-relaxed max-w-[36ch]">
                  {it.desc}
                </p>
              )}
            </div>
          </motion.article>
        ))}

        <div className="flex-shrink-0 w-8" aria-hidden="true" />
      </motion.div>
    </section>
  );
}
