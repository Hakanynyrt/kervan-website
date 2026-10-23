import type { TipType } from '@kervan/tips';
import type { Lang } from '../types';
import { fmtNum } from './format';
import { localePath } from './locale-path';
import { photoImg } from './photo-url';
import type { BreakerCard } from './routes';
import { tipImg } from './tip-img';

/** React key of a breaker card: a breaker with two tip sizes has two cards. */
export const cardKey = (c: BreakerCard): string =>
  c.variant ? `${c.slug}~${c.variant.n}` : c.slug;

/** A card's name: the breaker, plus the tip size when the breaker takes more than one. */
export const cardName = (c: BreakerCard, lang: Lang): string =>
  c.variant && c.diameterMm !== null
    ? `${c.name} · Ø${fmtNum(c.diameterMm, lang)}${c.variant.lengthMm ? ` × ${fmtNum(c.variant.lengthMm, lang)}` : ''} mm`
    : c.name;

/**
 * The breaker page, opened on the card's tip size (`?uc=`) and, from a filtered search, its type.
 * The first size is the page's default, so its card links the clean URL (the canonical): every
 * breaker page then has a plain link without a query, and crawl budget is not spent on `?uc=1`.
 */
export const cardHref = (c: BreakerCard, lang: Lang, tip?: TipType | null): string => {
  const sp = new URLSearchParams();
  if (c.variant && c.variant.n > 1) sp.set('uc', String(c.variant.n));
  if (tip && c.types.includes(tip)) sp.set('tip', tip);
  const q = sp.toString();
  return localePath(c.path, lang) + (q ? `?${q}` : '');
};

/**
 * A card's picture: the owner's real photo of the model's tips (`BREAKER_PHOTOS`, unlabelled),
 * else its own tip render, else the labelled sample render; null when it has none.
 */
export const cardPic = (c: {
  photo?: string;
  image?: string | null;
  sample?: string | true;
  img?: string;
}): { src: string; photo: boolean; sample: boolean } | null => {
  if (c.photo) return { src: photoImg(c.photo, 'sm'), photo: true, sample: false };
  const key = c.image ?? (typeof c.sample === 'string' ? c.sample : undefined) ?? c.img;
  if (!key) return null;
  return { src: tipImg(key), photo: false, sample: c.sample === true || (!c.image && !c.img) };
};
