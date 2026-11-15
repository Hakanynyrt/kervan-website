import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The iPhone app "Kervan Kırıcı Parça" (docs/agent/app.md). The web layer is the shop's app build
 * (apps/parts-shop/dist-app), copied into www/ by scripts/copy-web.mjs and bundled in the app:
 * there is no server block, so the app never loads a remote page into its web view (no
 * server.url, no allowNavigation). It reads the site's pages as data only.
 *
 * appId is permanent once the app is on the App Store. The display names (TR/EN) come from
 * ios/App/App/{tr,en}.lproj/InfoPlist.strings; appName is the fallback the CLI writes.
 */
const config: CapacitorConfig = {
  appId: 'com.kiriciparca.app',
  appName: 'Kervan Kırıcı Parça',
  webDir: 'www',
  // The default, spelled out: the native layer logs to the console in debug builds only.
  loggingBehavior: 'debug',
  ios: {
    // The web build already keeps its bars clear of the safe areas (viewport-fit=cover and
    // env(safe-area-inset-*)), so the web view must not add insets of its own.
    contentInset: 'never',
    // No backgroundColor: unset, the web view and its scroll view use the system background
    // (white, black in dark mode), the same as the launch screen, so a dark-mode start does not
    // flash white before the page's own dark background paints.
    preferredContentMode: 'mobile',
  },
  plugins: {
    // The app reads the site's pages (and /kirici-modelleri.json, the 3D models) from
    // https://kiriciparca.com. The web view's own origin is capacitor://localhost and the site
    // sends no CORS headers, so GET requests go through Capacitor's native HTTP layer instead
    // (same-origin proxy: the page's CSP `connect-src 'self'` covers it). The site is unchanged.
    CapacitorHttp: { enabled: true },
  },
};

export default config;
