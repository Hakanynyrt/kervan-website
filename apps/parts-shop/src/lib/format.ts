import type { Range } from '@kervan/tips';
import type { Lang } from '../types';

const nf = (lang: Lang) =>
  new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 1 });

export const fmtNum = (n: number, lang: Lang): string => nf(lang).format(n);

/** "1.200–1.300 mm", "1.250 mm" or "—". */
export function fmtRange(r: Range | null, unit: string, lang: Lang): string {
  if (!r) return '—';
  const a = fmtNum(r.min, lang);
  const b = fmtNum(r.max, lang);
  return `${a === b ? a : `${a}–${b}`} ${unit}`;
}

export const fmtMm = (n: number | null, lang: Lang): string =>
  n === null ? '—' : `${fmtNum(n, lang)} mm`;
