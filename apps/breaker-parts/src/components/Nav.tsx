import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import type { Lang, DictBlock } from '../types';

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: DictBlock;
}

/** Top nav matches the original kervanheat.com long-scroll experience:
 *  five anchor-style links + a CTA. On Home the links scroll to in-page
 *  sections; on detail routes (e.g. /urunler/keski) they navigate back
 *  to "/" with the hash, which the browser then resolves into a scroll
 *  via `scroll-padding-top` defined in globals.css. */
export default function Nav({ lang, setLang, t }: Props) {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const { pathname } = useLocation();
  const onHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { hash: 'products',   label: t.nav.products },
    { hash: 'atolye',     label: t.nav.atolye },
    { hash: 'craft',      label: t.nav.craft },
    { hash: 'industries', label: t.nav.industries },
    { hash: 'contact',    label: t.nav.contact },
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
        to={`/#${hash}`}
        onClick={onClick}
        className="text-ink-mid hover:text-ink transition-colors"
      >
        {label}
      </Link>
    );
  };

  return (
    <header
      className={
        'fixed top-0 inset-x-0 z-40 transition-all duration-300 ' +
        (stuck ? 'bg-bg/85 backdrop-blur-md border-b border-hair' : 'bg-transparent')
      }
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="Kervan Breaker — anasayfa">
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
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            className="font-sans text-xs tracking-widest uppercase text-ink-mid hover:text-ink px-2 py-1 transition-colors"
            aria-label="Language"
          >
            {lang === 'tr' ? 'EN' : 'TR'}
          </button>
          {onHome ? (
            <a
              href="#contact"
              className="hidden sm:inline-block bg-brand text-bg px-5 py-2 font-sans text-sm hover:bg-brand-hi transition-colors"
            >
              {t.nav.cta}
            </a>
          ) : (
            <Link
              to="/#contact"
              className="hidden sm:inline-block bg-brand text-bg px-5 py-2 font-sans text-sm hover:bg-brand-hi transition-colors"
            >
              {t.nav.cta}
            </Link>
          )}
          <button
            className="md:hidden flex flex-col gap-1.5 p-1"
            aria-label="Menu"
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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden bg-bg border-b border-hair"
          >
            <div className="px-6 py-4 flex flex-col gap-4 font-serif text-2xl">
              {links.map((l) =>
                renderLink(l.hash, l.label, () => setOpen(false)),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
