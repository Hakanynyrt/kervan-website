import { motion } from 'framer-motion';
import {
  PageMeta,
  JsonLd,
  breadcrumbList,
  KERVAN_BREAKER_URL,
} from '@kervan/seo';
import { fadeUp } from '@kervan/motion';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

export default function About({ t }: Props) {
  return (
    <>
      <PageMeta
        title="Hakkımızda — Kervan Breaker"
        description="Kervan Makina, Kartepe / Kocaeli'de fason ısıl işlem ve hidrolik kırıcı yedek parça üreten aile şirketi."
        canonical={`${KERVAN_BREAKER_URL}/hakkimizda`}
        image={`${KERVAN_BREAKER_URL}/og.png`}
      />
      <JsonLd
        schema={breadcrumbList([
          { name: 'Anasayfa', url: `${KERVAN_BREAKER_URL}/` },
          { name: 'Hakkımızda', url: `${KERVAN_BREAKER_URL}/hakkimizda` },
        ])}
      />

      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <motion.div
          className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-12 gap-8 md:gap-16 items-start"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
            <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium">
              {t.aboutPage.eyebrow}
            </span>
            <h1 className="font-serif italic text-h1 text-ink leading-[1.05] tracking-[-0.02em]">
              {t.aboutPage.title}
            </h1>
            <span className="font-sans text-sm text-ink-soft mt-2">
              {t.aboutPage.location}
            </span>
            <span className="font-sans text-sm text-ink-soft">
              {t.aboutPage.company}
            </span>
          </div>

          <p className="col-span-12 lg:col-span-8 font-serif text-xl md:text-2xl text-ink-mid leading-relaxed italic max-w-[60ch]">
            {t.aboutPage.body}
          </p>
        </motion.div>
      </section>
    </>
  );
}
