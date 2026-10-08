import type { ReactNode } from 'react';
import { Container } from '@kervan/ui';
import { ORG_EMAIL, ORG_PHONE, ORG_PHONE_E164, ORG_TRADING_NAME } from '@kervan/seo';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { CART_PATH, LIST_PATH, PARTS_PATH, POPULAR_PATH } from '../lib/routes';
import { LEGAL, LEGAL_KEYS, legalPath, SELLER } from '../lib/legal';
import { CartLink } from './CartLink';
import type { Lang } from '../types';

export const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';

/** WhatsApp link with a prefilled message (also used by the pages' quote buttons). */
export const whatsappHref = (text: string): string =>
  `https://wa.me/${ORG_PHONE_E164.replace('+', '')}?text=${encodeURIComponent(text)}`;

interface Props {
  lang: Lang;
  path: string;
  t: Dict;
  demo: boolean;
  /** The best-sellers page exists (the catalog has best-sellers). */
  hasPopular: boolean;
  children: ReactNode;
}

export default function Layout({ lang, path, t, demo, hasPopular, children }: Props) {
  const other: Lang = lang === 'tr' ? 'en' : 'tr';
  const corporate = lang === 'tr' ? 'https://kervanbreaker.com/' : 'https://kervanbreaker.com/en/';
  const nav = [
    { href: localePath(LIST_PATH, lang), label: t.nav.tips, current: path === LIST_PATH },
    {
      href: localePath(PARTS_PATH, lang),
      label: t.nav.parts,
      current: path.startsWith(PARTS_PATH),
    },
    ...(hasPopular
      ? [
          {
            href: localePath(POPULAR_PATH, lang),
            label: t.nav.popular,
            current: path === POPULAR_PATH,
          },
        ]
      : []),
  ];
  return (
    <>
      <div className="hidden border-b border-hair bg-bg-soft font-sans text-xs text-ink-mid sm:block">
        <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
          <span>
            {ORG_TRADING_NAME} · {t.top.tagline}
          </span>
          <span className="flex gap-4">
            <a href={`tel:${ORG_PHONE_E164}`} className={`hover:text-ink ${FOCUS}`}>
              {ORG_PHONE}
            </a>
            <a href={`mailto:${ORG_EMAIL}`} className={`hidden hover:text-ink sm:inline ${FOCUS}`}>
              {ORG_EMAIL}
            </a>
          </span>
        </Container>
      </div>
      <header className="border-b border-hair bg-bg">
        <Container className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-4">
          <a href={localePath('/', lang)} className={`flex items-center gap-3 ${FOCUS}`}>
            <img
              src="/logo-krv-128.webp"
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-sm"
            />
            <span className="flex flex-col leading-tight">
              <span className="font-sans text-lg font-bold text-ink">{ORG_TRADING_NAME}</span>
              <span className="font-sans text-xs text-ink-mid">{t.top.shop}</span>
            </span>
          </a>
          <nav
            aria-label={t.nav.label}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm font-medium"
          >
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                aria-current={n.current ? 'page' : undefined}
                className={`text-ink hover:text-brand-hi aria-[current=page]:text-brand-hi ${FOCUS}`}
              >
                {n.label}
              </a>
            ))}
            <a href={corporate} className={`hidden text-ink-mid hover:text-ink sm:inline ${FOCUS}`}>
              {t.nav.catalogSite}
            </a>
            <CartLink lang={lang} t={t} current={path === CART_PATH} />
            <a
              href={localePath(path, other)}
              hrefLang={other}
              aria-label={t.nav.langLabel}
              className={`text-ink-mid hover:text-ink ${FOCUS}`}
            >
              {t.nav.langOther}
            </a>
            <a
              href={whatsappHref(t.nav.quoteText)}
              className={`hidden rounded-sm bg-brand px-4 py-2 text-white hover:bg-brand-hi sm:inline-block ${FOCUS}`}
            >
              {t.nav.quote}
            </a>
          </nav>
        </Container>
      </header>
      <div className="border-b border-hair bg-bg-warm font-sans text-sm text-ink-mid">
        <Container className="py-2">{t.banner.preview}</Container>
      </div>
      {demo && (
        <div className="bg-brand font-sans text-sm font-medium text-white">
          <Container className="py-2">{t.banner.demo}</Container>
        </div>
      )}
      <main>{children}</main>
      <footer className="mt-24 border-t border-hair bg-bg-soft">
        <Container className="grid gap-8 py-12 font-sans text-sm text-ink-mid sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="m-0 font-semibold text-ink">{t.footer.legal}</p>
            <p className="m-0 mt-3">{SELLER.name}</p>
            <p className="m-0">{SELLER.address}</p>
            <p className="m-0">{SELLER.tax}</p>
          </div>
          <div>
            <p className="m-0 font-semibold text-ink">{t.footer.shop}</p>
            <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className={`hover:text-ink ${FOCUS}`}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="m-0 font-semibold text-ink">{t.footer.company}</p>
            <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
              <li>
                <a href={corporate} className={`hover:text-ink ${FOCUS}`}>
                  kervanbreaker.com
                </a>
              </li>
              <li>
                <a href="https://kervanheat.com/" className={`hover:text-ink ${FOCUS}`}>
                  kervanheat.com
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="m-0 font-semibold text-ink">{t.footer.docs}</p>
            <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
              {LEGAL_KEYS.map((k) => (
                <li key={k}>
                  <a href={localePath(legalPath(k), lang)} className={`hover:text-ink ${FOCUS}`}>
                    {LEGAL[lang][k].title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="m-0 font-semibold text-ink">{t.footer.contact}</p>
            <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
              <li>
                <a href="tel:+902623711005" className={`hover:text-ink ${FOCUS}`}>
                  {SELLER.phone}
                </a>
              </li>
              <li>
                <a href={`tel:${ORG_PHONE_E164}`} className={`hover:text-ink ${FOCUS}`}>
                  {ORG_PHONE}
                </a>
              </li>
              <li>
                <a href={`mailto:${ORG_EMAIL}`} className={`hover:text-ink ${FOCUS}`}>
                  {ORG_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </Container>
        <div className="border-t border-hair">
          <Container className="flex flex-col gap-1 py-5 font-sans text-xs text-ink-soft">
            <p className="m-0">{t.footer.images}</p>
          </Container>
        </div>
      </footer>
    </>
  );
}
