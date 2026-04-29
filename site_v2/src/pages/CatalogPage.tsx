import { useLang } from '../lib/use-lang';
import { DICT } from '../lib/dict';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import CatalogContent from '../components/CatalogContent';

/**
 * Catalog page — anasayfanın 3D Scene'i YOK. Sade working page,
 * tablolar + print desteği. Nav + Footer ortak component'ler.
 */
export default function CatalogPage() {
  const [lang, setLang] = useLang();
  const t = DICT[lang];

  return (
    <div className="app-root">
      <Nav lang={lang} setLang={setLang} t={t} />
      <CatalogContent t={t} />
      <Footer t={t} />
    </div>
  );
}
