import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { durations, editorialEase, useReducedMotion } from '@kervan/motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeSelect } from '@kervan/ui';
import type { Lang, DictBlock } from '../types';
import { localePath, stripLang } from '../lib/locale-path';
import { shopUrl } from '../lib/shop';
import { rememberLang } from '../lib/use-lang';
import { WHATSAPP_URL } from '../lib/contact';
import { ArrowOut, ChatIcon } from './icons';

/** `<meta name="theme-color">` per theme; same values as the inline script in index.html. */
const THEME_COLOR = { light: '#FFFFFF', dark: '#1A1D20' };

interface Props {
  lang: Lang;
  t: DictBlock;
  /** Tab is shown only while the server has confirmed an owner session. */
  techAuthed: boolean;
}

const BOX_BTN =
  'items-center justify-center min-h-11 min-w-11 border border-hair-strong rounded-[2px]';
const LANG_CELL =
  'min-h-11 min-w-11 inline-flex items-center justify-center px-2 font-sans text-sm font-semibold transition-colors';
const DESK_LINK =
  'flex items-center gap-1.5 min-h-11 px-3 text-[15px] font-medium text-ink-mid hover:text-ink transition-colors';
const MENU_LINK =
  'flex items-center gap-2 min-h-12 border-b border-hair last:border-b-0 text-lg font-semibold text-ink';

/** The sticky header (white by day, graphite at night, like kervanheat.com): logo, the section
 *  links (on Home they scroll to the sections; on other routes they go to "/#section"), the shop,
 *  TR/EN, the theme select, WhatsApp (below 1100 px), "Teklif Al" and the menu button. */
export default function Nav({ lang, t, techAuthed }: Props) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const menuBtn = useRef<HTMLButtonElement>(null);

  // Esc closes the mobile menu and returns focus to its button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      menuBtn.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const { pathname, search, hash: locHash } = useLocation();
  const navigate = useNavigate();
  const onHome = stripLang(pathname) === '/';
  const to = (path: string) => localePath(path, lang);
  // The same page in the other language (the URL decides the language). The
  // href is the bare path so it matches the prerendered markup; a click also
  // carries the query (e.g. ?part=) and hash over.
  const otherLang: Lang = lang === 'tr' ? 'en' : 'tr';
  const otherHref = localePath(stripLang(pathname), otherLang);

  // A route change always closes the mobile menu.
  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { hash: 'products', label: t.nav.products },
    { hash: 'atolye', label: t.nav.atolye },
    { hash: 'craft', label: t.nav.craft },
    { hash: 'industries', label: t.nav.industries },
    { hash: 'contact', label: t.nav.contact },
  ];

  const close = () => setOpen(false);

  const renderLink = (hash: string, label: string, className: string, onClick?: () => void) =>
    onHome ? (
      <a key={hash} href={`#${hash}`} onClick={onClick} className={className}>
        {label}
      </a>
    ) : (
      <Link key={hash} to={to(`/#${hash}`)} onClick={onClick} className={className}>
        {label}
      </Link>
    );

  // Real route (not a Home anchor), so always a <Link>.
  const renderTechLink = (className: string, onClick?: () => void) => (
    <Link key="tech" to={to('/teknik-bilgiler')} onClick={onClick} className={className}>
      {t.nav.tech}
    </Link>
  );

  // The sister shop (kiriciparca.com): same tab, no rel.
  const renderShopLink = (className: string, onClick?: () => void) => (
    <a key="shop" href={shopUrl('/', lang)} hrefLang={lang} onClick={onClick} className={className}>
      {t.shop.nav}
      <span className="sr-only"> {t.shop.navSr}</span>
      <ArrowOut size={14} />
    </a>
  );

  const ctaClass =
    'inline-flex items-center min-h-11 px-3.5 md:px-[18px] rounded-[2px] bg-brand text-on-brand font-sans text-[15px] font-semibold whitespace-nowrap hover:bg-brand-hi transition-colors';

  return (
    <header className="sticky top-0 z-40 bg-bg border-b border-hair">
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 h-[60px] md:h-[68px] flex items-center gap-1.5 md:gap-5">
        <Link to={to('/')} className="flex items-center min-h-11 min-w-11" aria-label={t.nav.home}>
          {/* The link's aria-label names it, so the mark itself has no alt text. */}
          <img
            src="/logo-krv-v2.svg"
            alt=""
            width={124}
            height={40}
            className="h-5 md:h-[26px] w-auto select-none"
            draggable={false}
          />
        </Link>

        <nav className="hidden min-[1100px]:flex items-center gap-0.5 ml-2 font-sans">
          {links.map((l) => renderLink(l.hash, l.label, DESK_LINK))}
          {techAuthed && renderTechLink(DESK_LINK)}
          {renderShopLink(`${DESK_LINK} text-ink`)}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          <div
            role="group"
            aria-label={t.nav.language}
            className="flex border border-hair-strong rounded-[2px]"
          >
            {(['tr', 'en'] as Lang[]).map((l) =>
              l === lang ? (
                <Link
                  key={l}
                  to={localePath(stripLang(pathname), l)}
                  lang={l}
                  aria-current="page"
                  className={`${LANG_CELL} text-ink bg-bg-soft`}
                >
                  {t.nav.langShort[l]}
                </Link>
              ) : (
                <Link
                  key={l}
                  to={otherHref}
                  hrefLang={otherLang}
                  lang={otherLang}
                  onKeyDown={(e: ReactKeyboardEvent<HTMLAnchorElement>) => {
                    // Links activate on Enter natively; Space too, like the button it replaced.
                    if (e.key !== ' ') return;
                    e.preventDefault();
                    e.currentTarget.click();
                  }}
                  onClick={(e) => {
                    rememberLang(otherLang);
                    if (!search && !locHash) return;
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    e.preventDefault();
                    navigate(otherHref + search + locHash);
                  }}
                  className={`${LANG_CELL} text-ink-mid hover:text-ink`}
                >
                  {t.nav.langShort[l]}
                </Link>
              ),
            )}
          </div>
          {/* Light by day, dark at night (the edge middleware); this overrides it. lg+ only, like the shop's. */}
          <ThemeSelect
            t={t.nav.theme}
            themeColor={THEME_COLOR}
            className={`hidden lg:flex px-2.5 ${BOX_BTN} [&_select]:normal-case [&_select]:tracking-normal [&_select]:text-sm [&_select]:font-medium [&_select]:min-h-0`}
          />
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.contact.whatsappLabel}
            className={`flex min-[1100px]:hidden ${BOX_BTN} text-ink`}
          >
            <ChatIcon size={20} />
          </a>
          {/* Every width: on phones it is the quickest way to the form. */}
          {onHome ? (
            <a href="#contact" className={ctaClass}>
              {t.nav.cta}
            </a>
          ) : (
            <Link to={to('/#contact')} className={ctaClass}>
              {t.nav.cta}
            </Link>
          )}
          <button
            ref={menuBtn}
            className={`flex min-[1100px]:hidden ${BOX_BTN} text-ink`}
            aria-label={t.nav.menu}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : durations.sm, ease: editorialEase }}
            className="min-[1100px]:hidden overflow-hidden bg-bg border-t border-hair"
          >
            <div className="px-4 md:px-8 py-2 flex flex-col font-sans">
              {links.map((l) => renderLink(l.hash, l.label, MENU_LINK, close))}
              {techAuthed && renderTechLink(MENU_LINK, close)}
              {renderShopLink(MENU_LINK, close)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
