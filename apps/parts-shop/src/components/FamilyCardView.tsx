import type { Dict } from '../lib/dict';
import { fmtNum } from '../lib/format';
import { localePath } from '../lib/locale-path';
import type { FamilyCard } from '../lib/routes';
import type { Lang } from '../types';

export default function FamilyCardView({ c, lang, t }: { c: FamilyCard; lang: Lang; t: Dict }) {
  return (
    <a
      href={localePath(c.path, lang)}
      className="group flex h-full flex-col gap-3 rounded-md border border-hair bg-bg-soft p-5 transition-colors hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
    >
      {c.image && (
        <img
          src={`/tips/${c.image}-480.webp`}
          alt=""
          width={480}
          height={320}
          loading="lazy"
          decoding="async"
          className="-mx-2 -mt-2 block h-auto w-[calc(100%+1rem)] max-w-none"
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <span className="font-serif text-2xl text-ink">Ø{fmtNum(c.diameterMm, lang)}</span>
        {c.popularTier !== null && (
          <span className="rounded-pill border border-brand px-2.5 py-0.5 text-xs font-medium text-brand-hi">
            {t.card.popular}
          </span>
        )}
      </div>
      <span className="font-sans text-sm tracking-wide text-ink-mid">{c.code}</span>
      <span className="font-sans text-sm text-ink">{c.types.map((x) => t.tip[x]).join(' · ')}</span>
      {c.fits.length > 0 && (
        <span className="font-sans text-xs text-ink-mid">
          {t.card.fits}: {c.fits.join(', ')}
          {c.fitsMore > 0 && ` ${t.card.more(c.fitsMore)}`}
        </span>
      )}
      <span className="mt-auto font-sans text-sm text-brand-hi group-hover:underline">
        {t.card.view} →
      </span>
    </a>
  );
}
