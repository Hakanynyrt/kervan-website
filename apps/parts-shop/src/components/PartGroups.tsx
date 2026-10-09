import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { PART_RENDERS, renderStats, STOCK_TIP_PHOTOS } from '../lib/photos';
import { LIST_PATH, PART_KEYS, partPath } from '../lib/routes';
import { tipImg } from '../lib/tip-img';
import type { Lang, TipGroupStats } from '../types';
import { FOCUS } from './Layout';

/**
 * Tiles for the product groups: breaker tips first (a wide lead tile on large screens), then
 * the other parts. Every tile has the same 16:9 dark-stage picture frame and a count line
 * computed from the renders (parts) or the page model (tips). `compact` is the small variant
 * for the empty cart and the 404 page: thumbnails and names only, no numbers.
 */
export function PartGroups({
  lang,
  t,
  tips,
  demo = false,
  compact = false,
}: {
  lang: Lang;
  t: Dict;
  /** Build-time tip counts and render; without it the tips tile shows our stock photo. */
  tips?: TipGroupStats;
  /** DEMO catalogue: its tip counts are not real, so the tips tile shows none. */
  demo?: boolean;
  compact?: boolean;
}) {
  const stock = STOCK_TIP_PHOTOS[0];
  const groups = [
    {
      key: 'tips',
      path: LIST_PATH,
      hero: undefined as string | undefined,
      count: tips && !demo ? t.parts.groupCount(tips.models, tips.makes) : null,
      ...t.parts.tips,
    },
    ...PART_KEYS.map((k) => {
      const s = renderStats(PART_RENDERS[k]);
      return {
        key: k as string,
        path: partPath(k),
        hero: PART_RENDERS[k].find((r) => r.hero)?.hero,
        count: s.models > 0 ? t.parts.groupCount(s.models, s.makes) : null,
        ...t.parts.items[k],
      };
    }),
  ];

  if (compact)
    return (
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">
        {groups.map((g) => (
          <li key={g.key}>
            <a
              href={localePath(g.path, lang)}
              className={`group flex h-full flex-col overflow-hidden rounded-sm border border-hair bg-bg hover:border-hair-strong ${FOCUS}`}
            >
              <div className="relative aspect-video border-b border-hair bg-stage">
                <img
                  src={g.hero ? `${g.hero}-xs.webp` : `${stock}-sm.webp`}
                  width={320}
                  height={180}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <span className="p-3 font-sans text-sm font-semibold text-ink group-hover:text-brand-hi">
                {g.name}
              </span>
            </a>
          </li>
        ))}
      </ul>
    );

  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => {
        const lead = g.key === 'tips';
        return (
          <li key={g.key} className={lead ? 'lg:col-span-2' : undefined}>
            <a
              href={localePath(g.path, lang)}
              className={`group flex h-full flex-col overflow-hidden rounded-sm border border-hair bg-bg hover:border-hair-strong ${lead ? 'lg:flex-row' : ''} ${FOCUS}`}
            >
              <div
                className={`relative aspect-[16/9] border-b border-hair bg-stage ${lead ? 'lg:aspect-auto lg:w-[58%] lg:shrink-0 lg:border-b-0 lg:border-r' : ''}`}
              >
                {g.hero ? (
                  <img
                    src={`${g.hero}-lg.webp`}
                    width={1600}
                    height={900}
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : lead && tips?.image ? (
                  <img
                    src={tipImg(tips.image, 'md')}
                    srcSet={`${tipImg(tips.image, 'sm')} 480w, ${tipImg(tips.image, 'md')} 800w`}
                    sizes="(min-width: 1024px) 760px, (min-width: 640px) 50vw, 100vw"
                    width={800}
                    height={533}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-contain p-2"
                  />
                ) : lead ? (
                  <img
                    src={`${stock}-lg.webp`}
                    srcSet={`${stock}-sm.webp 480w, ${stock}-lg.webp 960w`}
                    sizes="(min-width: 1024px) 760px, (min-width: 640px) 50vw, 100vw"
                    width={960}
                    height={720}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className={`flex flex-1 flex-col p-4 ${lead ? 'lg:justify-center lg:p-6' : ''}`}>
                <h3 className="m-0 font-sans text-lg font-semibold text-ink">{g.name}</h3>
                {g.count && (
                  <p className="m-0 mt-1 font-sans text-sm font-medium tabular-nums text-ink-soft">
                    {g.count}
                  </p>
                )}
                <p className="m-0 mt-2 font-sans text-sm text-ink-mid">{g.body}</p>
                <div className={`mt-auto pt-4 ${lead ? 'lg:mt-6' : ''}`}>
                  <span className="block border-t border-hair pt-3 font-sans text-sm font-medium text-brand-hi group-hover:underline">
                    {t.parts.view} →
                  </span>
                </div>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
