import assert from 'node:assert/strict';
import test from 'node:test';
import type { PageModel } from '../lib/routes';
import {
  checkProps,
  isKnownKind,
  KINDS_MATCH,
  KNOWN_KINDS,
  type Equal,
  type KnownKind,
} from './contract.ts';

// Compile-time (pnpm typecheck): the app's kinds are the shop's, and `Equal` does tell a
// difference (a kind the shop adds, or one it drops, is a type error in contract.ts).
const same: Equal<PageModel['kind'], KnownKind> = true;
// @ts-expect-error a kind the app does not know
const added: Equal<PageModel['kind'] | 'video', KnownKind> = true;
// @ts-expect-error a kind the shop no longer has
const dropped: Equal<Exclude<PageModel['kind'], 'intl'>, KnownKind> = true;

test('the compile-time checks hold', () => {
  assert.equal(KINDS_MATCH, true);
  assert.deepEqual([same, added, dropped], [true, true, true]);
});

test('KNOWN_KINDS: each once', () => {
  assert.equal(new Set(KNOWN_KINDS).size, KNOWN_KINDS.length);
  assert.ok(isKnownKind('breaker'));
  assert.ok(!isKnownKind('video'));
  assert.ok(!isKnownKind(undefined));
});

const props = {
  lang: 'tr',
  path: '/palet',
  model: { kind: 'cart', demo: false, hasPopular: true },
  fx: null,
};

test('checkProps: a page the app can show', () => {
  const r = checkProps(props);
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.props.model.kind, 'cart');
  // No rate in older or hand-made props: read as none.
  const noFx = checkProps({ ...props, fx: undefined });
  assert.ok(noFx.ok && noFx.props.fx === null);
});

test('checkProps: a newer kind asks for an update; a broken shape is invalid', () => {
  assert.deepEqual(checkProps({ ...props, model: { kind: 'video' } }), {
    ok: false,
    reason: 'unknownKind',
    kind: 'video',
  });
  for (const bad of [
    null,
    [],
    'x',
    { ...props, lang: 'de' },
    { ...props, path: 'palet' },
    { ...props, path: 3 },
    { ...props, model: null },
    { ...props, model: { kind: 3 } },
    { ...props, fx: 'x' },
  ])
    assert.deepEqual(checkProps(bad), { ok: false, reason: 'invalid' }, JSON.stringify(bad));
});
