import type { ReactNode } from 'react';
import { Container } from '@kervan/ui';
import {
  ORG_EMAIL,
  ORG_LEGAL_NAME,
  ORG_LOCALITY,
  ORG_PHONE,
  ORG_PHONE_E164,
  ORG_REGION,
  ORG_STREET,
} from '@kervan/seo';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { LIST_PATH } from '../lib/routes';
import type { Lang } from '../types';

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';

interface Props {
  lang: Lang;
  path: string;
  t: Dict;
  demo: boolean;
  children: ReactNode;
}

export default function Layout({ lang, path, t, demo, children }: Props) {
  const other: Lang = lang === 'tr' ? 'en' : 'tr';
  return (
    <>
      <div className="bg-bg-warm text-ink-mid text-sm">
        <Container className="py-2">{t.banner.preview}</Container>
      </div>
      {demo && (
        <div className="bg-brand text-bg text-sm font-medium">
          <Container className="py-2">{t.banner.demo}</Container>
        </div>
      )}
      <header className="border-b border-hair">
        <Container className="flex items-center justify-between gap-6 py-4">
          <a href={localePath('/', lang)} className={`flex items-center gap-3 ${FOCUS}`}>
            <img
              src="/logo-krv-128.webp"
              alt=""
              width={36}
              height={36}
              className="size-9 rounded-sm"
            />
            <span className="font-serif text-xl text-ink">{t.meta.siteName}</span>
          </a>
          <nav aria-label={t.nav.label} className="flex items-center gap-5 font-sans text-sm">
            <a
              href={localePath(LIST_PATH, lang)}
              className={`text-ink hover:text-brand-hi ${FOCUS}`}
            >
              {t.nav.tips}
            </a>
            <a
              href={lang === 'tr' ? 'https://kervanbreaker.com/' : 'https://kervanbreaker.com/en/'}
              className={`hidden sm:inline text-ink-mid hover:text-ink ${FOCUS}`}
            >
              {t.nav.catalogSite}
            </a>
            <a
              href={localePath(path, other)}
              hrefLang={other}
              aria-label={t.nav.langLabel}
              className={`text-ink-mid hover:text-ink ${FOCUS}`}
            >
              {t.nav.langOther}
            </a>
          </nav>
        </Container>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-hair">
        <Container className="grid gap-6 py-10 font-sans text-sm text-ink-mid md:grid-cols-2">
          <div>
            <p className="m-0 text-xs uppercase tracking-widest text-ink-soft">{t.footer.legal}</p>
            <p className="m-0 mt-2 text-ink">{ORG_LEGAL_NAME}</p>
            <p className="m-0">
              {ORG_STREET}, {ORG_LOCALITY}/{ORG_REGION}
            </p>
            <p className="m-0">
              <a href={`tel:${ORG_PHONE_E164}`} className={`hover:text-ink ${FOCUS}`}>
                {ORG_PHONE}
              </a>
              {' · '}
              <a href={`mailto:${ORG_EMAIL}`} className={`hover:text-ink ${FOCUS}`}>
                {ORG_EMAIL}
              </a>
            </p>
          </div>
          <div className="md:text-right">
            <a
              href="https://kervanbreaker.com/kvkk"
              className={`underline hover:text-ink ${FOCUS}`}
            >
              {t.footer.kvkk}
            </a>
            <p className="m-0 mt-2 text-ink-soft">{t.footer.marks}</p>
            <p className="m-0 mt-1 text-ink-soft">{t.footer.images}</p>
          </div>
        </Container>
      </footer>
    </>
  );
}
