import type { PublicCatalog, PublicFamily, TipType } from '@kervan/tips';

export interface FamilyCard {
  code: string;
  /** Neutral path of the family page. */
  path: string;
  diameterMm: number;
  types: TipType[];
  /** Render key of the first SKU that has one (`/tips/<key>-sm.webp`). */
  image: string | null;
  popularTier: 1 | 2 | null;
  /** First breakers it fits ("Brand Model"). */
  fits: string[];
  fitsMore: number;
}

export type PageModel =
  | {
      kind: 'home';
      featured: FamilyCard[];
      featuredArePopular: boolean;
      /** More best-sellers than shown: link to the best-sellers page. */
      morePopular: boolean;
      total: number;
      demo: boolean;
      hasPopular: boolean;
    }
  | { kind: 'list'; rows: FamilyCard[]; demo: boolean; hasPopular: boolean }
  | { kind: 'popular'; cards: FamilyCard[]; demo: boolean; hasPopular: true }
  | { kind: 'family'; family: PublicFamily; demo: boolean; hasPopular: boolean }
  | { kind: 'notFound' };

export interface BuiltPage {
  /** Neutral (Turkish) path. */
  path: string;
  model: PageModel;
}

const FITS_SHOWN = 3;
const FEATURED = 8;

export const familyPath = (code: string): string => `/urun/${code.toLowerCase()}`;
export const LIST_PATH = '/kirici-ucu';
export const POPULAR_PATH = '/cok-satanlar';

export const breakerName = (b: { brand: string; model: string }): string =>
  `${b.brand} ${b.model}`.trim();

export function familyCard(f: PublicFamily): FamilyCard {
  return {
    code: f.code,
    path: familyPath(f.code),
    diameterMm: f.attrs.diameterMm,
    types: f.skus.map((s) => s.tipType),
    image: f.skus.find((s) => s.image)?.image ?? null,
    popularTier: f.popularTier,
    fits: f.fits.slice(0, FITS_SHOWN).map(breakerName),
    fitsMore: Math.max(0, f.fits.length - FITS_SHOWN),
  };
}

const byDiameter = (a: FamilyCard, b: FamilyCard): number =>
  a.diameterMm - b.diameterMm || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0);

/**
 * Every page of the site for one catalog (families arrive best-sellers first). Best-sellers are
 * their own page, not a badge on every card; the full list is by diameter.
 */
export function buildPages(c: PublicCatalog): BuiltPage[] {
  const demo = c.demo === true;
  const cards = c.families.map(familyCard);
  const popular = cards.filter((x) => x.popularTier !== null);
  const hasPopular = popular.length > 0;
  return [
    {
      path: '/',
      model: {
        kind: 'home',
        featured: (popular.length > 0 ? popular : cards).slice(0, FEATURED),
        featuredArePopular: popular.length > 0,
        morePopular: popular.length > FEATURED,
        total: cards.length,
        demo,
        hasPopular,
      },
    },
    {
      path: LIST_PATH,
      model: { kind: 'list', rows: [...cards].sort(byDiameter), demo, hasPopular },
    },
    ...(hasPopular
      ? [
          {
            path: POPULAR_PATH,
            model: { kind: 'popular' as const, cards: popular, demo, hasPopular: true as const },
          },
        ]
      : []),
    ...c.families.map((family) => ({
      path: familyPath(family.code),
      model: { kind: 'family' as const, family, demo, hasPopular },
    })),
  ];
}
