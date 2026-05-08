import { useEffect, useState } from 'react';
import type { Lang } from '../types';

/**
 * Resolution: ?lang= → localStorage → navigator.language → 'tr'.
 * Storage key `kv_lang` is shared with kervanheat.com so visitors who
 * cross between the two sites keep their language preference.
 */
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const fromQ = new URLSearchParams(location.search).get('lang');
      if (fromQ === 'tr' || fromQ === 'en') return fromQ;
      const stored = localStorage.getItem('kv_lang');
      if (stored === 'tr' || stored === 'en') return stored;
      const nav = (navigator.language || 'tr').slice(0, 2).toLowerCase();
      return nav === 'tr' ? 'tr' : 'en';
    } catch {
      return 'tr';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kv_lang', lang);
      document.documentElement.setAttribute('lang', lang);
    } catch {
      /* private mode / quota — ignore */
    }
  }, [lang]);

  return [lang, setLang];
}
