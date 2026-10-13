import { KERVAN_SHOP_URL, ORG_PUBLIC_EMAIL } from '@kervan/seo';

/** The shop's canonical origin (no trailing slash). */
export const SITE = KERVAN_SHOP_URL;

/** Orders and quote requests (owner: sales@ / satis@ / info@kiriciparca.com, routed to the owner's inbox). */
export const ORDER_EMAIL = 'satis@kiriciparca.com';
/** General contact (info@kiriciparca.com): header bar, footer, legal pages' seller e-mail, JSON-LD. */
export const SHOP_EMAIL = ORG_PUBLIC_EMAIL;
