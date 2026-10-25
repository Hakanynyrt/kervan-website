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
 * 404 page: thumbnails and names only. `numbered` makes the home's cards: the groups in the order
 * of the opening picture's numbers, each with its number, a small picture, the name and one line
 * (`short`); the groups not on the picture follow without a number.
 */
export function PartGroups({
  lang,
  t,
  tips,
  compact = false,
  numbered,
}: {
  lang: Lang;
  t: Dict;
  /** Build-time tip render; without it the tips tile shows our stock photo. */
  tips?: TipGroupStats;
  compact?: boolean;
  /** Group keys ('tips' or a part group) in the opening picture's order. */
  numbered?: readonly string[];
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
      alt: t.parts.groupAlt(t.parts.tips.name),
    },
    ...PART_KEYS.map((k) => ({
      key: k as string,
      path: partPath(k),
      hero: GROUP_COVERS[k]?.base ?? PART_RENDERS[k].find((r) => r.hero)?.hero,
      contain: GROUP_COVERS[k]?.contain ?? false,
      xs: GROUP_COVERS[k] ? (GROUP_COVERS[k].xs ?? false) : true,
      ...t.parts.items[k],
      alt: t.parts.groupAlt(t.parts.items[k].h1),
    })),
  ];

  if (numbered) {
    const rank = (k: string) => (numbered.includes(k) ? numbered.indexOf(k) : numbered.length);
    return (
      <ol className="m-0 grid list-none grid-cols-1 gap-2 p-0 md:grid-cols-2 md:gap-2.5 min-[73.75rem]:grid-cols-3">
        {[...groups]
          .sort((a, b) => rank(a.key) - rank(b.key))
          .map((g) => {
            const n = numbered.indexOf(g.key) + 1;
            const tip = !g.hero && Boolean(tips?.image);
            return (
              <li key={g.key}>
                <a
                  href={localePath(g.path, lang)}
                  className={`group grid h-full grid-cols-[auto_104px_minmax(0,1fr)] items-center gap-3 rounded-md border border-hair bg-bg px-2.5 py-2 font-sans hover:border-hair-strong lg:grid-cols-[auto_150px_minmax(0,1fr)] lg:gap-3.5 lg:py-2.5 lg:pl-3 lg:pr-3.5 ${FOCUS}`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-flex size-[26px] items-center justify-center rounded-full border-[1.5px] border-ink-mid bg-bg text-[12.5px] font-semibold text-ink tabular-nums group-hover:border-brand group-hover:bg-brand group-hover:text-on-brand lg:size-7 lg:text-[13px] ${n ? '' : 'invisible'}`}
                  >
                    {n || ''}
                  </span>
                  <span
                    className={`relative block aspect-video overflow-hidden rounded-sm border border-hair ${tip ? 'bg-stage' : 'bg-pstage'}`}
                  >
                    <img
                      src={
                        g.hero
                          ? photoImg(g.hero, g.xs ? 'xs' : 'lg')
                          : tips?.image
                            ? tipImg(tips.image)
                            : photoImg(stock, 'sm')
                      }
                      width={g.hero ? 320 : tip ? 800 : 480}
                      height={g.hero ? 180 : tip ? 533 : 360}
                      alt={g.alt}
                      loading="lazy"
                      decoding="async"
                      className={`absolute inset-0 h-full w-full ${g.contain || tip ? 'object-contain' : 'object-cover'}`}
                    />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[15px] font-semibold leading-snug text-ink group-hover:text-brand-hi lg:text-base">
                      {g.name}
                    </span>
                    <span className="mt-0.5 text-[12.5px] leading-snug text-ink-mid lg:text-[13px]">
                      {g.short}
                    </span>
                    <span className="mt-1 hidden text-[13px] font-medium text-brand-hi group-hover:underline md:block">
                      {t.parts.view} →
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
      </ol>
    );
  }

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
                  alt={g.alt}
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
                    alt={g.alt}
                    loading="lazy"
                    decoding="async"
                    className={`absolute inset-0 h-full w-full ${g.contain ? 'object-contain' : 'object-cover'}`}
                  />
                ) : lead && tips?.image ? (
                  <img
                    src={tipImg(tips.image)}
                    width={800}
                    height={533}
                    alt={g.alt}
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
                    alt={g.alt}
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
