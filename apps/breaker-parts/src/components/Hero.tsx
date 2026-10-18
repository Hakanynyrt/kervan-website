import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

const PHOTO = '/photos/uclar/uclar-pile-hero';

/**
 * First screen: headline, one sentence, two buttons and three facts on the left, one real
 * workshop photo on the right. Below 1024 px the copy and the primary button come first and
 * the photo follows. Plain markup and CSS (`.kv-hero` in globals.css): the same on the
 * prerendered page and after hydration. The photo is cropped from the original
 * (uclar-pile.jpeg) into a phone and a desktop picture, each with a 1x and a 2x file.
 */
export default function Hero({ t }: Props) {
  return (
    <section className="kv-hero" aria-label={t.hero.sectionLabel}>
      <div className="kv-hero-copy">
        <h1>
          {t.hero.title1} {t.hero.title2}
        </h1>
        <p className="kv-hero-sub">{t.hero.sub}</p>
        <div className="kv-hero-btns">
          <a href="#contact" className="kv-hero-btn kv-hero-btn--primary">
            {t.hero.cta}
          </a>
          <a href="#products" className="kv-hero-btn">
            {t.hero.ctaSecondary}
          </a>
        </div>
      </div>

      <figure className="kv-hero-photo">
        <div className="kv-hero-frame">
          <picture>
            <source
              media="(max-width: 1023px)"
              type="image/webp"
              srcSet={`${PHOTO}-mobil-768-v1.webp 768w, ${PHOTO}-mobil-1536-v1.webp 1536w`}
              sizes="calc(100vw - 32px)"
            />
            <img
              src={`${PHOTO}-1536-v1.webp`}
              srcSet={`${PHOTO}-1024-v1.webp 1024w, ${PHOTO}-1536-v1.webp 1536w`}
              sizes="53vw"
              width={1536}
              height={1536}
              alt={t.hero.photoAlt}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>
        <figcaption>{t.hero.photoCaption}</figcaption>
      </figure>

      <dl className="kv-hero-stats">
        {t.hero.stats.map((s) => (
          <div key={s.n} className="kv-hero-stat">
            <dt>
              <b>{s.n}</b>
            </dt>
            <dd style={{ margin: 0 }}>
              <span>{s.l}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
