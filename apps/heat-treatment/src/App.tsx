import { useClientIdle, useStaticMotion } from '@kervan/motion';
import { useLangSync } from './lib/use-lang';
import { DICT } from './lib/dict';
import { useTechAuth } from './lib/use-tech-auth';
import type { Lang } from './types';
import IntroOverlay from './components/IntroOverlay';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Services from './components/Services';
import TechnicalCapacity from './components/TechnicalCapacity';
import TechInfo from './components/TechInfo';
import Craft from './components/Craft';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import WhatsAppFAB from './components/WhatsAppFAB';
import ConsentBanner from './components/ConsentBanner';

interface Props {
  /** Page language, decided by the URL ("/" = tr, "/en/" = en). */
  lang: Lang;
}

export default function App({ lang }: Props) {
  useLangSync(lang);
  const t = DICT[lang];
  const tech = useTechAuth();
  const isStatic = useStaticMotion();
  // Static (prerendered) mode: the floating button is client-only, so the
  // prerendered HTML carries no hidden element and hydration still matches.
  const clientReady = useClientIdle();

  return (
    <>
      {!isStatic && <IntroOverlay />}

      <Nav lang={lang} t={t} techAuthed={tech.state === 'authed'} />
      <main>
        <Hero t={t} />
        <Services t={t} />
        <TechnicalCapacity t={t} />
        <TechInfo t={t} lang={lang} tech={tech} />
        <Craft t={t} />
        <About t={t} />
        <Contact t={t} />
      </main>
      <Footer t={t} />

      {(!isStatic || clientReady) && <WhatsAppFAB />}
      <ConsentBanner t={t.consent} />
    </>
  );
}
