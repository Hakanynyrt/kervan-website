import { useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { DictBlock } from '../types';
import { fadeUp, inViewOnce } from '../lib/motion';
import SectionHead from './SectionHead';

interface Props {
  t: DictBlock;
}

type State = 'idle' | 'sending' | 'success' | 'error';

/** RFQ endpoint — mevcut Cloudflare Worker'ın yaşadığı yer.
 *  Production'da v2.kervanheat.com'dan kervanheat.com'a cross-origin POST.
 *  Mevcut Worker (src/worker/index.ts) v2.kervanheat.com'u ALLOWED_ORIGINS'e
 *  ekliyor ve Access-Control-Allow-Origin yanıt header'ı dönüyor.
 *  Dev'de Vite same-origin proxy yok — submit `error` durumuna düşer,
 *  beklenen davranış. */
const RFQ_ENDPOINT = import.meta.env.PROD
  ? 'https://kervanheat.com/api/rfq'
  : '/api/rfq';

export default function Contact({ t }: Props) {
  const [state, setState] = useState<State>('idle');
  const [kvkk, setKvkk] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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
      // The worker returns `ok: true` even when neither Resend nor
      // MailChannels delivered (it still tries Telegram and the form
      // succeeded structurally). Treat a missing/false `emailSent` as
      // an error so the user gets the phone-fallback copy instead of
      // a misleading success.
      const ok = r.ok && j.ok === true && j.emailSent === true;
      setState(ok ? 'success' : 'error');
      if (ok) formRef.current.reset();
    } catch {
      setState('error');
    }
  }

  return (
    <section id="contact" data-scene-pose="contact" className="min-h-dvh flex flex-col justify-center py-16 md:py-24 bg-bg-soft/40">
      <SectionHead
        eyebrow={t.contact.eyebrow}
        title={t.contact.title}
        aside={t.contact.sub}
      />

      <div className="max-w-[1280px] mx-auto px-8 grid grid-cols-12 gap-8 md:gap-16">
        {/* Info — 4 col */}
        <motion.dl
          className="col-span-12 lg:col-span-4 flex flex-col gap-7 m-0"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
        >
          {[
            { label: t.contact.phoneLabel, value: <a href="tel:+905316693734" className="hover:text-brand transition-colors">+90 531 669 37 34</a> },
            { label: t.contact.emailLabel, value: <a href="mailto:info@kervanheat.com" className="hover:text-brand transition-colors">info@kervanheat.com</a> },
            { label: 'Adres', value: <span className="whitespace-pre-line">{t.contact.address}</span> },
            { label: t.contact.hoursLabel, value: t.contact.hours },
          ].map((row, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <dt className="font-sans text-xs tracking-widest uppercase text-ink-soft">{row.label}</dt>
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
          {/* Honeypot */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px]"
          />

          <Field label={t.contact.fields.name} name="name" required maxLength={100} />
          <Field label={t.contact.fields.company} name="company" maxLength={150} />
          <Field label={t.contact.fields.email} name="email" type="email" required maxLength={200} />
          <Field label={t.contact.fields.phone} name="phone" type="tel" maxLength={30} />

          <label className="md:col-span-2 flex flex-col gap-2">
            <span className="font-sans text-xs tracking-widest uppercase text-ink-soft">
              {t.contact.fields.message}
            </span>
            <textarea
              name="message"
              rows={4}
              maxLength={3000}
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
            <span className="font-sans text-sm text-ink-mid leading-relaxed">{t.contact.kvkk}</span>
          </label>

          <button
            type="submit"
            disabled={!kvkk || state === 'sending'}
            className="md:col-span-2 mt-4 bg-brand text-bg py-4 font-sans text-sm tracking-widest uppercase hover:bg-brand-dim disabled:bg-bg-soft disabled:text-ink-soft disabled:cursor-not-allowed transition-colors"
          >
            {state === 'sending' ? t.contact.sending : t.contact.submit}
          </button>

          {state === 'success' && (
            <p className="md:col-span-2 font-serif italic text-base text-brand">{t.contact.success}</p>
          )}
          {state === 'error' && (
            <p className="md:col-span-2 font-serif italic text-base text-ink">{t.contact.error}</p>
          )}
        </motion.form>
      </div>
    </section>
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
