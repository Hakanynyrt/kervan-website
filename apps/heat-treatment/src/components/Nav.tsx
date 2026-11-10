import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { durations, editorialEase, useReducedMotion } from '@kervan/motion';
import type { Lang, DictBlock } from '../types';
import { pathForLang, rememberLang } from '../lib/use-lang';
import { ThemeSelect } from '@kervan/ui';
import { Button } from '@astryxdesign/core/Button';
import { SOLID_HOVER, WRAP } from '../lib/ui';

/** `<meta name="theme-color">` per theme; same values as the inline script in index.html. */
const THEME_COLOR = { light: '#FFFFFF', dark: '#1A1D20' };

interface Props {
  lang: Lang;
  t: DictBlock;
  /** Tab is shown only while the server has confirmed an owner session. */
  techAuthed: boolean;
}

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

  // The language toggle is a real link to the other-language URL of this page.
  const otherLang: Lang = lang === 'tr' ? 'en' : 'tr';
  const otherHref = pathForLang(otherLang);
  const onLangClick = (e: MouseEvent<HTMLAnchorElement>) => {
    rememberLang(otherLang);
    // Keep the visitor's section: carry the current #hash over.
    if (window.location.hash && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      window.location.assign(otherHref + window.location.hash);
    }
  };
  // Links activate on Enter natively; Space too, like the button it replaced.
  const onLangKey = (e: ReactKeyboardEvent<HTMLAnchorElement>) => {
    if (e.key !== ' ') return;
    e.preventDefault();
    e.currentTarget.click();
  };

  const links = [
    { href: '#teknik-kapasite', label: t.nav.capacity },
    { href: '#hizmetler', label: t.nav.services },
    ...(techAuthed ? [{ href: '#teknik-bilgiler', label: t.nav.tech }] : []),
    { href: '#tesisimiz', label: t.nav.craft },
    { href: '#hakkimizda', label: t.nav.about },
    { href: '#contact', label: t.nav.contact },
  ];

  const langCell =
    'min-h-11 min-w-11 inline-flex items-center justify-center px-2 font-sans text-sm font-semibold transition-colors';

  return (
    <header className="sticky top-0 z-40 bg-bg border-b border-hair">
      <div
        className={`${WRAP} h-[60px] min-[721px]:h-[68px] flex items-center gap-2 min-[721px]:gap-7`}
      >
        <a
          href={pathForLang(lang)}
          className="flex items-center min-h-11 min-w-11"
          aria-label={t.nav.home}
        >
          {/* The link's aria-label names it, so the mark itself has no alt text. */}
          <img
            src="/logo-krv-v2.svg"
            alt=""
            width={124}
            height={40}
            className="h-[22px] min-[721px]:h-[26px] w-auto select-none"
            draggable={false}
          />
        </a>

        <nav className="hidden min-[1100px]:flex items-center gap-1 ml-3 font-sans">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="flex items-center min-h-11 px-3 text-[15px] font-medium text-ink-mid hover:text-ink transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div
            role="group"
            aria-label={t.nav.language}
            className="flex border border-hair-strong rounded-[2px]"
          >
            {(['tr', 'en'] as Lang[]).map((l) =>
              l === lang ? (
                <a
                  key={l}
                  href={pathForLang(l)}
                  lang={l}
                  aria-current="page"
                  className={`${langCell} text-ink bg-bg-soft`}
                >
                  {t.nav.langShort[l]}
                </a>
              ) : (
                <a
                  key={l}
                  href={otherHref}
                  hrefLang={otherLang}
                  lang={otherLang}
                  onClick={onLangClick}
                  onKeyDown={onLangKey}
                  className={`${langCell} text-ink-mid hover:text-ink`}
                >
                  {t.nav.langShort[l]}
                </a>
              ),
            )}
          </div>
          {/* Light by day, dark at night (the edge middleware); this overrides it. lg+ only, like the shop's. */}
          <ThemeSelect
            t={t.nav.theme}
            themeColor={THEME_COLOR}
            // The control is 44 px over the box's 1 px border, so the whole box takes the tap.
            className="hidden lg:flex items-center justify-center h-11 min-w-11 px-2.5 border border-hair-strong rounded-[2px] [&_.astryx-selector]:min-h-11"
          />
          {/* Every width: on phones it is the quickest way to the form. */}
          <Button
            href="#contact"
            label={t.nav.cta}
            variant="primary"
            className={`px-3.5 min-[721px]:px-[18px] text-[15px] font-semibold ${SOLID_HOVER}`}
          />
          <Button
            ref={menuBtn}
            label={t.nav.menu}
            variant="ghost"
            isIconOnly
            icon={
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
            }
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
            className="min-[1100px]:hidden border border-hair-strong hover:bg-none"
          />
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
            <div className={`${WRAP} py-2 flex flex-col font-sans`}>
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center min-h-12 border-b border-hair last:border-b-0 text-lg font-semibold text-ink"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
