import {
  breadcrumbList,
  merchantReturnPolicy,
  organization,
  productWebPage,
  shopProduct,
  type BuildShopProductOpts,
  website,
  ORG_TRADING_NAME,
  type HeadInput,
} from '@kervan/seo';
import { DICT } from './dict';
import { LEGAL, legalPath, SELLER } from './legal';
import { localePath } from './locale-path';
import { joinedSpelling } from './model-aliases';
import { fmtNum } from './format';
import {
  isRockDrill,
  otherSpelling,
  renderModel,
  renderSeoName,
  renderTitle,
} from './part-caption';
import { findRender } from './part-links';
import { brandPath, LIST_PATH, PARTS_PATH, partPath, type PartKey } from './routes';
import { tipImgAbs } from './tip-img';
import { shownTip } from './tip-options';
import type { PageProps } from './page-props';
import { SITE } from './site';
import { photoImgAbs } from './photo-url';

export { SITE };

/**
 * Pages kept out of search results: the cart, 404 (below) and the `/urun/<code>` tip pages, whose
 * titles carry only the permanent code nobody searches and which compete with the breaker model
 * pages (they stay live, linked codes keep working). Everything else is indexable.
 */
const NOINDEX_KINDS = new Set<PageProps['model']['kind']>(['cart', 'notFound', 'family']);
const NOINDEX = 'noindex, follow';

/** Whether a page belongs in the sitemap (scripts/prerender.mjs). */
export const isIndexable = (p: PageProps): boolean => !NOINDEX_KINDS.has(p.model.kind);

/** The seller on every Offer: the Organization on the home page. */
const ORG_ID = `${SITE}/#organization`;

/**
 * Product JSON-LD with an Offer only where the page shows a price; a quote-only page is a
 * WebPage instead (a Product without offers is an invalid item in Search Console).
 */
const productLd = (o: BuildShopProductOpts): object =>
  o.offer ? shopProduct(o) : productWebPage({ ...o, publisherId: ORG_ID });

/**
 * The returns policy as far as it holds for every buyer, with the "İade ve cayma" page (legal.ts)
 * linked for the rest. The 14-day withdrawal (free return with our carrier, full refund) is the
 * CONSUMER policy only: business purchases are returned by mutual agreement with the buyer paying
 * return shipping, and items made to the buyer's own specification are excluded. Many of the
 * shop's buyers are businesses (net prices "+ vergiler"), so the markup states only the 14-day
 * window and the page; never add returnFees / refundType / returnMethod here unless the owner
 * confirms they apply to every buyer.
 */
const RETURN_POLICY = merchantReturnPolicy({
  id: `${SITE}${legalPath('iade-ve-cayma')}#policy`,
  url: `${SITE}${legalPath('iade-ve-cayma')}`,
  country: 'TR',
  days: 14,
});

/** The seller on every Offer, written out: its full node is on the home page only. */
const SELLER_REF = { id: ORG_ID, name: ORG_TRADING_NAME, url: `${SITE}/` };

/**
 * Link-preview pictures (1200×630, `public/og/`) of the part group pages: a studio render of the
 * shop's own 3D models (tamir-takimi: the shop's own kit render) with the group name and
 * "Görseller temsilidir" in Turkish, so the Turkish pages only (no EN variant yet). A group
 * missing here keeps no og:image. A changed picture gets a new file name.
 */
const PART_OG: Partial<Record<PartKey, string>> = {
  'alt-govde': '/og/og-alt-govde-v2.jpg',
  burc: '/og/og-burc-v2.jpg',
  saplama: '/og/og-saplama-v2.jpg',
  piston: '/og/og-piston-v2.jpg',
  akumulator: '/og/og-akumulator-v2.jpg',
  'asinma-plakasi': '/og/og-asinma-plakasi-v2.jpg',
  kama: '/og/og-kama-v1.jpg',
  'tamir-takimi': '/og/og-tamir-takimi-v1.jpg',
};
/** The same kind of picture for the home page, /kirici-ucu and /cok-satanlar (Turkish only). */
const PAGE_OG = {
  home: '/og/og-anasayfa-v2.jpg',
  list: '/og/og-kirici-ucu-v2.jpg',
  popular: '/og/og-cok-satanlar-v2.jpg',
} as const;
const OG_SIZE = { width: 1200, height: 630 } as const;
/** og:image head fields of one of our /og/ pictures on a Turkish page; nothing on English. */
const ogOf = (lang: PageProps['lang'], file: string | undefined): Partial<HeadInput> =>
  lang === 'tr' && file ? { ogImage: SITE + file, ogImageSize: OG_SIZE } : {};

/** Meta descriptions longer than this lose the alias (Google cuts snippets around 155–160). */
const DESC_MAX = 155;

/** Offer price as schema.org wants it: the net USD price the page shows, "125.00". */
const usd = (cents: number): string => (cents / 100).toFixed(2);

/** Offer of a priced page: the net USD price it shows, the seller and the return policy. */
const offerOf = (cents: number): NonNullable<BuildShopProductOpts['offer']> => ({
  price: usd(cents),
  priceCurrency: 'USD',
  valueAddedTaxIncluded: false,
  seller: SELLER_REF,
  returnPolicy: RETURN_POLICY,
});

/**
 * Head for one page: title and description (make + model + part first), a self canonical,
 * hreflang tr / en / x-default, and JSON-LD (Organization on home, BreadcrumbList where the
 * page has a breadcrumb, Product on tip and part item pages; an Offer only where the page
 * shows a price). The cart, 404 and the /urun/ code pages are noindex.
 */
export function pageHead({ lang, path, model }: PageProps): HeadInput {
  const t = DICT[lang];
  const m = t.meta;
  const base = { lang, siteName: m.siteName } as const;
  if (model.kind === 'notFound') return { ...base, robots: NOINDEX, title: m.notFoundTitle };
  const alternates = { tr: SITE + localePath(path, 'tr'), en: SITE + localePath(path, 'en') };
  const url = alternates[lang];
  const page = {
    ...base,
    canonical: url,
    alternates,
    ...(NOINDEX_KINDS.has(model.kind) ? { robots: NOINDEX } : {}),
  };
  const abs = (p: string): string => SITE + localePath(p, lang);
  // The visible breadcrumb (components/Bits.tsx Breadcrumb): home, the trail, this page.
  const crumbs = (trail: [string, string][], current: string): object =>
    breadcrumbList([
      { name: t.family.crumbHome, url: abs('/') },
      ...trail.map(([name, p]) => ({ name, url: abs(p) })),
      { name: current, url },
    ]);
  const partsCrumb: [string, string] = [t.parts.title, PARTS_PATH];
  const tipsCrumb: [string, string] = [t.parts.tips.name, LIST_PATH];
  switch (model.kind) {
    case 'home':
      return {
        ...page,
        title: m.homeTitle,
        description: m.homeDesc,
        ...ogOf(lang, PAGE_OG.home),
        jsonLd: [
          {
            ...organization({
              // The canonical home URL (Google's site names want the WebSite url to be it).
              primaryUrl: `${SITE}/`,
              alternateName: 'Kiriciparca',
              logoUrl: `${SITE}/logo-krv-v2-256.png`,
              street: SELLER.street,
            }),
            '@id': ORG_ID,
            name: ORG_TRADING_NAME,
            hasMerchantReturnPolicy: RETURN_POLICY,
          },
          // One site name everywhere (Google's site names): the name the titles end in.
          website({
            url: `${SITE}/`,
            name: m.siteName,
            alternateName: ['Kiriciparca', 'kiriciparca.com'],
            description: m.homeDesc,
            inLanguage: lang,
          }),
        ],
      };
    case 'list':
      return {
        ...page,
        title: m.listTitle,
        description: m.listDesc,
        ...ogOf(lang, PAGE_OG.list),
        jsonLd: crumbs([partsCrumb], t.parts.tips.name),
      };
    case 'popular':
      return {
        ...page,
        title: m.popularTitle,
        description: m.popularDesc,
        ...ogOf(lang, PAGE_OG.popular),
      };
    case 'brand':
      return {
        ...page,
        title: m.brandTitle(model.brand),
        description: m.brandDesc(model.brand, model.rows.length),
        jsonLd: crumbs([partsCrumb, tipsCrumb], model.brand),
      };
    case 'cart':
      return { ...page, title: m.cartTitle };
    case 'legal': {
      const d = LEGAL[lang][model.doc];
      return {
        ...page,
        title: `${d.title} | ${m.brand}`,
        description: d.desc,
        jsonLd: crumbs([], t.legal.nav),
      };
    }
    case 'parts':
      return {
        ...page,
        title: m.partsTitle,
        description: m.partsDesc,
        jsonLd: crumbs([], t.parts.title),
      };
    case 'part': {
      const name = t.parts.items[model.part].name;
      return {
        ...page,
        title: m.partTitle(name),
        description: m.partDesc(name, model.part === 'tamir-takimi'),
        ...ogOf(lang, PART_OG[model.part]),
        jsonLd: crumbs([partsCrumb], name),
      };
    }
    case 'partItem': {
      // Link previews (WhatsApp, Telegram) show this part's own picture and caption.
      const r = findRender(model.part, model.anchor);
      const name = t.parts.items[model.part].name;
      const caption = r ? renderTitle(r, name, t) : name;
      // A representative picture (a similar model's part) is not this part's image: no preview, no JSON-LD
      // image, as the tip pages' representative pictures.
      const pic = r?.representative ? undefined : (r?.hero ?? r?.views[0]?.base);
      const image = pic ? photoImgAbs(pic, 'lg', SITE) : undefined;
      // The price the prerendered page shows: front heads open Burçlu (PartItem.tsx).
      const cents = r?.fitted ? model.priceFitted : model.price;
      const seoName = r ? renderSeoName(r, model.part, t) : caption;
      const other = r ? otherSpelling(r.model) : null;
      const desc = (o: string | null) =>
        m.partItemDesc(seoName, {
          kit: model.part === 'tamir-takimi',
          priced: cents !== null,
          other: o,
          rockDrill: r ? isRockDrill(r) : false,
        });
      // The other spelling ("MTB210", "SB 50") only while the description stays short.
      const description = other && desc(other).length <= DESC_MAX ? desc(other) : desc(null);
      // Other names of the part (no OEM numbers here): its caption and the other spelling.
      const alternateName = [
        ...new Set([
          caption,
          ...(other && r ? [renderSeoName({ ...r, model: other }, model.part, t)] : []),
        ]),
      ].filter((x) => x !== seoName);
      return {
        ...page,
        title: m.partItemTitle(seoName),
        description,
        ...(image ? { ogImage: image } : {}),
        jsonLd: [
          // Product (with its Offer) only where the page shows a price AND has its own picture:
          // Google needs an image for a product result. Without either, a WebPage, as before. No
          // sku: an item has no permanent Kervan code (its URL slug is not one); never OEM numbers.
          productLd({
            url,
            name: seoName,
            ...(alternateName.length ? { alternateName } : {}),
            description,
            image,
            brand: ORG_TRADING_NAME,
            category: name,
            ...(cents !== null && image ? { offer: offerOf(cents) } : {}),
          }),
          crumbs([partsCrumb, [name, partPath(model.part)]], r ? renderModel(r, t) : model.anchor),
        ],
      };
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
      const aliases = model.aliases ?? [];
      // At most one alias in the description: the no-space form ("HB20G"), and only while the
      // description stays short; the full list is on the page ("Diğer yazılışlar").
      const joined = joinedSpelling(model.model);
      const descAlias = joined && aliases.includes(joined) ? joined : null;
      const withAlias = descAlias ? m.breakerDesc(model.name, d, types.join(', '), descAlias) : '';
      const description =
        withAlias && withAlias.length <= DESC_MAX
          ? withAlias
          : m.breakerDesc(model.name, d, types.join(', '), null);
      // The size and type the prerender shows (TipProduct): its picture and price. No Kervan
      // code: the breaker page never shows it (owner).
      const shown = shownTip(model.families, model.extra);
      const opt = shown.opt;
      // The owner's real photo of the model's tips (BREAKER_PHOTOS) leads, like on the page.
      const photo = model.photos?.[0];
      const image = photo
        ? photoImgAbs(photo, 'lg', SITE)
        : shown.image
          ? tipImgAbs(shown.image, SITE)
          : undefined;
      return {
        ...page,
        title: m.breakerTitle(model.name, d),
        description,
        ...(image ? { ogImage: image } : {}),
        jsonLd: [
          productLd({
            url,
            name: t.breaker.title(model.name),
            ...(aliases.length
              ? { alternateName: aliases.map((x) => t.breaker.title(`${model.brand} ${x}`)) }
              : {}),
            description,
            image,
            brand: ORG_TRADING_NAME,
            category: t.parts.tips.name,
            ...(opt && opt.cents !== null ? { offer: offerOf(opt.cents) } : {}),
          }),
          crumbs([partsCrumb, tipsCrumb, [model.brand, brandPath(model.brand)]], model.model),
        ],
      };
    }
    case 'family': {
      const f = model.family;
      const d = fmtNum(f.attrs.diameterMm, lang);
      const types = f.skus.map((s) => t.tip[s.tipType]).join(', ');
      const description = m.familyDesc(f.code, d, types);
      const { opt, image: own } = shownTip([f]);
      const image = own ? tipImgAbs(own, SITE) : undefined;
      return {
        ...page,
        title: m.familyTitle(f.code, d),
        description,
        ...(image ? { ogImage: image } : {}),
        jsonLd: [
          productLd({
            url,
            name: `${f.code} ${t.family.kicker(d)}`,
            description,
            image,
            brand: ORG_TRADING_NAME,
            category: t.parts.tips.name,
            // The family code is this page's public name (URL, breadcrumb).
            sku: f.code,
            ...(opt && opt.cents !== null ? { offer: offerOf(opt.cents) } : {}),
          }),
          crumbs([partsCrumb, tipsCrumb], f.code),
        ],
      };
    }
  }
}
