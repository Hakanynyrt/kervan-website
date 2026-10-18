import { Link } from 'react-router-dom';
import { ORG_PUBLIC_EMAIL, ORG_SOCIALS } from '@kervan/seo';
import { SocialIcon } from '@kervan/ui';
import type { DictBlock } from '../types';
import { useLocale, useLocalePath } from '../lib/locale-path';
import { shopUrl } from '../lib/shop';

interface Props {
  t: DictBlock;
}

export default function Footer({ t }: Props) {
  const to = useLocalePath();
  const lang = useLocale();
  return (
    // relative + z-[1]: always above the fixed 3D scene layer (z-0).
    <footer className="relative z-[1] border-t border-hair">
      <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-12 flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-center justify-between">
        <Link to={to('/')} className="flex items-baseline gap-3">
          <span className="font-serif italic text-3xl text-ink leading-none">K</span>
          <div className="flex flex-col">
            <span className="font-sans text-sm font-medium text-ink">{t.footer.brand}</span>
            <span className="font-serif italic text-sm text-ink-soft">{t.footer.tag}</span>
          </div>
        </Link>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-ink-mid items-center">
          {ORG_SOCIALS.map(({ key, url }) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.footer.social[key]}
              className="inline-flex items-center justify-center w-8 h-8 hover:text-ink transition-colors"
            >
              <SocialIcon name={key} />
            </a>
          ))}
          {/* Sister sites: same tab, no rel, like the sister-site strip. */}
          <a
            href={lang === 'en' ? 'https://kervanheat.com/en/' : 'https://kervanheat.com/'}
            hrefLang={lang}
            className="hover:text-ink transition-colors"
          >
            kervanheat.com
          </a>
          <a href={shopUrl('/', lang)} hrefLang={lang} className="hover:text-ink transition-colors">
            kiriciparca.com
          </a>
          <a href="/kvkk" className="hover:text-ink transition-colors">
            {t.footer.kvkk}
          </a>
          <a href={`mailto:${ORG_PUBLIC_EMAIL}`} className="hover:text-ink transition-colors">
            {ORG_PUBLIC_EMAIL}
          </a>
          <a href="tel:+905316693734" className="hover:text-ink transition-colors">
            +90 531 669 37 34
          </a>
        </nav>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-sans text-xs text-ink-soft tracking-wide">
          <span>{t.footer.rights}</span>
          {/* Quiet text link to the technical-info page (label reuses nav.tech). */}
          <Link to={to('/teknik-bilgiler')} className="hover:text-ink transition-colors">
            {t.nav.tech}
          </Link>
        </div>
      </div>
    </footer>
  );
}
