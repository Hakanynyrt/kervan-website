import { useEffect } from 'react';
import type { Lang } from '../types';

/**
 * The URL is the single source of truth for the language:
 * "/" is Turkish, "/en/" is English. There is no automatic redirect by
 * browser language. `kv_lang` (localStorage) is still written so the
 * choice is shared with kervanbreaker.com — keep the key identical there.
 */
export const LANG_KEY = 'kv_lang';

/** Path of the home page in a language. */
export function pathForLang(lang: Lang): string {
  return lang === 'en' ? '/en/' : '/';
}

/** Language of a pathname: "/en" or anything under "/en/" is English. */
export function langFromPath(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'tr';
}

/** Remember the visitor's choice (shared with the breaker site). */
export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* quota exceeded / private mode — silently ignore */
  }
}

/** Keeps `kv_lang` and `<html lang>` in step with the page's language. */
export function useLangSync(lang: Lang): void {
  useEffect(() => {
    rememberLang(lang);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);
}
