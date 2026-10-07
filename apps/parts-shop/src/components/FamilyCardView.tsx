import type { Dict } from '../lib/dict';
import { fmtNum } from '../lib/format';
import { localePath } from '../lib/locale-path';
import type { FamilyCard } from '../lib/routes';
import { tipImg } from '../lib/tip-img';
import type { Lang } from '../types';
import { FOCUS } from './Layout';

export default function FamilyCardView({ c, lang, t }: { c: FamilyCard; lang: Lang; t: Dict }) {
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
          className="block h-auto w-full border-b border-hair bg-bg-warm"
        />
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="font-sans text-xs font-medium text-ink-mid">{c.code}</span>
        <span className="font-sans text-lg font-semibold text-ink">
          Ø{fmtNum(c.diameterMm, lang)} mm
        </span>
        <span className="font-sans text-sm text-ink">
          {c.types.map((x) => t.tip[x]).join(' · ')}
        </span>
        {c.fits.length > 0 && (
          <span className="font-sans text-xs text-ink-mid">
            {t.card.fits}: {c.fits.join(', ')}
            {c.fitsMore > 0 && ` ${t.card.more(c.fitsMore)}`}
          </span>
        )}
        <span className="mt-auto pt-2 font-sans text-sm font-medium text-brand-hi group-hover:underline">
          {t.card.view} →
        </span>
      </div>
    </a>
  );
}
