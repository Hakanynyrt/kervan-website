import type { PartRender } from './photos';
import type { PartKey } from './routes';

type Kind = NonNullable<PartRender['kind']>;

/** "Parça türü" chips on a group page: each narrows the search and the showcase to some kinds. */
export type PartFilter =
  | 'toolBushing'
  | 'upperBushing'
  | 'thrustRing'
  | 'oneBushing'
  | 'twoInOne'
  | 'pins'
  | 'plugs'
  | 'rods'
  | 'nuts'
  | 'washers'
  | 'keys'
  | 'plates'
  | 'buffers'
  | 'sets';

export const PART_FILTERS: Partial<Record<PartKey, [PartFilter, readonly Kind[]][]>> = {
  burc: [
    ['toolBushing', ['toolBushing']],
    ['upperBushing', ['upperBushing']],
    ['thrustRing', ['thrustRing', 'spacerBushing', 'rockDrillThrustRing']],
    ['oneBushing', ['oneBushing']],
    ['twoInOne', ['thrustUpperBushing', 'toolUpperBushing']],
    [
      'pins',
      [
        'toolBushingPin',
        'toolBushingPinRetainer',
        'toolUpperPin',
        'keyUpperPin',
        'upperBushingPin',
      ],
    ],
    ['plugs', ['toolBushingPinPlug', 'upperBushingPinPlug']],
  ],
  saplama: [
    ['sets', ['tieRodSet']],
    ['rods', ['tieRod', 'sideBolt', 'bodyDowel']],
    ['nuts', ['tieRodNut', 'tieRodUpperNut', 'tieRodLowerNut']],
    ['washers', ['tieRodWasher', 'tieRodBush', 'sideBoltWasher']],
  ],
  kama: [
    ['keys', ['retainerKey']],
    [
      'pins',
      [
        'retainerPin',
        'lowerRetainerPin',
        'retainerLockPin',
        'keyPinRetainer',
        'springPin',
        'keyPinHolder',
        'keyPinRubber',
        'keyPinWasher',
      ],
    ],
    ['plugs', ['keyPinPlug']],
  ],
  'asinma-plakasi': [
    ['sets', ['wearPlateSet']],
    [
      'plates',
      ['wearPlate', 'topWearPlate', 'sideWearPlate', 'frontWearPlate', 'allRoundWearPlate'],
    ],
    [
      'buffers',
      [
        'topBuffer',
        'sideBuffer',
        'bottomBuffer',
        'bufferGuide',
        'topBufferPlate',
        'bottomBufferPlate',
      ],
    ],
  ],
};

/** The filters a group page offers: only those with at least one render. */
export const filtersFor = (part: PartKey, all: readonly PartRender[]) =>
  (PART_FILTERS[part] ?? []).filter(([, kinds]) =>
    all.some((r) => r.kind && kinds.includes(r.kind)),
  );

export const inFilter = (r: PartRender, kinds: readonly Kind[] | undefined) =>
  !kinds || (!!r.kind && kinds.includes(r.kind));
