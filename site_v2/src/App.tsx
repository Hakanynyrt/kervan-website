import { lazy, Suspense, useEffect, useState } from 'react';
import { useLang } from './lib/use-lang';
import { DICT } from './lib/dict';
import ErrorBoundary from './components/ErrorBoundary';
import IntroOverlay from './components/IntroOverlay';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Products from './components/Products';
import WorkshopShowcase from './components/WorkshopShowcase';
import BrandMarquee from './components/BrandMarquee';
import Craft from './components/Craft';
import Industries from './components/Industries';
import Contact from './components/Contact';
import Footer from './components/Footer';

const Scene = lazy(() => import('./components/Scene'));

export default function App() {
  const [lang, setLang] = useLang();
  const t = DICT[lang];

  // Scene'i ilk paint sonrası mount et — content görünür kalsın bile 3D
  // başarısız olsa. ErrorBoundary + Suspense iki katlı savunma.
  const [sceneReady, setSceneReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setSceneReady(true), 150);
    return () => clearTimeout(id);
  }, []);

  return (
    <>
      {/* 3D BG önce mount olur — perde açıldığında chisel zaten orbit'te */}
      {sceneReady && (
        <ErrorBoundary label="scene-bg" fallback={null}>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Intro perdesi — z-100, content'in üstünde, ~2.4s sonra unmount */}
      <IntroOverlay />

      <div className="app-root">
        <Nav lang={lang} setLang={setLang} t={t} />
        <Hero t={t} />
        <Products t={t} />
        <WorkshopShowcase t={t} />
        <BrandMarquee t={t} />
        <Craft t={t} />
        <Industries t={t} />
        <Contact t={t} />
        <Footer t={t} />
      </div>
    </>
  );
}
