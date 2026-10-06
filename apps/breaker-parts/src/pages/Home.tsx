import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientIdle, useStaticMotion } from '@kervan/motion';
import OpeningHold from '../components/OpeningHold';
import Hero from '../components/Hero';
import Products from '../components/Products';
import WorkshopShowcase from '../components/WorkshopShowcase';
import BrandMarquee from '../components/BrandMarquee';
import Craft from '../components/Craft';
import Industries from '../components/Industries';
import Exports from '../components/Exports';
import Contact from '../components/Contact';
import type { DictBlock, Lang } from '../types';
import { localePath } from '../lib/locale-path';

// three.js is ~700 KB: load it as its own chunk, only here, once the page has painted.
const Scene = lazy(() => import('../components/Scene'));

interface Props {
  t: DictBlock;
  lang: Lang;
}

/**
 * Long-scroll home — the original kervan-website experience moved
 * verbatim. Scene + OpeningHold mount only here so other routes get a
 * clean dark layout without the cinematic 3D bg.
 *
 * Both exist only in the animated (js-anim) mode: the prerendered static
 * page (bots, no JS, reduced motion) starts straight at the hero. The
 * scene mounts after the first paint, when the browser is idle.
 */
export default function Home({ t, lang }: Props) {
  const navigate = useNavigate();
  const isStatic = useStaticMotion();
  const idle = useClientIdle();
  return (
    <>
      {/* 3D BG — vanilla Three.js, fixed full-viewport behind everything. */}
      {!isStatic && idle && (
        <Suspense fallback={null}>
          <Scene onSecret={() => navigate(localePath('/teknik-bilgiler', lang))} />
        </Suspense>
      )}

      <div className="app-root">
        {/* Cinematic opening hold — first viewport is just chisel + starfield. */}
        {!isStatic && <OpeningHold t={t} />}
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
