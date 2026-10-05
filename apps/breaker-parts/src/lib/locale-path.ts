import { useLocation } from 'react-router-dom';
import type { Lang } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   URL-based language. The URL is the single source of truth:
   "/…" is Turkish, "/en/…" is English (Turkish slugs are kept, e.g.
   /en/urunler/keski). Pure helpers: safe on the server and the client.
═══════════════════════════════════════════════════════════════════════ */

export const LANGS: readonly Lang[] = ['tr', 'en'];

/** Language of a pathname: "/en" or "/en/…" → en, anything else → tr. */
export function langFromPath(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'tr';
}

/** The language-neutral path: "/en/urunler" → "/urunler", "/en/" → "/". */
export function stripLang(pathname: string): string {
  if (langFromPath(pathname) !== 'en') return pathname || '/';
  const rest = pathname.slice(3);
  return rest === '' ? '/' : rest;
}

/** Language-aware internal link. `path` is a Turkish (neutral) path and
 *  may carry a query and/or hash: localePath('/#contact', 'en') →
 *  '/en/#contact', localePath('/urunler/keski', 'en') → '/en/urunler/keski'. */
export function localePath(path: string, lang: Lang): string {
  const cut = path.search(/[?#]/);
  const pathname = cut === -1 ? path : path.slice(0, cut);
  const suffix = cut === -1 ? '' : path.slice(cut);
  const base = pathname === '' ? '/' : pathname;
  if (lang === 'tr') return base + suffix;
  return (base === '/' ? '/en/' : `/en${base}`) + suffix;
}

/** Current page language (from the router location). */
export function useLocale(): Lang {
  return langFromPath(useLocation().pathname);
}

/** `localePath` bound to the current page language. */
export function useLocalePath(): (path: string) => string {
  const lang = useLocale();
  return (path: string) => localePath(path, lang);
}
