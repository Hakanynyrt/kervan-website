import type { ReactNode } from 'react';
import { ORG_PHONE_E164 } from '@kervan/seo';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import type { Lang } from '../types';
import { FOCUS, whatsappHref } from './Layout';

/** Home / … / current page. `trail` is [label, neutral path] pairs before the current page. */
export function Breadcrumb({
  trail,
  current,
  lang,
  t,
}: {
  trail: [string, string][];
  current: string;
  lang: Lang;
  t: Dict;
}) {
  const items: [string, string][] = [[t.family.crumbHome, '/'], ...trail];
  return (
    <nav aria-label={t.family.crumbLabel} className="font-sans text-sm text-ink-mid">
      <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
        {items.map(([label, path]) => (
          <li key={path} className="flex gap-2">
            <a href={localePath(path, lang)} className={`hover:text-ink hover:underline ${FOCUS}`}>
              {label}
            </a>
            <span aria-hidden="true">/</span>
          </li>
        ))}
        <li aria-current="page" className="text-ink">
          {current}
        </li>
      </ol>
    </nav>
  );
}

/** A radio group drawn as square chips (keyboard: Tab into the group, arrows to choose). */
export function Chips<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-3 p-0 font-sans text-sm font-semibold text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={`cursor-pointer rounded-sm border px-4 py-2 font-sans text-sm font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand has-[:focus-visible]:outline-offset-2 ${
              o.value === value
                ? 'border-brand bg-brand text-white'
                : 'border-ink-soft bg-bg text-ink hover:bg-bg-warm'
            }`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export const QTY = ['1', '2', '5+'] as const;
export type Qty = (typeof QTY)[number];

/** "Model not listed / not sure": WhatsApp with a message to fill in. */
export function MissingModel({ t }: { t: Dict }) {
  return (
    <section className="mt-12 rounded-md border border-hair bg-bg-soft p-6 font-sans">
      <h2 className="m-0 text-lg font-bold text-ink">{t.missing.title}</h2>
      <p className="m-0 mt-2 max-w-3xl text-sm text-ink-mid">{t.missing.body}</p>
      <a
        href={whatsappHref(t.missing.text)}
        className={`mt-4 inline-block rounded-sm bg-whatsapp px-5 py-3 text-sm font-medium text-white ${FOCUS}`}
      >
        {t.missing.button}
      </a>
    </section>
  );
}

/** Phones only: quote and call buttons fixed at the bottom of the screen. */
export function StickyQuote({ text, t }: { text: string; t: Dict }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-hair bg-bg p-3 font-sans text-sm font-medium lg:hidden">
      <a
        href={whatsappHref(text)}
        className={`flex-1 rounded-sm bg-whatsapp px-4 py-3 text-center text-white ${FOCUS}`}
      >
        {t.family.whatsapp}
      </a>
      <a
        href={`tel:${ORG_PHONE_E164}`}
        className={`rounded-sm border border-ink-soft px-5 py-3 text-center text-ink ${FOCUS}`}
      >
        {t.nav.call}
      </a>
    </div>
  );
}

/** A 4:3 photo from public/photos (see lib/photos.ts). */
export function Photo({ base, alt, lazy = true }: { base: string; alt: string; lazy?: boolean }) {
  return (
    <img
      src={`${base}-sm.webp`}
      srcSet={`${base}-sm.webp 480w, ${base}-lg.webp 960w`}
      sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
      width={480}
      height={360}
      alt={alt}
      loading={lazy ? 'lazy' : undefined}
      decoding="async"
      className="block h-auto w-full rounded-md border border-hair bg-bg-warm"
    />
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="m-0 mt-5 font-sans text-3xl font-bold text-ink md:text-4xl">{children}</h1>;
}

/** Quality, shipping, payment and warranty lines, with the warranty scope below. */
export function Terms({ t }: { t: Dict }) {
  return (
    <section aria-labelledby="terms" className="font-sans text-sm">
      <h2 id="terms" className="m-0 text-base font-bold text-ink">
        {t.terms.title}
      </h2>
      <dl className="m-0 mt-2">
        {t.terms.rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-t border-hair py-2.5">
            <dt className="text-ink-mid">{k}</dt>
            <dd className="m-0 text-right text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="m-0 mt-2 text-xs text-ink-mid">{t.terms.note}</p>
    </section>
  );
}

/** "Images are for illustration" line under product pictures. */
export function ImgNote({ t, className = '' }: { t: Dict; className?: string }) {
  return <p className={`m-0 font-sans text-xs text-ink-mid ${className}`}>{t.imgNote}</p>;
}

/** OEM / original-quality line under a product title. */
export function OemLine({ t }: { t: Dict }) {
  return <p className="m-0 mt-2 font-sans text-base font-semibold text-ink">{t.oem}</p>;
}
