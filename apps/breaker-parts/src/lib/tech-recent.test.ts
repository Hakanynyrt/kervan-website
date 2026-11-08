import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pushRecent, toggleStar } from './tech-recent.ts';

test('pushRecent moves to the front, dedups and caps', () => {
  assert.deepEqual(pushRecent(['a', 'b', 'c'], 'b'), ['b', 'a', 'c']);
  assert.deepEqual(pushRecent(['a', 'b'], 'c', 2), ['c', 'a']);
});

test('toggleStar adds and removes', () => {
  assert.deepEqual(toggleStar(['a'], 'b'), ['b', 'a']);
  assert.deepEqual(toggleStar(['a', 'b'], 'a'), ['b']);
});
