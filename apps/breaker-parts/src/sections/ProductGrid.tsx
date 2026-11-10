import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fadeUp, inViewOnce, useReducedMotion } from '@kervan/motion';
import { localePath } from '../lib/locale-path';
import { PRODUCTS } from '../data/products';
import { DICT } from '../lib/dict';
import { WRAP } from '../lib/ui';
import type { Lang } from '../types';

interface Props {
  lang: Lang;
  /** Optional: limit how many products to show (e.g. 9 for full, 3 for teaser). */
  limit?: number;
}

export default function ProductGrid({ lang, limit }: Props) {
  const items = limit ? PRODUCTS.slice(0, limit) : PRODUCTS;
  const reduce = useReducedMotion();

  return (
    <div className={WRAP}>
      {/* One reveal per card: a reveal on the whole grid (about 3,800 px on a phone) never fires. */}
      <div className="kv-ruled grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => {
          const loc = p[lang];
          return (
            <motion.article
              key={p.slug}
              className="group"
              variants={fadeUp}
              initial={reduce ? false : 'hidden'}
              whileInView="show"
              viewport={inViewOnce}
            >
              <Link
                to={localePath(`/urunler/${p.slug}`, lang)}
                className="flex flex-col h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-bg-soft">
                  {p.image ? (
                    <img
                      src={p.image}
                      srcSet={p.imageSrcSet}
                      sizes={
                        p.imageSrcSet
                          ? '(min-width: 1024px) 416px, (min-width: 640px) 50vw, 100vw'
                          : undefined
                      }
                      alt={DICT[lang].productPhotoAlt[p.slug]?.grid ?? loc.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                  ) : (
                    <Placeholder label={loc.name} />
                  )}
                  {p.image && p.illustrative && (
                    <span className="kv-chip absolute right-2 bottom-2 font-sans pointer-events-none">
                      {DICT[lang].productDetail.illustrativeNote}
                    </span>
                  )}
                </div>
                <div className="p-6 md:p-8 flex flex-col gap-3 flex-1">
                  <h3 className="font-sans font-bold text-2xl text-ink leading-tight tracking-[-0.02em]">
                    {loc.name}
                  </h3>
                  <p className="font-sans text-sm text-ink-mid leading-relaxed flex-1">
                    {loc.tagline}
                  </p>
                  <span className="font-sans text-sm font-medium text-brand mt-2 inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                    {DICT[lang].productsPage.detail} <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

interface PlaceholderProps {
  label: string;
}

/** Stylized fallback for products without a real photo yet. Renders a
 *  flat panel with the part name — keeps the grid rhythm
 *  intact until we shoot studio images in Faz 6. */
function Placeholder({ label }: PlaceholderProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg-soft">
      <span className="font-sans font-bold text-2xl md:text-3xl text-ink-mid px-6 text-center">
        {label}
      </span>
    </div>
  );
}
