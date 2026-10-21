import type { TipType } from '@kervan/tips';
import type { Lang } from '../types';
import { fmtNum } from './format';
import { localePath } from './locale-path';
import type { BreakerCard } from './routes';

/** React key of a breaker card: a breaker with two tip sizes has two cards. */
export const cardKey = (c: BreakerCard): string =>
  c.variant ? `${c.slug}~${c.variant.n}` : c.slug;

/** A card's name: the breaker, plus the tip size when the breaker takes more than one. */
export const cardName = (c: BreakerCard, lang: Lang): string =>
  c.variant && c.diameterMm !== null
    ? `${c.name} · Ø${fmtNum(c.diameterMm, lang)}${c.variant.lengthMm ? ` × ${fmtNum(c.variant.lengthMm, lang)}` : ''} mm`
    : c.name;

/** The breaker page, opened on the card's tip size (`?uc=`) and, from a filtered search, its type. */
export const cardHref = (c: BreakerCard, lang: Lang, tip?: TipType | null): string => {
  const sp = new URLSearchParams();
  if (c.variant) sp.set('uc', String(c.variant.n));
  if (tip && c.types.includes(tip)) sp.set('tip', tip);
  const q = sp.toString();
  return localePath(c.path, lang) + (q ? `?${q}` : '');
};
