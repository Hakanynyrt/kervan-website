import { lazy, Suspense, useEffect, useState } from 'react';
import { useLang } from './lib/use-lang';
import { DICT } from './lib/dict';
import ErrorBoundary from './components/ErrorBoundary';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Products from './components/Products';
import Craft from './components/Craft';
import Industries from './components/Industries';
import Contact from './components/Contact';
import Footer from './components/Footer';

// Lazy-load 3D sahnesi — Three.js + R3F + GLTFLoader ~900KB. Content
// önce render olur, chisel sonra fade in eder.
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
      {sceneReady && (
        <ErrorBoundary label="scene-bg" fallback={null}>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </ErrorBoundary>
      )}
      <div className="app-root">
        <Nav lang={lang} setLang={setLang} t={t} />
        <Hero t={t} />
        <Products t={t} />
        <Craft t={t} />
        <Industries t={t} />
        <Contact t={t} />
        <Footer t={t} />
      </div>
    </>
  );
}
