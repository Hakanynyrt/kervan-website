import { motion } from 'framer-motion';
import {
  PageMeta,
  JsonLd,
  breadcrumbList,
  service as serviceSchema,
  KERVAN_BREAKER_URL,
} from '@kervan/seo';
import { fadeUp, inViewOnce } from '@kervan/motion';
import type { DictBlock } from '../types';

interface Props {
  t: DictBlock;
}

export default function Production({ t }: Props) {
  return (
    <>
      <PageMeta
        title="Üretim & Kalite — Kervan Breaker"
        description="42CrMo / 42CrMoA standart alaşım. Kontrollü atmosfer pit-tip fırınlarda sertleştirme + temperleme. OES spektrometre ile lot başı malzeme analizi."
        canonical={`${KERVAN_BREAKER_URL}/uretim-kalite`}
        image={`${KERVAN_BREAKER_URL}/og.png`}
      />
      <JsonLd
        schema={breadcrumbList([
          { name: 'Anasayfa', url: `${KERVAN_BREAKER_URL}/` },
          { name: 'Üretim & Kalite', url: `${KERVAN_BREAKER_URL}/uretim-kalite` },
        ])}
      />
      <JsonLd
        schema={serviceSchema({
          url: `${KERVAN_BREAKER_URL}/uretim-kalite`,
          name: 'Hidrolik kırıcı parça üretimi + ısıl işlem entegrasyonu',
          description: '42CrMo / 42CrMoA standart alaşım. Kendi pit-tip fırınımızda sertleştirme + temperleme. OES spektrometre ile lot başı malzeme analizi.',
        })}
      />

      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <motion.div
          className="max-w-[1280px] mx-auto px-6 md:px-8 mb-16 md:mb-20 grid grid-cols-12 gap-8 items-end"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
            <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium">
              {t.productionPage.eyebrow}
            </span>
            <h1 className="font-serif italic text-h1 text-ink leading-[1.05] tracking-[-0.02em]">
              {t.productionPage.title}
            </h1>
          </div>
          <p className="col-span-12 lg:col-span-5 font-serif italic text-lg text-ink-mid leading-relaxed max-w-[44ch]">
            {t.productionPage.body}
          </p>
        </motion.div>

        <motion.div
          className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-px bg-hair"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
        >
          <article className="bg-bg p-8 md:p-12 flex flex-col gap-5">
            <h2 className="font-serif italic text-3xl md:text-4xl text-ink leading-tight">
              {t.productionPage.metallurgyHeading}
            </h2>
            <p className="font-sans text-base md:text-lg text-ink-mid leading-relaxed">
              {t.productionPage.metallurgyBody}
            </p>
          </article>

          <article className="bg-bg p-8 md:p-12 flex flex-col gap-5">
            <h2 className="font-serif italic text-3xl md:text-4xl text-ink leading-tight">
              {t.productionPage.heatHeading}
            </h2>
            <p className="font-sans text-base md:text-lg text-ink-mid leading-relaxed">
              {t.productionPage.heatBody}
            </p>
            <a
              href="https://kervanheat.com"
              target="_blank"
              rel="noopener"
              className="font-sans text-sm tracking-[0.16em] uppercase text-brand hover:text-brand-hi transition-colors mt-2 inline-block"
            >
              {t.productionPage.heatLink}
            </a>
          </article>
        </motion.div>

        <motion.div
          className="max-w-[1280px] mx-auto px-6 md:px-8 mt-16 md:mt-20 flex flex-col gap-5"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
        >
          <span className="font-sans text-xs tracking-[0.2em] uppercase text-ink-soft font-medium">
            {t.productionPage.materialsHeading}
          </span>
          <div className="flex flex-wrap gap-x-8 gap-y-2 font-serif italic text-2xl md:text-3xl text-ink">
            {t.productionPage.materials.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-3">
                {i > 0 && <span aria-hidden="true" className="text-ink-soft">·</span>}
                {m}
              </span>
            ))}
          </div>
        </motion.div>
      </section>
    </>
  );
}
