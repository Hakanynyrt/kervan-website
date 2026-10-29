import { Link } from 'react-router-dom';
import type { DictBlock, Lang } from '../types';
import { useLocalePath } from '../lib/locale-path';
import { shopUrl } from '../lib/shop';
import { BTN, WRAP } from '../lib/ui';
import { ArrowOut, ArrowRight } from './icons';

interface Props {
  t: DictBlock;
  lang: Lang;
}

/** `-w1280.webp` photos also have a `-w640.webp` copy for phones. */
const srcSet = (img: string) =>
  img.endsWith('-w1280.webp')
    ? `${img.replace('-w1280.webp', '-w640.webp')} 640w, ${img} 1280w`
    : undefined;

/**
 * The four product families (`#products`): large cards (2 × 2 on every width) that open the
 * product pages, then the dark shop bar and the sizes note.
 */
export default function Products({ t, lang }: Props) {
  const to = useLocalePath();
  const p = t.products;
  return (
    <section id="products" aria-labelledby="products-title" className="pb-14 min-[721px]:pb-[88px]">
      <div className={WRAP}>
        <div className="mb-3 min-[721px]:mb-5 min-[721px]:flex min-[721px]:items-baseline min-[721px]:justify-between gap-4">
          <h2
            id="products-title"
            className="m-0 font-sans font-bold text-ink text-2xl min-[721px]:text-[32px] leading-[1.1] tracking-[-0.025em]"
          >
            {p.title}
          </h2>
          <p className="max-[720px]:hidden m-0 text-base text-ink-mid">{p.aside}</p>
        </div>
        <div className="kv-cards">
          {p.items.map((it) => (
            <Link key={it.name} to={to(`/urunler/${it.slug}`)} className="kv-card">
              <div className="kv-card-ph">
                <img
                  src={it.img}
                  srcSet={srcSet(it.img)}
                  sizes="(max-width: 720px) 50vw, 600px"
                  width={1280}
                  height={720}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="kv-card-bd">
                <h3>{it.name}</h3>
                <p>{it.desc}</p>
                <span className="kv-card-go">
                  {t.productsPage.detail} <ArrowRight />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="kv-shopbar">
          <div>
            <b>{t.shop.listCta}</b>
            <span>kiriciparca.com</span>
          </div>
          {/* The sister shop: same tab, no rel. */}
          <a href={shopUrl('/', lang)} hrefLang={lang} className={BTN}>
            {t.shop.nav}
            <ArrowOut />
          </a>
        </div>
        <p className="m-0 mt-3.5 text-[15px] text-ink-mid">{t.productDetail.sizesNote}</p>
      </div>
    </section>
  );
}
