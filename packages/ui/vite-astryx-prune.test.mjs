import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classesInJs, pruneAstryxCss } from './vite-astryx-prune.mjs';

const layer = (body) => `@layer astryx-base{${body}}`;

test('drops only rules whose Astryx class no JS uses', () => {
  const css = layer('.xused1{color:red}.xdead1{color:blue}');
  assert.equal(pruneAstryxCss(css, new Set(['xused1'])), layer('.xused1{color:red}'));
});

test('keeps other layers, tokens, keyframes and @property untouched', () => {
  const css =
    '@layer utilities{.xdead1{top:0}}:root{--a:1}' +
    layer('@property --x-a{syntax:"*";inherits:false}@keyframes xdead2{to{top:0}}:root{--b:2}');
  assert.equal(pruneAstryxCss(css, new Set()), css);
});

test('filters selector lists and empties @media', () => {
  const css = layer('.xused1,.xdead1:hover{top:0}@media (min-width:1px){.xdead1{top:0}}');
  assert.equal(pruneAstryxCss(css, new Set(['xused1'])), layer('.xused1{top:0}'));
});

test('an absent class inside :not() keeps the selector', () => {
  const css = layer('.xused1:not(.xdead1){top:0}');
  assert.equal(pruneAstryxCss(css, new Set(['xused1'])), css);
});

test('braces inside strings do not end a block', () => {
  const css = layer('.xused1::after{content:"}"}.xdead1{top:0}');
  assert.equal(pruneAstryxCss(css, new Set(['xused1'])), layer('.xused1::after{content:"}"}'));
});

test('classesInJs finds classes written as strings', () => {
  assert.deepEqual([...classesInJs('a="x1v1du0q xafi2nm";b="xyz"')], ['x1v1du0q', 'xafi2nm']);
});
