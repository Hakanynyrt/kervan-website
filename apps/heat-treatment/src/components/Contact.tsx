import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { DictBlock } from '../types';
import { fadeUp, inViewOnce, useReducedMotion } from '../lib/motion';
import { SectionHeading } from '@kervan/ui';
import { trackConversion } from '../lib/ads';
import { MAPS_URL, WHATSAPP_URL } from '../lib/contact';
import {
  ALLOWED_EXTENSIONS,
  MAX_FILES,
  MAX_TOTAL_BYTES,
  extensionOf,
  isAllowedExtension,
} from '../../functions/_lib/rfq-attachments';

/** Same list as the server (functions/_lib/rfq-attachments.ts), for the file picker. */
const ACCEPT = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',');

type FileProblem = 'tooMany' | 'tooBig' | 'badType';

/** The client-side check of the chosen files (the server checks again, contents too). */
function checkFiles(files: File[]): FileProblem | null {
  if (files.length > MAX_FILES) return 'tooMany';
  if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES) return 'tooBig';
  if (files.some((f) => !isAllowedExtension(extensionOf(f.name)))) return 'badType';
  return null;
}

const formatSize = (bytes: number): string =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1048576).toFixed(1)} MB`;

interface Props {
  t: DictBlock;
}

type State = 'idle' | 'sending' | 'success' | 'error' | 'rejected';

export default function Contact({ t }: Props) {
  // Static (prerendered) mode and reduced motion render the final state.
  const reduce = useReducedMotion();
  const [state, setState] = useState<State>('idle');
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileProblem, setFileProblem] = useState<FileProblem | null>(null);
  const ids = useId();
  const fileHintId = `${ids}-file-hint`;
  const fileErrId = `${ids}-file-err`;

  function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.currentTarget.files ?? []);
    setFiles(list);
    setFileProblem(checkFiles(list));
    if (state === 'rejected') setState('idle');
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending' || !formRef.current) return;
    const problem = checkFiles(files);
    if (problem) {
      setFileProblem(problem);
      fileRef.current?.focus();
      return;
    }
    setState('sending');
    try {
      const fd = new FormData(formRef.current);
      // An empty picker still posts an empty part; leave it out.
      fd.delete('attachment');
      for (const f of files) fd.append('attachment', f, f.name);
      const r = await fetch('/api/rfq', { method: 'POST', body: fd });
      const j = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        delivered?: boolean;
        emailSent?: boolean;
        error?: string;
      };
      if (r.status === 422 && j.error === 'attachment') {
        setState('rejected');
        fileRef.current?.focus();
        return;
      }
      // `delivered`: the request reached the owner by email. An older
      // server only sends `emailSent`. Never show success when nothing was delivered.
      const ok = r.ok && j.ok === true && (j.delivered ?? j.emailSent) === true;
      setState(ok ? 'success' : 'error');
      if (ok) {
        formRef.current.reset();
        setFiles([]);
        setFileProblem(null);
        trackConversion('form');
      }
    } catch {
      setState('error');
    }
  }

  return (
    <section
      id="contact"
      className="min-h-dvh flex flex-col justify-center py-16 md:py-24 bg-bg-soft/40"
    >
      <SectionHeading
        eyebrow={t.contact.eyebrow}
        title={t.contact.title}
        aside={t.contact.sub}
        className="w-full kv-heading"
      />

      <div className="max-w-[1280px] w-full mx-auto px-6 md:px-8 grid grid-cols-12 gap-x-0 gap-y-8 md:gap-16">
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
              label: t.contact.whatsappLabel,
              value: (
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand transition-colors"
                >
                  +90 531 669 37 34
                </a>
              ),
            },
            {
              label: t.contact.emailLabel,
              value: (
                <a href="mailto:info@kervanheat.com" className="hover:text-brand transition-colors">
                  info@kervanheat.com
                </a>
              ),
            },
            {
              label: t.contact.addressLabel,
              value: (
                <>
                  <span className="block whitespace-pre-line">{t.contact.address}</span>
                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 font-sans not-italic text-sm text-ink-mid underline underline-offset-2 hover:text-brand transition-colors"
                  >
                    {t.contact.mapLabel} ↗
                  </a>
                </>
              ),
            },
            { label: t.contact.hoursLabel, value: t.contact.hours },
          ].map((row, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <dt className="font-sans text-[13px] font-medium tracking-[0.12em] uppercase text-ink-mid">
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
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={inViewOnce}
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

          <label className="md:col-span-2 flex flex-col gap-2">
            <span className="font-sans text-[13px] font-medium tracking-[0.12em] uppercase text-ink-mid">
              {t.contact.fields.message}
            </span>
            <textarea
              name="message"
              rows={4}
              maxLength={3000}
              className="w-full bg-bg border border-ink-soft rounded-sm px-3.5 py-3 font-sans text-base text-ink placeholder:text-ink-soft hover:border-ink-mid focus:border-ink transition-colors resize-y min-h-[7.5rem]"
            />
          </label>

          {/* Drawing / photo: optional, checked here and again on the server. */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <label
              htmlFor={`${ids}-files`}
              className="font-sans text-[13px] font-medium tracking-[0.12em] uppercase text-ink-mid"
            >
              {t.contact.files.label}
            </label>
            <input
              ref={fileRef}
              id={`${ids}-files`}
              type="file"
              name="attachment"
              multiple
              accept={ACCEPT}
              onChange={onFiles}
              aria-describedby={
                fileProblem || state === 'rejected' ? `${fileHintId} ${fileErrId}` : fileHintId
              }
              aria-invalid={fileProblem || state === 'rejected' ? true : undefined}
              className="w-full font-sans text-sm text-ink-mid file:mr-4 file:border file:border-solid file:border-ink-soft file:bg-transparent file:px-4 file:py-2 file:font-sans file:text-sm file:text-ink file:cursor-pointer hover:file:border-ink file:transition-colors"
            />
            <span id={fileHintId} className="font-sans text-sm text-ink-mid">
              {t.contact.files.hint}
            </span>
            {files.length > 0 && !fileProblem && (
              <ul className="list-none m-0 p-0 flex flex-col gap-1 font-sans text-sm text-ink-mid">
                {files.map((f, i) => (
                  <li key={i} className="break-all">
                    {f.name} <span className="text-ink-soft">· {formatSize(f.size)}</span>
                  </li>
                ))}
              </ul>
            )}
            {(fileProblem || state === 'rejected') && (
              <p id={fileErrId} role="alert" className="m-0 font-sans text-sm text-err">
                {fileProblem ? t.contact.files[fileProblem] : t.contact.files.rejected}
              </p>
            )}
          </div>

          <p className="md:col-span-2 m-0 font-sans text-sm text-ink-mid">
            {t.contact.requiredNote}
          </p>

          <button
            type="submit"
            disabled={state === 'sending'}
            className="md:col-span-2 mt-2 bg-brand text-bg py-4 font-sans text-sm tracking-widest uppercase hover:bg-brand-hi disabled:bg-bg-soft disabled:text-ink-soft disabled:cursor-not-allowed transition-colors"
          >
            {state === 'sending' ? t.contact.sending : t.contact.submit}
          </button>

          <p className="md:col-span-2 m-0 font-sans text-sm text-ink-mid leading-relaxed">
            {t.contact.kvkk.before}
            <a
              href="/kvkk"
              className="underline underline-offset-2 hover:text-ink transition-colors"
            >
              {t.contact.kvkk.link}
            </a>
            {t.contact.kvkk.after}
          </p>

          {state === 'success' && (
            <p role="status" className="md:col-span-2 font-serif italic text-base text-brand">
              {t.contact.success}
            </p>
          )}
          {state === 'error' && (
            <p role="alert" className="md:col-span-2 font-serif italic text-base text-ink">
              {t.contact.error}
            </p>
          )}
        </motion.form>
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
    <label className="flex flex-col gap-2">
      <span className="font-sans text-[13px] font-medium tracking-[0.12em] uppercase text-ink-mid">
        {label}
        {/* Visual mark; `required` + `aria-required` tell assistive technology. */}
        {required && (
          <span aria-hidden="true" className="text-brand">
            {' '}
            *
          </span>
        )}
      </span>
      <input
        type={type}
        name={name}
        autoComplete={AUTOCOMPLETE[name]}
        required={required}
        aria-required={required || undefined}
        maxLength={maxLength}
        className="w-full bg-bg border border-ink-soft rounded-sm px-3.5 py-3 font-sans text-base text-ink placeholder:text-ink-soft hover:border-ink-mid focus:border-ink transition-colors"
      />
    </label>
  );
}
