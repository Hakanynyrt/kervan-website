import Hero from '../components/Hero';
import Facts from '../components/Facts';
import Products from '../components/Products';
import Makes from '../components/Makes';
import Workshop from '../components/Workshop';
import Craft from '../components/Craft';
import Industries from '../components/Industries';
import Exports from '../components/Exports';
import Contact from '../components/Contact';
import type { DictBlock, Lang } from '../types';

interface Props {
  t: DictBlock;
  lang: Lang;
}

/** Long-scroll home. Order (2026-10-29 redesign "D: Karışım"): hero, fact table, products +
 *  shop bar, compatible makes, workshop rail, craft, industries, exports, contact. */
export default function Home({ t, lang }: Props) {
  return (
    <>
      <Hero t={t} />
      <Facts t={t} lang={lang} />
      <Products t={t} lang={lang} />
      <Makes t={t} lang={lang} />
      <Workshop t={t} />
      <Craft t={t} lang={lang} />
      <Industries t={t} />
      <Exports t={t} lang={lang} />
      <Contact t={t} lang={lang} />
    </>
  );
}
