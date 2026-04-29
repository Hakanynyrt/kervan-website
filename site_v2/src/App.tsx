import { useLang } from './lib/use-lang';
import { DICT } from './lib/dict';
import Nav from './components/Nav';
import Hero from './components/Hero';

export default function App() {
  const [lang, setLang] = useLang();
  const t = DICT[lang];

  return (
    <>
      <Nav lang={lang} setLang={setLang} t={t} />
      <Hero t={t} />
    </>
  );
}
