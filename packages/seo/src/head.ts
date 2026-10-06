/* ═══════════════════════════════════════════════════════════════════════
   Build-time head helpers (pure, no DOM): used by each app's prerender
   (via its src/entry-server.tsx re-exports) to write per-page <head> tags,
   and to generate sitemap.xml. Output is deterministic for a given input.
═══════════════════════════════════════════════════════════════════════ */

export type HeadLang = 'tr' | 'en';

export interface HeadAlternates {
  /** Absolute URL of the Turkish version. */
  tr: string;
  /** Absolute URL of the English version. */
  en: string;
  /** x-default target; defaults to the Turkish URL. */
  xDefault?: string;
}

export interface HeadInput {
  lang: HeadLang;
  title: string;
  description?: string;
  /** Absolute canonical URL (the page's own URL). Omit for 404. */
  canonical?: string;
  /** Reciprocal hreflang links (tr, en, x-default). Omit for 404. */
  alternates?: HeadAlternates;
  /** Absolute og:image URL. */
  ogImage?: string;
  /** og:type, defaults to "website". */
  ogType?: 'website' | 'article' | 'product';
  /** og:site_name. */
  siteName?: string;
  /** e.g. "noindex" or "noindex, nofollow". Omit for indexable pages. */
  robots?: string;
  /** JSON-LD object(s); each becomes its own <script type="application/ld+json">. */
  jsonLd?: object | object[];
}

/** og:locale value for a page language. */
export function ogLocale(lang: HeadLang): string {
  return lang === 'en' ? 'en_US' : 'tr_TR';
}

/** Escape text for an HTML attribute value or text node. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** JSON for an inline <script>: `<`, U+2028 and U+2029 escaped so it can
 *  never close the script element or break parsing. */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** All per-page head tags as one string (one tag per line):
 *  title, description, robots, canonical, hreflang alternates, Open Graph,
 *  Twitter card and JSON-LD. */
export function buildHeadTags(input: HeadInput): string {
  const {
    lang,
    title,
    description,
    canonical,
    alternates,
    ogImage,
    ogType = 'website',
    siteName,
    robots,
    jsonLd,
  } = input;
  const a = escapeHtml;
  const tags: string[] = [];

  tags.push(`<title>${a(title)}</title>`);
  if (description) tags.push(`<meta name="description" content="${a(description)}" />`);
  if (robots) tags.push(`<meta name="robots" content="${a(robots)}" />`);
  if (canonical) tags.push(`<link rel="canonical" href="${a(canonical)}" />`);
  if (alternates) {
    tags.push(`<link rel="alternate" hreflang="tr" href="${a(alternates.tr)}" />`);
    tags.push(`<link rel="alternate" hreflang="en" href="${a(alternates.en)}" />`);
    tags.push(
      `<link rel="alternate" hreflang="x-default" href="${a(alternates.xDefault ?? alternates.tr)}" />`,
    );
  }

  tags.push(`<meta property="og:type" content="${a(ogType)}" />`);
  if (siteName) tags.push(`<meta property="og:site_name" content="${a(siteName)}" />`);
  tags.push(`<meta property="og:title" content="${a(title)}" />`);
  if (description) tags.push(`<meta property="og:description" content="${a(description)}" />`);
  if (canonical) tags.push(`<meta property="og:url" content="${a(canonical)}" />`);
  tags.push(`<meta property="og:locale" content="${ogLocale(lang)}" />`);
  if (alternates) {
    tags.push(
      `<meta property="og:locale:alternate" content="${ogLocale(lang === 'en' ? 'tr' : 'en')}" />`,
    );
  }
  if (ogImage) tags.push(`<meta property="og:image" content="${a(ogImage)}" />`);

  tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  tags.push(`<meta name="twitter:title" content="${a(title)}" />`);
  if (description) tags.push(`<meta name="twitter:description" content="${a(description)}" />`);
  if (ogImage) tags.push(`<meta name="twitter:image" content="${a(ogImage)}" />`);

  const schemas = jsonLd === undefined ? [] : Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  for (const s of schemas) {
    tags.push(`<script type="application/ld+json">${jsonForScript(s)}</script>`);
  }

  return tags.join('\n    ');
}

/** Patterns for the tags `buildHeadTags` owns; `injectHead` strips any
 *  copy of them from the Vite index.html template before inserting. */
const MANAGED_HEAD_TAGS: RegExp[] = [
  /<title>[\s\S]*?<\/title>\s*/gi,
  /<meta\s+name="(?:description|robots|twitter:[^"]*)"[^>]*>\s*/gi,
  /<meta\s+property="og:[^"]*"[^>]*>\s*/gi,
  /<link\s+rel="(?:canonical|alternate)"[^>]*>\s*/gi,
  /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi,
];

export interface InjectHeadOptions {
  lang: HeadLang;
  /** Output of `buildHeadTags`. */
  headTags: string;
  /** Server-rendered app markup for `<div id="root">`. */
  appHtml: string;
  /** Extra raw head markup inserted right after `<meta charset>` (e.g. the
   *  js-anim inline script and CSS from @kervan/motion). */
  headPrepend?: string;
  /** Attributes added to the root div, e.g. `data-prerendered=""`. */
  rootAttrs?: string;
}

/** Turn the built `dist/index.html` template into one prerendered page:
 *  sets `<html lang>`, replaces the managed head tags (title, description,
 *  robots, canonical/alternate links, og:*, twitter:*, JSON-LD), and fills
 *  `<div id="root"></div>`. Throws if the template is missing a hook. */
export function injectHead(template: string, opts: InjectHeadOptions): string {
  let html = template;
  for (const re of MANAGED_HEAD_TAGS) html = html.replace(re, '');
  // Drop HTML comments left in <head> (they described the removed JSON-LD).
  html = html.replace(/<head>([\s\S]*?)<\/head>/i, (_m, inner: string) => {
    return `<head>${inner.replace(/<!--[\s\S]*?-->\s*/g, '')}</head>`;
  });

  if (!/<html[^>]*\slang="[^"]*"/i.test(html) && !/<html(\s|>)/i.test(html)) {
    throw new Error('injectHead: template has no <html> tag');
  }
  html = /<html[^>]*\slang="[^"]*"/i.test(html)
    ? html.replace(/(<html[^>]*\slang=")[^"]*(")/i, `$1${opts.lang}$2`)
    : html.replace(/<html(\s|>)/i, `<html lang="${opts.lang}"$1`);

  if (!/<head>/i.test(html) || !/<\/head>/i.test(html)) {
    throw new Error('injectHead: template has no <head>');
  }
  if (opts.headPrepend) {
    const prepend = opts.headPrepend;
    // Right after <meta charset> (it must stay first), else after <head>.
    html = /<meta\s+charset=[^>]*>/i.test(html)
      ? html.replace(/<meta\s+charset=[^>]*>/i, (m) => `${m}\n    ${prepend}`)
      : html.replace(/<head>/i, () => `<head>\n    ${prepend}`);
  }
  html = html.replace(/\s*<\/head>/i, () => `\n    ${opts.headTags}\n  </head>`);

  const rootRe = /<div id="root"><\/div>/;
  if (!rootRe.test(html)) throw new Error('injectHead: template has no empty <div id="root">');
  const attrs = opts.rootAttrs ? ` ${opts.rootAttrs}` : '';
  // Function replacement: appHtml may contain `$` sequences.
  html = html.replace(rootRe, () => `<div id="root"${attrs}>${opts.appHtml}</div>`);
  return html;
}

export interface SitemapEntry {
  /** Absolute canonical URL. */
  loc: string;
  /** YYYY-MM-DD. */
  lastmod?: string;
  /** hreflang alternates for this URL (tr, en, x-default). */
  alternates?: HeadAlternates;
}

/** sitemap.xml with xhtml:link hreflang alternates on every <url>. */
export function buildSitemapXml(entries: SitemapEntry[]): string {
  const x = escapeHtml;
  const urls = entries.map((e) => {
    const lines = [`  <url>`, `    <loc>${x(e.loc)}</loc>`];
    if (e.lastmod) lines.push(`    <lastmod>${x(e.lastmod)}</lastmod>`);
    if (e.alternates) {
      const alt = e.alternates;
      lines.push(`    <xhtml:link rel="alternate" hreflang="tr" href="${x(alt.tr)}" />`);
      lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${x(alt.en)}" />`);
      lines.push(
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${x(alt.xDefault ?? alt.tr)}" />`,
      );
    }
    lines.push(`  </url>`);
    return lines.join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
