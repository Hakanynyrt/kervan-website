/**
 * Sun elevation for the night/day theme switch (see ../_middleware.ts).
 *
 * The low-precision solar position algorithm of the US Naval Observatory / NOAA (as in the
 * Astronomical Almanac): good to about 0.01° for 1950–2050, far more than a theme needs.
 * Pure, no I/O, unit-tested in sun.test.ts.
 */

const RAD = Math.PI / 180;

/** Solar elevation above the horizon in degrees at `t` (ms since epoch) for a place. */
export function sunElevationDeg(t: number, latDeg: number, lonDeg: number): number {
  // Days since J2000.0 (2000-01-01 12:00 TT, the ~70 s of TT−UT are irrelevant here).
  const d = (t - Date.UTC(2000, 0, 1, 12)) / 86_400_000;
  const g = ((357.529 + 0.98560028 * d) % 360) * RAD; // mean anomaly
  const q = (280.459 + 0.98564736 * d) % 360; // mean longitude
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD; // ecliptic longitude
  const e = (23.439 - 0.00000036 * d) * RAD; // obliquity of the ecliptic
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)); // right ascension
  const dec = Math.asin(Math.sin(e) * Math.sin(L)); // declination
  // Greenwich mean sidereal time (hours) → local hour angle of the sun.
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  const ha = ((gmst + lonDeg / 15) * 15 - ra / RAD) * RAD;
  const lat = latDeg * RAD;
  const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) / RAD;
}

/**
 * Civil twilight: the site turns dark once the sun is more than 6° below the horizon, the
 * point where streetlights come on. Near the poles the sun can stay above or below that
 * line for months; the elevation handles that without special cases.
 */
export const NIGHT_ELEVATION_DEG = -6;

export type SunPhase = 'day' | 'night';

/** 'night' | 'day' for a place, or null when the coordinates are missing or not numbers. */
export function sunPhase(
  t: number,
  lat: string | number | null | undefined,
  lon: string | number | null | undefined,
): SunPhase | null {
  const la = typeof lat === 'number' ? lat : parseFloat(lat ?? '');
  const lo = typeof lon === 'number' ? lon : parseFloat(lon ?? '');
  if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180)
    return null;
  return sunElevationDeg(t, la, lo) < NIGHT_ELEVATION_DEG ? 'night' : 'day';
}
