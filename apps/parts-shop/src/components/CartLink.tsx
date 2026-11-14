import { useEffect, useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { CART_EVENT, cartCount, readCart } from '../lib/cart';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { CART_PATH } from '../lib/routes';
import type { Lang } from '../types';
import { FOCUS } from './Layout';

const CART_ICON = (
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
);

/**
 * Header link to the cart ("Palet", with a cart icon and the hint "(sepetiniz)" under it; on
 * phones the icon over a small "Palet"); the count appears after hydration (the cart is in this
 * browser). `primary` (pages that show a price): the orange button of the header instead, icon,
 * "Palet" and the count on one line, so the page reads as a shop rather than a quote catalogue.
 * Below 640 px that button is the icon alone, 44 px square, the count on its corner: its width
 * never changes with the count, so the logo and the tools stay on one row (review, 2026-11-13:
 * "Palet 12" pushed the tools onto a row of their own). The accessible name is the same.
 * The plain link is a 44 px target on phones too: 8 px of padding on each side, taken back by
 * the same negative margin, so the row keeps its places and its height. "Palet" is 28 px wide;
 * the shorter "Cart" is held at 44 px, and the English row's language link stands 4 px further
 * left for it. Below 640 px its focus ring is drawn inside the box: outside it ran 2 px into the
 * language link and the quote button at 320-360 px.
 */
export function CartLink({
  lang,
  t,
  current,
  primary = false,
}: {
  lang: Lang;
  t: Dict;
  current: boolean;
  primary?: boolean;
}) {
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
  if (primary)
    return (
      <Button
        href={localePath(CART_PATH, lang)}
        label={t.nav.cartLabel(n)}
        variant="primary"
        icon={CART_ICON}
        endContent={
          n > 0 ? (
            <span className="rounded-sm bg-bg px-1.5 text-xs font-semibold text-ink tabular-nums max-sm:absolute max-sm:-right-1.5 max-sm:-top-1 max-sm:border max-sm:border-brand max-sm:px-1">
              {n}
            </span>
          ) : undefined
        }
        className="shrink-0 font-semibold max-sm:w-11 max-sm:gap-0 max-sm:px-0 sm:px-[18px] lg:px-3 xl:px-[18px]"
      >
        <span className="max-sm:hidden">{t.nav.cart}</span>
        {/* "(sepetiniz)": the owner's word explained, where the row has room. */}
        {t.nav.cartHint && <span className="hidden font-normal xl:inline"> {t.nav.cartHint}</span>}
      </Button>
    );
  return (
    <a
      href={localePath(CART_PATH, lang)}
      aria-current={current ? 'page' : undefined}
      aria-label={t.nav.cartLabel(n)}
      className={`relative inline-flex min-h-11 flex-col items-center justify-center gap-px text-xs leading-none text-ink hover:text-brand-hi aria-[current=page]:text-brand-hi max-sm:-mx-2 max-sm:min-w-11 max-sm:px-2 max-sm:focus-visible:-outline-offset-2 sm:flex-row sm:gap-2 sm:text-sm sm:leading-tight ${FOCUS}`}
    >
      {CART_ICON}
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
        // Phones: on the icon's corner as the orange button's count is, 2 px inside the link's
        // padded edge (6 px past the row place the link takes), so it stands clear of the quote
        // button beside it (review, 2026-11-13: flush against "Teklif", same colour, below
        // 375 px), with a rim in the page colour over the icon.
        <span className="rounded-sm bg-brand px-1.5 text-xs font-semibold text-on-brand tabular-nums max-sm:absolute max-sm:right-0.5 max-sm:-top-1 max-sm:px-1 max-sm:ring-2 max-sm:ring-bg">
          {n}
        </span>
      )}
    </a>
  );
}
