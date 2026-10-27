/** Shop (kiriciparca.com) paths linked from kervanbreaker.com; no imports, so `shop.test.ts`
 *  runs under plain node. */

/** Product slug → the shop page selling the same part. Slugs without a shop page get no link. */
export const SHOP_PATH: Readonly<Record<string, string>> = {
  keski: '/kirici-ucu',
  piston: '/yedek-parca/piston',
  burc: '/yedek-parca/burc',
  // The shop's saplama group: tie-rod sets and side bolts.
  saplama: '/yedek-parca/saplama',
  // Tie rods are sold as sets with their nuts and washers.
  'tie-rod': '/yedek-parca/saplama?tur=sets',
  'tamir-kiti': '/yedek-parca/tamir-takimi',
  kama: '/yedek-parca/kama',
  'alt-govde': '/yedek-parca/alt-govde',
  'yan-saplama': '/yedek-parca/saplama?tur=sideBolts',
};

/**
 * Make (`BRANDS` slug) → the shop's page of that make, `/marka/<slugify(make)>`, listing all its
 * models. Only makes the shop has a page for (checked against its marka sitemap, 2026-10-27):
 * Epiroc and Kobelco have none, so they get no link. `shop.test.ts` checks the paths against the
 * shop's own slug rule; add a make here only once kiriciparca.com lists it.
 */
export const SHOP_MAKE_PATH: Readonly<Record<string, string>> = {
  'atlas-copco': '/marka/atlas-copco',
  furukawa: '/marka/furukawa',
  soosan: '/marka/soosan',
  hanwoo: '/marka/hanwoo',
  indeco: '/marka/indeco',
  rammer: '/marka/rammer',
  montabert: '/marka/montabert',
  sandvik: '/marka/sandvik',
  npk: '/marka/npk',
  toku: '/marka/toku',
  krupp: '/marka/krupp',
  da: '/marka/d-a',
  mtb: '/marka/mtb',
};
