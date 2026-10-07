import type { PublicCatalog, PublicFamily, TipType } from '@kervan/tips';

/** One breaker model and the tip it takes: the shop's product (card, list row, page). */
export interface BreakerCard {
  slug: string;
  /** Neutral path of the breaker page. */
  path: string;
  /** "Brand Model". */
  name: string;
  diameterMm: number;
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
  | { kind: 'list'; rows: BreakerCard[]; demo: boolean; hasPopular: boolean }
  | { kind: 'popular'; cards: BreakerCard[]; demo: boolean; hasPopular: true }
  | {
      kind: 'breaker';
      name: string;
      /** Tip families that fit this breaker (usually one). */
      families: PublicFamily[];
      demo: boolean;
      hasPopular: boolean;
    }
  | { kind: 'family'; family: PublicFamily; demo: boolean; hasPopular: boolean }
  | { kind: 'notFound' };

export interface BuiltPage {
  /** Neutral (Turkish) path. */
  path: string;
  model: PageModel;
}

const FEATURED = 8;

export const familyPath = (code: string): string => `/urun/${code.toLowerCase()}`;
export const breakerPath = (slug: string): string => `/kirici/${slug}`;
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
  const breakers = new Map<string, { name: string; families: PublicFamily[] }>();
  for (const f of c.families)
    for (const b of f.fits) {
      const e = breakers.get(b.slug) ?? { name: breakerName(b), families: [] };
      e.families.push(f);
      breakers.set(b.slug, e);
    }
  const cards: BreakerCard[] = [...breakers].map(([slug, e]) => {
    const f = e.families[0];
    return {
      slug,
      path: breakerPath(slug),
      name: e.name,
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
    { path: LIST_PATH, model: { kind: 'list', rows: cards, demo, hasPopular } },
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
