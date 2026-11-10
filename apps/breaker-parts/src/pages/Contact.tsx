import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { fadeUp, useReducedMotion } from '@kervan/motion';
import { PRODUCT_BY_SLUG } from '../data/products';
import ContactBlock from '../components/ContactBlock';
import type { DictBlock, Lang } from '../types';
import { WRAP } from '../lib/ui';

interface Props {
  t: DictBlock;
  lang: Lang;
}

const TITLE_ID = 'contact-page-title';

export default function Contact({ t, lang }: Props) {
  const reduce = useReducedMotion();
  const [params] = useSearchParams();
  const partSlug = params.get('part');
  const part = partSlug ? PRODUCT_BY_SLUG[partSlug] : undefined;
  const prefill = part ? `${t.contact.quotePrefix} ${part[lang].name}\n\n` : '';

  return (
    <section className="pt-10 pb-16 md:pt-16 md:pb-24">
      <motion.div
        className={`${WRAP} mb-12 md:mb-16 grid grid-cols-12 gap-x-0 gap-y-8 md:gap-x-8 items-end`}
        variants={fadeUp}
        initial={reduce ? false : 'hidden'}
        animate="show"
      >
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
          <h1
            id={TITLE_ID}
            className="font-sans font-bold text-[34px] md:text-[48px] text-ink leading-[1.08] tracking-[-0.03em] text-balance"
          >
            {t.contact.title}
          </h1>
        </div>
        <p className="col-span-12 lg:col-span-5 font-sans text-lg text-ink-mid leading-relaxed max-w-[40ch]">
          {t.contact.sub}
        </p>
      </motion.div>

      <ContactBlock t={t} lang={lang} titleId={TITLE_ID} prefill={prefill} />
    </section>
  );
}
