import Layout from './components/Layout';
import PageView, { showsPrice } from './PageView';
import { DICT, type Dict } from './lib/dict';
import { renderModel } from './lib/part-caption';
import { findRender } from './lib/part-links';
import type { PartKey } from './lib/routes';
import type { PageProps } from './lib/page-props';
import { AstryxProvider } from '@kervan/ui';

/** Header quote message on a part's own page: this part for this breaker. */
function partItemQuote(part: PartKey, anchor: string, t: Dict): string {
  const r = findRender(part, anchor);
  const name = r?.kind ? t.parts.renderKind[r.kind] : t.parts.items[part].name;
  return t.parts.text(name, r ? renderModel(r, t) : '', 1);
}

function AppBody({ lang, path, model, fx }: PageProps) {
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
    <Layout
      lang={lang}
      path={path}
      t={t}
      demo={demo}
      hasPopular={hasPopular}
      quoteText={quoteText}
      priced={showsPrice(model)}
      home={model.kind === 'home'}
      finder={model.kind === 'home' ? model.finder : undefined}
    >
      <PageView lang={lang} path={path} model={model} fx={fx} />
    </Layout>
  );
}

/**
 * The site's page: the site frame (`Layout`: header, footer, consent) around the page itself
 * (`PageView`, which the iPhone app renders in its own shell).
 */
export default function App(props: PageProps) {
  return (
    <AstryxProvider lang={props.lang}>
      <AppBody {...props} />
    </AstryxProvider>
  );
}
