import { test } from 'node:test';
import assert from 'node:assert/strict';
import { go, setNavigator } from './nav.ts';

test('without a router, go() loads the page (the site)', () => {
  const assigned: string[] = [];
  const g = globalThis as { window?: unknown };
  const before = g.window;
  g.window = { location: { assign: (u: string) => assigned.push(u) } };
  try {
    setNavigator(null);
    go('/kirici/furukawa/hb-20g?tip=keski');
    assert.deepEqual(assigned, ['/kirici/furukawa/hb-20g?tip=keski']);
  } finally {
    g.window = before;
  }
});

test('with a router set, go() hands it the URL and never loads a page', () => {
  const seen: string[] = [];
  setNavigator((u) => seen.push(u));
  try {
    go('/en/kirici/mtb/150');
    assert.deepEqual(seen, ['/en/kirici/mtb/150']);
  } finally {
    setNavigator(null);
  }
});
