import {
  KERVAN_BREAKER_URL,
  KERVAN_SHOP_URL,
  ORG_EMAIL,
  ORG_INSTAGRAM,
  ORG_PHONE,
  ORG_PHONE_E164,
} from '@kervan/seo';
import type { DictBlock, Lang, ServiceLink } from '../types';
import { CONSENT_OPEN_EVENT } from '../lib/ads';
import { WRAP } from '../lib/ui';

interface Props {
  t: DictBlock;
  lang: Lang;
}

const linkBox =
  'inline-flex flex-col justify-center min-h-12 min-w-11 px-2.5 py-1 font-sans text-[15px] leading-[1.3] text-ink hover:underline underline-offset-2';
const legal =
  'inline-flex items-center justify-center min-h-11 min-w-11 px-2.5 text-ink-mid hover:text-ink hover:underline underline-offset-2';

export default function Footer({ t, lang }: Props) {
  const home = lang === 'en' ? '/en/' : '/';
  // "Katalog" / "Online mağaza": the labels of the sister-site bullets in the second service card.
  const sister = t.services.items.flatMap((i) =>
    i.bullets.filter((b): b is ServiceLink => typeof b !== 'string'),
  );
  const links = [
    { href: KERVAN_BREAKER_URL + home, small: sister[0]?.label, text: 'kervanbreaker.com', lang },
    { href: KERVAN_SHOP_URL + home, small: sister[1]?.label, text: 'kiriciparca.com', lang },
    { href: `mailto:${ORG_EMAIL}`, small: t.contact.emailLabel, text: ORG_EMAIL },
    { href: `tel:${ORG_PHONE_E164}`, small: t.contact.phoneLabel, text: ORG_PHONE },
  ];
  return (
    <footer className="bg-bg-soft border-t border-hair">
      <div className={`${WRAP} pt-10 pb-8`}>
        <div className="flex flex-col gap-3 min-[721px]:flex-row min-[721px]:flex-wrap min-[721px]:justify-between min-[721px]:gap-8 items-start">
          <div className="flex items-center gap-3.5 min-h-11">
            {/* The KRV mark (same file as the header); the brand name follows, so no alt text. */}
            <img
              src="/logo-krv-v2.svg"
              alt=""
              width={124}
              height={40}
              className="h-[22px] w-auto select-none"
              draggable={false}
              loading="lazy"
            />
            <div className="flex flex-col whitespace-nowrap font-sans">
              <span className="text-[15px] font-bold text-ink">{t.footer.brand}</span>
              <span className="text-sm text-ink-mid">{t.footer.tag}</span>
            </div>
          </div>

          <nav className="flex flex-col -ml-2.5 min-[721px]:ml-0 min-[721px]:flex-row min-[721px]:flex-wrap min-[721px]:gap-x-2 min-[721px]:gap-y-1">
            {/* Sister sites: same tab, no rel. */}
            {links.map((l) => (
              <a key={l.href} href={l.href} hrefLang={l.lang} className={linkBox}>
                <small className="text-[13px] text-ink-mid">{l.small}</small>
                <b className="font-semibold">{l.text}</b>
              </a>
            ))}
            <a
              href={ORG_INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram @kervanmakina"
              className="self-start inline-flex items-center justify-center min-h-12 min-w-12 text-ink-mid hover:text-ink"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </nav>
        </div>

        <div className="mt-6 pt-3 border-t border-hair flex flex-col-reverse items-start gap-2 min-[721px]:flex-row min-[721px]:flex-wrap min-[721px]:items-center min-[721px]:justify-between min-[721px]:gap-x-4 font-sans text-[13px] text-ink-mid">
          <span>{t.footer.rights}</span>
          <span className="flex gap-1 -ml-2.5 min-[721px]:ml-0">
            <a href="/kvkk" className={legal}>
              {t.footer.kvkk}
            </a>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
              className={legal}
            >
              {t.footer.cookies}
            </button>
          </span>
        </div>
      </div>
    </footer>
  );
}
