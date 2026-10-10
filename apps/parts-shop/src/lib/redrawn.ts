/**
 * Re-rendered part pictures: file stem (`/photos/parca/<stem>-<view>-<NN>`) → new file version.
 * `photos.ts` swaps the version in every picture of the stem (images are cached immutable, so a
 * changed render always gets a new name).
 */
export const REDRAWN: Record<string, string> = {
  // Soosan SB121 TS-P round nut: a barrel (cross-bore) nut, Ø95 from the head's seat (no drawing of the nut).
  'saplama-takim-soosan-sb121-ts-p-roundshape': '02',
  'somun-soosan-sb121-ts-p-tie-rod-lower-nut-round-nut': '02',
};
