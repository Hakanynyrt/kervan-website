import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { fadeUp, inViewOnce, kenBurns, useReducedMotion } from '@kervan/motion';
import { PRODUCT_BY_SLUG } from '../data/products';
import { BRANDS } from '../data/brands';
import type { DictBlock, Lang } from '../types';
import { localePath } from '../lib/locale-path';
import { SHOP_PATH } from '../lib/shop';
import ShopLink from '../components/ShopLink';

interface Props {
  t: DictBlock;
  lang: Lang;
}

export default function ProductDetail({ t, lang }: Props) {
  const reduce = useReducedMotion();
  const { slug = '' } = useParams<{ slug: string }>();
  const product = PRODUCT_BY_SLUG[slug];

  if (!product) {
    return (
      <>
        <section className="min-h-[60dvh] flex flex-col justify-center items-center pt-10 pb-16 text-center px-6">
          <h1 className="font-sans font-bold text-[30px] md:text-[40px] text-ink leading-[1.1] tracking-[-0.03em] text-balance mb-6">
            {t.productDetail.notFound}
          </h1>
          <Link
            to={localePath('/urunler', lang)}
            className="font-sans text-[15px] font-semibold text-brand hover:text-brand-hi transition-colors"
          >
            {t.productDetail.notFoundCta} →
          </Link>
        </section>
      </>
    );
  }

  const loc = product[lang];
  const quoteHref = localePath(`/iletisim?part=${encodeURIComponent(product.slug)}`, lang);
  const shopPath = SHOP_PATH[product.slug];

  return (
    <>
      <section className="pt-10 pb-16 md:pt-16 md:pb-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          <Link
            to={localePath('/urunler', lang)}
            className="inline-flex items-center min-h-11 font-sans text-sm font-medium text-ink-mid hover:text-ink transition-colors mb-6"
          >
            {t.productDetail.backLink}
          </Link>

          <div className="grid grid-cols-12 gap-x-0 gap-y-8 md:gap-12 items-start">
            {/* Photo / placeholder — left, sticky on desktop */}
            <motion.div
              className="col-span-12 lg:col-span-6 lg:sticky lg:top-24"
              initial={reduce ? false : 'hidden'}
              animate="show"
              variants={kenBurns}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-[4px] border border-hair bg-bg-soft">
                {product.image ? (
                  <img
                    src={product.image}
                    srcSet={product.imageSrcSet}
                    sizes={
                      product.imageSrcSet
                        ? '(min-width: 1280px) 616px, (min-width: 1024px) 50vw, 100vw'
                        : undefined
                    }
                    alt={loc.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-bg-soft">
                    <span className="font-sans font-bold text-3xl md:text-4xl text-ink-mid px-6 text-center">
                      {loc.name}
                    </span>
                  </div>
                )}
              </div>
              {product.image && product.illustrative && (
                <p className="mt-3 font-sans text-xs tracking-[0.04em] text-ink-soft">
                  {t.productDetail.illustrativeNote}
                </p>
              )}
            </motion.div>

            {/* Info — right */}
            <motion.div
              className="col-span-12 lg:col-span-6 flex flex-col gap-8"
              variants={fadeUp}
              initial={reduce ? false : 'hidden'}
              animate="show"
            >
              <header className="flex flex-col gap-4">
                <h1 className="font-sans font-bold text-[34px] md:text-[48px] text-ink leading-[1.08] tracking-[-0.03em] text-balance">
                  {loc.name}
                </h1>
                <p className="font-sans text-lg md:text-xl text-ink-mid leading-snug max-w-[44ch]">
                  {loc.tagline}
                </p>
              </header>

              <p className="font-sans text-base md:text-lg text-ink-mid leading-relaxed max-w-[60ch]">
                {loc.body}
              </p>

              {/* Sub-types — only chisel has them today */}
              {product.subTypes && product.subTypes.length > 0 && (
                <motion.ul
                  className="flex flex-col divide-y divide-hair border-y border-hair m-0 p-0 list-none"
                  variants={fadeUp}
                  initial={reduce ? false : 'hidden'}
                  whileInView="show"
                  viewport={inViewOnce}
                >
                  {product.subTypes.map((st) => {
                    const stLoc = st[lang];
                    return (
                      <li key={st.slug} className="py-4 flex flex-col gap-1">
                        <span className="font-sans font-semibold text-xl text-ink">
                          {stLoc.name}
                        </span>
                        <span className="font-sans text-sm text-ink-mid">{stLoc.desc}</span>
                      </li>
                    );
                  })}
                </motion.ul>
              )}

              {/* Specs grid */}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 m-0">
                <div className="flex flex-col gap-2 border-t border-hair pt-4">
                  <dt className="font-sans text-sm font-medium text-ink-soft">
                    {t.productDetail.materialsLabel}
                  </dt>
                  <dd className="font-sans font-semibold text-lg text-ink m-0">42CrMo · 42CrMoA</dd>
                </div>
                <div className="flex flex-col gap-2 border-t border-hair pt-4">
                  <dt className="font-sans text-sm font-medium text-ink-soft">
                    {t.productDetail.sizesLabel}
                  </dt>
                  <dd className="font-sans text-sm text-ink-mid leading-relaxed m-0">
                    {t.productDetail.sizesNote}
                  </dd>
                </div>
                <div className="sm:col-span-2 flex flex-col gap-2 border-t border-hair pt-4">
                  <dt className="font-sans text-sm font-medium text-ink-soft">
                    {t.productDetail.brandFitsLabel}
                  </dt>
                  <dd className="font-sans text-sm text-ink-mid m-0 flex flex-wrap gap-x-3 gap-y-1.5">
                    {BRANDS.map((b) => (
                      <span key={b.slug}>{b.name}</span>
                    ))}
                  </dd>
                </div>
              </dl>

              <Link
                to={quoteHref}
                className="self-start mt-2 bg-brand text-on-brand rounded-[2px] font-semibold px-7 py-3 font-sans text-sm tracking-wide hover:bg-brand-hi transition-colors"
              >
                {t.productDetail.quoteCta}
              </Link>
              {shopPath && (
                <ShopLink
                  lang={lang}
                  path={shopPath}
                  text={t.shop.productCta}
                  className="self-start"
                />
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
