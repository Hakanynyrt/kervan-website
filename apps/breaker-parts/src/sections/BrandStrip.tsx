import { Marquee } from '@kervan/ui';
import { BRANDS } from '../data/brands';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

export default function BrandStrip({ t }: Props) {
  const items = BRANDS.map((b) =>
    b.logo ? (
      <img
        key={b.slug}
        src={`/brand-logos/${b.logo}.svg`}
        alt={b.name}
        className="h-8 md:h-10 w-auto opacity-70 hover:opacity-100 transition-opacity"
        loading="lazy"
      />
    ) : (
      <span
        key={b.slug}
        className="font-serif italic text-2xl md:text-3xl text-ink-mid opacity-70"
      >
        {b.name}
      </span>
    ),
  );

  return (
    <section className="py-16 md:py-24 border-y border-hair bg-bg-soft/30">
      <div className="max-w-[1280px] mx-auto px-6 md:px-8 mb-8 md:mb-12">
        <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium block mb-3">
          {t.brandStrip.eyebrow}
        </span>
        <h2 className="font-serif italic text-3xl md:text-5xl text-ink leading-tight max-w-[28ch]">
          {t.brandStrip.title}
        </h2>
      </div>

      <Marquee items={items} duration={50} className="py-4" />
    </section>
  );
}
