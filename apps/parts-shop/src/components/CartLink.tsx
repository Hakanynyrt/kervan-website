import { useEffect, useState } from 'react';
import { CART_EVENT, cartCount, readCart } from '../lib/cart';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { CART_PATH } from '../lib/routes';
import type { Lang } from '../types';
import { FOCUS } from './Layout';

/** Header link to the cart; the count appears after hydration (the cart is in this browser). */
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
      className={`inline-flex items-center gap-1.5 text-ink hover:text-brand-hi aria-[current=page]:text-brand-hi ${FOCUS}`}
    >
      {t.nav.cart}
      {n > 0 && (
        <span className="rounded-sm bg-brand px-1.5 text-xs font-semibold text-white tabular-nums">
          {n}
        </span>
      )}
    </a>
  );
}
