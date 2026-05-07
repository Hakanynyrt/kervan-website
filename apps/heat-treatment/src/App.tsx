import { useLang } from './lib/use-lang';
import { DICT } from './lib/dict';
import IntroOverlay from './components/IntroOverlay';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Services from './components/Services';
import TechnicalCapacity from './components/TechnicalCapacity';
import Craft from './components/Craft';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import WhatsAppFAB from './components/WhatsAppFAB';

export default function App() {
  const [lang, setLang] = useLang();
  const t = DICT[lang];

  return (
    <>
      <IntroOverlay />

      <Nav lang={lang} setLang={setLang} t={t} />
      <Hero t={t} />
      <Services t={t} />
      <TechnicalCapacity t={t} />
      <Craft t={t} />
      <About t={t} />
      <Contact t={t} />
      <Footer t={t} />

      <WhatsAppFAB />
    </>
  );
}
