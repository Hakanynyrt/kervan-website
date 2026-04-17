import tr from './tr.json';
import en from './en.json';

export const languages = { tr: 'Türkçe', en: 'English' } as const;
export const defaultLang = 'tr' as const;
export type Lang = keyof typeof languages;

const ui = { tr, en } as const;

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang && lang in ui) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return (key: keyof typeof tr): string =>
    (ui[lang] as Record<string, string>)[key] ??
    (ui[defaultLang] as Record<string, string>)[key] ??
    key;
}

export function useTranslatedPath(lang: Lang) {
  return (path: string) => `/${lang}${path.startsWith('/') ? path : '/' + path}`;
}

// Translate path mappings: /tr/kirici-parcalari/ ↔ /en/breaker-parts/
export const pathMap = {
  tr: {
    services: '/isil-islem',
    parts: '/kirici-parcalari',
    findPart: '/parca-bul',
    about: '/hakkimizda',
    contact: '/iletisim',
    resources: '/rehber',
    caseStudies: '/referanslar',
    certifications: '/sertifikalar',
    privacy: '/kvkk',
    cookies: '/cerez-politikasi',
  },
  en: {
    services: '/heat-treatment',
    parts: '/breaker-parts',
    findPart: '/find-part',
    about: '/about',
    contact: '/contact',
    resources: '/resources',
    caseStudies: '/case-studies',
    certifications: '/certifications',
    privacy: '/privacy',
    cookies: '/cookie-policy',
  },
} as const;

export type PathKey = keyof typeof pathMap.tr;

export function getLocalizedPath(lang: Lang, key: PathKey): string {
  return `/${lang}${pathMap[lang][key]}`;
}
