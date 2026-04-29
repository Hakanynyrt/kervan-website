import { useLang } from './lib/use-lang';
import { DICT } from './lib/dict';
import IntroOverlay from './components/IntroOverlay';
import Scene from './components/Scene';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Products from './components/Products';
import WorkshopShowcase from './components/WorkshopShowcase';
import BrandMarquee from './components/BrandMarquee';
import Craft from './components/Craft';
import Industries from './components/Industries';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function App() {
  const [lang, setLang] = useLang();
  const t = DICT[lang];

  return (
    <>
      {/* 3D BG — vanilla Three.js, direct mount, lazy/Suspense yok */}
      <Scene />

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
