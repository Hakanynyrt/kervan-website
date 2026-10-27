import { motion } from 'framer-motion';
import { fadeUp, inViewOnce, staggerContainer, useReducedMotion } from '@kervan/motion';
import { BRANDS } from '../data/brands';
import type { DictBlock } from '../types';
import { useLocale } from '../lib/locale-path';
import ShopLink from '../components/ShopLink';
import { SHOP_MAKE_PATH, shopUrl } from '../lib/shop';
import { KERVAN_SHOP_URL } from '@kervan/seo';

const SHOP_HOST = KERVAN_SHOP_URL.replace(/^https:\/\//, '');

interface Props {
  t: DictBlock;
}

export default function Brands({ t }: Props) {
  const reduce = useReducedMotion();
  const lang = useLocale();
  return (
    <>
      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <motion.div
          className="max-w-[1280px] mx-auto px-6 md:px-8 mb-16 md:mb-20 grid grid-cols-12 gap-x-0 gap-y-8 md:gap-x-8 items-end"
          variants={fadeUp}
          initial={reduce ? false : 'hidden'}
          animate="show"
        >
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
            <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium">
              {t.brands.eyebrow}
            </span>
            <h1 className="font-serif italic text-h1 text-ink leading-[1.05] tracking-[-0.02em]">
              {t.brands.pageTitle}
            </h1>
          </div>
          <p className="col-span-12 lg:col-span-5 font-serif italic text-lg text-ink-mid leading-relaxed max-w-[44ch]">
            {t.brands.pageAside}
          </p>
        </motion.div>

        <motion.ul
          className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-hair list-none m-0 p-0"
          variants={staggerContainer(0, 0.04)}
          initial={reduce ? false : 'hidden'}
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
                <span className="font-serif italic text-2xl text-ink-mid">{b.name}</span>
              )}
              <span className="font-sans text-xs tracking-[0.18em] uppercase text-ink-soft mt-2">
                {b.country}
              </span>
              {SHOP_MAKE_PATH[b.slug] && (
                <a
                  href={shopUrl(SHOP_MAKE_PATH[b.slug]!, lang)}
                  hrefLang={lang}
                  className="inline-flex min-h-11 items-center text-center font-sans text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                >
                  {/* Colour on the span: the global `a { color: inherit }` outranks utilities. */}
                  <span className="text-brand underline decoration-1 underline-offset-4 hover:text-brand-hi">
                    {t.shop.makeLink(b.name)} — {SHOP_HOST}
                  </span>
                </a>
              )}
            </motion.li>
          ))}
        </motion.ul>
        <div className="max-w-[1280px] mx-auto px-6 md:px-8 mt-10 md:mt-12">
          <ShopLink lang={lang} path="/kirici-ucu" text={t.shop.brandsCta} />
        </div>
      </section>
    </>
  );
}
