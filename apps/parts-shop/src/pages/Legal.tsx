import { Container } from '@kervan/ui';
import { Breadcrumb, PageTitle } from '../components/Bits';
import { FOCUS } from '../components/Layout';
import type { Dict } from '../lib/dict';
import {
  isSellerSection,
  LEGAL,
  LEGAL_KEYS,
  legalAnchor,
  legalPath,
  UPDATED,
  type LegalKey,
} from '../lib/legal';
import { localePath } from '../lib/locale-path';
import { fmtDate } from '../lib/price';
import type { Lang } from '../types';

/** "Label: value" → [label, value] (split on the first ": "). */
const splitLine = (x: string): [string, string] => {
  const i = x.indexOf(': ');
  return i < 0 ? ['', x] : [x.slice(0, i), x.slice(i + 2)];
};

/** A line may pack several facts ("Telefon: … · Faks: …"): one dt/dd pair per fact. */
const splitFacts = (x: string): string[] => x.split(' · ');

/** One legal page: a document layout with contents, numbered sections and the other texts. */
export default function Legal({ doc, lang, t }: { doc: LegalKey; lang: Lang; t: Dict }) {
  const d = LEGAL[lang][doc];
  return (
    <Container className="py-10">
      <Breadcrumb trail={[]} current={t.legal.nav} lang={lang} t={t} />
      <PageTitle>{d.title}</PageTitle>
      <p className="m-0 mt-3 font-sans text-sm text-ink-soft">
        {t.legal.updated(fmtDate(UPDATED, lang))}
        {t.legal.binding ? ` · ${t.legal.binding}` : ''}
      </p>
      <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav
          aria-label={t.legal.toc}
          className="font-sans text-sm lg:sticky lg:top-6 lg:self-start"
        >
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-ink">
            {t.legal.toc}
          </p>
          <ol className="m-0 mt-3 list-none space-y-1.5 border-l border-hair p-0">
            {d.sections.map((s, i) => (
              <li key={s.h}>
                <a
                  href={`#${legalAnchor(i)}`}
                  className={`-ml-px block border-l-2 border-transparent pl-3 text-ink-mid hover:border-ink hover:text-ink ${FOCUS}`}
                >
                  {i + 1}. {s.h}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="max-w-[68ch] font-sans text-[15px] leading-7 text-ink-mid">
          {d.sections.map((s, i) => (
            <section
              key={s.h}
              id={legalAnchor(i)}
              className="mt-8 scroll-mt-6 border-t border-hair pt-6 first:mt-0 first:border-t-0 first:pt-0"
            >
              <h2 className="m-0 text-base font-bold text-ink">
                {i + 1}. {s.h}
              </h2>
              {isSellerSection(s) ? (
                <dl className="m-0 mt-3 rounded-sm border border-hair bg-bg-soft p-4 text-sm">
                  {s.p.flatMap(splitFacts).map((x) => {
                    const [k, v] = splitLine(x);
                    return (
                      <div key={x} className="mt-2 first:mt-0 sm:flex sm:gap-3">
                        <dt className="font-semibold text-ink sm:w-48 sm:shrink-0">{k}</dt>
                        <dd className="m-0">{v}</dd>
                      </div>
                    );
                  })}
                </dl>
              ) : (
                s.p.map((x) => (
                  <p key={x} className="m-0 mt-2">
                    {x}
                  </p>
                ))
              )}
            </section>
          ))}
        </article>
      </div>
      <nav aria-labelledby="legal-others" className="mt-14 border-t border-hair pt-8 font-sans">
        <h2 id="legal-others" className="m-0 mb-4 text-sm font-bold text-ink">
          {t.legal.others}
        </h2>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
          {LEGAL_KEYS.filter((k) => k !== doc).map((k) => (
            <li key={k}>
              <a
                href={localePath(legalPath(k), lang)}
                className={`block h-full rounded-sm border border-hair bg-bg p-4 font-medium text-ink hover:border-hair-strong ${FOCUS}`}
              >
                {LEGAL[lang][k].title}
                <span className="mt-1 block text-xs font-normal text-ink-mid">
                  {LEGAL[lang][k].desc}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
}
