import type { HeadInput } from '@kervan/seo';
import { DICT } from './dict';
import { LEGAL } from './legal';
import { localePath } from './locale-path';
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
    case 'brand':
      return {
        ...page,
        title: m.brandTitle(model.brand),
        description: m.brandDesc(model.brand, model.rows.length),
      };
    case 'cart':
      return { ...page, title: m.cartTitle };
    case 'legal': {
      const d = LEGAL[lang][model.doc];
      return { ...page, title: `${d.title} | ${m.siteName}`, description: d.desc };
    }
    case 'parts':
      return { ...page, title: m.partsTitle, description: m.partsDesc };
    case 'part': {
      const name = t.parts.items[model.part].name;
      return { ...page, title: m.partTitle(name), description: m.partDesc(name) };
    }
    case 'breaker': {
      const f = model.families[0] as (typeof model.families)[number] | undefined;
      const dm = f ? f.attrs.diameterMm : (model.extra?.diameterMm ?? null);
      const d = dm === null ? '' : fmtNum(dm, lang);
      const types = [
        ...new Set([
          ...model.families.flatMap((x) => x.skus.map((s) => t.tip[s.tipType])),
          ...(model.extra?.tipTypes ?? []).map((x) => t.tip[x]),
        ]),
      ];
      return {
        ...page,
        title: m.breakerTitle(model.name, d),
        description: m.breakerDesc(model.name, d, types.join(', ')),
      };
    }
    case 'family': {
      const f = model.family;
      const d = fmtNum(f.attrs.diameterMm, lang);
      const types = f.skus.map((s) => t.tip[s.tipType]).join(', ');
      return {
        ...page,
        title: m.familyTitle(f.code, d),
        description: m.familyDesc(f.code, d, types),
      };
    }
  }
}
