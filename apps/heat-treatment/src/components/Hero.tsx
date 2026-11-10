import { ORG_PHONE, ORG_PHONE_E164 } from '@kervan/seo';
import type { DictBlock } from '../types';
import { Button } from '@astryxdesign/core/Button';
import { ACTION, ACTION_LINE, WRAP } from '../lib/ui';

/** The hero photos. A changed picture gets a new file name. Both come from the same owner-approved
 *  frame (photo package, 2026-11): a glowing charge on its fixture at the mouth of our pit furnace.
 *  Desktop: a 1280×720 cut of it, anchored to the bottom with the charge in the left half (the text
 *  panel sits on the right), in a box capped at 1280 px so it is never upscaled. Phones: the whole
 *  frame (780 / 1170 px) as a 132 px band. */
const PHOTO = '/photos/isil-islem/hero-kizgin-sarj-02-1280.webp';
const PHOTO_PHONE =
  '/photos/isil-islem/hero-kizgin-sarj-01-780.webp 780w, /photos/isil-islem/hero-kizgin-sarj-01-1170.webp 1170w';

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
 * The page opening (`#top`): the hot-charge photo full-bleed (capped at 1280 px) with a solid,
 * page-coloured text panel at its bottom right (the charge stays visible on the left, the caption
 * chip bottom left): H1, one paragraph, "Teklif Al" + the phone.
 * Tablets (721–959 px): a 360 px photo band, then the text. Phones: a 132 px band of the hot
 * charge, then the text. The capacity spec table follows right
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
          <source
            media="(max-width: 720px)"
            srcSet={PHOTO_PHONE}
            sizes="100vw"
            width={780}
            height={634}
          />
          <img
            src={PHOTO}
            width={1280}
            height={720}
            alt={h.photo.alt}
            loading="eager"
            // React 18 only knows the lowercase attribute (fetchPriority warns in SSR and on the client).
            fetchPriority="high"
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
            <Button
              href="#contact"
              label={h.cta}
              variant="primary"
              size="lg"
              className={`${ACTION} max-[720px]:px-3`}
            />
            <Button
              href={`tel:${ORG_PHONE_E164}`}
              label={`${t.contact.phoneLabel} ${ORG_PHONE}`}
              variant="ghost"
              size="lg"
              icon={<PhoneIcon />}
              className={`${ACTION_LINE} max-[720px]:px-3`}
            >
              <span className="min-[721px]:hidden">{t.contact.phoneLabel}</span>
              <span className="max-[720px]:hidden">{ORG_PHONE}</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
