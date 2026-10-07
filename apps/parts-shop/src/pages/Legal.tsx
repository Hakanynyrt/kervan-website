import { Container } from '@kervan/ui';
import { PageTitle } from '../components/Bits';
import { FOCUS } from '../components/Layout';
import type { Dict } from '../lib/dict';
import { LEGAL, LEGAL_KEYS, legalPath, type LegalKey } from '../lib/legal';
import { localePath } from '../lib/locale-path';
import type { Lang } from '../types';

/** One legal page (pre-contract information, contract, returns, privacy), plain text. */
export default function Legal({ doc, lang, t }: { doc: LegalKey; lang: Lang; t: Dict }) {
  const d = LEGAL[lang][doc];
  return (
    <Container className="py-12">
      <PageTitle>{d.title}</PageTitle>
      <div className="mt-8 max-w-3xl font-sans text-ink-mid">
        {d.sections.map((s) => (
          <section key={s.h} className="mt-8 first:mt-0">
            <h2 className="m-0 text-lg font-bold text-ink">{s.h}</h2>
            {s.p.map((x) => (
              <p key={x} className="m-0 mt-2 leading-relaxed">
                {x}
              </p>
            ))}
          </section>
        ))}
      </div>
      <nav aria-label={t.legal.nav} className="mt-12 border-t border-hair pt-6 font-sans text-sm">
        <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
          {LEGAL_KEYS.filter((k) => k !== doc).map((k) => (
            <li key={k}>
              <a
                href={localePath(legalPath(k), lang)}
                className={`text-brand-hi underline hover:text-ink ${FOCUS}`}
              >
                {LEGAL[lang][k].title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
}
