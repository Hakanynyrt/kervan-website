import Layout from './components/Layout';
import { DICT } from './lib/dict';
import type { PageProps } from './lib/page-props';
import Family from './pages/Family';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Popular from './pages/Popular';
import TipList from './pages/TipList';

export default function App({ lang, path, model }: PageProps) {
  const t = DICT[lang];
  const demo = model.kind !== 'notFound' && model.demo;
  const hasPopular = model.kind !== 'notFound' && model.hasPopular;
  return (
    <Layout lang={lang} path={path} t={t} demo={demo} hasPopular={hasPopular}>
      {model.kind === 'home' && <Home model={model} lang={lang} t={t} />}
      {model.kind === 'list' && <TipList model={model} lang={lang} t={t} />}
      {model.kind === 'popular' && <Popular model={model} lang={lang} t={t} />}
      {model.kind === 'family' && <Family model={model} lang={lang} t={t} />}
      {model.kind === 'notFound' && <NotFound lang={lang} t={t} />}
    </Layout>
  );
}
