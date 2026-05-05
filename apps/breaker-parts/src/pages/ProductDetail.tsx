import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { fadeUp, inViewOnce, kenBurns } from '@kervan/motion';
import { PRODUCT_BY_SLUG } from '../data/products';
import { BRANDS } from '../data/brands';
import { UseDocTitle } from '../components/UseDocTitle';
import type { DictBlock, Lang } from '../types';

interface Props {
  t: DictBlock;
  lang: Lang;
}

export default function ProductDetail({ t, lang }: Props) {
  const { slug = '' } = useParams<{ slug: string }>();
  const product = PRODUCT_BY_SLUG[slug];

  if (!product) {
    return (
      <>
        <UseDocTitle title="404 — Kervan Breaker" />
        <section className="min-h-[60dvh] flex flex-col justify-center items-center pt-32 pb-16 text-center px-6">
          <h1 className="font-serif italic text-h2 text-ink mb-6">{t.productDetail.notFound}</h1>
          <Link
            to="/urunler"
            className="font-sans text-sm tracking-[0.16em] uppercase text-brand hover:text-brand-hi transition-colors"
          >
            {t.productDetail.notFoundCta} →
          </Link>
        </section>
      </>
    );
  }

  const loc = product[lang];
  const quoteHref = `/iletisim?part=${encodeURIComponent(product.slug)}`;

  return (
    <>
      <UseDocTitle
        title={`${loc.name} — Kervan Breaker`}
        description={loc.tagline}
      />

      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8">
          <Link
            to="/urunler"
            className="inline-block font-sans text-xs tracking-[0.2em] uppercase text-ink-soft hover:text-ink transition-colors mb-8"
          >
            {t.productDetail.backLink}
          </Link>

          <div className="grid grid-cols-12 gap-8 md:gap-12 items-start">
            {/* Photo / placeholder — left, sticky on desktop */}
            <motion.div
              className="col-span-12 lg:col-span-6 lg:sticky lg:top-24"
              initial="hidden"
              animate="show"
              variants={kenBurns}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-hair bg-bg-soft">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={loc.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      background:
                        'radial-gradient(ellipse at 30% 30%, rgba(232,67,27,0.18), transparent 60%), linear-gradient(135deg, #1C1C20, #141416)',
                    }}
                  >
                    <span className="font-serif italic text-4xl md:text-5xl text-ink-mid opacity-60 px-6 text-center">
                      {loc.name}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Info — right */}
            <motion.div
              className="col-span-12 lg:col-span-6 flex flex-col gap-8"
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <header className="flex flex-col gap-4">
                <h1 className="font-serif italic text-h1 text-ink leading-[1.0] tracking-[-0.02em]">
                  {loc.name}
                </h1>
                <p className="font-serif italic text-xl md:text-2xl text-ink-mid leading-snug max-w-[44ch]">
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
                  initial="hidden"
                  whileInView="show"
                  viewport={inViewOnce}
                >
                  {product.subTypes.map((st) => {
                    const stLoc = st[lang];
                    return (
                      <li key={st.slug} className="py-4 flex flex-col gap-1">
                        <span className="font-serif italic text-xl text-ink">
                          {stLoc.name}
                        </span>
                        <span className="font-sans text-sm text-ink-mid">
                          {stLoc.desc}
                        </span>
                      </li>
                    );
                  })}
                </motion.ul>
              )}

              {/* Specs grid */}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 m-0">
                <div className="flex flex-col gap-2 border-t border-hair pt-4">
                  <dt className="font-sans text-xs tracking-[0.2em] uppercase text-ink-soft">
                    {t.productDetail.materialsLabel}
                  </dt>
                  <dd className="font-serif italic text-lg text-ink m-0">
                    42CrMo · 42CrMoA
                  </dd>
                </div>
                <div className="flex flex-col gap-2 border-t border-hair pt-4">
                  <dt className="font-sans text-xs tracking-[0.2em] uppercase text-ink-soft">
                    {t.productDetail.sizesLabel}
                  </dt>
                  <dd className="font-sans text-sm text-ink-mid leading-relaxed m-0">
                    {t.productDetail.sizesNote}
                  </dd>
                </div>
                <div className="sm:col-span-2 flex flex-col gap-2 border-t border-hair pt-4">
                  <dt className="font-sans text-xs tracking-[0.2em] uppercase text-ink-soft">
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
                className="self-start mt-2 bg-brand text-bg px-7 py-3 font-sans text-sm tracking-wide hover:bg-brand-hi transition-colors"
              >
                {t.productDetail.quoteCta}
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
