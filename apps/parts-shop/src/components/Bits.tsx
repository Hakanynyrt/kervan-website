import { useState, type ReactNode } from 'react';
import { ORG_PHONE_E164 } from '@kervan/seo';
import { MAX_QTY } from '../lib/cart';
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
                ? 'border-brand bg-brand text-on-brand'
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

/**
 * Quantity: − / number / + (product, part and cart pages). The field may be cleared while
 * typing; a valid number counts at once, anything else is settled on blur or Enter (1 …
 * MAX_QTY, with a note when it was capped).
 */
export function QtyStepper({
  id,
  value,
  onChange,
  label,
  t,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  /** Accessible name of the field (e.g. "Adet" or "Adet: Rammer E 68"). */
  label: string;
  t: Dict;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [capped, setCapped] = useState(false);
  const set = (n: number) => {
    setCapped(n > MAX_QTY);
    onChange(Math.max(1, Math.min(MAX_QTY, n)));
  };
  const commit = () => {
    if (draft === null) return;
    const n = parseInt(draft, 10);
    if (Number.isFinite(n) && n > 0) set(n);
    setDraft(null);
  };
  const btn = `inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-ink-soft bg-bg text-lg text-ink hover:bg-bg-warm disabled:cursor-default disabled:opacity-50 ${FOCUS}`;
  return (
    <div className="font-sans">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={t.qty.less}
          aria-controls={id}
          disabled={value <= 1}
          onClick={() => {
            setDraft(null);
            set(value - 1);
          }}
          className={btn}
        >
          <span aria-hidden="true">−</span>
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={draft ?? String(value)}
          aria-label={label}
          aria-describedby={capped ? `${id}-note` : undefined}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 5);
            setDraft(v);
            const n = parseInt(v, 10);
            if (n >= 1 && n <= MAX_QTY) {
              setCapped(false);
              onChange(n);
            }
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
          }}
          className={`h-11 w-16 rounded-sm border border-ink-soft bg-bg text-center text-base text-ink tabular-nums ${FOCUS}`}
        />
        <button
          type="button"
          aria-label={t.qty.more}
          aria-controls={id}
          disabled={value >= MAX_QTY}
          onClick={() => {
            setDraft(null);
            set(value + 1);
          }}
          className={btn}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
      {capped && (
        <p id={`${id}-note`} role="status" className="m-0 mt-1 text-xs text-ink-mid">
          {t.qty.clamped(MAX_QTY)}
        </p>
      )}
    </div>
  );
}

/** "Model not listed / not sure": WhatsApp with a message to fill in (the query when given). */
export function MissingModel({
  t,
  query = '',
  className = 'mt-12',
}: {
  t: Dict;
  query?: string;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-hair bg-bg-soft p-6 font-sans ${className}`}>
      <h2 className="m-0 text-lg font-bold text-ink">{t.missing.title}</h2>
      <p className="m-0 mt-2 max-w-3xl text-sm text-ink-mid">{t.missing.body}</p>
      <a
        href={whatsappHref(query ? t.missing.textFor(query) : t.missing.text)}
        className={`mt-4 inline-block rounded-sm bg-whatsapp px-5 py-3 text-sm font-medium text-white ${FOCUS}`}
      >
        {t.missing.button}
      </a>
    </section>
  );
}

/** Phones only: quote and call buttons fixed at the bottom of the screen. */
export function StickyQuote({ text, label, t }: { text: string; label?: string; t: Dict }) {
  return (
    <div
      data-sticky-bar
      className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-hair bg-bg p-3 font-sans text-sm font-medium lg:hidden"
    >
      <a
        href={whatsappHref(text)}
        className={`flex-1 rounded-sm bg-whatsapp px-4 py-3 text-center text-white ${FOCUS}`}
      >
        {label ?? t.family.whatsapp}
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
export function Photo({
  base,
  alt,
  lazy = true,
  single = false,
}: {
  base: string;
  alt: string;
  lazy?: boolean;
  /** A part render: published in one size only (`-lg`), to keep the deployment under Pages' file limit. */
  single?: boolean;
}) {
  return (
    <img
      src={`${base}-${single ? 'lg' : 'sm'}.webp`}
      srcSet={single ? undefined : `${base}-sm.webp 480w, ${base}-lg.webp 960w`}
      sizes={single ? undefined : '(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw'}
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

/** Line under product pictures: tip renders are illustrations, part renders come from our drawings. */
export function ImgNote({
  t,
  kind = 'tip',
  className = '',
}: {
  t: Dict;
  kind?: 'tip' | 'render' | 'photo' | 'kit';
  className?: string;
}) {
  return (
    <p className={`m-0 font-sans text-xs text-ink-mid ${className}`}>
      {kind === 'render'
        ? t.renderNote
        : kind === 'kit'
          ? t.parts.kit.renderNote
          : kind === 'photo'
            ? t.photoNote
            : t.imgNote}
    </p>
  );
}

/** OEM / original-quality line under a product title. */
/** Repair kits are put together for the breaker, not made by us: their own line (`kit`). */
export function OemLine({ t, kit = false }: { t: Dict; kit?: boolean }) {
  return (
    <p className="m-0 mt-2 font-sans text-base font-semibold text-ink">
      {kit ? t.parts.kit.oem : t.oem}
    </p>
  );
}

/** 16:9 showcase picture (`<base>-lg.webp`, 1600 px, the only size published) on the dark stage. */
export function HeroImg({
  base,
  alt,
  className = '',
  lazy = false,
}: {
  base: string;
  alt: string;
  className?: string;
  /** Below the first screen: let the browser defer it. */
  lazy?: boolean;
}) {
  return (
    <img
      src={`${base}-lg.webp`}
      loading={lazy ? 'lazy' : undefined}
      width={1600}
      height={900}
      alt={alt}
      decoding="async"
      className={`block h-auto w-full rounded-md border border-hair bg-stage ${className}`}
    />
  );
}
