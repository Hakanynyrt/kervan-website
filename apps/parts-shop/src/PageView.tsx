import { DICT } from './lib/dict';
import type { PageProps } from './lib/page-props';
import Brand from './pages/Brand';
import Cart from './pages/Cart';
import Breaker from './pages/Breaker';
import Family from './pages/Family';
import Guide from './pages/Guide';
import Home from './pages/Home';
import IntlOrders from './pages/IntlOrders';
import Legal from './pages/Legal';
import NotFound from './pages/NotFound';
import Part from './pages/Part';
import PartItem from './pages/PartItem';
import Parts from './pages/Parts';
import Popular from './pages/Popular';
import TipList from './pages/TipList';

/**
 * The page itself, without the site's frame: the site renders it inside `Layout` (App.tsx), the
 * iPhone app inside its own shell (src/app). A new page kind is added here.
 */

/** The page shows a price: tip and model pages with a priced tip, part items with a price. */
export function showsPrice(model: PageProps['model']): boolean {
  switch (model.kind) {
    case 'breaker':
      return (
        model.families.some((f) => f.skus.some((s) => s.priceUsdNetCents !== null)) ||
        (model.extra?.priceUsdNetCents ?? null) !== null
      );
    case 'family':
      return model.family.skus.some((s) => s.priceUsdNetCents !== null);
    case 'partItem':
      return model.price !== null || model.priceFitted !== null;
    default:
      return false;
  }
}

export default function PageView({ lang, path, model, fx }: PageProps) {
  const t = DICT[lang];
  return (
    <>
      {model.kind === 'home' && <Home model={model} fx={fx} lang={lang} t={t} />}
      {model.kind === 'list' && <TipList model={model} fx={fx} lang={lang} t={t} />}
      {model.kind === 'popular' && <Popular model={model} fx={fx} lang={lang} t={t} />}
      {model.kind === 'brand' && <Brand model={model} fx={fx} lang={lang} t={t} />}
      {model.kind === 'parts' && <Parts model={model} lang={lang} t={t} />}
      {model.kind === 'part' && <Part model={model} fx={fx} lang={lang} t={t} />}
      {model.kind === 'partItem' && <PartItem model={model} fx={fx} lang={lang} t={t} />}
      {model.kind === 'breaker' && <Breaker model={model} path={path} fx={fx} lang={lang} t={t} />}
      {model.kind === 'family' && <Family model={model} path={path} fx={fx} lang={lang} t={t} />}
      {model.kind === 'cart' && <Cart fx={fx} lang={lang} t={t} />}
      {model.kind === 'legal' && <Legal doc={model.doc} lang={lang} t={t} />}
      {model.kind === 'intl' && <IntlOrders lang={lang} t={t} />}
      {model.kind === 'guide' && <Guide doc={model.doc} tips={model.tips} lang={lang} t={t} />}
      {model.kind === 'notFound' && <NotFound lang={lang} t={t} />}
    </>
  );
}
