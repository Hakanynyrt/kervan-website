import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ORG_PHONE } from '@kervan/seo/constants';
import { DICT } from './dict.ts';

/**
 * The header's group bar (Layout.tsx) from 768 px: the nine groups on the left, "Çok satanlar"
 * and how to order on the right, all on one line in both languages (design E; the old header
 * showed every item at these widths too). Keep the numbers in sync with the bar's classes.
 */

/** Inter advance widths (1/1000 em) at 400 and 600, from the font Google Fonts serves; others
 *  count as wide (900). Kerning is left out, so the sums err on the wide side. */
const table = (s: string, space: number) =>
  new Map<string, number>([
    [' ', space],
    ...s.split(' ').map((x): [string, number] => [x[0], Number(x.slice(1))]),
  ]);
const W400 = table(
  'a562 b612 c571 d612 e583 f370 g613 h591 i242 j242 k549 l242 m876 n591 o600 p612 q612 r376 ' +
    's528 t327 u591 v562 w818 x546 y562 z552 A690 B654 C730 D722 E601 F590 G746 H743 I269 K672 ' +
    'L565 M903 N753 O765 P639 R644 S642 T646 U744 W985 ç571 ğ613 ı242 ö600 ş528 ü591 Ç730 :288 ' +
    '·288 +662 0631 1407 2610 3618 4646 5593 6620 7566 8619 9620',
  281,
);
const W600 = table(
  'a574 b624 c583 d624 e591 f389 g625 h612 i262 j262 k569 l262 m900 n612 o609 p624 q624 r397 ' +
    's549 t353 u612 v587 w839 x569 y588 z566 A728 B659 C737 D722 E605 F588 G749 H746 I277 K703 ' +
    'L565 M922 N759 O769 P645 R652 S650 T660 U736 W1020 ç583 ğ625 ı262 ö609 ş549 ü612 Ç737 :319',
  252,
);
/** Text width in CSS px, with 3 % to spare for rendering differences. */
const tw = (s: string, px: number, w: Map<string, number>) =>
  ([...s].reduce((a, c) => a + (w.get(c) ?? 900), 0) / 1000) * px * 1.03;

/** Room left on the bar's line (CSS px) at window width `vw`; negative: it does not fit. */
function slack(vw: number, lang: 'tr' | 'en'): number {
  const t = DICT[lang];
  // The tips and every part group (the bar's order does not change its width).
  const labels = Object.values(t.nav.groups);
  // WRAP: 1376 px band, 24 px gutters from 768 px.
  const content = Math.min(vw, 1376) - 48;
  const sum = (px: number, gap: number) =>
    labels.reduce((a, s) => a + tw(s, px, W600), 0) + (labels.length - 1) * gap;
  if (vw < 1024) {
    // 13.5 px type; gaps 8 px (16 px from 900 px); "Çok satanlar" after a rule, the same gap
    // before it.
    const gap = vw < 900 ? 8 : 16;
    return content - sum(13.5, gap) - gap - (1 + gap + tw(t.nav.popular, 13.5, W600));
  }
  const order = (phone: boolean) =>
    tw(t.nav.order.label, 13.5, W600) +
    tw(` ${t.nav.order.whatsapp}${phone ? ` · ${ORG_PHONE}` : ''}`, 13.5, W400);
  if (vw < 1280) {
    // 14 px type, 14 px gaps; on the right "Çok satanlar" and "Sipariş: WhatsApp" (the number
    // from 1280 px), 20 px apart, after a rule and 16 px.
    return content - sum(14, 14) - 20 - (tw(t.nav.popular, 14, W600) + 20 + 17 + order(false));
  }
  // 14.5 px type, 20 px gaps; on the right "Çok satanlar", "Kurumsal" and the whole order line.
  return (
    content -
    sum(14.5, 20) -
    20 -
    (tw(t.nav.popular, 14.5, W600) + 20 + tw(t.nav.catalogSite, 14, W400) + 20 + 21 + order(true))
  );
}

test('every item of the group bar shows from 768 px, in both languages', () => {
  for (const vw of [768, 820, 899, 900, 1023, 1024, 1100, 1179, 1279, 1280, 1366, 1440, 1920])
    for (const lang of ['tr', 'en'] as const) {
      const s = slack(vw, lang);
      assert.ok(s >= 0, `${lang} ${vw} px: ${Math.round(-s)} px short`);
    }
});
