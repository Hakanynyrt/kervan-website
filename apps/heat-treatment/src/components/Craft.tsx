import { motion } from 'framer-motion';
import { fadeUp, inViewOnce, ScrollReveal, useReducedMotion } from '@kervan/motion';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

/**
 * Craft — atelier manifesto, heat-treatment voice.
 * Centered editorial copy block, italic Fraunces, generous whitespace,
 * then a row of real photos of our furnaces.
 */
export default function Craft({ t }: Props) {
  // Static (prerendered) mode and reduced motion render the final state.
  const reduce = useReducedMotion();
  return (
    <section
      id="tesisimiz"
      className="min-h-dvh flex flex-col justify-center py-20 md:py-32 border-y border-hair"
    >
      <motion.div
        className="max-w-[820px] mx-auto px-6 md:px-8 flex flex-col gap-10 items-start"
        variants={fadeUp}
        initial={reduce ? false : 'hidden'}
        whileInView="show"
        viewport={inViewOnce}
      >
        <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium">
          {t.craft.eyebrow}
        </span>
        <h2 className="font-serif italic text-h2 text-ink leading-[1.1] tracking-[-0.015em]">
          {t.craft.title}
        </h2>
        <ScrollReveal className="font-serif italic text-xl md:text-2xl text-ink-mid leading-relaxed max-w-[44ch]">
          {t.craft.body}
        </ScrollReveal>
      </motion.div>

      <motion.ul
        aria-label={t.craft.photosLabel}
        className="mt-14 md:mt-20 w-full max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none"
        variants={fadeUp}
        initial={reduce ? false : 'hidden'}
        whileInView="show"
        viewport={inViewOnce}
      >
        {t.craft.photos.map((p) => (
          <li key={p.base}>
            <figure className="m-0 flex flex-col gap-3">
              <img
                src={`/photos/isil-islem/${p.base}-1080.webp`}
                srcSet={`/photos/isil-islem/${p.base}-640.webp 640w, /photos/isil-islem/${p.base}-1080.webp 1080w`}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                width={1080}
                height={1350}
                alt={p.alt}
                loading="lazy"
                decoding="async"
                className="w-full aspect-[4/3] lg:aspect-[4/5] object-cover object-[50%_35%] rounded-md border border-hair bg-bg-soft"
              />
              <figcaption className="font-sans text-sm text-ink-mid">{p.caption}</figcaption>
            </figure>
          </li>
        ))}
      </motion.ul>
    </section>
  );
}
