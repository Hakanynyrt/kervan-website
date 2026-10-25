import { useEffect, useState } from 'react';
import { CART_EVENT, cartCount, readCart } from '../lib/cart';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { CART_PATH } from '../lib/routes';
import type { Lang } from '../types';
import { FOCUS } from './Layout';

/**
 * Header link to the cart ("Palet", with a cart icon and the hint "(sepetiniz)" under it; on
 * phones the icon over a small "Palet"); the count appears after hydration (the cart is in this
 * browser).
 */
export function CartLink({ lang, t, current }: { lang: Lang; t: Dict; current: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const load = () => setN(cartCount(readCart()));
    load();
    window.addEventListener(CART_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(CART_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, []);
  return (
    <a
      href={localePath(CART_PATH, lang)}
      aria-current={current ? 'page' : undefined}
      aria-label={t.nav.cartLabel(n)}
      className={`relative inline-flex min-h-11 flex-col items-center justify-center gap-px text-[11px] leading-none text-ink hover:text-brand-hi aria-[current=page]:text-brand-hi sm:flex-row sm:gap-2 sm:text-sm sm:leading-tight ${FOCUS}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="block shrink-0"
      >
        <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" />
        <circle cx="9.5" cy="19" r="1.4" />
        <circle cx="16.5" cy="19" r="1.4" />
      </svg>
      <span className="flex flex-col leading-tight">
        <span>{t.nav.cart}</span>
        {/* Owner's word "palet", explained where it first appears; only here. Phones, and the
            row beside the search below 1280 px, have no room for it (the link's accessible name
            still says it). */}
        {t.nav.cartHint && (
          <span className="hidden text-xs text-ink-mid sm:block lg:hidden xl:block">
            {t.nav.cartHint}
          </span>
        )}
      </span>
      {n > 0 && (
        <span className="rounded-sm bg-brand px-1.5 text-xs font-semibold text-on-brand tabular-nums max-sm:absolute max-sm:-right-2.5 max-sm:top-0.5">
          {n}
        </span>
      )}
    </a>
  );
}
