import { ORG_PHONE, ORG_PHONE_E164 } from '@kervan/seo';
import type { DictBlock } from '../types';
import { BTN_LINE, BTN_PRIMARY, WRAP } from '../lib/ui';

/** The hero photo: our own pot frames (owner, 2026-10-28: show the pots). A changed picture gets a new
 *  file name. Desktop 1280×720, shown in a box capped at 1280 px so it is never upscaled; phones get a
 *  1080×1920 frame cropped to a 132 px band of the open pot. */
const PHOTO = '/photos/isil-islem/hero-pota-01-1280.webp';
const PHOTO_PHONE = '/photos/isil-islem/hero-pota-telefon-01-1080.webp';

interface Props {
  t: DictBlock;
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className="flex-none"
    >
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

/**
 * The page opening (`#top`): the pot photo full-bleed (capped at 1280 px) with a solid,
 * page-coloured text panel at its bottom left: H1, one paragraph, "Teklif Al" + the phone.
 * Phones: a 132 px band of the photo, then the text. The capacity spec table follows right
 * below (TechnicalCapacity). No entrance animation: the heading is the LCP text and the page is
 * prerendered. The photo drifts a few percent larger over a long, one-way CSS animation
 * (`kv-hero-drift`, off for reduced motion).
 */
export default function Hero({ t }: Props) {
  const h = t.hero;
  return (
    <section id="top" aria-labelledby="hero-title" className="kv-hero">
      <div className="kv-hero-photo">
        <picture>
          <source media="(max-width: 720px)" srcSet={PHOTO_PHONE} width={1080} height={1920} />
          <img
            src={PHOTO}
            width={1280}
            height={720}
            alt={h.photo.alt}
            loading="eager"
            // React 18 only knows the lowercase attribute (fetchPriority warns in SSR and on the client).
            {...{ fetchpriority: 'high' }}
            decoding="async"
            className="kv-hero-drift"
          />
        </picture>
        <p className="kv-chip kv-hero-caption">{h.photo.caption}</p>
      </div>
      <div className={`${WRAP} kv-hero-wrap`}>
        <div className="kv-hero-panel">
          <h1
            id="hero-title"
            className="m-0 font-sans font-bold text-ink text-[26px] leading-[1.14] tracking-[-0.02em] min-[721px]:text-[46px] min-[721px]:leading-[1.06] min-[721px]:tracking-[-0.03em]"
          >
            {h.title1} {h.title2}
          </h1>
          <p className="m-0 mt-2 min-[721px]:mt-4 font-sans text-[15px] leading-[1.45] min-[721px]:text-lg min-[721px]:leading-[1.55] text-ink-mid max-w-[520px]">
            {h.sub}
          </p>
          <div className="mt-3.5 min-[721px]:mt-[26px] grid grid-cols-2 gap-2.5 min-[721px]:flex min-[721px]:flex-wrap min-[721px]:items-center min-[721px]:gap-3">
            <a href="#contact" className={`${BTN_PRIMARY} max-[720px]:px-3`}>
              {h.cta}
            </a>
            <a href={`tel:${ORG_PHONE_E164}`} className={`${BTN_LINE} max-[720px]:px-3`}>
              <PhoneIcon />
              <span className="min-[721px]:hidden">{t.contact.phoneLabel}</span>
              <span className="max-[720px]:hidden">{ORG_PHONE}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
