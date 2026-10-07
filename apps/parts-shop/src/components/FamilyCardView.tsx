import type { Dict } from '../lib/dict';
import { fmtNum } from '../lib/format';
import { localePath } from '../lib/locale-path';
import type { BreakerCard } from '../lib/routes';
import { tipImg } from '../lib/tip-img';
import type { Lang } from '../types';
import { FOCUS } from './Layout';

/** A product card: the breaker model first, then its tip's working diameter and types. */
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
          className="block h-auto w-full bg-stage"
        />
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="font-sans text-lg font-semibold text-ink">{c.name}</span>
        <span className="font-sans text-sm text-ink-mid">
          Ø{fmtNum(c.diameterMm, lang)} mm · {c.types.map((x) => t.tip[x]).join(' · ')}
        </span>
        <span className="mt-auto pt-2 font-sans text-sm font-medium text-brand-hi group-hover:underline">
          {t.card.view} →
        </span>
      </div>
    </a>
  );
}
