import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { ORG_PUBLIC_EMAIL } from '@kervan/seo';
import { fadeUp, inViewOnce, useReducedMotion, useStaticMotion } from '@kervan/motion';
import { PRODUCT_BY_SLUG } from '../data/products';
import type { DictBlock, Lang } from '../types';
import { shopUrl } from '../lib/shop';
import { BTN_PRIMARY, FIELD, LABEL } from '../lib/ui';

interface Props {
  t: DictBlock;
  lang: Lang;
}

type State = 'idle' | 'sending' | 'success' | 'error';

/** RFQ endpoint: the Pages Function on kervanheat.com serves both sites. In dev it posts to
 *  the local /api/rfq (404 expected); in production it posts cross-origin to kervanheat.com,
 *  which checks the Origin against an allowlist. */
const RFQ_ENDPOINT = import.meta.env.PROD ? 'https://kervanheat.com/api/rfq' : '/api/rfq';

export default function Contact({ t, lang }: Props) {
  const reduce = useReducedMotion();
  const isStatic = useStaticMotion();
  const [params] = useSearchParams();
  const partSlug = params.get('part');
  const prefilledPart = partSlug ? PRODUCT_BY_SLUG[partSlug] : undefined;
  const prefilledMessage = prefilledPart
    ? `${t.contact.quotePrefix} ${prefilledPart[lang].name}\n\n`
    : '';

  const [state, setState] = useState<State>('idle');
  // Static (prerender/hydrate) mode starts empty like the server markup; the
  // effect below fills in the ?part= prefill right after hydration.
  const [message, setMessage] = useState(isStatic ? '' : prefilledMessage);
  const formRef = useRef<HTMLFormElement>(null);

  // If user navigates between product detail pages while on contact, refresh
  // the prefilled message accordingly.
  useEffect(() => {
    setMessage(prefilledMessage);
  }, [prefilledMessage]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending' || !formRef.current) return;
    setState('sending');
    try {
      const fd = new FormData(formRef.current);
      const r = await fetch(RFQ_ENDPOINT, { method: 'POST', body: fd });
      const j = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        delivered?: boolean;
        emailSent?: boolean;
      };
      // `delivered`: the request reached the owner by email. An older
      // server only sends `emailSent`. Never show success when nothing was delivered.
      const ok = r.ok && j.ok === true && (j.delivered ?? j.emailSent) === true;
      setState(ok ? 'success' : 'error');
      if (ok) formRef.current.reset();
    } catch {
      setState('error');
    }
  }

  return (
    <>
      <section className="pt-10 pb-16 md:pt-16 md:pb-24">
        <motion.div
          className="max-w-[1280px] mx-auto px-6 md:px-8 mb-12 md:mb-16 grid grid-cols-12 gap-x-0 gap-y-8 md:gap-x-8 items-end"
          variants={fadeUp}
          initial={reduce ? false : 'hidden'}
          animate="show"
        >
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
            <h1 className="font-sans font-bold text-[34px] md:text-[48px] text-ink leading-[1.08] tracking-[-0.03em] text-balance">
              {t.contact.title}
            </h1>
          </div>
          <p className="col-span-12 lg:col-span-5 font-sans text-lg text-ink-mid leading-relaxed max-w-[40ch]">
            {t.contact.sub}
          </p>
        </motion.div>

        <div className="max-w-[1280px] mx-auto px-6 md:px-8 grid grid-cols-12 gap-x-0 gap-y-8 md:gap-16">
          {/* Info — 4 col */}
          <motion.dl
            className="col-span-12 lg:col-span-4 flex flex-col gap-7 m-0"
            variants={fadeUp}
            initial={reduce ? false : 'hidden'}
            whileInView="show"
            viewport={inViewOnce}
          >
            {[
              {
                label: t.contact.phoneLabel,
                value: (
                  <a href="tel:+905316693734" className="hover:text-brand transition-colors">
                    +90 531 669 37 34
                  </a>
                ),
              },
              {
                label: t.contact.emailLabel,
                value: (
                  <a
                    href={`mailto:${ORG_PUBLIC_EMAIL}`}
                    className="hover:text-brand transition-colors"
                  >
                    {ORG_PUBLIC_EMAIL}
                  </a>
                ),
              },
              {
                label: t.contact.addressLabel,
                value: <span className="whitespace-pre-line">{t.contact.address}</span>,
              },
              { label: t.contact.hoursLabel, value: t.contact.hours },
              {
                label: t.shop.contactLabel,
                value: (
                  <a
                    href={shopUrl('/', lang)}
                    hrefLang={lang}
                    className="hover:text-brand transition-colors"
                  >
                    kiriciparca.com
                  </a>
                ),
              },
            ].map((row, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <dt className="font-sans text-sm font-medium text-ink-mid">{row.label}</dt>
                <dd className="font-sans font-semibold text-lg text-ink m-0">{row.value}</dd>
              </div>
            ))}
          </motion.dl>

          {/* Form — 8 col */}
          <motion.form
            ref={formRef}
            onSubmit={onSubmit}
            className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-panel border border-hair-strong rounded-[4px] px-4 py-5 md:p-8"
            variants={fadeUp}
            initial={reduce ? false : 'hidden'}
            whileInView="show"
            viewport={inViewOnce}
          >
            <div hidden aria-hidden="true">
              <input
                type="text"
                name="hp_ref"
                tabIndex={-1}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-bwignore="true"
                data-form-type="other"
              />
            </div>

            <Field label={t.contact.fields.name} name="name" required maxLength={100} />
            <Field label={t.contact.fields.company} name="company" maxLength={150} />
            <Field
              label={t.contact.fields.email}
              name="email"
              type="email"
              required
              maxLength={200}
            />
            <Field label={t.contact.fields.phone} name="phone" type="tel" maxLength={30} />

            <label className="md:col-span-2 grid gap-1.5">
              <span className={LABEL}>{t.contact.fields.message}</span>
              <textarea
                name="message"
                rows={5}
                maxLength={3000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${FIELD} min-h-[130px] resize-y`}
              />
            </label>

            <button
              type="submit"
              disabled={state === 'sending'}
              className={`${BTN_PRIMARY} md:col-span-2 mt-4`}
            >
              {state === 'sending' ? t.contact.sending : t.contact.submit}
            </button>

            {state === 'success' && (
              <p role="status" className="md:col-span-2 font-sans font-semibold text-base text-ok">
                {t.contact.success}
              </p>
            )}
            {state === 'error' && (
              <p role="alert" className="md:col-span-2 font-sans font-semibold text-base text-ink">
                {t.contact.error}
              </p>
            )}
          </motion.form>
        </div>
      </section>
    </>
  );
}

/** Lets browsers and password managers fill the form (WCAG 1.3.5). */
const AUTOCOMPLETE: Record<string, string | undefined> = {
  name: 'name',
  company: 'organization',
  email: 'email',
  phone: 'tel',
};

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}

function Field({ label, name, type = 'text', required, maxLength }: FieldProps) {
  return (
    <label className="grid gap-1.5">
      <span className={LABEL}>{label}</span>
      <input
        type={type}
        name={name}
        autoComplete={AUTOCOMPLETE[name]}
        required={required}
        maxLength={maxLength}
        className={FIELD}
      />
    </label>
  );
}
