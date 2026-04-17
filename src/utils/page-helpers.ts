import type { Lang } from '../i18n/utils';

export interface Alt {
  lang: Lang;
  href: string;
}

export function makeAlternates(pathTr: string, pathEn?: string): Alt[] {
  const base = 'https://kervanheat.com';
  const tr: Alt = { lang: 'tr', href: `${base}/tr${pathTr}` };
  if (!pathEn) return [tr];
  return [tr, { lang: 'en', href: `${base}/en${pathEn}` }];
}
