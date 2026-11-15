import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
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

/** How far (px) a finger moves before a press becomes a swipe along the bar. */
const SWIPE_START = 8;
/** How far (px) outside the bar a swiping finger may go before the swipe is cancelled. */
const SWIPE_OUT = 56;

/** A finger (or the mouse) on the bar: where the drop is (a tab index, fractional while it
 *  follows the finger), the tab under it, whether it swipes, whether it left the bar. */
interface Press {
  id: number;
  x: number;
  y: number;
  at: number;
  lit: number;
  swipe: boolean;
  out: boolean;
}

/** The point's index along the bar (fractional, clamped), from the links' own boxes. The axis is
 *  the list's long side: across on the phone bar, down on the rail (iPhone Duo's inner display). */
function indexAt(list: HTMLUListElement, links: HTMLAnchorElement[], x: number, y: number): number {
  const box = list.getBoundingClientRect();
  const vertical = box.height > box.width;
  const first = links[0].getBoundingClientRect();
  const last = links[links.length - 1].getBoundingClientRect();
  const c0 = vertical ? first.top + first.height / 2 : first.left + first.width / 2;
  const c1 = vertical ? last.top + last.height / 2 : last.left + last.width / 2;
  const f = ((vertical ? y : x) - c0) / ((c1 - c0) / (links.length - 1));
  return Number.isFinite(f) ? Math.min(links.length - 1, Math.max(0, f)) : 0;
}

/** Whether the point is more than SWIPE_OUT px outside the box. */
function farFrom(r: DOMRect, x: number, y: number): boolean {
  const dx = Math.max(r.left - x, 0, x - r.right);
  const dy = Math.max(r.top - y, 0, y - r.bottom);
  return Math.hypot(dx, dy) > SWIPE_OUT;
}

/**
 * The tab bar: Ana ekran, Rehber, Tara, Makinelerim, Palet (links; the router opens them). A
 * floating glass bar at the bottom; on a large screen (iPhone Duo's inner display) a glass rail on
 * the right edge (app.css). The open tab sits under one clear glass drop (`.kv-drop`); a finger
 * slid along the bar carries the drop with it and lifting it opens the tab under it, as the
 * system's own bars do (owner, 2026-11-15). A tap stays a plain link click.
 */
export function TabBar({ lang, d, route }: { lang: Lang; d: AppDict; route: Route }) {
  const cur = tabOf(route);
  const n = usePaletCount();
  const list = useRef<HTMLUListElement>(null);
  /** The live press, read by the handlers (several moves and the release can come before React
   *  renders the last move); the state copy only redraws the drop and the lit tab. */
  const pressRef = useRef<Press | null>(null);
  const [press, setPressState] = useState<Press | null>(null);
  const setPress = (p: Press | null) => {
    pressRef.current = p;
    setPressState(p);
  };
  /** The click a swipe's release still produces is swallowed: the swipe opens its own tab. */
  const swallow = useRef(false);
  const opening = useRef(false);
  const tabs: { key: Tab; href: string; label: string; icon: IconName }[] = [
    { key: 'home', href: localePath('/', lang), label: d.tabs.home, icon: 'home' },
    { key: 'guides', href: localePath(GUIDES_PATH, lang), label: d.tabs.guides, icon: 'guides' },
    { key: 'scan', href: APP_PATHS.scan, label: d.tabs.scan, icon: 'scan' },
    { key: 'machines', href: APP_PATHS.machines, label: d.tabs.machines, icon: 'machines' },
    { key: 'palet', href: localePath(CART_PATH, lang), label: d.tabs.palet, icon: 'palet' },
  ];
  const curIdx = tabs.findIndex((t) => t.key === cur);

  const links = () => [...(list.current?.querySelectorAll<HTMLAnchorElement>('a.kv-tab') ?? [])];

  const onDown = (e: ReactPointerEvent<HTMLUListElement>) => {
    if (!e.isPrimary || e.button !== 0 || !list.current) return;
    const ls = links();
    if (ls.length < 2) return;
    swallow.current = false;
    const at = Math.round(indexAt(list.current, ls, e.clientX, e.clientY));
    setPress({
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      at,
      lit: at,
      swipe: false,
      out: false,
    });
  };

  const onMove = (e: ReactPointerEvent<HTMLUListElement>) => {
    const press = pressRef.current;
    if (press === null || e.pointerId !== press.id || !list.current) return;
    let swipe = press.swipe;
    if (!swipe) {
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < SWIPE_START) return;
      swipe = true;
      try {
        // Only now: a tap keeps its pointer on the link, so its own click opens it.
        list.current.setPointerCapture(e.pointerId);
      } catch {
        // the pointer is already gone; its pointerup or pointercancel ends the press
      }
    }
    const nav = list.current.closest('nav') ?? list.current;
    const out = farFrom(nav.getBoundingClientRect(), e.clientX, e.clientY);
    const at = indexAt(list.current, links(), e.clientX, e.clientY);
    setPress({ ...press, swipe, out, at, lit: Math.round(at) });
  };

  const onUp = (e: ReactPointerEvent<HTMLUListElement>) => {
    const press = pressRef.current;
    if (press === null || e.pointerId !== press.id) return;
    setPress(null);
    if (!press.swipe) return; // a tap: the link's own click opens it
    swallow.current = true;
    window.setTimeout(() => (swallow.current = false), 400);
    if (press.out || press.lit === curIdx) return; // let go far from the bar, or on the open tab
    const a = links()[press.lit];
    if (!a) return;
    opening.current = true;
    a.click(); // the router opens it as it opens a tap
    opening.current = false;
  };

  const onCancel = (e: ReactPointerEvent<HTMLUListElement>) => {
    const press = pressRef.current;
    if (press !== null && e.pointerId === press.id) setPress(null);
  };

  /** Only the list's own capture ending cancels: on touch the link under the finger holds the
   *  pointer first (implicit capture) and loses it when the list takes it at the swipe's start. */
  const onLostCapture = (e: ReactPointerEvent<HTMLUListElement>) => {
    if (e.target === e.currentTarget) onCancel(e);
  };

  const onClickCapture = (e: ReactMouseEvent<HTMLUListElement>) => {
    if (!swallow.current || opening.current) return;
    swallow.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const held = press !== null && !press.out;
  const lit = held ? press.lit : curIdx;
  const dropAt = held ? press.at : curIdx;

  return (
    <nav aria-label={d.tabs.label} className="kv-tabbar fixed z-30 font-sans">
      <ul
        ref={list}
        className="kv-tabs m-0 list-none p-0"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        onLostPointerCapture={onLostCapture}
        onClickCapture={onClickCapture}
      >
        <li
          aria-hidden="true"
          className="kv-drop"
          data-show={dropAt >= 0 ? '' : undefined}
          data-lift={held ? '' : undefined}
          data-swipe={held && press.swipe ? '' : undefined}
          style={{ '--kv-i': Math.max(0, dropAt) } as CSSProperties}
        />
        {tabs.map((t, i) => {
          const on = t.key === cur;
          const count = t.key === 'palet' && n > 0 ? n : null;
          return (
            <li key={t.key}>
              <a
                href={t.href}
                draggable={false}
                aria-current={on ? 'page' : undefined}
                aria-label={count !== null ? d.tabs.paletCount(count) : undefined}
                className={`kv-tab relative flex flex-col items-center justify-center gap-0.5 px-0 text-[10px] font-medium leading-tight min-[400px]:px-1 min-[400px]:text-[11px] ${i === lit ? 'text-ink' : 'text-ink-mid hover:text-ink'} ${FOCUS_INSET}`}
              >
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
