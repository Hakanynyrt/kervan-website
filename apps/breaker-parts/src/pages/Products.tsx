import { motion } from 'framer-motion';
import {
  PageMeta,
  JsonLd,
  breadcrumbList,
  itemList,
  KERVAN_BREAKER_URL,
} from '@kervan/seo';
import { fadeUp, inViewOnce } from '@kervan/motion';
import ProductGrid from '../sections/ProductGrid';
import { PRODUCTS } from '../data/products';
import type { DictBlock, Lang } from '../types';

interface Props {
  t: DictBlock;
  lang: Lang;
}

export default function Products({ t, lang }: Props) {
  return (
    <>
      <PageMeta
        title="Ürünler — Kervan Breaker"
        description="Hidrolik kırıcı yedek parçalarımız: keski, piston, burç, tie rod, tamir kiti, kama, alt gövde, saplama, yan saplama."
        canonical={`${KERVAN_BREAKER_URL}/urunler`}
        image={`${KERVAN_BREAKER_URL}/og.png`}
      />
      <JsonLd
        schema={breadcrumbList([
          { name: 'Anasayfa', url: `${KERVAN_BREAKER_URL}/` },
          { name: 'Ürünler', url: `${KERVAN_BREAKER_URL}/urunler` },
        ])}
      />
      <JsonLd
        schema={itemList({
          name: 'Hidrolik kırıcı yedek parçaları',
          items: PRODUCTS.map((p) => ({
            name: p[lang].name,
            url: `${KERVAN_BREAKER_URL}/urunler/${p.slug}`,
            description: p[lang].tagline,
            image: p.image ? `${KERVAN_BREAKER_URL}${p.image}` : undefined,
          })),
        })}
      />

      <section className="pt-32 pb-12 md:pt-40 md:pb-16">
        <motion.div
          className="max-w-[1280px] mx-auto px-6 md:px-8 mb-12 md:mb-20 grid grid-cols-12 gap-8 items-end"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
            <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium">
              {t.productsPage.eyebrow}
            </span>
            <h1 className="font-serif italic text-h1 text-ink leading-[1.05] tracking-[-0.02em] whitespace-pre-line">
              {t.productsPage.title}
            </h1>
          </div>
          <motion.p
            className="col-span-12 lg:col-span-5 font-serif italic text-lg text-ink-mid leading-relaxed max-w-[40ch]"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={inViewOnce}
          >
            {t.productsPage.aside}
          </motion.p>
        </motion.div>

        <ProductGrid lang={lang} />
      </section>
    </>
  );
}
