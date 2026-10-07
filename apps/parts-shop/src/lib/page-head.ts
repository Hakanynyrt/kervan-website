import type { HeadInput } from '@kervan/seo';
import { DICT } from './dict';
import { localePath } from './locale-path';
import { breakerName } from './routes';
import { fmtNum } from './format';
import type { PageProps } from './page-props';

export const SITE = 'https://magaza.kervanbreaker.com';

/** Head for one page. M1: every page is noindex (M4 removes `robots` for indexable pages). */
export function pageHead({ lang, path, model }: PageProps): HeadInput {
  const t = DICT[lang];
  const m = t.meta;
  const base = { lang, robots: 'noindex, nofollow', siteName: m.siteName } as const;
  if (model.kind === 'notFound') return { ...base, title: m.notFoundTitle };
  const alternates = { tr: SITE + localePath(path, 'tr'), en: SITE + localePath(path, 'en') };
  const page = { ...base, canonical: alternates[lang], alternates };
  switch (model.kind) {
    case 'home':
      return { ...page, title: m.homeTitle, description: m.homeDesc };
    case 'list':
      return { ...page, title: m.listTitle, description: m.listDesc };
    case 'popular':
      return { ...page, title: m.popularTitle, description: m.popularDesc };
    case 'family': {
      const f = model.family;
      const d = fmtNum(f.attrs.diameterMm, lang);
      const first = f.fits[0] ? breakerName(f.fits[0]) : '';
      const types = f.skus.map((s) => t.tip[s.tipType]).join(', ');
      return {
        ...page,
        title: m.familyTitle(f.code, d, first),
        description: m.familyDesc(f.code, d, types),
      };
    }
  }
}
