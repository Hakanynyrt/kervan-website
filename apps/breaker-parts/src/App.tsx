import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useLang } from './lib/use-lang';
import { DICT } from './lib/dict';
import IntroOverlay from './components/IntroOverlay';
import Nav from './components/Nav';
import Footer from './components/Footer';
import WhatsAppFAB from './components/WhatsAppFAB';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Brands from './pages/Brands';
import Production from './pages/Production';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

export default function App() {
  const [lang, setLang] = useLang();
  const t = DICT[lang];

  return (
    <>
      <IntroOverlay />

      <Nav lang={lang} setLang={setLang} t={t} />
      <main>
        <Routes>
          <Route path="/" element={<Home t={t} lang={lang} />} />
          <Route path="/urunler" element={<Products t={t} lang={lang} />} />
          <Route path="/urunler/:slug" element={<ProductDetail t={t} lang={lang} />} />
          <Route path="/uyumluluk" element={<Brands t={t} />} />
          <Route path="/uretim-kalite" element={<Production t={t} />} />
          <Route path="/hakkimizda" element={<About t={t} />} />
          <Route path="/iletisim" element={<Contact t={t} lang={lang} />} />
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
 *  `scroll-padding-top` in globals.css accounting for the fixed nav. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}
