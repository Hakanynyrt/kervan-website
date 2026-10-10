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
import {
  partsForBreaker,
  relatedParts,
  renderAnchor,
  tipLinksForPart,
  type PartLink,
} from './part-links';
import { PART_RENDERS, type PartRender } from './photos';
import type { TipGroupStats } from '../types';

/** A part we model for a best-selling breaker (the best-sellers page). */
export interface PopularPart extends PartLink {
  /** Best-selling breaker it is listed for ("Brand Model"). */
  breaker: string;
  /** Render name (the drawing's model text) and showcase picture base, if any. */
  model: string;
  hero: string | null;
  kind: PartRender['kind'] | null;
}

/** The best-sellers page: tips and parts in one mixed grid (owner: all products, mixed). */
export type PopularItem = { kind: 'tip'; card: BreakerCard } | { kind: 'part'; part: PopularPart };

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
  | {
      /** One modelled part (a render of a part page) on its own page, so it can be linked and shared. */
      kind: 'partItem';
      part: PartKey;
      /** renderAnchor of the render (PART_RENDERS[part]); also the last path segment. */
      anchor: string;
      /** Tip page of the same breaker, when the shop has one. */
      tipLink: string | null;
      /** Other parts we model for the same breaker (their item pages). */
      related: PartLink[];
      demo: boolean;
      hasPopular: boolean;
    }
  | {
      kind: 'popular';
      /** 25–30 best-selling tips and the parts we model for the same breakers, mixed. */
      items: PopularItem[];
      cards: BreakerCard[];
      /** Parts we model for the best-selling breakers (not sales data), best-seller order. */
      parts: PopularPart[];
      demo: boolean;
      hasPopular: true;
    }
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
  'tamir-takimi',
] as const;
export type PartKey = (typeof PART_KEYS)[number];
export const PARTS_PATH = '/yedek-parca';
export const CART_PATH = '/palet';
export const partPath = (k: PartKey): string => `${PARTS_PATH}/${k}`;
/** Item page of one modelled part: "/yedek-parca/piston/montabert-brv-32-piston". */
export const partItemPath = (k: PartKey, anchor: string): string => `${partPath(k)}/${anchor}`;

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
/** Path prefixes of the tip pages (one spare-part group, listed under "Yedek parçalar"). */
export const TIP_PATHS = [LIST_PATH, '/kirici/', '/marka/', '/urun/'];

export const breakerName = (b: { brand: string; model: string }): string =>
  `${b.brand} ${b.model}`.trim();

/** The parts we model for the best-selling breakers, in their order, each render once. */
function popularParts(cards: BreakerCard[]): PopularPart[] {
  const seen = new Set<string>();
  const out: PopularPart[] = [];
  for (const c of cards)
    for (const l of partsForBreaker(c.name)) {
      const key = `${l.part}#${l.anchor}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const r = PART_RENDERS[l.part].find((x) => renderAnchor(x) === l.anchor);
      if (!r) continue;
      out.push({
        ...l,
        breaker: c.name,
        model: r.model,
        hero: r.hero ?? null,
        kind: r.kind ?? null,
      });
    }
  return out;
}

/** The best-sellers page shows this many items: tips and parts, mixed, order reshuffled by the daily build. */
const POPULAR_ITEMS = 28;

/** Deterministic shuffle (mulberry32 over a string seed), so the prerender and the hydration agree. */
function shuffled<T>(list: T[], seed: string): T[] {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Best-sellers page items: half tips, half parts (the other side fills a short half), mixed. */
function popularItems(cards: BreakerCard[], parts: PopularPart[], seed: string): PopularItem[] {
  const half = Math.ceil(POPULAR_ITEMS / 2);
  const nParts = Math.min(parts.length, Math.max(half, POPULAR_ITEMS - cards.length));
  const nTips = Math.min(cards.length, POPULAR_ITEMS - nParts);
  const items: PopularItem[] = [
    ...cards.slice(0, nTips).map((card) => ({ kind: 'tip' as const, card })),
    ...parts.slice(0, nParts).map((part) => ({ kind: 'part' as const, part })),
  ];
  return shuffled(items, seed);
}

const tierRank = (t: 1 | 2 | null): number => t ?? 3;
const byName = (a: BreakerCard, b: BreakerCard): number =>
  a.name.localeCompare(b.name, 'tr', { numeric: true });
/** Best-sellers: by tier, then working diameter (small to large, unknown last), not A–Z. */
const byPopularity = (a: BreakerCard, b: BreakerCard): number =>
  tierRank(a.popularTier) - tierRank(b.popularTier) ||
  (a.diameterMm ?? Infinity) - (b.diameterMm ?? Infinity) ||
  byName(a, b);

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
  const popular = cards.filter((x) => x.popularTier !== null).sort(byPopularity);
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
  // Tips product-group card: the first featured render (best-seller first).
  const tips: TipGroupStats = {
    image: featured.find((x) => x.image)?.image ?? null,
  };
  const pages: BuiltPage[] = [
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
    ...PART_KEYS.flatMap((part) => {
      const tipLinks = tipLinksForPart(part, tipPaths);
      return PART_RENDERS[part].map((r) => {
        const anchor = renderAnchor(r);
        return {
          path: partItemPath(part, anchor),
          model: {
            kind: 'partItem' as const,
            part,
            anchor,
            tipLink: tipLinks[anchor] ?? null,
            related: relatedParts(part, r),
            demo,
            hasPopular,
          },
        };
      });
    }),
    ...(hasPopular
      ? [
          {
            path: POPULAR_PATH,
            model: {
              kind: 'popular' as const,
              items: popularItems(popular, popularParts(popular), c.fx?.date ?? 'kervan'),
              cards: popular,
              parts: popularParts(popular),
              demo,
              hasPopular: true as const,
            },
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
  // Item pages are named after renderAnchor: two renders with one anchor would share a URL.
  const paths = new Set<string>();
  for (const p of pages) {
    if (paths.has(p.path)) throw new Error(`buildPages: duplicate path ${p.path}`);
    paths.add(p.path);
  }
  return pages;
}
