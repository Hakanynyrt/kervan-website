import { Link } from 'react-router-dom';
import { PageMeta } from '@kervan/seo';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

export default function NotFound({ t }: Props) {
  return (
    <>
      <PageMeta title="404 — Kervan Breaker" />
      <section className="min-h-[70dvh] flex flex-col justify-center items-center pt-32 pb-16 text-center px-6">
        <h1 className="font-serif italic text-h1 text-ink mb-6">{t.notFound.title}</h1>
        <p className="font-serif italic text-lg text-ink-mid max-w-[44ch] mb-8">
          {t.notFound.body}
        </p>
        <Link
          to="/"
          className="bg-brand text-bg px-7 py-3 font-sans text-sm tracking-wide hover:bg-brand-hi transition-colors"
        >
          {t.notFound.cta} →
        </Link>
      </section>
    </>
  );
}
