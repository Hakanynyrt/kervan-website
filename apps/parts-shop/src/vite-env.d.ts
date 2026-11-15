/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** R2 host of the tip and part pictures (main builds); empty: this site's own files. */
  readonly VITE_TIP_IMG_BASE?: string;
  /** '1' in the iPhone app's build (vite.app.config.ts) only; unset on the site. */
  readonly VITE_APP?: string;
  /** App build: the site it reads pages and media from (default https://kiriciparca.com). */
  readonly VITE_SITE_ORIGIN?: string;
}
