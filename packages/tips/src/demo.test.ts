import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoCatalog } from './demo.ts';

test('the DEMO catalog is flagged and uses XX codes only', () => {
  const c = demoCatalog();
  assert.equal(c.demo, true);
  assert.ok(c.families.length >= 6);
  for (const f of c.families) assert.match(f.code, /^XX\d{2,3}-\d{2}$/);
  for (const f of c.families) for (const b of f.fits) assert.equal(b.brand, 'DEMO');
});
