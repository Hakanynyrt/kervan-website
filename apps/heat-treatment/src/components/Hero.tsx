import { ORG_PHONE, ORG_PHONE_E164 } from '@kervan/seo';
import type { DictBlock } from '../types';
import HeroFilm from './HeroFilm';

/** The one hero photo (cut from our own plant photo; a changed picture gets a new file name). */
const PHOTO = '/photos/isil-islem/hero-uc-parcalar-01';
const PHOTO_PHONE = '/photos/isil-islem/hero-uc-parcalar-telefon-01';

interface Props {
  t: DictBlock;
}

/**
 * First screen: the heading, one paragraph and the one action ("Teklif Al") on the left,
 * one large photo on the right (below the copy on phones, so the heading and the button
 * come first). The capacity figures sit under the copy at lg+ and under the photo on phones.
 * No entrance animation: the heading is the LCP text and the page is prerendered. The photo
 * drifts a few percent larger over a long, one-way CSS animation (`kv-hero-drift`, off for
 * reduced motion). The furnace-line film (`HeroFilm`) follows as a framed card below this block.
 */
export default function Hero({ t }: Props) {
  const h = t.hero;
  return (
    <>
      <section
        id="top"
        aria-labelledby="hero-title"
        className="relative pt-[calc(6rem+var(--kv-strip-h))] lg:pt-[calc(5.5rem+var(--kv-strip-h))] lg:h-[min(100svh,1000px)] lg:min-h-[680px]"
      >
        <div className="w-full max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[1fr_auto] lg:gap-x-12 lg:h-full pb-12 lg:pb-8">
          {/* Copy: centred vertically against the photo at lg+ */}
          <div className="flex flex-col justify-center gap-5 lg:gap-6 lg:col-start-1 lg:row-start-1 pb-8 lg:pb-0">
            <h1
              id="hero-title"
              className="m-0 font-sans font-bold text-ink text-[32px] leading-[1.1] tracking-[-0.025em] sm:text-[40px] lg:text-[clamp(40px,3.9vw,60px)] lg:leading-[1.06]"
            >
              {h.title1} {h.title2}
            </h1>
            <p className="m-0 font-sans text-[17px] lg:text-xl text-ink-mid leading-[1.5] max-w-[27em]">
              {h.sub}
            </p>
            <div className="flex flex-col gap-3 lg:mt-1">
              <a
                href="#contact"
                className="bg-brand text-bg inline-flex items-center justify-center min-h-[52px] px-8 font-sans text-[17px] font-semibold hover:bg-brand-hi transition-colors w-full lg:w-fit"
              >
                {h.cta}
              </a>
              <a
                href={`tel:${ORG_PHONE_E164}`}
                className="font-sans text-[17px] font-semibold text-ink text-center lg:text-left"
              >
                <span className="font-medium text-ink-mid">{t.contact.phoneLabel}:</span>{' '}
                {ORG_PHONE}
              </a>
            </div>
          </div>

          {/* Photo: one large picture, one thin frame line, a caption */}
          <figure className="m-0 flex flex-col min-h-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <div className="kv-hero-photo relative overflow-hidden bg-bg-warm border border-hair-strong aspect-[3/2] lg:aspect-auto lg:flex-1 lg:min-h-0">
              <picture>
                <source
                  media="(max-width: 1023px)"
                  srcSet={`${PHOTO_PHONE}-780.webp 780w, ${PHOTO_PHONE}-1170.webp 1170w`}
                  sizes="calc(100vw - 3rem)"
                />
                <img
                  src={`${PHOTO}-1536.webp`}
                  srcSet={`${PHOTO}-1024.webp 1024w, ${PHOTO}-1536.webp 1536w`}
                  sizes="(min-width: 1280px) 700px, 55vw"
                  width={1536}
                  height={1250}
                  alt={h.photo.alt}
                  loading="eager"
                  // React 18 only knows the lowercase attribute (fetchPriority warns in SSR and on the client).
                  {...{ fetchpriority: 'high' }}
                  decoding="async"
                  className="kv-hero-drift absolute inset-0 w-full h-full object-cover"
                />
              </picture>
            </div>
            <figcaption className="font-sans text-[15px] font-medium text-ink leading-snug pt-3 pb-1">
              {h.photo.caption}
            </figcaption>
          </figure>

          {/* Capacity figures (the owner's numbers, not marketing claims) */}
          <dl className="m-0 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5 border-t border-hair pt-6 mt-8 lg:mt-0 lg:pt-5 lg:col-start-1 lg:row-start-2">
            {h.stats.map((s) => (
              <div key={s.l} className="flex flex-col-reverse justify-end gap-1">
                <dt className="font-sans text-[15px] font-medium text-ink-mid leading-tight">
                  {s.l}
                </dt>
                <dd className="m-0 font-sans text-2xl font-bold text-ink tracking-[-0.01em]">
                  {s.n}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Film: a framed card after the copy, photo and stats (never in the phone's first screen);
        poster first, the video mounts client-side (see HeroFilm). */}
      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-8 pb-12 lg:pb-16">
        <HeroFilm t={t} />
      </div>
    </>
  );
}
