import { Link } from 'react-router-dom';
import { useLocale, useLocalePath } from '../lib/locale-path';
import ShopLink from '../components/ShopLink';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

export default function NotFound({ t }: Props) {
  const to = useLocalePath();
  const lang = useLocale();
  return (
    <>
      <section className="min-h-[70dvh] flex flex-col justify-center items-center pt-10 pb-16 text-center px-6">
        <h1 className="font-sans font-bold text-[34px] md:text-[48px] text-ink leading-[1.08] tracking-[-0.03em] text-balance mb-6">
          {t.notFound.title}
        </h1>
        <p className="font-sans text-lg text-ink-mid max-w-[44ch] mb-8">{t.notFound.body}</p>
        <Link
          to={to('/')}
          className="bg-brand text-on-brand rounded-[2px] font-semibold px-7 py-3 font-sans text-sm tracking-wide hover:bg-brand-hi transition-colors"
        >
          {t.notFound.cta} →
        </Link>
        <ShopLink lang={lang} path="/yedek-parca" text={t.shop.notFoundCta} className="mt-8" />
      </section>
    </>
  );
}
