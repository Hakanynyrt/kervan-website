import { Breadcrumb, PageTitle } from '../components/Bits';
import { GuideVideo } from '../components/GuideVideo';
import { FOCUS, WRAP } from '../components/Layout';
import type { Dict } from '../lib/dict';
import {
  GUIDE_KEYS,
  GUIDE_PICS,
  GUIDES,
  GUIDES_PATH,
  guidePath,
  guidePicSet,
  guidePicSrc,
  shownFigures,
  type GuideFigure,
  type GuideKey,
  type GuideTipKeys,
} from '../lib/guides';
import { localePath } from '../lib/locale-path';
import { LIST_PATH, partPath, type PartKey } from '../lib/routes';
import type { Lang } from '../types';

const CARD = `block h-full rounded-sm border border-hair bg-bg p-4 font-medium text-ink hover:border-hair-strong ${FOCUS}`;

/** The articles other than `except`, as cards: title and lead. */
function GuideCards({ lang, except }: { lang: Lang; except?: GuideKey }) {
  const g = GUIDES[lang];
  return (
    <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {GUIDE_KEYS.filter((k) => k !== except).map((k) => (
        <li key={k}>
          <a href={localePath(guidePath(k), lang)} className={CARD}>
            {g.items[k].title}
            <span className="mt-1 block text-sm font-normal text-ink-mid">{g.items[k].lead}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * One picture in an article, across the text column. Renders are transparent and stand on the
 * light studio sweep; photos fill their frame. Only a picture right under the lead can be above
 * the fold: that one loads at once, the rest lazily. A wide picture (the exploded view, wider than
 * 3:1) would shrink to a strip on phones where the parts its caption names cannot be told apart:
 * below `sm` it keeps 760 px and the frame scrolls sideways (focusable, named by its alt text).
 */
function Figure({ f, tip }: { f: GuideFigure; tip?: string }) {
  const p = GUIDE_PICS[f.pic];
  const wide = p.w > 3 * p.h;
  const img = (
    <img
      src={guidePicSrc(p, tip)}
      srcSet={guidePicSet(p)}
      sizes={
        wide ? '(min-width: 640px) 600px, 760px' : '(min-width: 640px) 600px, calc(100vw - 32px)'
      }
      width={p.w}
      height={p.h}
      alt={f.alt}
      loading={f.after === 'lead' ? undefined : 'lazy'}
      decoding="async"
      className={`block h-auto ${wide ? 'w-[760px] max-w-none sm:w-full sm:max-w-full' : 'w-full rounded-sm border border-hair'} ${'render' in p ? 'bg-pstage' : 'bg-bg-warm'}`}
    />
  );
  return (
    <figure className="m-0 mt-6">
      {wide ? (
        <div
          className={`overflow-x-auto rounded-sm border border-hair ${FOCUS}`}
          tabIndex={0}
          role="region"
          aria-label={f.alt}
        >
          {img}
        </div>
      ) : (
        img
      )}
      <figcaption className="mt-2 text-sm leading-6 text-ink-mid">{f.caption}</figcaption>
    </figure>
  );
}

/** "Rehber": the index (`doc` null) or one article (guides.ts), then its part groups. */
export default function Guide({
  doc,
  tips,
  lang,
  t,
}: {
  doc: GuideKey | null;
  tips: GuideTipKeys;
  lang: Lang;
  t: Dict;
}) {
  const g = GUIDES[lang];
  if (!doc)
    return (
      <div className={`${WRAP} py-10`}>
        <Breadcrumb trail={[]} current={g.title} lang={lang} t={t} />
        <PageTitle>{g.title}</PageTitle>
        <p className="m-0 mt-3 max-w-[65ch] font-sans text-base text-ink-mid">{g.lead}</p>
        <div className="mt-8 font-sans">
          <GuideCards lang={lang} />
        </div>
      </div>
    );
  const d = g.items[doc];
  const figs = (at: GuideFigure['after']) =>
    shownFigures(d, tips)
      .filter((f) => f.after === at)
      .map((f) => <Figure key={f.pic} f={f} tip={tips[f.pic]} />);
  const link = (k: PartKey | 'tips'): [string, string] =>
    k === 'tips' ? [t.parts.tips.name, LIST_PATH] : [t.parts.items[k].name, partPath(k)];
  return (
    <div className={`${WRAP} py-10`}>
      <Breadcrumb trail={[[g.title, GUIDES_PATH]]} current={d.title} lang={lang} t={t} />
      <article className="max-w-[65ch] font-sans">
        <PageTitle>{d.title}</PageTitle>
        <p className="m-0 mt-4 text-lg leading-8 text-ink">{d.lead}</p>
        {figs('lead')}
        <div className="text-[15px] leading-7 text-ink-mid">
          {d.sections.map((s, i) => (
            <section key={s.h} className="mt-8">
              <h2 className="m-0 text-xl font-bold text-ink">{s.h}</h2>
              {s.p.map((x) => (
                <p key={x} className="m-0 mt-3">
                  {x}
                </p>
              ))}
              {figs(i)}
            </section>
          ))}
        </div>
        <GuideVideo k={doc} lang={lang} t={t} />
      </article>
      <nav aria-labelledby="guide-parts" className="mt-12 border-t border-hair pt-8 font-sans">
        <h2 id="guide-parts" className="m-0 mb-4 text-sm font-bold text-ink">
          {g.more}
        </h2>
        <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
          {d.links.map((k) => {
            const [label, path] = link(k);
            return (
              <li key={k}>
                <a href={localePath(path, lang)} className={CARD}>
                  {label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <nav aria-labelledby="guide-others" className="mt-10 font-sans">
        <h2 id="guide-others" className="m-0 mb-4 text-sm font-bold text-ink">
          <a href={localePath(GUIDES_PATH, lang)} className={`hover:underline ${FOCUS}`}>
            {g.title}
          </a>
        </h2>
        <GuideCards lang={lang} except={doc} />
      </nav>
    </div>
  );
}
