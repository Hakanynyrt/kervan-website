import { motion } from 'framer-motion';
import { fadeUp, inViewOnce, useReducedMotion } from '@kervan/motion';
import type { DictBlock } from '../types';
import { H2, SECTION, WRAP } from '../lib/ui';

interface Props {
  t: DictBlock;
}

/**
 * Tesisimiz (`#tesisimiz`): the heading and one paragraph side by side, then four real photos
 * of our furnaces with captions (two columns on phones).
 */
export default function Craft({ t }: Props) {
  // Static (prerendered) mode and reduced motion render the final state.
  const reduce = useReducedMotion();
  return (
    <section id="tesisimiz" aria-labelledby="tesisimiz-title" className={`${SECTION} bg-bg`}>
      <div className={WRAP}>
        <motion.div
          className="grid grid-cols-1 gap-3.5 mb-7 min-[721px]:grid-cols-[5fr_7fr] min-[721px]:gap-14 min-[721px]:mb-12 items-start"
          variants={fadeUp}
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={inViewOnce}
        >
          <h2 id="tesisimiz-title" className={H2}>
            {t.craft.title}
          </h2>
          <p className="m-0 font-sans text-base min-[721px]:text-[17px] text-ink-mid max-w-[620px]">
            {t.craft.body}
          </p>
        </motion.div>

        <motion.ul
          aria-label={t.craft.photosLabel}
          className="list-none m-0 p-0 grid grid-cols-2 gap-3 min-[721px]:grid-cols-4"
          variants={fadeUp}
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={inViewOnce}
        >
          {t.craft.photos.map((p) => (
            <li key={p.base}>
              <figure className="m-0">
                <img
                  src={`/photos/isil-islem/${p.base}-1080.webp`}
                  srcSet={`/photos/isil-islem/${p.base}-640.webp 640w, /photos/isil-islem/${p.base}-1080.webp 1080w`}
                  sizes="(min-width: 721px) 25vw, 50vw"
                  width={1080}
                  height={1350}
                  alt={p.alt}
                  loading="lazy"
                  decoding="async"
                  className="block w-full aspect-[3/4] object-cover object-[50%_35%] rounded-[4px] bg-photo-shade"
                />
                <figcaption className="mt-2.5 font-sans text-[13px] min-[721px]:text-sm text-ink-mid">
                  {p.caption}
                </figcaption>
              </figure>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
