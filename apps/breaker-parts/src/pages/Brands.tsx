import { motion } from 'framer-motion';
import { fadeUp, inViewOnce, staggerContainer } from '@kervan/motion';
import { BRANDS } from '../data/brands';
import { UseDocTitle } from '../components/UseDocTitle';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

export default function Brands({ t }: Props) {
  return (
    <>
      <UseDocTitle
        title="Marka Uyumluluk — Kervan Breaker"
        description="Atlas Copco, Furukawa, Soosan, Indeco, NPK, Rammer, Montabert, Epiroc, Sandvik, Toku, Kobelco, Hanwoo, Krupp, D&A, MTB."
      />

      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <motion.div
          className="max-w-[1280px] mx-auto px-6 md:px-8 mb-16 md:mb-20 grid grid-cols-12 gap-8 items-end"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
            <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium">
              {t.brandsPage.eyebrow}
            </span>
            <h1 className="font-serif italic text-h1 text-ink leading-[1.05] tracking-[-0.02em]">
              {t.brandsPage.title}
            </h1>
          </div>
          <p className="col-span-12 lg:col-span-5 font-serif italic text-lg text-ink-mid leading-relaxed max-w-[44ch]">
            {t.brandsPage.aside}
          </p>
        </motion.div>

        <motion.ul
          className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-hair list-none m-0 p-0"
          variants={staggerContainer(0, 0.04)}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
        >
          {BRANDS.map((b) => (
            <motion.li
              key={b.slug}
              variants={fadeUp}
              className="bg-bg p-6 md:p-8 flex flex-col items-center justify-center gap-3 min-h-[160px]"
            >
              {b.logo ? (
                <img
                  src={`/brand-logos/${b.logo}.svg`}
                  alt={b.name}
                  className="h-10 md:h-12 w-auto opacity-80"
                  loading="lazy"
                />
              ) : (
                <span className="font-serif italic text-2xl text-ink-mid">
                  {b.name}
                </span>
              )}
              <span className="font-sans text-xs tracking-[0.18em] uppercase text-ink-soft mt-2">
                {b.country}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </section>
    </>
  );
}
