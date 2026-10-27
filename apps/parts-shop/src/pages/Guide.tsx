import { Container } from '@kervan/ui';
import { Breadcrumb, PageTitle } from '../components/Bits';
import { FOCUS } from '../components/Layout';
import type { Dict } from '../lib/dict';
import { GUIDE_KEYS, GUIDES, GUIDES_PATH, guidePath, type GuideKey } from '../lib/guides';
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

/** "Rehber": the index (`doc` null) or one article (guides.ts), then its part groups. */
export default function Guide({ doc, lang, t }: { doc: GuideKey | null; lang: Lang; t: Dict }) {
  const g = GUIDES[lang];
  if (!doc)
    return (
      <Container className="py-10">
        <Breadcrumb trail={[]} current={g.title} lang={lang} t={t} />
        <PageTitle>{g.title}</PageTitle>
        <p className="m-0 mt-3 max-w-[65ch] font-sans text-base text-ink-mid">{g.lead}</p>
        <div className="mt-8 font-sans">
          <GuideCards lang={lang} />
        </div>
      </Container>
    );
  const d = g.items[doc];
  const link = (k: PartKey | 'tips'): [string, string] =>
    k === 'tips' ? [t.parts.tips.name, LIST_PATH] : [t.parts.items[k].name, partPath(k)];
  return (
    <Container className="py-10">
      <Breadcrumb trail={[[g.title, GUIDES_PATH]]} current={d.title} lang={lang} t={t} />
      <article className="max-w-[65ch] font-sans">
        <PageTitle>{d.title}</PageTitle>
        <p className="m-0 mt-4 text-lg leading-8 text-ink">{d.lead}</p>
        <div className="text-[15px] leading-7 text-ink-mid">
          {d.sections.map((s) => (
            <section key={s.h} className="mt-8">
              <h2 className="m-0 text-xl font-bold text-ink">{s.h}</h2>
              {s.p.map((x) => (
                <p key={x} className="m-0 mt-3">
                  {x}
                </p>
              ))}
            </section>
          ))}
        </div>
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
    </Container>
  );
}
