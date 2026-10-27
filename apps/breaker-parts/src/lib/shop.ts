import { KERVAN_SHOP_URL } from '@kervan/seo';
import type { Lang } from '../types';
import { localePath } from './locale-path';

/** A page of the sister shop (kiriciparca.com) in the given language: `/en/…` for English. */
export function shopUrl(path: string, lang: Lang): string {
  return KERVAN_SHOP_URL + localePath(path, lang);
}

export { SHOP_MAKE_PATH, SHOP_PATH } from './shop-paths';
