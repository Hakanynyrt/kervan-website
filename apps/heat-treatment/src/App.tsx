import { useClientIdle, useStaticMotion } from '@kervan/motion';
import { useLangSync } from './lib/use-lang';
import { DICT } from './lib/dict';
import { useTechAuth } from './lib/use-tech-auth';
import type { Lang } from './types';
import Nav from './components/Nav';
import Hero from './components/Hero';
import PlantPhoto from './components/PlantPhoto';
import GearProcess from './components/GearProcess';
import Services from './components/Services';
import TechnicalCapacity from './components/TechnicalCapacity';
import TechInfo from './components/TechInfo';
import Craft from './components/Craft';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import WhatsAppFAB from './components/WhatsAppFAB';
import ConsentBanner from './components/ConsentBanner';
import { AstryxProvider } from '@kervan/ui';

interface Props {
  /** Page language, decided by the URL ("/" = tr, "/en/" = en). */
  lang: Lang;
}

function AppBody({ lang }: Props) {
  useLangSync(lang);
  const t = DICT[lang];
  const tech = useTechAuth();
  const isStatic = useStaticMotion();
  // Static (prerendered) mode: the floating button is client-only, so the
  // prerendered HTML carries no hidden element and hydration still matches.
  const clientReady = useClientIdle();

  return (
    <>
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:items-center focus:min-h-11 focus:px-4 focus:bg-bg focus:border focus:border-hair-strong focus:rounded-[2px] font-sans text-[15px] font-semibold text-ink"
      >
        {t.nav.skip}
      </a>
      <Nav lang={lang} t={t} techAuthed={tech.state === 'authed'} />
      <main id="icerik" tabIndex={-1} className="outline-none">
        {/* Order (2026-10-28 redesign): hero, capacity table, plant photo, gear, services, … */}
        <Hero t={t} />
        <TechnicalCapacity t={t} />
        <PlantPhoto t={t} />
        <GearProcess t={t} />
        <Services t={t} lang={lang} />
        <TechInfo t={t} lang={lang} tech={tech} />
        <Craft t={t} />
        <About t={t} />
        <Contact t={t} />
      </main>
      <Footer t={t} lang={lang} />

      {(!isStatic || clientReady) && <WhatsAppFAB t={t} />}
      <ConsentBanner t={t.consent} />
    </>
  );
}

export default function App(props: Parameters<typeof AppBody>[0]) {
  return (
    <AstryxProvider lang={props.lang}>
      <AppBody {...props} />
    </AstryxProvider>
  );
}
