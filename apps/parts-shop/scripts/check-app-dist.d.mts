// Types of check-app-dist.mjs (plain JS so it runs without a build step).
export const MAX_BYTES: number;
export const MAX_FILES: number;
export const OWN_HOSTS: string[];
export const LINK_HOSTS: string[];
export const NAME_HOSTS: string[];
export const TRACKER: RegExp[];
export const PRIVATE: RegExp[];
export function adIds(adsSource: string): string[];
export function catalogValues(
  catalog: { families?: { code?: unknown; skus?: { code?: unknown }[] }[] } | null,
  sourceText: string,
): string[];
export function hostsIn(text: string): Set<string>;
export function allowedHosts(origin: string): Set<string>;
export function scanFile(
  rel: string,
  text: string,
  ctx: { ads: string[]; catalog: string[]; allowed: Set<string> },
): { rule: string; host?: string }[];
