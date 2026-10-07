import { demoCatalog } from '@kervan/tips';
import { buildPages } from './lib/routes';
import type { PageProps } from './lib/page-props';

/** Dev server only: page props for a URL from the DEMO catalog. */
export function devProps(pathname: string): PageProps {
  const lang = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'tr';
  const neutral = lang === 'en' ? pathname.slice(3) || '/' : pathname;
  const page = buildPages(demoCatalog()).find((p) => p.path === neutral);
  return {
    lang,
    path: page?.path ?? neutral,
    model: page?.model ?? { kind: 'notFound' },
    fx: { usdTry: 40, date: '2026-01-01' },
  };
}
