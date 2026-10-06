import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ogLocale } from '@kervan/seo';
import { pageHead } from '../lib/page-meta';

/** Keeps <head> in step with the route after client-side navigation.
 *  The prerendered HTML already carries the same tags for the first URL
 *  (built from the same `pageHead()`), so on load this rewrites identical
 *  values; it never adds duplicates. Renders nothing. */
export default function RouteHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    const h = pageHead(pathname);
    document.documentElement.setAttribute('lang', h.lang);
    document.title = h.title;
    setMeta('name', 'description', h.description);
    setMeta('name', 'robots', h.robots);
    setLink('canonical', undefined, h.canonical);
    setLink('alternate', 'tr', h.alternates?.tr);
    setLink('alternate', 'en', h.alternates?.en);
    setLink('alternate', 'x-default', h.alternates && (h.alternates.xDefault ?? h.alternates.tr));

    setMeta('property', 'og:type', h.ogType ?? 'website');
    setMeta('property', 'og:title', h.title);
    setMeta('property', 'og:description', h.description);
    setMeta('property', 'og:url', h.canonical);
    setMeta('property', 'og:locale', ogLocale(h.lang));
    setMeta(
      'property',
      'og:locale:alternate',
      h.alternates ? ogLocale(h.lang === 'en' ? 'tr' : 'en') : undefined,
    );
    setMeta('property', 'og:image', h.ogImage);
    setMeta('name', 'twitter:title', h.title);
    setMeta('name', 'twitter:description', h.description);
    setMeta('name', 'twitter:image', h.ogImage);

    document.head
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((el) => el.remove());
    const schemas = h.jsonLd === undefined ? [] : Array.isArray(h.jsonLd) ? h.jsonLd : [h.jsonLd];
    for (const s of schemas) {
      const el = document.createElement('script');
      el.type = 'application/ld+json';
      el.textContent = JSON.stringify(s);
      document.head.appendChild(el);
    }
  }, [pathname]);

  return null;
}

/** Set (or remove, when `value` is undefined) one <meta>. */
function setMeta(attr: 'name' | 'property', key: string, value: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (value === undefined) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

/** Set (or remove) one <link rel>; `hreflang` picks the alternate. */
function setLink(rel: string, hreflang: string | undefined, href: string | undefined) {
  const sel = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (href === undefined) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    if (hreflang) el.hreflang = hreflang;
    document.head.appendChild(el);
  }
  el.href = href;
}
