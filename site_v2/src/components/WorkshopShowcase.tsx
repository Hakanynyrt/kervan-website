import type { DictBlock } from '../types';
import SectionHead from './SectionHead';
import StackedCarousel from './StackedCarousel';

interface Props {
  t: DictBlock;
}

/**
 * WorkshopShowcase — atelier'in içinden 7 kart: video + foto karışık.
 * Stacked 3D carousel layout (testimonials-card pattern). Aktif kart önde,
 * ±1/±2 kartlar arkada hafif rotation+scale ile yığılı. Prev/next ile gez.
 *
 * Videolar IntersectionObserver ile sadece görünürken oynar (girişte sessiz).
 */
export default function WorkshopShowcase({ t }: Props) {
  return (
    <section id="atolye" className="min-h-dvh snap-start flex flex-col justify-center py-16 md:py-24">
      <SectionHead
        eyebrow={t.atolye.eyebrow}
        title={t.atolye.title}
        aside={t.atolye.aside}
      />
      <StackedCarousel items={t.atolye.items} />
    </section>
  );
}
