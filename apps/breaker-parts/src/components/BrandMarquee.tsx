import { motion } from 'framer-motion';
import type { DictBlock } from '../types';
import { fadeUp, inViewOnce } from '../lib/motion';

interface Props {
  t: DictBlock;
}

/** Dict's display name → file slug. Plain ASCII normalisation: lowercase,
 *  drop non-letter chars, collapse spaces to dashes. "D&A" → "da". */
const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

/**
 * BrandMarquee — sonsuz kayan iki şerit, ters yönde, perspektifle eğik.
 * Tile içinde `/brand-logos/<slug>.svg` — wordmark placeholder veya gerçek
 * marka logosu. Dosyayı aynı isimle değiştirince kod değişmez.
 */
export default function BrandMarquee({ t }: Props) {
  const items = [...t.brands.items, ...t.brands.items]; // seamless loop

  return (
    <section data-scene-pose="brands"
      className="min-h-dvh flex flex-col justify-center py-16 md:py-24 border-y border-hair overflow-hidden"
      style={{ perspective: '1500px' }}
    >
      <motion.div
        className="max-w-[1280px] mx-auto px-6 md:px-8 mb-12 md:mb-16 flex flex-col gap-4"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
      >
        <div className="font-eyebrow">{t.brands.eyebrow}</div>
        <h2 className="font-h3 italic text-ink max-w-[40ch]">{t.brands.title}</h2>
      </motion.div>

      {/* Top row — slides left, tilted up */}
      <div className="overflow-hidden whitespace-nowrap py-4" style={{ transformStyle: 'preserve-3d' }}>
        <motion.div
          className="inline-flex gap-6"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 60, ease: 'linear', repeat: Infinity }}
          style={{ transform: 'rotateX(10deg)', transformStyle: 'preserve-3d' }}
        >
          {items.map((b, i) => (
            <BrandTile key={`a-${i}`} name={b} slug={slug(b)} z={(i % 2 === 0 ? 30 : 18)} skewY={i % 2 === 0 ? 3 : -3} />
          ))}
        </motion.div>
      </div>

      {/* Bottom row — slides right, tilted down */}
      <div className="overflow-hidden whitespace-nowrap py-4 mt-2" style={{ transformStyle: 'preserve-3d' }}>
        <motion.div
          className="inline-flex gap-6"
          animate={{ x: ['-50%', '0%'] }}
          transition={{ duration: 75, ease: 'linear', repeat: Infinity }}
          style={{ transform: 'rotateX(-10deg)', transformStyle: 'preserve-3d' }}
        >
          {items.map((b, i) => (
            <BrandTile key={`b-${i}`} name={b} slug={slug(b)} z={(i % 2 === 0 ? 18 : 30)} skewY={i % 2 === 0 ? -3 : 3} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

interface TileProps {
  name: string;
  slug: string;
  /** Z-translation for depth — higher = closer to viewer */
  z: number;
  /** Per-tile rotateY for "rack" 3D feel */
  skewY: number;
}

/**
 * Single brand tile. Bordered plate with a soft inner-top highlight
 * (gradient overlay) for a metallic feel; image is the wordmark or a
 * dropped-in real logo, sized by max-h.
 */
function BrandTile({ name, slug, z, skewY }: TileProps) {
  return (
    <span
      className="relative inline-flex items-center justify-center px-8 py-4 border border-hair bg-bg-soft/40 min-w-[200px] h-[68px]"
      style={{
        transform: `translateZ(${z}px) rotateY(${skewY}deg)`,
        boxShadow: '0 6px 18px rgba(0,0,0,0.45), inset 0 1px 0 rgba(232,226,214,0.06)',
      }}
    >
      {/* Inner top highlight — thin metallic gloss */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{
          background: 'linear-gradient(180deg, rgba(232,226,214,0.05), transparent)',
        }}
      />
      <img
        src={`/brand-logos/${slug}.svg`}
        alt={name}
        loading="lazy"
        className="relative z-10 h-7 md:h-8 max-w-[180px] object-contain select-none"
        draggable={false}
      />
    </span>
  );
}
