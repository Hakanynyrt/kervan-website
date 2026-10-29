import { Link } from 'react-router-dom';
import {
  KERVAN_HEAT_URL,
  ORG_PHONE,
  ORG_PHONE_E164,
  ORG_PUBLIC_EMAIL,
  ORG_SOCIALS,
} from '@kervan/seo';
import { SocialIcon } from '@kervan/ui';
import type { DictBlock } from '../types';
import { useLocale, useLocalePath } from '../lib/locale-path';
import { shopUrl } from '../lib/shop';
import { WRAP } from '../lib/ui';

interface Props {
  t: DictBlock;
}

const linkBox =
  'inline-flex flex-col justify-center min-h-12 min-w-11 px-2.5 py-1 font-sans text-[15px] leading-[1.3] text-ink hover:underline underline-offset-2';
const legal =
  'inline-flex items-center justify-center min-h-11 min-w-11 px-2.5 text-ink-mid hover:text-ink hover:underline underline-offset-2';

/** Footer (kervanheat.com's layout): the mark, the sister sites, e-mail and phone, the social
 *  profiles, and a legal row with KVKK and a quiet link to the owner's technical page. */
export default function Footer({ t }: Props) {
  const to = useLocalePath();
  const lang = useLocale();
  const links = [
    {
      href: lang === 'en' ? `${KERVAN_HEAT_URL}/en/` : `${KERVAN_HEAT_URL}/`,
      small: t.footer.heatLabel,
      text: 'kervanheat.com',
      lang,
    },
    { href: shopUrl('/', lang), small: t.shop.contactLabel, text: 'kiriciparca.com', lang },
    { href: `mailto:${ORG_PUBLIC_EMAIL}`, small: t.contact.emailLabel, text: ORG_PUBLIC_EMAIL },
    { href: `tel:${ORG_PHONE_E164}`, small: t.contact.phoneLabel, text: ORG_PHONE },
  ];
  return (
    <footer className="bg-bg-soft border-t border-hair">
      <div className={`${WRAP} pt-10 pb-8`}>
        <div className="flex flex-col gap-3 min-[721px]:flex-row min-[721px]:flex-wrap min-[721px]:justify-between min-[721px]:gap-8 items-start">
          <Link to={to('/')} className="flex items-center gap-3.5 min-h-11">
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
            <span className="flex flex-col whitespace-nowrap font-sans">
              <span className="text-[15px] font-bold text-ink">{t.footer.brand}</span>
              <span className="text-sm text-ink-mid">{t.footer.tag}</span>
            </span>
          </Link>

          <nav className="flex flex-col -ml-2.5 min-[721px]:ml-0 min-[721px]:flex-row min-[721px]:flex-wrap min-[721px]:gap-x-2 min-[721px]:gap-y-1">
            {/* Sister sites: same tab, no rel. */}
            {links.map((l) => (
              <a key={l.href} href={l.href} hrefLang={l.lang} className={linkBox}>
                <small className="text-[13px] text-ink-mid">{l.small}</small>
                <b className="font-semibold">{l.text}</b>
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-4 flex flex-wrap -ml-3 gap-1">
          {ORG_SOCIALS.map(({ key, url }) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.footer.social[key]}
              className="inline-flex items-center justify-center min-w-11 min-h-11 text-ink-mid hover:text-ink transition-colors"
            >
              <SocialIcon name={key} />
            </a>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-hair flex flex-col-reverse items-start gap-2 min-[721px]:flex-row min-[721px]:flex-wrap min-[721px]:items-center min-[721px]:justify-between min-[721px]:gap-x-4 font-sans text-[13px] text-ink-mid">
          <span>{t.footer.rights}</span>
          <span className="flex gap-1 -ml-2.5 min-[721px]:ml-0">
            <a href="/kvkk" className={legal}>
              {t.footer.kvkk}
            </a>
            {/* Quiet text link to the technical-info page (label reuses nav.tech). */}
            <Link to={to('/teknik-bilgiler')} className={legal}>
              {t.nav.tech}
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
