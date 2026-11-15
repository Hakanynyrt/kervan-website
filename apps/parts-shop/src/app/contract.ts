import type { PageProps } from '../lib/page-props';
import type { PageModel } from '../lib/routes';

/**
 * The page kinds this app can render (PageView). An installed app keeps the list it was built
 * with while the site goes on: a page of a kind it does not know shows the update screen instead
 * of a broken page (data.ts). A kind added to the shop's `PageModel` fails `tsc` here until it is
 * added to this list (and to PageView, which the app renders).
 */
export const KNOWN_KINDS = [
  'home',
  'list',
  'brand',
  'parts',
  'part',
  'partItem',
  'popular',
  'breaker',
  'family',
  'cart',
  'legal',
  'intl',
  'guide',
  'notFound',
] as const;

export type KnownKind = (typeof KNOWN_KINDS)[number];

/** True only when the two types are the same (each assignable to the other, unions included). */
export type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * Compile-time test: the shop's page kinds are exactly the kinds above. A new or renamed kind in
 * src/lib/routes.ts makes this line a type error (`pnpm typecheck` in the verify job).
 */
export const KINDS_MATCH: Equal<PageModel['kind'], KnownKind> = true;

const KIND_SET: ReadonlySet<string> = new Set(KNOWN_KINDS);

export const isKnownKind = (k: unknown): k is KnownKind => typeof k === 'string' && KIND_SET.has(k);

/** What a page's embedded props are to the app. */
export type PropsCheck =
  | { ok: true; props: PageProps }
  | { ok: false; reason: 'unknownKind'; kind: string }
  | { ok: false; reason: 'invalid' };

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * The outer shape of a page's props (language, path, model kind, rate): enough to know the app
 * can hand them to PageView. The rest is the shop's own data, which a page that throws on it
 * turns into the update screen (ErrorBoundary).
 */
export function checkProps(v: unknown): PropsCheck {
  if (!isObj(v)) return { ok: false, reason: 'invalid' };
  if (v.lang !== 'tr' && v.lang !== 'en') return { ok: false, reason: 'invalid' };
  if (typeof v.path !== 'string' || !v.path.startsWith('/'))
    return { ok: false, reason: 'invalid' };
  if (!isObj(v.model) || typeof v.model.kind !== 'string') return { ok: false, reason: 'invalid' };
  if (v.fx !== null && v.fx !== undefined && !isObj(v.fx)) return { ok: false, reason: 'invalid' };
  if (!isKnownKind(v.model.kind)) return { ok: false, reason: 'unknownKind', kind: v.model.kind };
  return {
    ok: true,
    props: { ...(v as unknown as PageProps), fx: (v.fx ?? null) as PageProps['fx'] },
  };
}
