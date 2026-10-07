import Layout from './components/Layout';
import { DICT } from './lib/dict';
import type { PageProps } from './lib/page-props';
import Brand from './pages/Brand';
import Cart from './pages/Cart';
import Breaker from './pages/Breaker';
import Family from './pages/Family';
import Home from './pages/Home';
import Legal from './pages/Legal';
import NotFound from './pages/NotFound';
import Part from './pages/Part';
import Parts from './pages/Parts';
import Popular from './pages/Popular';
import TipList from './pages/TipList';

export default function App({ lang, path, model, fx }: PageProps) {
  const t = DICT[lang];
  const demo = model.kind !== 'notFound' && model.demo;
  const hasPopular = model.kind !== 'notFound' && model.hasPopular;
  return (
    <Layout lang={lang} path={path} t={t} demo={demo} hasPopular={hasPopular}>
      {model.kind === 'home' && <Home model={model} lang={lang} t={t} />}
      {model.kind === 'list' && <TipList model={model} lang={lang} t={t} />}
      {model.kind === 'popular' && <Popular model={model} lang={lang} t={t} />}
      {model.kind === 'brand' && <Brand model={model} lang={lang} t={t} />}
      {model.kind === 'parts' && <Parts lang={lang} t={t} />}
      {model.kind === 'part' && <Part model={model} lang={lang} t={t} />}
      {model.kind === 'breaker' && <Breaker model={model} path={path} fx={fx} lang={lang} t={t} />}
      {model.kind === 'family' && <Family model={model} path={path} fx={fx} lang={lang} t={t} />}
      {model.kind === 'cart' && <Cart fx={fx} lang={lang} t={t} />}
      {model.kind === 'legal' && <Legal doc={model.doc} lang={lang} t={t} />}
      {model.kind === 'notFound' && <NotFound lang={lang} t={t} />}
    </Layout>
  );
}
