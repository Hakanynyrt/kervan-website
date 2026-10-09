/** Published tip image URL (see scripts/prerender.mjs: PUB suffix, one size, md = 800 px wide). */
export const TIP_PUB = 'p1';
export const tipImg = (key: string): string => `/tips/${key}-md-${TIP_PUB}.webp`;
