// Subpath: node's test runner cannot resolve the package index.
import { KERVAN_SHOP_URL } from '@kervan/seo/constants';

/**
 * Where the shop's own pages and public files are read from. On the site they are this origin's
 * (relative URLs, `PAGE_SOURCE` = ''); the iPhone app's build (`VITE_APP=1`, vite.app.config.ts)
 * is served from its own origin and reads them from the live site (`VITE_SITE_ORIGIN`, by default
 * the canonical origin). Used for the palet's page reads (palet-lines.ts), the names-only model
 * index (BreakerSearch.tsx) and, through asset-base.ts, the Pages-hosted media.
 */

/** The build flags this module reads (`import.meta.env` in Vite builds; absent in node tests). */
export interface AppEnv {
  VITE_APP?: string;
  VITE_SITE_ORIGIN?: string;
}

/** An origin without its trailing slash; `null` for anything that is not an http(s) origin. */
export function cleanOrigin(v: string | undefined): string | null {
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return u.origin;
  } catch {
    return null;
  }
}

/** The app flag and the site origin of a build's flags. */
export function readAppEnv(env: AppEnv | undefined): { app: boolean; origin: string } {
  return {
    app: env?.VITE_APP === '1' || env?.VITE_APP === 'true',
    origin: cleanOrigin(env?.VITE_SITE_ORIGIN) ?? KERVAN_SHOP_URL,
  };
}

const ENV = readAppEnv(import.meta.env as AppEnv | undefined);

/** True in the app's build only. */
export const IS_APP: boolean = ENV.app;
/** The live site's origin (no trailing slash), the app reads its pages from. */
export const SITE_ORIGIN: string = ENV.origin;
/** Prefix for the shop's page and public-file URLs: '' on the site, SITE_ORIGIN in the app. */
export const PAGE_SOURCE: string = IS_APP ? SITE_ORIGIN : '';

/** A site path (`/kirici/...`, `/kirici-modelleri.json`) as the URL to fetch it from. */
export const sourceUrl = (path: string, source: string = PAGE_SOURCE): string =>
  path.startsWith('/') && !path.startsWith('//') ? `${source}${path}` : path;
