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
export type RenderView = 'front' | 'rear' | 'side' | 'detail' | 'section' | 'assembly';
export interface PartRender {
  /** Breaker make and model the part fits, shown as the caption. */
  model: string;
  /** Showcase picture, 16:9 (`<base>-sm.webp` 800 px, `-lg.webp` 1600 px): page lead and card. */
  hero?: string;
  /** Interactive 3D model (GLB, metres), opened on demand in PartViewer. */
  model3d?: string;
  /** Breaker series: renders of one series share a sideways model picker (`<hero>-xs.webp` 320 px). */
  series?: string;
  /** Which bushing of the breaker (burç page): names it in the caption instead of the part name. */
  kind?: 'toolBushing' | 'upperBushing' | 'rockDrillHead';
  /** A superseded version of the same breaker's part, named in the caption through the dict. */
  variant?: 'oldType';
  views: { base: string; view: RenderView }[];
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
/** Krupp HM / AT front heads modelled from our drawings (HM 560 and HM 580 share one drawing). */
interface SeriesHead {
  model: string;
  slug: string;
  window: boolean;
  /** File version: a changed render gets a new number (images are cached immutable). */
  v?: string;
  variant?: PartRender['variant'];
  kind?: PartRender['kind'];
}
const KRUPP_ALT_GOVDE: SeriesHead[] = [
  { model: 'HM 140', slug: 'hm-140', window: false },
  { model: 'HM 300', slug: 'hm-300', window: false },
  { model: 'HM 350', slug: 'hm-350', window: false },
  { model: 'HM 550', slug: 'hm-550', window: false },
  { model: 'HM 560 / 580', slug: 'hm-560', window: false },
  { model: 'HM 600', slug: 'hm-600', window: true },
  { model: 'HM 710', slug: 'hm-710', window: true },
  { model: 'HM 720', slug: 'hm-720', window: true },
  { model: 'HM 780', slug: 'hm-780', window: false },
  { model: 'HM 800', slug: 'hm-800', window: false },
  { model: 'HM 900', slug: 'hm-900', window: true, v: '02' },
  { model: 'HM 900', slug: 'hm-900-eski', window: true, variant: 'oldType' },
  { model: 'HM 950', slug: 'hm-950', window: true },
  { model: 'HM 960', slug: 'hm-960', window: true },
  { model: 'HM 1000', slug: 'hm-1000', window: false },
  { model: 'HM 1500', slug: 'hm-1500', window: true },
  { model: 'HM 2000', slug: 'hm-2000', window: true },
  { model: 'HM 2000 Marathon', slug: 'hm-2000-marathon', window: true },
  { model: 'HM 2100 Marathon', slug: 'hm-2100-marathon', window: true },
  { model: 'HM 2300 Marathon', slug: 'hm-2300-marathon', window: false },
  { model: 'HM 2500 Marathon', slug: 'hm-2500-marathon', window: true },
  { model: 'HM 2600 Marathon', slug: 'hm-2600-marathon', window: false },
  { model: 'AT 220', slug: 'at-220', window: false },
];
/** Atlas Copco HB / MB front heads (the HB / MB names came after Atlas Copco bought Krupp's breaker
 *  business in 2002; sold under Epiroc since 2018). MB 1000 followed the Krupp HM 680. */
const ATLAS_COPCO_ALT_GOVDE: SeriesHead[] = [
  { model: 'MB 1000 (Krupp HM 680)', slug: 'mb-1000', window: false },
  { model: 'MB 1200', slug: 'mb-1200', window: false },
  { model: 'HB 2200', slug: 'hb-2200', window: false },
  { model: 'HB 2500', slug: 'hb-2500', window: false },
  { model: 'HB 3000', slug: 'hb-3000', window: false },
];
const seriesRender =
  (make: string, file: string) =>
  ({ model, slug, window, v = '01', variant, kind }: SeriesHead): PartRender => {
    const b = `/photos/parca/alt-govde-${file}-${slug}`;
    return {
      model: `${make} ${model}`,
      series: make,
      variant,
      kind,
      hero: `${b}-vitrin-${v}`,
      views: [
        { base: `${b}-on-${v}`, view: 'front' },
        { base: `${b}-arka-${v}`, view: 'rear' },
        { base: `${b}-yan-${v}`, view: 'side' },
        ...(window ? [{ base: `${b}-pencere-${v}`, view: 'detail' as const }] : []),
      ],
    };
  };

export const PART_RENDERS: Record<PartKey, readonly PartRender[]> = {
  'alt-govde': [
    {
      model: 'Rammer E68',
      series: 'Rammer',
      hero: '/photos/parca/alt-govde-rammer-e68-vitrin-01',
      model3d: '/models/alt-govde-rammer-e68-02.glb',
      views: [
        { base: '/photos/parca/alt-govde-rammer-e68-on-03', view: 'front' },
        { base: '/photos/parca/alt-govde-rammer-e68-arka-03', view: 'rear' },
        { base: '/photos/parca/alt-govde-rammer-e68-yan-03', view: 'side' },
        { base: '/photos/parca/alt-govde-rammer-e68-pencere-03', view: 'detail' },
        { base: '/photos/parca/alt-govde-rammer-e68-montaj-kesit-01', view: 'assembly' },
      ],
    },
    ...MTB_ALT_GOVDE.map(mtbRender),
    ...KRUPP_ALT_GOVDE.map(seriesRender('Krupp', 'krupp')),
    ...ATLAS_COPCO_ALT_GOVDE.map(seriesRender('Atlas Copco', 'atlas-copco')),
  ],
  burc: [
    {
      model: 'Rammer E68',
      kind: 'toolBushing',
      hero: '/photos/parca/burc-rammer-e68-kafa-vitrin-01',
      views: [
        { base: '/photos/parca/burc-rammer-e68-kafa-on-01', view: 'front' },
        { base: '/photos/parca/burc-rammer-e68-kafa-arka-01', view: 'rear' },
        { base: '/photos/parca/burc-rammer-e68-kafa-yan-01', view: 'side' },
        { base: '/photos/parca/burc-rammer-e68-kafa-kesit-01', view: 'section' },
      ],
    },
    {
      model: 'Rammer E68',
      kind: 'upperBushing',
      hero: '/photos/parca/burc-rammer-e68-ust-vitrin-01',
      views: [
        { base: '/photos/parca/burc-rammer-e68-ust-on-01', view: 'front' },
        { base: '/photos/parca/burc-rammer-e68-ust-arka-01', view: 'rear' },
        { base: '/photos/parca/burc-rammer-e68-ust-yan-01', view: 'side' },
        { base: '/photos/parca/burc-rammer-e68-ust-kesit-01', view: 'section' },
      ],
    },
  ],
  kama: [],
  saplama: [],
  piston: [],
};
