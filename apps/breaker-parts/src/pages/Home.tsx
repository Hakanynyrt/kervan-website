import { motion } from 'framer-motion';
import { fadeUp, inViewOnce } from '@kervan/motion';
import Hero from '../sections/Hero';
import ProductGrid from '../sections/ProductGrid';
import BrandStrip from '../sections/BrandStrip';
import QualityTeaser from '../sections/QualityTeaser';
import { UseDocTitle } from '../components/UseDocTitle';
import type { DictBlock, Lang } from '../types';

interface Props {
  t: DictBlock;
  lang: Lang;
}

export default function Home({ t, lang }: Props) {
  return (
    <>
      <UseDocTitle
        title="Kervan Breaker — Hidrolik kırıcı yedek parçaları"
        description="Keski, piston, burç, tie rod, tamir kiti, kama, alt gövde, saplama. Fabrika çıkışlı kalite, ısıl işlem garantili. 15+ marka uyumlu."
      />

      <Hero t={t} />

      <section id="urunler-on" className="py-20 md:py-32 bg-bg-soft/40">
        <motion.div
          className="max-w-[1280px] mx-auto px-6 md:px-8 mb-12 md:mb-16 grid grid-cols-12 gap-8 items-end"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
        >
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
            <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium">
              {t.productsPage.eyebrow}
            </span>
            <h2 className="font-serif italic text-h2 text-ink leading-[1.1] tracking-[-0.015em] whitespace-pre-line">
              {t.productsPage.title}
            </h2>
          </div>
          <p className="col-span-12 lg:col-span-5 font-serif italic text-lg text-ink-mid leading-relaxed max-w-[40ch]">
            {t.productsPage.aside}
          </p>
        </motion.div>

        <ProductGrid lang={lang} />
      </section>

      <BrandStrip t={t} />
      <QualityTeaser t={t} />
    </>
  );
}
