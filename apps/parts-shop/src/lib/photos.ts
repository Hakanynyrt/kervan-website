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
  kind?:
    | 'toolBushing'
    | 'upperBushing'
    | 'thrustRing'
    | 'thrustUpperBushing'
    | 'oneBushing'
    | 'rockDrillThrustRing'
    | 'rockDrillHead'
    | 'retainerKey'
    | 'tieRod'
    | 'piston';
  /** Another version of the same breaker's part, named in the caption through the dict. */
  variant?: 'oldType' | 'newType' | 'roundNut' | 'autoGrease';
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

/**
 * Bushings modelled from our drawings, one strip per make. `kind` follows the drawing's title
 * block: a thrust ring is sometimes one piece with the upper bushing (`thrustUpperBushing`), and
 * the small Krupp HM 140 / 190 have one bushing for all three (`oneBushing`).
 */
interface Bushing {
  model: string;
  /** Picture name: `/photos/parca/burc-<file>-<view>-01`. */
  file: string;
  kind: NonNullable<PartRender['kind']>;
  variant?: PartRender['variant'];
}
const RAMMER_BURC: Bushing[] = [
  { model: 'E64', file: 'rammer-e-64-kafa', kind: 'toolBushing' },
  { model: 'E64', file: 'rammer-e-64-ust', kind: 'thrustRing' },
  { model: 'E65', file: 'rammer-e-65-kafa', kind: 'toolBushing' },
  { model: 'E65', file: 'rammer-e-65-ust', kind: 'upperBushing' },
  { model: 'E66', file: 'rammer-e-66-kafa', kind: 'toolBushing' },
  { model: 'E66', file: 'rammer-e-66-ust', kind: 'thrustRing' },
  { model: 'E68', file: 'rammer-e68-kafa', kind: 'toolBushing' },
  { model: 'E68', file: 'rammer-e68-ust', kind: 'upperBushing' },
  { model: 'G80', file: 'rammer-g-80-kafa', kind: 'toolBushing' },
  { model: 'G80', file: 'rammer-g-80-ust', kind: 'thrustRing' },
  { model: 'G88', file: 'rammer-g-88-kafa', kind: 'toolBushing' },
  { model: 'G88', file: 'rammer-g-88-ust', kind: 'thrustRing' },
  { model: 'G90', file: 'rammer-g-90-kafa', kind: 'toolBushing' },
  { model: 'G90', file: 'rammer-g-90-ust', kind: 'thrustRing' },
  { model: 'G100', file: 'rammer-g-100-kafa', kind: 'toolBushing' },
  { model: 'G100', file: 'rammer-g-100-ust', kind: 'thrustRing' },
  { model: 'S21', file: 'rammer-s-21-kafa', kind: 'toolBushing' },
  { model: 'S21', file: 'rammer-s-21-ust', kind: 'thrustRing' },
  { model: 'S23', file: 'rammer-s-23-kafa', kind: 'toolBushing' },
  { model: 'S23', file: 'rammer-s-23-ust', kind: 'thrustRing' },
  { model: 'S25', file: 'rammer-s-25-kafa', kind: 'toolBushing' },
  { model: 'S25', file: 'rammer-s-25-ust', kind: 'thrustRing' },
  { model: 'S26', file: 'rammer-s-26-kafa', kind: 'toolBushing' },
  { model: 'S26', file: 'rammer-s-26-ust', kind: 'thrustUpperBushing' },
  { model: 'S27', file: 'rammer-s-27-kafa', kind: 'toolBushing' },
  { model: 'S27', file: 'rammer-s-27-ust', kind: 'thrustUpperBushing' },
  { model: 'S29', file: 'rammer-s-29-kafa', kind: 'toolBushing' },
  { model: 'S29', file: 'rammer-s-29-ust', kind: 'thrustUpperBushing' },
  { model: 'S52', file: 'rammer-s-52-kafa', kind: 'toolBushing' },
  { model: 'S54', file: 'rammer-s-54-kafa', kind: 'toolBushing' },
  { model: 'S54', file: 'rammer-s-54-ust', kind: 'thrustRing' },
  { model: 'S55', file: 'rammer-s-55-kafa', kind: 'toolBushing' },
  { model: 'S55', file: 'rammer-s-55-ust', kind: 'thrustRing' },
  { model: 'S56', file: 'rammer-s-56-kafa', kind: 'toolBushing' },
  { model: 'S56', file: 'rammer-s-56-ust', kind: 'thrustRing' },
  { model: 'S82', file: 'rammer-s-82-kafa', kind: 'toolBushing' },
  { model: 'S82', file: 'rammer-s-82-ust', kind: 'thrustRing' },
  { model: 'S83', file: 'rammer-s-83-kafa', kind: 'toolBushing' },
  { model: 'S83', file: 'rammer-s-83-ust', kind: 'thrustRing' },
  { model: 'S84', file: 'rammer-s-84-kafa', kind: 'toolBushing' },
  { model: 'S84', file: 'rammer-s-84-ust', kind: 'thrustRing' },
  { model: 'S86', file: 'rammer-s-86-kafa', kind: 'toolBushing' },
  { model: 'S86', file: 'rammer-s-86-ust', kind: 'upperBushing' },
];
const MTB_BURC: Bushing[] = [
  { model: '15', file: 'mtb-15-kafa', kind: 'toolBushing' },
  { model: '15', file: 'mtb-15-ust', kind: 'thrustUpperBushing' },
  { model: '25', file: 'mtb-25-kafa', kind: 'toolBushing' },
  { model: '30', file: 'mtb-30-kafa', kind: 'toolBushing' },
  { model: '30', file: 'mtb-30-ust', kind: 'thrustUpperBushing' },
  { model: '36', file: 'mtb-36-kafa', kind: 'toolBushing' },
  { model: '36', file: 'mtb-36-ust', kind: 'upperBushing' },
  { model: '40', file: 'mtb-40-kafa', kind: 'toolBushing' },
  { model: '40', file: 'mtb-40-ust', kind: 'thrustUpperBushing' },
  { model: '45', file: 'mtb-45-kafa', kind: 'toolBushing' },
  { model: '45', file: 'mtb-45-ust', kind: 'upperBushing' },
  { model: '65', file: 'mtb-65-kafa', kind: 'toolBushing' },
  { model: '65', file: 'mtb-65-ust', kind: 'upperBushing' },
  { model: '85', file: 'mtb-85-kafa', kind: 'toolBushing' },
  { model: '85', file: 'mtb-85-ust', kind: 'thrustUpperBushing' },
  { model: '120', file: 'mtb-120-kafa', kind: 'toolBushing' },
  { model: '120', file: 'mtb-120-ust', kind: 'upperBushing' },
  { model: '125', file: 'mtb-125-kafa', kind: 'toolBushing' },
  { model: '125', file: 'mtb-125-ust', kind: 'thrustRing' },
  { model: '150', file: 'mtb-150-kafa', kind: 'toolBushing' },
  { model: '150', file: 'mtb-150-ust', kind: 'upperBushing' },
  { model: '170', file: 'mtb-170-kafa', kind: 'toolBushing' },
  { model: '170', file: 'mtb-170-ust', kind: 'upperBushing' },
  { model: '210', file: 'mtb-210-kafa', kind: 'toolBushing' },
  { model: '210', file: 'mtb-210-ust', kind: 'upperBushing' },
  { model: '210 II', file: 'mtb-210-ii-kafa', kind: 'toolBushing' },
  { model: '210 II', file: 'mtb-210-ii-ust', kind: 'upperBushing' },
  { model: '220', file: 'mtb-220-kafa', kind: 'toolBushing' },
  { model: '220', file: 'mtb-220-ust', kind: 'thrustRing' },
  { model: '250', file: 'mtb-250-kafa', kind: 'toolBushing' },
  { model: '250', file: 'mtb-250-ust', kind: 'upperBushing' },
  { model: '270', file: 'mtb-270-kafa', kind: 'toolBushing' },
  { model: '275', file: 'mtb-275-kafa', kind: 'toolBushing' },
  { model: '275', file: 'mtb-275-ust', kind: 'upperBushing' },
  { model: '275', file: 'mtb-275-1-kafa', kind: 'toolBushing', variant: 'autoGrease' },
  { model: '275 II', file: 'mtb-275-ii-kafa', kind: 'toolBushing' },
  { model: '275 II', file: 'mtb-275-ii-ust', kind: 'upperBushing' },
  { model: '360', file: 'mtb-360-kafa', kind: 'toolBushing' },
  { model: '360', file: 'mtb-360-ust', kind: 'upperBushing' },
  { model: '500', file: 'mtb-500-kafa', kind: 'toolBushing' },
  { model: '500', file: 'mtb-500-ust', kind: 'thrustRing' },
  { model: '700', file: 'mtb-700-kafa', kind: 'toolBushing' },
];
const KRUPP_BURC: Bushing[] = [
  { model: 'HM 60 / 61 / 62', file: 'krupp-hm-60-61-62-kafa', kind: 'toolBushing' },
  { model: 'HM 60 / 61 / 62', file: 'krupp-hm-60-61-62-ust', kind: 'thrustUpperBushing' },
  { model: 'HM 135', file: 'krupp-hm-135-kafa', kind: 'toolBushing' },
  { model: 'HM 135', file: 'krupp-hm-135-ust', kind: 'thrustRing' },
  { model: 'HM 140', file: 'krupp-hm-140-kafa', kind: 'oneBushing' },
  { model: 'HM 185', file: 'krupp-hm-185-kafa', kind: 'toolBushing' },
  { model: 'HM 185', file: 'krupp-hm-185-ust', kind: 'thrustRing' },
  { model: 'HM 190', file: 'krupp-hm-190-kafa', kind: 'oneBushing' },
  { model: 'HM 200', file: 'krupp-hm-200-kafa', kind: 'toolBushing' },
  { model: 'HM 200', file: 'krupp-hm-200-ust', kind: 'upperBushing' },
  { model: 'HM 300 / 301 / 305', file: 'krupp-hm-300-301-305-kafa', kind: 'toolBushing' },
  { model: 'HM 300 / 301 / 305', file: 'krupp-hm-300-301-305-ust', kind: 'thrustUpperBushing' },
  { model: 'HM 350', file: 'krupp-hm-350-350-v-kafa', kind: 'toolBushing' },
  { model: 'HM 350', file: 'krupp-hm-350-350-v-ust', kind: 'thrustRing' },
  { model: 'HM 550 / 551 / 555', file: 'krupp-hm-550-551-555-kafa', kind: 'toolBushing' },
  { model: 'HM 550 / 551 / 555', file: 'krupp-hm-550-551-555-ust', kind: 'thrustUpperBushing' },
  { model: 'HM 560', file: 'krupp-hm-560-kafa', kind: 'toolBushing' },
  { model: 'HM 560', file: 'krupp-hm-560-ust', kind: 'thrustUpperBushing' },
  { model: 'HM 580', file: 'krupp-hm-580-kafa', kind: 'toolBushing' },
  { model: 'HM 580', file: 'krupp-hm-580-ust', kind: 'thrustUpperBushing' },
  { model: 'HM 600', file: 'krupp-hm-600-kafa', kind: 'toolBushing' },
  { model: 'HM 600', file: 'krupp-hm-600-ust', kind: 'upperBushing' },
  { model: 'HM 700 / 701 / 702', file: 'krupp-hm-700-701-702-kafa', kind: 'toolBushing' },
  { model: 'HM 700 / 701 / 702', file: 'krupp-hm-700-701-702-ust', kind: 'thrustRing' },
  { model: 'HM 710 / 711 / 712', file: 'krupp-hm-710-711-712-kafa', kind: 'toolBushing' },
  { model: 'HM 720 / 721 / 722', file: 'krupp-hm-720-721-722-kafa', kind: 'toolBushing' },
  { model: 'HM 720 / 721 / 722', file: 'krupp-hm-720-721-722-ust', kind: 'thrustRing' },
  { model: 'HM 780', file: 'krupp-hm-780-kafa', kind: 'toolBushing' },
  { model: 'HM 780', file: 'krupp-hm-780-ust', kind: 'thrustRing' },
  { model: 'HM 800', file: 'krupp-hm-800-kafa', kind: 'toolBushing' },
  { model: 'HM 800', file: 'krupp-hm-800-ust', kind: 'thrustRing' },
  { model: 'HM 900 / 901 / 902', file: 'krupp-hm-900-901-902-kafa', kind: 'toolBushing' },
  { model: 'HM 900 / 901 / 902', file: 'krupp-hm-900-901-902-ust', kind: 'thrustRing' },
  { model: 'HM 950 / 951 / 952', file: 'krupp-hm-950-951-952-kafa', kind: 'toolBushing' },
  { model: 'HM 950 / 951 / 952', file: 'krupp-hm-950-951-952-ust', kind: 'thrustRing' },
  { model: 'HM 960 / 961 / 962', file: 'krupp-hm-960-961-962-kafa', kind: 'toolBushing' },
  { model: 'HM 960 / 961 / 962', file: 'krupp-hm-960-961-962-ust', kind: 'thrustRing' },
  { model: 'HM 1000', file: 'krupp-hm-1000-kafa', kind: 'toolBushing' },
  { model: 'HM 1000', file: 'krupp-hm-1000-ust', kind: 'thrustRing' },
  { model: 'HM 1201', file: 'krupp-hm-1201-kafa', kind: 'toolBushing' },
  { model: 'HM 1201', file: 'krupp-hm-1201-ust', kind: 'thrustRing' },
  { model: 'HM 1500', file: 'krupp-hm-1500-kafa', kind: 'toolBushing' },
  { model: 'HM 1500', file: 'krupp-hm-1500-ust', kind: 'thrustRing' },
  { model: 'HM 1500 Marathon', file: 'krupp-hm-1500-marathon-kafa', kind: 'toolBushing' },
  { model: 'HM 1500 Marathon', file: 'krupp-hm-1500-marathon-ust', kind: 'upperBushing' },
  { model: 'HM 2000', file: 'krupp-hm-2000-kafa', kind: 'toolBushing' },
  { model: 'HM 2000', file: 'krupp-hm-2000-ust', kind: 'thrustRing' },
  {
    model: 'HM 2000',
    file: 'krupp-hm-2000-yeni-tip-kafa',
    kind: 'toolBushing',
    variant: 'newType',
  },
  {
    model: 'HM 2000',
    file: 'krupp-hm-2000-yeni-tip-ust',
    kind: 'upperBushing',
    variant: 'newType',
  },
  { model: 'HM 2000 Marathon', file: 'krupp-hm-2000-marathon-kafa', kind: 'toolBushing' },
  { model: 'HM 2000 Marathon', file: 'krupp-hm-2000-marathon-ust', kind: 'upperBushing' },
  { model: 'HM 2100 Marathon', file: 'krupp-hm-2100-marathon-kafa', kind: 'toolBushing' },
  { model: 'HM 2100 Marathon', file: 'krupp-hm-2100-marathon-ust', kind: 'upperBushing' },
  { model: 'HM 2300 Marathon', file: 'krupp-hm-2300-marathon-kafa', kind: 'toolBushing' },
  { model: 'HM 2300 Marathon', file: 'krupp-hm-2300-marathon-ust', kind: 'thrustRing' },
  { model: 'HM 2500 Marathon', file: 'krupp-hm-2500-marathon-kafa', kind: 'toolBushing' },
  { model: 'HM 2500 Marathon', file: 'krupp-hm-2500-marathon-ust', kind: 'thrustRing' },
  { model: 'HM 2600 Marathon', file: 'krupp-hm-2600-marathon-kafa', kind: 'toolBushing' },
  { model: 'HM 2600 Marathon', file: 'krupp-hm-2600-marathon-ust', kind: 'thrustRing' },
];
const ATLAS_COPCO_BURC: Bushing[] = [
  { model: 'HB 2200', file: 'atlas-copco-hb-2200-kafa', kind: 'toolBushing' },
  { model: 'HB 2200', file: 'atlas-copco-hb-2200-ust', kind: 'thrustRing' },
  { model: 'HB 2500', file: 'atlas-copco-hb-2500-kafa', kind: 'toolBushing' },
  { model: 'HB 2500', file: 'atlas-copco-hb-2500-ust', kind: 'thrustRing' },
  { model: 'HB 3000', file: 'atlas-copco-hb-3000-kafa', kind: 'toolBushing' },
  { model: 'HB 3000', file: 'atlas-copco-hb-3000-ust', kind: 'thrustRing' },
  { model: 'MB 1000 (Krupp HM 680)', file: 'atlas-copco-mb-1000-hm-680-kafa', kind: 'toolBushing' },
  { model: 'MB 1000 (Krupp HM 680)', file: 'atlas-copco-mb-1000-hm-680-ust', kind: 'thrustRing' },
  { model: 'MB 1200', file: 'atlas-copco-mb-1200-kafa', kind: 'toolBushing' },
  { model: 'MB 1200', file: 'atlas-copco-mb-1200-ust', kind: 'thrustRing' },
  { model: 'MB 1700', file: 'atlas-copco-mb-1700-kafa', kind: 'toolBushing' },
  { model: 'MB 1700', file: 'atlas-copco-mb-1700-ust', kind: 'thrustRing' },
];
const SOOSAN_BURC: Bushing[] = [
  { model: 'SB10 TS-P', file: 'soosan-sb-10-ts-p-kafa', kind: 'toolBushing' },
  { model: 'SB10 TS-P', file: 'soosan-sb-10-ts-p-ust', kind: 'thrustUpperBushing' },
  { model: 'SB20 TS-P', file: 'soosan-sb-20-ts-p-kafa', kind: 'toolBushing' },
  { model: 'SB20 TS-P', file: 'soosan-sb-20-ts-p-ust', kind: 'thrustUpperBushing' },
  { model: 'SB30 TS-P', file: 'soosan-sb-30-ts-p-kafa', kind: 'toolBushing' },
  { model: 'SB30 TS-P', file: 'soosan-sb-30-ts-p-ust', kind: 'thrustUpperBushing' },
  { model: 'SB40', file: 'soosan-sb-40-kafa', kind: 'toolBushing' },
  { model: 'SB40', file: 'soosan-sb-40-ust', kind: 'thrustRing' },
  { model: 'SB40 TS-P', file: 'soosan-sb-40-ts-p-kafa', kind: 'toolBushing' },
  { model: 'SB43 TS-P', file: 'soosan-sb-43-ts-p-kafa', kind: 'toolBushing' },
  { model: 'SB43 TS-P', file: 'soosan-sb-43-ts-p-ust', kind: 'thrustUpperBushing' },
  { model: 'SB45 TS-P', file: 'soosan-sb-45-ts-p-kafa', kind: 'toolBushing' },
  { model: 'SB45 TS-P', file: 'soosan-sb-45-ts-p-ust', kind: 'thrustUpperBushing' },
  { model: 'SB50', file: 'soosan-sb-50-kafa', kind: 'toolBushing' },
  { model: 'SB50', file: 'soosan-sb-50-ust', kind: 'upperBushing' },
  { model: 'SB50 TS-P', file: 'soosan-sb-50-ts-p-kafa', kind: 'toolBushing' },
  { model: 'SB50 TS-P', file: 'soosan-sb-50-ts-p-ust', kind: 'thrustUpperBushing' },
  { model: 'SB60', file: 'soosan-sb-60-kafa', kind: 'toolBushing' },
  { model: 'SB60', file: 'soosan-sb-60-ust', kind: 'thrustRing' },
  { model: 'SB60 TS-P', file: 'soosan-sb-60-ts-p-kafa', kind: 'toolBushing' },
  { model: 'SB60 TS-P', file: 'soosan-sb-60-ts-p-ust', kind: 'thrustUpperBushing' },
  { model: 'SB70 TS-P', file: 'soosan-sb-70-ts-p-kafa', kind: 'toolBushing' },
  { model: 'SB70 TS-P', file: 'soosan-sb-70-ts-p-ust', kind: 'thrustUpperBushing' },
  { model: 'SB80', file: 'soosan-sb-80-kafa', kind: 'toolBushing' },
  { model: 'SB80', file: 'soosan-sb-80-ust', kind: 'thrustRing' },
  { model: 'SB81 TS-P', file: 'soosan-sb-81-ts-p-kafa', kind: 'toolBushing' },
  { model: 'SB81 TS-P', file: 'soosan-sb-81-ts-p-ust', kind: 'thrustUpperBushing' },
  { model: 'SB100 TS-P', file: 'soosan-sb-100-ts-p-kafa', kind: 'toolBushing' },
  { model: 'SB100 TS-P', file: 'soosan-sb-100-ts-p-ust', kind: 'thrustUpperBushing' },
  { model: 'SB120', file: 'soosan-sb-120-kafa', kind: 'toolBushing' },
  { model: 'SB120', file: 'soosan-sb-120-ust', kind: 'thrustRing' },
  { model: 'SB121 TS-P', file: 'soosan-sb-121-ts-p-kafa', kind: 'toolBushing' },
  { model: 'SB121 TS-P', file: 'soosan-sb-121-ts-p-ust', kind: 'thrustUpperBushing' },
  { model: 'SB130 TS-P', file: 'soosan-sb-130-ts-p-kafa', kind: 'toolBushing' },
  { model: 'SB130 TS-P', file: 'soosan-sb-130-ts-p-ust', kind: 'thrustUpperBushing' },
  { model: 'SB150', file: 'soosan-sb-150-kafa', kind: 'toolBushing' },
  { model: 'SB150', file: 'soosan-sb-150-ust', kind: 'thrustRing' },
  { model: 'SB151 TS-P', file: 'soosan-sb-151ts-p-kafa', kind: 'toolBushing' },
  { model: 'SB151 TS-P', file: 'soosan-sb-151ts-p-ust', kind: 'thrustUpperBushing' },
  { model: 'ST180', file: 'soosan-st-180-tempo-ins-kafa', kind: 'toolBushing' },
  { model: 'ST180', file: 'soosan-st-180-tempo-ins-ust', kind: 'thrustRing' },
];
const MONTABERT_BURC: Bushing[] = [
  { model: 'BRH 125', file: 'montabert-brh-125-kafa', kind: 'toolBushing' },
  { model: 'BRH 250', file: 'montabert-brh-250-kafa', kind: 'toolBushing' },
  { model: 'BRH 250', file: 'montabert-brh-250-ust', kind: 'thrustRing' },
  { model: 'BRH 270', file: 'montabert-brh-270-kafa', kind: 'toolBushing' },
  { model: 'BRH 501', file: 'montabert-brh-501-kafa', kind: 'toolBushing' },
  { model: 'BRH 501', file: 'montabert-brh-501-ust', kind: 'thrustRing' },
  { model: 'BRH 570', file: 'montabert-brh-570-kafa', kind: 'toolBushing' },
  { model: 'BRH 570', file: 'montabert-brh-570-ust', kind: 'upperBushing' },
  { model: 'BRH 620', file: 'montabert-brh-620-kafa', kind: 'toolBushing' },
  { model: 'BRH 620', file: 'montabert-brh-620-ust', kind: 'thrustRing' },
  { model: 'BRH 625', file: 'montabert-brh-625-kafa', kind: 'toolBushing' },
  { model: 'BRH 625', file: 'montabert-brh-625-ust', kind: 'thrustUpperBushing' },
  { model: 'BRH 750', file: 'montabert-brh-750-kafa', kind: 'toolBushing' },
  { model: 'BRH 750', file: 'montabert-brh-750-ust', kind: 'thrustRing' },
  { model: 'BRH 1000', file: 'montabert-brh-1000-ust', kind: 'upperBushing' },
  { model: 'BRH 1100', file: 'montabert-brh-1100-kafa', kind: 'toolBushing' },
  { model: 'BRH 1100', file: 'montabert-brh-1100-ust', kind: 'thrustUpperBushing' },
  { model: 'BRM 900', file: 'montabert-brm-900-kafa', kind: 'toolBushing' },
  { model: 'BRM 900', file: 'montabert-brm-900-ust', kind: 'thrustUpperBushing' },
  { model: 'BRM 1200 V', file: 'montabert-brm-1200-v-kafa', kind: 'toolBushing' },
  { model: 'BRM 1200 V', file: 'montabert-brm-1200-v-ust', kind: 'thrustRing' },
  { model: 'BRM 1600 V', file: 'montabert-brm-1600-v-kafa', kind: 'toolBushing' },
  { model: 'BRM 1600 V', file: 'montabert-brm-1600-v-ust', kind: 'thrustRing' },
  { model: 'BRP 50', file: 'montabert-brp-50-kafa', kind: 'toolBushing' },
  { model: 'BRP 50', file: 'montabert-brp-50-ust', kind: 'thrustUpperBushing' },
  { model: 'BRP 95', file: 'montabert-brp-95-kafa', kind: 'toolBushing' },
  { model: 'BRP 95', file: 'montabert-brp-95-ust', kind: 'thrustUpperBushing' },
  { model: 'BRP 130', file: 'montabert-brp-130-kafa', kind: 'toolBushing' },
  { model: 'BRP 140', file: 'montabert-brp-140-kafa', kind: 'toolBushing' },
  { model: 'BRP 140', file: 'montabert-brp-140-ust', kind: 'thrustUpperBushing' },
  { model: 'BRP 150', file: 'montabert-brp-150-kafa', kind: 'toolBushing' },
  { model: 'BRP 150', file: 'montabert-brp-150-ust', kind: 'thrustUpperBushing' },
  { model: 'BRV 32', file: 'montabert-brv-32-kafa', kind: 'toolBushing' },
  { model: 'BRV 32', file: 'montabert-brv-32-ust', kind: 'thrustRing' },
  { model: 'BRV 43', file: 'montabert-brv-43-kafa', kind: 'toolBushing' },
  { model: 'BRV 43', file: 'montabert-brv-43-ust', kind: 'thrustRing' },
  { model: 'BRV 45 V', file: 'montabert-brv-45v-kafa', kind: 'toolBushing' },
  { model: 'BRV 45 V', file: 'montabert-brv-45v-ust', kind: 'thrustRing' },
  {
    model: 'BRV 45 V',
    file: 'montabert-brv-45v-y-yeni-tip-kafa',
    kind: 'toolBushing',
    variant: 'newType',
  },
  {
    model: 'BRV 45 V',
    file: 'montabert-brv-45v-y-yeni-tip-ust',
    kind: 'thrustRing',
    variant: 'newType',
  },
  { model: 'BRV 65 V', file: 'montabert-brv-65v-kafa', kind: 'toolBushing' },
  { model: 'BRV 65 V', file: 'montabert-brv-65v-ust', kind: 'thrustRing' },
  { model: 'M 600', file: 'montabert-m-600-kafa', kind: 'toolBushing' },
  { model: 'M 600', file: 'montabert-m-600-ust', kind: 'thrustUpperBushing' },
  { model: 'M 700', file: 'montabert-m-700-kafa', kind: 'toolBushing' },
  { model: 'M 700', file: 'montabert-m-700-ust', kind: 'thrustUpperBushing' },
  { model: 'SX 125', file: 'montabert-sx-125-kafa', kind: 'toolBushing' },
];
const FURUKAWA_BURC: Bushing[] = [
  { model: 'F5', file: 'furukawa-f-5-kafa', kind: 'toolBushing' },
  { model: 'F6', file: 'furukawa-f-6-kafa', kind: 'toolBushing' },
  { model: 'F6', file: 'furukawa-f-6-ust', kind: 'thrustUpperBushing' },
  { model: 'F12', file: 'furukawa-f-12-ust', kind: 'thrustRing' },
  { model: 'F19', file: 'furukawa-f-19-kafa', kind: 'toolBushing' },
  { model: 'F19', file: 'furukawa-f-19-ust', kind: 'thrustRing' },
  { model: 'F22', file: 'furukawa-f-22-kafa', kind: 'toolBushing' },
  { model: 'F22', file: 'furukawa-f-22-ust', kind: 'thrustRing' },
  { model: 'F27', file: 'furukawa-f-27-kafa', kind: 'toolBushing' },
  { model: 'F27', file: 'furukawa-f-27-ust', kind: 'thrustRing' },
  { model: 'F35', file: 'furukawa-f-35-kafa', kind: 'toolBushing' },
  { model: 'F35', file: 'furukawa-f-35-ust', kind: 'thrustRing' },
  { model: 'F45', file: 'furukawa-f-45-ust', kind: 'thrustRing' },
  { model: 'F100', file: 'furukawa-f-100-kafa', kind: 'toolBushing' },
  { model: 'F100', file: 'furukawa-f-100-ust', kind: 'thrustRing' },
  { model: 'HB2G', file: 'furukawa-hb-2-g-kafa', kind: 'toolBushing' },
  { model: 'HB5G', file: 'furukawa-hb-5-g-kafa', kind: 'toolBushing' },
  { model: 'HB8G', file: 'furukawa-hb-8-g-kafa', kind: 'toolBushing' },
  { model: 'HB10G', file: 'furukawa-hb-10-g-ust', kind: 'thrustRing' },
  { model: 'HB15G', file: 'furukawa-hb-15-g-kafa', kind: 'toolBushing' },
  { model: 'HB15G', file: 'furukawa-hb-15-g-ust', kind: 'thrustRing' },
  { model: 'HB20G', file: 'furukawa-hb-20-g-kafa', kind: 'toolBushing' },
  { model: 'HB20G', file: 'furukawa-hb-20-g-ust', kind: 'thrustRing' },
  { model: 'HB30G', file: 'furukawa-hb-30-g-kafa', kind: 'toolBushing' },
  { model: 'HB30G', file: 'furukawa-hb-30-g-ust', kind: 'thrustRing' },
  { model: 'HB40G', file: 'furukawa-hb-40-g-kafa', kind: 'toolBushing' },
  { model: 'HB40G', file: 'furukawa-hb-40-g-ust', kind: 'thrustRing' },
  { model: 'HB50G', file: 'furukawa-hb-50-g-kafa', kind: 'toolBushing' },
  { model: 'HB1000', file: 'furukawa-hb-1000-kafa', kind: 'toolBushing' },
  { model: 'HB1000', file: 'furukawa-hb-1000-ust', kind: 'thrustRing' },
  { model: 'HB1200', file: 'furukawa-hb-1200-kafa', kind: 'toolBushing' },
  { model: 'HB1200', file: 'furukawa-hb-1200-ust', kind: 'thrustRing' },
  { model: 'HB2000', file: 'furukawa-hb-2000-kafa', kind: 'toolBushing' },
  { model: 'HB2000', file: 'furukawa-hb-2000-ust', kind: 'thrustRing' },
];
const TAMROCK_BURC: Bushing[] = [
  { model: 'HL 510', file: 'tamrock-hl-510-ust', kind: 'rockDrillThrustRing' },
  { model: 'HL 538', file: 'tamrock-hl-538-ust', kind: 'rockDrillThrustRing' },
];
const bushingRender =
  (make: string) =>
  ({ model, file, kind, variant }: Bushing): PartRender => {
    const b = `/photos/parca/burc-${file}`;
    return {
      model: `${make} ${model}`,
      series: make,
      kind,
      variant,
      hero: `${b}-vitrin-01`,
      views: [
        { base: `${b}-on-01`, view: 'front' },
        { base: `${b}-arka-01`, view: 'rear' },
        { base: `${b}-yan-01`, view: 'side' },
        { base: `${b}-kesit-01`, view: 'section' },
      ],
    };
  };

/**
 * The same 20 breaker models for kama, saplama and piston, modelled from our drawings (one sheet each:
 * the tool pin / key, the through bolt "boy saplama", the impact piston). `file` names the pictures:
 * `/photos/parca/<part>-<file>-<view>-01`.
 */
const PART_KIT: { make: string; model: string; file: string }[] = [
  { make: 'Rammer', model: 'E64', file: 'rammer-e64' },
  { make: 'Rammer', model: 'E66', file: 'rammer-e66' },
  { make: 'Rammer', model: 'G80', file: 'rammer-g80' },
  { make: 'Rammer', model: 'S25', file: 'rammer-s25' },
  { make: 'Rammer', model: 'S84', file: 'rammer-s84' },
  { make: 'MTB', model: '85', file: 'mtb-85' },
  { make: 'MTB', model: '150', file: 'mtb-150' },
  { make: 'MTB', model: '210', file: 'mtb-210' },
  { make: 'Krupp', model: 'HM 560', file: 'krupp-hm-560' },
  { make: 'Krupp', model: 'HM 720', file: 'krupp-hm-720' },
  { make: 'Krupp', model: 'HM 960', file: 'krupp-hm-960' },
  { make: 'Krupp', model: 'HM 1500', file: 'krupp-hm-1500' },
  { make: 'Soosan', model: 'SB81 TS-P', file: 'soosan-sb81-ts-p' },
  { make: 'Soosan', model: 'SB121 TS-P', file: 'soosan-sb121-ts-p' },
  { make: 'Montabert', model: 'BRH 501', file: 'montabert-brh-501' },
  { make: 'Montabert', model: 'BRV 32', file: 'montabert-brv-32' },
  { make: 'Furukawa', model: 'F22', file: 'furukawa-f22' },
  { make: 'Furukawa', model: 'HB20G', file: 'furukawa-hb20g' },
  { make: 'Furukawa', model: 'HB30G', file: 'furukawa-hb30g' },
  { make: 'NPK', model: 'H-7X', file: 'npk-h-7x' },
];
const VIEW_FILE: Record<RenderView, string> = {
  front: 'on',
  rear: 'arka',
  side: 'yan',
  section: 'kesit',
  detail: 'pencere',
  assembly: 'montaj-kesit',
};
const kitRender =
  (part: string, kind: NonNullable<PartRender['kind']>, views: RenderView[]) =>
  ({ make, model, file }: (typeof PART_KIT)[number]): PartRender => {
    const b = `/photos/parca/${part}-${file}`;
    return {
      model: make === 'MTB' ? `MTB ${model}` : `${make} ${model}`,
      series: make,
      kind,
      hero: `${b}-vitrin-01`,
      views: views.map((view) => ({ base: `${b}-${VIEW_FILE[view]}-01`, view })),
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
    ...RAMMER_BURC.map(bushingRender('Rammer')),
    ...MTB_BURC.map(bushingRender('MTB')),
    ...KRUPP_BURC.map(bushingRender('Krupp')),
    ...ATLAS_COPCO_BURC.map(bushingRender('Atlas Copco')),
    ...SOOSAN_BURC.map(bushingRender('Soosan')),
    ...MONTABERT_BURC.map(bushingRender('Montabert')),
    ...FURUKAWA_BURC.map(bushingRender('Furukawa')),
    ...TAMROCK_BURC.map(bushingRender('Tamrock')),
  ],
  kama: PART_KIT.map(kitRender('kama', 'retainerKey', ['front', 'rear', 'side'])),
  saplama: PART_KIT.map(kitRender('saplama', 'tieRod', ['side', 'front'])),
  piston: PART_KIT.map(kitRender('piston', 'piston', ['front', 'rear', 'side', 'section'])),
};
