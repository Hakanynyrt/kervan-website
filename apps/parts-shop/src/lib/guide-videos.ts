/**
 * The guides' narrated videos (owner, 2026-11-02): 3B pictures rendered in Blender outside the
 * repo as a PNG frame sequence, with a synthetic voice-over (scripts/guide-video.ts). Files in the repo, served by Pages:
 * `public/videos/rehber/<base>.mp4`, `.jpg` (poster), `.tr.vtt`, `.en.vtt`. The four share one
 * name; if one of them changes, all four get the next `-NN` (cached immutable, `_headers`).
 * A guide without an entry shows no video. guide-steps.test.ts checks every entry.
 */
import type { GuideKey } from './guides';

export interface GuideVideo {
  /** File base, e.g. 'kirici-yaglamasi-nasil-yapilir-01'. */
  base: string;
  w: 1280;
  h: 720;
  /** ISO 8601 duration from ffprobe ('PT1M12S'), written by the script. */
  durationIso: string;
  /** The day the files went into the repo (YYYY-MM-DD): a real date, never invented. */
  uploadDate: string;
  /** Synthetic (Turkish) voice-over, or none. Never a provider's voice name (that stays outside
   *  the repo); a SAPI trial voice never ships (the script refuses `--publish` with SAPI). */
  voice: 'synthetic' | 'none';
  /** The same video on the company YouTube channel, once the owner has put it there: a plain
   *  link under the player (no embed, no YouTube script on the page). */
  youtubeUrl?: string;
}

export const VIDEO_DIR = '/videos/rehber';

export const GUIDE_VIDEOS: Partial<Record<GuideKey, GuideVideo>> = {
  'kirici-yaglamasi-nasil-yapilir': {
    base: 'kirici-yaglamasi-nasil-yapilir-01',
    w: 1280,
    h: 720,
    durationIso: 'PT31S',
    uploadDate: '2026-11-04',
    voice: 'synthetic',
  },
  'kirici-ucu-ne-zaman-degisir': {
    base: 'kirici-ucu-ne-zaman-degisir-01',
    w: 1280,
    h: 720,
    durationIso: 'PT31S',
    uploadDate: '2026-11-04',
    voice: 'synthetic',
  },
  'kirici-burcu-ne-zaman-degisir': {
    base: 'kirici-burcu-ne-zaman-degisir-01',
    w: 1280,
    h: 720,
    durationIso: 'PT32S',
    uploadDate: '2026-11-04',
    voice: 'synthetic',
  },
  'kirici-kamasi-neden-kirilir': {
    base: 'kirici-kamasi-neden-kirilir-01',
    w: 1280,
    h: 720,
    durationIso: 'PT37S',
    uploadDate: '2026-11-04',
    voice: 'synthetic',
  },
  'keski-mi-sivri-uc-mu': {
    base: 'keski-mi-sivri-uc-mu-01',
    w: 1280,
    h: 720,
    durationIso: 'PT31S',
    uploadDate: '2026-11-04',
    voice: 'synthetic',
  },
  'kirici-alt-govdesi-ne-zaman-degisir': {
    base: 'kirici-alt-govdesi-ne-zaman-degisir-01',
    w: 1280,
    h: 720,
    durationIso: 'PT31S',
    uploadDate: '2026-11-04',
    voice: 'synthetic',
  },
  'kirici-pistonu-neden-cizilir': {
    base: 'kirici-pistonu-neden-cizilir-01',
    w: 1280,
    h: 720,
    durationIso: 'PT38S',
    uploadDate: '2026-11-04',
    voice: 'synthetic',
  },
  'kirici-saplamasi-neden-kopar': {
    base: 'kirici-saplamasi-neden-kopar-01',
    w: 1280,
    h: 720,
    durationIso: 'PT41S',
    uploadDate: '2026-11-04',
    voice: 'synthetic',
  },
};

/** The four files of a video, as site paths. */
export const videoFiles = (v: GuideVideo) => ({
  mp4: `${VIDEO_DIR}/${v.base}.mp4`,
  jpg: `${VIDEO_DIR}/${v.base}.jpg`,
  tr: `${VIDEO_DIR}/${v.base}.tr.vtt`,
  en: `${VIDEO_DIR}/${v.base}.en.vtt`,
});
