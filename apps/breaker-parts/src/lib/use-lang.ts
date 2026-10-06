import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Lang } from '../types';
import { langFromPath, localePath, stripLang } from './locale-path';

/** localStorage key shared with kervanheat.com (keep it identical in both apps). */
const LANG_KEY = 'kv_lang';

/** Remember the visitor's language choice (written by the language toggle
 *  and on every page view). Never read back for redirects: the URL decides. */
export function rememberLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private mode / quota — ignore */
  }
}

/**
 * The page language comes from the URL only: "/…" is Turkish, "/en/…" is
 * English. There is no automatic redirect by browser language.
 *
 * Browser-only side effects, after hydration: keeps <html lang> and the
 * shared `kv_lang` key in step, and sends a legacy `?lang=` link to the
 * matching URL (`/urunler?lang=en` → `/en/urunler`).
 */
export function useLang(): Lang {
  const { pathname, search, hash } = useLocation();
  const lang = langFromPath(pathname);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    rememberLang(lang);
  }, [lang]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const wanted = params.get('lang');
    if ((wanted !== 'tr' && wanted !== 'en') || wanted === lang) return;
    params.delete('lang');
    const q = params.toString();
    const target = localePath(stripLang(pathname), wanted) + (q ? `?${q}` : '') + hash;
    window.location.replace(target);
  }, [pathname, search, hash, lang]);

  return lang;
}
