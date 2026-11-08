/**
 * The home-screen app a page installs as. The owner page (/teknik-bilgiler, /en/teknik-bilgiler)
 * installs as its own app, "Kervan Teknik", opening straight on "Hızlı Cevap"; every other page
 * as the site, "Kervan Breaker". iPhone reads the manifest link and the app title meta at the
 * moment "Ana Ekrana Ekle" is tapped, so both the prerendered page and client navigation set them.
 */
export interface AppIdentity {
  manifest: string;
  title: string;
}

export const SITE_APP: AppIdentity = { manifest: '/manifest.webmanifest', title: 'Kervan Breaker' };
export const TECH_APP: AppIdentity = { manifest: '/teknik.webmanifest', title: 'Kervan Teknik' };

export const isTechPath = (pathname: string): boolean =>
  /^(\/en)?\/teknik-bilgiler\/?$/.test(pathname);

export const appIdentity = (pathname: string): AppIdentity =>
  isTechPath(pathname) ? TECH_APP : SITE_APP;

/** The prerendered HTML of a page with its app identity (the template carries the site's). */
export function withAppIdentity(html: string, pathname: string): string {
  const id = appIdentity(pathname);
  if (id === SITE_APP) return html;
  return html
    .replace(
      `<link rel="manifest" href="${SITE_APP.manifest}"`,
      `<link rel="manifest" href="${id.manifest}"`,
    )
    .replace(
      `<meta name="apple-mobile-web-app-title" content="${SITE_APP.title}"`,
      `<meta name="apple-mobile-web-app-title" content="${id.title}"`,
    );
}
