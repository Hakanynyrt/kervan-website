/**
 * The words of a guide video (owner, 2026-11-02): nothing but the approved article text.
 * Intro = the article's own title (guides.ts, verbatim); step i = the sentence {s} of the narrated step (owner, 2026-11-03: no spoken headings,
 * they repeated the sentence and broke its meaning)
 * (src/lib/guide-steps/<key>.ts, whose words guide-steps.test.ts checks against the article). The voice reads the Turkish lines; the English lines are the EN captions.
 * guides.ts is read as text: it cannot be imported under node (extensionless imports).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUIDE_STEPS } from '../../src/lib/guide-steps/index.ts';
import type { GuideKey } from '../../src/lib/guides';

export type VLang = 'tr' | 'en';
export const VLANGS: readonly VLang[] = ['tr', 'en'];

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const APP_DIR = path.resolve(HERE, '..', '..');
export const GUIDES_TS = path.join(APP_DIR, 'src', 'lib', 'guides.ts');

export const readGuidesTs = (): string => fs.readFileSync(GUIDES_TS, 'utf8').replace(/\r\n/g, '\n');

export const isGuideKey = (k: string): k is GuideKey => Object.hasOwn(GUIDE_STEPS, k);

/** The article's title as written in guides.ts (TR half first, then the `en:` half). */
export function articleTitle(guidesTs: string, key: GuideKey, lang: VLang): string {
  const halves = guidesTs.split(/\n {2}en: \{\n/);
  if (halves.length !== 2) throw new Error('guides.ts: TR/EN halves not found');
  const half = halves[lang === 'tr' ? 0 : 1];
  const start = half.indexOf(`      '${key}': {`);
  if (start < 0) throw new Error(`guides.ts: no ${lang} article ${key}`);
  const m = /\n {8}title:\s*(['"])((?:\\.|(?!\1).)*)\1,/.exec(half.slice(start));
  if (!m) throw new Error(`guides.ts: no ${lang} title for ${key}`);
  return m[2].replace(/\\(.)/g, '$1');
}

export interface Narration {
  key: GuideKey;
  title: Record<VLang, string>;
  /** Number of narrated steps. */
  steps: number;
  /** Per language: [intro, step 0, step 1, …]. TR is spoken, both are captions. */
  lines: Record<VLang, string[]>;
}

export function narration(key: GuideKey, guidesTs: string = readGuidesTs()): Narration {
  const d = GUIDE_STEPS[key];
  const title = { tr: articleTitle(guidesTs, key, 'tr'), en: articleTitle(guidesTs, key, 'en') };
  const lines = (lang: VLang) => [title[lang], ...d.steps.map((s) => s.s[lang])];
  return {
    key,
    title,
    steps: d.steps.length,
    lines: { tr: lines('tr'), en: lines('en') },
  };
}

/** A plain-text copy for the owner to read before recording (written next to the video). */
export const narrationText = (n: Narration): string =>
  VLANGS.map(
    (lang) =>
      `[${lang}]\n` +
      n.lines[lang].map((l, i) => `${i === 0 ? 'Giriş / Intro' : `#${i}`}: ${l}`).join('\n'),
  ).join('\n\n') + '\n';
