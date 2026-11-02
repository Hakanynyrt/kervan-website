import type { DictBlock } from '../types';
import { WRAP } from '../lib/ui';

/** The furnace hall, owner-approved still from the 2026-11 photo package (heat-teknik-kapasite-2,
 *  2560×1440). One 16:9 frame serves every width: the band is wider than 16:9 from ~1070 px, so the
 *  box keeps the bottom of the frame (the furnaces) and trims the empty roof. A changed picture
 *  gets a new file name (-02). */
const BASE = '/photos/isil-islem/firin-salonu-01';
const SRCSET = [780, 1280, 1920, 2560].map((w) => `${BASE}-${w}.webp ${w}w`).join(', ');
/** Phones: the 240 px band is narrower than 16:9, so the picture is drawn ~430 px wide (cover). */
const SIZES = '(max-width: 430px) 430px, (min-width: 2560px) 2560px, 100vw';

interface Props {
  t: DictBlock;
}

/**
 * Full-bleed photo band after the capacity table (it replaced the furnace film, 2026-11-02): a
 * still photo, lazy-loaded (it is never in the first screen), the caption chip bottom right (bottom
 * left on phones, clear of the floating WhatsApp button). The box is capped at the 2560 px
 * source, so the photo is never upscaled.
 */
export default function PlantPhoto({ t }: Props) {
  const p = t.hero.plant;
  return (
    <figure className="relative m-0 bg-bg">
      <div className="kv-plant-frame relative mx-auto max-w-[2560px] overflow-hidden bg-photo-shade">
        <img
          src={`${BASE}-1280.webp`}
          srcSet={SRCSET}
          sizes={SIZES}
          width={2560}
          height={1440}
          alt={p.alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover object-[50%_100%]"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 pointer-events-none">
        <div className={`${WRAP} flex justify-start pb-4 min-[721px]:justify-end min-[721px]:pb-8`}>
          <figcaption className="kv-chip">{p.caption}</figcaption>
        </div>
      </div>
    </figure>
  );
}
