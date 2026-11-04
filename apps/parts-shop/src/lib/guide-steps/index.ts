/**
 * The narrated steps of every guide (owner, 2026-11-02): one data file per article (`<key>.ts`,
 * its steps cut from guides.ts). The video's voice, its TR/EN captions and the transcript under
 * the player read them (scripts/guide-video/narration.ts, GuideVideo); the 3B pictures are made
 * outside the repo. Imports carry `.ts` so node's test runner can load this registry
 * (guide-steps.test.ts).
 */
import type { GuideKey } from '../guides';
import type { GuideSteps } from './types.ts';
import { guideSteps as ucu } from './kirici-ucu-ne-zaman-degisir.ts';
import { guideSteps as burcu } from './kirici-burcu-ne-zaman-degisir.ts';
import { guideSteps as kamasi } from './kirici-kamasi-neden-kirilir.ts';
import { guideSteps as keski } from './keski-mi-sivri-uc-mu.ts';
import { guideSteps as yaglama } from './kirici-yaglamasi-nasil-yapilir.ts';
import { guideSteps as altGovde } from './kirici-alt-govdesi-ne-zaman-degisir.ts';
import { guideSteps as piston } from './kirici-pistonu-neden-cizilir.ts';
import { guideSteps as saplama } from './kirici-saplamasi-neden-kopar.ts';

export type { GuideStep, GuideSteps, L10n } from './types.ts';

export const GUIDE_STEPS: Record<GuideKey, GuideSteps> = {
  'kirici-ucu-ne-zaman-degisir': ucu,
  'kirici-burcu-ne-zaman-degisir': burcu,
  'kirici-kamasi-neden-kirilir': kamasi,
  'keski-mi-sivri-uc-mu': keski,
  'kirici-yaglamasi-nasil-yapilir': yaglama,
  'kirici-alt-govdesi-ne-zaman-degisir': altGovde,
  'kirici-pistonu-neden-cizilir': piston,
  'kirici-saplamasi-neden-kopar': saplama,
};
