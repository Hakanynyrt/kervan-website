/**
 * "Son bakılanlar" and "Yıldızlılar" of the owner area, kept on this device only
 * (localStorage). Breaker slugs only: no prices, sizes or private notes. Cleared on sign-out.
 */
export const RECENT_KEY = 'kv_tech_recent_v1';
export const STAR_KEY = 'kv_tech_star_v1';
export const RECENT_MAX = 15;

/** The slug moved to the front, duplicates dropped, at most `max` kept. */
export const pushRecent = (list: readonly string[], slug: string, max = RECENT_MAX): string[] =>
  [slug, ...list.filter((x) => x !== slug)].slice(0, max);

/** The slug added (at the front) or removed. */
export const toggleStar = (list: readonly string[], slug: string): string[] =>
  list.includes(slug) ? list.filter((x) => x !== slug) : [slug, ...list];

export function readList(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 50) : [];
  } catch {
    return [];
  }
}

export function writeList(key: string, list: readonly string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* private mode or full storage: the lists are a convenience only */
  }
}

export function clearTechLocal(): void {
  try {
    localStorage.removeItem(RECENT_KEY);
    localStorage.removeItem(STAR_KEY);
  } catch {
    /* nothing stored */
  }
}
