import { useEffect, useState } from 'react';
import { CART_EVENT, cartCount, readCart } from '../lib/cart';
import { GUIDES_PATH } from '../lib/guides';
import { localePath } from '../lib/locale-path';
import { CART_PATH } from '../lib/routes';
import type { Lang } from '../types';
import type { AppDict } from './dict';
import { Icon, type IconName } from './icons';
import { APP_PATHS, type Route } from './router';
import { FOCUS_INSET } from './ui';

export type Tab = 'home' | 'guides' | 'scan' | 'machines' | 'palet';

/** The tab a route belongs to (null: a catalogue page, no tab lit). */
export function tabOf(route: Route): Tab | null {
  if (route.kind === 'screen')
    return route.screen === 'start' ? 'home' : route.screen === 'scan' ? 'scan' : 'machines';
  if (route.path === GUIDES_PATH || route.path.startsWith(`${GUIDES_PATH}/`)) return 'guides';
  if (route.path === CART_PATH) return 'palet';
  return null;
}

/** Lines on the palet, kept up to date (the shop's cart event and other tabs' writes). */
function usePaletCount(): number {
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
  return n;
}

/** The bottom tab bar: Ana ekran, Rehber, Tara, Makinelerim, Palet (links; the router opens them). */
export function TabBar({ lang, d, route }: { lang: Lang; d: AppDict; route: Route }) {
  const cur = tabOf(route);
  const n = usePaletCount();
  const tabs: { key: Tab; href: string; label: string; icon: IconName }[] = [
    { key: 'home', href: localePath('/', lang), label: d.tabs.home, icon: 'home' },
    { key: 'guides', href: localePath(GUIDES_PATH, lang), label: d.tabs.guides, icon: 'guides' },
    { key: 'scan', href: APP_PATHS.scan, label: d.tabs.scan, icon: 'scan' },
    { key: 'machines', href: APP_PATHS.machines, label: d.tabs.machines, icon: 'machines' },
    { key: 'palet', href: localePath(CART_PATH, lang), label: d.tabs.palet, icon: 'palet' },
  ];
  return (
    <nav
      aria-label={d.tabs.label}
      className="kv-tabbar fixed inset-x-0 bottom-0 z-30 border-t border-hair bg-bg font-sans"
    >
      <ul className="mx-auto m-0 grid max-w-[720px] list-none grid-cols-5 p-0">
        {tabs.map((t) => {
          const on = t.key === cur;
          const count = t.key === 'palet' && n > 0 ? n : null;
          return (
            <li key={t.key}>
              <a
                href={t.href}
                aria-current={on ? 'page' : undefined}
                aria-label={count !== null ? d.tabs.paletCount(count) : undefined}
                className={`relative flex h-14 flex-col items-center justify-center gap-0.5 px-0 pb-1 pt-1.5 text-[10px] font-medium leading-tight min-[400px]:px-1 min-[400px]:text-[11px] ${on ? 'text-brand-hi' : 'text-ink-mid hover:text-ink'} ${FOCUS_INSET}`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 top-0 h-0.5 ${on ? 'bg-brand' : 'bg-transparent'}`}
                />
                <span className="relative">
                  <Icon name={t.icon} />
                  {count !== null && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-2.5 -top-1 min-w-[18px] rounded-sm bg-brand px-1 text-center text-[11px] font-semibold leading-[18px] text-on-brand"
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </span>
                <span className="max-w-full whitespace-nowrap text-center">{t.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
