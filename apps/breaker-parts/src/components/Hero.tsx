import type { DictBlock } from '../types';
import { BTN_LINE, BTN_PRIMARY, WRAP } from '../lib/ui';
import { WHATSAPP_URL } from '../lib/contact';
import { HERO_PHOTO } from '../lib/home-photos';
import { ChatIcon } from './icons';

interface Props {
  t: DictBlock;
}

/**
 * First screen: the lathe photo full-bleed with a solid, page-coloured text panel at its bottom
 * left: H1, one sentence, "Teklif Al" + WhatsApp. Phones: a 112 px band of the photo, then the
 * text. The fact table follows right below (Facts). No entrance animation: the heading is the
 * LCP text and the page is prerendered. The photo drifts a few percent larger over a long,
 * one-way CSS animation (`kv-hero-drift`, off for reduced motion).
 */
export default function Hero({ t }: Props) {
  const h = t.hero;
  const photo = t.atolye.items.find((i) => i.img === HERO_PHOTO);
  const alt = photo ? `${photo.name}: ${photo.desc}` : '';
  return (
    <section id="top" aria-labelledby="hero-title" className="kv-hero">
      <div className="kv-hero-photo">
        <img
          src={HERO_PHOTO}
          width={1280}
          height={960}
          alt={alt}
          loading="eager"
          // React 18 only knows the lowercase attribute (fetchPriority warns in SSR and on the client).
          {...{ fetchpriority: 'high' }}
          decoding="async"
          className="kv-hero-drift"
        />
        {photo && (
          <p className="kv-chip kv-hero-caption">
            {photo.name} · {photo.desc}
          </p>
        )}
      </div>
      <div className={`${WRAP} kv-hero-wrap`}>
        <div className="kv-hero-panel">
          <h1
            id="hero-title"
            className="m-0 font-sans font-bold text-ink text-[30px] leading-[1.08] tracking-[-0.025em] min-[721px]:text-[50px] min-[721px]:leading-[1.04] min-[721px]:tracking-[-0.035em] text-balance"
          >
            {h.title1} {h.title2}
          </h1>
          <p className="m-0 mt-2 min-[721px]:mt-4 font-sans text-[15px] leading-[1.45] min-[721px]:text-lg min-[721px]:leading-[1.55] text-ink-mid max-w-[500px]">
            {h.sub}
          </p>
          <div className="mt-3.5 min-[721px]:mt-[26px] grid grid-cols-2 gap-2.5 min-[721px]:flex min-[721px]:flex-wrap min-[721px]:items-center min-[721px]:gap-3">
            <a href="#contact" className={`${BTN_PRIMARY} max-[720px]:px-3`}>
              {h.cta}
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BTN_LINE} max-[720px]:px-3`}
            >
              <ChatIcon />
              {t.contact.whatsappLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
