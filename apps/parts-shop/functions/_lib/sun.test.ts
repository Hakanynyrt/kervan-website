import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sunElevationDeg, sunPhase } from './sun.ts';

// Gebze (the plant): 40.80 N, 29.43 E. On the March equinox the sun's declination is ~0°, so
// solar noon is at 12:00 − 29.43° × 4 min + 7.5 min (equation of time) = 10:09Z (13:09 Türkiye
// time), the sun then stands 90° − 40.8° = 49.2° high, and day and night are 12 h each around
// that noon (sunrise 04:05Z, sunset 16:13Z: the −0.83° refraction/limb allowance makes the day
// 12 h 08 min long).
const GEBZE = { lat: 40.8, lon: 29.43 };

test('midsummer noon in Gebze: the sun is high', () => {
  // 2026-06-21 13:00 Türkiye time (10:00Z) ≈ solar noon; elevation ≈ 72.6°.
  const alt = sunElevationDeg(Date.UTC(2026, 5, 21, 10, 0), GEBZE.lat, GEBZE.lon);
  assert.ok(alt > 71 && alt < 74, `got ${alt}`);
});

test('midwinter midnight in Gebze: the sun is far below the horizon', () => {
  const alt = sunElevationDeg(Date.UTC(2025, 11, 21, 22, 0), GEBZE.lat, GEBZE.lon);
  assert.ok(alt < -60, `got ${alt}`);
});

test('equinox solar noon in Gebze: 49° high at 10:09Z', () => {
  const alt = sunElevationDeg(Date.UTC(2026, 2, 20, 10, 9), GEBZE.lat, GEBZE.lon);
  assert.ok(Math.abs(alt - 49.2) < 0.5, `got ${alt}`);
});

test('equinox sunrise and sunset put the sun at the horizon', () => {
  const rise = sunElevationDeg(Date.UTC(2026, 2, 20, 4, 5), GEBZE.lat, GEBZE.lon);
  const set = sunElevationDeg(Date.UTC(2026, 2, 20, 16, 13), GEBZE.lat, GEBZE.lon);
  // ±6 min of clock ≈ ±1.2° of elevation at this latitude.
  assert.ok(Math.abs(rise + 0.83) < 1.2, `sunrise ${rise}`);
  assert.ok(Math.abs(set + 0.83) < 1.2, `sunset ${set}`);
});

test('sunPhase: day in the afternoon, night after civil dusk, null without coordinates', () => {
  assert.equal(sunPhase(Date.UTC(2026, 2, 20, 12, 0), '40.80', '29.43'), 'day');
  // Sunset 16:13Z + ~28 min of civil twilight → 17:10Z (20:10 local) is night.
  assert.equal(sunPhase(Date.UTC(2026, 2, 20, 17, 10), '40.80', '29.43'), 'night');
  // Two minutes after sunset is still civil twilight → day.
  assert.equal(sunPhase(Date.UTC(2026, 2, 20, 16, 15), '40.80', '29.43'), 'day');
  assert.equal(sunPhase(Date.UTC(2026, 2, 20, 12, 0), undefined, undefined), null);
  assert.equal(sunPhase(Date.UTC(2026, 2, 20, 12, 0), 'x', '29'), null);
  assert.equal(sunPhase(Date.UTC(2026, 2, 20, 12, 0), '95', '29'), null);
});

test('polar night: Longyearbyen in December is night all day', () => {
  for (const h of [0, 6, 12, 18])
    assert.equal(sunPhase(Date.UTC(2025, 11, 21, h, 0), 78.22, 15.63), 'night');
});

test('midnight sun: Longyearbyen in June is day all night', () => {
  for (const h of [0, 6, 12, 18])
    assert.equal(sunPhase(Date.UTC(2026, 5, 21, h, 0), 78.22, 15.63), 'day');
});
