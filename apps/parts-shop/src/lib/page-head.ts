import {
  breadcrumbList,
  organization,
  productWebPage,
  shopProduct,
  type BuildShopProductOpts,
  website,
  ORG_TRADING_NAME,
  type HeadInput,
} from '@kervan/seo';
import { DICT } from './dict';
import { LEGAL, SELLER } from './legal';
import { localePath } from './locale-path';
import { fmtNum } from './format';
import { renderModel, renderTitle } from './part-caption';
import { findRender } from './part-links';
import { brandPath, LIST_PATH, PARTS_PATH, partPath } from './routes';
import { tipImgAbs } from './tip-img';
import { tipOptions } from './tip-options';
import type { PageProps } from './page-props';
import { SITE } from './site';
import { photoImgAbs } from './photo-url';

export { SITE };

/** Pages kept out of search results (the cart; 404 too, below). Everything else is indexable. */
const NOINDEX_KINDS = new Set<PageProps['model']['kind']>(['cart', 'notFound']);
const NOINDEX = 'noindex, follow';

/** Whether a page belongs in the sitemap (scripts/prerender.mjs). */
export const isIndexable = (p: PageProps): boolean => !NOINDEX_KINDS.has(p.model.kind);

/**
 * Product JSON-LD with an Offer only where the page shows a price; a quote-only page is a
 * WebPage instead (a Product without offers is an invalid item in Search Console).
 */
const productLd = (o: BuildShopProductOpts): object =>
  o.offer ? shopProduct(o) : productWebPage({ ...o, publisherId: `${SITE}/#organization` });

/** Offer price as schema.org wants it: the net USD price the page shows, "125.00". */
const usd = (cents: number): string => (cents / 100).toFixed(2);

/**
 * Head for one page: title and description (make + model + part first), a self canonical,
 * hreflang tr / en / x-default, and JSON-LD (Organization on home, BreadcrumbList where the
 * page has a breadcrumb, Product on tip and part item pages; an Offer only where the page
 * shows a price). The cart and 404 are noindex.
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
        jsonLd: [
          {
            ...organization({
              primaryUrl: SITE,
              alternateName: m.siteName,
              logoUrl: `${SITE}/logo-krv-v2-256.png`,
              street: SELLER.street,
            }),
            '@id': `${SITE}/#organization`,
            name: ORG_TRADING_NAME,
          },
          website({ url: SITE, name: m.siteName, description: m.homeDesc, inLanguage: lang }),
        ],
      };
    case 'list':
      return {
        ...page,
        title: m.listTitle,
        description: m.listDesc,
        jsonLd: crumbs([partsCrumb], t.parts.tips.name),
      };
    case 'popular':
      return { ...page, title: m.popularTitle, description: m.popularDesc };
    case 'brand': {
      // Link previews show the brand's most popular tip that has a picture of its own (rows are
      // sorted by popularity). Never a borrowed sample picture (another maker's tip, shown
      // labelled on the card): a brand with sample-only rows keeps the site default.
      const key = model.rows.find((r) => r.image)?.image;
      return {
        ...page,
        title: m.brandTitle(model.brand),
        description: m.brandDesc(model.brand, model.rows.length),
        ...(key ? { ogImage: tipImgAbs(key, SITE) } : {}),
        jsonLd: crumbs([partsCrumb, tipsCrumb], model.brand),
      };
    }
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
        jsonLd: crumbs([partsCrumb], name),
      };
    }
    case 'partItem': {
      // Link previews (WhatsApp, Telegram) show this part's own picture and caption.
      const r = findRender(model.part, model.anchor);
      const name = t.parts.items[model.part].name;
      const caption = r ? renderTitle(r, name, t) : name;
      const pic = r?.hero ?? r?.views[0]?.base;
      const image = pic ? photoImgAbs(pic, 'lg', SITE) : undefined;
      // The price the prerendered page shows: front heads open Burçlu (PartItem.tsx).
      const cents = r?.fitted ? model.priceFitted : model.price;
      const description = m.partItemDesc(caption, {
        kit: model.part === 'tamir-takimi',
        priced: cents !== null,
      });
      return {
        ...page,
        title: m.partItemTitle(caption),
        description,
        ...(image ? { ogImage: image } : {}),
        jsonLd: [
          productLd({
            url,
            name: caption,
            description,
            image,
            brand: ORG_TRADING_NAME,
            category: name,
            ...(cents !== null
              ? {
                  offer: {
                    price: usd(cents),
                    priceCurrency: 'USD',
                    valueAddedTaxIncluded: false,
                  },
                }
              : {}),
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
      const description = m.breakerDesc(model.name, d, types.join(', '));
      // The type the prerender shows (TipProduct): its picture and price. No Kervan code: the
      // breaker page never shows it (owner).
      const { opts, types: order } = tipOptions(model.families, model.extra);
      const opt = order.length ? opts.get(order[0]) : undefined;
      const image = opt?.sku?.image ? tipImgAbs(opt.sku.image, SITE) : undefined;
      return {
        ...page,
        title: m.breakerTitle(model.name, d),
        description,
        ...(image ? { ogImage: image } : {}),
        jsonLd: [
          productLd({
            url,
            name: t.breaker.title(model.name),
            description,
            image,
            brand: ORG_TRADING_NAME,
            category: t.parts.tips.name,
            ...(opt && opt.cents !== null
              ? {
                  offer: {
                    price: usd(opt.cents),
                    priceCurrency: 'USD',
                    valueAddedTaxIncluded: false,
                  },
                }
              : {}),
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
      const { opts, types: order } = tipOptions([f]);
      const opt = order.length ? opts.get(order[0]) : undefined;
      const image = opt?.sku?.image ? tipImgAbs(opt.sku.image, SITE) : undefined;
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
            ...(opt && opt.cents !== null
              ? {
                  offer: {
                    price: usd(opt.cents),
                    priceCurrency: 'USD',
                    valueAddedTaxIncluded: false,
                  },
                }
              : {}),
          }),
          crumbs([partsCrumb, tipsCrumb], f.code),
        ],
      };
    }
  }
}
