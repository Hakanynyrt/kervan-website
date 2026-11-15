import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import config from '../capacitor.config.ts';
import { connectOrigins } from './copy-web.mjs';

/**
 * The iPhone project's fixed decisions (docs/agent/app.md), checked on Linux where Xcode is not
 * available: the macOS job (.github/workflows/app-ios.yml) is the only place it is built.
 */

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IOS = path.join(APP, 'ios', 'App');
const read = (...p: string[]) => fs.readFileSync(path.join(IOS, ...p), 'utf8');
const pkg = (dir: string) =>
  JSON.parse(fs.readFileSync(path.join(APP, '..', dir, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

/** The value of a plist key: the next element's text (strings, true/false), or its source. */
function plistValue(xml: string, key: string): string | undefined {
  const m = new RegExp(`<key>${key}</key>\\s*(<(\\w+)\\s*/>|<(\\w+)>([\\s\\S]*?)</\\3>)`).exec(xml);
  if (!m) return undefined;
  return m[2] ?? (m[3] === 'string' ? m[4] : m[1]);
}

test('capacitor.config: the permanent id, the bundled web layer, no remote page', () => {
  assert.equal(config.appId, 'com.kiriciparca.app');
  assert.equal(config.webDir, 'www');
  assert.equal(config.server, undefined, 'no server block: never server.url or allowNavigation');
  assert.equal(config.ios?.contentInset, 'never');
  assert.equal(
    config.ios?.backgroundColor,
    undefined,
    'no fixed web view colour: the system background, as the launch screen (light and dark)',
  );
  assert.deepEqual(config.plugins?.CapacitorHttp, { enabled: true });
});

test('the shop and the native project use the same Capacitor versions, pinned exactly', () => {
  const app = pkg('parts-app');
  const shop = pkg('parts-shop');
  const appDeps = { ...app.dependencies, ...app.devDependencies };
  for (const [name, v] of Object.entries(appDeps)) {
    if (!name.startsWith('@capacitor/')) continue;
    assert.match(v, /^\d+\.\d+\.\d+$/, `${name} is pinned exactly`);
  }
  for (const [name, v] of Object.entries(shop.dependencies ?? {})) {
    if (!name.startsWith('@capacitor/')) continue;
    assert.equal(v, appDeps[name], `${name}: parts-shop and parts-app agree`);
  }
  assert.equal(appDeps['@capacitor/core'], appDeps['@capacitor/ios']);
  assert.equal(appDeps['@capacitor/core'], appDeps['@capacitor/cli']);
});

test('Info.plist: names, orientations, export compliance, no camera yet', () => {
  const plist = read('App', 'Info.plist');
  assert.equal(plistValue(plist, 'CFBundleDevelopmentRegion'), 'en');
  assert.equal(plistValue(plist, 'ITSAppUsesNonExemptEncryption'), 'false');
  assert.equal(plistValue(plist, 'NSCameraUsageDescription'), undefined);
  assert.equal(plistValue(plist, 'UISupportedInterfaceOrientations~ipad'), undefined);
  const orientations = /<key>UISupportedInterfaceOrientations<\/key>\s*<array>([\s\S]*?)<\/array>/
    .exec(plist)?.[1]
    .match(/UIInterfaceOrientation\w+/g);
  assert.deepEqual(orientations, [
    'UIInterfaceOrientationPortrait',
    'UIInterfaceOrientationLandscapeLeft',
    'UIInterfaceOrientationLandscapeRight',
  ]);
  const names = {
    tr: read('App', 'tr.lproj', 'InfoPlist.strings'),
    en: read('App', 'en.lproj', 'InfoPlist.strings'),
  };
  assert.match(names.tr, /^"CFBundleDisplayName" = "Kervan Parça";$/m);
  assert.match(names.en, /^"CFBundleDisplayName" = "Kervan Parts";$/m);
  assert.equal(plistValue(plist, 'CFBundleDisplayName'), 'Kervan Parts', 'fallback = en');
});

test('PrivacyInfo.xcprivacy: no tracking, no collected data, UserDefaults for Preferences', () => {
  const x = read('App', 'PrivacyInfo.xcprivacy');
  assert.equal(plistValue(x, 'NSPrivacyTracking'), 'false');
  assert.match(x, /<key>NSPrivacyTrackingDomains<\/key>\s*<array\/>/);
  assert.match(x, /<key>NSPrivacyCollectedDataTypes<\/key>\s*<array\/>/);
  assert.match(
    x,
    /NSPrivacyAccessedAPICategoryUserDefaults<\/string>\s*<key>NSPrivacyAccessedAPITypeReasons<\/key>\s*<array>\s*<string>CA92\.1<\/string>\s*<\/array>/,
  );
});

test('project.pbxproj: bundle id, iPhone only, iOS 15, the manifest and names are bundled', () => {
  const pbx = read('App.xcodeproj', 'project.pbxproj');
  assert.equal(pbx.match(/PRODUCT_BUNDLE_IDENTIFIER = com\.kiriciparca\.app;/g)?.length, 2);
  assert.equal(pbx.match(/TARGETED_DEVICE_FAMILY = 1;/g)?.length, 2);
  assert.doesNotMatch(pbx, /TARGETED_DEVICE_FAMILY = "1,2"/);
  assert.doesNotMatch(pbx, /IPHONEOS_DEPLOYMENT_TARGET = (?!15\.0;)/);
  assert.doesNotMatch(pbx, /DEVELOPMENT_TEAM/, 'no team in git: signing is M3');
  assert.match(pbx, /\/\* PrivacyInfo\.xcprivacy in Resources \*\/,/);
  assert.match(pbx, /\/\* InfoPlist\.strings in Resources \*\/,/);
  assert.match(pbx, /knownRegions = \(\s*en,\s*tr,\s*Base,\s*\);/);
});

test('the app icon: one opaque 1024 x 1024 PNG', () => {
  const set = path.join(IOS, 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  const contents = JSON.parse(fs.readFileSync(path.join(set, 'Contents.json'), 'utf8')) as {
    images: { filename: string; size: string }[];
  };
  assert.equal(contents.images.length, 1);
  assert.equal(contents.images[0].size, '1024x1024');
  const png = fs.readFileSync(path.join(set, contents.images[0].filename));
  assert.equal(png.toString('latin1', 12, 16), 'IHDR');
  assert.equal(png.readUInt32BE(16), 1024);
  assert.equal(png.readUInt32BE(20), 1024);
  assert.equal(png[25], 2, 'colour type 2: RGB, no alpha channel');
});

test('copy-web reads the origins the bundle may fetch from', () => {
  const html = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' blob: https://kiriciparca.com https://img.kiriciparca.com; object-src 'none'" />`;
  assert.deepEqual(connectOrigins(html), [
    'https://kiriciparca.com',
    'https://img.kiriciparca.com',
  ]);
  assert.equal(connectOrigins('<html></html>'), null);
});
