import { useEffect, useRef, type ReactElement } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useLang } from './lib/use-lang';
import { DICT } from './lib/dict';
import { LANGS, stripLang } from './lib/locale-path';
import { useTechAuth } from './lib/use-tech-auth';
import IntroOverlay from './components/IntroOverlay';
import Nav from './components/Nav';
import Footer from './components/Footer';
import WhatsAppFAB from './components/WhatsAppFAB';
import RouteHead from './components/RouteHead';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Brands from './pages/Brands';
import Production from './pages/Production';
import TechInfo from './pages/TechInfo';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import type { Lang } from './types';

/** Route path of a neutral page in a language ('/' → '/en' for English). */
const routePath = (path: string, lang: Lang) =>
  lang === 'tr' ? path : path === '/' ? '/en' : `/en${path}`;

export default function App() {
  const lang = useLang();
  const t = DICT[lang];
  const tech = useTechAuth();

  const pages: [string, ReactElement][] = [
    ['/', <Home key="home" t={t} lang={lang} />],
    ['/urunler', <Products key="products" t={t} lang={lang} />],
    ['/urunler/:slug', <ProductDetail key="product" t={t} lang={lang} />],
    ['/uyumluluk', <Brands key="brands" t={t} />],
    ['/uretim-kalite', <Production key="production" t={t} />],
    ['/teknik-bilgiler', <TechInfo key="tech" t={t} lang={lang} tech={tech} />],
    ['/hakkimizda', <About key="about" t={t} />],
    ['/iletisim', <Contact key="contact" t={t} lang={lang} />],
  ];

  return (
    <>
      <IntroOverlay />
      <RouteHead />

      <Nav lang={lang} t={t} techAuthed={tech.state === 'authed'} />
      <main>
        <Routes>
          {LANGS.flatMap((l) =>
            pages.map(([path, element]) => (
              <Route key={`${l}${path}`} path={routePath(path, l)} element={element} />
            )),
          )}
          <Route path="*" element={<NotFound t={t} />} />
        </Routes>
      </main>
      <Footer t={t} />
      <WhatsAppFAB />

      <ScrollToTop />
    </>
  );
}

/** On every route change with no hash, scroll to top. Hash-based links
 *  (e.g. /#products) are left to the browser's native scroll-to-id, with
 *  `scroll-padding-top` in globals.css accounting for the fixed nav.
 *  Switching language on the same page keeps the scroll position. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const prev = useRef<string | null>(null);
  useEffect(() => {
    const samePage = prev.current !== null && stripLang(prev.current) === stripLang(pathname);
    prev.current = pathname;
    if (hash || samePage) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}
