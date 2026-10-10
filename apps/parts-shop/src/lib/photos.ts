import { REPAIR_KITS, type RepairKit } from './repair-kits';
import { ROD_SETS, SMALL_PARTS, WEAR_SETS, type SmallPart } from './small-parts';
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
  akumulator: [],
  'asinma-plakasi': [],
  'tamir-takimi': [],
};

/**
 * 3D renders of parts we make, modelled from our drawings (studio light like the tip
 * renders), grouped by the breaker model they fit. Same files and naming as the photos.
 */
export type RenderView = 'front' | 'rear' | 'side' | 'detail' | 'section' | 'assembly' | 'top';
/** One line of a repair (seal) kit. */
export type KitItemType =
  | 'oring'
  | 'backup'
  | 'stepseal'
  | 'rodseal'
  | 'wiper'
  | 'gasseal'
  | 'guidering'
  | 'teflonring'
  | 'bondedseal'
  | 'plug'
  | 'valve'
  | 'other';
export interface PartRender {
  /** Breaker make and model the part fits, shown as the caption. */
  model: string;
  /** Showcase picture, 16:9 (`<base>-lg.webp` 1600 px; renders publish only `-lg` views): page lead and card. */
  hero?: string;
  /** Interactive 3D model (GLB, metres), opened on demand in PartViewer. */
  model3d?: string;
  /** Front heads: the same head with its bushings and pins fitted ("burçlu"), shown by the Burçsuz / Burçlu switch. */
  fitted?: { hero: string; views: { base: string; view: RenderView }[] };
  /** Breaker series: renders of one series share a sideways model picker (`<hero>-xs.webp` 320 px). */
  series?: string;
  /** Which bushing of the breaker (burç page): names it in the caption instead of the part name. */
  kind?:
    | 'toolBushing'
    | 'upperBushing'
    | 'thrustRing'
    | 'thrustUpperBushing'
    | 'spacerBushing'
    | 'oneBushing'
    | 'toolUpperBushing'
    | 'rockDrillThrustRing'
    | 'rockDrillHead'
    | 'retainerKey'
    | 'tieRod'
    | 'piston'
    | 'retainerPin'
    | 'sideBolt'
    | 'accumulatorUpper'
    | 'accumulatorLower'
    | 'accumulatorBolt'
    | 'wearPlate'
    | 'repairKit'
    | 'accumulatorDowel'
    | 'allRoundWearPlate'
    | 'bodyDowel'
    | 'bottomBuffer'
    | 'bottomBufferPlate'
    | 'bufferGuide'
    | 'frontWearPlate'
    | 'keyPinHolder'
    | 'keyPinPlug'
    | 'keyPinRetainer'
    | 'keyPinRubber'
    | 'keyPinWasher'
    | 'keyUpperPin'
    | 'lowerRetainerPin'
    | 'retainerLockPin'
    | 'sideBoltWasher'
    | 'sideBuffer'
    | 'sideWearPlate'
    | 'springPin'
    | 'tieRodBush'
    | 'tieRodLowerNut'
    | 'tieRodNut'
    | 'tieRodUpperNut'
    | 'tieRodWasher'
    | 'toolBushingPin'
    | 'toolBushingPinPlug'
    | 'toolBushingPinRetainer'
    | 'toolUpperPin'
    | 'topBuffer'
    | 'topBufferPlate'
    | 'topWearPlate'
    | 'upperBushingPin'
    | 'upperBushingPinPlug'
    | 'tieRodSet'
    | 'wearPlateSet';
  /** Another version of the same breaker's part, named in the caption through the dict. */
  variant?:
    | 'oldType'
    | 'newType'
    | 'roundNut'
    | 'autoGrease'
    | 'typeY'
    | 'typeE'
    | 'typeL'
    | 'typeT'
    | 'oilGroove'
    | 'greasingHole'
    | 'puCoated'
    | 'pu'
    | 'rubber'
    | 'city'
    | 'roundShape'
    | 'triLobe'
    | 'no1'
    | 'no2'
    | 'no3'
    | 'no4';
  views: { base: string; view: RenderView }[];
  /** Repair kits: the kit's contents (name, sizes, quantity), shown as a table under the pictures. */
  kit?: RepairKit['items'];
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
  { model: 'S54', slug: 's54', window: true, v: '02' },
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
  { model: 'E65', file: 'rammer-e65-dayama', kind: 'thrustRing' },
  { model: 'E66 N', file: 'rammer-e-66-kafa', kind: 'toolBushing' },
  { model: 'E66 N', file: 'rammer-e-66-ust', kind: 'thrustRing' },
  { model: 'E68', file: 'rammer-e68-kafa', kind: 'toolBushing' },
  { model: 'E68', file: 'rammer-e68-ust', kind: 'upperBushing' },
  { model: 'E68', file: 'rammer-e68-dayama', kind: 'thrustRing' },
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
  { model: 'S52', file: 'rammer-s52-dayama', kind: 'thrustRing' },
  { model: 'S54', file: 'rammer-s-54-kafa', kind: 'toolBushing' },
  { model: 'S54', file: 'rammer-s-54-ust', kind: 'thrustRing' },
  { model: 'S55', file: 'rammer-s-55-kafa', kind: 'toolBushing' },
  { model: 'S55', file: 'rammer-s-55-ust', kind: 'thrustRing' },
  { model: 'S56', file: 'rammer-s-56-kafa-v2', kind: 'toolBushing' },
  { model: 'S56', file: 'rammer-s-56-ust', kind: 'thrustRing' },
  { model: 'S56', file: 'rammer-s56-dayama-yag-kanalli', kind: 'thrustRing', variant: 'oilGroove' },
  { model: 'S82', file: 'rammer-s-82-kafa', kind: 'toolBushing' },
  { model: 'S82', file: 'rammer-s-82-ust', kind: 'thrustRing' },
  { model: 'S83', file: 'rammer-s-83-kafa', kind: 'toolBushing' },
  { model: 'S83', file: 'rammer-s-83-ust', kind: 'thrustRing' },
  { model: 'S84', file: 'rammer-s-84-kafa', kind: 'toolBushing' },
  { model: 'S84', file: 'rammer-s-84-ust', kind: 'thrustRing' },
  { model: 'S86', file: 'rammer-s-86-kafa', kind: 'toolBushing' },
  { model: 'S86', file: 'rammer-s-86-ust', kind: 'upperBushing' },
  { model: 'S86', file: 'rammer-s86-dayama', kind: 'thrustRing' },
];
const MTB_BURC: Bushing[] = [
  { model: '15', file: 'mtb-15-kafa', kind: 'toolBushing' },
  { model: '15', file: 'mtb-15-ust', kind: 'thrustUpperBushing' },
  { model: '25', file: 'mtb-25-kafa', kind: 'toolBushing' },
  { model: '30', file: 'mtb-30-kafa', kind: 'toolBushing' },
  { model: '30', file: 'mtb-30-ust', kind: 'thrustUpperBushing' },
  { model: '36', file: 'mtb-36-kafa', kind: 'toolBushing' },
  { model: '36', file: 'mtb-36-ust', kind: 'upperBushing' },
  { model: '36', file: 'mtb-36-dayama', kind: 'thrustRing' },
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
  { model: '120', file: 'mtb-120-dayama-y', kind: 'thrustRing', variant: 'typeY' },
  { model: '120', file: 'mtb-120-dayama-e', kind: 'thrustRing', variant: 'typeE' },
  { model: '125', file: 'mtb-125-kafa', kind: 'toolBushing' },
  { model: '125', file: 'mtb-125-ust', kind: 'thrustRing' },
  { model: '150', file: 'mtb-150-kafa', kind: 'toolBushing' },
  { model: '150', file: 'mtb-150-ust', kind: 'upperBushing' },
  { model: '150', file: 'mtb-150-dayama-y', kind: 'thrustRing', variant: 'typeY' },
  { model: '150', file: 'mtb-150-dayama-e', kind: 'thrustRing', variant: 'typeE' },
  {
    model: '150',
    file: 'mtb-150-dayama-yaglama-delikli',
    kind: 'thrustRing',
    variant: 'greasingHole',
  },
  { model: '170', file: 'mtb-170-kafa', kind: 'toolBushing' },
  { model: '170', file: 'mtb-170-ust', kind: 'upperBushing' },
  { model: '170', file: 'mtb-170-dayama-y', kind: 'thrustRing', variant: 'typeY' },
  { model: '170', file: 'mtb-170-dayama-e', kind: 'thrustRing', variant: 'typeE' },
  { model: '210', file: 'mtb-210-kafa', kind: 'toolBushing' },
  { model: '210', file: 'mtb-210-ust', kind: 'upperBushing' },
  { model: '210', file: 'mtb-210-dayama-y', kind: 'thrustRing', variant: 'typeY' },
  { model: '210', file: 'mtb-210-dayama-e', kind: 'thrustRing', variant: 'typeE' },
  { model: '210 II', file: 'mtb-210-ii-kafa', kind: 'toolBushing' },
  { model: '210 II', file: 'mtb-210-ii-ust', kind: 'upperBushing' },
  { model: '210 II', file: 'mtb-210-ii-dayama', kind: 'thrustRing' },
  { model: '220', file: 'mtb-220-kafa', kind: 'toolBushing' },
  { model: '220', file: 'mtb-220-ust', kind: 'thrustRing' },
  { model: '250', file: 'mtb-250-kafa', kind: 'toolBushing' },
  { model: '250', file: 'mtb-250-ust', kind: 'upperBushing' },
  { model: '250', file: 'mtb-250-dayama', kind: 'thrustRing' },
  { model: '270', file: 'mtb-270-kafa', kind: 'toolBushing' },
  { model: '270', file: 'mtb-270-dayama', kind: 'thrustRing' },
  { model: '275', file: 'mtb-275-kafa-v2', kind: 'toolBushing' },
  { model: '275', file: 'mtb-275-ust', kind: 'upperBushing' },
  { model: '275', file: 'mtb-275-1-kafa', kind: 'toolBushing', variant: 'autoGrease' },
  { model: '275', file: 'mtb-275-dayama-y', kind: 'thrustRing', variant: 'typeY' },
  { model: '275', file: 'mtb-275-dayama-e', kind: 'thrustRing', variant: 'typeE' },
  { model: '275 II', file: 'mtb-275-ii-kafa', kind: 'toolBushing' },
  { model: '275 II', file: 'mtb-275-ii-ust', kind: 'upperBushing' },
  { model: '275 II', file: 'mtb-275-ii-dayama', kind: 'thrustRing' },
  { model: '360', file: 'mtb-360-kafa', kind: 'toolBushing' },
  { model: '360', file: 'mtb-360-ust', kind: 'upperBushing' },
  { model: '360', file: 'mtb-360-dayama-y', kind: 'thrustRing', variant: 'typeY' },
  { model: '360', file: 'mtb-360-dayama-e', kind: 'thrustRing', variant: 'typeE' },
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
  { model: 'HM 710 / 711 / 712', file: 'krupp-hm-710-dayama', kind: 'thrustRing' },
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
  { model: 'HM 1500 Marathon', file: 'krupp-hm-1500-marathon-dayama', kind: 'thrustRing' },
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
  { model: 'HM 2100 Marathon', file: 'krupp-hm-2100-marathon-dayama', kind: 'thrustRing' },
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
  { model: 'HBC 4000', file: 'atlas-copco-hbc-4000-s-kafa', kind: 'toolBushing' },
  { model: 'HBC 4000', file: 'atlas-copco-hbc-4000-s-ust', kind: 'thrustRing' },
  { model: 'SBC 610', file: 'atlas-copco-sbc-610-sbc-610-s-kafa', kind: 'oneBushing' },
  { model: 'SBC 610', file: 'atlas-copco-sbc-610-sbc-610-s-ust', kind: 'thrustRing' },
  { model: 'TEX 250', file: 'atlas-copco-tex-250-kafa', kind: 'toolBushing' },
  { model: 'TEX 700 / 900', file: 'atlas-copco-tex-900-700-kafa', kind: 'toolUpperBushing' },
  { model: 'TEX 700 / 900', file: 'atlas-copco-tex-900-700-ust', kind: 'thrustRing' },
  { model: 'TEX 1400', file: 'atlas-copco-tex-1400-kafa', kind: 'toolBushing' },
  { model: 'TEX 1400', file: 'atlas-copco-tex-1400-ust', kind: 'thrustRing' },
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
  { model: 'SB50', file: 'soosan-sb50-dayama', kind: 'thrustRing' },
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
  { model: 'BRH 250', file: 'montabert-brh-250-dayama', kind: 'thrustRing' },
  { model: 'BRH 270', file: 'montabert-brh-270-kafa', kind: 'toolBushing' },
  { model: 'BRH 501', file: 'montabert-brh-501-kafa', kind: 'toolBushing' },
  { model: 'BRH 501', file: 'montabert-brh-501-ust', kind: 'thrustRing' },
  { model: 'BRH 501', file: 'montabert-brh-501-dayama-t', kind: 'thrustRing', variant: 'typeT' },
  { model: 'BRH 570', file: 'montabert-brh-570-kafa', kind: 'toolBushing' },
  { model: 'BRH 570', file: 'montabert-brh-570-ust', kind: 'upperBushing' },
  { model: 'BRH 570', file: 'montabert-brh-570-dayama-l', kind: 'thrustRing', variant: 'typeL' },
  { model: 'BRH 570', file: 'montabert-brh-570-dayama-t', kind: 'thrustRing', variant: 'typeT' },
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
  { model: 'HB30G', file: 'furukawa-hb-30-g-dayama-eski', kind: 'thrustRing', variant: 'oldType' },
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
const NPK_BURC: Bushing[] = [
  { model: 'E-210', file: 'npk-e-210-kafa', kind: 'toolBushing' },
  { model: 'E-210', file: 'npk-e-210-ust', kind: 'thrustUpperBushing' },
  { model: 'E-213A', file: 'npk-e-213a-kafa', kind: 'toolBushing' },
  { model: 'E-213A', file: 'npk-e-213a-ust', kind: 'thrustUpperBushing' },
  { model: 'E-216', file: 'npk-e-216-kafa', kind: 'toolBushing' },
  { model: 'E-216', file: 'npk-e-216-ust', kind: 'thrustUpperBushing' },
  { model: 'E-220', file: 'npk-e-220-kafa', kind: 'toolBushing' },
  { model: 'E-220', file: 'npk-e-220-ust', kind: 'thrustUpperBushing' },
  { model: 'GH-15', file: 'npk-gh-15-kafa', kind: 'toolBushing' },
  { model: 'GH-15', file: 'npk-gh-15-ust', kind: 'thrustUpperBushing' },
  { model: 'H-2XA', file: 'npk-h-2-x-a-kafa', kind: 'toolBushing' },
  { model: 'H-2XA', file: 'npk-h-2-x-a-ust', kind: 'thrustRing' },
  { model: 'H-3XA', file: 'npk-h-3-x-a-kafa', kind: 'toolBushing' },
  { model: 'H-3XA', file: 'npk-h-3-x-a-ust', kind: 'thrustRing' },
  { model: 'H-7X', file: 'npk-h-7-x-kafa', kind: 'toolBushing' },
  { model: 'H-7X', file: 'npk-h-7-x-ust', kind: 'thrustRing' },
  { model: 'H-08X', file: 'npk-h-08-x-kafa', kind: 'toolBushing' },
  { model: 'H-08X', file: 'npk-h-08-x-ust', kind: 'thrustRing' },
  { model: 'H-8XA', file: 'npk-h-8-x-a-kafa', kind: 'toolBushing' },
  { model: 'H-8XA', file: 'npk-h-8-x-a-ust', kind: 'thrustRing' },
  { model: 'H-10XB', file: 'npk-h-10-x-b-kafa', kind: 'toolBushing' },
  { model: 'H-10XB', file: 'npk-h-10-x-b-ust', kind: 'upperBushing' },
  { model: 'H-10XB', file: 'npk-h-10xb-dayama', kind: 'thrustRing' },
  { model: 'H-12X', file: 'npk-h-12-x-kafa', kind: 'toolBushing' },
  { model: 'H-12X', file: 'npk-h-12-x-ust', kind: 'thrustRing' },
  { model: 'H-14X', file: 'npk-h-14-x-kafa', kind: 'toolBushing' },
  { model: 'H-16X', file: 'npk-h-16-x-kafa', kind: 'toolBushing' },
  { model: 'H-16X', file: 'npk-h-16-x-ust', kind: 'thrustRing' },
  { model: 'H-20XE', file: 'npk-h-20-x-e-kafa', kind: 'toolBushing' },
  { model: 'H-20XE', file: 'npk-h-20-x-e-ust', kind: 'thrustRing' },
];
const INDECO_BURC: Bushing[] = [
  { model: 'HB 8', file: 'indeco-hb-8-kafa', kind: 'toolBushing' },
  { model: 'HB 8', file: 'indeco-hb-8-ust', kind: 'thrustUpperBushing' },
  { model: 'HB 19', file: 'indeco-hb-19-kafa', kind: 'toolBushing' },
  { model: 'HB 19', file: 'indeco-hb-19-ust', kind: 'thrustUpperBushing' },
  { model: 'HB 27', file: 'indeco-hb-27-kafa', kind: 'toolBushing' },
  { model: 'HB 27', file: 'indeco-hb-27-ust', kind: 'thrustRing' },
  { model: 'MES 181', file: 'indeco-mes-180-kafa', kind: 'toolBushing' },
  { model: 'MES 553', file: 'indeco-mes-553-kafa', kind: 'toolBushing' },
  { model: 'MES 621', file: 'indeco-mes-621-kafa', kind: 'toolBushing' },
  { model: 'MES 621', file: 'indeco-mes-621-ust', kind: 'thrustUpperBushing' },
  { model: 'MES 1200', file: 'indeco-mes-1200-kafa', kind: 'toolBushing' },
  { model: 'MES 1200', file: 'indeco-mes-1200-ust', kind: 'upperBushing' },
  { model: 'MES 1750', file: 'indeco-mes-1750-1800-kafa', kind: 'toolBushing' },
  { model: 'MES 1750', file: 'indeco-mes-1750-1800-ust', kind: 'thrustRing' },
  { model: 'MES 2000', file: 'indeco-mes-2000-kafa', kind: 'toolBushing' },
  { model: 'MES 2000', file: 'indeco-mes-2000-ust', kind: 'thrustRing' },
  { model: 'MES 2500', file: 'indeco-mes-2500-kafa', kind: 'toolBushing' },
  { model: 'MES 2500', file: 'indeco-mes-2500-ust', kind: 'thrustRing' },
  { model: 'MES 3000', file: 'indeco-mes-3000-kafa', kind: 'toolBushing' },
  { model: 'MES 3000', file: 'indeco-mes-3000-ust', kind: 'thrustRing' },
  { model: 'MES 3500', file: 'indeco-mes-3500-kafa', kind: 'toolBushing' },
  { model: 'MES 3500', file: 'indeco-mes-3500-ust', kind: 'thrustRing' },
  {
    model: 'MES 3500',
    file: 'indeco-mes-3500-dayama-eski',
    kind: 'thrustRing',
    variant: 'oldType',
  },
  { model: 'MES 4000', file: 'indeco-mes-4000-kafa', kind: 'toolBushing' },
  { model: 'MES 4000', file: 'indeco-mes-4000-ust', kind: 'thrustRing' },
  {
    model: 'MES 4000',
    file: 'indeco-mes-4000-dayama-eski',
    kind: 'thrustRing',
    variant: 'oldType',
  },
  { model: 'MES 7000', file: 'indeco-mes-7000-kafa', kind: 'toolBushing' },
  { model: 'MES 7000', file: 'indeco-mes-7000-ust', kind: 'spacerBushing' },
  { model: 'MES 7000', file: 'indeco-mes-7000-dayama', kind: 'thrustRing' },
];
const DAEMO_BURC: Bushing[] = [
  { model: 'DMB 230V', file: 'daemo-s-2300-v-kafa', kind: 'toolBushing' },
  { model: 'S500', file: 'daemo-s-500-kafa', kind: 'toolBushing' },
  { model: 'S500', file: 'daemo-s-500-ust', kind: 'thrustUpperBushing' },
  { model: 'S700', file: 'daemo-s-700-kafa', kind: 'toolBushing' },
  { model: 'S700', file: 'daemo-s-700-ust', kind: 'thrustUpperBushing' },
  { model: 'S1800', file: 'daemo-s-1800-kafa', kind: 'toolBushing' },
  { model: 'S1800', file: 'daemo-s-1800-ust', kind: 'thrustUpperBushing' },
  { model: 'S2000', file: 'daemo-s-2000-kafa', kind: 'toolBushing' },
  { model: 'S2000', file: 'daemo-s-2000-ust', kind: 'thrustUpperBushing' },
  { model: 'S2200', file: 'daemo-s-2200-kafa', kind: 'toolBushing' },
  { model: 'S2200', file: 'daemo-s-2200-ust', kind: 'thrustUpperBushing' },
  { model: 'S2200 II', file: 'daemo-s-2200-ii-kafa', kind: 'toolBushing' },
  { model: 'S2200 II', file: 'daemo-s-2200-ii-ust', kind: 'thrustUpperBushing' },
];
const HANWOO_BURC: Bushing[] = [
  { model: 'RHB 305V', file: 'hanwoo-rhb-305v-kafa', kind: 'toolBushing' },
  { model: 'RHB 305V', file: 'hanwoo-rhb-305v-ust', kind: 'thrustUpperBushing' },
  { model: 'RHB 313', file: 'hanwoo-rhb-313-kafa', kind: 'toolBushing' },
  { model: 'RHB 313', file: 'hanwoo-rhb-313-ust', kind: 'thrustRing' },
  { model: 'RHB 320', file: 'hanwoo-rhb-320-kafa', kind: 'toolBushing' },
  { model: 'RHB 320', file: 'hanwoo-rhb-320-ust', kind: 'thrustRing' },
  { model: 'RHB 320', file: 'hanwoo-rhb-320-merkezleme', kind: 'upperBushing' },
  { model: 'RHB 322', file: 'hanwoo-rhb-322-kafa', kind: 'toolBushing' },
  { model: 'RHB 322', file: 'hanwoo-rhb-322-ust', kind: 'upperBushing' },
  { model: 'RHB 322-2', file: 'hanwoo-rhb-322-2-kafa', kind: 'toolBushing' },
  { model: 'RHB 325', file: 'hanwoo-rhb-325-kafa', kind: 'toolBushing' },
  { model: 'RHB 325', file: 'hanwoo-rhb-325-ust', kind: 'thrustRing' },
  { model: 'RHB 325', file: 'hanwoo-rhb-325-merkezleme', kind: 'upperBushing' },
  { model: 'RHB 330', file: 'hanwoo-rhb-330-kafa', kind: 'toolBushing' },
  { model: 'RHB 330', file: 'hanwoo-rhb-330-ust', kind: 'thrustRing' },
  { model: 'RHB 332', file: 'hanwoo-rhb-332-kafa', kind: 'toolBushing' },
  { model: 'RHB 332', file: 'hanwoo-rhb-332-ust', kind: 'thrustUpperBushing' },
  { model: 'RHB 340', file: 'hanwoo-rhb-340-kafa', kind: 'toolBushing' },
  { model: 'RHB 340', file: 'hanwoo-rhb-340-ust', kind: 'thrustRing' },
];
const DNB_BURC: Bushing[] = [
  { model: 'D60', file: 'dnb-d-60-kafa', kind: 'toolBushing' },
  { model: 'D60', file: 'dnb-d-60-ust', kind: 'thrustRing' },
  { model: 'D70 / D90', file: 'dnb-d-70-dnb-90-kafa', kind: 'toolBushing' },
  { model: 'D70 / D90', file: 'dnb-d-70-dnb-90-ust', kind: 'thrustRing' },
  { model: 'D70 IIS', file: 'dnb-d-70-iis-kafa', kind: 'toolBushing' },
  { model: 'D110', file: 'dnb-d110-kafa', kind: 'toolBushing' },
  { model: 'D110', file: 'dnb-d110-ust', kind: 'upperBushing' },
  { model: 'D110 IIS', file: 'dnb-d110-iis-kafa', kind: 'toolBushing' },
  { model: 'D110 IIS', file: 'dnb-d110-iis-ust', kind: 'thrustRing' },
  { model: 'D130 IIS', file: 'dnb-d130-iis-kafa', kind: 'toolBushing' },
  { model: 'D130 IIS', file: 'dnb-d130-iis-ust', kind: 'thrustRing' },
  { model: 'D160 IIS', file: 'dnb-d160-iis-kafa', kind: 'toolBushing' },
  { model: 'D160 IIS', file: 'dnb-d160-iis-ust', kind: 'thrustRing' },
];
const CAT_BURC: Bushing[] = [
  { model: '115', file: 'cat-115-kafa', kind: 'toolBushing' },
  { model: '115', file: 'cat-115-ust', kind: 'thrustRing' },
  { model: '120', file: 'cat-120-ust', kind: 'thrustRing' },
  { model: '130', file: 'cat-130-kafa', kind: 'toolBushing' },
  { model: '130', file: 'cat-130-ust', kind: 'thrustRing' },
  { model: '140', file: 'cat-140-kafa', kind: 'toolBushing' },
  { model: '140', file: 'cat-140-ust', kind: 'thrustRing' },
  { model: '160', file: 'cat-160-kafa', kind: 'toolBushing' },
  { model: '160', file: 'cat-160-ust', kind: 'thrustRing' },
  { model: '160 II DS', file: 'cat-160-ii-ds-ust', kind: 'upperBushing' },
];
const MSB_BURC: Bushing[] = [
  { model: '200', file: 'msb-200-kafa', kind: 'toolBushing' },
  { model: '200', file: 'msb-200-ust', kind: 'upperBushing' },
  { model: '200', file: 'msb-200-dayama', kind: 'thrustRing' },
  { model: '250', file: 'msb-250-kafa', kind: 'toolBushing' },
  { model: '250', file: 'msb-250-ust', kind: 'thrustRing' },
  { model: '300', file: 'msb-300-kafa', kind: 'toolBushing' },
  { model: '300', file: 'msb-300-ust', kind: 'upperBushing' },
  { model: '300', file: 'msb-300-dayama', kind: 'thrustRing' },
  { model: '400', file: 'msb-400-kafa', kind: 'toolBushing' },
  { model: '400', file: 'msb-400-ust', kind: 'upperBushing' },
  { model: '400', file: 'msb-400-dayama', kind: 'thrustRing' },
  { model: '450', file: 'msb-450-kafa', kind: 'toolBushing' },
  { model: '450', file: 'msb-450-ust', kind: 'upperBushing' },
  { model: '500', file: 'msb-500-kafa', kind: 'toolBushing' },
  { model: '500', file: 'msb-500-ust', kind: 'thrustRing' },
  { model: '550', file: 'msb-550-ust', kind: 'thrustRing' },
  { model: '600', file: 'msb-600-kafa', kind: 'toolBushing' },
  { model: '600', file: 'msb-600-ust', kind: 'thrustRing' },
  { model: '700', file: 'msb-700-kafa', kind: 'toolBushing' },
  { model: '700', file: 'msb-700-ust', kind: 'thrustRing' },
  { model: '750', file: 'msb-750-kafa', kind: 'toolBushing' },
  { model: '750', file: 'msb-750-ust', kind: 'thrustRing' },
  { model: '800', file: 'msb-800-kafa', kind: 'toolBushing' },
  { model: '900', file: 'msb-900-ust', kind: 'thrustRing' },
  { model: 'MS 810', file: 'msb-810-kafa', kind: 'toolBushing' },
  { model: 'MS 810', file: 'msb-810-ust', kind: 'thrustRing' },
  { model: 'SAGA 1000', file: 'msb-saga-1000-mtb-10-ar-kafa', kind: 'toolBushing' },
  { model: 'SAGA 6000', file: 'msb-saga-6000-kafa', kind: 'toolBushing' },
  { model: 'SAGA 6000', file: 'msb-saga-6000-ust', kind: 'thrustUpperBushing' },
];
const TOKU_BURC: Bushing[] = [
  { model: 'TNB-1E', file: 'toku-tnb-1e-kafa', kind: 'toolBushing' },
  { model: 'TNB-1E', file: 'toku-tnb-1e-ust', kind: 'thrustUpperBushing' },
  { model: 'TNB-3E', file: 'toku-tnb-3e-kafa', kind: 'toolBushing' },
  { model: 'TNB-6E', file: 'toku-tnb-6e-czk-39-kafa', kind: 'toolBushing' },
  { model: 'TNB-6E', file: 'toku-tnb-6e-czk-39-ust', kind: 'thrustUpperBushing' },
  { model: 'TNB-7E', file: 'toku-tnb-7e-czk-90-kafa', kind: 'toolBushing' },
  { model: 'TNB-7E', file: 'toku-tnb-7e-czk-90-ust', kind: 'thrustUpperBushing' },
  { model: 'TNB-14E', file: 'toku-tnb-14e-czk-155-kafa', kind: 'toolBushing' },
  { model: 'TNB-14E', file: 'toku-tnb-14e-czk-155-ust', kind: 'thrustUpperBushing' },
  { model: 'TNB-16E', file: 'toku-tnb-16e-czk-170-kafa', kind: 'toolBushing' },
  { model: 'TNB-16E', file: 'toku-tnb-16e-czk-170-ust', kind: 'thrustUpperBushing' },
  { model: 'TNB-22E', file: 'toku-tnb-22e-czk-240-kafa', kind: 'toolBushing' },
  { model: 'TNB-22E', file: 'toku-tnb-22e-czk-240-ust', kind: 'thrustUpperBushing' },
  { model: 'TNB-150', file: 'toku-tnb-150-ust', kind: 'thrustUpperBushing' },
];
const KWANGLIM_BURC: Bushing[] = [
  { model: 'SG-800S', file: 'kwanglim-sg-800s-kafa', kind: 'toolBushing' },
  { model: 'SG-800S', file: 'kwanglim-sg-800s-ust', kind: 'upperBushing' },
  { model: 'SG-2100', file: 'kwanglim-sg-2100-kafa', kind: 'toolBushing' },
  { model: 'SG-2100', file: 'kwanglim-sg-2100-ust', kind: 'thrustUpperBushing' },
  { model: 'SG-2800', file: 'kwanglim-sg-2800-kafa', kind: 'toolBushing' },
  { model: 'SG-2800', file: 'kwanglim-sg-2800-ust', kind: 'thrustUpperBushing' },
];
const D_A_BURC: Bushing[] = [
  { model: '130V', file: 'da-d-a-130v-kafa', kind: 'toolBushing' },
  { model: '130V', file: 'da-d-a-130v-ust', kind: 'thrustUpperBushing' },
  { model: '200V', file: 'da-d-a-200v-kafa', kind: 'toolBushing' },
  { model: '200V', file: 'da-d-a-200v-ust', kind: 'thrustUpperBushing' },
  { model: '300V', file: 'da-d-a-300v-kafa', kind: 'toolBushing' },
  { model: '300V', file: 'da-d-a-300v-ust', kind: 'upperBushing' },
  { model: '1300', file: 'da-d-a-1300-kafa', kind: 'toolBushing' },
  { model: '1300', file: 'da-d-a-1300-ust', kind: 'thrustUpperBushing' },
  { model: '1800', file: 'da-d-a-1800-kafa', kind: 'toolBushing' },
  { model: '1800', file: 'da-d-a-1800-ust', kind: 'thrustUpperBushing' },
  { model: '2200', file: 'da-d-a-2200-kafa', kind: 'toolBushing' },
  { model: '2200', file: 'da-d-a-2200-dayama', kind: 'thrustUpperBushing' },
  { model: '3000', file: 'da-d-a-3000-kafa', kind: 'toolBushing' },
  { model: '3600', file: 'da-d-a-3600-kafa', kind: 'toolBushing' },
];
const TOPA_BURC: Bushing[] = [
  { model: '300', file: 'topa-300-kafa', kind: 'toolBushing' },
  { model: '900', file: 'topa-900-kafa', kind: 'toolBushing' },
  { model: '900', file: 'topa-900-ust', kind: 'thrustUpperBushing' },
  { model: '900N', file: 'topa-900n-kapali-sase-kafa', kind: 'toolBushing' },
  { model: '900N', file: 'topa-900n-kapali-sase-ust', kind: 'thrustUpperBushing' },
  { model: '1400', file: 'topa-1400-kafa', kind: 'toolBushing' },
  { model: '1400', file: 'topa-1400-ust', kind: 'thrustUpperBushing' },
];
const MEGA_BURC: Bushing[] = [
  { model: '50', file: 'mega-50-kafa', kind: 'toolBushing' },
  { model: '130', file: 'mega-130-kafa', kind: 'toolBushing' },
  { model: '130', file: 'mega-130-ust', kind: 'thrustUpperBushing' },
  { model: '170', file: 'mega-170-kafa', kind: 'toolBushing' },
  { model: '220', file: 'mega-220-kafa', kind: 'toolBushing' },
  { model: '280', file: 'mega-280-kafa', kind: 'toolBushing' },
  { model: '280', file: 'mega-280-ust', kind: 'thrustUpperBushing' },
];
const OKADA_BURC: Bushing[] = [
  { model: 'OKB 304B', file: 'okada-304-b-kafa', kind: 'toolBushing' },
  { model: 'OKB 304B', file: 'okada-304-b-ust', kind: 'thrustUpperBushing' },
  { model: 'OKB 308', file: 'okada-308-kafa', kind: 'toolBushing' },
  { model: 'OKB 308', file: 'okada-308-ust', kind: 'thrustUpperBushing' },
  { model: 'OKB 310', file: 'okada-310-kafa', kind: 'toolBushing' },
  { model: 'OKB 310', file: 'okada-310-ust', kind: 'thrustUpperBushing' },
  { model: 'OKB 312', file: 'okada-312-kafa', kind: 'toolBushing' },
  { model: 'OKB 312', file: 'okada-312-ust', kind: 'thrustUpperBushing' },
  { model: 'OKB 316', file: 'okada-316-kafa', kind: 'toolBushing' },
  { model: 'OKB 316', file: 'okada-316-ust', kind: 'thrustUpperBushing' },
  { model: 'TOP 200', file: 'okada-top-200-kafa', kind: 'toolBushing' },
  { model: 'TOP 200', file: 'okada-top-200-ust', kind: 'thrustUpperBushing' },
  { model: 'TOP 300', file: 'okada-top-300-kafa', kind: 'toolBushing' },
  { model: 'TOP 300', file: 'okada-top-300-ust', kind: 'thrustUpperBushing' },
];
const TOYO_BURC: Bushing[] = [
  { model: 'THBB 51', file: 'toyo-51-dhb-55-kafa', kind: 'toolBushing' },
  { model: 'THBB 71', file: 'toyo-71-dhb-75-kafa', kind: 'toolBushing' },
  { model: 'THBB 101', file: 'toyo-101-dhb-105-kafa', kind: 'toolBushing' },
  { model: 'THBB 201', file: 'toyo-201-dhb-205-kafa', kind: 'toolBushing' },
  { model: 'THBB 301', file: 'toyo-301-dhb-305-kafa', kind: 'toolBushing' },
  { model: 'THBB 301', file: 'toyo-301-dhb-305-ust', kind: 'thrustUpperBushing' },
  { model: 'THBB 401', file: 'toyo-401-dhb-405-kafa', kind: 'toolBushing' },
  { model: 'THBB 401', file: 'toyo-401-dhb-405-ust', kind: 'thrustUpperBushing' },
  { model: 'THBB 801', file: 'toyo-801-dhb-805-kafa', kind: 'toolBushing' },
  { model: 'THBB 801', file: 'toyo-801-dhb-805-ust', kind: 'thrustUpperBushing' },
  { model: 'THBB 1101', file: 'toyo-1101-dhb-1105-kafa', kind: 'toolBushing' },
  { model: 'THBB 1101', file: 'toyo-1101-dhb-1105-ust', kind: 'thrustUpperBushing' },
  { model: 'THBB 1400', file: 'toyo-1400-kafa', kind: 'toolBushing' },
  { model: 'THBB 1400', file: 'toyo-1400-ust', kind: 'thrustRing' },
  { model: 'THBB 1401', file: 'toyo-1401-dhb-1305-kafa', kind: 'toolBushing' },
  { model: 'THBB 1401', file: 'toyo-1401-dhb-1305-ust', kind: 'thrustUpperBushing' },
  { model: 'THBB 1600', file: 'toyo-1600-dhb-1605-kafa', kind: 'toolBushing' },
  { model: 'THBB 1600', file: 'toyo-1600-dhb-1605-ust', kind: 'thrustRing' },
  { model: 'THBB 2000', file: 'toyo-2000-dhb-2305-kafa', kind: 'toolBushing' },
  { model: 'THBB 2000', file: 'toyo-2000-dhb-2305-ust', kind: 'thrustUpperBushing' },
  { model: 'THBB 3000', file: 'toyo-3000-dhb-3205-kafa', kind: 'toolBushing' },
  { model: 'THBB 3000', file: 'toyo-3000-dhb-3205-ust', kind: 'thrustRing' },
];
const ATLAS_COPCO_COP_BURC: Bushing[] = [
  { model: 'COP 1032', file: 'atlas-copco-cop-1032-ust', kind: 'rockDrillThrustRing' },
  { model: 'COP 1238', file: 'atlas-copco-cop-1238-ust', kind: 'rockDrillThrustRing' },
  { model: 'COP 1440', file: 'atlas-copco-cop-1440-ust', kind: 'rockDrillThrustRing' },
  { model: 'COP 1838', file: 'atlas-copco-cop-1838-ust', kind: 'rockDrillThrustRing' },
];
const JISUNG_BURC: Bushing[] = [
  { model: 'JSB-40', file: 'jisung-04a06801k-jsb-40-kafa', kind: 'toolBushing' },
  { model: 'JSB-40', file: 'jisung-06b06801k-jsb-40-ust', kind: 'thrustUpperBushing' },
];
const GENERAL_BURC: Bushing[] = [
  { model: 'GB 170', file: 'general-gb-170-general-ust', kind: 'thrustUpperBushing' },
];
const LIFTON_BURC: Bushing[] = [
  { model: 'LH 110', file: 'lifton-lh-110-ust', kind: 'thrustRing' },
  { model: 'LH 360', file: 'lifton-lh-360-kafa', kind: 'toolUpperBushing' },
  { model: 'LH 360', file: 'lifton-lh-360-ust', kind: 'thrustRing' },
];
const TABE_BURC: Bushing[] = [
  { model: 'AGB 16', file: 'tabe-agb-16-kafa', kind: 'toolBushing' },
  { model: 'AGB 16', file: 'tabe-agb-16-ust', kind: 'thrustRing' },
  { model: 'AGB 375', file: 'tabe-agb-375-kafa', kind: 'oneBushing' },
];
const KOMAC_BURC: Bushing[] = [
  { model: '300', file: 'komac-300-dayama', kind: 'thrustRing' },
  { model: '2000', file: 'komac-2000-dayama', kind: 'thrustRing' },
  { model: '3500', file: 'komac-3500-dayama', kind: 'thrustRing' },
];
const EURORAM_BURC: Bushing[] = [{ model: '115', file: 'euroram-115-dayama', kind: 'thrustRing' }];
const ARROWHEAD_BURC: Bushing[] = [
  { model: 'HB-6T', file: 'arrowhead-arrow-head-hb-6t-kafa', kind: 'toolBushing' },
  { model: 'HB-6T', file: 'arrowhead-arrow-head-hb-6t-ust', kind: 'upperBushing' },
];
const KENT_BURC: Bushing[] = [
  { model: 'K 50', file: 'k-k-50-kafa', kind: 'toolBushing' },
  { model: 'K 70', file: 'k-k-70-kafa', kind: 'toolBushing' },
  { model: 'K 70', file: 'k-k-70-ust', kind: 'upperBushing' },
  { model: 'K 90', file: 'k-k-90-kafa', kind: 'toolBushing' },
  { model: 'K 90', file: 'k-k-90-ust', kind: 'thrustUpperBushing' },
];
const KANGLIM_BURC: Bushing[] = [
  { model: 'KTB 400', file: 'kanglim-ktb-400-kafa', kind: 'toolBushing' },
  { model: 'KTB 400', file: 'kanglim-ktb-400-ust', kind: 'thrustUpperBushing' },
  { model: 'KTB 1800', file: 'kanglim-ktb-1800-kafa', kind: 'toolBushing' },
  { model: 'KTB 1800', file: 'kanglim-ktb-1800-ust', kind: 'thrustRing' },
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
  top: 'ustten',
};
/**
 * MTB tie rods carry a cast polyurethane coating on their grooved collars (the sheets: "KAPLAMA
 * MALZEMESİ: PU SH80" / "POLİÜRETAN", moulded in the "lastik kalıbı"; owner: nearly every MTB
 * rod gets it). Rendered in the wear plates' yellow PU (the coating covers the collar's chamfers too, owner: "biz öyle yapıyoruz"), version 03, captioned "PU kaplamalı".
 */
const PU_COATED_SAPLAMA: Record<string, string> = {
  'mtb-85': '03',
  'mtb-150': '03',
  'mtb-210': '03',
};
const kitRender =
  (part: string, kind: NonNullable<PartRender['kind']>, views: RenderView[]) =>
  ({ make, model, file }: (typeof PART_KIT)[number]): PartRender => {
    const b = `/photos/parca/${part}-${file}`;
    const pu = part === 'saplama' ? PU_COATED_SAPLAMA[file] : undefined;
    const v = pu ?? '01';
    return {
      model: make === 'MTB' ? `MTB ${model}` : `${make} ${model}`,
      series: make,
      kind,
      ...(pu ? { variant: 'puCoated' as const } : {}),
      hero: `${b}-vitrin-${v}`,
      views: views.map((view) => ({ base: `${b}-${VIEW_FILE[view]}-${v}`, view })),
    };
  };

/**
 * More parts modelled from our drawings, one drawing each (`/photos/parca/<file>-<view>-01`):
 * retainer pins and side bolts join the kama and saplama pages, accumulator parts and wear plates
 * have their own pages. Wear plates are rendered standing on their long edge.
 */
interface OtherPart {
  make: string;
  model: string;
  file: string;
  kind: NonNullable<PartRender['kind']>;
  views: RenderView[];
}
const RETAINER_PINS: OtherPart[] = [
  {
    make: 'Furukawa',
    model: 'F22',
    file: 'tutucupim-furukawa-f-22',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'Furukawa',
    model: 'HB20G',
    file: 'tutucupim-furukawa-hb-20-g',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'Krupp',
    model: 'HM 1500',
    file: 'tutucupim-krupp-hm-1500',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'Krupp',
    model: 'HM 560',
    file: 'tutucupim-krupp-hm-560',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'Krupp',
    model: 'HM 720',
    file: 'tutucupim-krupp-hm-720-721-722',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'Krupp',
    model: 'HM 960',
    file: 'tutucupim-krupp-hm-960-961-962',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'MTB',
    model: '210',
    file: 'tutucupim-mtb-mtb-210',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'MTB',
    model: '85',
    file: 'tutucupim-mtb-mtb-85',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'Rammer',
    model: 'E64',
    file: 'tutucupim-rammer-e-64',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'Rammer',
    model: 'E66',
    file: 'tutucupim-rammer-e-66',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'Rammer',
    model: 'G80',
    file: 'tutucupim-rammer-g-80',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'Rammer',
    model: 'S84',
    file: 'tutucupim-rammer-s-84',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'Soosan',
    model: 'SB81 TS-P',
    file: 'tutucupim-soosan-sb-81-ts-p',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'Soosan',
    model: 'SB121 TS-P',
    file: 'tutucupim-soosan-sb-121-ts-p',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'Atlas Copco',
    model: 'MB 1700',
    file: 'tutucupim-atlas-copco-mb-1700',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'Cat',
    model: '115',
    file: 'tutucupim-cat-cat-115',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'Cat',
    model: '130',
    file: 'tutucupim-cat-cat-130',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
  {
    make: 'D&A',
    model: '1300',
    file: 'tutucupim-da-d-a-1300',
    kind: 'retainerPin',
    views: ['side', 'front'],
  },
];
const SIDE_BOLTS: OtherPart[] = [
  {
    make: 'Furukawa',
    model: 'HB20G',
    file: 'yansaplama-furukawa-hb-20-g',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Furukawa',
    model: 'HB30G',
    file: 'yansaplama-furukawa-hb-30-g',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Krupp',
    model: 'HM 560',
    file: 'yansaplama-krupp-hm-560',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Soosan',
    model: 'SB81 TS-P',
    file: 'yansaplama-soosan-sb-81-ts-p',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Daemo',
    model: 'S500',
    file: 'yansaplama-daemo-daemo-s-500',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Daemo',
    model: 'S2200',
    file: 'yansaplama-daemo-daemo-s-2200',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Furukawa',
    model: 'HB10G',
    file: 'yansaplama-furukawa-hb-10-g',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Furukawa',
    model: 'HB15G',
    file: 'yansaplama-furukawa-hb-15-g',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Furukawa',
    model: 'HB200',
    file: 'yansaplama-furukawa-hb-200',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Furukawa',
    model: 'HB2000',
    file: 'yansaplama-furukawa-hb-2000',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Furukawa',
    model: 'HB40G',
    file: 'yansaplama-furukawa-hb-40-g',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Furukawa',
    model: 'HB8G',
    file: 'yansaplama-furukawa-hb-8-g',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Indeco',
    model: 'HP 600',
    file: 'yansaplama-indeco-mes-series',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Krupp',
    model: 'HM 300',
    file: 'yansaplama-krupp-hm-300-301-305',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Krupp',
    model: 'HM 550',
    file: 'yansaplama-krupp-hm-550-551-555',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Toyo',
    model: 'THBB 1600',
    file: 'yansaplama-toyo-toyo-1600-dhb-1605',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Toku',
    model: 'TNB-14E',
    file: 'yansaplama-toku-toku-tnb-14e-czk-155',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
  {
    make: 'Toku',
    model: 'TNB-150',
    file: 'yansaplama-toku-toku-tnb-150',
    kind: 'sideBolt',
    views: ['side', 'front'],
  },
];
const ACCUMULATOR_PARTS: OtherPart[] = [
  {
    make: 'Furukawa',
    model: 'HB20G',
    file: 'akumulator-furukawa-hb-20-g-akumulator-tupu-alt',
    kind: 'accumulatorLower',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Furukawa',
    model: 'HB20G',
    file: 'akumulator-furukawa-hb-20-g-akumulator-tupu-ust',
    kind: 'accumulatorUpper',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Furukawa',
    model: 'HB30G',
    file: 'akumulator-furukawa-hb-30-g-akumulator-tupu-saplamasi',
    kind: 'accumulatorBolt',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Furukawa',
    model: 'HB30G',
    file: 'akumulator-furukawa-hb-30-g-akumulator-tupu-alt',
    kind: 'accumulatorLower',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Krupp',
    model: 'HM 1500',
    file: 'akumulator-krupp-hm-1500-akumultor-tupu-alt',
    kind: 'accumulatorLower',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Krupp',
    model: 'HM 1500',
    file: 'akumulator-krupp-hm-1500-akumultor-tupu-ust',
    kind: 'accumulatorUpper',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Krupp',
    model: 'HM 720',
    file: 'akumulator-krupp-hm-720-721-722-akumulator-saplamasi',
    kind: 'accumulatorBolt',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Krupp',
    model: 'HM 960',
    file: 'akumulator-krupp-hm-960-961-962-akumulator-tupu-alt',
    kind: 'accumulatorLower',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Krupp',
    model: 'HM 960',
    file: 'akumulator-krupp-hm-960-961-962-akumulator-tupu-ust',
    kind: 'accumulatorUpper',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Montabert',
    model: 'BRH 501',
    file: 'akumulator-montabert-brh-501-brh-501-akumulator-alt-tupu',
    kind: 'accumulatorLower',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Montabert',
    model: 'BRH 501',
    file: 'akumulator-montabert-brh-501-brh-501-akumulator-saplamasi',
    kind: 'accumulatorBolt',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'MTB',
    model: '210',
    file: 'akumulator-mtb-mtb-210-01-1h020080-akumulator-tupu-ust',
    kind: 'accumulatorUpper',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'MTB',
    model: '210',
    file: 'akumulator-mtb-mtb-210-01-1h020090-akumulator-tupu-alt',
    kind: 'accumulatorLower',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'MTB',
    model: '85',
    file: 'akumulator-mtb-mtb-85-ust-akumulator-tupu',
    kind: 'accumulatorUpper',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'MTB',
    model: '85',
    file: 'akumulator-mtb-mtb-85-alt-akumulator-tupu',
    kind: 'accumulatorLower',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Rammer',
    model: 'E64',
    file: 'akumulator-rammer-e-64-akumulutor-saplamasi',
    kind: 'accumulatorBolt',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Rammer',
    model: 'E66',
    file: 'akumulator-rammer-e-66-akumulator-saplamasi',
    kind: 'accumulatorBolt',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Rammer',
    model: 'G80',
    file: 'akumulator-rammer-g-80-akumulator-saplamasi',
    kind: 'accumulatorBolt',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Rammer',
    model: 'S25',
    file: 'akumulator-rammer-s-25-akumulator-saplamasi',
    kind: 'accumulatorBolt',
    views: ['front', 'rear', 'side', 'section'],
  },
  {
    make: 'Rammer',
    model: 'S25',
    file: 'akumulator-rammer-s-25-hp-akumulator-tupu-kucuk-ust',
    kind: 'accumulatorUpper',
    views: ['front', 'rear', 'side', 'section'],
  },
];
const WEAR_PLATES: OtherPart[] = [
  {
    make: 'Krupp',
    model: 'HM 1500',
    file: 'asinma-krupp-hm-1500',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Krupp',
    model: 'HM 560',
    file: 'asinma-krupp-hm-560',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Krupp',
    model: 'HM 720',
    file: 'asinma-krupp-hm-720-721-722',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Krupp',
    model: 'HM 960',
    file: 'asinma-krupp-hm-960-961-962',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Montabert',
    model: 'BRH 501',
    file: 'asinma-montabert-brh-501',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Montabert',
    model: 'BRV 32',
    file: 'asinma-montabert-brv-32',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'MTB',
    model: '85',
    file: 'asinma-mtb-mtb-85',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Rammer',
    model: 'E64',
    file: 'asinma-rammer-e-64',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Rammer',
    model: 'S84',
    file: 'asinma-rammer-s-84',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Atlas Copco',
    model: 'HB 2200',
    file: 'asinma-atlas-copco-hb-2200',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Atlas Copco',
    model: 'HB 2500',
    file: 'asinma-atlas-copco-hb-2500',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Atlas Copco',
    model: 'MB 1000 (Krupp HM 680)',
    file: 'asinma-atlas-copco-mb-1000-hm-680',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Atlas Copco',
    model: 'MB 1200',
    file: 'asinma-atlas-copco-mb-1200',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Atlas Copco',
    model: 'MB 1700',
    file: 'asinma-atlas-copco-mb-1700',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Cat',
    model: '115',
    file: 'asinma-cat-cat-115',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Cat',
    model: '130',
    file: 'asinma-cat-cat-130',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Cat',
    model: '140',
    file: 'asinma-cat-cat-140',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'D&A',
    model: '2200',
    file: 'asinma-da-d-a-2200',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
  {
    make: 'Daemo',
    model: 'S2000',
    file: 'asinma-daemo-daemo-s-2000',
    kind: 'wearPlate',
    views: ['side', 'front', 'rear'],
  },
];
/** Nuts, washers, pins, plugs, buffers and plates (`small-parts.ts`): hero plus side, front and rear. */
const smallRender = ({ make, model, file, kind, variant }: SmallPart): PartRender => ({
  ...otherRender({ make, model, file, kind, views: ['side', 'front', 'rear'] }),
  ...(variant ? { variant } : {}),
});
const otherRender = ({ make, model, file, kind, views }: OtherPart): PartRender => {
  const b = `/photos/parca/${file}`;
  return {
    model: make === 'MTB' ? `MTB ${model}` : `${make} ${model}`,
    series: make,
    kind,
    hero: `${b}-vitrin-01`,
    views: views.map((view) => ({ base: `${b}-${VIEW_FILE[view]}-01`, view })),
  };
};

/**
 * Front heads with a "burçlu" picture set (bushings and pins fitted, modelled from our drawings):
 * `/photos/parca/alt-govde-<slug>-burclu-{vitrin,on,arka,yan,montaj-kesit}-01`, slug as in the head's hero.
 */
const FITTED = new Set<string>([
  'atlas-copco-hb-2200',
  'atlas-copco-hb-2500',
  'atlas-copco-hb-3000',
  'atlas-copco-mb-1200',
  'atlas-copco-tex-1400',
  'atlas-copco-tex-900',
  'cat-115',
  'cat-130',
  'cat-140',
  'cat-160',
  'da-1300',
  'da-130v',
  'da-200v',
  'da-2200',
  'daemo-s-2000',
  'daemo-s-2200',
  'daemo-s-2200-ii',
  'daemo-s-500',
  'dnb-d110-iis',
  'dnb-d130-iis',
  'dnb-d160-iis',
  'dnb-d70-iis',
  'furukawa-f-100',
  'furukawa-f-19',
  'furukawa-f-22',
  'furukawa-f-27',
  'furukawa-f-35',
  'furukawa-hb-1200',
  'furukawa-hb-15-g',
  'furukawa-hb-20-g',
  'furukawa-hb-30-g',
  'furukawa-hb-30-g-eski',
  'furukawa-hb-40-g',
  'furukawa-hb-5-g',
  'furukawa-hb-8-g',
  'hanwoo-rhb-305v',
  'hanwoo-rhb-320',
  'hanwoo-rhb-325',
  'hanwoo-rhb-330',
  'indeco-mes-2000',
  'indeco-mes-3500',
  'indeco-mes-4000',
  'indeco-mes-7000',
  'krupp-hm-1000',
  'krupp-hm-140',
  'krupp-hm-1500',
  'krupp-hm-2000',
  'krupp-hm-2000-marathon',
  'krupp-hm-2100-marathon',
  'krupp-hm-2300-marathon',
  'krupp-hm-2600-marathon',
  'krupp-hm-300',
  'krupp-hm-350',
  'krupp-hm-550',
  'krupp-hm-560',
  'krupp-hm-600',
  'krupp-hm-710',
  'krupp-hm-720',
  'krupp-hm-780',
  'krupp-hm-800',
  'krupp-hm-900',
  'krupp-hm-900-eski',
  'krupp-hm-950',
  'krupp-hm-960',
  'kwanglim-sg-2100',
  'kwanglim-sg-2800',
  'kwanglim-sg-800s',
  'mega-130',
  'mega-280',
  'montabert-brm1600v',
  'montabert-brv45v',
  'msb-200',
  'msb-300',
  'msb-400',
  'msb-450',
  'msb-500',
  'msb-810',
  'msb-saga-6000',
  'mtb-125',
  'mtb-15',
  'mtb-210-ii',
  'mtb-220',
  'mtb-25',
  'mtb-270',
  'mtb-275',
  'mtb-275-ii',
  'mtb-360',
  'mtb-40',
  'mtb-45',
  'mtb-500',
  'mtb-65',
  'mtb-700',
  'mtb-85',
  'npk-e-213a',
  'npk-e-216',
  'npk-e-220',
  'npk-h-10xb',
  'npk-h-12x',
  'npk-h-8xa',
  'okada-304b',
  'okada-308',
  'okada-310',
  'okada-316',
  'rammer-e64',
  'rammer-e65',
  'rammer-e66',
  'rammer-e66n',
  'rammer-e68',
  'rammer-g100',
  'rammer-g80',
  'rammer-g88',
  'rammer-g90',
  'rammer-s25',
  'rammer-s29',
  'rammer-s54',
  'rammer-s55',
  'rammer-s56',
  'rammer-s83',
  'rammer-s86',
  'soosan-sb100tsp',
  'soosan-sb121tsp',
  'soosan-sb121tsp-y',
  'soosan-sb130tsp',
  'soosan-sb150',
  'soosan-sb151tsp',
  'soosan-sb50tsp',
  'soosan-sb60',
  'soosan-sb60tsp',
  'soosan-sb60tsp-y',
  'soosan-sb70tsp',
  'soosan-sb80',
  'soosan-sb81tsp',
  'soosan-sb81tsp-y',
  'soosan-st180',
  'toku-tnb-14e',
  'topa-1400',
  'topa-300',
  'toyo-1400',
  'toyo-1401',
  'toyo-1600',
  'toyo-2000',
  'toyo-3000',
  'toyo-801',
]);
const withFitted = (r: PartRender): PartRender => {
  const slug = r.hero?.match(/^\/photos\/parca\/alt-govde-(.+)-vitrin-[^-]+$/)?.[1];
  if (!slug || !FITTED.has(slug)) return r;
  const b = `/photos/parca/alt-govde-${slug}-burclu`;
  return {
    ...r,
    fitted: {
      hero: `${b}-vitrin-01`,
      views: [
        { base: `${b}-on-01`, view: 'front' },
        { base: `${b}-arka-01`, view: 'rear' },
        { base: `${b}-yan-01`, view: 'side' },
        { base: `${b}-montaj-kesit-01`, view: 'assembly' },
      ],
    },
  };
};

export const PART_RENDERS: Record<PartKey, readonly PartRender[]> = {
  'alt-govde': (
    [
      {
        model: 'Rammer E68',
        series: 'Rammer',
        hero: '/photos/parca/alt-govde-rammer-e68-vitrin-01',
        model3d: '/models/alt-govde-rammer-e68-03.glb',
        views: [
          { base: '/photos/parca/alt-govde-rammer-e68-on-03', view: 'front' },
          { base: '/photos/parca/alt-govde-rammer-e68-arka-03', view: 'rear' },
          { base: '/photos/parca/alt-govde-rammer-e68-yan-03', view: 'side' },
          { base: '/photos/parca/alt-govde-rammer-e68-pencere-03', view: 'detail' },
          { base: '/photos/parca/alt-govde-rammer-e68-montaj-kesit-02', view: 'assembly' },
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
    ] satisfies PartRender[]
  ).map(withFitted),
  burc: [
    ...RAMMER_BURC.map(bushingRender('Rammer')),
    ...MTB_BURC.map(bushingRender('MTB')),
    ...KRUPP_BURC.map(bushingRender('Krupp')),
    ...ATLAS_COPCO_BURC.map(bushingRender('Atlas Copco')),
    ...SOOSAN_BURC.map(bushingRender('Soosan')),
    ...MONTABERT_BURC.map(bushingRender('Montabert')),
    ...FURUKAWA_BURC.map(bushingRender('Furukawa')),
    ...NPK_BURC.map(bushingRender('NPK')),
    ...INDECO_BURC.map(bushingRender('Indeco')),
    ...DAEMO_BURC.map(bushingRender('Daemo')),
    ...HANWOO_BURC.map(bushingRender('Hanwoo')),
    ...DNB_BURC.map(bushingRender('DNB')),
    ...CAT_BURC.map(bushingRender('Cat')),
    ...MSB_BURC.map(bushingRender('MSB')),
    ...TOKU_BURC.map(bushingRender('Toku')),
    ...KWANGLIM_BURC.map(bushingRender('Kwanglim')),
    ...KANGLIM_BURC.map(bushingRender('Kanglim')),
    ...D_A_BURC.map(bushingRender('D&A')),
    ...TOPA_BURC.map(bushingRender('Topa')),
    ...MEGA_BURC.map(bushingRender('Mega')),
    ...KENT_BURC.map(bushingRender('Kent')),
    ...OKADA_BURC.map(bushingRender('Okada')),
    ...TOYO_BURC.map(bushingRender('Toyo')),
    ...JISUNG_BURC.map(bushingRender('Jisung')),
    ...GENERAL_BURC.map(bushingRender('General')),
    ...LIFTON_BURC.map(bushingRender('Lifton')),
    ...TABE_BURC.map(bushingRender('Tabe')),
    ...ARROWHEAD_BURC.map(bushingRender('Arrowhead')),
    ...KOMAC_BURC.map(bushingRender('Komac')),
    ...EURORAM_BURC.map(bushingRender('Euroram')),
    ...TAMROCK_BURC.map(bushingRender('Tamrock')),
    ...ATLAS_COPCO_COP_BURC.map(bushingRender('Atlas Copco COP')),
    ...SMALL_PARTS.burc.map(smallRender),
  ],
  kama: [
    ...PART_KIT.map(kitRender('kama', 'retainerKey', ['front', 'rear', 'side'])),
    ...RETAINER_PINS.map(otherRender),
    ...SMALL_PARTS.kama.map(smallRender),
  ],
  saplama: [
    ...PART_KIT.map(kitRender('saplama', 'tieRod', ['side', 'front'])),
    ...SIDE_BOLTS.map(otherRender),
    ...ROD_SETS.map((p) => ({
      ...smallRender(p),
      views: smallRender(p).views.filter((v) => v.view !== 'rear'),
    })),
    ...SMALL_PARTS.saplama.map(smallRender),
  ],
  piston: PART_KIT.map(kitRender('piston', 'piston', ['front', 'rear', 'side', 'section'])),
  akumulator: [...ACCUMULATOR_PARTS.map(otherRender), ...SMALL_PARTS.akumulator.map(smallRender)],
  'asinma-plakasi': [
    ...WEAR_PLATES.map(otherRender),
    ...WEAR_SETS.map((p) => ({ ...smallRender(p), views: [] })),
    ...SMALL_PARTS['asinma-plakasi'].map(smallRender),
  ],
  'tamir-takimi': REPAIR_KITS.map(kitPartRender),
};

/**
 * Repair (seal) kits from the owner's kit lists (`repair-kits.ts`, generated): one render per kit,
 * every seal modelled from its listed sizes and laid out flat (`-vitrin` 16:9, `-ustten` 4:3).
 */
function kitPartRender(k: RepairKit): PartRender {
  const b = `/photos/parca/${k.file}`;
  return {
    model: `${k.make} ${k.models.join(' / ')}${k.variant ? ` (${k.variant})` : ''}`,
    series: k.make,
    kind: 'repairKit',
    hero: `${b}-vitrin-01`,
    views: [{ base: `${b}-ustten-01`, view: 'top' }],
    kit: k.items,
  };
}

/** Our own plant photos (/yedek-parca "Tesisimiz"), 4:5, `-sm` 480 px and `-lg` 960 px. */
export const PLANT_PHOTOS = [
  '/photos/tesis/cnc-isleme-01',
  '/photos/tesis/isil-islem-holu-01',
  '/photos/tesis/burc-stok-01',
  '/photos/tesis/uc-stok-01',
] as const;
