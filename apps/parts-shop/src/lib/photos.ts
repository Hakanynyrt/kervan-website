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
  /** Breaker series: renders of one series share a sideways model picker (`<hero>-xs.webp` 320 px). */
  series?: string;
  views: { base: string; view: 'front' | 'rear' | 'side' | 'detail' }[];
}

/** MTB front heads modelled from our drawings (we make every one of them). */
const MTB_ALT_GOVDE = [
  '10',
  '15',
  '20',
  '25',
  '26',
  '30',
  '35',
  '36',
  '40',
  '45',
  '65',
  '85',
  '120',
  '125',
  '150',
  '170',
  '210',
  '210 II',
  '220',
  '250/255',
  '270',
  '275',
  '275 II',
  '360',
  '500',
  '700',
];
/** The small heads have no tie-rod-nut windows, so no window close-up. */
const MTB_NO_WINDOW = new Set(['10', '15', '20', '30', '40']);
const mtbRender = (m: string): PartRender => {
  const b = `/photos/parca/alt-govde-mtb-${m.toLowerCase().replace(/[ /]/g, '-')}`;
  return {
    model: `MTB ${m}`,
    series: 'MTB',
    hero: `${b}-vitrin-01`,
    views: [
      { base: `${b}-on-01`, view: 'front' },
      { base: `${b}-arka-01`, view: 'rear' },
      { base: `${b}-yan-01`, view: 'side' },
      ...(MTB_NO_WINDOW.has(m) ? [] : [{ base: `${b}-pencere-01`, view: 'detail' as const }]),
    ],
  };
};
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
    ...MTB_ALT_GOVDE.map(mtbRender),
  ],
  burc: [],
  kama: [],
  saplama: [],
  piston: [],
};
