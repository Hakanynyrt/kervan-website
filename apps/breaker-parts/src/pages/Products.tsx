import { motion } from 'framer-motion';
import { fadeUp, inViewOnce, useReducedMotion } from '@kervan/motion';
import ProductGrid from '../sections/ProductGrid';
import ShopLink from '../components/ShopLink';
import type { DictBlock, Lang } from '../types';

interface Props {
  t: DictBlock;
  lang: Lang;
}

export default function Products({ t, lang }: Props) {
  const reduce = useReducedMotion();
  return (
    <>
      <section className="pt-10 pb-12 md:pt-16 md:pb-16">
        <motion.div
          className="max-w-[1280px] mx-auto px-6 md:px-8 mb-12 md:mb-20 grid grid-cols-12 gap-x-0 gap-y-8 md:gap-x-8 items-end"
          variants={fadeUp}
          initial={reduce ? false : 'hidden'}
          animate="show"
        >
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
            <h1 className="font-sans font-bold text-[34px] md:text-[48px] text-ink leading-[1.08] tracking-[-0.03em] text-balance whitespace-pre-line">
              {t.productsPage.title}
            </h1>
          </div>
          <motion.p
            className="col-span-12 lg:col-span-5 font-sans text-lg text-ink-mid leading-relaxed max-w-[40ch]"
            variants={fadeUp}
            initial={reduce ? false : 'hidden'}
            whileInView="show"
            viewport={inViewOnce}
          >
            {t.productsPage.aside}
          </motion.p>
        </motion.div>

        <ProductGrid lang={lang} />
        <div className="max-w-[1280px] mx-auto px-6 md:px-8 mt-10 md:mt-12">
          <ShopLink lang={lang} path="/yedek-parca" text={t.shop.listCta} />
        </div>
      </section>
    </>
  );
}
