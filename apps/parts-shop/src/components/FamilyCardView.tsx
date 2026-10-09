import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import type { BreakerCard } from '../lib/routes';
import { tipImg } from '../lib/tip-img';
import type { Lang } from '../types';
import { FOCUS } from './Layout';

/** A product card: the picture and the breaker model (no diameter or types: owner's choice). */
export default function FamilyCardView({ c, lang, t }: { c: BreakerCard; lang: Lang; t: Dict }) {
  return (
    <a
      href={localePath(c.path, lang)}
      className={`group flex h-full flex-col overflow-hidden rounded-md border border-hair bg-bg transition-colors hover:border-hair-strong ${FOCUS}`}
    >
      {c.image && (
        <img
          src={tipImg(c.image, 'sm')}
          alt=""
          width={480}
          height={320}
          loading="lazy"
          decoding="async"
          className="block aspect-[3/2] h-auto w-full border-b border-hair bg-stage object-contain"
        />
      )}
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <span className="font-sans text-base font-semibold text-ink sm:text-lg">{c.name}</span>
        <span className="mt-auto pt-1 font-sans text-sm font-medium text-brand-hi group-hover:underline sm:pt-2">
          {t.card.view} →
        </span>
      </div>
    </a>
  );
}
