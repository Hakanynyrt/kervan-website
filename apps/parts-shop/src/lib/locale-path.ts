import type { Lang } from '../types';

/** The URL is the only source of language: "/…" Turkish, "/en/…" English (Turkish slugs kept). */
export const LANGS: readonly Lang[] = ['tr', 'en'];

/** Language-aware link for a neutral (Turkish) path: ('/kirici-ucu', 'en') → '/en/kirici-ucu'. */
export function localePath(path: string, lang: Lang): string {
  if (lang === 'tr') return path;
  return path === '/' ? '/en/' : `/en${path}`;
}
