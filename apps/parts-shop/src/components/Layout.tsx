import { useEffect, useRef, type ReactNode } from 'react';
import { Container, SocialIcon } from '@kervan/ui';
import { ORG_PHONE, ORG_PHONE_E164, ORG_SOCIALS, ORG_TRADING_NAME } from '@kervan/seo';
import type { Dict } from '../lib/dict';
import type { FinderMake } from '../lib/finder';
import { localePath } from '../lib/locale-path';
import {
  CART_PATH,
  LIST_PATH,
  PART_KEYS,
  PARTS_PATH,
  partPath,
  POPULAR_PATH,
  TIP_PATHS,
} from '../lib/routes';
import { LEGAL, LEGAL_KEYS, legalPath, SELLER } from '../lib/legal';
import { CONSENT_OPEN_EVENT } from '../lib/ads';
import { BreakerSearch, FinderPickProvider } from './BreakerSearch';
import { CartLink } from './CartLink';
import { ConsentBanner } from './ConsentBanner';
import { ThemeSelect } from './ThemeSelect';
import type { Lang } from '../types';
import { SHOP_EMAIL } from '../lib/site';

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
export const SELLER_TEL = `tel:+90${SELLER.phone.replace(/\D/g, '').slice(1)}`;

interface Props {
  lang: Lang;
  path: string;
  t: Dict;
  demo: boolean;
  /** The best-sellers page exists (the catalog has best-sellers). */
  hasPopular: boolean;
  /** Header quote button's message (the page's product); the generic tip message without it. */
  quoteText?: string;
  /** Home page: no notice band (the order box is on the page) and, on phones, no category bar
   *  (the names beside the opening link every group). */
  home?: boolean;
  /** Home: the finder data, so the header search picks into the page's panel without a fetch. */
  finder?: readonly FinderMake[];
  children: ReactNode;
}

/** "Sipariş: WhatsApp · +90 …": how to order, in the header of every page; `note` ("Online ödeme
 *  henüz yok", home) after it, on a line of its own on phones. */
function OrderLine({ t, note, className = '' }: { t: Dict; note?: string; className?: string }) {
  const link = `underline decoration-hair-strong underline-offset-[3px] hover:text-brand-hi ${FOCUS}`;
  return (
    <p className={`m-0 font-sans text-ink-mid ${className}`}>
      <strong className="font-semibold text-ink">{t.nav.order.label}</strong>{' '}
      <a href={whatsappHref(t.nav.quoteText)} className={`text-ink ${link}`}>
        {t.nav.order.whatsapp}
      </a>
      {' · '}
      <a href={`tel:${ORG_PHONE_E164}`} className={`whitespace-nowrap text-ink ${link}`}>
        {ORG_PHONE}
      </a>
      {note && (
        <span className="text-ink-soft max-md:block">
          <span className="max-md:hidden"> · </span>
          {note}
        </span>
      )}
    </p>
  );
}

export default function Layout({
  lang,
  path,
  t,
  demo,
  hasPopular,
  quoteText,
  home,
  finder,
  children,
}: Props) {
  const other: Lang = lang === 'tr' ? 'en' : 'tr';
  const barRef = useRef<HTMLUListElement>(null);
  // Phones: the category bar scrolls sideways; bring the current group into view.
  useEffect(() => {
    const bar = barRef.current;
    const cur = bar?.querySelector<HTMLElement>('[aria-current="page"]');
    if (bar && cur && bar.scrollWidth > bar.clientWidth)
      bar.scrollLeft = cur.offsetLeft - (bar.clientWidth - cur.offsetWidth) / 2;
  }, []);
  const corporate = lang === 'tr' ? 'https://kervanbreaker.com/' : 'https://kervanbreaker.com/en/';
  // Category bar: every product group by name (tips first; owner: no umbrella "Yedek parçalar").
  const groups = [
    {
      href: localePath(LIST_PATH, lang),
      label: t.nav.groups.tips,
      current: TIP_PATHS.some((p) => path.startsWith(p)),
    },
    ...PART_KEYS.map((k) => ({
      href: localePath(partPath(k), lang),
      label: t.nav.groups[k],
      current: path === partPath(k) || path.startsWith(`${partPath(k)}/`),
    })),
  ];
  // "Çok satanlar": the last item of the bar below 1280 px, on its right side above.
  const popular = hasPopular
    ? { href: localePath(POPULAR_PATH, lang), label: t.nav.popular, current: path === POPULAR_PATH }
    : null;
  const nav = popular ? [...groups, popular] : groups;
  const navLink = `flex min-h-11 items-center whitespace-nowrap border-b-2 border-transparent text-ink hover:text-brand-hi aria-[current=page]:border-brand aria-[current=page]:text-brand-hi ${FOCUS_INSET}`;
  return (
    <FinderPickProvider>
      <a
        href="#icerik"
        className={`sr-only rounded-sm bg-brand px-4 py-2 font-sans text-sm font-medium text-on-brand focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 ${FOCUS}`}
      >
        {t.nav.skip}
      </a>
      {/* Logo, the make/model search (its own row below 1024 px) and the tools, how to order (a
          line under the search below 1024 px); then the groups, one line that scrolls sideways
          when it does not fit, with "Çok satanlar" and how to order on its right. */}
      <header className="relative z-20 border-b border-hair bg-bg">
        <Container
          wide
          className="flex flex-wrap items-center gap-x-2.5 gap-y-2.5 py-2.5 max-md:px-4 min-[23.4375rem]:gap-x-3 sm:gap-x-5 lg:min-h-[68px] lg:flex-nowrap lg:gap-x-4 lg:py-0 min-[73.75rem]:gap-x-7"
        >
          <a
            href={localePath('/', lang)}
            className={`flex shrink-0 items-center gap-1.5 min-[23.4375rem]:gap-2 sm:gap-2.5 ${FOCUS}`}
          >
            <img
              src="/logo-krv-v2.svg"
              alt=""
              width={112}
              height={36}
              className="h-6 w-auto sm:h-8"
            />
            <span className="flex flex-col leading-tight">
              <span className="whitespace-nowrap font-sans text-[13.5px] font-bold text-ink min-[23.4375rem]:text-[14.5px] sm:text-base">
                {ORG_TRADING_NAME}
              </span>
              <span className="hidden font-sans text-xs text-ink-mid min-[73.75rem]:inline">
                {t.top.shop}
              </span>
            </span>
          </a>
          <BreakerSearch
            lang={lang}
            t={t}
            id="kv-q"
            finder={finder}
            fromUrl
            className="order-3 basis-full lg:order-none lg:max-w-[680px] lg:flex-1 lg:basis-0"
          />
          <div
            role="group"
            aria-label={t.nav.tools}
            className="ml-auto flex items-center gap-x-2.5 font-sans text-sm min-[23.4375rem]:gap-x-3.5 sm:gap-x-[18px] lg:gap-x-3 xl:gap-x-[18px]"
          >
            {/* The corporate site, as on the old header from 1024 px; on the bar's right from 1280. */}
            <a
              href={corporate}
              className={`hidden min-h-11 items-center whitespace-nowrap text-ink-mid hover:text-ink lg:inline-flex xl:hidden ${FOCUS}`}
            >
              {t.nav.catalogSite}
            </a>
            <a
              href={localePath(path, other)}
              hrefLang={other}
              lang={other}
              aria-label={t.nav.langLabel}
              className={`inline-flex min-h-11 items-center font-medium text-ink hover:text-brand-hi ${FOCUS}`}
            >
              {t.nav.langOther}
            </a>
            <ThemeSelect t={t} />
            <CartLink lang={lang} t={t} current={path === CART_PATH} />
            <a
              href={whatsappHref(quoteText ?? t.nav.quoteText)}
              className={`inline-flex min-h-[38px] items-center whitespace-nowrap rounded-sm bg-brand px-2.5 font-semibold min-[23.4375rem]:px-3 text-on-brand hover:bg-brand-hi sm:min-h-10 sm:px-[18px] ${FOCUS}`}
            >
              {/* Short where the row is tight: phones, and beside the search below 1280 px. */}
              <span className="sm:hidden lg:inline xl:hidden">{t.nav.quoteShort}</span>
              <span className="hidden sm:inline lg:hidden xl:inline">{t.nav.quote}</span>
            </a>
          </div>
          <OrderLine
            t={t}
            note={home ? t.nav.order.note : undefined}
            className="order-4 -mt-0.5 basis-full text-[12.5px] leading-snug md:text-[13px] lg:hidden"
          />
        </Container>
        <nav
          aria-label={t.nav.label}
          className={`border-t border-hair ${home ? 'hidden md:block' : ''}`}
        >
          <Container wide className="flex items-center justify-between gap-6 lg:gap-5">
            <ul
              ref={barRef}
              className="-mx-6 my-0 flex min-w-0 list-none gap-x-1 overflow-x-auto px-4 py-0 font-sans text-[15px] font-semibold [scrollbar-width:none] sm:mx-0 sm:gap-x-[18px] sm:px-0 md:gap-x-3.5 md:text-sm xl:gap-x-5 xl:text-[14.5px] [&::-webkit-scrollbar]:hidden"
            >
              {groups.map((n) => (
                <li key={n.href} className="shrink-0">
                  <a
                    href={n.href}
                    aria-current={n.current ? 'page' : undefined}
                    className={`${navLink} px-2 sm:px-0`}
                  >
                    {n.label}
                  </a>
                </li>
              ))}
              {popular && (
                <li className="ml-2 shrink-0 border-l border-hair pl-2 sm:ml-0 sm:pl-[18px] md:pl-3.5 xl:hidden">
                  <a
                    href={popular.href}
                    aria-current={popular.current ? 'page' : undefined}
                    className={`${navLink} px-2 sm:px-0`}
                  >
                    {popular.label}
                  </a>
                </li>
              )}
            </ul>
            <div className="hidden shrink-0 items-center gap-5 font-sans lg:flex">
              {popular && (
                <a
                  href={popular.href}
                  aria-current={popular.current ? 'page' : undefined}
                  className={`hidden text-[14.5px] font-semibold xl:flex ${navLink}`}
                >
                  {popular.label}
                </a>
              )}
              <a
                href={corporate}
                className={`hidden min-h-11 items-center text-sm text-ink-mid hover:text-ink xl:inline-flex ${FOCUS}`}
              >
                {t.nav.catalogSite}
              </a>
              <OrderLine
                t={t}
                className="whitespace-nowrap border-l border-hair pl-4 text-[13.5px] xl:pl-5"
              />
            </div>
          </Container>
        </nav>
      </header>
      <div
        hidden={home}
        className="border-b border-hair bg-bg-soft font-sans text-[13px] text-ink-mid"
      >
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
        <div className="bg-brand font-sans text-sm font-medium text-on-brand">
          <Container className="py-2">{t.banner.demo}</Container>
        </div>
      )}
      <main id="icerik" tabIndex={-1}>
        {children}
      </main>
      <footer className="mt-24 border-t-2 border-ink bg-bg-soft">
        <Container
          wide
          className="flex flex-col gap-4 border-b border-hair py-8 sm:flex-row sm:items-center sm:justify-between"
        >
          <a href={localePath('/', lang)} className={`flex items-center gap-3 ${FOCUS}`}>
            <img
              src="/logo-krv-v2.svg"
              alt=""
              width={124}
              height={40}
              loading="lazy"
              className="h-10 w-auto"
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
        <Container
          wide
          className="grid gap-8 py-10 font-sans text-sm text-ink-mid sm:grid-cols-2 lg:grid-cols-5"
        >
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
                <a href={localePath(PARTS_PATH, lang)} className={`hover:text-ink ${FOCUS}`}>
                  {t.home.allGroups}
                </a>
              </li>
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
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
                  className={`cursor-pointer p-0 text-left hover:text-ink ${FOCUS}`}
                >
                  {t.footer.cookies}
                </button>
              </li>
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
                <a href={`mailto:${SHOP_EMAIL}`} className={`hover:text-ink ${FOCUS}`}>
                  {SHOP_EMAIL}
                </a>
              </li>
            </ul>
            <div className="mt-6">
              <p className={HEAD}>{t.footer.social}</p>
              <ul className="m-0 mt-3 flex list-none flex-wrap gap-4 p-0">
                {ORG_SOCIALS.map((s) => (
                  <li key={s.key}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.footer.socials[s.key]}
                      className={`inline-flex hover:text-ink ${FOCUS}`}
                    >
                      <SocialIcon name={s.key} size={18} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
        <div className="border-t border-hair">
          <Container
            wide
            className="flex flex-col gap-1 py-5 font-sans text-xs text-ink-soft sm:flex-row sm:justify-between sm:gap-6"
          >
            <p className="m-0">{t.footer.images}</p>
            <p className="m-0">{SELLER.name}</p>
          </Container>
        </div>
      </footer>
      <ConsentBanner lang={lang} t={t} />
    </FinderPickProvider>
  );
}
