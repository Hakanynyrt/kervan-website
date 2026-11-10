import { useEffect, useRef, type ReactElement } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useLang } from './lib/use-lang';
import { DICT } from './lib/dict';
import { LANGS, stripLang } from './lib/locale-path';
import { useTechAuth } from './lib/use-tech-auth';
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
import { AstryxProvider } from '@kervan/ui';

/** Route path of a neutral page in a language ('/' → '/en' for English). */
const routePath = (path: string, lang: Lang) =>
  lang === 'tr' ? path : path === '/' ? '/en' : `/en${path}`;

function AppBody() {
  const lang = useLang();
  const t = DICT[lang];
  const tech = useTechAuth();
  // The owner's lookup page has no visitor chrome: the WhatsApp button covered result rows.
  const ownerPage = stripLang(useLocation().pathname).replace(/\/$/, '') === '/teknik-bilgiler';

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
    <div className="flex flex-col min-h-dvh">
      <RouteHead />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-50 focus:inline-flex focus:items-center focus:min-h-11 focus:px-4 focus:bg-bg focus:text-ink focus:font-sans focus:font-semibold focus:border focus:border-ink"
        onClick={(e) => {
          // Direct focus: the owner page uses the URL hash for its tabs.
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        {t.nav.skip}
      </a>

      <Nav lang={lang} t={t} techAuthed={tech.state === 'authed' || tech.state === 'expired'} />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Routes>
          {LANGS.flatMap((l) =>
            pages.map(([path, element]) => (
              <Route key={`${l}${path}`} path={routePath(path, l)} element={element} />
            )),
          )}
          <Route path="*" element={<NotFound t={t} />} />
        </Routes>
      </main>
      {!ownerPage && <Footer t={t} />}
      {!ownerPage && <WhatsAppFAB t={t} />}

      <ScrollToTop />
    </div>
  );
}

/** On every route change with no hash, scroll to top. Hash-based links
 *  (e.g. /#products) are left to the browser's native scroll-to-id, with
 *  `scroll-padding-top` in globals.css accounting for the fixed nav.
 *  Switching language on the same page keeps the scroll position. A real page change also
 *  moves focus to <main>, so keyboard users are not left on the old link; never on first load. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const prev = useRef<string | null>(null);
  useEffect(() => {
    const firstLoad = prev.current === null;
    const samePage = prev.current !== null && stripLang(prev.current) === stripLang(pathname);
    prev.current = pathname;
    if (hash || samePage) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    if (!firstLoad) document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <AstryxProvider lang={useLang()}>
      <AppBody />
    </AstryxProvider>
  );
}
