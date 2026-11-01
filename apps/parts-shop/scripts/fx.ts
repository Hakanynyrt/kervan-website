// The USD/TRY rate of the Turkish prices (owner, G2, 2026-11-01): ONE CBRT (TCMB) ForexSelling
// rate per week, the one of the first business day of the ISO week, read from TCMB's archive
// (https://www.tcmb.gov.tr/kurlar/YYYYMM/DDMMYYYY.xml), stepping back day by day while a file is
// missing (a holiday Monday, or a Monday morning before the day's bulletin). Pure helpers here;
// the network is used only by build-catalog.ts.
import type { FxRate } from '../../../packages/tips/src/index.ts';

/** Türkiye keeps UTC+3 all year (no DST since 2016). */
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

const iso = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * The archive dates to try, in order: the Monday of `now`'s ISO week (Istanbul calendar), then
 * one day earlier at a time, `max` dates in all. Never a date after today.
 */
export function fxCandidateDates(now: Date, max = 10): string[] {
  const local = new Date(now.getTime() + ISTANBUL_OFFSET_MS);
  const day = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
  // ISO weekday: Monday 1 … Sunday 7.
  const weekday = day.getUTCDay() === 0 ? 7 : day.getUTCDay();
  const monday = day.getTime() - (weekday - 1) * 86_400_000;
  return Array.from({ length: max }, (_, i) => iso(new Date(monday - i * 86_400_000)));
}

/** "https://www.tcmb.gov.tr/kurlar/202611/02112026.xml" for "2026-11-02". */
export function tcmbArchiveUrl(date: string): string {
  const [y, m, d] = date.split('-');
  return `https://www.tcmb.gov.tr/kurlar/${y}${m}/${d}${m}${y}.xml`;
}

/**
 * The USD ForexSelling rate of one TCMB bulletin, if the file is the bulletin of `date` and the
 * rate is plausible; null otherwise (never a guessed rate).
 */
export function parseTcmbUsd(xml: string, date: string): FxRate | null {
  const d = /<Tarih_Date[^>]*\sDate="(\d{2})\/(\d{2})\/(\d{4})"/.exec(xml);
  if (!d || `${d[3]}-${d[1]}-${d[2]}` !== date) return null;
  const usd = /<Currency[^>]*CurrencyCode="USD"[^>]*>([\s\S]*?)<\/Currency>/.exec(xml)?.[1] ?? '';
  const rate = Number(/<ForexSelling>([\d.]+)<\/ForexSelling>/.exec(usd)?.[1]);
  if (!(rate > 1 && rate < 1000)) return null;
  return { usdTry: rate, date };
}
