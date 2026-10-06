import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { durations, editorialEase, useReducedMotion } from '@kervan/motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Lang, DictBlock } from '../types';
import { localePath, stripLang } from '../lib/locale-path';
import { rememberLang } from '../lib/use-lang';
import { SisterSiteStrip } from '@kervan/ui';

interface Props {
  lang: Lang;
  t: DictBlock;
  /** Tab is shown only while the server has confirmed an owner session. */
  techAuthed: boolean;
}

/** Top nav matches the original kervanheat.com long-scroll experience:
 *  five anchor-style links + a CTA. On Home the links scroll to in-page
 *  sections; on detail routes (e.g. /urunler/keski) they navigate back
 *  to "/" with the hash, which the browser then resolves into a scroll
 *  via `scroll-padding-top` defined in globals.css. */
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

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { hash: 'products', label: t.nav.products },
    { hash: 'atolye', label: t.nav.atolye },
    { hash: 'craft', label: t.nav.craft },
    { hash: 'industries', label: t.nav.industries },
    { hash: 'contact', label: t.nav.contact },
  ];

  const renderLink = (hash: string, label: string, onClick?: () => void) => {
    if (onHome) {
      return (
        <a
          key={hash}
          href={`#${hash}`}
          onClick={onClick}
          className="text-ink-mid hover:text-ink transition-colors"
        >
          {label}
        </a>
      );
    }
    return (
      <Link
        key={hash}
        to={to(`/#${hash}`)}
        onClick={onClick}
        className="text-ink-mid hover:text-ink transition-colors"
      >
        {label}
      </Link>
    );
  };

  // Real route (not a Home anchor), so always a <Link>.
  const renderTechLink = (onClick?: () => void) => (
    <Link
      key="tech"
      to={to('/teknik-bilgiler')}
      onClick={onClick}
      className="text-ink-mid hover:text-ink transition-colors"
    >
      {t.nav.tech}
    </Link>
  );

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
        image="/sister/kervanheat-firin-01.webp"
        hidden={stuck}
        // First visit: after the intro curtain and the opening glide to the hero; later visits right away.
        sheenAt={{ first: 3.4, later: 1 }}
      />
      <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        <Link to={to('/')} className="flex items-center" aria-label={t.nav.home}>
          <img
            src="/logo-krv-128.png"
            alt="Kervan Breaker"
            width={40}
            height={40}
            className="h-10 w-10 md:h-11 md:w-11 select-none"
            draggable={false}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-10 font-sans text-sm">
          {links.map((l) => renderLink(l.hash, l.label))}
          {techAuthed && renderTechLink()}
        </nav>

        <div className="flex items-center gap-3">
          <Link
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
            className="min-h-11 min-w-11 inline-flex items-center justify-center font-sans text-xs tracking-widest uppercase text-ink-mid hover:text-ink px-2 transition-colors"
            aria-label={t.nav.language}
          >
            {lang === 'tr' ? 'EN' : 'TR'}
          </Link>
          {onHome ? (
            <a
              href="#contact"
              className="hidden sm:inline-block bg-brand text-bg px-5 py-2 font-sans text-sm hover:bg-brand-hi transition-colors"
            >
              {t.nav.cta}
            </a>
          ) : (
            <Link
              to={to('/#contact')}
              className="hidden sm:inline-block bg-brand text-bg px-5 py-2 font-sans text-sm hover:bg-brand-hi transition-colors"
            >
              {t.nav.cta}
            </Link>
          )}
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
              {links.map((l) => renderLink(l.hash, l.label, () => setOpen(false)))}
              {techAuthed && renderTechLink(() => setOpen(false))}
              <Link
                to={to('/#contact')}
                onClick={() => setOpen(false)}
                className="sm:hidden mt-2 bg-brand text-bg px-5 py-3 font-sans text-sm text-center"
              >
                {t.nav.cta}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
