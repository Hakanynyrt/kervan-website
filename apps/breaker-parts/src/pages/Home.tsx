import Hero from '../components/Hero';
import Products from '../components/Products';
import WorkshopShowcase from '../components/WorkshopShowcase';
import BrandMarquee from '../components/BrandMarquee';
import Craft from '../components/Craft';
import Industries from '../components/Industries';
import Exports from '../components/Exports';
import Contact from '../components/Contact';
import type { DictBlock, Lang } from '../types';

interface Props {
  t: DictBlock;
  lang: Lang;
}

/** Long-scroll home: the hero is the first screen, the sections follow. */
export default function Home({ t, lang }: Props) {
  return (
    <div className="app-root">
      <Hero t={t} />
      <Products t={t} />
      <WorkshopShowcase t={t} />
      <BrandMarquee t={t} />
      <Craft t={t} />
      <Industries t={t} />
      <Exports t={t} lang={lang} />
      <Contact t={t} />
    </div>
  );
}
