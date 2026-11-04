import type { GuideKey } from '../guides';

/** A text in both languages. */
export type L10n = { tr: string; en: string };

/**
 * One step of a guide's video narration. Its words come from the article only (guides.ts): `h`
 * and `s` are cut from the approved sentence that `src` quotes; no new claims, figures or
 * adjectives (guide-steps.test.ts checks every word against the article).
 */
export interface GuideStep {
  /** kebab-case, unique within the guide: 'blank-firing', 'notch'… */
  id: string;
  /** Short title, at most 40 characters. */
  h: L10n;
  /** One sentence, at most 200 characters, ending with a full stop. */
  s: L10n;
  /** The source: a substring that occurs verbatim in guides.ts (TR and EN). Data, not a comment,
   *  so the test can find it. */
  src: L10n;
}

/** The narrated steps of one article (spoken in the video, its captions and transcript). */
export interface GuideSteps {
  key: GuideKey;
  /** 3 to 5 steps. */
  steps: readonly GuideStep[];
}
