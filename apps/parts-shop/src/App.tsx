import Layout from './components/Layout';
import { DICT, type Dict } from './lib/dict';
import { renderModel } from './lib/part-caption';
import { findRender } from './lib/part-links';
import type { PartKey } from './lib/routes';
import type { PageProps } from './lib/page-props';
import Brand from './pages/Brand';
import Cart from './pages/Cart';
import Breaker from './pages/Breaker';
import Family from './pages/Family';
import Home from './pages/Home';
import Legal from './pages/Legal';
import NotFound from './pages/NotFound';
import Part from './pages/Part';
import PartItem from './pages/PartItem';
import Parts from './pages/Parts';
import Popular from './pages/Popular';
import TipList from './pages/TipList';

/** Header quote message on a part's own page: this part for this breaker. */
function partItemQuote(part: PartKey, anchor: string, t: Dict): string {
  const r = findRender(part, anchor);
  const name = r?.kind ? t.parts.renderKind[r.kind] : t.parts.items[part].name;
  return t.parts.text(name, r ? renderModel(r, t) : '', 1);
}

export default function App({ lang, path, model, fx }: PageProps) {
  const t = DICT[lang];
  const demo = model.kind !== 'notFound' && model.demo;
  const hasPopular = model.kind !== 'notFound' && model.hasPopular;
  const quoteText =
    model.kind === 'part'
      ? t.parts.text(t.parts.items[model.part].name, '', 1)
      : model.kind === 'partItem'
        ? partItemQuote(model.part, model.anchor, t)
        : model.kind === 'breaker'
          ? t.nav.quoteTextFor(model.name)
          : undefined;
  return (
    <Layout lang={lang} path={path} t={t} demo={demo} hasPopular={hasPopular} quoteText={quoteText}>
      {model.kind === 'home' && <Home model={model} lang={lang} t={t} />}
      {model.kind === 'list' && <TipList model={model} lang={lang} t={t} />}
      {model.kind === 'popular' && <Popular model={model} lang={lang} t={t} />}
      {model.kind === 'brand' && <Brand model={model} lang={lang} t={t} />}
      {model.kind === 'parts' && <Parts model={model} lang={lang} t={t} />}
      {model.kind === 'part' && <Part model={model} fx={fx} lang={lang} t={t} />}
      {model.kind === 'partItem' && <PartItem model={model} fx={fx} lang={lang} t={t} />}
      {model.kind === 'breaker' && <Breaker model={model} path={path} fx={fx} lang={lang} t={t} />}
      {model.kind === 'family' && <Family model={model} path={path} fx={fx} lang={lang} t={t} />}
      {model.kind === 'cart' && <Cart fx={fx} lang={lang} t={t} />}
      {model.kind === 'legal' && <Legal doc={model.doc} lang={lang} t={t} />}
      {model.kind === 'notFound' && <NotFound lang={lang} t={t} />}
    </Layout>
  );
}
