import { motion } from 'framer-motion';
import { fadeUp, inViewOnce, useReducedMotion } from '@kervan/motion';
import { KERVAN_HEAT_URL } from '@kervan/seo';
import type { DictBlock } from '../types';
import { useLocale } from '../lib/locale-path';
import { WRAP } from '../lib/ui';

interface Props {
  t: DictBlock;
}

export default function Production({ t }: Props) {
  const reduce = useReducedMotion();
  const lang = useLocale();
  const pp = t.productionPage;
  return (
    <>
      <section className="pt-10 pb-16 md:pt-16 md:pb-24">
        <motion.div
          className={`${WRAP} mb-16 md:mb-20 grid grid-cols-12 gap-x-0 gap-y-8 md:gap-x-8 items-end`}
          variants={fadeUp}
          initial={reduce ? false : 'hidden'}
          animate="show"
        >
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
            <h1 className="font-sans font-bold text-[34px] md:text-[48px] text-ink leading-[1.08] tracking-[-0.03em] text-balance">
              {t.productionPage.title}
            </h1>
          </div>
          <p className="col-span-12 lg:col-span-5 font-sans text-lg text-ink-mid leading-relaxed max-w-[44ch]">
            {t.productionPage.body}
          </p>
        </motion.div>

        <motion.div
          className={WRAP}
          variants={fadeUp}
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={inViewOnce}
        >
          <div className="kv-ruled grid grid-cols-1 md:grid-cols-2">
            <article className="p-8 md:p-12 flex flex-col gap-5">
              <h2 className="font-sans font-bold text-2xl md:text-[32px] text-ink leading-tight tracking-[-0.02em]">
                {t.productionPage.metallurgyHeading}
              </h2>
              <p className="font-sans text-base md:text-lg text-ink-mid leading-relaxed">
                {t.productionPage.metallurgyBody}
              </p>
            </article>

            <article className="p-8 md:p-12 flex flex-col gap-5">
              <h2 className="font-sans font-bold text-2xl md:text-[32px] text-ink leading-tight tracking-[-0.02em]">
                {t.productionPage.heatHeading}
              </h2>
              <p className="font-sans text-base md:text-lg text-ink-mid leading-relaxed">
                {t.productionPage.heatBody}
              </p>
              {/* The sister site: same tab, no rel. */}
              <a
                href={lang === 'en' ? `${KERVAN_HEAT_URL}/en/` : `${KERVAN_HEAT_URL}/`}
                hrefLang={lang}
                className="group inline-flex items-center self-start min-h-11 mt-2 font-sans text-[15px] font-semibold"
              >
                <span className="text-brand group-hover:text-brand-hi transition-colors">
                  {pp.heatLink}
                </span>
              </a>
            </article>
          </div>
        </motion.div>

        <motion.div
          className={`${WRAP} mt-16 md:mt-20`}
          variants={fadeUp}
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={inViewOnce}
        >
          <dl className="kv-mat !mt-0">
            <div>
              <dt>{pp.materialsHeading}</dt>
              <dd>
                <b className="font-semibold">{pp.materials.slice(0, 2).join(' · ')}</b>
                {pp.materials.slice(2).map((m) => ` · ${m}`)}
              </dd>
            </div>
          </dl>
        </motion.div>
      </section>
    </>
  );
}
