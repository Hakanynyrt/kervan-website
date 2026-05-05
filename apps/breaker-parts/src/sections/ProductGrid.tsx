import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fadeUp, inViewOnce, staggerContainer } from '@kervan/motion';
import { PRODUCTS } from '../data/products';
import type { Lang } from '../types';

interface Props {
  lang: Lang;
  /** Optional: limit how many products to show (e.g. 9 for full, 3 for teaser). */
  limit?: number;
}

export default function ProductGrid({ lang, limit }: Props) {
  const items = limit ? PRODUCTS.slice(0, limit) : PRODUCTS;

  return (
    <motion.div
      className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-hair"
      variants={staggerContainer(0, 0.06)}
      initial="hidden"
      whileInView="show"
      viewport={inViewOnce}
    >
      {items.map((p) => {
        const loc = p[lang];
        return (
          <motion.article key={p.slug} variants={fadeUp} className="bg-bg group">
            <Link
              to={`/urunler/${p.slug}`}
              className="flex flex-col h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-bg-soft">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={loc.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                ) : (
                  <Placeholder label={loc.name} />
                )}
              </div>
              <div className="p-6 md:p-8 flex flex-col gap-3 flex-1">
                <h3 className="font-serif italic text-2xl md:text-3xl text-ink leading-tight">
                  {loc.name}
                </h3>
                <p className="font-sans text-sm text-ink-mid leading-relaxed flex-1">
                  {loc.tagline}
                </p>
                <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand mt-2 inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  Detay <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          </motion.article>
        );
      })}
    </motion.div>
  );
}

interface PlaceholderProps {
  label: string;
}

/** Stylized fallback for products without a real photo yet. Renders a
 *  soft gradient with the part name in italic — keeps the grid rhythm
 *  intact until we shoot studio images in Faz 6. */
function Placeholder({ label }: PlaceholderProps) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse at 30% 30%, rgba(232,67,27,0.18), transparent 60%), linear-gradient(135deg, #1C1C20, #141416)',
      }}
    >
      <span className="font-serif italic text-2xl md:text-3xl text-ink-mid opacity-60 px-6 text-center">
        {label}
      </span>
    </div>
  );
}
