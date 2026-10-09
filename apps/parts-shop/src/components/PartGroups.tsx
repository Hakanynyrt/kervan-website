import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { PART_PHOTOS, PART_RENDERS, STOCK_TIP_PHOTOS } from '../lib/photos';
import { LIST_PATH, PART_KEYS, partPath } from '../lib/routes';
import type { Lang } from '../types';
import { Photo } from './Bits';
import { FOCUS } from './Layout';

/** Tiles for the product groups: breaker tips first, then the other parts. */
export function PartGroups({ lang, t }: { lang: Lang; t: Dict }) {
  const groups = [
    { key: 'tips', path: LIST_PATH, photo: STOCK_TIP_PHOTOS[0], hero: undefined, ...t.parts.tips },
    ...PART_KEYS.map((k) => ({
      key: k,
      path: partPath(k),
      photo: PART_PHOTOS[k][0] as string | undefined,
      hero: PART_RENDERS[k].find((r) => r.hero)?.hero,
      ...t.parts.items[k],
    })),
  ];
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => (
        <li key={g.key}>
          <a
            href={localePath(g.path, lang)}
            className={`group flex h-full flex-col gap-3 rounded-md border border-hair bg-bg p-3 hover:border-hair-strong ${FOCUS}`}
          >
            {g.hero ? (
              <img
                src={`${g.hero}-lg.webp`}
                width={480}
                height={360}
                alt=""
                loading="lazy"
                decoding="async"
                className="block aspect-[4/3] h-auto w-full rounded-md border border-hair bg-stage object-cover"
              />
            ) : (
              g.photo && <Photo base={g.photo} alt="" />
            )}
            <span className="px-1 font-sans text-lg font-semibold text-ink">{g.name}</span>
            <span className="px-1 font-sans text-sm text-ink-mid">{g.body}</span>
            <span className="mt-auto px-1 pb-1 font-sans text-sm font-medium text-brand-hi group-hover:underline">
              {t.parts.view} →
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
