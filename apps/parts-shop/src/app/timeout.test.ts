import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout } from './timeout.ts';

test('withTimeout: the value when it comes in time, the fallback when it does not', async () => {
  assert.equal(await withTimeout(Promise.resolve('tr'), 50, 'en'), 'tr');
  assert.equal(await withTimeout(new Promise<string>(() => {}), 20, 'en'), 'en');
  await assert.rejects(withTimeout(Promise.reject(new Error('x')), 50, 'en'));
});
