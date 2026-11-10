import { Button } from '@astryxdesign/core/Button';
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
        <Button
          as={Link}
          href={to('/')}
          label={t.notFound.cta}
          variant="primary"
          size="lg"
          endContent={<span aria-hidden="true">→</span>}
          className="kv-btn kv-btn-main"
        />
        <ShopLink lang={lang} path="/yedek-parca" text={t.shop.notFoundCta} className="mt-8" />
      </section>
    </>
  );
}
