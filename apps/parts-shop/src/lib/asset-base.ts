import { IS_APP, SITE_ORIGIN } from './page-source.ts';

/**
 * Prefix for the media the site serves from Pages (`/photos`, `/videos`, `/models`, the opening
 * frames, …): '' on the site, where every such URL stays a plain path, and the live site's
 * origin in the app's build, which is served from its own origin. Tip and part pictures that a
 * main build moves to R2 keep their `VITE_TIP_IMG_BASE` host (tip-img.ts, photo-url.ts); the
 * prefix is for what stays on Pages.
 */
export const ASSET_BASE: string = IS_APP ? SITE_ORIGIN : '';

/** A site path (`/videos/rehber/x.mp4`) as the URL to load it from; anything else unchanged. */
export const assetUrl = (path: string, base: string = ASSET_BASE): string =>
  path.startsWith('/') && !path.startsWith('//') ? `${base}${path}` : path;
