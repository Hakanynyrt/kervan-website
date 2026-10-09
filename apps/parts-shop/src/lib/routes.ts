import {
  breakerGroupKey,
  displayBreakers,
  fold,
  preferredSpelling,
  slugify,
  type PublicCatalog,
  type PublicExtra,
  type PublicFamily,
  type TipType,
} from '@kervan/tips';
import { LEGAL_KEYS, legalPath, type LegalKey } from './legal';
import { partsForBreaker, tipLinksForPart, type PartLink } from './part-links';
import type { TipGroupStats } from '../types';

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
      /** Every catalogue make (home: numbers strip and compatible-makes row). */
      brands: BrandLink[];
      tips: TipGroupStats;
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
  | { kind: 'parts'; tips: TipGroupStats; demo: boolean; hasPopular: boolean }
  | {
      kind: 'part';
      part: PartKey;
      /** Render anchor → tip page of the same breaker (when the shop has one). */
      tipLinks: Record<string, string>;
      demo: boolean;
      hasPopular: boolean;
    }
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
      /** Other parts we model for this breaker (links to their cards). */
      parts: PartLink[];
      demo: boolean;
      hasPopular: boolean;
    }
  | { kind: 'family'; family: PublicFamily; demo: boolean; hasPopular: boolean }
  | { kind: 'cart'; demo: boolean; hasPopular: boolean }
  | { kind: 'legal'; doc: LegalKey; demo: boolean; hasPopular: boolean }
  | { kind: 'notFound' };

export interface BrandLink {
  name: string;
  path: string;
  count: number;
}

/** Spare-part groups besides tips (no catalogue data yet: quote by breaker model). */
export const PART_KEYS = [
  'alt-govde',
  'burc',
  'kama',
  'saplama',
  'piston',
  'akumulator',
  'asinma-plakasi',
] as const;
export type PartKey = (typeof PART_KEYS)[number];
export const PARTS_PATH = '/yedek-parca';
export const CART_PATH = '/palet';
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

interface BreakerEntry {
  name: string;
  brand: string;
  model: string;
  families: PublicFamily[];
  extra?: PublicExtra;
}

/**
 * The breakers of a catalog, one per model: names as the catalogue spells them are cleaned up
 * for display (one spelling per maker, lists split), spellings of one model that differ only
 * by spaces, dashes or case ("F 2" / "F2") are one page under the spaced spelling, and the
 * other spellings' slugs are listed for 301s. Entries that name no maker stay on their family
 * pages only.
 */
export function groupBreakers(c: PublicCatalog): {
  breakers: Map<string, BreakerEntry>;
  redirects: [from: string, to: string][];
} {
  const groups = new Map<
    string,
    { brand: string; spellings: Map<string, string>; families: PublicFamily[]; extra?: PublicExtra }
  >();
  const add = (brand: string, model: string, slug: string) => {
    const key = breakerGroupKey({ brand, model });
    const g = groups.get(key) ?? { brand, spellings: new Map<string, string>(), families: [] };
    if (!g.spellings.has(model)) g.spellings.set(model, slug);
    groups.set(key, g);
    return g;
  };
  for (const f of c.families)
    for (const raw of f.fits)
      for (const b of displayBreakers(raw.brand, raw.model)) {
        const g = add(b.brand, b.model, b.slug);
        if (!g.families.includes(f)) g.families.push(f);
      }
  // Extra products (sold by model, no geometry yet) unless the catalogue already has the model.
  for (const x of c.extras ?? []) {
    const key = breakerGroupKey(x);
    if (groups.has(key)) continue;
    const g = add(x.brand, x.model, x.slug);
    g.extra = x;
  }
  const breakers = new Map<string, BreakerEntry>();
  const redirects: [string, string][] = [];
  for (const g of groups.values()) {
    const model = preferredSpelling([...g.spellings.keys()]);
    const slug = g.spellings.get(model)!;
    for (const other of new Set(g.spellings.values()))
      if (other !== slug) redirects.push([breakerPath(other), breakerPath(slug)]);
    // Spellings that differ by other punctuation ("F.2") can still share a slug: one page.
    const same = breakers.get(slug);
    if (same) {
      for (const f of g.families) if (!same.families.includes(f)) same.families.push(f);
      continue;
    }
    breakers.set(slug, {
      name: breakerName({ brand: g.brand, model }),
      brand: g.brand,
      model,
      families: g.families,
      ...(g.extra ? { extra: g.extra } : {}),
    });
  }
  return { breakers, redirects };
}

/**
 * Every page of the site for one catalog. The product is the breaker model: one page per
 * breaker (its tip families behind a selector when there are several), cards and the list by
 * breaker. Family pages stay for the permanent codes and for tips with no listed breaker.
 * Best-sellers are their own page, not a badge on every card.
 */
export function buildPages(c: PublicCatalog): BuiltPage[] {
  const demo = c.demo === true;
  const { breakers } = groupBreakers(c);
  const cards: BreakerCard[] = [...breakers].map(([slug, e]) => {
    const f = e.families[0] as PublicFamily | undefined;
    if (!f)
      return {
        slug,
        path: breakerPath(slug),
        name: e.name,
        brand: e.brand,
        model: e.model,
        diameterMm: e.extra?.diameterMm ?? null,
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
  const tipPaths = new Map(cards.map((x) => [fold(x.name), x.path]));
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
  // Tips product-group card: counts and the first featured render (best-seller first).
  const tips: TipGroupStats = {
    models: cards.length,
    makes: byBrand.size,
    image: featured.find((x) => x.image)?.image ?? null,
  };
  return [
    {
      path: '/',
      model: {
        kind: 'home',
        featured: featured.slice(0, FEATURED),
        featuredArePopular: hasPopular,
        morePopular: popular.length > FEATURED,
        total: cards.length,
        brands,
        tips,
        demo,
        hasPopular,
      },
    },
    { path: LIST_PATH, model: { kind: 'list', rows: cards, brands, demo, hasPopular } },
    ...[...byBrand].map(([brand, rows]) => ({
      path: brandPath(brand),
      model: { kind: 'brand' as const, brand, rows, brands, demo, hasPopular },
    })),
    { path: PARTS_PATH, model: { kind: 'parts' as const, tips, demo, hasPopular } },
    { path: CART_PATH, model: { kind: 'cart' as const, demo, hasPopular } },
    ...LEGAL_KEYS.map((doc) => ({
      path: legalPath(doc),
      model: { kind: 'legal' as const, doc, demo, hasPopular },
    })),
    ...PART_KEYS.map((part) => ({
      path: partPath(part),
      model: {
        kind: 'part' as const,
        part,
        tipLinks: tipLinksForPart(part, tipPaths),
        demo,
        hasPopular,
      },
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
        parts: partsForBreaker(e.name),
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
