import { KERVAN_SHOP_URL } from '@kervan/seo';
import type { Lang } from '../types';
import { localePath } from './locale-path';

/** A page of the sister shop (kiriciparca.com) in the given language: `/en/…` for English. */
export function shopUrl(path: string, lang: Lang): string {
  return KERVAN_SHOP_URL + localePath(path, lang);
}

/** Product slug → the shop page selling the same part. Slugs without a shop page get no link
 *  (`saplama`, the adapter-plate stud, is not sold in the shop). */
export const SHOP_PATH: Readonly<Record<string, string>> = {
  keski: '/kirici-ucu',
  piston: '/yedek-parca/piston',
  burc: '/yedek-parca/burc',
  // Tie rods are sold as sets with their nuts and washers.
  'tie-rod': '/yedek-parca/saplama?tur=sets',
  'tamir-kiti': '/yedek-parca/tamir-takimi',
  kama: '/yedek-parca/kama',
  'alt-govde': '/yedek-parca/alt-govde',
  'yan-saplama': '/yedek-parca/saplama?tur=sideBolts',
};
