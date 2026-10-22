import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { GROUP_COVERS, PART_RENDERS, STOCK_TIP_PHOTOS } from '../lib/photos';
import { LIST_PATH, PART_KEYS, partPath } from '../lib/routes';
import { tipImg } from '../lib/tip-img';
import type { Lang, TipGroupStats } from '../types';
import { FOCUS } from './Layout';
import { cardSet, photoImg, photoSet } from '../lib/photo-url';

/**
 * Tiles for the product groups: breaker tips first (a wide lead tile on large screens), then
 * the other parts. Every tile has the same 16:9 dark-stage picture frame, the group name and
 * its description; no counts (owner). `compact` is the small variant for the empty cart and the
 * 404 page: thumbnails and names only. `list` is the home's picture list: a small thumbnail,
 * the name and the description in rows (three columns on wide screens).
 */
export function PartGroups({
  lang,
  t,
  tips,
  compact = false,
  list = false,
}: {
  lang: Lang;
  t: Dict;
  /** Build-time tip render; without it the tips tile shows our stock photo. */
  tips?: TipGroupStats;
  compact?: boolean;
  list?: boolean;
}) {
  const stock = STOCK_TIP_PHOTOS[0];
  const groups = [
    {
      key: 'tips',
      path: LIST_PATH,
      hero: undefined as string | undefined,
      contain: false,
      xs: true,
      ...t.parts.tips,
    },
    ...PART_KEYS.map((k) => ({
      key: k as string,
      path: partPath(k),
      hero: GROUP_COVERS[k]?.base ?? PART_RENDERS[k].find((r) => r.hero)?.hero,
      contain: GROUP_COVERS[k]?.contain ?? false,
      xs: GROUP_COVERS[k] ? (GROUP_COVERS[k].xs ?? false) : true,
      ...t.parts.items[k],
    })),
  ];

  if (list)
    return (
      <ul className="m-0 grid list-none grid-cols-1 gap-x-8 border-t border-hair p-0 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <li key={g.key} className="border-b border-hair">
            <a
              href={localePath(g.path, lang)}
              className={`group flex h-full items-start gap-4 py-4 font-sans ${FOCUS}`}
            >
              <span className="relative block aspect-video w-28 shrink-0 overflow-hidden rounded-sm border border-hair bg-pstage">
                {g.hero ? (
                  <img
                    src={photoImg(g.hero, g.xs ? 'xs' : 'lg')}
                    width={320}
                    height={180}
                    alt={g.name}
                    loading="lazy"
                    decoding="async"
                    className={`absolute inset-0 h-full w-full ${g.contain ? 'object-contain' : 'object-cover'}`}
                  />
                ) : tips?.image ? (
                  <img
                    src={tipImg(tips.image)}
                    width={800}
                    height={533}
                    alt={g.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : (
                  <img
                    src={photoImg(stock, 'sm')}
                    width={480}
                    height={360}
                    alt={t.family.stockAlt(1)}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-base font-semibold text-ink group-hover:text-brand-hi">
                  {g.name}
                </span>
                <span className="mt-1 text-sm text-ink-mid">{g.body}</span>
                <span className="mt-1.5 text-sm font-medium text-brand-hi group-hover:underline">
                  {t.parts.view} →
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    );

  if (compact)
    return (
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">
        {groups.map((g) => (
          <li key={g.key}>
            <a
              href={localePath(g.path, lang)}
              className={`group flex h-full flex-col overflow-hidden rounded-sm border border-hair bg-bg hover:border-hair-strong ${FOCUS}`}
            >
              <div className="relative aspect-video border-b border-hair bg-pstage">
                <img
                  src={g.hero ? photoImg(g.hero, g.xs ? 'xs' : 'lg') : photoImg(stock, 'sm')}
                  width={320}
                  height={180}
                  alt={g.hero ? g.name : t.family.stockAlt(1)}
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 h-full w-full ${g.contain ? 'object-contain' : 'object-cover'}`}
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
                className={`relative aspect-[16/9] border-b border-hair bg-pstage ${lead ? 'lg:aspect-auto lg:w-[58%] lg:shrink-0 lg:border-b-0 lg:border-r' : ''}`}
              >
                {g.hero ? (
                  <img
                    src={photoImg(g.hero, 'lg')}
                    srcSet={g.xs ? cardSet(g.hero) : undefined}
                    width={1600}
                    height={900}
                    sizes={
                      g.xs
                        ? '(min-width: 1024px) 380px, (min-width: 640px) 50vw, calc(100vw - 2rem)'
                        : undefined
                    }
                    alt={g.name}
                    loading="lazy"
                    decoding="async"
                    className={`absolute inset-0 h-full w-full ${g.contain ? 'object-contain' : 'object-cover'}`}
                  />
                ) : lead && tips?.image ? (
                  <img
                    src={tipImg(tips.image)}
                    width={800}
                    height={533}
                    alt={g.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-contain p-2"
                  />
                ) : lead ? (
                  <img
                    src={photoImg(stock, 'lg')}
                    srcSet={photoSet(stock, ['sm', 480], ['lg', 960])}
                    sizes="(min-width: 1024px) 760px, (min-width: 640px) 50vw, 100vw"
                    width={960}
                    height={720}
                    alt={t.family.stockAlt(1)}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className={`flex flex-1 flex-col p-4 ${lead ? 'lg:justify-center lg:p-6' : ''}`}>
                <h3 className="m-0 font-sans text-lg font-semibold text-ink">{g.name}</h3>
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
