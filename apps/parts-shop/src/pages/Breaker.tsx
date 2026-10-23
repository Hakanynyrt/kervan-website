import { carrierTons, type FxRate } from '@kervan/tips';
import TipProduct from '../components/TipProduct';
import { FOCUS } from '../components/Layout';
import type { Dict } from '../lib/dict';
import { fmtNum } from '../lib/format';
import { groovedFor } from '../lib/grooved';
import { localePath } from '../lib/locale-path';
import { brandPath, type PageModel } from '../lib/routes';
import { tipVariants } from '../lib/tip-options';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'breaker' }>;

/** The shop's product page: the tip for one breaker model. */
export default function Breaker({
  model,
  path,
  fx,
  lang,
  t,
}: {
  model: Model;
  path: string;
  fx: FxRate | null;
  lang: Lang;
  t: Dict;
}) {
  const grooved = groovedFor(model.name);
  const aliases = model.aliases ?? [];
  return (
    <TipProduct
      title={t.breaker.title(model.name)}
      subtitle={
        aliases.length
          ? t.breaker.aliases(aliases.map((x) => `${model.brand} ${x}`).join(', '))
          : undefined
      }
      crumb={model.model}
      trail={[[model.brand, brandPath(model.brand)]]}
      quoteName={model.name}
      families={model.families}
      extra={model.extra}
      sample={model.sample}
      parts={model.parts}
      grooved={grooved}
      path={path}
      fx={fx}
      lang={lang}
      t={t}
    >
      <Facts model={model} lang={lang} t={t} />
      <Siblings model={model} lang={lang} t={t} />
    </TipProduct>
  );
}

/**
 * The model's facts, all from the catalogue: tip size(s), tip types, the rough carrier class of
 * the primary tip size (the one the title and the product box use) and the other parts we make
 * for it. Pages that share one tip family still read much alike: this block alone does not make
 * a model page distinct, only model-specific content (the owner's own photos and data) does.
 */
function Facts({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const f = t.breaker.facts;
  const variants = tipVariants(model.families);
  const primary = model.families[0]?.attrs.diameterMm ?? model.extra?.diameterMm ?? null;
  const sizes = variants.length
    ? variants.map(
        (v) =>
          `Ø${fmtNum(v.diameterMm, lang)}${v.lengthMm ? ` × ${fmtNum(v.lengthMm, lang)}` : ''} mm`,
      )
    : primary !== null
      ? [`Ø${fmtNum(primary, lang)} mm`]
      : [];
  const types = [
    ...new Set([
      ...model.families.flatMap((x) => x.skus.map((s) => s.tipType)),
      ...(model.extra?.tipTypes ?? []),
    ]),
  ].map((x) => t.tip[x]);
  const c = primary !== null ? carrierTons(primary) : null;
  // With several sizes, say which one the class belongs to (the box above shows the same one).
  const carrier = c
    ? `${variants.length > 1 ? `Ø${fmtNum(primary!, lang)} mm: ` : ''}${t.family.carrierValue(c.min, c.max)}`
    : null;
  const parts = [...new Set(model.parts.map((x) => t.parts.items[x.part].name))];
  const rows: [string, string][] = [
    ...(sizes.length ? [[f.size, sizes.join('; ')] as [string, string]] : []),
    ...(types.length ? [[f.types, types.join(', ')] as [string, string]] : []),
    ...(carrier ? [[f.carrier, carrier] as [string, string]] : []),
    ...(parts.length ? [[f.parts, parts.join(', ')] as [string, string]] : []),
  ];
  if (!rows.length) return null;
  return (
    <section aria-labelledby="facts" className="mt-12 font-sans">
      <h2 id="facts" className="m-0 text-xl font-bold text-ink">
        {f.title(model.name)}
      </h2>
      <dl className="m-0 mt-3 max-w-3xl text-sm">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="grid gap-1 border-t border-hair py-3 sm:grid-cols-[16rem_minmax(0,1fr)]"
          >
            <dt className="text-ink-mid">{k}</dt>
            <dd className="m-0 text-ink tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Other breakers that take one of this page's tip families, as plain links. With several tip
 * sizes, one list per size under its size, so no breaker is listed as taking a size it does not.
 */
function Siblings({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const groups = model.siblings ?? [];
  if (!groups.length) return null;
  // One heading per tip size when the page has several (the size picker's sizes).
  const sized = tipVariants(model.families).length > 1;
  return (
    <>
      {groups.map((g, i) => (
        <section key={i} aria-labelledby={`siblings-${i}`} className="mt-12 font-sans">
          <h2 id={`siblings-${i}`} className="m-0 text-xl font-bold text-ink">
            {sized
              ? t.breaker.siblings.sized(
                  `Ø${fmtNum(g.diameterMm, lang)}${g.lengthMm ? ` × ${fmtNum(g.lengthMm, lang)}` : ''} mm`,
                )
              : t.breaker.siblings.title}
          </h2>
          <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0 text-sm">
            {g.items.map((x) => (
              <li key={x.path}>
                <a
                  href={localePath(x.path, lang)}
                  className={`inline-flex min-h-11 items-center rounded-sm border border-hair bg-bg px-3 text-ink hover:border-hair-strong ${FOCUS}`}
                >
                  {x.name}
                </a>
              </li>
            ))}
          </ul>
          {g.more > 0 && (
            <p className="m-0 mt-2 text-sm text-ink-mid">{t.breaker.siblings.more(g.more)}</p>
          )}
        </section>
      ))}
    </>
  );
}
