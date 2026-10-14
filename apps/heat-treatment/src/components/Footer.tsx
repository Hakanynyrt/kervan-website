import { KERVAN_BREAKER_URL, KERVAN_SHOP_URL } from '@kervan/seo';
import type { DictBlock, Lang } from '../types';
import { CONSENT_OPEN_EVENT } from '../lib/ads';

interface Props {
  t: DictBlock;
  lang: Lang;
}

export default function Footer({ t, lang }: Props) {
  const home = lang === 'en' ? '/en/' : '/';
  return (
    <footer className="border-t border-hair">
      <div className="max-w-[1280px] mx-auto px-8 py-12 flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-center justify-between">
        <div className="flex items-center gap-4 shrink-0">
          {/* The KRV mark (same file as the header); the brand name follows, so no alt text. */}
          <img
            src="/logo-krv-v2.svg"
            alt=""
            width={124}
            height={40}
            className="h-8 w-auto select-none"
            draggable={false}
            loading="lazy"
          />
          <div className="flex flex-col whitespace-nowrap">
            <span className="font-sans text-sm font-medium text-ink">{t.footer.brand}</span>
            <span className="font-serif italic text-sm text-ink-soft">{t.footer.tag}</span>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-ink-mid items-center">
          {/* Instagram — icon only, no handle text. WhatsApp lives in
              the floating button (z-40 fixed bottom-right). */}
          <a
            href="https://www.instagram.com/kervanmakina/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram @kervanmakina"
            className="inline-flex items-center justify-center w-8 h-8 hover:text-ink transition-colors"
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
          {/* Sister sites: same tab, no rel, like the sister-site strip. */}
          <a
            href={KERVAN_BREAKER_URL + home}
            hrefLang={lang}
            className="hover:text-ink transition-colors"
          >
            kervanbreaker.com
          </a>
          <a
            href={KERVAN_SHOP_URL + home}
            hrefLang={lang}
            className="hover:text-ink transition-colors"
          >
            kiriciparca.com
          </a>
          <a href="/kvkk" className="hover:text-ink transition-colors">
            {t.footer.kvkk}
          </a>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
            className="hover:text-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
          >
            {t.footer.cookies}
          </button>
          <a href="mailto:info@kervanheat.com" className="hover:text-ink transition-colors">
            info@kervanheat.com
          </a>
          <a href="tel:+905316693734" className="hover:text-ink transition-colors">
            +90 531 669 37 34
          </a>
        </nav>

        <div className="font-sans text-xs text-ink-soft tracking-wide">{t.footer.rights}</div>
      </div>
    </footer>
  );
}
