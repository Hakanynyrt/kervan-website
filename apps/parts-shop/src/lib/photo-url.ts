/**
 * Part renders and photos live in /photos/parca. On main CI builds with VITE_TIP_IMG_BASE set,
 * those files are served from R2 (https://img.kiriciparca.com, see tip-img.ts and
 * docs/agent/platform.md) so they stay out of the Pages file count; with the base empty
 * (previews, local builds) every URL stays a plain path. The opening frames (`acilis-*`) are
 * fetch()ed by ExplodedPicker and always stay on Pages. Bases stay path-only everywhere else
 * (versions, page props); the host is added only where an <img> URL is written.
 */
/** `md` (800 px) exists only for render heroes, the pictures with an `-xs` thumbnail (cards). */
type Size = 'xs' | 'sm' | 'md' | 'lg';

const BASE = ((import.meta.env?.VITE_TIP_IMG_BASE as string | undefined) ?? '').replace(/\/$/, '');

const moved = (base: string | undefined): boolean =>
  BASE !== '' && !!base?.startsWith('/photos/parca/') && !base.startsWith('/photos/parca/acilis-');

/** One image URL for a published base (`/photos/parca/<stem>-<view>-<NN>`) and size. */
export const photoImg = (base: string | undefined, size: Size): string =>
  `${moved(base) ? BASE : ''}${base}-${size}.webp`;

/** A srcset, e.g. photoSet(base, ['xs', 320], ['lg', 1600]). */
export const photoSet = (base: string | undefined, ...sizes: [Size, number][]): string =>
  sizes.map(([s, w]) => `${photoImg(base, s)} ${w}w`).join(', ');

/**
 * A card picture's srcset: a render hero in its widths. `-md` (800 px, made from `-lg`) is what
 * phones take for a two-column grid instead of the 1600 px file (2026-10-22: the burç page sent
 * 1.4 MB of pictures to phones). Only where the photos come from R2 (main): previews and local
 * builds keep every photo in dist, and the ~1,700 `-md` files would pass Pages' file limit there,
 * so `prerender.mjs` leaves them out and the srcset has no `-md`.
 */
export const cardSet = (base: string | undefined): string =>
  BASE
    ? photoSet(base, ['xs', 320], ['md', 800], ['lg', 1600])
    : photoSet(base, ['xs', 320], ['lg', 1600]);

/** The image as an absolute URL for og:image and JSON-LD (R2 URLs already are). */
export const photoImgAbs = (base: string | undefined, size: Size, site: string): string =>
  moved(base) ? photoImg(base, size) : `${site}${base}-${size}.webp`;
