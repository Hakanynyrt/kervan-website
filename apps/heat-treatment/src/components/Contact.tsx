import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { DictBlock } from '../types';
import { fadeUp, inViewOnce, useReducedMotion } from '../lib/motion';
import { ORG_EMAIL, ORG_PHONE, ORG_PHONE_E164 } from '@kervan/seo';
import { BTN_LINE, BTN_PRIMARY, H2, SECTION, SEC_HEAD, SEC_LEAD, WRAP } from '../lib/ui';
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

  const req = t.marks.required;
  const label = 'font-sans text-sm font-semibold text-ink';
  const field =
    'w-full min-h-12 px-3.5 py-3 rounded-[2px] border border-field-line bg-field font-sans text-base text-ink placeholder:text-ink-soft hover:border-ink transition-colors';
  const infoLink =
    'inline-flex items-center min-h-11 font-sans font-semibold text-brand hover:underline underline-offset-2';
  const direct = `${BTN_LINE} w-full justify-start min-h-[60px] px-4 min-[721px]:px-[22px] text-base min-[721px]:text-[17px]`;

  return (
    <section id="contact" aria-labelledby="contact-title" className={`${SECTION} bg-bg`}>
      <div className={WRAP}>
        <div className={SEC_HEAD}>
          <h2 id="contact-title" className={H2}>
            {t.contact.title}
          </h2>
          <p className={SEC_LEAD}>{t.contact.sub}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 min-[721px]:grid-cols-[4fr_7fr] min-[721px]:gap-14 items-start">
          {/* Direct lines and the address */}
          <motion.div
            variants={fadeUp}
            initial={reduce ? false : 'hidden'}
            whileInView="show"
            viewport={inViewOnce}
          >
            <div className="grid gap-3">
              <a href={`tel:${ORG_PHONE_E164}`} className={direct}>
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                  className="flex-none"
                >
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
                </svg>
                {t.contact.phoneLabel}
                <small className="ml-auto text-[15px] font-normal text-ink-mid">{ORG_PHONE}</small>
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={direct}>
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                  className="flex-none"
                >
                  <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />
                </svg>
                {t.contact.whatsappLabel}
                <small className="ml-auto text-[15px] font-normal text-ink-mid">{ORG_PHONE}</small>
              </a>
            </div>
            <dl className="m-0 mt-7 border-t border-hair font-sans">
              <div className="py-2.5 border-b border-hair">
                <dt className="text-sm text-ink-mid">{t.contact.emailLabel}</dt>
                <dd className="m-0 mt-0.5">
                  <a href={`mailto:${ORG_EMAIL}`} className={infoLink}>
                    {ORG_EMAIL}
                  </a>
                </dd>
              </div>
              <div className="py-2.5 border-b border-hair">
                <dt className="text-sm text-ink-mid">{t.contact.addressLabel}</dt>
                <dd className="m-0 mt-0.5 whitespace-pre-line text-ink">{t.contact.address}</dd>
                <dd className="m-0">
                  <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className={infoLink}>
                    {t.contact.mapLabel} <span aria-hidden="true">&nbsp;{t.marks.external}</span>
                  </a>
                </dd>
              </div>
              <div className="py-2.5 border-b border-hair">
                <dt className="text-sm text-ink-mid">{t.contact.hoursLabel}</dt>
                <dd className="m-0 mt-0.5 text-ink">{t.contact.hours}</dd>
              </div>
            </dl>
          </motion.div>

          {/* Form */}
          <motion.form
            ref={formRef}
            onSubmit={onSubmit}
            aria-labelledby="contact-title"
            className="bg-bg-soft border border-hair rounded-[4px] px-4 py-5 min-[721px]:p-8 grid grid-cols-1 gap-x-4 gap-y-4 min-[721px]:grid-cols-2"
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

            <Field label={t.contact.fields.name} name="name" required mark={req} maxLength={100} />
            <Field label={t.contact.fields.company} name="company" mark={req} maxLength={150} />
            <Field
              label={t.contact.fields.email}
              name="email"
              type="email"
              required
              mark={req}
              maxLength={200}
            />
            <Field
              label={t.contact.fields.phone}
              name="phone"
              type="tel"
              mark={req}
              maxLength={30}
            />

            <label className="min-[721px]:col-span-2 grid gap-1.5">
              <span className={label}>{t.contact.fields.message}</span>
              <textarea
                name="message"
                rows={4}
                maxLength={3000}
                className={`${field} min-h-[120px] resize-y`}
              />
            </label>

            {/* Drawing / photo: optional, checked here and again on the server. The input is visually
                hidden; its label is the button (the focus ring follows the input). */}
            <div className="min-[721px]:col-span-2 flex flex-wrap items-center gap-x-3.5 gap-y-2">
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
                className="peer sr-only"
              />
              <label
                htmlFor={`${ids}-files`}
                className={`${BTN_LINE} min-h-11 text-[15px] bg-field cursor-pointer peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand peer-focus-visible:outline-offset-2`}
              >
                {t.contact.files.label}
              </label>
              <span id={fileHintId} className="font-sans text-[13px] text-ink-mid">
                {t.contact.files.hint}
              </span>
              {files.length > 0 && !fileProblem && (
                <ul className="basis-full list-none m-0 p-0 flex flex-col gap-1 font-sans text-sm text-ink">
                  {files.map((f, i) => (
                    <li key={i} className="break-all">
                      {f.name} <span className="text-ink-mid">· {formatSize(f.size)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {(fileProblem || state === 'rejected') && (
                <p
                  id={fileErrId}
                  role="alert"
                  className="basis-full m-0 font-sans text-sm text-err"
                >
                  {fileProblem ? t.contact.files[fileProblem] : t.contact.files.rejected}
                </p>
              )}
            </div>

            <div className="min-[721px]:col-span-2 mt-1 flex flex-wrap items-center justify-between gap-5">
              <p className="m-0 max-w-[440px] font-sans text-[13px] leading-5 text-ink-mid">
                {t.contact.requiredNote} {t.contact.kvkk.before}
                {/* A 44 px tall hit area that does not change the line box. */}
                <a
                  href="/kvkk"
                  className="inline-block -my-3 py-3 min-w-11 font-semibold text-brand underline underline-offset-2"
                >
                  {t.contact.kvkk.link}
                </a>
                {t.contact.kvkk.after}
              </p>
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
          </motion.form>
        </div>
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
  /** The required mark ("*", from the dict). */
  mark: string;
  maxLength?: number;
}

function Field({ label, name, type = 'text', required, mark, maxLength }: FieldProps) {
  return (
    <label className="grid gap-1.5">
      <span className="font-sans text-sm font-semibold text-ink">
        {label}
        {/* Visual mark; `required` + `aria-required` tell assistive technology. */}
        {required && <span aria-hidden="true"> {mark}</span>}
      </span>
      <input
        type={type}
        name={name}
        autoComplete={AUTOCOMPLETE[name]}
        required={required}
        aria-required={required || undefined}
        maxLength={maxLength}
        className="w-full min-h-12 px-3.5 py-3 rounded-[2px] border border-field-line bg-field font-sans text-base text-ink placeholder:text-ink-soft hover:border-ink transition-colors"
      />
    </label>
  );
}
