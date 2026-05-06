import Scene from '../components/Scene';
import OpeningHold from '../components/OpeningHold';
import Hero from '../components/Hero';
import Products from '../components/Products';
import WorkshopShowcase from '../components/WorkshopShowcase';
import BrandMarquee from '../components/BrandMarquee';
import Craft from '../components/Craft';
import Industries from '../components/Industries';
import Exports from '../components/Exports';
import Contact from '../components/Contact';
import { UseDocTitle } from '../components/UseDocTitle';
import type { DictBlock, Lang } from '../types';

interface Props {
  t: DictBlock;
  lang: Lang;
}

/**
 * Long-scroll home — the original kervan-website experience moved
 * verbatim. Scene + OpeningHold mount only here so other routes get a
 * clean dark layout without the cinematic 3D bg.
 */
export default function Home({ t, lang }: Props) {
  return (
    <>
      <UseDocTitle
        title="Kervan Breaker — Hidrolik kırıcı yedek parçaları"
        description="Keski, piston, burç, sızdırmazlık. 22 yıllık zanaat, 40+ kırıcı markası uyumlu."
      />

      {/* 3D BG — vanilla Three.js, fixed full-viewport behind everything. */}
      <Scene />

      <div className="app-root">
        {/* Cinematic opening hold — first viewport is just chisel + starfield. */}
        <OpeningHold t={t} />
        <Hero t={t} />
        <Products t={t} />
        <WorkshopShowcase t={t} />
        <BrandMarquee t={t} />
        <Craft t={t} />
        <Industries t={t} />
        <Exports t={t} lang={lang} />
        <Contact t={t} />
      </div>
    </>
  );
}
