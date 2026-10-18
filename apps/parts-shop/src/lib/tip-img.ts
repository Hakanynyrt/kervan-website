/** Published tip image URL (see scripts/prerender.mjs: PUB suffix, one size, md = 800 px wide). */
export const TIP_PUB = 'p1';
/**
 * Where the tip images live: empty = this site's own /tips (previews, local builds); set at
 * build time by CI on main to the R2 domain (https://img.kiriciparca.com), which keeps them out
 * of the Pages file count (20,000 per deployment).
 */
const BASE = ((import.meta.env?.VITE_TIP_IMG_BASE as string | undefined) ?? '').replace(/\/$/, '');
export const tipImg = (key: string): string => `${BASE}/tips/${key}-md-${TIP_PUB}.webp`;
/** The image as an absolute URL for og:image and JSON-LD (R2 URLs already are). */
export const tipImgAbs = (key: string, site: string): string => {
  const u = tipImg(key);
  return u.startsWith('http') ? u : site + u;
};
