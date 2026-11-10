import { useEffect, useId, useRef, useState, type FormEvent, type Ref } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@astryxdesign/core/Button';
import { FileInput } from '@astryxdesign/core/FileInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import type { DictBlock } from '../types';
import { fadeUp, inViewOnce, useReducedMotion } from '../lib/motion';
import { ORG_EMAIL, ORG_PHONE, ORG_PHONE_E164 } from '@kervan/seo';
import {
  ACTION,
  ACTION_LINE,
  FIELD_CONTROL,
  FIELD_LABEL,
  FIELD_SCOPE,
  H2,
  LINE,
  SECTION,
  SEC_HEAD,
  SEC_LEAD,
  WRAP,
} from '../lib/ui';
import { trackConversion } from '../lib/ads';
import { MAPS_URL, WHATSAPP_URL } from '../lib/contact';
import {
  ALLOWED_EXTENSIONS,
  MAX_FILES,
  MAX_TOTAL_BYTES,
  extensionOf,
  isAllowedExtension,
} from '../../functions/_lib/rfq-attachments';
import { isValidEmail } from '../../functions/_lib/rfq-email';

/** Same list as the server (functions/_lib/rfq-attachments.ts), for the file picker. */
const ACCEPT = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',');

/** The server keeps this many characters of the message (functions/api/rfq.ts). */
const MAX_MESSAGE = 3000;

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

const EMPTY = { name: '', company: '', email: '', phone: '', message: '' };
type FieldName = keyof typeof EMPTY;
const FIELD_NAMES = Object.keys(EMPTY) as FieldName[];

type FieldErrors = Partial<Record<FieldName, 'required' | 'email'>>;

/** The same rules as functions/api/rfq.ts, so a refusal there never reaches the visitor. */
function checkFields(v: typeof EMPTY): FieldErrors {
  const errors: FieldErrors = {};
  const email = v.email.trim();
  if (!v.name.trim()) errors.name = 'required';
  if (!email) errors.email = 'required';
  else if (!isValidEmail(email)) errors.email = 'email';
  return errors;
}

interface Props {
  t: DictBlock;
}

type State = 'idle' | 'sending' | 'success' | 'error' | 'rejected';

export default function Contact({ t }: Props) {
  // Static (prerendered) mode and reduced motion render the final state.
  const reduce = useReducedMotion();
  const [state, setState] = useState<State>('idle');
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileProblem, setFileProblem] = useState<FileProblem | null>(null);
  const fileErrId = `${useId()}-file-err`;

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    // Our own checks and messages take over from the browser's once the script runs.
    form.noValidate = true;
    // FileInput filters by `accept` itself and would drop a wrong file without showing it; the
    // attribute alone keeps the picker's filter while checkFiles reports the problem.
    fileRef.current?.setAttribute('accept', ACCEPT);
    // Whatever a visitor typed before the script ran.
    setValues((v) => {
      const typed = { ...v };
      for (const k of FIELD_NAMES) {
        const el = form.elements.namedItem(k);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
          typed[k] = el.value;
      }
      return FIELD_NAMES.some((k) => typed[k] !== v[k]) ? typed : v;
    });
  }, []);

  function setField(k: FieldName, value: string) {
    setValues((v) => ({ ...v, [k]: value }));
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  }

  // The focusable control of FileInput is its hidden trigger button, the first one in its box.
  const focusFilePicker = () => fileRef.current?.parentElement?.querySelector('button')?.focus();

  function chooseFiles(list: File[]) {
    setFiles(list);
    setFileProblem(checkFiles(list));
    if (state === 'rejected') setState('idle');
  }

  function removeFile(index: number) {
    chooseFiles(files.filter((_, i) => i !== index));
    focusFilePicker();
  }

  function onFormInput() {
    if (state === 'success' || state === 'error') setState('idle');
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending' || !formRef.current) return;
    const invalid = checkFields(values);
    if (invalid.name || invalid.email) {
      setErrors(invalid);
      (invalid.name ? nameRef : emailRef).current?.focus();
      return;
    }
    const problem = checkFiles(files);
    if (problem) {
      setFileProblem(problem);
      focusFilePicker();
      return;
    }
    setState('sending');
    try {
      const fd = new FormData(formRef.current);
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
        focusFilePicker();
        return;
      }
      // `delivered`: the request reached the owner by email. An older
      // server only sends `emailSent`. Never show success when nothing was delivered.
      const ok = r.ok && j.ok === true && (j.delivered ?? j.emailSent) === true;
      setState(ok ? 'success' : 'error');
      if (ok) {
        formRef.current.reset();
        setValues(EMPTY);
        setErrors({});
        setFiles([]);
        setFileProblem(null);
        trackConversion('form');
      }
    } catch {
      setState('error');
    }
  }

  const req = t.marks.required;
  const sending = state === 'sending';
  const fileFailed = Boolean(fileProblem) || state === 'rejected';
  const errorText = (k: FieldName) => {
    const code = errors[k];
    return code ? t.contact.invalid[code] : undefined;
  };
  const infoLink =
    'inline-flex items-center min-h-11 font-sans font-semibold text-brand hover:underline underline-offset-2';
  const direct = `${ACTION_LINE} w-full justify-between h-[60px] px-4 min-[721px]:px-[22px] text-base min-[721px]:text-[17px]`;
  const directIcon = (path: string) => (
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
      <path d={path} />
    </svg>
  );
  const number = <small className="text-[15px] font-normal text-ink-mid">{ORG_PHONE}</small>;

  return (
    <section id="contact" aria-labelledby="contact-title" className={`${SECTION} bg-bg`}>
      <div className={WRAP}>
        <div className={SEC_HEAD}>
          <h2 id="contact-title" className={H2}>
            {t.contact.title}
          </h2>
          <p className={SEC_LEAD}>{t.contact.sub}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 min-[721px]:grid-cols-[4fr_7fr] min-[721px]:gap-14 min-[1081px]:grid-cols-[5fr_7fr] items-start">
          {/* Direct lines and the address */}
          <motion.div
            variants={fadeUp}
            initial={reduce ? false : 'hidden'}
            whileInView="show"
            viewport={inViewOnce}
          >
            <div className="grid gap-3">
              <Button
                href={`tel:${ORG_PHONE_E164}`}
                label={`${t.contact.phoneLabel} ${ORG_PHONE}`}
                variant="ghost"
                size="lg"
                endContent={number}
                className={direct}
              >
                <span className="inline-flex items-center gap-2.5">
                  {directIcon(
                    'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z',
                  )}
                  {t.contact.phoneLabel}
                </span>
              </Button>
              <Button
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                label={`${t.contact.whatsappLabel} ${ORG_PHONE}`}
                variant="ghost"
                size="lg"
                endContent={number}
                className={direct}
              >
                <span className="inline-flex items-center gap-2.5">
                  {directIcon('M4 20l1.3-4A8 8 0 1 1 8 18.7z')}
                  {t.contact.whatsappLabel}
                </span>
              </Button>
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
            onInput={onFormInput}
            aria-labelledby="contact-title"
            className={`bg-bg-soft border border-hair rounded-[4px] px-4 py-5 min-[721px]:p-8 grid grid-cols-1 gap-x-4 gap-y-4 min-[721px]:grid-cols-2 ${FIELD_SCOPE}`}
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

            <p className="min-[721px]:col-span-2 m-0 font-sans text-[13px] leading-5 text-ink-mid">
              {t.contact.requiredNote}
            </p>

            <ContactField
              label={t.contact.fields.name}
              name="name"
              required
              mark={req}
              maxLength={100}
              value={values.name}
              onChange={(v) => setField('name', v)}
              error={errorText('name')}
              inputRef={nameRef}
            />
            <ContactField
              label={t.contact.fields.company}
              name="company"
              mark={req}
              maxLength={150}
              value={values.company}
              onChange={(v) => setField('company', v)}
            />
            <ContactField
              label={t.contact.fields.email}
              name="email"
              type="email"
              required
              mark={req}
              maxLength={200}
              value={values.email}
              onChange={(v) => setField('email', v)}
              error={errorText('email')}
              inputRef={emailRef}
            />
            <ContactField
              label={t.contact.fields.phone}
              name="phone"
              type="tel"
              mark={req}
              maxLength={30}
              value={values.phone}
              onChange={(v) => setField('phone', v)}
            />

            {/* No maxLength prop: it would add a character counter this form does not show. */}
            <TextArea
              label={t.contact.fields.message}
              htmlName="message"
              rows={4}
              value={values.message}
              onChange={(v) => setField('message', v.slice(0, MAX_MESSAGE))}
              containerClassName={`min-[721px]:col-span-2 ${FIELD_LABEL}`}
              // The control's padding already sets the text in line with the inputs.
              controlClassName={`min-h-[120px] [--_textarea-inline-padding:0px] [&_textarea]:py-3 ${FIELD_CONTROL}`}
            />

            {/* Drawing / photo: optional, checked here and again on the server. */}
            <div className="min-[721px]:col-span-2 grid gap-2">
              <FileInput
                ref={fileRef}
                label={t.contact.files.label}
                description={t.contact.files.hint}
                placeholder={t.contact.files.placeholder}
                isMultiple
                value={files}
                onChange={(v) => chooseFiles(Array.isArray(v) ? v : v ? [v] : [])}
                status={fileFailed ? { type: 'error' } : undefined}
                aria-describedby={fileFailed ? fileErrId : undefined}
                containerClassName={FIELD_LABEL}
                // Each file has its own 44 px remove button below; the 20 px clear-all "x" goes.
                controlClassName={`h-12 [&_.astryx-input-clear-button]:hidden ${FIELD_CONTROL}`}
              />
              {files.length > 0 && (
                <ul className="list-none m-0 p-0 flex flex-col gap-1 font-sans text-sm text-ink">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span
                        className={`break-all ${
                          fileProblem === 'badType' && !isAllowedExtension(extensionOf(f.name))
                            ? 'text-err'
                            : ''
                        }`}
                      >
                        {f.name} <span className="text-ink-mid">· {formatSize(f.size)}</span>
                      </span>
                      <Button
                        label={`${t.contact.files.remove}: ${f.name}`}
                        variant="ghost"
                        onClick={() => removeFile(i)}
                        className={`flex-none px-3 text-sm font-semibold ${LINE}`}
                      >
                        {t.contact.files.remove}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {fileFailed && (
                <p id={fileErrId} role="alert" className="m-0 font-sans text-sm text-err">
                  {fileProblem ? t.contact.files[fileProblem] : t.contact.files.rejected}
                </p>
              )}
            </div>

            <div className="min-[721px]:col-span-2 mt-1">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <p className="m-0 max-w-[440px] font-sans text-[13px] leading-5 text-ink-mid">
                  {t.contact.kvkk.before}
                  {/* A 44 px tall hit area that does not change the line box. */}
                  <a
                    href="/kvkk"
                    className="inline-block -my-3 py-3 min-w-11 font-semibold text-brand underline underline-offset-2"
                  >
                    {t.contact.kvkk.link}
                  </a>
                  {t.contact.kvkk.after}
                </p>
                {/* Not disabled while sending: it keeps its colours and keyboard focus; onSubmit
                    blocks a second send. */}
                <Button
                  type="submit"
                  label={sending ? t.contact.sending : t.contact.submit}
                  variant="primary"
                  size="lg"
                  aria-disabled={sending || undefined}
                  aria-busy={sending || undefined}
                  className={`${ACTION} w-full min-[721px]:w-auto min-[721px]:min-w-[180px]`}
                />
              </div>
              {/* Always in the page, empty until there is a result, so screen readers announce it. */}
              <div aria-live="polite">
                {state === 'success' && (
                  <p className="m-0 mt-4 font-sans text-base font-semibold text-ok">
                    {t.contact.success}
                  </p>
                )}
                {state === 'error' && (
                  <p className="m-0 mt-4 px-3.5 py-3 border border-err rounded-[4px] font-sans text-base font-semibold text-ink">
                    {t.contact.error}
                  </p>
                )}
              </div>
            </div>
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

interface ContactFieldProps {
  label: string;
  name: FieldName;
  type?: 'text' | 'email' | 'tel';
  required?: boolean;
  /** The required mark ("*", from the dict). */
  mark: string;
  maxLength?: number;
  value: string;
  onChange: (value: string) => void;
  /** Translated message under the field; the field turns red while it is set. */
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
}

function ContactField({
  label,
  name,
  type = 'text',
  required,
  mark,
  maxLength,
  value,
  onChange,
  error,
  inputRef,
}: ContactFieldProps) {
  const errorId = useId();
  return (
    <div className="grid gap-1.5 content-start">
      <TextInput
        ref={inputRef}
        // The form's "*" mark, not Astryx's isRequired word; `required` tells assistive technology.
        label={required ? `${label} ${mark}` : label}
        type={type}
        size="lg"
        htmlName={name}
        autoComplete={AUTOCOMPLETE[name]}
        value={value}
        onChange={onChange}
        status={error ? { type: 'error' } : undefined}
        aria-describedby={error ? errorId : undefined}
        containerClassName={FIELD_LABEL}
        controlClassName={`h-12 ${FIELD_CONTROL}`}
        // No TextInput prop for these two; they reach the <input> as they are.
        {...{ required, maxLength }}
      />
      {error && (
        <p id={errorId} className="m-0 font-sans text-sm text-err">
          {error}
        </p>
      )}
    </div>
  );
}
