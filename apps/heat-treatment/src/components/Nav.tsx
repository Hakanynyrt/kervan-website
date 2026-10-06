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
import { SisterSiteStrip } from '@kervan/ui';

interface Props {
  lang: Lang;
  t: DictBlock;
  /** Tab is shown only while the server has confirmed an owner session. */
  techAuthed: boolean;
}

export default function Nav({ lang, t, techAuthed }: Props) {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
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

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    { href: '#hizmetler', label: t.nav.services },
    { href: '#teknik-kapasite', label: t.nav.capacity },
    ...(techAuthed ? [{ href: '#teknik-bilgiler', label: t.nav.tech }] : []),
    { href: '#imalathanemiz', label: t.nav.craft },
    { href: '#hakkimizda', label: t.nav.about },
    { href: '#contact', label: t.nav.contact },
  ];

  return (
    <header
      className={
        'fixed top-0 inset-x-0 z-40 transition-all duration-300 ' +
        (stuck
          ? // Slides the sister strip away, but not while its link has keyboard focus (see SisterSiteStrip).
            '-translate-y-(--kv-strip-h) has-[[data-sister-link]:focus-visible]:translate-y-0 bg-bg/85 backdrop-blur-md border-b border-hair'
          : 'bg-transparent')
      }
    >
      <SisterSiteStrip
        lang={lang}
        t={t.sister}
        image="/sister/kervanbreaker-uclar-01.webp"
        hidden={stuck}
        // Hero's last stat ends ~2 s after its start (which waits 2 s for the intro curtain on a first visit).
        sheenAt={{ first: 4.1, later: 2.1 }}
      />
      <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        <a href={pathForLang(lang)} className="flex items-center" aria-label={t.nav.home}>
          <img
            src="/logo-krv-128.png"
            alt="Kervan Heat"
            width={40}
            height={40}
            className="h-10 w-10 md:h-11 md:w-11 select-none"
            draggable={false}
          />
        </a>

        <nav className="hidden md:flex items-center gap-10 font-sans text-sm">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-ink-mid hover:text-ink transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={otherHref}
            hrefLang={otherLang}
            lang={otherLang}
            onClick={onLangClick}
            onKeyDown={onLangKey}
            className="min-h-11 min-w-11 inline-flex items-center justify-center font-sans text-xs tracking-widest uppercase text-ink-mid hover:text-ink px-2 transition-colors"
            aria-label={t.nav.language}
          >
            {otherLang === 'en' ? 'EN' : 'TR'}
          </a>
          <a
            href="#contact"
            className="hidden sm:inline-block bg-brand text-bg px-5 py-2 font-sans text-sm hover:bg-brand-hi transition-colors"
          >
            {t.nav.cta}
          </a>
          <button
            ref={menuBtn}
            className="md:hidden -mr-2 h-11 w-11 flex flex-col items-center justify-center gap-1.5"
            aria-label={t.nav.menu}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="w-5 h-px bg-ink" />
            <span className="w-5 h-px bg-ink" />
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
            className="md:hidden overflow-hidden bg-bg border-b border-hair"
          >
            <div className="px-6 py-4 flex flex-col gap-4 font-serif text-2xl">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-ink">
                  {l.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="sm:hidden mt-2 bg-brand text-bg px-5 py-3 font-sans text-sm text-center"
              >
                {t.nav.cta}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
