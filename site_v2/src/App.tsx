import { useLang } from './lib/use-lang';
import { DICT } from './lib/dict';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Products from './components/Products';
import Chisels from './components/Chisels';
import Stock from './components/Stock';
import Atolye from './components/Atolye';

export default function App() {
  const [lang, setLang] = useLang();
  const t = DICT[lang];

  return (
    <>
      <Nav lang={lang} setLang={setLang} t={t} />
      <Hero t={t} />
      <Products t={t} />
      <Chisels t={t} />
      <Stock t={t} />
      <Atolye t={t} />
    </>
  );
}
