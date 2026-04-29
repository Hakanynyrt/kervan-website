import { motion } from 'framer-motion';
import type { DictBlock } from '../types';
import { staggerContainer, fadeUp, inViewOnce } from '../lib/motion';
import SectionHead from './SectionHead';

interface Props {
  t: DictBlock;
}

export default function Products({ t }: Props) {
  return (
    <section id="products" className="py-24 md:py-32">
      <SectionHead
        eyebrow={t.products.eyebrow}
        title={t.products.title}
        aside={t.products.aside}
      />

      <motion.div
        className="max-w-[1280px] mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        variants={staggerContainer(0, 0.12)}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        {t.products.items.map((p, i) => (
          <motion.article
            key={i}
            variants={fadeUp}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="group flex flex-col gap-5"
          >
            <div className="relative overflow-hidden aspect-[4/5] bg-bg-soft">
              <motion.div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${p.img})` }}
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
              <span className="absolute top-4 left-4 font-sans text-xs tracking-widest text-bg/90 z-10">
                0{i + 1}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-h3 text-ink">{p.name}</h3>
              <p className="font-sans text-sm text-ink-mid leading-relaxed">{p.desc}</p>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
