import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fxCandidateDates, parseTcmbUsd, tcmbArchiveUrl } from './fx.ts';

test('fxCandidateDates: the Monday of the ISO week first, then one day back at a time', () => {
  // Wednesday 2026-11-04 → Monday 2026-11-02, Sunday 1st, Saturday 31 Oct, Friday 30 Oct.
  assert.deepEqual(fxCandidateDates(new Date('2026-11-04T09:00:00Z'), 4), [
    '2026-11-02',
    '2026-11-01',
    '2026-10-31',
    '2026-10-30',
  ]);
  // Monday itself starts with Monday; Sunday belongs to the week that began six days before.
  assert.equal(fxCandidateDates(new Date('2026-11-02T05:00:00Z'))[0], '2026-11-02');
  assert.equal(fxCandidateDates(new Date('2026-11-08T12:00:00Z'))[0], '2026-11-02');
  assert.equal(fxCandidateDates(new Date('2026-11-08T12:00:00Z')).length, 10);
});

test('fxCandidateDates: on the Monday, a missing file means the previous week rate', () => {
  // Monday 2026-11-02, 06:47 Istanbul (before the 15:30 bulletin): Monday, then the previous
  // week's Monday 26 Oct and the days before it, never Friday 30 Oct.
  assert.deepEqual(fxCandidateDates(new Date('2026-11-02T03:47:00Z'), 4), [
    '2026-11-02',
    '2026-10-26',
    '2026-10-25',
    '2026-10-24',
  ]);
  assert.equal(fxCandidateDates(new Date('2026-11-02T03:47:00Z')).length, 10);
  // From Tuesday on, a missing Monday (a holiday) steps back day by day: Friday 30 Oct.
  assert.deepEqual(fxCandidateDates(new Date('2026-11-03T03:47:00Z'), 4), [
    '2026-11-02',
    '2026-11-01',
    '2026-10-31',
    '2026-10-30',
  ]);
});

test('fxCandidateDates: the Istanbul calendar (UTC+3), across months and years', () => {
  // 22:30 UTC on Sunday 8 Nov is already Monday 9 Nov in Istanbul.
  assert.equal(fxCandidateDates(new Date('2026-11-08T22:30:00Z'))[0], '2026-11-09');
  // Thursday 2027-01-07 → Monday 2027-01-04; Friday 2027-01-01 → Monday 2026-12-28.
  assert.equal(fxCandidateDates(new Date('2027-01-07T10:00:00Z'))[0], '2027-01-04');
  assert.equal(fxCandidateDates(new Date('2027-01-01T10:00:00Z'))[0], '2026-12-28');
});

test('tcmbArchiveUrl', () => {
  assert.equal(tcmbArchiveUrl('2026-11-02'), 'https://www.tcmb.gov.tr/kurlar/202611/02112026.xml');
});

// An invented bulletin (the rate is a placeholder, not a real one).
const xml = (date: string, selling: string) => `<?xml version="1.0" encoding="UTF-8"?>
<Tarih_Date Tarih="x" Date="${date}" Bulten_No="2026/1">
  <Currency CrossOrder="0" Kod="USD" CurrencyCode="USD">
    <ForexBuying>9.0000</ForexBuying>
    <ForexSelling>${selling}</ForexSelling>
  </Currency>
  <Currency CrossOrder="1" Kod="EUR" CurrencyCode="EUR">
    <ForexSelling>11.0000</ForexSelling>
  </Currency>
</Tarih_Date>`;

test('parseTcmbUsd: the USD ForexSelling of the asked date only', () => {
  assert.deepEqual(parseTcmbUsd(xml('11/02/2026', '10.5000'), '2026-11-02'), {
    usdTry: 10.5,
    date: '2026-11-02',
  });
  // Another day's bulletin, a missing or implausible rate: no rate (never a guess).
  assert.equal(parseTcmbUsd(xml('10/30/2026', '10.5000'), '2026-11-02'), null);
  assert.equal(parseTcmbUsd(xml('11/02/2026', ''), '2026-11-02'), null);
  assert.equal(parseTcmbUsd(xml('11/02/2026', '0.5'), '2026-11-02'), null);
  assert.equal(parseTcmbUsd('<html>not found</html>', '2026-11-02'), null);
});
