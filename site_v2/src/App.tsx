import { lazy, Suspense } from 'react';
import { useLang } from './lib/use-lang';
import { DICT } from './lib/dict';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Products from './components/Products';
import Craft from './components/Craft';
import Industries from './components/Industries';
import Contact from './components/Contact';
import Footer from './components/Footer';

// Lazy-load the 3D scene — Three.js + R3F + GLTFLoader is ~900KB. Content
// renders first; chisel fades in once ready.
const Scene = lazy(() => import('./components/Scene'));

export default function App() {
  const [lang, setLang] = useLang();
  const t = DICT[lang];

  return (
    <>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
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
