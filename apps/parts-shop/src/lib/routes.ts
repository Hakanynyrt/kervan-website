import type { PublicCatalog, PublicFamily, TipType } from '@kervan/tips';

export interface FamilyCard {
  code: string;
  /** Neutral path of the family page. */
  path: string;
  diameterMm: number;
  types: TipType[];
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
      total: number;
      demo: boolean;
    }
  | { kind: 'list'; rows: FamilyCard[]; demo: boolean }
  | { kind: 'family'; family: PublicFamily; demo: boolean }
  | { kind: 'notFound' };

export interface BuiltPage {
  /** Neutral (Turkish) path. */
  path: string;
  model: PageModel;
}

const FITS_SHOWN = 3;
const FEATURED = 24;

export const familyPath = (code: string): string => `/urun/${code.toLowerCase()}`;
export const LIST_PATH = '/kirici-ucu';

export const breakerName = (b: { brand: string; model: string }): string =>
  `${b.brand} ${b.model}`.trim();

export function familyCard(f: PublicFamily): FamilyCard {
  return {
    code: f.code,
    path: familyPath(f.code),
    diameterMm: f.attrs.diameterMm,
    types: f.skus.map((s) => s.tipType),
    popularTier: f.popularTier,
    fits: f.fits.slice(0, FITS_SHOWN).map(breakerName),
    fitsMore: Math.max(0, f.fits.length - FITS_SHOWN),
  };
}

/** Every page of the site for one catalog (families arrive best-sellers first). */
export function buildPages(c: PublicCatalog): BuiltPage[] {
  const demo = c.demo === true;
  const cards = c.families.map(familyCard);
  const popular = cards.filter((x) => x.popularTier !== null);
  return [
    {
      path: '/',
      model: {
        kind: 'home',
        featured: (popular.length > 0 ? popular : cards).slice(0, FEATURED),
        featuredArePopular: popular.length > 0,
        total: cards.length,
        demo,
      },
    },
    { path: LIST_PATH, model: { kind: 'list', rows: cards, demo } },
    ...c.families.map((family) => ({
      path: familyPath(family.code),
      model: { kind: 'family' as const, family, demo },
    })),
  ];
}
