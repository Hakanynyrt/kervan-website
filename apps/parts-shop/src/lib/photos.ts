import type { PartKey } from './routes';

/**
 * Our own stock photos (cut from public/photos and public/videos/stok at the repo root),
 * published as `<base>-sm.webp` (480 px) and `<base>-lg.webp` (≤ 960 px), 4:3. A changed
 * picture gets a new name (`-02`): they are cached immutable. Only clean, sharp shots (the
 * owner's rule): frames cut from the stock videos are not used; a group without one shows none.
 */
export const STOCK_TIP_PHOTOS = [
  '/photos/stok/uc-stok-01',
  '/photos/stok/uc-stok-03',
  '/photos/stok/uc-stok-03',
] as const;

export const PART_PHOTOS: Record<PartKey, readonly string[]> = {
  'alt-govde': [],
  burc: ['/photos/parca/burc-01'],
  kama: [],
  saplama: [],
  piston: ['/photos/parca/piston-01'],
};

/**
 * 3D renders of parts we make, modelled from our drawings (studio light like the tip
 * renders), grouped by the breaker model they fit. Same files and naming as the photos.
 */
export interface PartRender {
  /** Breaker make and model the part fits, shown as the caption. */
  model: string;
  /** Showcase picture, 16:9 (`<base>-sm.webp` 800 px, `-lg.webp` 1600 px): page lead and card. */
  hero?: string;
  /** Interactive 3D model (GLB, metres), opened on demand in PartViewer. */
  model3d?: string;
  views: { base: string; view: 'front' | 'rear' | 'side' | 'detail' }[];
}
export const PART_RENDERS: Record<PartKey, readonly PartRender[]> = {
  'alt-govde': [
    {
      model: 'Rammer E68',
      hero: '/photos/parca/alt-govde-rammer-e68-vitrin-01',
      model3d: '/models/alt-govde-rammer-e68-01.glb',
      views: [
        { base: '/photos/parca/alt-govde-rammer-e68-on-03', view: 'front' },
        { base: '/photos/parca/alt-govde-rammer-e68-arka-03', view: 'rear' },
        { base: '/photos/parca/alt-govde-rammer-e68-yan-03', view: 'side' },
        { base: '/photos/parca/alt-govde-rammer-e68-pencere-03', view: 'detail' },
      ],
    },
  ],
  burc: [],
  kama: [],
  saplama: [],
  piston: [],
};
