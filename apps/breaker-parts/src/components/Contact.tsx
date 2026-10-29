import { useRef, useState, type FormEvent } from 'react';
import type { DictBlock, Lang } from '../types';
import { ORG_PHONE, ORG_PHONE_E164, ORG_PUBLIC_EMAIL } from '@kervan/seo';
import { BTN_PRIMARY, FIELD, H2, LABEL, SECTION, WRAP } from '../lib/ui';
import { WHATSAPP_URL } from '../lib/contact';
import { shopUrl } from '../lib/shop';
import { ArrowOut, ArrowRight } from './icons';

interface Props {
  t: DictBlock;
  lang: Lang;
}

type State = 'idle' | 'sending' | 'success' | 'error';

/** RFQ endpoint: the Pages Function on kervanheat.com serves both sites. In production
 *  the form posts cross-origin to it (it checks the Origin against an allowlist); in dev
 *  there is no such endpoint, so a submit ends in the error state, as expected. */
const RFQ_ENDPOINT = import.meta.env.PROD ? 'https://kervanheat.com/api/rfq' : '/api/rfq';

/** İletişim (`#contact`): the framed quote panel (direct lines, address, hours) beside the
 *  quote form, which posts to the shared /api/rfq. */
export default function Contact({ t, lang }: Props) {
  const [state, setState] = useState<State>('idle');
  const formRef = useRef<HTMLFormElement>(null);

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

  const row = (label: string, value: string, href: string, external?: boolean) => (
    <a
      href={href}
      className="kv-qpanel-row"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <span>
        <b>{label}</b>
        <span className="kv-qpanel-v">{value}</span>
      </span>
      <span className="kv-qpanel-go">
        {href.startsWith('tel:') ? <ArrowRight /> : <ArrowOut />}
      </span>
    </a>
  );

  return (
    <section id="contact" aria-labelledby="contact-title" className={SECTION}>
      <div
        className={`${WRAP} grid grid-cols-1 gap-9 min-[1081px]:grid-cols-[4fr_7fr] min-[1081px]:gap-14 items-start`}
      >
        <div>
          <h2 id="contact-title" className={H2}>
            {t.contact.title}
          </h2>
          <p className="m-0 mt-3 mb-7 text-base min-[721px]:text-[17px] text-ink-mid">
            {t.contact.sub}
          </p>
          <div className="kv-qpanel">
            <p className="kv-qpanel-bar">{t.nav.cta}</p>
            {row(t.contact.phoneLabel, ORG_PHONE, `tel:${ORG_PHONE_E164}`)}
            {row(t.contact.whatsappLabel, ORG_PHONE, WHATSAPP_URL, true)}
            {row(t.contact.emailLabel, ORG_PUBLIC_EMAIL, `mailto:${ORG_PUBLIC_EMAIL}`)}
            {/* The sister shop: same tab, no rel. */}
            {row(t.shop.contactLabel, 'kiriciparca.com', shopUrl('/', lang))}
            <div className="kv-qpanel-row">
              <span>
                <b>{t.contact.addressLabel}</b>
                <span className="kv-qpanel-txt">{t.contact.address}</span>
              </span>
            </div>
            <div className="kv-qpanel-row">
              <span>
                <b>{t.contact.hoursLabel}</b>
                <span className="kv-qpanel-txt">{t.contact.hours}</span>
              </span>
            </div>
          </div>
        </div>

        <form
          ref={formRef}
          onSubmit={onSubmit}
          aria-labelledby="contact-title"
          className="bg-panel border border-hair-strong rounded-[4px] px-4 py-5 min-[721px]:p-8 grid grid-cols-1 gap-x-4 gap-y-4 min-[721px]:grid-cols-2"
        >
          {/* Honeypot: hidden (not just off-screen) so browser autofill skips it; see rfq.ts */}
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

          <label className="min-[721px]:col-span-2 grid gap-1.5">
            <span className={LABEL}>{t.contact.fields.message}</span>
            <textarea
              name="message"
              rows={4}
              maxLength={3000}
              className={`${FIELD} min-h-[130px] resize-y`}
            />
          </label>

          <div className="min-[721px]:col-span-2 mt-1 flex justify-end">
            <button
              type="submit"
              disabled={state === 'sending'}
              className={`${BTN_PRIMARY} w-full min-[721px]:w-auto min-[721px]:min-w-[180px]`}
            >
              {state === 'sending' ? t.contact.sending : t.contact.submit}
            </button>
          </div>

          {state === 'success' && (
            <p
              role="status"
              className="min-[721px]:col-span-2 m-0 font-sans text-base font-semibold text-ok"
            >
              {t.contact.success}
            </p>
          )}
          {state === 'error' && (
            <p
              role="alert"
              className="min-[721px]:col-span-2 m-0 font-sans text-base font-semibold text-ink"
            >
              {t.contact.error}
            </p>
          )}
        </form>
      </div>
    </section>
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
