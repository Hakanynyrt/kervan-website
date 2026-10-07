import type { PartKey } from './routes';

/**
 * Our own stock photos (cut from public/photos and public/videos/stok at the repo root),
 * published as `<base>-sm.webp` (480 px) and `<base>-lg.webp` (≤ 960 px), 4:3. A changed
 * picture gets a new name (`-02`): they are cached immutable.
 */
export const STOCK_TIP_PHOTOS = [
  '/photos/stok/uc-stok-01',
  '/photos/stok/uc-stok-02',
  '/photos/stok/uc-stok-03',
] as const;

export const PART_PHOTOS: Record<PartKey, readonly string[]> = {
  'alt-govde': ['/photos/parca/alt-govde-01', '/photos/parca/alt-govde-02'],
  burc: ['/photos/parca/burc-01'],
  kama: ['/photos/parca/kama-01'],
  saplama: ['/photos/parca/saplama-01', '/photos/parca/saplama-02'],
  piston: ['/photos/parca/piston-01'],
};
