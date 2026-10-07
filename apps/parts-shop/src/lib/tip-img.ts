/** Published tip image URL (see scripts/prerender.mjs: PUB suffix, md = 800 px wide). */
export const TIP_PUB = 'p1';
export const tipImg = (key: string, size: 'sm' | 'md'): string =>
  `/tips/${key}-${size}-${TIP_PUB}.webp`;
