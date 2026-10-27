import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DICT } from './dict.ts';
import type { PartRender } from './photos.ts';
import {
  distinctLabels,
  otherSpelling,
  partAbout,
  renderFits,
  renderSeoName,
} from './part-caption.ts';

test('otherSpelling: joins a spaced model, spaces a joined one', () => {
  assert.equal(otherSpelling('MTB 210'), 'MTB210');
  assert.equal(otherSpelling('Soosan SB 50'), 'Soosan SB50');
  assert.equal(otherSpelling('Soosan SB50'), 'Soosan SB 50');
  assert.equal(otherSpelling('Krupp HM 560 / 580'), 'Krupp HM560 / 580');
  assert.equal(otherSpelling('Rammer'), null);
});

test('distinctLabels: adds the model only to labels that repeat', () => {
  assert.deepEqual(
    distinctLabels([
      { label: 'Kama', model: 'Krupp HM 560' },
      { label: 'Kama', model: 'Krupp HM 560 / 580' },
      { label: 'Piston', model: 'Krupp HM 560' },
    ]),
    ['Kama · Krupp HM 560', 'Kama · Krupp HM 560 / 580', 'Piston'],
  );
});

test('item page names: rock drill parts are not breaker parts, no double brackets', () => {
  for (const lang of ['tr', 'en'] as const) {
    const t = DICT[lang];
    const drill = renderSeoName(
      { model: 'COP 1032', kind: 'rockDrillThrustRing' } as PartRender,
      'burc',
      t,
    );
    assert.doesNotMatch(drill, /kırıcı|breaker/);
    const fits = renderFits({ model: 'COP 1032', kind: 'rockDrillThrustRing' } as PartRender, t);
    assert.doesNotMatch(fits, /kırıcı/);
    const old = renderFits({ model: 'Soosan SB50', variant: 'oldType' } as PartRender, t);
    assert.doesNotMatch(old, /\)\s*\(/);
    assert.match(old, /Soosan SB50 \(Soosan SB 50\), /);
    assert.match(
      renderSeoName({ model: 'MTB 210' } as PartRender, 'kama', t),
      /^MTB 210 (kırıcı|breaker) /,
    );
    const desc = t.meta.partItemDesc('MTB 210 x', {
      kit: false,
      priced: true,
      other: 'MTB210',
      rockDrill: false,
    });
    assert.equal(desc.split('MTB 210').length - 1 + desc.split('MTB210').length - 1, 2);
  }
});

test('partAbout: fit sentence names the model, every group has its own text, no numbers', () => {
  const tr = partAbout({ model: 'Soosan SB60' } as PartRender, 'kama', DICT.tr, 'tr');
  assert.equal(tr.fit, 'Soosan SB60 hidrolik kırıcısına uyumlu kama.');
  const drill = partAbout(
    { model: 'COP 1032', kind: 'rockDrillThrustRing' } as PartRender,
    'burc',
    DICT.tr,
    'tr',
  );
  assert.match(drill.fit, /kaya delicisine/);
  for (const lang of ['tr', 'en'] as const) {
    const a = DICT[lang].parts.item.about;
    const bodies = [...Object.values(a.groups), ...Object.values(a.kinds)];
    assert.equal(new Set(bodies).size, bodies.length);
    for (const b of bodies) {
      assert.doesNotMatch(b, /\d|orijinal|original/i);
      const n = b.split(/[.!?](\s|$)/).filter((x) => x.trim().length > 1).length;
      assert.ok(n >= 2 && n <= 4, b);
    }
    for (const k of Object.keys(DICT[lang].parts.items)) assert.ok(a.groups[k as 'kama']);
  }
});
