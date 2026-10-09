import type { ReactNode } from 'react';
import { Container } from '@kervan/ui';
import { ORG_EMAIL, ORG_PHONE, ORG_PHONE_E164, ORG_TRADING_NAME } from '@kervan/seo';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { CART_PATH, PARTS_PATH, POPULAR_PATH, TIP_PATHS } from '../lib/routes';
import { LEGAL, LEGAL_KEYS, legalPath, SELLER } from '../lib/legal';
import { CartLink } from './CartLink';
import type { Lang } from '../types';

export const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';

/** The same ring drawn inside the element, for links inside a clipping box (overflow, scroller). */
export const FOCUS_INSET =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:-outline-offset-2';

/** WhatsApp link with a prefilled message (also used by the pages' quote buttons). */
export const whatsappHref = (text: string): string =>
  `https://wa.me/${ORG_PHONE_E164.replace('+', '')}?text=${encodeURIComponent(text)}`;

/** Footer column label (every column has one: plain labels, not kickers). */
const HEAD = 'm-0 text-xs font-semibold uppercase tracking-wide text-ink';
/** The seller's landline as a tel: link ("0 (262) 371 10 05" → +902623711005). */
const SELLER_TEL = `tel:+90${SELLER.phone.replace(/\D/g, '').slice(1)}`;

interface Props {
  lang: Lang;
  path: string;
  t: Dict;
  demo: boolean;
  /** The best-sellers page exists (the catalog has best-sellers). */
  hasPopular: boolean;
  /** Header quote button's message (the page's product); the generic tip message without it. */
  quoteText?: string;
  children: ReactNode;
}

export default function Layout({ lang, path, t, demo, hasPopular, quoteText, children }: Props) {
  const other: Lang = lang === 'tr' ? 'en' : 'tr';
  const corporate = lang === 'tr' ? 'https://kervanbreaker.com/' : 'https://kervanbreaker.com/en/';
  const nav = [
    // Tips are one spare-part group: their pages count as "Yedek parçalar" too.
    {
      href: localePath(PARTS_PATH, lang),
      label: t.nav.parts,
      current: path.startsWith(PARTS_PATH) || TIP_PATHS.some((p) => path.startsWith(p)),
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
      <a
        href="#icerik"
        className={`sr-only rounded-sm bg-brand px-4 py-2 font-sans text-sm font-medium text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 ${FOCUS}`}
      >
        {t.nav.skip}
      </a>
      <div className="border-b border-hair bg-bg-soft font-sans text-xs text-ink-mid">
        <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
          <span className="hidden sm:inline">
            {ORG_TRADING_NAME} · {t.top.tagline}
          </span>
          <span className="flex gap-4">
            <a
              href={`tel:${ORG_PHONE_E164}`}
              className={`font-medium text-ink hover:text-brand-hi ${FOCUS}`}
            >
              {ORG_PHONE}
            </a>
            <a href={`mailto:${ORG_EMAIL}`} className={`hidden hover:text-ink sm:inline ${FOCUS}`}>
              {ORG_EMAIL}
            </a>
          </span>
        </Container>
      </div>
      <header className="border-b border-hair bg-bg">
        <Container className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3 sm:gap-x-10 sm:py-4">
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
              <span className="hidden font-sans text-xs text-ink-mid sm:inline">{t.top.shop}</span>
            </span>
          </a>
          <nav
            aria-label={t.nav.label}
            className="order-3 flex w-full gap-x-6 overflow-x-auto border-t border-hair pt-3 font-sans text-[15px] font-semibold sm:order-none sm:w-auto sm:border-t-0 sm:pt-0"
          >
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                aria-current={n.current ? 'page' : undefined}
                className={`shrink-0 whitespace-nowrap text-ink hover:text-brand-hi aria-[current=page]:text-brand-hi aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-[10px] ${FOCUS_INSET}`}
              >
                {n.label}
              </a>
            ))}
            <a
              href={localePath(path, other)}
              hrefLang={other}
              lang={other}
              aria-label={t.nav.langLabel}
              className={`ml-auto shrink-0 text-sm font-normal text-ink-mid hover:text-ink sm:hidden ${FOCUS_INSET}`}
            >
              {t.nav.langOther}
            </a>
          </nav>
          <div
            role="group"
            aria-label={t.nav.tools}
            className="ml-auto flex items-center gap-x-4 font-sans text-sm sm:gap-x-5"
          >
            <a href={corporate} className={`hidden text-ink-mid hover:text-ink lg:inline ${FOCUS}`}>
              {t.nav.catalogSite}
            </a>
            <a
              href={localePath(path, other)}
              hrefLang={other}
              lang={other}
              aria-label={t.nav.langLabel}
              className={`hidden border-l border-hair pl-5 text-ink-mid sm:inline hover:text-ink ${FOCUS}`}
            >
              {t.nav.langOther}
            </a>
            <CartLink lang={lang} t={t} current={path === CART_PATH} />
            <a
              href={whatsappHref(quoteText ?? t.nav.quoteText)}
              className={`inline-block rounded-sm bg-brand px-3 py-2 font-medium text-white sm:px-4 hover:bg-brand-hi ${FOCUS}`}
            >
              {t.nav.quote}
            </a>
          </div>
        </Container>
      </header>
      <div className="border-b border-hair bg-bg-soft font-sans text-[13px] text-ink-mid">
        <Container className="flex items-start gap-x-2.5 py-2">
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="mt-0.5 size-4 shrink-0 text-ink-soft"
          >
            <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M8 7v4M8 5h.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <p className="m-0">
            <strong className="font-semibold text-ink">{t.banner.label}</strong> {t.banner.preview}{' '}
            <a
              href={`${localePath(CART_PATH, lang)}#siparis-adimlari`}
              className={`ml-1 whitespace-nowrap font-medium text-brand-hi underline underline-offset-2 hover:text-ink ${FOCUS}`}
            >
              {t.banner.how}
            </a>
          </p>
        </Container>
      </div>
      {demo && (
        <div className="bg-brand font-sans text-sm font-medium text-white">
          <Container className="py-2">{t.banner.demo}</Container>
        </div>
      )}
      <main id="icerik" tabIndex={-1}>
        {children}
      </main>
      <footer className="mt-24 border-t-2 border-ink bg-bg-soft">
        <Container className="flex flex-col gap-4 border-b border-hair py-8 sm:flex-row sm:items-center sm:justify-between">
          <a href={localePath('/', lang)} className={`flex items-center gap-3 ${FOCUS}`}>
            <img
              src="/logo-krv-128.webp"
              alt=""
              width={48}
              height={48}
              loading="lazy"
              className="size-12 rounded-sm"
            />
            <span className="flex flex-col">
              <span className="font-sans text-base font-bold text-ink">{ORG_TRADING_NAME}</span>
              <span className="font-sans text-sm text-ink-mid">{t.footer.about}</span>
            </span>
          </a>
          <p className="m-0 max-w-md font-sans text-xs text-ink-soft sm:text-right">
            {t.footer.fit}
          </p>
        </Container>
        <Container className="grid gap-8 py-10 font-sans text-sm text-ink-mid sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className={HEAD}>{t.footer.legal}</p>
            <p className="m-0 mt-3">{SELLER.name}</p>
            <p className="m-0">{SELLER.address}</p>
            <p className="m-0">{SELLER.tax}</p>
          </div>
          <div>
            <p className={HEAD}>{t.footer.shop}</p>
            <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className={`hover:text-ink ${FOCUS}`}>
                    {n.label}
                  </a>
                </li>
              ))}
              <li>
                <a href={localePath(CART_PATH, lang)} className={`hover:text-ink ${FOCUS}`}>
                  {t.nav.cart}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className={HEAD}>{t.footer.company}</p>
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
            <p className={HEAD}>{t.footer.docs}</p>
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
            <p className={HEAD}>{t.footer.contact}</p>
            <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
              <li>
                <a href={SELLER_TEL} className={`hover:text-ink ${FOCUS}`}>
                  {SELLER.phone}
                </a>
              </li>
              <li>
                <a href={`tel:${ORG_PHONE_E164}`} className={`hover:text-ink ${FOCUS}`}>
                  {ORG_PHONE}
                </a>
              </li>
              <li>
                {t.footer.fax}: {SELLER.fax}
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
          <Container className="flex flex-col gap-1 py-5 font-sans text-xs text-ink-soft sm:flex-row sm:justify-between sm:gap-6">
            <p className="m-0">{t.footer.images}</p>
            <p className="m-0">{SELLER.name}</p>
          </Container>
        </div>
      </footer>
    </>
  );
}
