import { useState } from 'react';
import { Container } from '@kervan/ui';
import { Breadcrumb, ImgNote, OemLine, PageTitle, StickyQuote } from '../components/Bits';
import { FOCUS } from '../components/Layout';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { renderModel, renderTitle } from '../lib/part-caption';
import { findRender } from '../lib/part-links';
import { PARTS_PATH, partItemPath, partPath, type PageModel } from '../lib/routes';
import type { Lang } from '../types';
import { QuotePanel, RenderFigure, type Ctx } from './Part';

type Model = Extract<PageModel, { kind: 'partItem' }>;

const LINK = `inline-flex min-h-11 items-center rounded-sm border border-ink-soft bg-bg px-4 font-medium text-ink hover:bg-bg-warm ${FOCUS}`;

/**
 * One modelled part on its own page (e.g. /yedek-parca/piston/montabert-brv-32-piston), so it
 * can be linked and shared: the group page's picture block, a quote for this breaker, links back
 * to the group, to this breaker's tip and to the other parts we make for it.
 */
export default function PartItem({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const r = findRender(model.part, model.anchor);
  const p = t.parts.items[model.part];
  const [breaker, setBreaker] = useState(r ? renderModel(r, t) : '');
  const [qty, setQty] = useState(1);
  // Front heads: the Burçsuz / Burçlu choice made in the figure goes into the quote message.
  // Front heads open Burçlu (owner), as RenderFigure does.
  const [withB, setWithB] = useState(!!r?.fitted);
  if (!r) return null;
  const caption = renderTitle(r, p.name, t);
  const partName = r.kind
    ? t.parts.renderKind[r.kind]
    : r.fitted
      ? t.parts.fitted.name(p.name, withB)
      : p.name;
  const text = t.parts.text(partName, breaker.trim(), qty);
  const ctx: Ctx = { part: model.part, name: p.name, qty, tipLinks: {}, lang, t };
  const related = model.related.flatMap((l) => {
    const x = findRender(l.part, l.anchor);
    return x ? [{ l, x }] : [];
  });
  return (
    <Container className="pb-28 pt-8 lg:pb-12 lg:pt-12">
      <Breadcrumb
        trail={[
          [t.parts.title, PARTS_PATH],
          [p.name, partPath(model.part)],
        ]}
        current={renderModel(r, t)}
        lang={lang}
        t={t}
      />
      <PageTitle>{caption}</PageTitle>
      <OemLine t={t} kit={model.part === 'tamir-takimi'} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-6">
          <RenderFigure r={r} ctx={ctx} item onWithB={setWithB} />
          <ImgNote t={t} kind={model.part === 'tamir-takimi' ? 'kit' : 'render'} />
          <nav aria-label={t.parts.item.linksLabel} className="font-sans text-sm">
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              <li>
                <a href={localePath(partPath(model.part), lang)} className={LINK}>
                  {t.parts.item.back(p.name)}
                  {'\u00a0'}→
                </a>
              </li>
              {model.tipLink && (
                <li>
                  <a href={localePath(model.tipLink, lang)} className={LINK}>
                    {t.parts.tipLink}
                    {'\u00a0'}→
                  </a>
                </li>
              )}
            </ul>
          </nav>
          {related.length > 0 && (
            <section
              aria-labelledby="related-parts"
              className="rounded-md border border-hair bg-bg-soft p-5 font-sans"
            >
              <h2 id="related-parts" className="m-0 text-base font-bold text-ink">
                {t.parts.item.related}
              </h2>
              <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0 text-sm">
                {related.map(({ l, x }) => (
                  <li key={`${l.part}/${l.anchor}`}>
                    <a href={localePath(partItemPath(l.part, l.anchor), lang)} className={LINK}>
                      {renderTitle(x, t.parts.items[l.part].name, t)}
                      {'\u00a0'}→
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <aside className="lg:col-start-2">
          <QuotePanel
            name={partName}
            breaker={breaker}
            setBreaker={setBreaker}
            qty={qty}
            setQty={setQty}
            text={text}
            t={t}
          />
        </aside>
      </div>
      <StickyQuote text={text} t={t} />
    </Container>
  );
}
