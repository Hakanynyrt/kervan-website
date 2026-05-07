import { useEffect } from 'react';

interface Props {
  /** `<title>` content. */
  title: string;
  /** `<meta name="description">`. */
  description?: string;
  /** Canonical URL (absolute). Sets/replaces `<link rel="canonical">`. */
  canonical?: string;
  /** OG image URL. */
  image?: string;
  /** OG type. Defaults to `"website"`. */
  type?: 'website' | 'article' | 'product';
}

/** Updates `<title>`, description, canonical and OpenGraph tags for the
 *  lifetime of the component, then restores the previous values on
 *  unmount. Replaces `UseDocTitle` with full meta coverage. */
export function PageMeta({
  title,
  description,
  canonical,
  image,
  type = 'website',
}: Props) {
  useEffect(() => {
    const prev = capture();

    document.title = title;
    setMeta('description', description, 'name');
    setLink('canonical', canonical);

    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:url', canonical, 'property');
    setMeta('og:image', image, 'property');
    setMeta('og:type', type, 'property');

    setMeta('twitter:title', title, 'name');
    setMeta('twitter:description', description, 'name');
    setMeta('twitter:image', image, 'name');

    return () => {
      restore(prev);
    };
  }, [title, description, canonical, image, type]);

  return null;
}

interface Snapshot {
  title: string;
  description: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogUrl: string | null;
  ogImage: string | null;
  ogType: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
}

function capture(): Snapshot {
  return {
    title: document.title,
    description: getMeta('description', 'name'),
    canonical: getLink('canonical'),
    ogTitle: getMeta('og:title', 'property'),
    ogDescription: getMeta('og:description', 'property'),
    ogUrl: getMeta('og:url', 'property'),
    ogImage: getMeta('og:image', 'property'),
    ogType: getMeta('og:type', 'property'),
    twitterTitle: getMeta('twitter:title', 'name'),
    twitterDescription: getMeta('twitter:description', 'name'),
    twitterImage: getMeta('twitter:image', 'name'),
  };
}

function restore(s: Snapshot) {
  document.title = s.title;
  setMeta('description', s.description ?? undefined, 'name');
  setLink('canonical', s.canonical ?? undefined);
  setMeta('og:title', s.ogTitle ?? undefined, 'property');
  setMeta('og:description', s.ogDescription ?? undefined, 'property');
  setMeta('og:url', s.ogUrl ?? undefined, 'property');
  setMeta('og:image', s.ogImage ?? undefined, 'property');
  setMeta('og:type', s.ogType ?? undefined, 'property');
  setMeta('twitter:title', s.twitterTitle ?? undefined, 'name');
  setMeta('twitter:description', s.twitterDescription ?? undefined, 'name');
  setMeta('twitter:image', s.twitterImage ?? undefined, 'name');
}

function setMeta(key: string, value: string | undefined, attr: 'name' | 'property') {
  if (value === undefined) return;
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function getMeta(key: string, attr: 'name' | 'property'): string | null {
  const el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  return el ? el.getAttribute('content') : null;
}

function setLink(rel: string, href: string | undefined) {
  if (href === undefined) return;
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function getLink(rel: string): string | null {
  const el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  return el ? el.getAttribute('href') : null;
}
