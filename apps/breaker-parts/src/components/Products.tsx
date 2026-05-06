import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SectionHeading } from '@kervan/ui';
import { staggerContainer, fadeUp, inViewOnce } from '../lib/motion';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

export default function Products({ t }: Props) {
  return (
    <section
      id="products"
      data-scene-pose="products"
      className="min-h-dvh flex flex-col justify-center py-8 md:py-16"
    >
      <SectionHeading
        eyebrow={t.products.eyebrow}
        title={t.products.title}
        aside={t.products.aside}
      />

      <motion.div
        className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8"
        variants={staggerContainer(0, 0.12)}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        {t.products.items.map((p, i) => {
          const Wrapper = p.slug
            ? ({ children }: { children: React.ReactNode }) => (
                <Link
                  to={`/urunler/${p.slug}`}
                  className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {children}
                </Link>
              )
            : ({ children }: { children: React.ReactNode }) => <>{children}</>;

          return (
            <motion.article
              key={i}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col gap-2 md:gap-5"
            >
              <Wrapper>
                <div className="relative overflow-hidden aspect-[5/4] md:aspect-[4/5] bg-bg-soft">
                  <motion.div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${p.img})` }}
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <span className="absolute top-4 left-4 font-sans text-xs tracking-widest text-ink/90 z-10">
                    0{i + 1}
                  </span>
                </div>
                <div className="flex flex-col gap-1 md:gap-2 mt-2 md:mt-5">
                  <h3 className="font-serif italic text-xl md:text-3xl text-ink leading-tight">
                    {p.name}
                  </h3>
                  <p className="font-sans text-xs md:text-sm text-ink-mid leading-snug md:leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </Wrapper>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
