import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { ORG_PHONE, ORG_PHONE_E164, ORG_PUBLIC_EMAIL } from '@kervan/seo';
import type { DictBlock, Lang } from '../types';
import { WRAP } from '../lib/ui';
import { WHATSAPP_URL } from '../lib/contact';
import { shopUrl } from '../lib/shop';
import { ArrowOut, ArrowRight } from './icons';

interface Props {
  t: DictBlock;
  lang: Lang;
  /** Id of the heading that names the form on this page (no extra heading is added). */
  titleId: string;
  /** Shown above the quote panel: the home page's heading and lead. */
  head?: ReactNode;
  /** Text the message starts with (a product page's quote button). */
  prefill?: string;
}

type State = 'idle' | 'sending' | 'success' | 'error';

/** RFQ endpoint: the Pages Function on kervanheat.com serves both sites. In production the form
 *  posts cross-origin to it (it checks the Origin against an allowlist); in dev there is no such
 *  endpoint, so a submit ends in the error state, as expected. */
const RFQ_ENDPOINT = import.meta.env.PROD ? 'https://kervanheat.com/api/rfq' : '/api/rfq';

const EMPTY = { name: '', company: '', email: '', phone: '', message: '' };
type Key = keyof typeof EMPTY;
const KEYS = Object.keys(EMPTY) as Key[];

/**
 * The quote panel (direct lines, address, hours) beside the quote form, which posts to the shared
 * /api/rfq. Used by the home page's #contact and by /iletisim. The server and the first client
 * render are empty; an effect then brings in the prefill and anything typed before hydration.
 */
export default function ContactBlock({ t, lang, titleId, head, prefill = '' }: Props) {
  const [state, setState] = useState<State>('idle');
  const [values, setValues] = useState(EMPTY);
  const formRef = useRef<HTMLFormElement>(null);
  const lastPrefill = useRef<string | null>(null);

  useEffect(() => {
    if (lastPrefill.current === prefill) return;
    const previous = lastPrefill.current;
    lastPrefill.current = prefill;
    if (previous !== null) {
      // Another part or language: replaces the old prefill, never what the visitor wrote.
      setValues((v) => ({
        ...v,
        message: v.message === '' || v.message === previous ? prefill : v.message,
      }));
      return;
    }
    const typed: Partial<Record<Key, string>> = {};
    for (const key of KEYS) {
      const el = formRef.current?.elements.namedItem(key) as HTMLInputElement | null;
      if (el?.value) typed[key] = el.value;
    }
    setValues({ ...EMPTY, message: prefill, ...typed });
  }, [prefill]);

  const bind = (key: Key, max?: number) => ({
    htmlName: key,
    value: values[key],
    onChange: (value: string) =>
      setValues((v) => ({ ...v, [key]: max ? value.slice(0, max) : value })),
  });

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
      if (ok) setValues({ ...EMPTY, message: prefill });
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

  const f = t.contact.fields;
  const fullWidth = 'min-[721px]:col-span-2';

  return (
    <div
      className={`${WRAP} grid grid-cols-1 gap-9 min-[1081px]:grid-cols-[4fr_7fr] min-[1081px]:gap-14 items-start`}
    >
      <div>
        {head}
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
        aria-labelledby={titleId}
        className="kv-form bg-panel border border-hair-strong rounded-[4px] px-4 py-5 min-[721px]:p-8 grid grid-cols-1 gap-x-4 gap-y-4 min-[721px]:grid-cols-2"
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

        <p className={`${fullWidth} m-0 font-sans text-sm text-ink-mid`}>
          {t.contact.requiredLegend}
        </p>

        <TextInput
          {...bind('name')}
          label={f.name}
          size="lg"
          autoComplete="name"
          containerClassName="kv-req"
          {...{ required: true, maxLength: 100 }}
        />
        <TextInput
          {...bind('company')}
          label={f.company}
          size="lg"
          autoComplete="organization"
          {...{ maxLength: 150 }}
        />
        <TextInput
          {...bind('email')}
          label={f.email}
          type="email"
          size="lg"
          autoComplete="email"
          containerClassName="kv-req"
          {...{ required: true, maxLength: 200 }}
        />
        <TextInput
          {...bind('phone')}
          label={f.phone}
          type="tel"
          size="lg"
          autoComplete="tel"
          {...{ maxLength: 30 }}
        />
        <TextArea
          // Capped here: Astryx's maxLength only draws a counter and lets the text run over.
          {...bind('message', 3000)}
          label={f.message}
          rows={4}
          containerClassName={fullWidth}
        />

        <div className={`${fullWidth} mt-1 flex justify-end`}>
          <Button
            type="submit"
            label={state === 'sending' ? t.contact.sending : t.contact.submit}
            variant="primary"
            size="lg"
            isLoading={state === 'sending'}
            className="kv-btn kv-btn-main w-full min-[721px]:w-auto min-[721px]:min-w-[180px]"
          />
        </div>

        {state === 'success' && (
          <p role="status" className={`${fullWidth} m-0 font-sans text-base font-semibold text-ok`}>
            {t.contact.success}
          </p>
        )}
        {state === 'error' && (
          <p role="alert" className={`${fullWidth} m-0 font-sans text-base font-semibold text-err`}>
            {t.contact.errorLead}
            <a
              href={`tel:${ORG_PHONE_E164}`}
              className="whitespace-nowrap py-3 underline underline-offset-2"
            >
              {ORG_PHONE}
            </a>
            {t.contact.errorTail}
          </p>
        )}
      </form>
    </div>
  );
}
