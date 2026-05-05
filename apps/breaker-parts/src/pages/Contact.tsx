import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { fadeUp, inViewOnce } from '@kervan/motion';
import { PRODUCT_BY_SLUG } from '../data/products';
import { UseDocTitle } from '../components/UseDocTitle';
import type { DictBlock, Lang } from '../types';

interface Props {
  t: DictBlock;
  lang: Lang;
}

type State = 'idle' | 'sending' | 'success' | 'error';

/** RFQ endpoint — same Cloudflare Worker that serves kervanheat.com.
 *  In dev, posts to local /api/rfq (404 expected). In prod, cross-origin
 *  POST to kervanheat.com — Worker validates Origin against an allowlist. */
const RFQ_ENDPOINT = import.meta.env.PROD
  ? 'https://kervanheat.com/api/rfq'
  : '/api/rfq';

export default function Contact({ t, lang }: Props) {
  const [params] = useSearchParams();
  const partSlug = params.get('part');
  const prefilledPart = partSlug ? PRODUCT_BY_SLUG[partSlug] : undefined;
  const prefilledMessage = prefilledPart
    ? `${t.contactPage.quotePrefix} ${prefilledPart[lang].name}\n\n`
    : '';

  const [state, setState] = useState<State>('idle');
  const [kvkk, setKvkk] = useState(false);
  const [message, setMessage] = useState(prefilledMessage);
  const formRef = useRef<HTMLFormElement>(null);

  // If user navigates between product detail pages while on contact, refresh
  // the prefilled message accordingly.
  useEffect(() => {
    setMessage(prefilledMessage);
  }, [prefilledMessage]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!kvkk || state === 'sending' || !formRef.current) return;
    setState('sending');
    try {
      const fd = new FormData(formRef.current);
      fd.set('kvkk_consent', '1');
      const r = await fetch(RFQ_ENDPOINT, { method: 'POST', body: fd });
      const j = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        emailSent?: boolean;
      };
      const ok = r.ok && j.ok === true && j.emailSent === true;
      setState(ok ? 'success' : 'error');
      if (ok) formRef.current.reset();
    } catch {
      setState('error');
    }
  }

  return (
    <>
      <UseDocTitle
        title="İletişim — Kervan Breaker"
        description="Hidrolik kırıcı yedek parça teklifi için: ahmet@kervanheat.com · +90 531 669 37 34."
      />

      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <motion.div
          className="max-w-[1280px] mx-auto px-6 md:px-8 mb-12 md:mb-16 grid grid-cols-12 gap-8 items-end"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
            <span className="font-sans text-xs tracking-[0.2em] uppercase text-brand font-medium">
              {t.contactPage.eyebrow}
            </span>
            <h1 className="font-serif italic text-h1 text-ink leading-[1.05] tracking-[-0.02em]">
              {t.contactPage.title}
            </h1>
          </div>
          <p className="col-span-12 lg:col-span-5 font-serif italic text-lg text-ink-mid leading-relaxed max-w-[40ch]">
            {t.contactPage.sub}
          </p>
        </motion.div>

        <div className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-12 gap-8 md:gap-16">
          {/* Info — 4 col */}
          <motion.dl
            className="col-span-12 lg:col-span-4 flex flex-col gap-7 m-0"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={inViewOnce}
          >
            {[
              {
                label: t.contactPage.phoneLabel,
                value: (
                  <a href="tel:+905316693734" className="hover:text-brand transition-colors">
                    +90 531 669 37 34
                  </a>
                ),
              },
              {
                label: t.contactPage.emailLabel,
                value: (
                  <a href="mailto:ahmet@kervanheat.com" className="hover:text-brand transition-colors">
                    ahmet@kervanheat.com
                  </a>
                ),
              },
              {
                label: 'Adres',
                value: <span className="whitespace-pre-line">{t.contactPage.address}</span>,
              },
              { label: t.contactPage.hoursLabel, value: t.contactPage.hours },
            ].map((row, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <dt className="font-sans text-xs tracking-widest uppercase text-ink-soft">
                  {row.label}
                </dt>
                <dd className="font-serif italic text-lg text-ink m-0">{row.value}</dd>
              </div>
            ))}
          </motion.dl>

          {/* Form — 8 col */}
          <motion.form
            ref={formRef}
            onSubmit={onSubmit}
            className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={inViewOnce}
          >
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px]"
            />

            <Field label={t.contactPage.fields.name} name="name" required maxLength={100} />
            <Field label={t.contactPage.fields.company} name="company" maxLength={150} />
            <Field label={t.contactPage.fields.email} name="email" type="email" required maxLength={200} />
            <Field label={t.contactPage.fields.phone} name="phone" type="tel" maxLength={30} />

            <label className="md:col-span-2 flex flex-col gap-2">
              <span className="font-sans text-xs tracking-widest uppercase text-ink-soft">
                {t.contactPage.fields.message}
              </span>
              <textarea
                name="message"
                rows={5}
                maxLength={3000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-transparent border-b border-hair pb-2 font-serif text-lg text-ink resize-none focus:border-ink outline-none transition-colors"
              />
            </label>

            <label className="md:col-span-2 flex items-start gap-3 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={kvkk}
                onChange={(e) => setKvkk(e.target.checked)}
                className="mt-1 accent-brand"
              />
              <span className="font-sans text-sm text-ink-mid leading-relaxed">
                {t.contactPage.kvkk}
              </span>
            </label>

            <button
              type="submit"
              disabled={!kvkk || state === 'sending'}
              className="md:col-span-2 mt-4 bg-brand text-bg py-4 font-sans text-sm tracking-widest uppercase hover:bg-brand-hi disabled:bg-bg-soft disabled:text-ink-soft disabled:cursor-not-allowed transition-colors"
            >
              {state === 'sending' ? t.contactPage.sending : t.contactPage.submit}
            </button>

            {state === 'success' && (
              <p className="md:col-span-2 font-serif italic text-base text-brand">
                {t.contactPage.success}
              </p>
            )}
            {state === 'error' && (
              <p className="md:col-span-2 font-serif italic text-base text-ink">
                {t.contactPage.error}
              </p>
            )}
          </motion.form>
        </div>
      </section>
    </>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}

function Field({ label, name, type = 'text', required, maxLength }: FieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-sans text-xs tracking-widest uppercase text-ink-soft">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        maxLength={maxLength}
        className="bg-transparent border-b border-hair pb-2 font-serif text-lg text-ink focus:border-ink outline-none transition-colors"
      />
    </label>
  );
}
