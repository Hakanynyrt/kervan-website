import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FitsIndex } from '@kervan/tips';
import { classifyQuery } from './quick-query.ts';

// Invented index: two tip families, three breakers of known makes.
const fam = (code: string, d: number, breakers: number[]) => ({
  code,
  d,
  collarMm: null,
  keyCount: 1 as const,
  keyMm: null,
  slotMm: null,
  rearStep: null,
  rearMm: null,
  types: ['chisel' as const],
  breakers,
});
const br = (brand: string, model: string, families: number[]) => ({
  brand,
  model,
  name: `${brand} ${model}`,
  slug: `${brand}/${model}`.toLowerCase().replace(/ /g, '-'),
  search: `${brand} ${model}`,
  families,
});
const FITS: FitsIndex = {
  schema: 1,
  families: [fam('KU70-03', 70, [0, 1]), fam('KU135-21', 135, [2])],
  breakers: [br('Rammer', 'E 64', [0]), br('Rammer', 'E 68', [0]), br('Krupp', 'HM 960', [1])],
};

test('tip codes and sizes', () => {
  assert.deepEqual(classifyQuery('KU70', FITS), { kind: 'code', families: [0] });
  assert.deepEqual(classifyQuery('ku 135-21', FITS), { kind: 'code', families: [1] });
  assert.deepEqual(classifyQuery('135', FITS), { kind: 'size', d: 135, families: [1] });
  assert.deepEqual(classifyQuery('  ', FITS), { kind: 'empty' });
});

test('breaker search answers an exact or single hit', () => {
  const a = classifyQuery('rammer e68', FITS);
  assert.equal(a.kind, 'breaker');
  assert.ok(a.kind === 'breaker' && a.exact === 1);
  const b = classifyQuery('rammer', FITS);
  assert.ok(b.kind === 'breaker' && b.hits.length === 2 && b.exact === null);
  const c = classifyQuery('krup hm 960', FITS);
  assert.ok(c.kind === 'breaker' && c.exact === 2);
  // A misspelt make is rewritten to the make ("ramer" → Rammer).
  const d = classifyQuery('ramer e68', FITS);
  assert.ok(d.kind === 'breaker' && d.exact === 1 && d.rewritten !== null);
});
