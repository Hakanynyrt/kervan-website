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
  variant?: 'oldType' | 'roundNut';
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
  { model: 'TEX 700 / 900', slug: 'tex-900', window: false },
  { model: 'TEX 1400', slug: 'tex-1400', window: true },
];
/** Rammer E / G / S front heads (E68, modelled first, leads the strip with its 3D model). */
const RAMMER_ALT_GOVDE: SeriesHead[] = [
  { model: 'E64', slug: 'e64', window: true },
  { model: 'E65', slug: 'e65', window: true },
  { model: 'E66', slug: 'e66', window: true },
  { model: 'E66 N', slug: 'e66n', window: true },
  { model: 'G80', slug: 'g80', window: true },
  { model: 'G88', slug: 'g88', window: false },
  { model: 'G90', slug: 'g90', window: true },
  { model: 'G100', slug: 'g100', window: true },
  { model: 'S25', slug: 's25', window: true },
  { model: 'S29', slug: 's29', window: true },
  { model: 'S54', slug: 's54', window: true },
  { model: 'S55', slug: 's55', window: true },
  { model: 'S56', slug: 's56', window: true },
  { model: 'S83', slug: 's83', window: true },
  { model: 'S84', slug: 's84', window: true },
  { model: 'S86', slug: 's86', window: true },
];
/** Soosan SB (old type), SB TS-P and ST front heads; three TS-P models also come with round tie-rod nuts. */
const SOOSAN_ALT_GOVDE: SeriesHead[] = [
  { model: 'SB50 TS-P', slug: 'sb50tsp', window: true },
  { model: 'SB60', slug: 'sb60', window: true },
  { model: 'SB60 TS-P', slug: 'sb60tsp', window: true },
  { model: 'SB60 TS-P', slug: 'sb60tsp-y', window: true, variant: 'roundNut' },
  { model: 'SB70 TS-P', slug: 'sb70tsp', window: true },
  { model: 'SB80', slug: 'sb80', window: true },
  { model: 'SB81 TS-P', slug: 'sb81tsp', window: true },
  { model: 'SB81 TS-P', slug: 'sb81tsp-y', window: true, variant: 'roundNut' },
  { model: 'SB100 TS-P', slug: 'sb100tsp', window: true },
  { model: 'SB121 TS-P', slug: 'sb121tsp', window: true },
  { model: 'SB121 TS-P', slug: 'sb121tsp-y', window: true, variant: 'roundNut' },
  { model: 'SB130 TS-P', slug: 'sb130tsp', window: true },
  { model: 'SB150', slug: 'sb150', window: true },
  { model: 'SB151 TS-P', slug: 'sb151tsp', window: true },
  { model: 'ST180', slug: 'st180', window: true },
];
/** Montabert BRH / BRM / BRP / BRV and M front heads. */
const MONTABERT_ALT_GOVDE: SeriesHead[] = [
  { model: 'BRH 125', slug: 'brh125', window: true },
  { model: 'BRH 250', slug: 'brh250', window: true },
  { model: 'BRH 501', slug: 'brh501', window: true },
  { model: 'BRH 570', slug: 'brh570', window: true },
  { model: 'BRH 625', slug: 'brh625', window: true },
  { model: 'BRM 900', slug: 'brm900', window: true },
  { model: 'BRM 1200 V', slug: 'brm1200v', window: true },
  { model: 'BRM 1600 V', slug: 'brm1600v', window: true },
  { model: 'BRP 95', slug: 'brp95', window: true },
  { model: 'BRV 32', slug: 'brv32', window: true },
  { model: 'BRV 43', slug: 'brv43', window: true },
  { model: 'BRV 45 V', slug: 'brv45v', window: true },
  { model: 'M 600', slug: 'm600', window: true },
  { model: 'M 700', slug: 'm700', window: true },
];
/** Furukawa F, HB-G and HB front heads. */
const FURUKAWA_ALT_GOVDE: SeriesHead[] = [
  { model: 'F12', slug: 'f-12', window: true },
  { model: 'F19', slug: 'f-19', window: true },
  { model: 'F22', slug: 'f-22', window: true },
  { model: 'F27', slug: 'f-27', window: true },
  { model: 'F35', slug: 'f-35', window: true },
  { model: 'F45', slug: 'f-45', window: true },
  { model: 'F100', slug: 'f-100', window: true },
  { model: 'HB5G', slug: 'hb-5-g', window: true },
  { model: 'HB8G', slug: 'hb-8-g', window: true },
  { model: 'HB15G', slug: 'hb-15-g', window: true },
  { model: 'HB20G', slug: 'hb-20-g', window: true },
  { model: 'HB30G', slug: 'hb-30-g', window: true },
  { model: 'HB30G', slug: 'hb-30-g-eski', window: true, variant: 'oldType' },
  { model: 'HB40G', slug: 'hb-40-g', window: true },
  { model: 'HB200', slug: 'hb-200', window: true },
  { model: 'HB1200', slug: 'hb-1200', window: true },
];
/** Okada OKB front heads. */
const OKADA_ALT_GOVDE: SeriesHead[] = [
  { model: 'OKB 304B', slug: '304b', window: true },
  { model: 'OKB 308', slug: '308', window: true },
  { model: 'OKB 310', slug: '310', window: true },
  { model: 'OKB 312B', slug: '312b', window: true },
  { model: 'OKB 316', slug: '316', window: true },
];
/** Toyo THBB front heads (the THBB 31 head is a turned bar with flats, no nut windows). */
const TOYO_ALT_GOVDE: SeriesHead[] = [
  { model: 'THBB 31', slug: '31', window: false },
  { model: 'THBB 801', slug: '801', window: true },
  { model: 'THBB 1400', slug: '1400', window: true },
  { model: 'THBB 1401', slug: '1401', window: true },
  { model: 'THBB 1600', slug: '1600', window: true },
  { model: 'THBB 1600', slug: '1600-eski', window: true, variant: 'oldType' },
  { model: 'THBB 2000', slug: '2000', window: true },
  { model: 'THBB 3000', slug: '3000', window: true },
  { model: 'THBB 5000', slug: '5000', window: true },
];
/** NPK E and H series front heads (no corner nut windows). */
const NPK_ALT_GOVDE: SeriesHead[] = [
  { model: 'E-213A', slug: 'e-213a', window: false },
  { model: 'E-216', slug: 'e-216', window: false },
  { model: 'E-220', slug: 'e-220', window: false },
  { model: 'H-2XA', slug: 'h-2xa', window: false },
  { model: 'H-3XA', slug: 'h-3xa', window: false },
  { model: 'H-7X', slug: 'h-7x', window: false },
  { model: 'H-8XA', slug: 'h-8xa', window: false },
  { model: 'H-10XB', slug: 'h-10xb', window: false },
  { model: 'H-12X', slug: 'h-12x', window: false },
  { model: 'H-16X', slug: 'h-16x', window: false },
];
/** Indeco MES front heads. */
const INDECO_ALT_GOVDE: SeriesHead[] = [
  { model: 'MES 621', slug: 'mes-621', window: true },
  { model: 'MES 2000', slug: 'mes-2000', window: true },
  { model: 'MES 2500', slug: 'mes-2500', window: true },
  { model: 'MES 3000', slug: 'mes-3000', window: true },
  { model: 'MES 3500', slug: 'mes-3500', window: true },
  { model: 'MES 4000', slug: 'mes-4000', window: true },
  { model: 'MES 7000', slug: 'mes-7000', window: true },
];
/** Daemo S front heads. */
const DAEMO_ALT_GOVDE: SeriesHead[] = [
  { model: 'S500', slug: 's-500', window: false },
  { model: 'S2000', slug: 's-2000', window: true },
  { model: 'S2200', slug: 's-2200', window: true },
  { model: 'S2200 II', slug: 's-2200-ii', window: true },
];
/** Hanwoo RHB front heads. */
const HANWOO_ALT_GOVDE: SeriesHead[] = [
  { model: 'RHB 305V', slug: 'rhb-305v', window: false },
  { model: 'RHB 320', slug: 'rhb-320', window: true },
  { model: 'RHB 325', slug: 'rhb-325', window: true },
  { model: 'RHB 330', slug: 'rhb-330', window: true },
];
/** DNB (Dainong) D and D-IIS front heads. */
const DNB_ALT_GOVDE: SeriesHead[] = [
  { model: 'D70', slug: 'd70', window: true },
  { model: 'D70 IIS', slug: 'd70-iis', window: true },
  { model: 'D110 IIS', slug: 'd110-iis', window: true },
  { model: 'D130 IIS', slug: 'd130-iis', window: true },
  { model: 'D160 IIS', slug: 'd160-iis', window: true },
];
/** Cat hydraulic hammer front heads. */
const CAT_ALT_GOVDE: SeriesHead[] = [
  { model: '115', slug: '115', window: true },
  { model: '130', slug: '130', window: true },
  { model: '140', slug: '140', window: true },
  { model: '160', slug: '160', window: true },
];
/** MSB and MSB SAGA front heads. */
const MSB_ALT_GOVDE: SeriesHead[] = [
  { model: '200', slug: '200', window: true },
  { model: '250', slug: '250', window: true },
  { model: '300', slug: '300', window: true },
  { model: '400', slug: '400', window: true },
  { model: '450', slug: '450', window: true },
  { model: '500', slug: '500', window: true },
  { model: '550', slug: '550', window: true },
  { model: 'MS 810', slug: '810', window: true },
  { model: '900', slug: '900', window: true },
  { model: 'SAGA 6000', slug: 'saga-6000', window: true },
];
/** Toku TNB front heads. */
const TOKU_ALT_GOVDE: SeriesHead[] = [
  { model: 'TNB-14E', slug: 'tnb-14e', window: false },
  { model: 'TNB-150', slug: 'tnb-150', window: false },
  { model: 'TNB-230', slug: 'tnb-230', window: false },
];
/** Kwanglim SG front heads. */
const KWANGLIM_ALT_GOVDE: SeriesHead[] = [
  { model: 'SG-800S', slug: 'sg-800s', window: true },
  { model: 'SG-2100', slug: 'sg-2100', window: true },
  { model: 'SG-2800', slug: 'sg-2800', window: true },
];
/** D&A front heads. */
const DA_ALT_GOVDE: SeriesHead[] = [
  { model: '1300', slug: '1300', window: false },
  { model: '130V', slug: '130v', window: true },
  { model: '200V', slug: '200v', window: true },
  { model: '2200', slug: '2200', window: true },
];
/** Topa front heads. */
const TOPA_ALT_GOVDE: SeriesHead[] = [
  { model: '300', slug: '300', window: true },
  { model: '1400', slug: '1400', window: true },
];
/** Mega front heads. */
const MEGA_ALT_GOVDE: SeriesHead[] = [
  { model: '130', slug: '130', window: true },
  { model: '280', slug: '280', window: true },
];
/** Kent KHB front heads. */
const KENT_ALT_GOVDE: SeriesHead[] = [{ model: 'KHB 150', slug: 'khb-150', window: true }];
/** Tamrock (Rammer's owner from 1995, Sandvik since 1997): the HL 510 is a rock drill, not a breaker. */
const TAMROCK_ALT_GOVDE: SeriesHead[] = [
  { model: 'HL 510', slug: 'hl510', window: false, kind: 'rockDrillHead' },
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
    ...RAMMER_ALT_GOVDE.map(seriesRender('Rammer', 'rammer')),
    ...MTB_ALT_GOVDE.map(mtbRender),
    ...KRUPP_ALT_GOVDE.map(seriesRender('Krupp', 'krupp')),
    ...ATLAS_COPCO_ALT_GOVDE.map(seriesRender('Atlas Copco', 'atlas-copco')),
    ...SOOSAN_ALT_GOVDE.map(seriesRender('Soosan', 'soosan')),
    ...MONTABERT_ALT_GOVDE.map(seriesRender('Montabert', 'montabert')),
    ...FURUKAWA_ALT_GOVDE.map(seriesRender('Furukawa', 'furukawa')),
    ...OKADA_ALT_GOVDE.map(seriesRender('Okada', 'okada')),
    ...TOYO_ALT_GOVDE.map(seriesRender('Toyo', 'toyo')),
    ...NPK_ALT_GOVDE.map(seriesRender('NPK', 'npk')),
    ...INDECO_ALT_GOVDE.map(seriesRender('Indeco', 'indeco')),
    ...DAEMO_ALT_GOVDE.map(seriesRender('Daemo', 'daemo')),
    ...HANWOO_ALT_GOVDE.map(seriesRender('Hanwoo', 'hanwoo')),
    ...DNB_ALT_GOVDE.map(seriesRender('DNB', 'dnb')),
    ...CAT_ALT_GOVDE.map(seriesRender('Cat', 'cat')),
    ...MSB_ALT_GOVDE.map(seriesRender('MSB', 'msb')),
    ...TOKU_ALT_GOVDE.map(seriesRender('Toku', 'toku')),
    ...KWANGLIM_ALT_GOVDE.map(seriesRender('Kwanglim', 'kwanglim')),
    ...DA_ALT_GOVDE.map(seriesRender('D&A', 'da')),
    ...TOPA_ALT_GOVDE.map(seriesRender('Topa', 'topa')),
    ...MEGA_ALT_GOVDE.map(seriesRender('Mega', 'mega')),
    ...KENT_ALT_GOVDE.map(seriesRender('Kent', 'kent')),
    ...TAMROCK_ALT_GOVDE.map(seriesRender('Tamrock', 'tamrock')),
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
