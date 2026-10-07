import {
  displayBreakers,
  slugify,
  type PublicCatalog,
  type PublicExtra,
  type PublicFamily,
  type TipType,
} from '@kervan/tips';

/** One breaker model and the tip it takes: the shop's product (card, list row, page). */
export interface BreakerCard {
  slug: string;
  /** Neutral path of the breaker page. */
  path: string;
  /** "Brand Model". */
  name: string;
  brand: string;
  model: string;
  /** Null for an extra product (no catalogue geometry yet). */
  diameterMm: number | null;
  types: TipType[];
  /** Render key of the first SKU that has one (see tip-img.ts). */
  image: string | null;
  popularTier: 1 | 2 | null;
}

export type PageModel =
  | {
      kind: 'home';
      featured: BreakerCard[];
      featuredArePopular: boolean;
      /** More best-sellers than shown: link to the best-sellers page. */
      morePopular: boolean;
      total: number;
      demo: boolean;
      hasPopular: boolean;
    }
  | { kind: 'list'; rows: BreakerCard[]; brands: BrandLink[]; demo: boolean; hasPopular: boolean }
  | {
      kind: 'brand';
      brand: string;
      rows: BreakerCard[];
      brands: BrandLink[];
      demo: boolean;
      hasPopular: boolean;
    }
  | { kind: 'parts'; demo: boolean; hasPopular: boolean }
  | { kind: 'part'; part: PartKey; demo: boolean; hasPopular: boolean }
  | { kind: 'popular'; cards: BreakerCard[]; demo: boolean; hasPopular: true }
  | {
      kind: 'breaker';
      name: string;
      /** Set for a product sold by model without catalogue geometry (families is empty). */
      extra?: PublicExtra;
      brand: string;
      model: string;
      /** Tip families that fit this breaker (usually one). */
      families: PublicFamily[];
      demo: boolean;
      hasPopular: boolean;
    }
  | { kind: 'family'; family: PublicFamily; demo: boolean; hasPopular: boolean }
  | { kind: 'cart'; demo: boolean; hasPopular: boolean }
  | { kind: 'notFound' };

export interface BrandLink {
  name: string;
  path: string;
  count: number;
}

/** Spare-part groups besides tips (no catalogue data yet: quote by breaker model). */
export const PART_KEYS = ['alt-govde', 'burc', 'kama', 'saplama', 'piston'] as const;
export type PartKey = (typeof PART_KEYS)[number];
export const PARTS_PATH = '/yedek-parca';
export const CART_PATH = '/sepet';
export const partPath = (k: PartKey): string => `${PARTS_PATH}/${k}`;

export interface BuiltPage {
  /** Neutral (Turkish) path. */
  path: string;
  model: PageModel;
}

const FEATURED = 8;

export const familyPath = (code: string): string => `/urun/${code.toLowerCase()}`;
export const breakerPath = (slug: string): string => `/kirici/${slug}`;
export const brandPath = (brand: string): string => `/marka/${slugify(brand)}`;
export const LIST_PATH = '/kirici-ucu';
export const POPULAR_PATH = '/cok-satanlar';

export const breakerName = (b: { brand: string; model: string }): string =>
  `${b.brand} ${b.model}`.trim();

const tierRank = (t: 1 | 2 | null): number => t ?? 3;
const byName = (a: BreakerCard, b: BreakerCard): number =>
  a.name.localeCompare(b.name, 'tr', { numeric: true });

/**
 * Every page of the site for one catalog. The product is the breaker model: one page per
 * breaker (its tip families behind a selector when there are several), cards and the list by
 * breaker. Family pages stay for the permanent codes and for tips with no listed breaker.
 * Best-sellers are their own page, not a badge on every card.
 */
export function buildPages(c: PublicCatalog): BuiltPage[] {
  const demo = c.demo === true;
  // Breaker names as the catalogue spells them are cleaned up for display (one spelling per
  // maker, lists split); entries that name no maker stay on their family pages only.
  const breakers = new Map<
    string,
    { name: string; brand: string; model: string; families: PublicFamily[]; extra?: PublicExtra }
  >();
  for (const f of c.families)
    for (const raw of f.fits)
      for (const b of displayBreakers(raw.brand, raw.model)) {
        const e = breakers.get(b.slug) ?? {
          name: breakerName(b),
          brand: b.brand,
          model: b.model,
          families: [],
        };
        if (!e.families.includes(f)) e.families.push(f);
        breakers.set(b.slug, e);
      }
  // Extra products (sold by model, no geometry yet) unless the catalogue already has the model.
  for (const x of c.extras ?? [])
    if (!breakers.has(x.slug))
      breakers.set(x.slug, {
        name: breakerName(x),
        brand: x.brand,
        model: x.model,
        families: [],
        extra: x,
      });
  const cards: BreakerCard[] = [...breakers].map(([slug, e]) => {
    const f = e.families[0] as PublicFamily | undefined;
    if (!f)
      return {
        slug,
        path: breakerPath(slug),
        name: e.name,
        brand: e.brand,
        model: e.model,
        diameterMm: null,
        types: e.extra?.tipTypes ?? [],
        image: null,
        popularTier: null,
      };
    return {
      slug,
      path: breakerPath(slug),
      name: e.name,
      brand: e.brand,
      model: e.model,
      diameterMm: f.attrs.diameterMm,
      types: [...new Set(e.families.flatMap((x) => x.skus.map((s) => s.tipType)))],
      image: e.families.flatMap((x) => x.skus).find((s) => s.image)?.image ?? null,
      popularTier: e.families.reduce<1 | 2 | null>(
        (t, x) => (tierRank(x.popularTier) < tierRank(t) ? x.popularTier : t),
        null,
      ),
    };
  });
  cards.sort(byName);
  const popular = cards
    .filter((x) => x.popularTier !== null)
    .sort((a, b) => tierRank(a.popularTier) - tierRank(b.popularTier) || byName(a, b));
  const hasPopular = popular.length > 0;
  const byBrand = new Map<string, BreakerCard[]>();
  for (const x of cards) byBrand.set(x.brand, [...(byBrand.get(x.brand) ?? []), x]);
  const brands: BrandLink[] = [...byBrand]
    .map(([name, rows]) => ({ name, path: brandPath(name), count: rows.length }))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  // Home: one breaker per tip family, so the first screen is not eight names for one tip.
  const seen = new Set<string | null>();
  const featured = (hasPopular ? popular : cards).filter((x) => {
    const k = x.image ?? x.slug;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return [
    {
      path: '/',
      model: {
        kind: 'home',
        featured: featured.slice(0, FEATURED),
        featuredArePopular: hasPopular,
        morePopular: popular.length > FEATURED,
        total: cards.length,
        demo,
        hasPopular,
      },
    },
    { path: LIST_PATH, model: { kind: 'list', rows: cards, brands, demo, hasPopular } },
    ...[...byBrand].map(([brand, rows]) => ({
      path: brandPath(brand),
      model: { kind: 'brand' as const, brand, rows, brands, demo, hasPopular },
    })),
    { path: PARTS_PATH, model: { kind: 'parts' as const, demo, hasPopular } },
    { path: CART_PATH, model: { kind: 'cart' as const, demo, hasPopular } },
    ...PART_KEYS.map((part) => ({
      path: partPath(part),
      model: { kind: 'part' as const, part, demo, hasPopular },
    })),
    ...(hasPopular
      ? [
          {
            path: POPULAR_PATH,
            model: { kind: 'popular' as const, cards: popular, demo, hasPopular: true as const },
          },
        ]
      : []),
    ...[...breakers].map(([slug, e]) => ({
      path: breakerPath(slug),
      model: {
        kind: 'breaker' as const,
        name: e.name,
        ...(e.extra ? { extra: e.extra } : {}),
        brand: e.brand,
        model: e.model,
        families: e.families,
        demo,
        hasPopular,
      },
    })),
    ...c.families.map((family) => ({
      path: familyPath(family.code),
      model: { kind: 'family' as const, family, demo, hasPopular },
    })),
  ];
}
