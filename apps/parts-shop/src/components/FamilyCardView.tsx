import type { FxRate } from '@kervan/tips';
import type { Dict } from '../lib/dict';
import { cardHref, cardName } from '../lib/card';
import type { BreakerCard } from '../lib/routes';
import { tipImg } from '../lib/tip-img';
import type { Lang } from '../types';
import { FOCUS } from './Layout';
import { CardPrice } from './ModelSearch';

/**
 * A product card (best-sellers): the picture, the breaker model (no diameter or types: owner's
 * choice) and its price as the other priced cards show it (`CardPrice`), "Fiyat için sorun" without.
 */
export default function FamilyCardView({
  c,
  fx,
  lang,
  t,
}: {
  c: BreakerCard;
  fx: FxRate | null;
  lang: Lang;
  t: Dict;
}) {
  return (
    <a
      href={cardHref(c, lang)}
      className={`group flex h-full flex-col overflow-hidden rounded-md border border-hair bg-bg transition-colors hover:border-hair-strong ${FOCUS}`}
    >
      {c.image && (
        <img
          src={tipImg(c.image)}
          alt={t.list.cardAlt(c.name, false)}
          width={480}
          height={320}
          loading="lazy"
          decoding="async"
          className="block aspect-[3/2] h-auto w-full border-b border-hair bg-stage object-contain"
        />
      )}
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <span className="font-sans text-base font-semibold text-ink sm:text-lg">
          {cardName(c, lang, t)}
        </span>
        <span className="mt-auto flex flex-col gap-x-2 font-sans sm:flex-row sm:items-end sm:justify-between">
          <CardPrice price={c.price} fx={fx} lang={lang} t={t} />
          <span className="pt-1 text-sm font-medium text-brand-hi group-hover:underline">
            {t.card.view} →
          </span>
        </span>
      </div>
    </a>
  );
}
