import { Fragment, useState, type ReactNode } from 'react';
import type { FxRate } from '@kervan/tips';
import { Container } from '@kervan/ui';
import {
  Breadcrumb,
  ImgNote,
  OemLine,
  OemNumbers,
  PageTitle,
  StickyQuote,
} from '../components/Bits';
import { FOCUS } from '../components/Layout';
import { PartOrder, PartPriceLine, partOrderText, priceNote } from '../components/PartOrder';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { fmtNum } from '../lib/format';
import {
  isRockDrill,
  otherSpelling,
  partAbout,
  renderFits,
  renderModel,
  renderSeoName,
  renderTitle,
} from '../lib/part-caption';
import type { PartRender } from '../lib/photos';
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
export default function PartItem({
  model,
  fx,
  lang,
  t,
}: {
  model: Model;
  fx: FxRate | null;
  lang: Lang;
  t: Dict;
}) {
  const r = findRender(model.part, model.anchor);
  const p = t.parts.items[model.part];
  const [breaker, setBreaker] = useState(r ? renderModel(r, t) : '');
  const [qty, setQty] = useState(1);
  // Front heads: the Burçsuz / Burçlu choice made in the figure goes into the quote message.
  // Front heads open Burçlu (owner), as RenderFigure does.
  const [withB, setWithB] = useState(!!r?.fitted);
  if (!r) return null;
  const partName = r.kind
    ? t.parts.renderKind[r.kind]
    : r.fitted
      ? t.parts.fitted.name(p.name, withB)
      : p.name;
  const text = t.parts.text(partName, breaker.trim(), qty);
  // Priced (owner's rows): order instead of a quote; a burçlu head carries its own price.
  const fittedNow = !!r.fitted && withB;
  const cents = fittedNow ? model.priceFitted : model.price;
  const itemPath = partItemPath(model.part, model.anchor);
  const about = partAbout(r, model.part, t, lang);
  const ctx: Ctx = {
    part: model.part,
    name: p.name,
    qty,
    tipLinks: {},
    prices: {},
    oem: { [model.anchor]: model.oem },
    fx,
    lang,
    t,
  };
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
      <PageTitle>{renderSeoName(r, model.part, t)}</PageTitle>
      <p className="m-0 mt-3 max-w-[60ch] font-sans text-base text-ink-soft">
        {renderFits(r, t)} {p.body}
      </p>
      <p className="m-0 mt-3 max-w-[60ch] font-sans text-base text-ink-mid">
        {about.fit} {about.body}
      </p>
      <OemLine t={t} kit={model.part === 'tamir-takimi'} />
      <OemNumbers numbers={model.oem} t={t} note className="mt-3" />
      {cents !== null && (
        <PartPriceLine
          cents={cents}
          fx={fx}
          lang={lang}
          plus={t.price.plus}
          note={priceNote(r.kind, t)}
          className="mt-2 text-lg lg:hidden"
        />
      )}

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
          <Facts model={model} name={partName} r={r} lang={lang} t={t} />
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
          {cents !== null ? (
            <PartOrder
              id={fittedNow ? `${itemPath}#b` : itemPath}
              breaker={renderModel(r, t)}
              label={partName.toLocaleLowerCase(lang === 'tr' ? 'tr' : 'en')}
              cents={cents}
              path={itemPath}
              qty={qty}
              setQty={setQty}
              fx={fx}
              lang={lang}
              t={t}
              note={priceNote(r.kind, t)}
              part={model.part}
            />
          ) : (
            <QuotePanel
              name={partName}
              breaker={breaker}
              setBreaker={setBreaker}
              qty={qty}
              setQty={setQty}
              text={text}
              t={t}
              part={model.part}
              compact={lang}
            />
          )}
        </aside>
      </div>
      {cents !== null ? (
        <StickyQuote
          text={partOrderText(
            t,
            lang,
            partName.toLocaleLowerCase(lang === 'tr' ? 'tr' : 'en'),
            renderModel(r, t),
            qty,
            cents,
            itemPath,
          )}
          label={t.parts.order.wa}
          t={t}
        />
      ) : (
        <StickyQuote text={text} t={t} />
      )}
    </Container>
  );
}

/**
 * The item's own facts, all already on the site: its group and part, the breakers it fits
 * (linked to their pages) with their other spellings and working diameter (never a length or
 * any other dimension of the part). This, not the shared sale terms, is what tells the item
 * pages of one group apart.
 */
function Facts({
  model,
  name,
  r,
  lang,
  t,
}: {
  model: Model;
  name: string;
  r: PartRender;
  lang: Lang;
  t: Dict;
}) {
  const f = t.parts.item.facts;
  const group = t.parts.items[model.part].name;
  const other = otherSpelling(r.model);
  const aliases = [
    ...new Set([...(other ? [other] : []), ...model.fitsBreakers.flatMap((x) => x.aliases)]),
  ].filter((x) => !model.fitsBreakers.some((y) => y.name === x));
  const sizes = model.fitsBreakers.flatMap((x) =>
    x.diameterMm === null
      ? []
      : [`${model.fitsBreakers.length > 1 ? `${x.name}: ` : ''}Ø${fmtNum(x.diameterMm, lang)} mm`],
  );
  const rows: [string, ReactNode][] = [
    [f.group, group],
    ...(name !== group ? [[f.part, name] as [string, ReactNode]] : []),
    [
      f.fits(isRockDrill(r)),
      model.fitsBreakers.map((x, i) => (
        <Fragment key={x.name}>
          {i > 0 && ', '}
          {x.path ? (
            <a href={localePath(x.path, lang)} className={`underline hover:text-ink-mid ${FOCUS}`}>
              {x.name}
            </a>
          ) : (
            x.name
          )}
        </Fragment>
      )),
    ],
    ...(aliases.length ? [[f.aliases, aliases.join(', ')] as [string, ReactNode]] : []),
    ...(r.variant ? [[f.variant, t.parts.renderVariant[r.variant]] as [string, ReactNode]] : []),
    ...(sizes.length ? [[f.diameter, sizes.join('; ')] as [string, ReactNode]] : []),
  ];
  return (
    <section aria-labelledby="item-facts" className="font-sans">
      <h2 id="item-facts" className="m-0 text-base font-bold text-ink">
        {f.title(renderSeoName(r, model.part, t))}
      </h2>
      <dl className="m-0 mt-2 text-sm">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="grid gap-1 border-t border-hair py-2.5 sm:grid-cols-[12rem_minmax(0,1fr)]"
          >
            <dt className="text-ink-mid">{k}</dt>
            <dd className="m-0 text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
